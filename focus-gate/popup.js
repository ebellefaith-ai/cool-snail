import { dayKey, emptyDay, formatCountdown, formatMinutes, sessionActive } from './lib/common.js';

const $ = (id) => document.getElementById(id);
let countdown;

async function send(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error ?? 'Something went wrong.');
  return response.result;
}

function renderSession(session) {
  clearInterval(countdown);
  const active = sessionActive(session);
  $('session').hidden = !active;
  $('no-session').hidden = active;
  if (!active) return;

  $('session').className = `card ${session.mode}`;
  $('session-label').textContent = session.mode === 'work' ? 'Work session' : 'Personal time';
  $('session-intent').textContent = session.intent;
  $('session-intent').hidden = !session.intent;
  const update = () => {
    const left = session.endsAt - Date.now();
    $('session-time').textContent = `${formatCountdown(left)} left`;
    if (left <= 0) refresh();
  };
  update();
  countdown = setInterval(update, 1000);
}

function renderWeek(days) {
  const cols = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    cols.push({ date, day: days[dayKey(date)] ?? emptyDay() });
  }
  const max = Math.max(15 * 60, ...cols.map(({ day }) => day.workSec + day.personalSec));
  $('week').replaceChildren(
    ...cols.map(({ date, day }) => {
      const wrap = document.createElement('div');
      const col = document.createElement('div');
      col.className = 'col';
      col.title = `${date.toLocaleDateString(undefined, { weekday: 'long' })}: work ${formatMinutes(day.workSec)}, personal ${formatMinutes(day.personalSec)}`;
      for (const [sec, color] of [
        [day.workSec, 'var(--work)'],
        [day.personalSec, 'var(--personal)'],
      ]) {
        const seg = document.createElement('span');
        seg.style.height = `${(sec / max) * 100}%`;
        seg.style.background = color;
        col.append(seg);
      }
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = date.toLocaleDateString(undefined, { weekday: 'narrow' });
      wrap.append(col, label);
      return wrap;
    }),
  );
}

function renderLog(today) {
  const items = today.log.map((entry) => {
    const li = document.createElement('li');
    const time = document.createElement('time');
    time.textContent = new Date(entry.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const text = document.createElement('span');
    text.textContent =
      entry.mode === 'work' ? `${entry.intent} (${entry.minutes} min)` : `Personal browsing (${entry.minutes} min)`;
    li.append(time, text);
    return li;
  });
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Nothing yet today.';
    items.push(li);
  }
  $('log').replaceChildren(...items.reverse());
}

async function refresh() {
  const { settings, session, days, today } = await send({ type: 'status' });
  renderSession(session);

  const limitSec = settings.personalLimitMin * 60;
  $('personal-text').textContent = `${formatMinutes(today.personalSec)} of ${settings.personalLimitMin} min`;
  $('personal-bar').style.width = `${Math.min(100, (today.personalSec / limitSec) * 100)}%`;
  $('work-text').textContent = formatMinutes(today.workSec);
  $('resisted-text').textContent = String(today.resisted);
  renderWeek(days);
  renderLog(today);
}

$('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('end').addEventListener('click', async () => {
  await send({ type: 'end' });
  refresh();
});

refresh();
