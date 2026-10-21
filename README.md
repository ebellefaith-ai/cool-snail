# Macro Tracker

A simple macro/calorie tracking app. Log foods with their calories, protein, carbs, and fat, set daily targets, and see progress bars for each day. Data is stored locally in the browser (`localStorage`) — no backend or account required.

## Features

- Log food entries with calories, protein, carbs, and fat
- Save frequently-eaten foods for one-tap quick-add
- Set and edit daily calorie/macro goals
- Progress bars comparing today's totals against goals
- Navigate between days to view or log past/future entries

## Development

```bash
npm install
npm run dev
```

```bash
npm run build   # type-check + production build
npm run lint     # oxlint
```

## Focus Gate (browser extension)

The [`focus-gate/`](focus-gate/) folder contains a separate Chrome/Edge extension that limits personal social media time and gates every visit behind a "work or personal?" check. See [`focus-gate/README.md`](focus-gate/README.md) for install steps.
