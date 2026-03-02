const latestSelectionByTab = {};

async function enablePanelOnActionClick() {
  if (!chrome.sidePanel?.setPanelBehavior) {
    return;
  }

  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error("Failed to set side panel behavior:", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  enablePanelOnActionClick();
});

chrome.runtime.onStartup.addListener(() => {
  enablePanelOnActionClick();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return;
  }

  if (message.type === "SELECTION_UPDATED") {
    const tabId = sender?.tab?.id;
    if (typeof tabId === "number") {
      const normalized = normalizeSelectionPayload(message.payload);
      if (normalized) {
        latestSelectionByTab[tabId] = normalized;
      } else {
        delete latestSelectionByTab[tabId];
      }

      chrome.runtime
        .sendMessage({
          type: "SELECTION_UPDATED_FOR_UI",
          payload: {
            tabId,
            selection: latestSelectionByTab[tabId] || null
          }
        })
        .catch(() => {});
    }

    sendResponse({ ok: true });
    return;
  }

  if (message.type === "SELECTION_UPDATED_FROM_UI") {
    const tabId = Number(message.tabId);
    if (Number.isFinite(tabId)) {
      const normalized = normalizeSelectionPayload(message.payload);
      if (normalized) {
        latestSelectionByTab[tabId] = normalized;
      } else {
        delete latestSelectionByTab[tabId];
      }
    }
    sendResponse({ ok: true });
    return;
  }

  if (message.type === "GET_SELECTION_FOR_TAB") {
    const tabId = Number(message.tabId);
    if (!Number.isFinite(tabId)) {
      sendResponse({ selection: null });
      return;
    }

    sendResponse({ selection: latestSelectionByTab[tabId] || null });
  }
});

function normalizeSelectionPayload(payload) {
  if (!payload || typeof payload.text !== "string") {
    return null;
  }

  const text = payload.text.trim();
  if (text.length < 10) {
    return null;
  }

  return {
    text: text.slice(0, 2600),
    context: typeof payload.context === "string" ? payload.context.slice(0, 1400) : "",
    title: typeof payload.title === "string" ? payload.title : "",
    url: typeof payload.url === "string" ? payload.url : "",
    capturedAt: typeof payload.capturedAt === "string" ? payload.capturedAt : ""
  };
}
