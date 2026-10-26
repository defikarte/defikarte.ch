import { act, fireEvent, render, screen } from '@testing-library/react';
import { type Feature } from 'geojson';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DetailView } from '@defikarte/shared';

// i18n is not initialised in tests, so t() returns the keys
const feature: Feature = {
  type: 'Feature',
  id: 240776510,
  geometry: { type: 'Point', coordinates: [8.5, 47.3] },
  properties: { 'defibrillator:location': 'Lobby' },
};

const mockClipboard = (writeText: () => Promise<void>) => {
  const spy = vi.fn(writeText);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: spy }, configurable: true });
  return spy;
};

const renderDetailView = () =>
  render(
    <DetailView
      map={null}
      feature={feature}
      userLocation={null}
      onCenterFeature={vi.fn()}
      onClose={vi.fn()}
    />
  );

describe('AedIdProperty (detail view)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the AED id', () => {
    renderDetailView();

    expect(screen.getByText('node')).toBeInTheDocument();
    expect(screen.getByText('240776510')).toBeInTheDocument();
  });

  it('copies the deep link of the AED and confirms it for a moment', async () => {
    vi.useFakeTimers();
    const writeText = mockClipboard(() => Promise.resolve());
    renderDetailView();

    // lets the clipboard promise settle before the state is checked
    await act(() =>
      Promise.resolve(fireEvent.click(screen.getByRole('button', { name: 'linkAed' })))
    );

    expect(writeText).toHaveBeenCalledWith('https://defikarte.ch/map/aed/240776510');
    expect(screen.getByText('aedLinkCopied')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText('aedLinkCopied')).not.toBeInTheDocument();
  });

  it('shows the link to select by hand when copying fails', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')));
    renderDetailView();

    // lets the clipboard promise settle before the state is checked
    await act(() =>
      Promise.resolve(fireEvent.click(screen.getByRole('button', { name: 'linkAed' })))
    );

    expect(screen.getByText('https://defikarte.ch/map/aed/240776510')).toBeInTheDocument();
    expect(screen.queryByText('aedLinkCopied')).not.toBeInTheDocument();
  });
});
