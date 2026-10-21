import {
  MIN_INTENT_LENGTH,
  dayKey,
  emptyDay,
  getDays,
  getSettings,
  matchSite,
  personalBlocked,
  pruneDays,
  sessionActive,
} from './lib/common.js';

const GATE_URL = chrome.runtime.getURL('gate.html');
const TICK_ALARM = 'tick';
const SESSION_END_ALARM = 'session-end';
// Never credit more than this per tick, so sleep/suspend gaps aren't counted as usage.
const MAX_GAP_MS = 2 * 60 * 1000;
const IDLE_SECONDS = 5 * 60;

// All state changes run one at a time so storage read-modify-writes don't race.
let queue = Promise.resolve();
function serial(fn) {
  const run = queue.then(fn);
  queue = run.catch((err) => console.error('[focus-gate]', err));
  return run;
}

async function getSession() {
  const { session = null } = await chrome.storage.local.get('session');
  return session;
}

async function updateToday(fn) {
  const days = await getDays();
  const key = dayKey();
  days[key] ??= emptyDay();
  fn(days[key]);
  await chrome.storage.local.set({ days: pruneDays(days) });
  return days[key];
}

async function getToday() {
  return (await getDays())[dayKey()] ?? emptyDay();
}

function gateUrl(to, reason) {
  const params = new URLSearchParams({ to });
  if (reason) params.set('reason', reason);
  return `${GATE_URL}?${params}`;
}

// A session lets you through only while it hasn't expired and, for personal
// sessions, while there is allowance left.
async function sessionAllowsAccess(session, settings) {
  if (!sessionActive(session)) return false;
  if (session.mode === 'personal') {
    const today = await getToday();
    if (today.personalSec >= settings.personalLimitMin * 60) return false;
  }
  return true;
}

// What the user is looking at right now, if it counts as social media time.
async function currentTarget(settings, session) {
  if (!sessionActive(session)) return null;
  const idle = await chrome.idle.queryState(IDLE_SECONDS);
  if (idle !== 'active') return null;
  const win = await chrome.windows.getLastFocused().catch(() => null);
  if (!win?.focused) return null;
  const [tab] = await chrome.tabs.query({ active: true, windowId: win.id });
  const site = matchSite(tab?.url, settings.sites);
  return site ? { site, mode: session.mode } : null;
}

// Credits the time since the last tick to whatever was being tracked, then
// records what is being looked at now.
async function accrue(settings, session) {
  const now = Date.now();
  const { tracking } = await chrome.storage.session.get('tracking');
  if (tracking?.site) {
    const sec = Math.min(now - tracking.since, MAX_GAP_MS) / 1000;
    if (sec > 0) {
      await updateToday((day) => {
        if (tracking.mode === 'work') day.workSec += sec;
        else day.personalSec += sec;
        day.sites[tracking.site] = (day.sites[tracking.site] ?? 0) + sec;
      });
    }
  }
  const target = await currentTarget(settings, session);
  await chrome.storage.session.set({ tracking: { since: now, ...target } });
}

async function gateTrackedTabs(settings, reason) {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs
      .filter((tab) => matchSite(tab.url, settings.sites))
      .map((tab) => chrome.tabs.update(tab.id, { url: gateUrl(tab.url, reason) }).catch(() => {})),
  );
}

async function endSession(settings, reason) {
  await chrome.storage.local.set({ session: null });
  await chrome.alarms.clear(SESSION_END_ALARM);
  await chrome.storage.session.set({ tracking: { since: Date.now() } });
  await gateTrackedTabs(settings, reason);
}

async function updateBadge(session) {
  if (!sessionActive(session)) {
    await chrome.action.setBadgeText({ text: '' });
    return;
  }
  const min = Math.ceil((session.endsAt - Date.now()) / 60000);
  await chrome.action.setBadgeText({ text: `${min}m` });
  await chrome.action.setBadgeBackgroundColor({
    color: session.mode === 'work' ? '#2f7d5b' : '#c2702a',
  });
}

function tick() {
  return serial(async () => {
    const settings = await getSettings();
    let session = await getSession();
    await accrue(settings, session);

    if (session) {
      if (!sessionActive(session)) {
        await endSession(settings, 'time-up');
        session = null;
      } else if (!(await sessionAllowsAccess(session, settings))) {
        await endSession(settings, 'limit');
        session = null;
      }
    }
    await updateBadge(session);
  });
}

async function startSession({ mode, minutes, intent }) {
  const settings = await getSettings();
  const today = await getToday();
  minutes = Math.round(Number(minutes));
  if (!(minutes >= 1 && minutes <= 240)) throw new Error('Pick a session length.');
  intent = String(intent ?? '').trim().slice(0, 140);

  if (mode === 'work') {
    if (intent.length < MIN_INTENT_LENGTH) throw new Error('Say what the work is first.');
  } else if (mode === 'personal') {
    if (personalBlocked(settings)) throw new Error('Personal browsing is off during work hours.');
    const remainingSec = settings.personalLimitMin * 60 - today.personalSec;
    if (remainingSec < 30) throw new Error("You've used today's personal time.");
    minutes = Math.min(minutes, Math.ceil(remainingSec / 60));
  } else {
    throw new Error('Unknown session type.');
  }

  // Close out whatever was being tracked under the previous session.
  await accrue(settings, await getSession());

  const now = Date.now();
  const session = { mode, intent, minutes, startedAt: now, endsAt: now + minutes * 60000 };
  await chrome.storage.local.set({ session });
  await updateToday((day) => day.log.push({ mode, intent, minutes, at: now }));
  await chrome.alarms.create(SESSION_END_ALARM, { when: session.endsAt });
  await accrue(settings, session);
  await updateBadge(session);
  return session;
}

async function status() {
  await tick();
  const settings = await getSettings();
  return {
    settings,
    session: await getSession(),
    days: await getDays(),
    today: await getToday(),
    personalBlocked: personalBlocked(settings),
  };
}

const handlers = {
  status: () => status(),
  start: (msg) => serial(() => startSession(msg)),
  end: () =>
    serial(async () => {
      const settings = await getSettings();
      await accrue(settings, await getSession());
      await endSession(settings, 'ended');
      await updateBadge(null);
    }),
  resisted: () => serial(() => updateToday((day) => (day.resisted += 1))),
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const handler = handlers[msg?.type];
  if (!handler) return false;
  handler(msg).then(
    (result) => sendResponse({ ok: true, result }),
    (err) => sendResponse({ ok: false, error: err.message }),
  );
  return true;
});

// Send any navigation to a tracked site through the gate unless a session covers it.
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  serial(async () => {
    const settings = await getSettings();
    if (!matchSite(details.url, settings.sites)) return;
    if (await sessionAllowsAccess(await getSession(), settings)) return;
    await chrome.tabs.update(details.tabId, { url: gateUrl(details.url) }).catch(() => {});
  });
});

async function setup() {
  await chrome.alarms.create(TICK_ALARM, { periodInMinutes: 0.5 });
  chrome.idle.setDetectionInterval(IDLE_SECONDS);
  await serial(async () => {
    const settings = await getSettings();
    if (!(await sessionAllowsAccess(await getSession(), settings))) {
      await gateTrackedTabs(settings);
    }
  });
  await tick();
}

chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);
chrome.alarms.onAlarm.addListener(() => tick());
chrome.tabs.onActivated.addListener(() => tick());
chrome.tabs.onUpdated.addListener((_id, change) => {
  if (change.url || change.status === 'complete') tick();
});
chrome.windows.onFocusChanged.addListener(() => tick());
chrome.idle.onStateChanged.addListener(() => tick());
