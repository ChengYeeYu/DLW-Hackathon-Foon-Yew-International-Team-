const DEFAULT_MODEL = "gpt-5-mini";
const MAX_SOURCE_CHARS = 16000;
const SUMMARY_MAX_OUTPUT_TOKENS = 1200;
const QUIZ_MAX_OUTPUT_TOKENS = 2200;
const QUIZ_FOLLOWUP_MAX_OUTPUT_TOKENS = 900;
const EXPLAIN_MAX_OUTPUT_TOKENS = 1000;
const MINDMAP_MAX_OUTPUT_TOKENS = 1400;
const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_EXPLAIN_MODE = "student";
const MIN_SELECTION_CHARS = 10;
const MAX_SELECTION_CHARS = 2600;
const AUTO_SELECTION_POLL_MS = 900;
const FOCUS_ANALYSIS_INTERVAL_MS = 1000;
const CONTINUOUS_REMINDER_INTERVAL_MS = 700;
const FALLBACK_FRAME_WIDTH = 96;
const FALLBACK_FRAME_HEIGHT = 72;
const DEFAULT_REASONING_EFFORT = "minimal";
const CAROUSEL_PAGE_KEY = "studybuddy_sidebar_page";
const ANALYTICS_STORAGE_KEY = "studybuddy_learning_analytics_v1";
const DEFAULT_COLOR_MODE = "system";
const DEFAULT_BACKGROUND_PALETTE = "sky";
const MAX_SOURCE_CHUNKS = 14;
const SOURCE_CHUNK_MAX_CHARS = 760;
const MIN_FOCUS_MINUTES = 0.5;
const MAX_FOCUS_MINUTES = 240;
const DEFAULT_REST_MINUTES = 5;
const MIN_REST_MINUTES = 0.5;
const MAX_REST_MINUTES = 120;
const DEFAULT_CYCLE_COUNT = 4;
const MAX_CYCLE_COUNT = 24;

const summarizeBtn = document.getElementById("summarizeBtn");
const quizBtn = document.getElementById("quizBtn");
const mindmapBtn = document.getElementById("mindmapBtn");
const summarizeHighlightedBtn = document.getElementById("summarizeHighlightedBtn");
const quizHighlightedBtn = document.getElementById("quizHighlightedBtn");
const mindmapHighlightedBtn = document.getElementById("mindmapHighlightedBtn");
const clearBtn = document.getElementById("clearBtn");
const clearHighlightedBtn = document.getElementById("clearHighlightedBtn");
const openOptionsBtn = document.getElementById("openOptionsBtn");
const explainSelectionBtn = document.getElementById("explainSelectionBtn");
const selectionPromptInput = document.getElementById("selectionPromptInput");
const explainModeSelect = document.getElementById("explainModeSelect");
const selectionPreviewEl = document.getElementById("selectionPreview");
const selectionHintEl = document.getElementById("selectionHint");
const selectionBoxEl = document.getElementById("selectionBox");
const selectionPromptAreaEl = document.getElementById("selectionPromptArea");
const topControlsEl = document.getElementById("topControls");
const carouselTrackEl = document.getElementById("carouselTrack");
const carouselPrevBtn = document.getElementById("carouselPrevBtn");
const carouselNextBtn = document.getElementById("carouselNextBtn");
const carouselStudyBtn = document.getElementById("carouselStudyBtn");
const carouselFocusBtn = document.getElementById("carouselFocusBtn");
const carouselAnalyticsBtn = document.getElementById("carouselAnalyticsBtn");
const analyticsContentEl = document.getElementById("analyticsContent");
const resetAnalyticsBtn = document.getElementById("resetAnalyticsBtn");
const focusDurationInput = document.getElementById("focusDurationInput");
const reminderDelayInput = document.getElementById("reminderDelayInput");
const headTrackingToggle = document.getElementById("headTrackingToggle");
const cycleModeToggle = document.getElementById("cycleModeToggle");
const cycleConfigEl = document.getElementById("cycleConfig");
const restDurationInput = document.getElementById("restDurationInput");
const cycleCountInput = document.getElementById("cycleCountInput");
const startFocusBtn = document.getElementById("startFocusBtn");
const stopFocusBtn = document.getElementById("stopFocusBtn");
const focusTimerEl = document.getElementById("focusTimer");
const focusStateEl = document.getElementById("focusState");
const focusReminderBannerEl = document.getElementById("focusReminderBanner");
const focusVideoEl = document.getElementById("focusVideo");
const focusHintEl = document.getElementById("focusHint");
const focusDetectorStatusEl = document.getElementById("focusDetectorStatus");
const focusLastCheckEl = document.getElementById("focusLastCheck");
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const carouselPages = Array.from(document.querySelectorAll(".carousel-page"));
const darkModeQuery = window.matchMedia?.("(prefers-color-scheme: dark)") || null;
let latestSelection = null;
let selectionPollTimer = null;
let selectionPollInFlight = false;
let lastAutoSelectionSignature = "";
let focusTimerInterval = null;
let focusAnalysisInterval = null;
let focusSecondsRemaining = DEFAULT_FOCUS_MINUTES * 60;
let focusSessionActive = false;
let focusHeadTrackingEnabled = true;
let focusCycleModeEnabled = false;
let focusCurrentPhase = "focus";
let focusCurrentCycle = 1;
let focusTotalCycles = 1;
let focusConfiguredFocusSeconds = DEFAULT_FOCUS_MINUTES * 60;
let focusConfiguredRestSeconds = DEFAULT_REST_MINUTES * 60;
let focusDistractionSince = 0;
let focusFrameFocused = 0;
let focusFrameDistracted = 0;
let focusMediaStream = null;
let focusAudioCtx = null;
let focusContinuousReminderInterval = null;
let focusFallbackCanvas = null;
let focusFallbackCtx = null;
let focusFallbackPrevLuma = null;
let focusFallbackPresenceHoldUntil = 0;
let focusElapsedFocusSeconds = 0;
let currentCarouselPage = 0;
let analyticsState = createDefaultAnalyticsState();
let analyticsLoaded = false;
let analyticsWriteChain = Promise.resolve();

if (openOptionsBtn) {
  openOptionsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
}
if (clearBtn) {
  clearBtn.addEventListener("click", clearOutputPanel);
}
if (clearHighlightedBtn) {
  clearHighlightedBtn.addEventListener("click", clearOutputPanel);
}

if (summarizeBtn) {
  summarizeBtn.addEventListener("click", () => runFlow("summary"));
}
if (quizBtn) {
  quizBtn.addEventListener("click", () => runFlow("quiz"));
}
if (mindmapBtn) {
  mindmapBtn.addEventListener("click", () => runFlow("mindmap"));
}
if (summarizeHighlightedBtn) {
  summarizeHighlightedBtn.addEventListener("click", () => runFlow("summary"));
}
if (quizHighlightedBtn) {
  quizHighlightedBtn.addEventListener("click", () => runFlow("quiz"));
}
if (mindmapHighlightedBtn) {
  mindmapHighlightedBtn.addEventListener("click", () => runFlow("mindmap"));
}
if (explainSelectionBtn) {
  explainSelectionBtn.addEventListener("click", runSelectionExplainFlow);
}
if (startFocusBtn) {
  startFocusBtn.addEventListener("click", startFocusSession);
}
if (stopFocusBtn) {
  stopFocusBtn.addEventListener("click", () => stopFocusSession({ manual: true }));
}
if (cycleModeToggle) {
  cycleModeToggle.addEventListener("change", () => {
    updateCycleConfigVisibility();
  });
}
if (headTrackingToggle) {
  headTrackingToggle.addEventListener("change", () => {
    focusHeadTrackingEnabled = Boolean(headTrackingToggle.checked);
    updateHeadTrackingUi();
  });
}
if (carouselPrevBtn) {
  carouselPrevBtn.addEventListener("click", () => {
    setCarouselPage(currentCarouselPage - 1);
  });
}
if (carouselNextBtn) {
  carouselNextBtn.addEventListener("click", () => {
    setCarouselPage(currentCarouselPage + 1);
  });
}
if (carouselStudyBtn) {
  carouselStudyBtn.addEventListener("click", () => {
    setCarouselPage(0);
  });
}
if (carouselFocusBtn) {
  carouselFocusBtn.addEventListener("click", () => {
    setCarouselPage(1);
  });
}
if (carouselAnalyticsBtn) {
  carouselAnalyticsBtn.addEventListener("click", () => {
    setCarouselPage(2);
  });
}
if (darkModeQuery?.addEventListener) {
  darkModeQuery.addEventListener("change", () => {
    refreshAppearanceSettings().catch(() => {});
  });
}
if (chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }
    if (!changes.colorMode && !changes.backgroundPalette) {
      return;
    }
    refreshAppearanceSettings().catch(() => {});
  });
}
refreshAppearanceSettings().catch(() => {});
initCarouselUi();
initAnalyticsDashboard().catch(() => {});
initSelectionFeature();
initFocusUi();
window.addEventListener("beforeunload", () => {
  stopFocusSession({ manual: true, silent: true });
});

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = type ? `status ${type}` : "status";
}

function createDefaultAnalyticsDay() {
  return {
    studyActions: 0,
    summariesGenerated: 0,
    quizzesGenerated: 0,
    mindmapsGenerated: 0,
    explainRequests: 0,
    quizSessionsCompleted: 0,
    quizRight: 0,
    quizWrong: 0,
    focusMinutes: 0,
    focusSessionsCompleted: 0,
    focusSessionsStopped: 0
  };
}

function createDefaultAnalyticsState() {
  return {
    version: 1,
    lastUpdated: "",
    totals: {
      studyActions: 0,
      summariesGenerated: 0,
      quizzesGenerated: 0,
      mindmapsGenerated: 0,
      explainRequests: 0,
      quizSessionsCompleted: 0,
      quizQuestionsRight: 0,
      quizQuestionsWrong: 0,
      focusSessionsCompleted: 0,
      focusSessionsStopped: 0,
      focusMinutesCompleted: 0,
      focusMinutesStopped: 0
    },
    daily: {}
  };
}

function toSafeAnalyticsNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function normalizeAnalyticsDay(day) {
  const normalized = createDefaultAnalyticsDay();
  if (!day || typeof day !== "object") {
    return normalized;
  }

  for (const key of Object.keys(normalized)) {
    normalized[key] = toSafeAnalyticsNumber(day[key]);
  }

  return normalized;
}

function normalizeAnalyticsState(rawState) {
  const normalized = createDefaultAnalyticsState();
  if (!rawState || typeof rawState !== "object") {
    return normalized;
  }

  if (typeof rawState.lastUpdated === "string") {
    normalized.lastUpdated = rawState.lastUpdated;
  }

  const totals = rawState.totals && typeof rawState.totals === "object" ? rawState.totals : {};
  for (const key of Object.keys(normalized.totals)) {
    normalized.totals[key] = toSafeAnalyticsNumber(totals[key]);
  }

  const daily = rawState.daily && typeof rawState.daily === "object" ? rawState.daily : {};
  for (const [dateKey, day] of Object.entries(daily)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      continue;
    }
    normalized.daily[dateKey] = normalizeAnalyticsDay(day);
  }

  return normalized;
}

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKeyDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ensureAnalyticsDayRecord(state, dateKey) {
  if (!state.daily[dateKey]) {
    state.daily[dateKey] = createDefaultAnalyticsDay();
  } else {
    state.daily[dateKey] = normalizeAnalyticsDay(state.daily[dateKey]);
  }
  return state.daily[dateKey];
}

