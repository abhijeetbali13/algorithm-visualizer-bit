import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import Navbar, { NAV_HEIGHT } from './components/Navbar';
import Footer from './components/Footer';
import AchievementToast from './components/AchievementToast';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Compare = lazy(() => import('./pages/Compare'));
const Complexity = lazy(() => import('./pages/Complexity'));
const GraphLab = lazy(() => import('./pages/GraphLab'));
const Achievements = lazy(() => import('./pages/Achievements'));
const AITutor = lazy(() => import('./pages/AITutor'));

const BubbleSort = lazy(() => import('./pages/BubbleSort'));
const SelectionSort = lazy(() => import('./pages/SelectionSort'));
const InsertionSort = lazy(() => import('./pages/InsertionSort'));
const MergeSort = lazy(() => import('./pages/MergeSort'));
const QuickSort = lazy(() => import('./pages/QuickSort'));
const HeapSort = lazy(() => import('./pages/HeapSort'));

const Dijkstra = lazy(() => import('./pages/Dijkstra'));
const BellmanFord = lazy(() => import('./pages/BellmanFord'));
const Prims = lazy(() => import('./pages/Prims'));
const Kruskal = lazy(() => import('./pages/Kruskal'));
const FloydWarshall = lazy(() => import('./pages/FloydWarshall'));

const Knapsack = lazy(() => import('./pages/Knapsack'));
const MatrixChain = lazy(() => import('./pages/MatrixChain'));
const LCS = lazy(() => import('./pages/Lcs'));
const NQueens = lazy(() => import('./pages/NQueens'));

const Huffman = lazy(() => import('./pages/Huffman'));
const FractionalKnapsack = lazy(() => import('./pages/FractionalKnapsack'));
const ActivitySelection = lazy(() => import('./pages/ActivitySelection'));

const Horspool = lazy(() => import('./pages/Horspool'));
const BoyerMoore = lazy(() => import('./pages/BoyerMoore'));

const ArrayDS = lazy(() => import('./pages/ds/ArrayDS'));
const LinkedListDS = lazy(() => import('./pages/ds/LinkedListDS'));
const StackDS = lazy(() => import('./pages/ds/StackDS'));
const QueueDS = lazy(() => import('./pages/ds/QueueDS'));
const GraphDS = lazy(() => import('./pages/ds/GraphDS'));
const TreeDS = lazy(() => import('./pages/ds/TreeDS'));
const HeapDS = lazy(() => import('./pages/ds/HeapDS'));
const HashTableDS = lazy(() => import('./pages/ds/HashTableDS'));

function PageLoader() {
  return <LoadingSpinner label="Loading algorithm…" />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Navbar />
            <main className="app-main" style={{ paddingTop: NAV_HEIGHT }}>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                  <Route path="/"                    element={<Home />} />
                  <Route path="/dashboard"           element={<Dashboard />} />
                  <Route path="/compare"             element={<Compare />} />
                  <Route path="/complexity"          element={<Complexity />} />
                  <Route path="/graph-lab"           element={<GraphLab />} />
                  <Route path="/achievements"        element={<Achievements />} />
                  <Route path="/ai-tutor"            element={<AITutor />} />

                  <Route path="/bubble-sort"         element={<BubbleSort />} />
                  <Route path="/selection-sort"      element={<SelectionSort />} />
                  <Route path="/insertion-sort"      element={<InsertionSort />} />
                  <Route path="/merge-sort"          element={<MergeSort />} />
                  <Route path="/quick-sort"          element={<QuickSort />} />
                  <Route path="/heap-sort"           element={<HeapSort />} />

                  <Route path="/dijkstra"            element={<Dijkstra />} />
                  <Route path="/bellman-ford"        element={<BellmanFord />} />
                  <Route path="/prims"               element={<Prims />} />
                  <Route path="/kruskal"             element={<Kruskal />} />
                  <Route path="/floyd-warshall"      element={<FloydWarshall />} />

                  <Route path="/knapsack"            element={<Knapsack />} />
                  <Route path="/matrix-chain"        element={<MatrixChain />} />
                  <Route path="/lcs"                 element={<LCS />} />
                  <Route path="/n-queens"            element={<NQueens />} />

                  <Route path="/huffman"             element={<Huffman />} />
                  <Route path="/fractional-knapsack" element={<FractionalKnapsack />} />
                  <Route path="/activity-selection"  element={<ActivitySelection />} />

                  <Route path="/horspool"            element={<Horspool />} />
                  <Route path="/boyer-moore"         element={<BoyerMoore />} />

                  <Route path="/ds/array"            element={<ArrayDS />} />
                  <Route path="/ds/linked-list"      element={<LinkedListDS />} />
                  <Route path="/ds/stack"            element={<StackDS />} />
                  <Route path="/ds/queue"            element={<QueueDS />} />
                  <Route path="/ds/graph"            element={<GraphDS />} />
                  <Route path="/ds/tree"             element={<TreeDS />} />
                  <Route path="/ds/heap"             element={<HeapDS />} />
                  <Route path="/ds/hash-table"       element={<HashTableDS />} />
                </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
            <AchievementToast />
          </div>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
