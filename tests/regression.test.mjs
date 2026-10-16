import test from "node:test";
import assert from "node:assert/strict";

const callbacks = new Map();
globalThis.Hooks = {
  on(name, fn) { const list = callbacks.get(name) ?? []; list.push(fn); callbacks.set(name, list); return fn; },
  off() {},
  callAll(name, ...args) { for (const fn of callbacks.get(name) ?? []) fn(...args); }
};
const decode = html => html.replace(/<[^>]*>/g, "").replace(/&(amp|lt|gt|quot|#39);/g,
  (_, entity) => ({amp:"&",lt:"<",gt:">",quot:'"',"#39":"'"})[entity]);
globalThis.document = {
  activeElement: null,
  createElement() { return { innerHTML: "", get textContent() { return decode(this.innerHTML); } }; }
};
const MODULE_ID = "darkmantles-codex";
const settings = new Map();
const journals = [];
const gm = { id: "gm", isGM: true };
globalThis.game = {
  user: gm, users: { activeGM: gm }, ready: true,
  journal: journals, system: { id: "pf2e" },
  i18n: { localize: x => x, format: x => x },
  settings: { get: (ns, key) => settings.get(`${ns}.${key}`),
    set: async (ns, key, value) => { settings.set(`${ns}.${key}`, structuredClone(value)); },
    storage: new Map([["world", []]]) }
};
globalThis.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { NONE: 0 } };
let nextId = 0;
const createdEditors = [];
class BaseApp {
  async _prepareContext() { return {}; }
  render() { this.renderCount = (this.renderCount ?? 0) + 1; return Promise.resolve(this); }
  _onRender() {}
}
globalThis.foundry = {
  utils: { deepClone: structuredClone, randomID: () => String(++nextId) },
  documents: { JournalEntry: { create: async (data, options) => {
    const journal = { ...data, pack: options?.pack, documentName: "JournalEntry", getFlag: (ns, key) => data.flags?.[ns]?.[key] };
    journal.pages = data.pages.map(raw => ({ ...raw, parent: journal, documentName: "JournalEntryPage",
      update: async function(update) { this.text.content = update["text.content"]; Hooks.callAll("updateJournalEntryPage", this); }
    }));
    journals.push(journal);
    return journal;
  } }, collections: { CompendiumCollection: { createCompendium: async () => {
    const pack = {collection:"world.darkmantles-codex-private", ownership:{},
      configure:async function(config){this.ownership=config.ownership;},
      getDocuments:async()=>journals};
    game.packs.set(pack.collection,pack);
    return pack;
  } }, Journal: { showDialog: async doc => { globalThis.sharedDocument = doc; } } } },
  applications: {
    api: { ApplicationV2: BaseApp, HandlebarsApplicationMixin: base => base, DialogV2: {} },
    elements: { HTMLProseMirrorElement: { create: config => {
      createdEditors.push(config);
      return { ...config, addEventListener() {}, querySelector: () => ({textContent:"draft", dataset:{}, focus(){}}) };
    } } },
    ux: { TextEditor: { enrichHTML: async html => html }, DragDrop: class { bind() {} } }
  }
};
globalThis.CONFIG = { statusEffects: [], ux: {} };
globalThis.ui = { notifications: { error: message => { throw new Error(message); }, warn() {} } };
const privateData = await import("../scripts/private-data.mjs");
const glossary = await import("../scripts/glossary.mjs");
const { escapeHTML } = await import("../scripts/html.mjs");
const { findConditionsPack, getSystemConditions, clearConditionCache } = await import("../scripts/reference/system-conditions.mjs");
const { GMScreenApp } = await import("../scripts/apps/gm-screen.mjs");

function reset() {
  settings.clear(); journals.length = 0; nextId = 0; game.user = gm; game.packs = new Map();
  game.users.activeGM = gm; game.system.id = "dnd5e";
}

