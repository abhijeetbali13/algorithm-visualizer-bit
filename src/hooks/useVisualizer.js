import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Full-featured visualizer hook.
 * Supports: play, pause, prev, next, jump-to-step, speed (50–2000ms), restart.
 */
export function useVisualizer(generateStepsFn) {
  const [stepIdx, setStepIdx]  = useState(-1);
  const [running, setRunning]  = useState(false);
  const [speed, setSpeedState] = useState(350);
  const [steps, setSteps]      = useState([]);

  const stepsRef   = useRef([]);
  const speedRef   = useRef(350);
  const runningRef = useRef(false);
  const idxRef     = useRef(-1);
  const timerRef   = useRef(null);
  const genFnRef   = useRef(generateStepsFn);

  useEffect(() => {
    genFnRef.current = generateStepsFn;
    idxRef.current = stepIdx;
  }, [generateStepsFn, stepIdx]);

  const setSpeed = (v) => { speedRef.current = v; setSpeedState(v); };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const buildSteps = useCallback(() => {
    stepsRef.current = genFnRef.current();
    setSteps(stepsRef.current);
    return stepsRef.current;
  }, []);

  const reset = useCallback(() => {
    stopTimer();
    runningRef.current = false;
    setRunning(false);
    stepsRef.current = [];
    setSteps([]);
    idxRef.current = -1;
    setStepIdx(-1);
  }, []);

  const start = useCallback(() => {
    stopTimer();
    let s = stepsRef.current;
    if (s.length === 0) s = buildSteps();
    let i = idxRef.current + 1;
    if (i >= s.length) i = 0;
    runningRef.current = true;
    setRunning(true);
    timerRef.current = setInterval(() => {
      if (i >= stepsRef.current.length) {
        clearInterval(timerRef.current); timerRef.current = null;
        runningRef.current = false; setRunning(false); return;
      }
      idxRef.current = i; setStepIdx(i); i++;
    }, speedRef.current);
  }, [buildSteps]);

  const pause = useCallback(() => { stopTimer(); runningRef.current = false; setRunning(false); }, []);

  const prev = useCallback(() => {
    if (running) return;
    let s = stepsRef.current.length === 0 ? buildSteps() : stepsRef.current;
    const n = Math.max(0, idxRef.current - 1);
    idxRef.current = n; setStepIdx(n);
  }, [running, buildSteps]);

  const next = useCallback(() => {
    if (running) return;
    let s = stepsRef.current.length === 0 ? buildSteps() : stepsRef.current;
    if (idxRef.current < s.length - 1) {
      const n = idxRef.current + 1;
      idxRef.current = n; setStepIdx(n);
    }
  }, [running, buildSteps]);

  // Jump to any step directly
  const jumpTo = useCallback((idx) => {
    if (running) return;
    let s = stepsRef.current.length === 0 ? buildSteps() : stepsRef.current;
    const clamped = Math.max(0, Math.min(idx, s.length - 1));
    idxRef.current = clamped; setStepIdx(clamped);
  }, [running, buildSteps]);

  const restart = useCallback(() => {
    stopTimer();
    runningRef.current = false; setRunning(false);
    idxRef.current = -1; setStepIdx(-1);
  }, []);

  useEffect(() => () => stopTimer(), []);

  return {
    steps, stepIdx, running, speed, setSpeed,
    current: steps[stepIdx] ?? null,
    reset, start, pause, resume: start, prev, next, jumpTo, restart, buildSteps,
  };
}
