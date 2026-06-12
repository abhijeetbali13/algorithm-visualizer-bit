# Algorithm Visualizer Hub

Interactive visualizations of core algorithms from the VTU Analysis and Design of Algorithms (ADA) syllabus.

## Algorithms

| Algorithm | Category | Time Complexity | Space |
|-----------|----------|----------------|-------|
| Bubble Sort | Sorting | O(n²) | O(1) |
| Merge Sort | Sorting | O(n log n) | O(n) |
| Dijkstra's | Graph | O((V+E) log V) | O(V) |
| 0/1 Knapsack | Dynamic Programming | O(nW) | O(nW) |
| N-Queens | Backtracking | O(N!) | O(N) |

## Features
- Step-by-step visualization with pause/resume
- Adjustable animation speed
- Random input generation
- Pseudocode panel for each algorithm
- Complexity information

## Tech Stack
- React 18 + Vite
- React Router v6
- No backend, no database

## Run Locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo on vercel.com
3. Framework: Vite (auto-detected)
4. Deploy

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   └── AlgorithmCard.jsx
├── pages/
│   ├── Home.jsx
│   ├── BubbleSort.jsx
│   ├── MergeSort.jsx
│   ├── Dijkstra.jsx
│   ├── Knapsack.jsx
│   └── NQueens.jsx
├── App.jsx
├── main.jsx
└── index.css
```

---
Bangalore Institute of Technology · VTU ADA Syllabus