// These tests intentionally share Foundry globals and run sequentially.
test("private migration preserves secrets but publishes only player fields; retries are idempotent", async () => {
  reset();
  const source = { folders: [{id:"f",name:"Secret cult",parent:null}], entries: [
    {id:"1",term:"Blacksmith",aliases:["Smith"],gmTip:"Cult leader",playerTip:"Local smith",link:"Actor.x",folder:"f"},
    {id:"2",term:"Secret hideout",gmTip:"Under the inn",playerTip:""}
  ] };
  settings.set(`${MODULE_ID}.glossary`, source);
  settings.set(`${MODULE_ID}.sessionNotes`, "<p>GM secret</p>");
  const legacy = { key:"gm-tools.sessionNotes", value:'"GM secret"', update:async function(data){this.value=data.value;} };
  game.settings.storage.set("world", [legacy]);
  await privateData.initializePrivateData();
  assert.deepEqual(privateData.readPrivateGlossary(), source);
  assert.equal(privateData.readSessionNotes(), "<p>GM secret</p>");
  const publicData = settings.get(`${MODULE_ID}.glossary`);
  assert.equal(publicData.entries.length, 1);
  assert.deepEqual(publicData.folders, []);
  assert.equal(JSON.stringify(publicData).includes("Cult leader"), false);
  assert.equal(JSON.stringify(publicData).includes("Secret hideout"), false);
  assert.equal(settings.get(`${MODULE_ID}.sessionNotes`), "");
  assert.equal(legacy.value, '""');
  assert.deepEqual(journals[0].ownership, {default:0});
  assert.equal(journals[0].pack, "world.darkmantles-codex-private");
  assert.equal(game.packs.get(journals[0].pack).ownership.PLAYER, "NONE");
  assert.equal(game.packs.get(journals[0].pack).ownership.TRUSTED, "NONE");
  assert.ok(journals[0].pages.every(p => p.ownership.default === 0));
  await privateData.initializePrivateData();
  assert.equal(journals.length, 1);
  game.user = {id:"player",isGM:false};
  assert.deepEqual(privateData.readPrivateGlossary(), {folders:[],entries:[]});
  assert.equal(privateData.readSessionNotes(), "");
  assert.deepEqual(glossary.getEntries(), publicData.entries);
  await assert.rejects(privateData.writeSessionNotes("not allowed"), /Only a GM/);
});

test("failed private creation leaves legacy content untouched", async () => {
  reset();
  settings.set(`${MODULE_ID}.glossary`, {entries:[{term:"Secret",gmTip:"Hidden"}]});
  settings.set(`${MODULE_ID}.sessionNotes`, "notes");
  const create = foundry.documents.JournalEntry.create;
  foundry.documents.JournalEntry.create = async () => { throw Error("disk failure"); };
  try { await assert.rejects(privateData.initializePrivateData(), /disk failure/); }
  finally { foundry.documents.JournalEntry.create = create; }
  assert.equal(settings.get(`${MODULE_ID}.sessionNotes`), "notes");
  assert.equal(settings.get(`${MODULE_ID}.glossary`).entries[0].gmTip, "Hidden");
});

test("nested folders and duplicate leaf names survive a JSON round trip", async () => {
  reset(); await privateData.initializePrivateData();
  await glossary.saveGlossary({ folders:[
    {id:"a",name:"World",parent:null},{id:"b",name:"City",parent:"a"},
    {id:"c",name:"Businesses",parent:"b"},{id:"d",name:"Other World",parent:null},
    {id:"e",name:"City",parent:"d"}
  ], entries:[{id:"i",term:"Inn",gmTip:"Unicode — 店",folder:"c"},{id:"j",term:"Shop",folder:"e"}] });
  const portable = JSON.parse(JSON.stringify(glossary.toPortable()));
  await glossary.importGlossary(portable, "replace");
  const result = glossary.getGlossary();
  assert.equal(result.folders.length, 5);
  const path = entry => { const names=[]; for(let id=entry.folder;id;){const f=result.folders.find(f=>f.id===id);names.unshift(f.name);id=f.parent;}return names.join("/"); };
  assert.equal(path(result.entries.find(e=>e.term==="Inn")), "World/City/Businesses");
  assert.equal(path(result.entries.find(e=>e.term==="Shop")), "Other World/City");
  await glossary.importGlossary(portable, "merge");
  assert.equal(glossary.getFolders().length, 5);
});

test("legacy imports retain nested folders; malformed cycles do not overwrite data", async () => {
  reset(); await privateData.initializePrivateData();
  await glossary.importGlossary({folders:[{name:"Rules",parent:null},{name:"Magic",parent:"Rules"}],entries:[{term:"Spell",folder:"Magic"}]});
  const before = glossary.getGlossary();
  const magic = before.folders.find(f=>f.name==="Magic");
  assert.equal(before.entries[0].folder, magic.id);
  assert.equal(before.folders.find(f=>f.id===magic.parent).name, "Rules");
  await assert.rejects(glossary.importGlossary({version:2,folders:[{id:"a",name:"A",parent:"b"},{id:"b",name:"B",parent:"a"}],entries:[]},"replace"), /cycle/);
  assert.deepEqual(glossary.getGlossary(), before);
});

