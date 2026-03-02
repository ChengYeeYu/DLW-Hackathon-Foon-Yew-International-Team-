const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_COLOR_MODE = "system";
const DEFAULT_BACKGROUND_PALETTE = "sky";

const apiKeyInput = document.getElementById("apiKeyInput");
const modelInput = document.getElementById("modelInput");
const colorModeSelect = document.getElementById("colorModeSelect");
const feedbackToEmailInput = document.getElementById("feedbackToEmailInput");
const feedbackFromInput = document.getElementById("feedbackFromInput");
const feedbackMessageInput = document.getElementById("feedbackMessageInput");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const saveAppearanceBtn = document.getElementById("saveAppearanceBtn");
const sendFeedbackBtn = document.getElementById("sendFeedbackBtn");
const statusEl = document.getElementById("status");

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = type ? `status ${type}` : "status";
}

function normalizeColorMode(value) {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : DEFAULT_COLOR_MODE;
}

function normalizeBackgroundPalette(value) {
  return ["sky", "mint", "lavender", "peach", "sand"].includes(value)
    ? value
    : DEFAULT_BACKGROUND_PALETTE;
}

function getSelectedPalette() {
  const selected = document.querySelector('input[name="backgroundPalette"]:checked');
  return normalizeBackgroundPalette(selected?.value);
}

function setSelectedPalette(value) {
  const normalized = normalizeBackgroundPalette(value);
  const target = document.querySelector(`input[name="backgroundPalette"][value="${normalized}"]`);
  if (target) {
    target.checked = true;
  }
}

function getAppearanceSettingsFromUi() {
  const colorMode = normalizeColorMode(colorModeSelect?.value || DEFAULT_COLOR_MODE);
  const backgroundPalette = getSelectedPalette();
  const feedbackToEmail = feedbackToEmailInput?.value.trim() || "";
  return { colorMode, backgroundPalette, feedbackToEmail };
}

async function loadSettings() {
  const {
    openaiApiKey = "",
    model = DEFAULT_MODEL,
    colorMode = DEFAULT_COLOR_MODE,
    backgroundPalette = DEFAULT_BACKGROUND_PALETTE,
    feedbackToEmail = ""
  } = await chrome.storage.local.get([
    "openaiApiKey",
    "model",
    "colorMode",
    "backgroundPalette",
    "feedbackToEmail"
  ]);

  apiKeyInput.value = openaiApiKey;
  modelInput.value = model;
  colorModeSelect.value = normalizeColorMode(colorMode);
  setSelectedPalette(backgroundPalette);
  feedbackToEmailInput.value = feedbackToEmail;
}

async function saveApiSettings() {
  const openaiApiKey = apiKeyInput.value.trim();
  const model = modelInput.value.trim() || DEFAULT_MODEL;
  await chrome.storage.local.set({ openaiApiKey, model });
  setStatus("API settings saved.", "success");
}

async function saveAppearanceAndFeedbackSettings() {
  const { colorMode, backgroundPalette, feedbackToEmail } = getAppearanceSettingsFromUi();
  await chrome.storage.local.set({ colorMode, backgroundPalette, feedbackToEmail });
  setStatus("Appearance and feedback settings saved.", "success");
}

async function saveAllSettings() {
  const openaiApiKey = apiKeyInput.value.trim();
  const model = modelInput.value.trim() || DEFAULT_MODEL;
  const { colorMode, backgroundPalette, feedbackToEmail } = getAppearanceSettingsFromUi();
  await chrome.storage.local.set({
    openaiApiKey,
    model,
    colorMode,
    backgroundPalette,
    feedbackToEmail
  });
  setStatus("Settings saved.", "success");
}

async function clearKey() {
  apiKeyInput.value = "";
  await chrome.storage.local.set({ openaiApiKey: "" });
  setStatus("API key cleared.", "success");
}

function sendFeedbackEmail() {
  const receiver = feedbackToEmailInput.value.trim();
  const sender = feedbackFromInput.value.trim();
  const message = feedbackMessageInput.value.trim();

  if (!receiver) {
    setStatus("Set your feedback email first (Receive feedback at).", "error");
    return;
  }
  if (!message) {
    setStatus("Write a feedback message before sending.", "error");
    return;
  }

  const subject = encodeURIComponent("LockedIn Buddy User Feedback");
  const bodyLines = [
    `Date: ${new Date().toLocaleString()}`,
    sender ? `From: ${sender}` : "From: (not provided)",
    "",
    message
  ];
  const body = encodeURIComponent(bodyLines.join("\n"));
  window.location.href = `mailto:${receiver}?subject=${subject}&body=${body}`;
  setStatus("Opened your mail app with a feedback draft.", "success");
}

saveBtn.addEventListener("click", () => {
  saveAllSettings().catch(() => setStatus("Failed to save settings.", "error"));
});

clearBtn.addEventListener("click", () => {
  clearKey().catch(() => setStatus("Failed to clear API key.", "error"));
});

saveAppearanceBtn.addEventListener("click", () => {
  saveAppearanceAndFeedbackSettings().catch(() =>
    setStatus("Failed to save appearance/feedback settings.", "error")
  );
});

sendFeedbackBtn.addEventListener("click", () => {
  sendFeedbackEmail();
});

colorModeSelect.addEventListener("change", () => {
  saveAppearanceAndFeedbackSettings().catch(() => {});
});

document.querySelectorAll('input[name="backgroundPalette"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    saveAppearanceAndFeedbackSettings().catch(() => {});
  });
});

feedbackToEmailInput.addEventListener("blur", () => {
  saveAppearanceAndFeedbackSettings().catch(() => {});
});

modelInput.addEventListener("blur", () => {
  saveApiSettings().catch(() => {});
});

loadSettings().catch(() => setStatus("Failed to load settings.", "error"));