function computeCurrentStreakDays(daily) {
  let streak = 0;
  for (let i = 0; i < 3650; i += 1) {
    const day = normalizeAnalyticsDay(daily[getDateKeyDaysAgo(i)]);
    const isActive = day.studyActions > 0 || day.focusMinutes > 0;
    if (!isActive) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function formatAnalyticsUpdatedAt(lastUpdatedIso) {
  if (!lastUpdatedIso) {
    return "Not updated yet.";
  }
  const parsed = new Date(lastUpdatedIso);
  if (Number.isNaN(parsed.getTime())) {
    return "Not updated yet.";
  }
  return parsed.toLocaleString();
}

function buildRecentAnalyticsDays(daily, dayCount = 7) {
  const recent = [];
  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const key = getDateKeyDaysAgo(offset);
    const day = normalizeAnalyticsDay(daily[key]);
    const [year, month, date] = key.split("-").map((value) => Number(value));
    const labelDate = new Date(year, month - 1, date);
    recent.push({
      key,
      label: labelDate.toLocaleDateString(undefined, { weekday: "short" }),
      studyActions: day.studyActions,
      focusMinutes: Math.round(day.focusMinutes * 10) / 10,
      quizSessions: day.quizSessionsCompleted
    });
  }
  return recent;
}

async function loadAnalyticsState() {
  if (analyticsLoaded) {
    return analyticsState;
  }

  const stored = await chrome.storage.local.get([ANALYTICS_STORAGE_KEY]);
  analyticsState = normalizeAnalyticsState(stored?.[ANALYTICS_STORAGE_KEY]);
  analyticsLoaded = true;
  return analyticsState;
}

function renderAnalyticsDashboard(rawState = analyticsState) {
  if (!analyticsContentEl) {
    return;
  }

  const state = normalizeAnalyticsState(rawState);
  const totals = state.totals;
  const totalQuizAnswers = totals.quizQuestionsRight + totals.quizQuestionsWrong;
  const quizAccuracy = totalQuizAnswers > 0
    ? Math.round((totals.quizQuestionsRight / totalQuizAnswers) * 100)
    : 0;
  const totalFocusMinutes = totals.focusMinutesCompleted + totals.focusMinutesStopped;
  const streakDays = computeCurrentStreakDays(state.daily);
  const recentDays = buildRecentAnalyticsDays(state.daily, 7);
  const maxStudyActions = Math.max(1, ...recentDays.map((day) => day.studyActions));
  const maxFocusMinutes = Math.max(1, ...recentDays.map((day) => day.focusMinutes));
  const updatedText = formatAnalyticsUpdatedAt(state.lastUpdated);

  const trendRowsHtml = recentDays
    .map((day) => {
      const studyWidth = Math.round((day.studyActions / maxStudyActions) * 100);
      const focusWidth = Math.round((day.focusMinutes / maxFocusMinutes) * 100);
      return `
        <div class="analytics-day-row">
          <span class="analytics-day-label">${escapeHtml(day.label)}</span>
          <div class="analytics-day-bars">
            <div class="analytics-track">
              <span class="analytics-bar study" style="width:${studyWidth}%"></span>
            </div>
            <div class="analytics-track">
              <span class="analytics-bar focus" style="width:${focusWidth}%"></span>
            </div>
          </div>
          <span class="analytics-day-meta">${day.studyActions} acts / ${Math.round(day.focusMinutes)}m</span>
        </div>
      `;
    })
    .join("");

  analyticsContentEl.innerHTML = `
    <div class="analytics-grid">
      <article class="analytics-metric-card">
        <p class="analytics-metric-label">Total Study Actions</p>
        <p class="analytics-metric-value">${Math.round(totals.studyActions)}</p>
      </article>
      <article class="analytics-metric-card">
        <p class="analytics-metric-label">Quiz Accuracy</p>
        <p class="analytics-metric-value">${quizAccuracy}%</p>
      </article>
      <article class="analytics-metric-card">
        <p class="analytics-metric-label">Focus Minutes</p>
        <p class="analytics-metric-value">${Math.round(totalFocusMinutes)}</p>
      </article>
      <article class="analytics-metric-card">
        <p class="analytics-metric-label">Current Streak</p>
        <p class="analytics-metric-value">${streakDays} day${streakDays === 1 ? "" : "s"}</p>
      </article>
    </div>
    <p class="analytics-summary-note">
      Updated: ${escapeHtml(updatedText)}.
      Quiz sessions: ${Math.round(totals.quizSessionsCompleted)}.
      Completed focus sessions: ${Math.round(totals.focusSessionsCompleted)}.
    </p>
    <section class="analytics-trend">
      <h3>Last 7 Days (Study / Focus)</h3>
      ${trendRowsHtml || "<p class='analytics-empty'>No recent activity yet.</p>"}
    </section>
  `;
}

async function initAnalyticsDashboard() {
  if (!analyticsContentEl) {
    return;
  }

  const state = await loadAnalyticsState();
  renderAnalyticsDashboard(state);

  if (resetAnalyticsBtn && !resetAnalyticsBtn.dataset.bound) {
    resetAnalyticsBtn.dataset.bound = "1";
    resetAnalyticsBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "Reset all learning analytics data? This cannot be undone."
      );
      if (!confirmed) {
        return;
      }
      analyticsState = createDefaultAnalyticsState();
      analyticsLoaded = true;
      await chrome.storage.local.set({ [ANALYTICS_STORAGE_KEY]: analyticsState });
      renderAnalyticsDashboard(analyticsState);
      setStatus("Learning analytics reset.", "success");
    });
  }
}

function enqueueAnalyticsMutation(mutator) {
  analyticsWriteChain = analyticsWriteChain
    .then(async () => {
      const state = await loadAnalyticsState();
      mutator(state);
      state.lastUpdated = new Date().toISOString();
      analyticsState = normalizeAnalyticsState(state);
      analyticsLoaded = true;
      renderAnalyticsDashboard(analyticsState);
      await chrome.storage.local.set({ [ANALYTICS_STORAGE_KEY]: analyticsState });
    })
    .catch(() => {});

  return analyticsWriteChain;
}

function trackAnalyticsEvent(eventName, payload = {}) {
  enqueueAnalyticsMutation((state) => {
    const totals = state.totals;
    const day = ensureAnalyticsDayRecord(state, getTodayDateKey());

    if (eventName === "summary_generated") {
      totals.studyActions += 1;
      totals.summariesGenerated += 1;
      day.studyActions += 1;
      day.summariesGenerated += 1;
      return;
    }

    if (eventName === "quiz_generated") {
      totals.studyActions += 1;
      totals.quizzesGenerated += 1;
      day.studyActions += 1;
      day.quizzesGenerated += 1;
      return;
    }

    if (eventName === "mindmap_generated") {
      totals.studyActions += 1;
      totals.mindmapsGenerated += 1;
      day.studyActions += 1;
      day.mindmapsGenerated += 1;
      return;
    }

    if (eventName === "explain_requested") {
      totals.studyActions += 1;
      totals.explainRequests += 1;
      day.studyActions += 1;
      day.explainRequests += 1;
      return;
    }

    if (eventName === "quiz_session_completed") {
      const right = Math.round(toSafeAnalyticsNumber(payload.right));
      const wrong = Math.round(toSafeAnalyticsNumber(payload.wrong));
      totals.studyActions += 1;
      totals.quizSessionsCompleted += 1;
      totals.quizQuestionsRight += right;
      totals.quizQuestionsWrong += wrong;
      day.studyActions += 1;
      day.quizSessionsCompleted += 1;
      day.quizRight += right;
      day.quizWrong += wrong;
      return;
    }

    if (eventName === "focus_session_completed") {
      const minutes = Math.round(toSafeAnalyticsNumber(payload.minutes) * 10) / 10;
      totals.studyActions += 1;
      totals.focusSessionsCompleted += 1;
      totals.focusMinutesCompleted += minutes;
      day.studyActions += 1;
      day.focusSessionsCompleted += 1;
      day.focusMinutes += minutes;
      return;
    }

    if (eventName === "focus_session_stopped") {
      const minutes = Math.round(toSafeAnalyticsNumber(payload.minutes) * 10) / 10;
      totals.focusSessionsStopped += 1;
      totals.focusMinutesStopped += minutes;
      day.focusSessionsStopped += 1;
      day.focusMinutes += minutes;
      if (minutes > 0.1) {
        totals.studyActions += 1;
        day.studyActions += 1;
      }
    }
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const LATEX_SYMBOL_MAP = {
  alpha: "&alpha;",
  beta: "&beta;",
  gamma: "&gamma;",
  delta: "&delta;",
  epsilon: "&epsilon;",
  zeta: "&zeta;",
  eta: "&eta;",
  theta: "&theta;",
  iota: "&iota;",
  kappa: "&kappa;",
  lambda: "&lambda;",
  mu: "&mu;",
  nu: "&nu;",
  xi: "&xi;",
  pi: "&pi;",
  rho: "&rho;",
  sigma: "&sigma;",
  tau: "&tau;",
  upsilon: "&upsilon;",
  phi: "&phi;",
  chi: "&chi;",
  psi: "&psi;",
  omega: "&omega;",
  Gamma: "&Gamma;",
  Delta: "&Delta;",
  Theta: "&Theta;",
  Lambda: "&Lambda;",
  Xi: "&Xi;",
  Pi: "&Pi;",
  Sigma: "&Sigma;",
  Phi: "&Phi;",
  Psi: "&Psi;",
  Omega: "&Omega;",
  cdot: "&middot;",
  times: "&times;",
  div: "&divide;",
  pm: "&plusmn;",
  mp: "&#8723;",
  le: "&le;",
  leq: "&le;",
  ge: "&ge;",
  geq: "&ge;",
  neq: "&ne;",
  approx: "&approx;",
  sim: "&sim;",
  to: "&rarr;",
  rightarrow: "&rarr;",
  leftarrow: "&larr;",
  leftrightarrow: "&harr;",
  implies: "&rArr;",
  infty: "&infin;",
  partial: "&part;",
  nabla: "&nabla;",
  sum: "&sum;",
  prod: "&prod;",
  int: "&int;",
  forall: "&forall;",
  exists: "&exist;",
  in: "&isin;",
  notin: "&notin;",
  subset: "&sub;",
  subseteq: "&sube;",
  supset: "&sup;",
  supseteq: "&supe;",
  cup: "&cup;",
  cap: "&cap;",
  ldots: "&hellip;",
  cdots: "&hellip;",
  dots: "&hellip;",
  degree: "&deg;",
  perp: "&perp;",
  parallel: "&#8741;",
  angle: "&ang;",
  because: "&#8757;",
  therefore: "&there4;",
  log: "log",
  ln: "ln",
  exp: "exp",
  sin: "sin",
  cos: "cos",
  tan: "tan",
  sec: "sec",
  csc: "csc",
  cot: "cot",
  lim: "lim"
};

const AUTO_EQUATION_WORD_ALLOWLIST = new Set([
  "sin",
  "cos",
  "tan",
  "log",
  "ln",
  "exp",
  "sqrt",
  "max",
  "min",
  "avg",
  "sum",
  "prod",
  "if",
  "then",
  "let",
  "where",
  "for",
  "when"
]);

function isLikelyEquationLine(line) {
  const text = String(line || "").trim();
  if (text.length < 3 || text.length > 180) {
    return false;
  }

  const hasMathOperator = /[=<>+\-*/^_\u2264\u2265\u2260\u2248\u00B1\u2213\u00D7\u00F7\u2190\u2192\u2194]/.test(text);
  if (!hasMathOperator) {
    return false;
  }

  const letterOrDigit = (text.match(/[A-Za-z0-9]/g) || []).length;
  if (letterOrDigit < 2) {
    return false;
  }

  const words = text.match(/[A-Za-z]{3,}/g) || [];
  const nonMathWords = words.filter(
    (word) => !AUTO_EQUATION_WORD_ALLOWLIST.has(word.toLowerCase())
  );
  if (nonMathWords.length > 4) {
    return false;
  }

  return true;
}

function convertPlainEquationToLatex(text) {
  let latex = String(text || "").trim();
  if (!latex) {
    return "";
  }

  latex = latex.replace(/\s+/g, " ");
  latex = latex.replace(/<->/g, " \\leftrightarrow ");
  latex = latex.replace(/->/g, " \\to ");
  latex = latex.replace(/<=/g, " \\le ");
  latex = latex.replace(/>=/g, " \\ge ");
  latex = latex.replace(/!=/g, " \\neq ");
  latex = latex.replace(/\u2194/g, " \\leftrightarrow ");
  latex = latex.replace(/\u2192/g, " \\to ");
  latex = latex.replace(/\u2190/g, " \\leftarrow ");
  latex = latex.replace(/\u00D7/g, " \\times ");
  latex = latex.replace(/\u00F7/g, " \\div ");
  latex = latex.replace(/\u00B1/g, " \\pm ");
  latex = latex.replace(/\u2213/g, " \\mp ");
  latex = latex.replace(/\u2264/g, " \\le ");
  latex = latex.replace(/\u2265/g, " \\ge ");
  latex = latex.replace(/\u2260/g, " \\neq ");
  latex = latex.replace(/\u2248/g, " \\approx ");
  latex = latex.replace(/\u221E/g, " \\infty ");
  latex = latex.replace(/\u03C0/g, " \\pi ");
  latex = latex.replace(/\u03B8/g, " \\theta ");
  latex = latex.replace(/\u03B1/g, " \\alpha ");
  latex = latex.replace(/\u03B2/g, " \\beta ");
  latex = latex.replace(/\u03B3/g, " \\gamma ");
  latex = latex.replace(/\u0394/g, " \\Delta ");
  latex = latex.replace(/\bpi\b/gi, "\\pi");
  latex = latex.replace(/\btheta\b/gi, "\\theta");
  latex = latex.replace(/\balpha\b/gi, "\\alpha");
  latex = latex.replace(/\bbeta\b/gi, "\\beta");
  latex = latex.replace(/\bgamma\b/gi, "\\gamma");

  latex = latex.replace(/\bsqrt\(([^()]+)\)/gi, "\\sqrt{$1}");
  latex = latex.replace(
    /([A-Za-z0-9)\]])\^([A-Za-z0-9+\-]+)/g,
    (_, base, exponent) => `${base}^{${exponent}}`
  );
  latex = latex.replace(
    /([A-Za-z0-9)\]])_([A-Za-z0-9+\-]+)/g,
    (_, base, subscript) => `${base}_{${subscript}}`
  );

  return latex;
}