test("HTML escaping protects quoted input values and markup", () => {
  assert.equal(escapeHTML(`The "Silver" Dragon & <Inn>`), "The &quot;Silver&quot; Dragon &amp; &lt;Inn&gt;");
  assert.equal(escapeHTML(`' onfocus="alert(1)"`), "&#39; onfocus=&quot;alert(1)&quot;");
});

test("condition discovery excludes module and foreign-system packs", async () => {
  const pack = (name, packageType, packageName, type="condition") => ({metadata:{type:"Item",name:"conditions",label:"Conditions",packageType,packageName},collection:name,
    getDocuments:async()=>[{type,name:"Correct condition",uuid:"Item.test",system:{description:{value:"Reminder"}}}]});
  game.system.id="sf2e";
  const packs=[pack("bad.conditions","module","bad"),pack("pf2e.conditionitems","system","pf2e"),pack("sf2e.conditions","system","sf2e")];
  packs.get=id=>packs.find(p=>p.collection===id);game.packs=packs;
  assert.equal(findConditionsPack(),packs[2]);
  packs.pop(); assert.equal(findConditionsPack(),null);
  packs.push(pack("sf2e.conditions","system","sf2e","equipment"));
  CONFIG.statusEffects=[{id:"fallback",name:"Registry condition"}];
  clearConditionCache();
  assert.equal((await getSystemConditions())[0].name,"Registry condition");
});

test("local note appends are serialized without losing an earlier note", async () => {
  reset();await privateData.initializePrivateData();
  await Promise.all([privateData.appendSessionNote("<p>one</p>"),privateData.appendSessionNote("<p>two</p>")]);
  assert.equal(privateData.readSessionNotes(),"<hr><p>one</p><hr><p>two</p>");
});

test("sharing sends the selected page to the native dialog and blocks private storage", async () => {
  const app=new GMScreenApp();
  const target={closest: selector => selector==="[data-uuid]" ? {dataset:{uuid:"page"}} : null};
  const page={documentName:"JournalEntryPage",type:"text",getFlag:()=>false};
  globalThis.fromUuid=async()=>page;
  await GMScreenApp.DEFAULT_OPTIONS.actions.showPlayers.call(app,null,target);
  assert.equal(globalThis.sharedDocument,page);
  globalThis.sharedDocument=null;
  page.parent={getFlag:()=>true};
  const error=console.error;console.error=()=>{};
  try{await GMScreenApp.DEFAULT_OPTIONS.actions.showPlayers.call(app,null,target);}finally{console.error=error;}
  assert.equal(globalThis.sharedDocument,null);
});

test("unfocused drafts survive rerenders and Cancel leaves saved notes untouched", async () => {
  reset(); await privateData.initializePrivateData();await privateData.writeSessionNotes("<p>saved</p>");
  const app=new GMScreenApp();
  const draft={value:"<ul><li>unsent</li></ul>"};
  const wrap={classList:{contains:()=>false,toggle:()=>false},dataset:{},contains:()=>false,querySelector:()=>null,append(){}};
  const classes=()=>({classList:{toggle(){}}});
  app.element={querySelector:selector=>selector.includes("gm-tools-quicknote")?draft:selector===".gm-notes-quickadd"?wrap:null,
    querySelectorAll:()=>[],removeEventListener(){},addEventListener(){}};
  settings.set(`${MODULE_ID}.screenData`,{tabs:[]});
  settings.set(`${MODULE_ID}.rulesVersion`,"2024");
  await app._prepareContext({});
  app._onRender({},{});
  assert.equal(createdEditors.at(-1).value,draft.value);
  app.refresh();assert.equal(app.renderCount,1);
  GMScreenApp.DEFAULT_OPTIONS.actions.editNotes.call(app);
  app.refresh();assert.equal(app.renderCount,2);
  GMScreenApp.DEFAULT_OPTIONS.actions.cancelNotes.call(app);
  assert.equal(privateData.readSessionNotes(),"<p>saved</p>");
});

test("missing private pages abort cleanup instead of discarding legacy content", async () => {
  reset();await privateData.initializePrivateData();
  journals[0].pages=journals[0].pages.filter(p=>p.name!=="Glossary data");
  settings.set(`${MODULE_ID}.sessionNotes`,"legacy backup");
  await assert.rejects(privateData.initializePrivateData(),/page is missing/);
  assert.equal(settings.get(`${MODULE_ID}.sessionNotes`),"legacy backup");
});
