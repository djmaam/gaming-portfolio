import { useEffect, useCallback } from 'react';
import { useGameState } from './useGameState';
import { mount as mountCursor } from './menuCursor';
import './GameLayer.css';

const BOOT_MS = 1200;

function BootOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, BOOT_MS);
    const onKey = () => onDone();
    window.addEventListener('keydown', onKey, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onDone]);

  return (
    <div className="gp-boot" onClick={onDone} aria-hidden="true">
      <div className="gp-boot__sweep" />
      <p className="gp-boot__coin">INSERT COIN</p>
    </div>
  );
}

function TitleOverlay({ onStart }: { onStart: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ([' ', 'Enter', 'z', 'Z'].includes(e.key)) {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div className="gp-title" onClick={onStart} role="button" tabIndex={0}
         aria-label="Press to start — enter the portfolio">
      <div>
        <h1 className="gp-title__logo">MARCOS<br />ARRIETA</h1>
        <p className="gp-title__sub">FULL-STACK MAGE · LV.99</p>
      </div>
      <p className="gp-title__press blink">▶ PRESS START ◀</p>
      <p className="gp-title__hint">↑↓←→ move · Z select · M mute</p>
    </div>
  );
}

export default function GameLayer() {
  const { state, advance } = useGameState();
  const onBoot = useCallback(() => advance('TITLE'), [advance]);
  const onTitle = useCallback(() => advance('EXPLORE'), [advance]);

  useEffect(() => {
    if (state === 'EXPLORE') return mountCursor();
  }, [state]);

  if (state === 'EXPLORE') return null;
  if (state === 'BOOT') return <BootOverlay onDone={onBoot} />;
  return <TitleOverlay onStart={onTitle} />;
}