function formatNonLatexText(text) {
  const lines = String(text || "").split("\n");
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!isLikelyEquationLine(trimmed)) {
        return escapeHtml(line);
      }

      const latexText = convertPlainEquationToLatex(trimmed);
      const rendered = formatLatexReadable(latexText);
      return `<span class="latex-block auto-equation">${rendered}</span>`;
    })
    .join("<br>");
}

function formatLatexReadable(latexInput) {
  const source = String(latexInput || "");
  let i = 0;

  function skipWhitespace() {
    while (i < source.length && /\s/.test(source[i])) {
      i += 1;
    }
  }

  function parse(stopChar = "") {
    let html = "";

    while (i < source.length) {
      const ch = source[i];

      if (stopChar && ch === stopChar) {
        i += 1;
        break;
      }

      if (ch === "\\") {
        html += parseCommand();
        continue;
      }

      if (ch === "^" || ch === "_") {
        const tag = ch === "^" ? "sup" : "sub";
        i += 1;
        const script = parseScriptAtom();
        if (script) {
          html += `<${tag}>${script}</${tag}>`;
        }
        continue;
      }

      if (ch === "{") {
        i += 1;
        html += parse("}");
        continue;
      }

      if (ch === "\n") {
        html += "<br>";
        i += 1;
        continue;
      }

      html += escapeHtml(ch);
      i += 1;
    }

    return html;
  }

  function parseRequiredGroup() {
    skipWhitespace();
    if (i >= source.length) {
      return "";
    }
    if (source[i] === "{") {
      i += 1;
      return parse("}");
    }
    return parseScriptAtom();
  }

  function parseScriptAtom() {
    skipWhitespace();
    if (i >= source.length) {
      return "";
    }
    if (source[i] === "{") {
      i += 1;
      return parse("}");
    }
    if (source[i] === "\\") {
      return parseCommand();
    }
    const ch = source[i];
    i += 1;
    if (ch === "\n") {
      return "";
    }
    return escapeHtml(ch);
  }

  function parseCommand() {
    i += 1;
    if (i >= source.length) {
      return "\\";
    }

    const charCommand = source[i];
    if (!/[A-Za-z]/.test(charCommand)) {
      i += 1;
      if (charCommand === "\\") {
        return "<br>";
      }
      if (charCommand === "," || charCommand === ";" || charCommand === ":") {
        return "&nbsp;";
      }
      if (charCommand === "!") {
        return "";
      }
      if (charCommand === "{" || charCommand === "}" || charCommand === "[" || charCommand === "]") {
        return escapeHtml(charCommand);
      }
      return escapeHtml(`\\${charCommand}`);
    }

    const start = i;
    while (i < source.length && /[A-Za-z]/.test(source[i])) {
      i += 1;
    }
    const command = source.slice(start, i);

    if (command === "left" || command === "right") {
      if (i < source.length && /[()[\]{}|.]/.test(source[i])) {
        i += 1;
      }
      return "";
    }

    if (command === "frac") {
      const numerator = parseRequiredGroup();
      const denominator = parseRequiredGroup();
      return `<span class="latex-frac"><span class="latex-frac-top">${numerator}</span><span class="latex-frac-bar"></span><span class="latex-frac-bottom">${denominator}</span></span>`;
    }

    if (command === "sqrt") {
      let rootIndex = "";
      skipWhitespace();
      if (i < source.length && source[i] === "[") {
        i += 1;
        rootIndex = parse("]");
      }
      const body = parseRequiredGroup();
      if (rootIndex) {
        return `<span class="latex-root"><sup class="latex-root-index">${rootIndex}</sup><span class="latex-root-sign">&radic;</span><span class="latex-root-body">(${body})</span></span>`;
      }
      return `<span class="latex-root"><span class="latex-root-sign">&radic;</span><span class="latex-root-body">(${body})</span></span>`;
    }

    if (
      command === "text" ||
      command === "mathrm" ||
      command === "mathbf" ||
      command === "mathit" ||
      command === "textrm" ||
      command === "textbf" ||
      command === "textit" ||
      command === "operatorname"
    ) {
      return parseRequiredGroup();
    }

    if (command === "quad") {
      return "&nbsp;&nbsp;";
    }
    if (command === "qquad") {
      return "&nbsp;&nbsp;&nbsp;&nbsp;";
    }
    if (command === "newline") {
      return "<br>";
    }

    if (LATEX_SYMBOL_MAP[command]) {
      return LATEX_SYMBOL_MAP[command];
    }

    return escapeHtml(`\\${command}`);
  }

  return parse();
}

function formatModelText(text) {
  const raw = String(text || "");
  const latexTokenPattern = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;
  let cursor = 0;
  let html = "";
  let match;

  while ((match = latexTokenPattern.exec(raw)) !== null) {
    const start = match.index;
    if (start > cursor) {
      html += formatNonLatexText(raw.slice(cursor, start));
    }

    const token = match[0];
    const isBlock = token.startsWith("$$") || token.startsWith("\\[");
    let latexBody = token;
    if (token.startsWith("$$")) {
      latexBody = token.slice(2, -2);
    } else if (token.startsWith("\\[")) {
      latexBody = token.slice(2, -2);
    } else if (token.startsWith("\\(")) {
      latexBody = token.slice(2, -2);
    } else if (token.startsWith("$")) {
      latexBody = token.slice(1, -1);
    }

    const renderedLatex = formatLatexReadable(latexBody.trim());
    html += `<span class="${isBlock ? "latex-block" : "latex-inline"}">${renderedLatex}</span>`;
    cursor = latexTokenPattern.lastIndex;
  }

  if (cursor < raw.length) {
    html += formatNonLatexText(raw.slice(cursor));
  }

  return html;
}

function setBusy(isBusy) {
  if (summarizeBtn) {
    summarizeBtn.disabled = isBusy;
  }
  if (quizBtn) {
    quizBtn.disabled = isBusy;
  }
  if (mindmapBtn) {
    mindmapBtn.disabled = isBusy;
  }
  if (summarizeHighlightedBtn) {
    summarizeHighlightedBtn.disabled = isBusy;
  }
  if (quizHighlightedBtn) {
    quizHighlightedBtn.disabled = isBusy;
  }
  if (mindmapHighlightedBtn) {
    mindmapHighlightedBtn.disabled = isBusy;
  }
  if (clearBtn) {
    clearBtn.disabled = isBusy;
  }
  if (clearHighlightedBtn) {
    clearHighlightedBtn.disabled = isBusy;
  }
  if (explainSelectionBtn) {
    explainSelectionBtn.disabled = isBusy;
  }
  if (explainModeSelect) {
    explainModeSelect.disabled = isBusy;
  }
}

