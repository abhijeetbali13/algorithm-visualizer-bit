import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

export const AppContext = createContext();

export const useApp = () => useContext(AppContext);

const ACHIEVEMENTS = [
  { id:'first_visit',    title:'First Step',       desc:'Open your first algorithm',     icon:'🚀', req: s => s.visitedCount >= 1 },
  { id:'sorting_master', title:'Sorting Master',   desc:'Explore all 6 sorting algos',   icon:'📊', req: s => ['bubble-sort','selection-sort','insertion-sort','merge-sort','quick-sort','heap-sort'].every(id => s.visited[id]) },
  { id:'graph_explorer', title:'Graph Explorer',   desc:'Explore all 5 graph algorithms', icon:'🕸️', req: s => ['dijkstra','bellman-ford','prims','kruskal','floyd-warshall'].every(id => s.visited[id]) },
  { id:'dp_specialist',  title:'DP Specialist',    desc:'Explore all DP algorithms',     icon:'🧠', req: s => ['knapsack','matrix-chain','lcs'].every(id => s.visited[id]) },
  { id:'quiz_taker',     title:'Quiz Taker',       desc:'Complete your first quiz',      icon:'📝', req: s => s.quizScores.length >= 1 },
  { id:'quiz_champion',  title:'Quiz Champion',    desc:'Score 100% on any quiz',        icon:'🏆', req: s => s.quizScores.some(q => q.score === q.total && q.total > 0) },
  { id:'perfect_streak', title:'On a Roll',        desc:'Visit 5 days in a row',         icon:'🔥', req: s => s.streak >= 5 },
  { id:'completionist',  title:'Completionist',    desc:'Explore 15+ algorithms',        icon:'⭐', req: s => s.visitedCount >= 15 },
  { id:'speedrunner',    title:'Speedrunner',      desc:'Take 3 quizzes in one session', icon:'⚡', req: s => s.sessionQuizzes >= 3 },
  { id:'graph_lab',      title:'Lab Rat',          desc:'Use the Graph Lab',             icon:'🔬', req: s => s.visited['graph-lab'] },
];

const INITIAL = {
  visited: {}, quizScores: [], favorites: [], roadmap: {},
  achievements: [], streak: 0, lastVisitDay: null,
  totalTimeMs: 0, sessionStart: null, sessionQuizzes: 0,
};

function load() {
  try { return { ...INITIAL, ...JSON.parse(localStorage.getItem('ada-hub-v4') || '{}') }; }
  catch { return INITIAL; }
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

export function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    const d = load();
    // Update streak
    const today = todayStr();
    if (d.lastVisitDay !== today) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      d.streak = d.lastVisitDay === yStr ? (d.streak || 0) + 1 : 1;
      d.lastVisitDay = today;
    }
    d.sessionStart = Date.now();
    d.sessionQuizzes = 0;
    return d;
  });
  const [newAchievement, setNewAchievement] = useState(null);

  const save = (next) => {
    setData(next);
    try { localStorage.setItem('ada-hub-v4', JSON.stringify(next)); } catch { /* ignore */ }
    // Check achievements
    const unlocked = ACHIEVEMENTS.filter(a => !next.achievements.includes(a.id) && a.req(next));
    if (unlocked.length) {
      const updated = { ...next, achievements: [...next.achievements, ...unlocked.map(a => a.id)] };
      setData(updated);
      try { localStorage.setItem('ada-hub-v4', JSON.stringify(updated)); } catch { /* ignore */ }
      setNewAchievement(unlocked[0]);
      setTimeout(() => setNewAchievement(null), 3500);
    }
  };

  const markVisited = (id) => {
    const next = { ...data, visited: { ...data.visited, [id]: data.visited[id] || Date.now() } };
    next.visitedCount = Object.keys(next.visited).length;
    save(next);
  };

  const toggleFav = (id) => {
    const favs = data.favorites.includes(id) ? data.favorites.filter(f => f !== id) : [...data.favorites, id];
    save({ ...data, favorites: favs });
  };

  const saveQuiz = (algoId, score, total) => {
    const next = { ...data, quizScores: [...data.quizScores, { algoId, score, total, date: Date.now() }], sessionQuizzes: (data.sessionQuizzes || 0) + 1 };
    save(next);
  };

  const setRoadmap = (topic, done) => save({ ...data, roadmap: { ...data.roadmap, [topic]: done } });

  const visitedCount = Object.keys(data.visited).length;
  const avgScore = data.quizScores.length
    ? Math.round(data.quizScores.reduce((s, q) => s + (q.score / q.total) * 100, 0) / data.quizScores.length) : 0;
  const unlockedAchievements = ACHIEVEMENTS.filter(a => data.achievements.includes(a.id));
  const lockedAchievements   = ACHIEVEMENTS.filter(a => !data.achievements.includes(a.id));

  return (
    <AppContext.Provider value={{
      ...data, markVisited, toggleFav, saveQuiz, setRoadmap,
      visitedCount, avgScore, ACHIEVEMENTS, unlockedAchievements, lockedAchievements,
      newAchievement,
    }}>
      {children}
    </AppContext.Provider>
  );
}
