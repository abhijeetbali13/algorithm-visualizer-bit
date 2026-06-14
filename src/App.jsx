import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BubbleSort from './pages/BubbleSort';
import MergeSort from './pages/MergeSort';
import Dijkstra from './pages/Dijkstra';
import Knapsack from './pages/Knapsack';
import NQueens from './pages/NQueens';
import Prims from './pages/Prims';
import Kruskal from './pages/Kruskal';
import Huffman from './pages/Huffman';
import Horspool from './pages/Horspool';
import BoyerMoore from './pages/BoyerMoore';
import HeapSort from './pages/HeapSort';
import InsertionSort from './pages/InsertionSort';
import FloydWarshall from './pages/FloydWarshall';
import FractionalKnapsack from './pages/FractionalKnapsack';
import ActivitySelection from './pages/ActivitySelection';
import Lcs from './pages/Lcs';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <Navbar/>
        <main style={{ flex:1 }}>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/bubble-sort" element={<BubbleSort/>}/>
            <Route path="/merge-sort" element={<MergeSort/>}/>
            <Route path="/heap-sort" element={<HeapSort/>}/>
            <Route path="/dijkstra" element={<Dijkstra/>}/>
            <Route path="/prims" element={<Prims/>}/>
            <Route path="/kruskal" element={<Kruskal/>}/>
            <Route path="/knapsack" element={<Knapsack/>}/>
            <Route path="/n-queens" element={<NQueens/>}/>
            <Route path="/huffman" element={<Huffman/>}/>
            <Route path="/horspool" element={<Horspool/>}/>
            <Route path="/boyer-moore" element={<BoyerMoore/>}/>
            <Route path="/insertion-sort" element={<InsertionSort/>}/>
            <Route path="/floyd-warshall" element={<FloydWarshall/>}/>
            <Route path="/fractional-knapsack" element={<FractionalKnapsack/>}/>
            <Route path="/lcs" element={<Lcs/>}/>
            <Route path="/activity-selection" element={<ActivitySelection/>}/>
          </Routes>
        </main>
        <Footer/>
      </div>
    </BrowserRouter>
  );
}