function clearOutputPanel() {
  outputEl.innerHTML = "";
  setStatus("");
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

function resolveColorMode(mode) {
  if (mode === "system") {
    return darkModeQuery?.matches ? "dark" : "light";
  }
  return mode;
}

async function refreshAppearanceSettings() {
  const { colorMode = DEFAULT_COLOR_MODE, backgroundPalette = DEFAULT_BACKGROUND_PALETTE } =
    await chrome.storage.local.get(["colorMode", "backgroundPalette"]);

  const normalizedMode = normalizeColorMode(colorMode);
  const resolvedTheme = resolveColorMode(normalizedMode);
  const normalizedPalette = normalizeBackgroundPalette(backgroundPalette);
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme;
  root.dataset.palette = normalizedPalette;
}

function initCarouselUi() {
  if (!carouselTrackEl || carouselPages.length === 0) {
    return;
  }

  let savedPage = 0;
  try {
    const parsed = Number(localStorage.getItem(CAROUSEL_PAGE_KEY));
    savedPage = Number.isFinite(parsed) ? parsed : 0;
  } catch {
    savedPage = 0;
  }

  setCarouselPage(savedPage, { persist: false });
}

function setCarouselPage(targetPage, { persist = true } = {}) {
  if (!carouselTrackEl || carouselPages.length === 0) {
    return;
  }

  const maxPage = carouselPages.length - 1;
  const normalized = Number.isFinite(targetPage) ? Math.round(targetPage) : 0;
  currentCarouselPage = Math.min(maxPage, Math.max(0, normalized));
  carouselTrackEl.style.transform = `translateX(-${currentCarouselPage * 100}%)`;

  carouselPages.forEach((page, index) => {
    page.setAttribute("aria-hidden", index === currentCarouselPage ? "false" : "true");
  });

  if (carouselPrevBtn) {
    carouselPrevBtn.disabled = currentCarouselPage === 0;
  }
  if (carouselNextBtn) {
    carouselNextBtn.disabled = currentCarouselPage >= maxPage;
  }
  if (carouselStudyBtn) {
    const selected = currentCarouselPage === 0;
    carouselStudyBtn.classList.toggle("active", selected);
    carouselStudyBtn.setAttribute("aria-selected", String(selected));
  }
  if (carouselFocusBtn) {
    const selected = currentCarouselPage === 1;
    carouselFocusBtn.classList.toggle("active", selected);
    carouselFocusBtn.setAttribute("aria-selected", String(selected));
  }
  if (carouselAnalyticsBtn) {
    const selected = currentCarouselPage === 2;
    carouselAnalyticsBtn.classList.toggle("active", selected);
    carouselAnalyticsBtn.setAttribute("aria-selected", String(selected));
  }

  if (!persist) {
    return;
  }

  try {
    localStorage.setItem(CAROUSEL_PAGE_KEY, String(currentCarouselPage));
  } catch {
    // Ignore storage errors; carousel can still work without persistence.
  }
}

function initFocusUi() {
  updateCycleConfigVisibility();
  focusHeadTrackingEnabled = Boolean(headTrackingToggle?.checked ?? true);
  updateHeadTrackingUi();
  focusConfiguredFocusSeconds = getMinutesAsSeconds(
    focusDurationInput?.value,
    MIN_FOCUS_MINUTES,
    MAX_FOCUS_MINUTES,
    DEFAULT_FOCUS_MINUTES
  );
  focusConfiguredRestSeconds = getMinutesAsSeconds(
    restDurationInput?.value,
    MIN_REST_MINUTES,
    MAX_REST_MINUTES,
    DEFAULT_REST_MINUTES
  );
  focusTotalCycles = clampNumber(Number(cycleCountInput?.value), 1, MAX_CYCLE_COUNT, DEFAULT_CYCLE_COUNT);
  focusSecondsRemaining = focusConfiguredFocusSeconds;
  focusCurrentPhase = "focus";
  focusCurrentCycle = 1;
  focusCycleModeEnabled = Boolean(cycleModeToggle?.checked);
  renderFocusTimer();
  setFocusState("Idle", "idle");
  focusFallbackPrevLuma = null;
  focusFallbackPresenceHoldUntil = 0;
  hideFocusReminderBanner();
  setFocusDetectorStatus(focusHeadTrackingEnabled ? "Heuristic (pixel)" : "Off");
  setFocusLastCheck("Not started");
}

function updateHeadTrackingUi() {
  const enabled = Boolean(headTrackingToggle?.checked ?? true);
  if (reminderDelayInput) {
    reminderDelayInput.disabled = !enabled || focusSessionActive;
    reminderDelayInput.title = enabled
      ? ""
      : "Head tracking is off, so distraction reminders are disabled.";
  }

  if (headTrackingToggle) {
    headTrackingToggle.disabled = focusSessionActive;
  }

  if (!focusSessionActive) {
    setFocusDetectorStatus(enabled ? "Heuristic (pixel)" : "Off");
    if (focusHintEl) {
      focusHintEl.textContent = enabled
        ? "Start a session to enable camera-based focus reminders."
        : "Start a session for timer-only mode (head tracking off).";
    }
  }
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampDecimal(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function getMinutesAsSeconds(rawValue, min, max, fallbackMinutes) {
  const minutes = clampDecimal(Number(rawValue), min, max, fallbackMinutes);
  return Math.max(1, Math.round(minutes * 60));
}

function formatDuration(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateCycleConfigVisibility() {
  if (!cycleConfigEl) {
    return;
  }
  cycleConfigEl.classList.toggle("hidden", !cycleModeToggle?.checked);
}

async function startFocusSession() {
  if (focusSessionActive) {
    return;
  }

  try {
    const headTrackingEnabled = Boolean(headTrackingToggle?.checked ?? true);
    const focusMinutes = clampDecimal(
      Number(focusDurationInput?.value),
      MIN_FOCUS_MINUTES,
      MAX_FOCUS_MINUTES,
      DEFAULT_FOCUS_MINUTES
    );
    const focusSeconds = Math.max(1, Math.round(focusMinutes * 60));
    const reminderSeconds = clampNumber(Number(reminderDelayInput?.value), 5, 120, 20);
    const cycleEnabled = Boolean(cycleModeToggle?.checked);
    const restMinutes = clampDecimal(
      Number(restDurationInput?.value),
      MIN_REST_MINUTES,
      MAX_REST_MINUTES,
      DEFAULT_REST_MINUTES
    );
    const restSeconds = Math.max(1, Math.round(restMinutes * 60));
    const cycleCount = clampNumber(Number(cycleCountInput?.value), 1, MAX_CYCLE_COUNT, DEFAULT_CYCLE_COUNT);
    if (focusHintEl) {
      focusHintEl.textContent = headTrackingEnabled
        ? "Requesting camera permission..."
        : "Starting timer-only session (head tracking off)...";
    }
    hideFocusReminderBanner();

    await ensureFocusAudioContext();
    focusFallbackPrevLuma = null;
    focusFallbackPresenceHoldUntil = 0;
    focusHeadTrackingEnabled = headTrackingEnabled;
    if (focusHeadTrackingEnabled) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("This browser profile does not support camera access in this context.");
      }

      const cameraPermissionState = await getCameraPermissionState();
      if (cameraPermissionState === "denied") {
        throw new Error(
          `Camera permission is denied for ${location.origin}. Allow it in chrome://settings/content/camera and retry.`
        );
      }

      focusMediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
      if (!focusVideoEl) {
        throw new Error("Focus video element is missing.");
      }

      focusVideoEl.srcObject = focusMediaStream;
      focusVideoEl.classList.remove("hidden");
      await focusVideoEl.play();
      setFocusDetectorStatus("Heuristic (pixel)");
      setFocusLastCheck("Session started");
    } else {
      if (focusVideoEl) {
        focusVideoEl.srcObject = null;
        focusVideoEl.classList.add("hidden");
      }
      focusMediaStream = null;
      setFocusDetectorStatus("Off");
      setFocusLastCheck("Session started (head tracking off)");
    }

    focusCycleModeEnabled = cycleEnabled;
    focusCurrentPhase = "focus";
    focusCurrentCycle = 1;
    focusTotalCycles = cycleEnabled ? cycleCount : 1;
    focusConfiguredFocusSeconds = focusSeconds;
    focusConfiguredRestSeconds = cycleEnabled ? restSeconds : 0;
    focusSecondsRemaining = focusConfiguredFocusSeconds;
    focusSessionActive = true;
    focusDistractionSince = 0;
    focusFrameFocused = 0;
    focusFrameDistracted = 0;
    focusElapsedFocusSeconds = 0;
    renderFocusTimer();

    if (startFocusBtn) {
      startFocusBtn.disabled = true;
    }
    if (stopFocusBtn) {
      stopFocusBtn.disabled = false;
    }
    updateHeadTrackingUi();
    setFocusState("Running", "active");

    if (focusHintEl) {
      if (focusCycleModeEnabled) {
        if (focusHeadTrackingEnabled) {
          focusHintEl.textContent =
            `Cycle mode running: focus ${focusMinutes} min, rest ${restMinutes} min, ${focusTotalCycles} cycles. ` +
            `Reminder triggers after ${reminderSeconds}s of continuous distraction during focus phases.`;
        } else {
          focusHintEl.textContent =
            `Cycle mode running: focus ${focusMinutes} min, rest ${restMinutes} min, ${focusTotalCycles} cycles. ` +
            "Head tracking is off, so this session runs in timer-only mode.";
        }
      } else {
        focusHintEl.textContent = focusHeadTrackingEnabled
          ? `Session running (heuristic mode). Reminder triggers after ${reminderSeconds}s of continuous distraction.`
          : "Session running in timer-only mode (head tracking off).";
      }
    }

    focusTimerInterval = setInterval(() => {
      tickFocusTimer();
    }, 1000);

    if (focusHeadTrackingEnabled) {
      focusAnalysisInterval = setInterval(() => {
        analyzeFocusFrame().catch(() => {});
      }, FOCUS_ANALYSIS_INTERVAL_MS);
    } else {
      focusAnalysisInterval = null;
    }
  } catch (error) {
    stopFocusSession({ manual: true, silent: true });
    setFocusState("Start failed", "warning");
    if (focusHintEl) {
      focusHintEl.textContent = focusHeadTrackingEnabled
        ? getCameraTroubleshootingMessage(error)
        : "Session failed to start. Please check your timer settings and retry.";
    }
    const errorName = String(error?.name || "Error");
    const errorMessage = String(error?.message || "Failed to start focus session.");
    setStatus(`${errorName}: ${errorMessage}`, "error");
  }
}

function tickFocusTimer() {
  if (!focusSessionActive) {
    return;
  }

  if (focusCurrentPhase === "focus" && focusSecondsRemaining > 0) {
    focusElapsedFocusSeconds += 1;
  }

  focusSecondsRemaining = Math.max(0, focusSecondsRemaining - 1);
  renderFocusTimer();
  if (focusCycleModeEnabled && focusCurrentPhase === "rest" && focusHintEl) {
    focusHintEl.textContent =
      `Resting (cycle ${focusCurrentCycle}/${focusTotalCycles}). Next focus starts in ${formatDuration(focusSecondsRemaining)}.`;
  }

  if (focusSecondsRemaining > 0) {
    return;
  }

  handleFocusPhaseCompletion();
}

function renderFocusTimer() {
  if (!focusTimerEl) {
    return;
  }

  focusTimerEl.textContent = formatDuration(focusSecondsRemaining);
}

function setFocusState(text, mode) {
  if (!focusStateEl) {
    return;
  }

  focusStateEl.textContent = text;
  focusStateEl.className = `focus-state ${mode}`;
}

function showFocusReminderBanner() {
  if (!focusReminderBannerEl) {
    return;
  }
  focusReminderBannerEl.classList.remove("hidden");
  setFocusLastCheck("Reminder triggered");
}

function hideFocusReminderBanner() {
  if (!focusReminderBannerEl) {
    return;
  }
  focusReminderBannerEl.classList.add("hidden");
}

async function analyzeFocusFrame() {
  if (!focusSessionActive || !focusVideoEl || !focusHeadTrackingEnabled) {
    return;
  }

  if (focusCurrentPhase !== "focus") {
    focusDistractionSince = 0;
    stopContinuousReminderTone();
    hideFocusReminderBanner();
    setFocusState("Resting", "idle");
    setFocusLastCheck(`Rest phase in progress (cycle ${focusCurrentCycle}/${focusTotalCycles})`);
    return;
  }

  if (!focusVideoEl.videoWidth || !focusVideoEl.videoHeight) {
    setFocusState("Camera Warmup", "active");
    setFocusLastCheck("Camera frame not ready");
    return;
  }

  analyzeFocusFrameHeuristic();
}

function ensureFocusFallbackCanvas() {
  if (!focusFallbackCanvas) {
    focusFallbackCanvas = document.createElement("canvas");
    focusFallbackCanvas.width = FALLBACK_FRAME_WIDTH;
    focusFallbackCanvas.height = FALLBACK_FRAME_HEIGHT;
  }

  if (!focusFallbackCtx) {
    focusFallbackCtx = focusFallbackCanvas.getContext("2d", { willReadFrequently: true });
  }

  return Boolean(focusFallbackCtx);
}

function analyzeFocusFrameHeuristic() {
  if (!focusVideoEl || !ensureFocusFallbackCanvas()) {
    setFocusState("Heuristic Error", "warning");
    setFocusLastCheck("Heuristic analyzer unavailable");
    return;
  }

  focusFallbackCtx.drawImage(
    focusVideoEl,
    0,
    0,
    FALLBACK_FRAME_WIDTH,
    FALLBACK_FRAME_HEIGHT
  );
  const frame = focusFallbackCtx.getImageData(
    0,
    0,
    FALLBACK_FRAME_WIDTH,
    FALLBACK_FRAME_HEIGHT
  );

  const roiLeft = Math.floor(FALLBACK_FRAME_WIDTH * 0.2);
  const roiRight = Math.floor(FALLBACK_FRAME_WIDTH * 0.8);
  const roiTop = Math.floor(FALLBACK_FRAME_HEIGHT * 0.15);
  const roiBottom = Math.floor(FALLBACK_FRAME_HEIGHT * 0.9);

  let skinCount = 0;
  let pixelCount = 0;
  let brightnessSum = 0;
  const currentLuma = [];

  for (let y = roiTop; y < roiBottom; y += 2) {
    for (let x = roiLeft; x < roiRight; x += 2) {
      const i = (y * FALLBACK_FRAME_WIDTH + x) * 4;
      const r = frame.data[i];
      const g = frame.data[i + 1];
      const b = frame.data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      currentLuma.push(luma);
      brightnessSum += luma;
      pixelCount += 1;
      if (isLikelySkinPixel(r, g, b)) {
        skinCount += 1;
      }
    }
  }

  if (pixelCount === 0) {
    setFocusState("Heuristic Error", "warning");
    setFocusLastCheck("Heuristic: empty frame");
    return;
  }

  const skinRatio = skinCount / pixelCount;
  const brightnessAvg = brightnessSum / pixelCount;
  let motionScore = 0;
  if (focusFallbackPrevLuma && focusFallbackPrevLuma.length === currentLuma.length) {
    let deltaSum = 0;
    for (let i = 0; i < currentLuma.length; i += 1) {
      deltaSum += Math.abs(currentLuma[i] - focusFallbackPrevLuma[i]);
    }
    motionScore = deltaSum / currentLuma.length;
  }
  focusFallbackPrevLuma = currentLuma;

  const likelyPresentBySkin = skinRatio >= 0.03 && brightnessAvg >= 35;
  const likelyPresentByMotion = motionScore >= 14 && brightnessAvg >= 30;
  const now = Date.now();
  if (likelyPresentBySkin || likelyPresentByMotion) {
    focusFallbackPresenceHoldUntil = now + 4500;
  }
  const likelyPresent = now < focusFallbackPresenceHoldUntil;

  setFocusLastCheck(
    `Heuristic check: skin ${(skinRatio * 100).toFixed(1)}%, motion ${motionScore.toFixed(1)}`
  );

  if (likelyPresent) {
    focusFrameFocused += 1;
    focusDistractionSince = 0;
    stopContinuousReminderTone();
    setFocusState("Focused", "focused");
    if (focusHintEl) {
      focusHintEl.textContent =
        "Face status: focused (heuristic mode). Keep up the concentration.";
    }
    hideFocusReminderBanner();
    return;
  }

  focusFrameDistracted += 1;
  evaluateDistraction("Face likely not present");
}

function isLikelySkinPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (
    r > 95 &&
    g > 40 &&
    b > 20 &&
    (max - min) > 15 &&
    Math.abs(r - g) > 15 &&
    r > g &&
    r > b
  );
}

function evaluateDistraction(reason) {
  const now = Date.now();
  if (!focusDistractionSince) {
    focusDistractionSince = now;
  }

  setFocusState("Distracted", "warning");
  const reminderSeconds = clampNumber(Number(reminderDelayInput?.value), 5, 120, 20);
  const distractedForMs = now - focusDistractionSince;
  const remainingSeconds = Math.max(
    0,
    Math.ceil((reminderSeconds * 1000 - distractedForMs) / 1000)
  );
  if (focusHintEl) {
    focusHintEl.textContent =
      `${reason}. Face status: distracted. Gentle reminder in ${remainingSeconds}s if this continues.`;
  }

  if (distractedForMs < reminderSeconds * 1000) {
    stopContinuousReminderTone();
    return;
  }

  startContinuousReminderTone();
  showFocusReminderBanner();
  if (focusHintEl) {
    focusHintEl.textContent =
      "Gentle reminder active: bring your attention back to your study material. Tone will stop once you refocus.";
  }
  setStatus("Gentle reminder active: return to your study focus.", "error");
}

function handleFocusPhaseCompletion() {
  playReminderTone();
  stopContinuousReminderTone();
  hideFocusReminderBanner();
  focusDistractionSince = 0;

  if (!focusCycleModeEnabled) {
    stopFocusSession({ manual: false, completed: true });
    return;
  }

  if (focusCurrentPhase === "focus") {
    if (focusCurrentCycle >= focusTotalCycles) {
      stopFocusSession({ manual: false, completed: true });
      return;
    }
    focusCurrentPhase = "rest";
    focusSecondsRemaining = focusConfiguredRestSeconds;
    renderFocusTimer();
    setFocusState("Resting", "idle");
    setFocusLastCheck(`Cycle ${focusCurrentCycle}/${focusTotalCycles}: rest started`);
    if (focusHintEl) {
      focusHintEl.textContent =
        `Resting (cycle ${focusCurrentCycle}/${focusTotalCycles}). Next focus starts in ${formatDuration(focusSecondsRemaining)}.`;
    }
    return;
  }

  focusCurrentCycle += 1;
  focusCurrentPhase = "focus";
  focusSecondsRemaining = focusConfiguredFocusSeconds;
  renderFocusTimer();
  setFocusState("Running", "active");
  setFocusLastCheck(`Cycle ${focusCurrentCycle}/${focusTotalCycles}: focus started`);
  if (focusHintEl) {
    focusHintEl.textContent = focusHeadTrackingEnabled
      ? `Focus cycle ${focusCurrentCycle}/${focusTotalCycles} started. Camera attention checks are active.`
      : `Focus cycle ${focusCurrentCycle}/${focusTotalCycles} started (timer-only mode).`;
  }
}

function stopFocusSession({ manual = false, completed = false, silent = false } = {}) {
  focusSessionActive = false;
  stopContinuousReminderTone();
  focusFallbackPrevLuma = null;
  focusFallbackPresenceHoldUntil = 0;
  focusFallbackCtx = null;
  focusFallbackCanvas = null;

  if (focusTimerInterval) {
    clearInterval(focusTimerInterval);
    focusTimerInterval = null;
  }
  if (focusAnalysisInterval) {
    clearInterval(focusAnalysisInterval);
    focusAnalysisInterval = null;
  }

  if (focusMediaStream) {
    focusMediaStream.getTracks().forEach((track) => track.stop());
    focusMediaStream = null;
  }
  if (focusVideoEl) {
    focusVideoEl.srcObject = null;
    focusVideoEl.classList.add("hidden");
  }
  hideFocusReminderBanner();

  if (focusAudioCtx) {
    focusAudioCtx.close().catch(() => {});
    focusAudioCtx = null;
  }

  setFocusLastCheck("Session stopped");

  if (startFocusBtn) {
    startFocusBtn.disabled = false;
  }
  if (stopFocusBtn) {
    stopFocusBtn.disabled = true;
  }
  updateHeadTrackingUi();
  const elapsedFocusMinutes = Math.round((focusElapsedFocusSeconds / 60) * 10) / 10;

  if (completed) {
    setFocusState("Completed", "focused");
    const totalFrames = focusFrameFocused + focusFrameDistracted;
    const focusRate = totalFrames > 0 ? Math.round((focusFrameFocused / totalFrames) * 100) : 0;
    if (focusHintEl) {
      if (!focusHeadTrackingEnabled) {
        focusHintEl.textContent = focusCycleModeEnabled
          ? `Session complete (${focusTotalCycles} cycles). Timer-only mode finished.`
          : "Session complete. Timer-only mode finished.";
      } else if (focusCycleModeEnabled) {
        focusHintEl.textContent =
          `Session complete (${focusTotalCycles} cycles). Focus estimate: ${focusRate}%. Great effort.`;
      } else {
        focusHintEl.textContent = `Session complete. Focus estimate: ${focusRate}%. Great effort.`;
      }
    }
    if (!silent) {
      trackAnalyticsEvent("focus_session_completed", { minutes: elapsedFocusMinutes });
    }
    focusElapsedFocusSeconds = 0;
    return;
  }

  if (manual) {
    setFocusState("Stopped", "idle");
    const totalFrames = focusFrameFocused + focusFrameDistracted;
    if (focusHintEl) {
      if (!focusHeadTrackingEnabled) {
        focusHintEl.textContent = "Session stopped (timer-only mode).";
      } else if (totalFrames > 0) {
        const focusRate = Math.round((focusFrameFocused / totalFrames) * 100);
        focusHintEl.textContent = `Session stopped. Focus estimate: ${focusRate}%.`;
      } else {
        focusHintEl.textContent = "Session stopped.";
      }
    }
    if (!silent) {
      trackAnalyticsEvent("focus_session_stopped", { minutes: elapsedFocusMinutes });
    }
  } else if (!silent) {
    setFocusState("Idle", "idle");
  }

  focusElapsedFocusSeconds = 0;
}

function playTone(frequency, durationMs) {
  try {
    if (!focusAudioCtx) {
      return;
    }
    const ctx = focusAudioCtx;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = 0.001;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.03);
  } catch {
    // Ignore tone playback failures; session should keep running.
  }
}

