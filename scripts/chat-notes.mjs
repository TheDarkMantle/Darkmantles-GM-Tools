import { appendSessionNote } from "./private-data.mjs";
import { MODULE_ID } from "./constants.mjs";

/**
 * "Private to Session Notes": an extra button beside the chat message-mode
 * buttons (GM only, when Session Notes is enabled). While it is on, plain chat
 * messages are appended to the session notes instead of being posted, so they
 * never reach the chat log. Slash commands (/r, /w, ...) still post normally.
 *
 * This is deliberately NOT a CONFIG.ChatMessage.modes entry: core saves the
 * chosen mode in its own client setting, and a saved mode that no longer exists
 * (Codex disabled) breaks chat for that user. The toggle lives in memory only
 * and resets on reload.
 */
let notesMode = false;
const BUTTON_CLASS = "gm-tools-chat-notes-mode";

export function isChatNotesAvailable() {
  return !!game.user?.isGM && !!game.settings.get(MODULE_ID, "sessionNotesEnabled");
}

export function isChatNotesMode() {
  return notesMode && isChatNotesAvailable();
}

const modeButtons = () => document.getElementById("message-modes") ?? document.getElementById("roll-privacy");

/** Restore core's own pressed state for its mode buttons (v14 / v13 method names). */
function updateCoreButtons() {
  if (typeof ui.chat?._updateMessageMode === "function") ui.chat._updateMessageMode();
  else if (typeof ui.chat?._updateRollMode === "function") ui.chat._updateRollMode();
}

let placeholder = null;
function syncDisplay() {
  const container = modeButtons();
  const ours = container?.querySelector(`.${BUTTON_CLASS}`);
  const on = isChatNotesMode();
  if (ours) ours.ariaPressed = `${on}`;
  if (on) for (const b of container?.querySelectorAll("button[data-mode]") ?? []) b.ariaPressed = "false";
  else updateCoreButtons();

  const input = document.getElementById("chat-message");
  if (!input) return;
  placeholder ??= input.style.getPropertyValue("--chat-message-placeholder");
  if (on) {
    const text = game.i18n.localize("GMTOOLS.Chat.NotesPlaceholder").replace(/'/g, "\\'");
    input.style.setProperty("--chat-message-placeholder", `'${text}'`);
  } else if (placeholder) {
    input.style.setProperty("--chat-message-placeholder", placeholder);
  }
}

export function setChatNotesMode(on) {
  notesMode = !!on;
  syncDisplay();
}

/** Add (or remove) our button. Called from renderChatInput and when the setting changes. */
export function injectChatNotesButton(container = modeButtons()) {
  if (!container) return;
  const existing = container.querySelector(`.${BUTTON_CLASS}`);
  if (!isChatNotesAvailable()) {
    existing?.remove();
    if (notesMode) setChatNotesMode(false);
    return;
  }
  if (!existing) {
    const label = game.i18n.localize("GMTOOLS.Chat.NotesMode");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `ui-control icon fa-solid fa-feather-pointed ${BUTTON_CLASS}`;
    btn.dataset.tooltip = label;
    btn.setAttribute("aria-label", label);
    btn.ariaPressed = "false";
    // No data-action / data-mode, so core's handlers ignore this button.
    btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (event.pointerId !== -1) btn.blur();
      setChatNotesMode(!notesMode);
    });
    container.append(btn);
    // Picking any core mode turns ours off.
    container.addEventListener("click", event => {
      if (event.target.closest?.("button[data-mode]") && notesMode) setChatNotesMode(false);
    });
  }
  syncDisplay();
}

/** Plain text of the chat input's HTML (same idea as ChatLog.parse). */
function plainText(html) {
  const div = document.createElement("div");
  div.innerHTML = html ?? "";
  return (div.textContent ?? "").trim();
}

/**
 * chatMessage hook: while notes mode is on, divert plain messages to the
 * session notes. Returning false stops the message; Foundry still clears the box.
 */
export function onChatMessage(chatLog, message) {
  if (!isChatNotesMode()) return true;
  const text = plainText(message);
  if (!text || text.startsWith("/")) return true; // commands and rolls post as usual
  const html = /^\s*</.test(message) ? message : `<p>${message}</p>`;
  appendSessionNote(html)
    .then(() => ui.notifications.info(game.i18n.localize("GMTOOLS.Chat.NoteAdded")))
    .catch(async err => {
      console.error(`${MODULE_ID} | Chat note failed`, err);
      ui.notifications.error(game.i18n.localize("GMTOOLS.Chat.NoteFailed"));
      // Don't lose the note: keep it as a message only this GM can see.
      await ChatMessage.implementation.create({ content: html, whisper: [game.user.id], speaker: { alias: "Session Notes" } });
    });
  return false;
}
