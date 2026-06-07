import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock game modules before importing GameLayer
vi.mock('../menuCursor', () => ({ mount: vi.fn() }));
vi.mock('../worldMap', () => ({ mount: vi.fn() }));
vi.mock('../useGameState', () => ({ useGameState: vi.fn() }));

import GameLayer from '../GameLayer';
import { mount as mountCursor } from '../menuCursor';
import { mount as mountWorldMap } from '../worldMap';
import { useGameState } from '../useGameState';

const mockAdvance = vi.fn();

function setGameState(state: 'BOOT' | 'TITLE' | 'EXPLORE') {
  vi.mocked(useGameState).mockReturnValue({ state, advance: mockAdvance });
}

describe('GameLayer', () => {
  beforeEach(() => {
    vi.mocked(mountCursor).mockReturnValue(vi.fn());
    vi.mocked(mountWorldMap).mockReturnValue(vi.fn());
  });

  it('renders null in EXPLORE state', () => {
    setGameState('EXPLORE');
    const { container } = render(<GameLayer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders BootOverlay (.gp-boot) in BOOT state', () => {
    setGameState('BOOT');
    const { container } = render(<GameLayer />);
    expect(container.querySelector('.gp-boot')).not.toBeNull();
  });

  it('renders TitleOverlay (.gp-title) in TITLE state', () => {
    setGameState('TITLE');
    const { container } = render(<GameLayer />);
    expect(container.querySelector('.gp-title')).not.toBeNull();
  });

  it('calls mountCursor when state is EXPLORE', () => {
    setGameState('EXPLORE');
    render(<GameLayer />);
    expect(mountCursor).toHaveBeenCalledOnce();
  });

  it('calls mountWorldMap when state is EXPLORE', () => {
    setGameState('EXPLORE');
    render(<GameLayer />);
    expect(mountWorldMap).toHaveBeenCalledOnce();
  });

  it('does not call mountCursor in BOOT state', () => {
    setGameState('BOOT');
    render(<GameLayer />);
    expect(mountCursor).not.toHaveBeenCalled();
  });

  it('calls cleanup functions on unmount', () => {
    const cursorCleanup = vi.fn();
    const worldMapCleanup = vi.fn();
    vi.mocked(mountCursor).mockReturnValue(cursorCleanup);
    vi.mocked(mountWorldMap).mockReturnValue(worldMapCleanup);
    setGameState('EXPLORE');
    const { unmount } = render(<GameLayer />);
    unmount();
    expect(cursorCleanup).toHaveBeenCalledOnce();
    expect(worldMapCleanup).toHaveBeenCalledOnce();
  });
});