function playReminderTone() {
  playTone(520, 180);
  setTimeout(() => playTone(620, 180), 220);
}

function startContinuousReminderTone() {
  if (focusContinuousReminderInterval) {
    return;
  }
  playReminderTone();
  focusContinuousReminderInterval = setInterval(() => {
    if (!focusSessionActive) {
      stopContinuousReminderTone();
      return;
    }
    playReminderTone();
  }, CONTINUOUS_REMINDER_INTERVAL_MS);
}

function stopContinuousReminderTone() {
  if (!focusContinuousReminderInterval) {
    return;
  }
  clearInterval(focusContinuousReminderInterval);
  focusContinuousReminderInterval = null;
}

function setFocusDetectorStatus(text) {
  if (!focusDetectorStatusEl) {
    return;
  }
  focusDetectorStatusEl.textContent = `Detector: ${text}`;
}

function setFocusLastCheck(text) {
  if (!focusLastCheckEl) {
    return;
  }
  const timestamp = new Date().toLocaleTimeString();
  focusLastCheckEl.textContent = `Last check: ${text} (${timestamp})`;
}

async function ensureFocusAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    if (!focusAudioCtx || focusAudioCtx.state === "closed") {
      focusAudioCtx = new AudioCtx();
    }
    if (focusAudioCtx.state === "suspended") {
      await focusAudioCtx.resume();
    }
  } catch {
    // If audio initialization fails, session can still run without sound.
  }
}

function getCameraTroubleshootingMessage(error) {
  const name = String(error?.name || "").toLowerCase();
  if (name.includes("notallowed") || name.includes("security")) {
    return (
      `Camera permission was denied for ${location.origin}. Allow it in chrome://settings/content/camera, ` +
      "then retry. Also check OS camera privacy settings."
    );
  }

  if (name.includes("notfound")) {
    return "No camera device was found. Connect/enable a webcam and try again.";
  }

  if (name.includes("notreadable")) {
    return "Camera is busy (possibly used by another app). Close other camera apps and retry.";
  }

  return (
    `Camera access failed for ${location.origin}. Check chrome://settings/content/camera, ` +
    "then retry and check OS privacy settings."
  );
}

async function getCameraPermissionState() {
  try {
    if (!navigator.permissions?.query) {
      return "prompt";
    }
    const status = await navigator.permissions.query({ name: "camera" });
    return String(status?.state || "prompt");
  } catch {
    return "prompt";
  }
}

async function initSelectionFeature() {
  if (!selectionPreviewEl) {
    return;
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "SELECTION_UPDATED_FOR_UI") {
      return;
    }

    syncIncomingSelectionForActiveTab(message.payload).catch(() => {});
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      startAutoSelectionPolling();
      refreshSelectionFromBackground().catch(() => {});
      return;
    }

    stopAutoSelectionPolling();
  });

  startAutoSelectionPolling();
  await refreshSelectionFromBackground();
}

async function syncIncomingSelectionForActiveTab(payload) {
  if (!payload) {
    return;
  }

  const activeTab = await getActiveTab();
  if (!activeTab || payload.tabId !== activeTab.id) {
    return;
  }

  setCurrentSelection(payload.selection || null);
}

async function refreshSelectionFromBackground() {
  if (!selectionPreviewEl) {
    return;
  }

  const activeTab = await getActiveTab();
  if (!activeTab || typeof activeTab.id !== "number") {
    setCurrentSelection(null);
    return;
  }

  let directSelection = null;
  try {
    directSelection = await captureSelectionFromActiveTab(activeTab.id);
  } catch {
    directSelection = null;
  }

  if (directSelection) {
    lastAutoSelectionSignature = directSelection.text;
    setCurrentSelection(directSelection);
    chrome.runtime
      .sendMessage({
        type: "SELECTION_UPDATED_FROM_UI",
        tabId: activeTab.id,
        payload: directSelection
      })
      .catch(() => {});
    return;
  }

  lastAutoSelectionSignature = "";
  setCurrentSelection(null);
  chrome.runtime
    .sendMessage({
      type: "SELECTION_UPDATED_FROM_UI",
      tabId: activeTab.id,
      payload: null
    })
    .catch(() => {});
}

function startAutoSelectionPolling() {
  if (selectionPollTimer || !selectionPreviewEl) {
    return;
  }

  selectionPollTimer = setInterval(() => {
    if (document.hidden || selectionPollInFlight) {
      return;
    }

    selectionPollInFlight = true;
    pollForLiveSelection()
      .catch(() => {})
      .finally(() => {
        selectionPollInFlight = false;
      });
  }, AUTO_SELECTION_POLL_MS);
}

function stopAutoSelectionPolling() {
  if (!selectionPollTimer) {
    return;
  }

  clearInterval(selectionPollTimer);
  selectionPollTimer = null;
}

async function pollForLiveSelection() {
  const activeTab = await getActiveTab();
  if (!activeTab || typeof activeTab.id !== "number") {
    return;
  }

  const directSelection = await captureSelectionFromActiveTab(activeTab.id).catch(() => null);
  if (!directSelection) {
    if (latestSelection || lastAutoSelectionSignature) {
      lastAutoSelectionSignature = "";
      setCurrentSelection(null);
      chrome.runtime
        .sendMessage({
          type: "SELECTION_UPDATED_FROM_UI",
          tabId: activeTab.id,
          payload: null
        })
        .catch(() => {});
    }
    return;
  }

  if (directSelection.text === lastAutoSelectionSignature) {
    return;
  }

  lastAutoSelectionSignature = directSelection.text;
  setCurrentSelection(directSelection);
  chrome.runtime
    .sendMessage({
      type: "SELECTION_UPDATED_FROM_UI",
      tabId: activeTab.id,
      payload: directSelection
    })
    .catch(() => {});
}

async function captureSelectionFromActiveTab(tabId) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: extractSelectionFromPage
  });

  const selection = result?.[0]?.result;
  return normalizeSelection(selection);
}

function extractSelectionFromPage() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const text = selection.toString().replace(/\s+/g, " ").trim();
  if (text.length < 10) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const root =
    node?.nodeType === Node.TEXT_NODE
      ? node.parentElement || document.body
      : node || document.body;

  const contextSource = (root?.innerText || document.body?.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
  const pivot = text.slice(0, Math.min(40, text.length));
  const pivotIndex = contextSource.indexOf(pivot);
  const radius = 350;
  const start = pivotIndex >= 0 ? Math.max(0, pivotIndex - radius) : 0;
  const end = pivotIndex >= 0
    ? Math.min(contextSource.length, pivotIndex + text.length + radius)
    : Math.min(contextSource.length, 1000);

  return {
    text: text.slice(0, 2600),
    context: contextSource.slice(start, end).slice(0, 1400),
    title: document.title,
    url: window.location.href,
    capturedAt: new Date().toISOString()
  };
}

function setCurrentSelection(selection) {
  const normalized = normalizeSelection(selection);
  latestSelection = normalized;

  if (!selectionPreviewEl || !selectionPromptAreaEl || !selectionBoxEl) {
    return;
  }

  if (!normalized) {
    if (topControlsEl) {
      topControlsEl.classList.remove("hidden");
    }
    selectionPromptAreaEl.classList.add("hidden");
    selectionBoxEl.classList.remove("has-selection");
    if (selectionHintEl) {
      selectionHintEl.textContent = "Highlight text on the webpage to ask about it.";
    }
    return;
  }

  if (topControlsEl) {
    topControlsEl.classList.add("hidden");
  }
  selectionPromptAreaEl.classList.remove("hidden");
  selectionBoxEl.classList.add("has-selection");

  const preview = normalized.text.length > 650
    ? `${normalized.text.slice(0, 650)}...`
    : normalized.text;
  selectionPreviewEl.textContent = preview;
  selectionPreviewEl.classList.remove("empty");

  if (selectionHintEl) {
    selectionHintEl.textContent = "Highlight captured. Ask the AI to explain this section.";
  }
}

