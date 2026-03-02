const MIN_SELECTION_CHARS = 10;
const MAX_SELECTION_CHARS = 2600;
const MAX_CONTEXT_CHARS = 1400;
const DEBOUNCE_MS = 220;

let selectionTimer = null;
let lastSelectionSignature = "";
const runtimeApi =
  (typeof chrome !== "undefined" && chrome.runtime) ||
  (typeof browser !== "undefined" && browser.runtime) ||
  null;

function sendSelectionUpdate(payload) {
  if (!runtimeApi || typeof runtimeApi.sendMessage !== "function") {
    return;
  }

  try {
    const maybePromise = runtimeApi.sendMessage({
      type: "SELECTION_UPDATED",
      payload
    });
    if (maybePromise && typeof maybePromise.catch === "function") {
      maybePromise.catch(() => {});
    }
  } catch (_) {
    // Ignore messaging failures in restricted or invalidated extension contexts.
  }
}

function scheduleSelectionCapture() {
  clearTimeout(selectionTimer);
  selectionTimer = setTimeout(captureAndSendSelection, DEBOUNCE_MS);
}

function captureAndSendSelection() {
  const payload = buildSelectionPayload();
  if (!payload) {
    if (!lastSelectionSignature) {
      return;
    }

    lastSelectionSignature = "";
    sendSelectionUpdate(null);
    return;
  }

  const signature = payload ? payload.text : "";

  if (signature === lastSelectionSignature) {
    return;
  }
  lastSelectionSignature = signature;

  sendSelectionUpdate(payload);
}

function buildSelectionPayload() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const text = selection.toString().replace(/\s+/g, " ").trim();
  if (text.length < MIN_SELECTION_CHARS) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const contextRoot = getContextRootFromRange(range);
  const contextSource = (contextRoot?.innerText || document.body?.innerText || "")
    .replace(/\s+/g, " ")
    .trim();

  const clippedText = text.slice(0, MAX_SELECTION_CHARS);
  const context = extractContextSnippet(contextSource, clippedText).slice(0, MAX_CONTEXT_CHARS);

  return {
    text: clippedText,
    context,
    url: window.location.href,
    title: document.title,
    capturedAt: new Date().toISOString()
  };
}

function getContextRootFromRange(range) {
  const node = range.commonAncestorContainer;
  if (!node) {
    return document.body;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return node.parentElement || document.body;
  }

  return node;
}

function extractContextSnippet(contextSource, selectedText) {
  if (!contextSource) {
    return "";
  }

  const pivot = selectedText.slice(0, Math.min(40, selectedText.length));
  const pivotIndex = contextSource.indexOf(pivot);
  if (pivotIndex < 0) {
    return contextSource.slice(0, MAX_CONTEXT_CHARS);
  }

  const radius = 350;
  const start = Math.max(0, pivotIndex - radius);
  const end = Math.min(contextSource.length, pivotIndex + selectedText.length + radius);
  return contextSource.slice(start, end);
}

document.addEventListener("selectionchange", scheduleSelectionCapture, true);
document.addEventListener("mouseup", scheduleSelectionCapture, true);
document.addEventListener("keyup", scheduleSelectionCapture, true);
