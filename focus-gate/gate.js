import {
  MIN_INTENT_LENGTH,
  PERSONAL_DURATIONS,
  WORK_DURATIONS,
  formatMinutes,
  matchSite,
  sessionActive,
} from './lib/common.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const target = safeTarget(params.get('to'));

const REASONS = {
  'time-up': 'Your session is over. Decide again if you still need to be here.',
  limit: "You've used all of today's personal time.",
  ended: 'You ended your session.',
};

const choice = { work: WORK_DURATIONS[1], personal: PERSONAL_DURATIONS[0] };

// Only ever send the user back to a normal web page.
function safeTarget(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

async function send(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error ?? 'Something went wrong.');
  return response.result;
}

function renderChips(container, durations, mode, maxMinutes = Infinity) {
  container.replaceChildren();
  const allowed = durations.filter((m) => m <= maxMinutes);
  if (!allowed.includes(choice[mode])) choice[mode] = allowed[0] ?? Math.floor(maxMinutes);
  // If there's less left than the smallest option, offer exactly what's left.
  const options = allowed.length ? allowed : maxMinutes >= 1 ? [Math.floor(maxMinutes)] : [];
  for (const minutes of options) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = `${minutes} min`;
    chip.setAttribute('aria-pressed', String(minutes === choice[mode]));
    chip.addEventListener('click', () => {
      choice[mode] = minutes;
      for (const c of container.children) c.setAttribute('aria-pressed', String(c === chip));
    });
    container.append(chip);
  }
}

// Make the user wait a few seconds before they can continue.
function pause(buttons, seconds) {
  const labels = buttons.map((b) => b.textContent);
  let left = seconds;
  const update = () => {
    buttons.forEach((b, i) => {
      if (b.dataset.blocked) return;
      b.disabled = left > 0;
      b.textContent = left > 0 ? `Take a breath… ${left}` : labels[i];
    });
  };
  update();
  const timer = setInterval(() => {
    left -= 1;
    update();
    if (left <= 0) clearInterval(timer);
  }, 1000);
}

function goToTarget() {
  if (target) location.replace(target);
  else window.history.back();
}

async function closeTab() {
  const tab = await chrome.tabs.getCurrent();
  if (tab) await chrome.tabs.remove(tab.id);
}

async function start(mode) {
  const errorEl = $(`${mode}-error`);
  errorEl.textContent = '';
  const intent = $('intent').value.trim();
  if (mode === 'work' && intent.length < MIN_INTENT_LENGTH) {
    errorEl.textContent = 'Write down what the work is first.';
    $('intent').focus();
    return;
  }
  try {
    await send({ type: 'start', mode, minutes: choice[mode], intent: mode === 'work' ? intent : '' });
    goToTarget();
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function init() {
  const { settings, session, days, today, personalBlocked } = await send({ type: 'status' });

  // A session may have been started from another tab in the meantime. (The
  // status call already ended any session that ran out.)
  if (sessionActive(session) && target) {
    goToTarget();
    return;
  }

  const site = matchSite(target, settings.sites);
  $('site').textContent = site ?? 'this site';
  document.title = `Pause — ${site ?? 'Focus Gate'}`;

  const reason = REASONS[params.get('reason')];
  if (reason) {
    $('reason').textContent = reason;
    $('reason').hidden = false;
  }

  const remainingSec = Math.max(0, settings.personalLimitMin * 60 - today.personalSec);
  $('stat-personal').textContent = formatMinutes(remainingSec);
  $('stat-work').textContent = formatMinutes(today.workSec);
  $('stat-resisted').textContent = String(today.resisted);

  // Offer recent work intents so repeat tasks are quick to restate.
  const recent = new Set();
  for (const key of Object.keys(days).sort().reverse()) {
    for (const entry of [...days[key].log].reverse()) {
      if (entry.mode === 'work' && entry.intent) recent.add(entry.intent);
    }
  }
  $('recent-intents').replaceChildren(
    ...[...recent].slice(0, 8).map((intent) => Object.assign(document.createElement('option'), { value: intent })),
  );

  renderChips($('work-chips'), WORK_DURATIONS, 'work');

  const personalButton = $('start-personal');
  if (personalBlocked) {
    $('personal-note').textContent = `It's work hours (${settings.workHours.start}–${settings.workHours.end}). Personal browsing opens up after.`;
    personalButton.disabled = true;
    personalButton.dataset.blocked = 'true';
  } else if (remainingSec < 30) {
    $('personal-note').textContent = "You've used today's personal time. It resets at midnight.";
    personalButton.disabled = true;
    personalButton.dataset.blocked = 'true';
  } else {
    $('personal-note').textContent = `Counts against your ${settings.personalLimitMin}-minute daily allowance.`;
    renderChips($('personal-chips'), PERSONAL_DURATIONS, 'personal', remainingSec / 60);
  }

  $('start-work').addEventListener('click', () => start('work'));
  personalButton.addEventListener('click', () => start('personal'));
  $('intent').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !$('start-work').disabled) start('work');
  });
  $('leave').addEventListener('click', async () => {
    const day = await send({ type: 'resisted' });
    $('gate').hidden = true;
    $('done').hidden = false;
    $('done-count').textContent =
      day.resisted === 1 ? 'That’s the first time you skipped it today.' : `That’s ${day.resisted} times you skipped it today.`;
  });
  $('close').addEventListener('click', closeTab);

  pause([$('start-work'), personalButton], settings.pauseSeconds);
  $('intent').focus();
}

init().catch((err) => {
  $('reason').textContent = err.message;
  $('reason').hidden = false;
});
