import { getSettings, normalizeSite } from './lib/common.js';

const $ = (id) => document.getElementById(id);
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function load() {
  const settings = await getSettings();
  $('sites').value = settings.sites.join('\n');
  $('limit').value = settings.personalLimitMin;
  $('pause').value = settings.pauseSeconds;
  $('wh-enabled').checked = settings.workHours.enabled;
  $('wh-start').value = settings.workHours.start;
  $('wh-end').value = settings.workHours.end;
  $('block-personal').checked = settings.blockPersonalDuringWork;
  $('wh-days').replaceChildren(
    ...DAY_NAMES.map((name, i) => {
      const label = document.createElement('label');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.value = String(i);
      box.checked = settings.workHours.days.includes(i);
      label.append(box, name);
      return label;
    }),
  );
}

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error').textContent = '';
  const sites = [...new Set($('sites').value.split('\n').map(normalizeSite).filter(Boolean))];
  const start = $('wh-start').value;
  const end = $('wh-end').value;
  if ($('wh-enabled').checked && start >= end) {
    $('error').textContent = 'Work hours must end after they start.';
    return;
  }
  await chrome.storage.local.set({
    settings: {
      sites,
      personalLimitMin: Number($('limit').value),
      pauseSeconds: Number($('pause').value),
      workHours: {
        enabled: $('wh-enabled').checked,
        start,
        end,
        days: [...$('wh-days').querySelectorAll('input:checked')].map((box) => Number(box.value)),
      },
      blockPersonalDuringWork: $('block-personal').checked,
    },
  });
  $('sites').value = sites.join('\n');
  $('saved').hidden = false;
  setTimeout(() => ($('saved').hidden = true), 2000);
});

load();
