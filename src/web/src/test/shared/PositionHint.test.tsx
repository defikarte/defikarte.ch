import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type NearbyAed, PositionHint } from '@defikarte/shared';

// i18n is not initialised in tests, so t() returns the keys
const nearbyAed: NearbyAed = {
  distance: 4.2,
  feature: {
    type: 'Feature',
    id: 7,
    geometry: { type: 'Point', coordinates: [8.5, 47.3] },
    properties: { 'defibrillator:location': 'Lobby', level: '1' },
  },
};

const renderHint = (props: Partial<Parameters<typeof PositionHint>[0]> = {}) => {
  const handlers = { onToggle: vi.fn(), onShowNearbyAed: vi.fn(), onConfirm: vi.fn() };
  render(<PositionHint nearbyAeds={[]} isExpanded={false} {...handlers} {...props} />);
  return handlers;
};

describe('PositionHint', () => {
  it('shows the positioning hint without a list toggle when no AED is nearby', () => {
    renderHint();

    expect(screen.getByText('choosePositionForNewAedOnMap')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('turns into the warning with a toggle when AEDs are nearby', () => {
    const { onToggle } = renderHint({ nearbyAeds: [nearbyAed] });

    expect(screen.getByText('nearbyAedTitle')).toBeInTheDocument();
    expect(screen.queryByText('choosePositionForNewAedOnMap')).not.toBeInTheDocument();
    expect(screen.queryByText('nearbyAedConfirm')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { expanded: false });
    // both labels are rendered so the toggle keeps its width
    expect(toggle).toHaveTextContent('nearbyAedShowList');
    expect(toggle).toHaveTextContent('nearbyAedHideList');

    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('lists the nearby AEDs when expanded and passes on show and confirm', () => {
    const { onShowNearbyAed, onConfirm } = renderHint({
      nearbyAeds: [nearbyAed],
      isExpanded: true,
    });

    expect(screen.getByText(/4 m – Lobby/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('nearbyAedShow'));
    expect(onShowNearbyAed).toHaveBeenCalledWith(nearbyAed.feature);

    fireEvent.click(screen.getByText('nearbyAedConfirm'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
