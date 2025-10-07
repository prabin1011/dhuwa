'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils'; // optional; or remove cn() and use template strings

type Phase = { label: string; seconds: number; targetScale: number; note?: string };
type Protocol = { id: string; name: string; cycles: number; sequence: Phase[] };

// common scales
const MIN = 0.35;
const MAX = 1;

// breathing protocols
const PROTOCOLS: Protocol[] = [
  // Fastest “instant calm”
  {
    id: 'sigh',
    name: 'Quick Calm',
    cycles: 5, // 3–5 is typical; bump to preference
    sequence: [
      { label: 'Inhale',       seconds: 2, targetScale: 0.9, note: 'nose' },
      { label: 'Sip (top-up)', seconds: 1, targetScale: MAX, note: 'nose' },
      { label: 'Exhale',       seconds: 6, targetScale: MIN, note: 'mouth—long & slow' },
    ],
  },
  {
    id: 'box',
    name: 'Box 4-4-4-4',
    cycles: 4,
    sequence: [
      { label: 'Inhale', seconds: 4, targetScale: MAX },
      { label: 'Hold',   seconds: 4, targetScale: MAX, note: 'top hold' },
      { label: 'Exhale', seconds: 4, targetScale: MIN },
      { label: 'Hold',   seconds: 4, targetScale: MIN, note: 'bottom hold' },
    ],
  },
  {
    id: '478',
    name: '4-7-8',
    cycles: 4,
    sequence: [
      { label: 'Inhale', seconds: 4, targetScale: MAX },
      { label: 'Hold',   seconds: 7, targetScale: MAX, note: 'top hold' },
      { label: 'Exhale', seconds: 8, targetScale: MIN },
    ],
  },
];

interface Props {
  onComplete?: () => void;
  startProtocolId?: 'sigh' | 'box' | '478';
}

export function BreathingExercise({ onComplete, startProtocolId = 'sigh' }: Props) {
  const [protocolId, setProtocolId] = useState(startProtocolId);
  const protocol = useMemo(
    () => PROTOCOLS.find(p => p.id === protocolId)!,
    [protocolId]
  );

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(protocol.sequence[0].seconds);
  const [cycle, setCycle] = useState(1);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);

  // reset when protocol changes
  useEffect(() => {
    setPhaseIndex(0);
    setSecondsLeft(protocol.sequence[0].seconds);
    setCycle(1);
    setFinished(false);
    setRunning(true);
  }, [protocol]);

  // countdown & phase advance
  useEffect(() => {
    if (!running || finished) return;
    const tick = setInterval(() => {
      setSecondsLeft(s => {
        if (s > 1) return s - 1;

        // move to next phase
        setPhaseIndex(i => {
          const next = i + 1;
          if (next < protocol.sequence.length) {
            setSecondsLeft(protocol.sequence[next].seconds);
            return next;
          }
          // end of a cycle
          if (cycle >= protocol.cycles) {
            setFinished(true);
            setRunning(false);
            return 0;
          }
          setCycle(cycle + 1);
          setSecondsLeft(protocol.sequence[0].seconds);
          return 0;
        });
        return 1; // temporary; immediately replaced above
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [running, finished, protocol, cycle]);

  const cur = protocol.sequence[phaseIndex];
  const scale = cur.targetScale;

  const restart = () => {
    setPhaseIndex(0);
    setSecondsLeft(protocol.sequence[0].seconds);
    setCycle(1);
    setFinished(false);
    setRunning(true);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* protocol selector */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {PROTOCOLS.map(p => (
          <Button
            key={p.id}
            type="button"
            variant={p.id === protocolId ? 'default' : 'outline'}
            className="w-full"
            onClick={() => setProtocolId(p.id as any)}
          >
            {p.name}
          </Button>
        ))}
      </div>

      {/* circle */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-primary/20 transition-transform ease-in-out',
          )}
          style={{
            transform: `scale(${scale})`,
            transitionDuration: `${cur.seconds * 1000}ms`,
          }}
        />
        <div className="z-10 text-center">
          <p className="text-xl font-semibold">{cur.label}</p>
          {cur.note && <p className="text-xs text-muted-foreground">{cur.note}</p>}
          <p className="text-5xl font-mono font-bold mt-1">{secondsLeft}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cycle {cycle} / {protocol.cycles}
          </p>
        </div>
      </div>

      {/* controls */}
      {!finished ? (
        <div className="flex gap-2">
          <Button onClick={() => setRunning(v => !v)} variant="outline">
            {running ? 'Pause' : 'Resume'}
          </Button>
          <Button onClick={restart} variant="ghost">Restart</Button>
          <Button onClick={() => { setFinished(true); setRunning(false); onComplete?.(); }}>
            Done
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold">Complete!</p>
          <div className="flex gap-2">
            <Button onClick={restart}>Repeat</Button>
            <Button variant="outline" onClick={() => onComplete?.()}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
