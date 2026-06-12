import { useState, useRef, useEffect } from 'react';

/**
 * Robust visualizer hook.
 * - steps are generated once and stored in a ref (no stale closures)
 * - interval only reads from refs, never from stale state
 * - speed changes take effect immediately (ref-based)
 */
export function useVisualizer(generateStepsFn) {
  const [stepIdx, setStepIdx]   = useState(-1);
  const [running, setRunning]   = useState(false);
  const [speed, setSpeedState]  = useState(350);
  const [steps, setSteps]       = useState([]);

  // Refs that the interval closure reads — always current
  const stepsRef   = useRef([]);
  const speedRef   = useRef(350);
  const runningRef = useRef(false);
  const idxRef     = useRef(-1);
  const timerRef   = useRef(null);
  const genFnRef   = useRef(generateStepsFn);

  // Keep genFnRef current so we always call the latest version
  genFnRef.current = generateStepsFn;

  // Keep idxRef in sync with state
  useEffect(() => { idxRef.current = stepIdx; }, [stepIdx]);

  const setSpeed = (v) => { speedRef.current = v; setSpeedState(v); };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const buildSteps = () => {
    const s = genFnRef.current();
    stepsRef.current = s;
    setSteps(s);
    return s;
  };

  const reset = () => {
    stopTimer();
    runningRef.current = false;
    setRunning(false);
    stepsRef.current = [];
    setSteps([]);
    idxRef.current = -1;
    setStepIdx(-1);
  };

  const start = () => {
    stopTimer();
    // Build steps if not already built
    let s = stepsRef.current;
    if (s.length === 0) s = buildSteps();

    // If already at end, restart from beginning
    let i = idxRef.current + 1;
    if (i >= s.length) i = 0;

    runningRef.current = true;
    setRunning(true);

    timerRef.current = setInterval(() => {
      if (i >= stepsRef.current.length) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        runningRef.current = false;
        setRunning(false);
        return;
      }
      idxRef.current = i;
      setStepIdx(i);
      i++;
    }, speedRef.current);
  };

  const pause = () => {
    stopTimer();
    runningRef.current = false;
    setRunning(false);
  };

  const prev = () => {
    if (running) return;
    let s = stepsRef.current;
    if (s.length === 0) s = buildSteps();
    const next = Math.max(0, idxRef.current - 1);
    idxRef.current = next;
    setStepIdx(next);
  };

  const next = () => {
    if (running) return;
    let s = stepsRef.current;
    if (s.length === 0) s = buildSteps();
    if (idxRef.current < s.length - 1) {
      const n = idxRef.current + 1;
      idxRef.current = n;
      setStepIdx(n);
    }
  };

  return {
    steps,
    stepIdx,
    running,
    speed,
    setSpeed,
    current: steps[stepIdx] ?? null,
    reset,
    start,
    pause,
    prev,
    next,
    buildSteps,
  };
}
