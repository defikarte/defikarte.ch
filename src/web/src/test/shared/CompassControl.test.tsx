import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CompassControl, type MapInstance } from '@defikarte/shared';

// i18n is not initialised in tests, so t() returns the keys
const renderCompass = () => {
  let setBearing: (bearing: number) => void = () => undefined;
  const unsubscribe = vi.fn();
  const map = {
    subscribeBearing: vi.fn((listener: (bearing: number) => void) => {
      setBearing = listener;
      listener(0);
      return unsubscribe;
    }),
    resetNorth: vi.fn(),
  };
  const view = render(<CompassControl map={map as unknown as MapInstance} />);
  return { ...view, map, unsubscribe, setBearing: (bearing: number) => act(() => setBearing(bearing)) };
};

describe('CompassControl', () => {
  it('is hidden while north is up', () => {
    const { container } = renderCompass();

    expect(container.firstChild).toHaveClass('hidden');
  });

  it('shows the rotated needle and resets north on click', () => {
    const { container, map, setBearing } = renderCompass();

    setBearing(45);

    expect(container.firstChild).not.toHaveClass('hidden');
    const button = screen.getByRole('button', { name: 'resetNorth' });
    expect(button.style.transform).toBe('rotate(-45deg)');

    fireEvent.click(button);
    expect(map.resetNorth).toHaveBeenCalledOnce();
  });

  it('unsubscribes on unmount', () => {
    const { unmount, unsubscribe } = renderCompass();

    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
