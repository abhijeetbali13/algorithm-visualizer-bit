# Algorithm Visualizer Hub — Developer Documentation

## Overview

AlgoHub is a React + Vite learning platform for VTU ADA (Analysis and Design of Algorithms). It provides step-by-step visualizations, synchronized pseudocode/Java, quizzes, analytics, and interactive labs.

## Architecture

```
src/
├── App.jsx              # Router, lazy-loaded routes, layout shell
├── main.jsx             # React entry
├── index.css            # Design system + global styles
├── components/          # Reusable UI
├── context/             # Theme + app state (progress, quizzes, achievements)
├── hooks/               # useVisualizer — playback engine
├── data/                # algoMeta — learning content + quizzes
├── pages/               # Route pages (algorithms + tools)
├── pages/ds/            # Data structure explorers
└── utils/               # Shared helpers (array presets, etc.)
```

## Component Relationships

```
App
├── Navbar (fixed, mobile drawer)
├── main (Suspense + lazy routes)
│   └── Algo pages
│       ├── useVisualizer()     → steps, play/pause/jump
│       ├── StepControls        → timeline, speed, restart
│       ├── InputPanel          → presets + custom input
│       ├── ExecutionTrace      → step log
│       ├── CodePanel           → pseudo/Java line highlight
│       ├── AnalyticsPanel      → live charts (category-aware)
│       ├── AlgoTabWrapper      → tab shell (Visualizer, Code, Trace, …)
│       ├── LearningPanel       → problem, dry run, edge cases
│       └── QuizPanel           → MCQ with scoring
├── Footer
└── AchievementToast
```

## Visualization Engine (`useVisualizer`)

| API | Description |
|-----|-------------|
| `start()` | Play from current step (or step 0) |
| `pause()` | Pause animation |
| `resume` | Alias for `start()` when paused |
| `prev()` / `next()` | Manual stepping |
| `jumpTo(n)` | Jump to step index |
| `restart()` | Reset to step -1 without clearing steps |
| `reset()` | Full reset |
| `setSpeed(ms)` | Interval delay (50–900ms) |

## Design System

CSS variables in `:root` — `--bg`, `--surface`, `--accent`, `--shadow-*`, `--space-*`, `--nav-height`.

Utility classes: `.btn`, `.card`, `.controls-panel`, `.algo-layout`, `.tab-bar`.

## Adding a New Algorithm Page

1. Create `src/pages/MyAlgo.jsx` with `generateSteps()` returning `{ msg, …metrics }` per step.
2. Add learning + quiz data to `src/data/algoMeta.js`.
3. Register lazy route in `App.jsx`.
4. Add nav link in `Navbar.jsx` groups.
5. Wrap with `AlgoTabWrapper` and pass `onJumpTo={jumpTo}`.

## Performance

- All page routes use `React.lazy()` + `Suspense`.
- `ExecutionTrace` and chart data are sampled (max 40 points).
- Prefer `useRef` for arrays that shouldn't trigger re-renders during playback.

## Future Roadmap

- [ ] GPT-powered AI Tutor backend integration
- [ ] Side-by-side compare for graph algorithms
- [ ] Export visualization as GIF/video
- [ ] User accounts + cloud progress sync
- [ ] More algoMeta entries (edge cases, complexity for all 20+ algos)
- [ ] Unified `SortAlgoPage` template to reduce duplication

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Credits

Built for Bangalore Institute of Technology · VTU ADA syllabus.