function normalizeSelection(selection) {
  if (!selection || typeof selection.text !== "string") {
    return null;
  }

  const text = selection.text.trim().slice(0, MAX_SELECTION_CHARS);
  if (text.length < MIN_SELECTION_CHARS) {
    return null;
  }

  const context = typeof selection.context === "string" ? selection.context.trim() : "";
  return {
    text,
    context: context.slice(0, 1400),
    title: typeof selection.title === "string" ? selection.title : "",
    url: typeof selection.url === "string" ? selection.url : ""
  };
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function runFlow(type) {
  setBusy(true);
  outputEl.innerHTML = "";

  try {
    const settings = await chrome.storage.local.get(["openaiApiKey", "model"]);
    const apiKey = (settings.openaiApiKey || "").trim();
    const model = (settings.model || DEFAULT_MODEL).trim();

    if (!apiKey) {
      setStatus("Missing API key. Open Settings and add it.", "error");
      return;
    }

    if (type === "mindmap") {
      const selectedText = (latestSelection?.text || "").trim();
      const selectedContext = (latestSelection?.context || "").trim();
      const hasSelection = selectedText.length >= MIN_SELECTION_CHARS;

      let sourceText = "";
      if (hasSelection) {
        sourceText = [selectedText, selectedContext].filter(Boolean).join("\n\nContext:\n");
      } else {
        setStatus("Reading active tab...");
        const tabText = await getActiveTabText();
        if (!tabText || tabText.length < 120) {
          setStatus(
            "Not enough text found for mindmap. Highlight a section or use a text-heavy page.",
            "error"
          );
          return;
        }
        sourceText = tabText;
      }

      const clippedText = sourceText.slice(0, MAX_SOURCE_CHARS);
      setStatus(`Generating mindmap from ${hasSelection ? "highlight" : "tab"}...`);
      const data = await requestMindmap({ apiKey, model, sourceText: clippedText });
      renderMindmap(data);
      setStatus("Mindmap complete.", "success-plain");
      trackAnalyticsEvent("mindmap_generated");
      return;
    }

    const selectedText = (latestSelection?.text || "").trim();
    const hasSelection = selectedText.length >= MIN_SELECTION_CHARS;
    let sourceOrigin = hasSelection ? "highlight" : "tab";
    let sourceText = "";

    if (hasSelection) {
      sourceText = selectedText;
    } else {
      setStatus("Reading active tab...");
      const tabText = await getActiveTabText();
      if (!tabText || tabText.length < 120) {
        setStatus(
          "Not enough text found on this page. Try an article-style text page.",
          "error"
        );
        return;
      }
      sourceText = tabText;
      sourceOrigin = "tab";
    }

    const clippedText = sourceText.slice(0, MAX_SOURCE_CHARS);
    const sourceChunks = buildSourceChunks(clippedText);
    if (!sourceChunks.length) {
      setStatus("Not enough readable source text to cite.", "error");
      return;
    }
    if (type === "summary") {
      setStatus(
        `Generating topic summary from ${sourceOrigin === "highlight" ? "highlighted text only" : "full tab"}...`
      );
      const data = await requestSummary({ apiKey, model, sourceChunks });
      renderSummary(data, sourceOrigin, sourceChunks);
      setStatus("Summary complete.", "success-plain");
      trackAnalyticsEvent("summary_generated");
      return;
    }

    setStatus(
      `Generating quiz from ${sourceOrigin === "highlight" ? "highlighted text only" : "full tab"}...`
    );
    const data = await requestQuiz({ apiKey, model, sourceChunks });
    renderQuiz(data, sourceOrigin, sourceChunks);
    setStatus("Quiz complete.", "success-plain");
    trackAnalyticsEvent("quiz_generated");
  } catch (error) {
    setStatus(error.message || "Unexpected error.", "error");
  } finally {
    setBusy(false);
  }
}

async function getActiveTabText() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  if (!activeTab || typeof activeTab.id !== "number") {
    throw new Error("Could not access active tab.");
  }

  const tabUrl = activeTab.url || activeTab.pendingUrl || "";
  if (isRestrictedTabUrl(tabUrl)) {
    throw new Error(getRestrictedTabMessage(tabUrl));
  }

  let result;
  try {
    result = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: extractReadableTextFromPage
    });
  } catch (error) {
    const message = (error && error.message) || String(error || "");
    if (
      message.includes("Cannot access contents of url") ||
      message.includes("Cannot access a chrome:// URL") ||
      message.includes("Missing host permission")
    ) {
      throw new Error(
        "Chrome blocked access to this page. Open a normal web page (http/https) and try again."
      );
    }
    throw error;
  }

  return result?.[0]?.result || "";
}

function isRestrictedTabUrl(url) {
  if (!url) {
    return false;
  }

  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("devtools://") ||
    url.startsWith("file://") ||
    url.includes("chromewebstore.google.com")
  );
}

function getRestrictedTabMessage(url) {
  if (url.startsWith("file://")) {
    return "This is a local file tab. Enable 'Allow access to file URLs' in extension details, then try again.";
  }
  return "This tab type cannot be read by extensions. Use a normal webpage (http/https).";
}

function extractReadableTextFromPage() {
  const blockedTags = ["script", "style", "noscript", "svg", "img", "video"];
  const root = document.body?.cloneNode(true);
  if (!root) {
    return "";
  }

  blockedTags.forEach((tag) => {
    root.querySelectorAll(tag).forEach((el) => el.remove());
  });

  const sections = root.querySelectorAll(
    "article, main, section, h1, h2, h3, h4, h5, p, li, blockquote"
  );

  let combined = "";
  if (sections.length > 0) {
    combined = Array.from(sections)
      .map((el) => (el.textContent || "").trim())
      .filter((t) => t.length > 0)
      .join("\n");
  } else {
    combined = (root.innerText || "").trim();
  }

  return combined.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function splitLongSourceBlock(block, maxChars) {
  if (block.length <= maxChars) {
    return [block];
  }

  const sentences = block.split(/(?<=[.!?])\s+/).filter((s) => s && s.trim());
  if (!sentences.length) {
    const parts = [];
    for (let start = 0; start < block.length; start += maxChars) {
      parts.push(block.slice(start, start + maxChars));
    }
    return parts;
  }

  const parts = [];
  let current = "";
  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) {
      parts.push(current);
    }
    current = sentence.length > maxChars ? sentence.slice(0, maxChars) : sentence;
  }
  if (current) {
    parts.push(current);
  }
  return parts;
}

function buildSourceChunks(sourceText) {
  const cleaned = String(sourceText || "").replace(/\r/g, "").trim();
  if (!cleaned) {
    return [];
  }

  const rawBlocks = cleaned
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const candidateBlocks = [];
  rawBlocks.forEach((block) => {
    splitLongSourceBlock(block, SOURCE_CHUNK_MAX_CHARS).forEach((part) => {
      const trimmed = part.trim();
      if (trimmed) {
        candidateBlocks.push(trimmed);
      }
    });
  });

  if (!candidateBlocks.length) {
    return [];
  }

  const chunks = [];
  let current = "";
  candidateBlocks.forEach((block) => {
    const merged = current ? `${current}\n${block}` : block;
    if (merged.length <= SOURCE_CHUNK_MAX_CHARS) {
      current = merged;
      return;
    }
    if (current) {
      chunks.push(current);
    }
    current = block;
  });
  if (current) {
    chunks.push(current);
  }

  const limited = chunks.slice(0, MAX_SOURCE_CHUNKS);
  return limited.map((text, index) => ({
    id: `S${index + 1}`,
    text
  }));
}

function formatSourceChunksForPrompt(sourceChunks) {
  return sourceChunks
    .map((chunk) => `${chunk.id}: ${chunk.text}`)
    .join("\n\n");
}

function buildCitationLookup(sourceChunks) {
  const lookup = new Map();
  sourceChunks.forEach((chunk) => {
    lookup.set(chunk.id, chunk.text);
  });
  return lookup;
}

function normalizeCitationIds(rawIds, citationLookup) {
  if (!Array.isArray(rawIds) || !citationLookup || citationLookup.size === 0) {
    return [];
  }
  const unique = [];
  const seen = new Set();
  rawIds.forEach((id) => {
    const normalized = String(id || "").trim().toUpperCase();
    if (!normalized || seen.has(normalized)) {
      return;
    }
    if (!citationLookup.has(normalized)) {
      return;
    }
    seen.add(normalized);
    unique.push(normalized);
  });
  return unique;
}

function getCitationAnchorId(citationId) {
  const normalized = String(citationId || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
  return `citation-${normalized || "unknown"}`;
}

function renderCitationTagsHtml(citationIds) {
  if (!citationIds.length) {
    return `<span class="citation-pill empty">No citation returned</span>`;
  }

  return citationIds
    .map((id) => {
      const anchorId = getCitationAnchorId(id);
      return `<a class="citation-pill citation-jump" href="#${anchorId}" data-citation-id="${escapeHtml(
        id
      )}">${escapeHtml(id)}</a>`;
    })
    .join("");
}

function buildCitationViewHtml(usedCitationIds, citationLookup) {
  if (!citationLookup || citationLookup.size === 0) {
    return "";
  }

  const validIds = usedCitationIds.filter((id) => citationLookup.has(id));
  if (!validIds.length) {
    return `<section class="citation-view"><h3>Source Citation View</h3><p>No citations were returned.</p></section>`;
  }

  const itemsHtml = validIds
    .map((id) => {
      const sourceText = citationLookup.get(id) || "";
      const anchorId = getCitationAnchorId(id);
      return `
        <details class="citation-item" id="${anchorId}" data-citation-id="${escapeHtml(id)}">
          <summary>${escapeHtml(id)}</summary>
          <p>${escapeHtml(sourceText)}</p>
        </details>
      `;
    })
    .join("");

  return `
    <section class="citation-view">
      <h3>Source Citation View</h3>
      ${itemsHtml}
    </section>
  `;
}

function attachCitationJumpInteractions() {
  const jumpLinks = outputEl.querySelectorAll(".citation-jump[data-citation-id]");
  jumpLinks.forEach((linkEl) => {
    linkEl.addEventListener("click", (event) => {
      event.preventDefault();
      const citationId = String(linkEl.dataset.citationId || "").trim().toUpperCase();
      if (!citationId) {
        return;
      }
      const targetId = getCitationAnchorId(citationId);
      const target = outputEl.querySelector(`#${targetId}`);
      if (!(target instanceof HTMLDetailsElement)) {
        return;
      }

      target.open = true;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.remove("citation-target-flash");
      void target.offsetWidth;
      target.classList.add("citation-target-flash");

      const summary = target.querySelector("summary");
      if (summary instanceof HTMLElement) {
        summary.focus({ preventScroll: true });
      }
    });
  });
}

function normalizeExplainMode(mode) {
  return ["student", "beginner", "exam", "analogy", "mnemonic"].includes(mode)
    ? mode
    : DEFAULT_EXPLAIN_MODE;
}

function getExplainModeLabel(mode) {
  const normalized = normalizeExplainMode(mode);
  if (normalized === "beginner") {
    return "Beginner";
  }
  if (normalized === "exam") {
    return "Exam-focused";
  }
  if (normalized === "analogy") {
    return "Analogy mode";
  }
  if (normalized === "mnemonic") {
    return "Mnemonic mode";
  }
  return "Balanced student mode";
}

function getExplainModeInstruction(mode) {
  const normalized = normalizeExplainMode(mode);
  if (normalized === "beginner") {
    return "Use simple language, define key terms clearly, and avoid jargon where possible.";
  }
  if (normalized === "exam") {
    return "Focus on high-yield facts, likely testable points, and concise exam-ready wording.";
  }
  if (normalized === "analogy") {
    return "Use one or two clear analogies that map directly to the concept.";
  }
  if (normalized === "mnemonic") {
    return "Provide practical memory hooks and at least one short mnemonic.";
  }
  return "Balance clarity and depth for students, with practical examples when useful.";
}

function getExplainModeHardRequirements(mode) {
  const normalized = normalizeExplainMode(mode);
  if (normalized === "beginner") {
    return [
      "Use short, plain sentences and define difficult terms immediately.",
      "Keep simple_explanation <= 120 words.",
      "Avoid dense technical wording where possible."
    ];
  }
  if (normalized === "exam") {
    return [
      "Prioritize high-yield, testable points.",
      "Provide at least 3 concise exam_focus bullets.",
      "Use crisp wording suitable for revision notes."
    ];
  }
  if (normalized === "analogy") {
    return [
      "Provide at least one concrete analogy in the analogy field.",
      "Map each analogy back to the original concept clearly.",
      "Keep analogy practical and easy to visualize."
    ];
  }
  if (normalized === "mnemonic") {
    return [
      "Provide a memorable memory_hook (acronym, phrase, or chunking trick).",
      "Explain how to use the memory_hook for recall.",
      "Make the hook short enough to remember quickly."
    ];
  }
  return [
    "Balance clarity and depth for an average student.",
    "Keep explanation practical and digestible.",
    "Avoid unnecessary complexity."
  ];
}

async function requestSummary({ apiKey, model, sourceChunks }) {
  const systemPrompt =
    "You are a study assistant. Return strict JSON only. No markdown, no prose outside JSON.";
  const sourceChunkText = formatSourceChunksForPrompt(sourceChunks);

  const userPrompt = `
Input text from a web page, split into citeable source chunks:
${sourceChunkText}

Create a concise study summary in JSON with this exact shape:
{
  "title": "string",
  "topics": [
    {
      "name": "string",
      "key_points": ["string", "string"],
      "citations": ["S1", "S2"]
    }
  ],
  "quick_recap": ["string", "string", "string"]
}

Rules:
- Choose the number of topics dynamically based on the content depth and breadth.
- Each topic: 2 to 4 key points.
- Keep points short, clear, and easy for students to digest.
- Group related ideas into the same topic and separate unrelated ideas into different topics.
- Use topic names that sound like study notes headings.
- If text quality is low, still infer best-effort topics.
- For each topic, include 1 to 3 citation IDs from the source chunks.
- Citation IDs must only come from the provided IDs (S1, S2, ...).
`.trim();

  return requestOpenAiJson({
    apiKey,
    model,
    systemPrompt,
    userPrompt,
    maxOutputTokens: SUMMARY_MAX_OUTPUT_TOKENS
  });
}

async function requestQuiz({ apiKey, model, sourceChunks }) {
  const systemPrompt =
    "You are a quiz generator for studying. Return strict JSON only. No markdown.";
  const sourceChunkText = formatSourceChunksForPrompt(sourceChunks);

  const userPrompt = `
Input text from a web page, split into citeable source chunks:
${sourceChunkText}

Create an active recall quiz in JSON with this exact shape:
{
  "quiz_title": "string",
  "questions": [
    {
      "topic": "string",
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "string",
      "explanation": "string",
      "citations": ["S1", "S3"]
    }
  ]
}

Rules:
- Exactly 10 multiple-choice questions.
- Exactly 4 options per question.
- Include a short topic label for each question.
- The answer must match one option exactly.
- Keep explanations short and accurate.
- For each question, include 1 to 2 citation IDs.
- Citation IDs must only come from the provided IDs (S1, S2, ...).
`.trim();

  return requestOpenAiJson({
    apiKey,
    model,
    systemPrompt,
    userPrompt,
    maxOutputTokens: QUIZ_MAX_OUTPUT_TOKENS
  });
}

async function requestMindmap({ apiKey, model, sourceText }) {
  const systemPrompt =
    "You are a study mindmap builder. Return strict JSON only. No markdown, no prose outside JSON.";

  const userPrompt = `
Source study content:
${sourceText}

Create a study mindmap in JSON with this exact shape:
{
  "central_topic": "string",
  "branches": [
    {
      "name": "string",
      "children": [
        {
          "name": "string",
          "children": [
            { "name": "string" }
          ]
        }
      ]
    }
  ]
}

Rules:
- Choose number of branches dynamically based on the content.
- Use short labels (1 to 8 words).
- Group related concepts into the same branch.
- Keep hierarchy meaningful and easy for students to scan.
- Include up to 3 levels deep under central topic.
`.trim();

  return requestOpenAiJson({
    apiKey,
    model,
    systemPrompt,
    userPrompt,
    maxOutputTokens: MINDMAP_MAX_OUTPUT_TOKENS
  });
}

async function runSelectionExplainFlow() {
  setBusy(true);

  try {
    const settings = await chrome.storage.local.get(["openaiApiKey", "model"]);
    const apiKey = (settings.openaiApiKey || "").trim();
    const model = (settings.model || DEFAULT_MODEL).trim();

    if (!apiKey) {
      setStatus("Missing API key. Open Settings and add it.", "error");
      return;
    }

    const selectedText = (latestSelection?.text || "").trim().slice(0, MAX_SELECTION_CHARS);
    if (selectedText.length < MIN_SELECTION_CHARS) {
      setStatus("Highlight text on the webpage to ask about it.", "error");
      return;
    }

    const sourceContext = (latestSelection?.context || "").trim().slice(0, 1400);
    const prompt = (selectionPromptInput?.value || "").trim();
    const explainMode = normalizeExplainMode(explainModeSelect?.value);
    const explainModeLabel = getExplainModeLabel(explainMode);
    const userQuestion =
      prompt || "Explain this clearly for a student and simplify difficult terms.";

    setStatus(`Explaining highlighted section (${explainModeLabel})...`);
    const data = await requestSelectionExplain({
      apiKey,
      model,
      selectedText,
      context: sourceContext,
      userQuestion,
      explainMode
    });
    renderSelectionExplain(data, selectedText, explainMode);
    setStatus("Highlight explanation complete.", "success-plain");
    trackAnalyticsEvent("explain_requested");
  } catch (error) {
    setStatus(error.message || "Unexpected error.", "error");
  } finally {
    setBusy(false);
  }
}

async function requestSelectionExplain({
  apiKey,
  model,
  selectedText,
  context,
  userQuestion,
  explainMode
}) {
  const systemPrompt =
    "You are a patient study tutor. Return strict JSON only. No markdown, no prose outside JSON.";
  const modeLabel = getExplainModeLabel(explainMode);
  const modeInstruction = getExplainModeInstruction(explainMode);
  const modeRules = getExplainModeHardRequirements(explainMode)
    .map((rule) => `- ${rule}`)
    .join("\n");

  const userPrompt = `
Primary source text from the webpage:
${selectedText}

Surrounding context from the same page (optional):
${context || "(none)"}

User request:
${userQuestion}

Explain mode:
${modeLabel}

Mode instruction:
${modeInstruction}

Hard requirements (must follow):
${modeRules}

Return JSON with this exact shape:
{
  "focus_topic": "string",
  "simple_explanation": "string",
  "why_it_matters": "string",
  "style_applied": "string",
  "analogy": "string",
  "memory_hook": "string",
  "exam_focus": ["string", "string", "string"],
  "key_terms": [
    { "term": "string", "meaning": "string" }
  ],
  "check_understanding": ["string", "string"]
}

Rules:
- Make the explanation easy for students to digest.
- Keep definitions clear and plain-language.
- Keep response concise but complete for the selected text.
- Follow the mode instruction strictly.
- style_applied must explicitly mention the selected explain mode label.
- If mode is Analogy mode, analogy must not be empty.
- If mode is Mnemonic mode, memory_hook must not be empty.
- If mode is Exam-focused, exam_focus must contain at least 3 bullets.
- For other modes, optional fields can be empty strings or empty arrays.
`.trim();

  return requestOpenAiJson({
    apiKey,
    model,
    systemPrompt,
    userPrompt,
    maxOutputTokens: EXPLAIN_MAX_OUTPUT_TOKENS
  });
}

async function requestOpenAiJson({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  maxOutputTokens
}) {
  const latexInstruction =
    "When mathematical notation is useful, write it in LaTeX delimiters ($...$ for inline, $$...$$ for block). Keep output valid JSON.";
  const finalSystemPrompt = `${systemPrompt}\n\n${latexInstruction}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_output_tokens: maxOutputTokens,
      reasoning: { effort: DEFAULT_REASONING_EFFORT },
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: finalSystemPrompt }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }]
        }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const message =
      data?.error?.message || `OpenAI request failed (${response.status}).`;
    throw new Error(message);
  }

  const rawText = extractResponseText(data);
  if (!rawText) {
    throw new Error("No text returned from model.");
  }

  const parsed = parseJsonFromModelText(rawText);
  if (parsed === null) {
    throw new Error("Model returned non-JSON output. Try again.");
  }
  return parsed;
}

function extractResponseText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data?.output)) {
    return "";
  }

  const chunks = [];
  for (const item of data.output) {
    if (!Array.isArray(item?.content)) {
      continue;
    }
    for (const part of item.content) {
      if (typeof part?.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function parseJsonFromModelText(rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    return null;
  }

  const candidates = [];
  const direct = stripFenceWrappers(text);
  if (direct) {
    candidates.push(direct);
  }

  const fencedBlocks = extractFencedBlocks(text);
  fencedBlocks.forEach((block) => {
    const cleaned = stripFenceWrappers(block);
    if (cleaned) {
      candidates.push(cleaned);
    }
  });

  const balancedFromText = extractBalancedJsonSegment(text);
  if (balancedFromText) {
    candidates.push(balancedFromText);
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try next candidate.
    }

    const balanced = extractBalancedJsonSegment(candidate);
    if (!balanced) {
      continue;
    }
    try {
      return JSON.parse(balanced);
    } catch {
      // Continue until a valid candidate is found.
    }
  }

  return null;
}

function stripFenceWrappers(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
}

function extractFencedBlocks(text) {
  const blocks = [];
  const pattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match;
  while ((match = pattern.exec(String(text || ""))) !== null) {
    blocks.push(match[1] || "");
  }
  return blocks;
}

function extractBalancedJsonSegment(text) {
  const source = String(text || "");
  let start = -1;
  let stack = [];
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (ch === "\\") {
        escapeNext = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (start === -1) {
      if (ch === "{" || ch === "[") {
        start = i;
        stack = [ch];
      }
      continue;
    }

    if (ch === "{" || ch === "[") {
      stack.push(ch);
      continue;
    }

    if (ch === "}" || ch === "]") {
      const open = stack[stack.length - 1];
      const matching =
        (open === "{" && ch === "}") ||
        (open === "[" && ch === "]");
      if (!matching) {
        return null;
      }
      stack.pop();
      if (stack.length === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return null;
}

function renderSelectionExplain(data, selectedText, explainMode = DEFAULT_EXPLAIN_MODE) {
  const topic = escapeHtml(data?.focus_topic || "Highlighted Section");
  const explanation = formatModelText(data?.simple_explanation || "No explanation generated.");
  const whyMatters = formatModelText(data?.why_it_matters || "");
  const styleApplied = formatModelText(data?.style_applied || "");
  const analogy = formatModelText(data?.analogy || "");
  const memoryHook = formatModelText(data?.memory_hook || "");
  const examFocus = Array.isArray(data?.exam_focus) ? data.exam_focus : [];
  const modeLabel = escapeHtml(getExplainModeLabel(explainMode));
  const terms = Array.isArray(data?.key_terms) ? data.key_terms : [];
  const checks = Array.isArray(data?.check_understanding) ? data.check_understanding : [];

  const termsHtml = terms
    .map((item) => {
      const term = escapeHtml(item?.term || "Term");
      const meaning = formatModelText(item?.meaning || "");
      return `<li><strong>${term}:</strong> ${meaning}</li>`;
    })
    .join("");

  const checksHtml = checks.map((q) => `<li>${formatModelText(String(q))}</li>`).join("");
  const snippet = selectedText.length > 280
    ? `${escapeHtml(selectedText.slice(0, 280))}...`
    : escapeHtml(selectedText);

  outputEl.innerHTML = `
    <h2>${topic}</h2>
    <p class="source-note">Explain like: ${modeLabel}</p>
    <p><strong>Source (Highlighted text):</strong> ${snippet}</p>
    <p>${explanation}</p>
    ${styleApplied ? `<p><strong>Style applied:</strong> ${styleApplied}</p>` : ""}
    ${whyMatters ? `<p><strong>Why it matters:</strong> ${whyMatters}</p>` : ""}
    ${analogy ? `<p><strong>Analogy:</strong> ${analogy}</p>` : ""}
    ${memoryHook ? `<p><strong>Memory hook:</strong> ${memoryHook}</p>` : ""}
    ${
      examFocus.length
        ? `<h3>Exam Focus</h3><ul>${examFocus
            .map((item) => `<li>${formatModelText(String(item))}</li>`)
            .join("")}</ul>`
        : ""
    }
    <h3>Key Terms</h3>
    <ul>${termsHtml || "<li>No key terms generated.</li>"}</ul>
    <h3>Check Understanding</h3>
    <ul>${checksHtml || "<li>No follow-up questions generated.</li>"}</ul>
  `;
}

function renderMindmap(data) {
  const centralTopic = escapeHtml(data?.central_topic || "Study Topic");
  const branches = Array.isArray(data?.branches) ? data.branches : [];
  const branchesHtml = branches.map((node) => buildMindmapNodeHtml(node, 1)).join("");

  outputEl.innerHTML = `
    <h2>Mindmap: ${centralTopic}</h2>
    <div class="mindmap-tree">
      <ul class="mindmap-root">
        <li>
          <span class="mindmap-node central">${centralTopic}</span>
          <ul class="mindmap-topics">
            ${
              branchesHtml ||
              "<li><span class='mindmap-node depth-1'>No branches generated.</span></li>"
            }
          </ul>
        </li>
      </ul>
    </div>
  `;
}

function buildMindmapNodeHtml(node, depth) {
  const safeDepth = Math.min(Math.max(depth, 1), 4);
  const name = escapeHtml(
    typeof node?.name === "string" && node.name.trim() ? node.name : "Topic"
  );
  const children = Array.isArray(node?.children) ? node.children : [];
  const hasChildren = children.length > 0 && safeDepth < 5;

  if (!hasChildren) {
    return `
      <li class="mindmap-item depth-${safeDepth}">
        <span class="mindmap-node depth-${safeDepth} leaf">${name}</span>
      </li>
    `;
  }

  const childrenHtml = children.map((child) => buildMindmapNodeHtml(child, safeDepth + 1)).join("");
  return `
    <li class="mindmap-item depth-${safeDepth}">
      <details class="mindmap-branch depth-${safeDepth}">
        <summary>
          <span class="mindmap-node depth-${safeDepth}">${name}</span>
        </summary>
        <ul class="mindmap-children depth-${safeDepth + 1}">
          ${childrenHtml}
        </ul>
      </details>
    </li>
  `;
}

function buildSourceNoticeHtml(sourceOrigin) {
  if (sourceOrigin !== "highlight") {
    return "";
  }
  return `<p class="source-note">Generated from highlighted text only.</p>`;
}

function renderSummary(data, sourceOrigin = "tab", sourceChunks = []) {
  const title = formatModelText(data?.title || "Tab Summary");
  const topics = Array.isArray(data?.topics) ? data.topics : [];
  const recap = Array.isArray(data?.quick_recap) ? data.quick_recap : [];
  const citationLookup = buildCitationLookup(sourceChunks);
  const usedCitationIds = new Set();

  const topicsHtml = topics
    .map((topic) => {
      const name = escapeHtml(topic?.name || "Topic");
      const points = Array.isArray(topic?.key_points) ? topic.key_points : [];
      const pointsHtml = points.map((p) => `<li>${formatModelText(String(p))}</li>`).join("");
      const citationIds = normalizeCitationIds(topic?.citations, citationLookup);
      citationIds.forEach((id) => usedCitationIds.add(id));
      const citationTagsHtml = renderCitationTagsHtml(citationIds);
      return `
        <h3>${name}</h3>
        <div class="citation-tags">${citationTagsHtml}</div>
        <ul>${pointsHtml}</ul>
      `;
    })
    .join("");

  const recapHtml = recap.map((r) => `<li>${formatModelText(String(r))}</li>`).join("");
  const citationViewHtml = buildCitationViewHtml(Array.from(usedCitationIds), citationLookup);
  outputEl.innerHTML = `
    <h2>${title}</h2>
    ${buildSourceNoticeHtml(sourceOrigin)}
    ${topicsHtml || "<p>No topics were generated.</p>"}
    <h3>Quick Recap</h3>
    <ul>${recapHtml || "<li>No recap generated.</li>"}</ul>
    ${citationViewHtml}
  `;
  attachCitationJumpInteractions();
}

function renderQuiz(data, sourceOrigin = "tab", sourceChunks = []) {
  const title = formatModelText(data?.quiz_title || "Practice Quiz");
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  const citationLookup = buildCitationLookup(sourceChunks);
  const usedCitationIds = new Set();
  const html = questions
    .map((q, index) => {
      const topic = escapeHtml(getQuestionTopic(q, index));
      const question = formatModelText(q?.question || `Question ${index + 1}`);
      const options = Array.isArray(q?.options) ? q.options : [];
      const citationIds = normalizeCitationIds(q?.citations, citationLookup);
      citationIds.forEach((id) => usedCitationIds.add(id));
      const citationTagsHtml = renderCitationTagsHtml(citationIds);
      const optionsHtml = options
        .map((opt, optionIndex) => {
          const optionText = String(opt);
          const safeOption = escapeHtml(optionText);
          const optionLabel = formatModelText(optionText);
          return `
            <label class="quiz-option">
              <input
                type="radio"
                name="q-${index}"
                value="${safeOption}"
                data-option-index="${optionIndex}"
              />
              <span>${optionLabel}</span>
            </label>
          `;
        })
        .join("");

      return `
        <article class="quiz-item" data-question-index="${index}">
          <div class="quiz-topic">${topic}</div>
          <strong>${index + 1}. ${question}</strong>
          <div class="citation-tags">${citationTagsHtml}</div>
          <div class="quiz-options">${optionsHtml}</div>
          <button class="check-answer-btn" data-question-index="${index}" type="button">
            Check Answer
          </button>
          <div class="quiz-feedback" id="feedback-${index}"></div>
        </article>
      `;
    })
    .join("");
  const citationViewHtml = buildCitationViewHtml(Array.from(usedCitationIds), citationLookup);

  outputEl.innerHTML = `
    <h2>${title}</h2>
    ${buildSourceNoticeHtml(sourceOrigin)}
    ${html || "<p>No quiz generated.</p>"}
    <section id="quizResultSummary" class="quiz-summary hidden"></section>
    ${citationViewHtml}
  `;
  attachCitationJumpInteractions();
  attachQuizInteractions(questions);
}

function attachQuizInteractions(questions) {
  const quizState = {
    right: 0,
    wrong: 0,
    answeredIndices: new Set(),
    wrongByTopic: new Map(),
    wrongQuestionIndices: new Set(),
    followupOutputHtml: "",
    analyticsRecorded: false
  };

  const checkButtons = outputEl.querySelectorAll(".check-answer-btn");
  checkButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.questionIndex);
      const question = questions[index];
      if (!question) {
        return;
      }

      const selectedOption = outputEl.querySelector(`input[name="q-${index}"]:checked`);
      const feedbackEl = outputEl.querySelector(`#feedback-${index}`);
      if (!feedbackEl) {
        return;
      }

      if (!selectedOption) {
        feedbackEl.innerHTML = `<p class="quiz-feedback-text warning">Select an answer first.</p>`;
        return;
      }

      const selected = selectedOption.value;
      const answer = String(question.answer || "");
      const explanationText = String(question.explanation || "");
      const explanation = formatModelText(explanationText);
      const isCorrect = selected === answer;
      const topic = getQuestionTopic(question, index);

      if (!quizState.answeredIndices.has(index)) {
        quizState.answeredIndices.add(index);
        if (isCorrect) {
          quizState.right += 1;
        } else {
          quizState.wrong += 1;
          quizState.wrongByTopic.set(topic, (quizState.wrongByTopic.get(topic) || 0) + 1);
          quizState.wrongQuestionIndices.add(index);
        }
      }

      feedbackEl.innerHTML = `
        <p class="quiz-feedback-text ${isCorrect ? "correct" : "incorrect"}">
          ${isCorrect ? "Correct." : "Not quite."}
        </p>
        <p><strong>Correct answer:</strong> ${formatModelText(answer || "N/A")}</p>
        ${explanationText ? `<p><strong>Explanation:</strong> ${explanation}</p>` : ""}
      `;

      outputEl
        .querySelectorAll(`input[name="q-${index}"]`)
        .forEach((input) => (input.disabled = true));
      button.disabled = true;
      updateQuizSummary(quizState, questions.length, questions);
    });
  });
}

function getQuestionTopic(question, index) {
  if (typeof question?.topic === "string" && question.topic.trim()) {
    return question.topic.trim();
  }

  if (typeof question?.question === "string" && question.question.trim()) {
    return question.question.trim().slice(0, 48);
  }

  return `Topic ${index + 1}`;
}

function updateQuizSummary(quizState, totalQuestions, questions) {
  const summaryEl = outputEl.querySelector("#quizResultSummary");
  if (!summaryEl || quizState.answeredIndices.size === 0) {
    return;
  }

  const answered = quizState.right + quizState.wrong;
  const accuracy = answered > 0 ? Math.round((quizState.right / answered) * 100) : 0;
  if (answered === totalQuestions && !quizState.analyticsRecorded) {
    quizState.analyticsRecorded = true;
    trackAnalyticsEvent("quiz_session_completed", {
      right: quizState.right,
      wrong: quizState.wrong
    });
  }
  const needsMore = accuracy < 70 || quizState.wrong >= 3;
  const greatResult = answered === totalQuestions && accuracy >= 80;
  const topWeakTopics = getSortedWeakTopics(quizState).slice(0, 3);
  const weakTopicsHtml = topWeakTopics
    .map(([topic, count]) => `<li>${escapeHtml(topic)} (${count} missed)</li>`)
    .join("");
  const previousPrompt = summaryEl.querySelector("#quizFollowupInput")?.value || "";

  let performanceMessage = "Good progress. Keep going.";
  if (greatResult) {
    performanceMessage = "Great results. You are doing a strong job.";
  } else if (needsMore) {
    performanceMessage = "You should review a few areas more deeply.";
  }

  const followUpText = needsMore
    ? "Need further explanation on these weak areas? Highlight text and tap Ask Your Buddy."
    : "Want a deeper explanation anyway? Highlight a section and tap Ask Your Buddy.";

  summaryEl.classList.remove("hidden");
  summaryEl.classList.toggle("low-score", accuracy < 80);
  summaryEl.classList.toggle("high-score", accuracy >= 80);
  summaryEl.innerHTML = `
    <h3>Quiz Progress</h3>
    <p><strong>Right:</strong> ${quizState.right} | <strong>Wrong:</strong> ${quizState.wrong}</p>
    <p><strong>Answered:</strong> ${answered}/${totalQuestions} | <strong>Accuracy:</strong> ${accuracy}%</p>
    <p class="quiz-summary-message">${performanceMessage}</p>
    ${
      topWeakTopics.length
        ? `<h4>Study these topics next</h4><ul>${weakTopicsHtml}</ul>`
        : ""
    }
    <p class="quiz-summary-followup">${followUpText}</p>
    <label class="quiz-followup-label" for="quizFollowupInput">Ask your buddy about this quiz</label>
    <textarea
      id="quizFollowupInput"
      class="quiz-followup-input"
      rows="3"
      placeholder="Example: Explain why I keep getting Topic X wrong and what I should review first."
    ></textarea>
    <button id="quizFollowupBtn" class="tertiary" type="button">Ask Your Buddy</button>
    <div id="quizFollowupOutput" class="quiz-followup-output"></div>
  `;

  const inputEl = summaryEl.querySelector("#quizFollowupInput");
  if (inputEl) {
    inputEl.value = previousPrompt;
  }
  if (quizState.followupOutputHtml) {
    const followupOutputEl = summaryEl.querySelector("#quizFollowupOutput");
    if (followupOutputEl) {
      followupOutputEl.innerHTML = quizState.followupOutputHtml;
    }
  }

  attachQuizFollowupPromptHandler({
    summaryEl,
    quizState,
    totalQuestions,
    questions,
    topWeakTopics
  });
}

function getSortedWeakTopics(quizState) {
  return Array.from(quizState.wrongByTopic.entries()).sort((a, b) => b[1] - a[1]);
}

function attachQuizFollowupPromptHandler({
  summaryEl,
  quizState,
  totalQuestions,
  questions,
  topWeakTopics
}) {
  const askBtn = summaryEl.querySelector("#quizFollowupBtn");
  const promptInput = summaryEl.querySelector("#quizFollowupInput");
  const followupOutputEl = summaryEl.querySelector("#quizFollowupOutput");
  if (!askBtn || !promptInput || !followupOutputEl) {
    return;
  }

  askBtn.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      followupOutputEl.innerHTML =
        "<p class='quiz-followup-error'>Enter a question first.</p>";
      return;
    }

    askBtn.disabled = true;
    followupOutputEl.innerHTML = "<p>Thinking...</p>";

    try {
      const settings = await chrome.storage.local.get(["openaiApiKey", "model"]);
      const apiKey = (settings.openaiApiKey || "").trim();
      const model = (settings.model || DEFAULT_MODEL).trim();
      if (!apiKey) {
        throw new Error("Missing API key. Open Settings and add it.");
      }

      const weakTopicsText = topWeakTopics.length
        ? topWeakTopics.map(([topic, count]) => `${topic} (${count} missed)`).join(", ")
        : "No clear weak topics yet";
      const wrongQuestionsText = Array.from(quizState.wrongQuestionIndices)
        .slice(0, 4)
        .map((index) => String(questions[index]?.question || `Question ${index + 1}`))
        .join(" | ");

      const data = await requestQuizFollowup({
        apiKey,
        model,
        userPrompt: prompt,
        right: quizState.right,
        wrong: quizState.wrong,
        totalQuestions,
        weakTopicsText,
        wrongQuestionsText
      });

      const tutorResponse = formatModelText(data?.tutor_response || "No response generated.");
      const reviewPlan = Array.isArray(data?.review_plan) ? data.review_plan : [];
      const planHtml = reviewPlan
        .map((step) => `<li>${formatModelText(String(step))}</li>`)
        .join("");

      const html = `
        <p><strong>Buddy:</strong> ${tutorResponse}</p>
        <h4>Suggested Review Plan</h4>
        <ul>${planHtml || "<li>No plan generated.</li>"}</ul>
      `;
      quizState.followupOutputHtml = html;
      followupOutputEl.innerHTML = html;
    } catch (error) {
      followupOutputEl.innerHTML = `
        <p class="quiz-followup-error">${escapeHtml(error.message || "Unexpected error.")}</p>
      `;
    } finally {
      askBtn.disabled = false;
    }
  });
}

async function requestQuizFollowup({
  apiKey,
  model,
  userPrompt,
  right,
  wrong,
  totalQuestions,
  weakTopicsText,
  wrongQuestionsText
}) {
  const systemPrompt =
    "You are a supportive study coach. Return strict JSON only. No markdown or extra prose.";

  const userPromptText = `
Quiz performance:
- Right: ${right}
- Wrong: ${wrong}
- Total: ${totalQuestions}

Weak topics:
${weakTopicsText}

Examples of missed questions:
${wrongQuestionsText || "(none)"}

User request:
${userPrompt}

Return JSON with this exact shape:
{
  "tutor_response": "string",
  "review_plan": ["string", "string", "string"]
}

Rules:
- Be concrete and topic-focused.
- Keep tone supportive and practical.
- Make review plan actionable for the next study session.
`.trim();

  return requestOpenAiJson({
    apiKey,
    model,
    systemPrompt,
    userPrompt: userPromptText,
    maxOutputTokens: QUIZ_FOLLOWUP_MAX_OUTPUT_TOKENS
  });
}
