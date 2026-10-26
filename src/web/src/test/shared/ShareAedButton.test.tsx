import { act, fireEvent, render, screen } from '@testing-library/react';
import { type Feature } from 'geojson';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DetailView } from '@defikarte/shared';

// i18n is not initialised in tests, so t() returns the keys
const AED_URL = 'https://defikarte.ch/map/aed/240776510';
const feature: Feature = {
  type: 'Feature',
  id: 240776510,
  geometry: { type: 'Point', coordinates: [8.5, 47.3] },
  properties: { 'defibrillator:location': 'Lobby' },
};

const mockNavigator = (key: 'clipboard' | 'share', value: unknown) =>
  Object.defineProperty(navigator, key, { value, configurable: true });

const mockClipboard = (writeText: () => Promise<void>) => {
  const spy = vi.fn(writeText);
  mockNavigator('clipboard', { writeText: spy });
  return spy;
};

const renderDetailView = (props: Partial<Parameters<typeof DetailView>[0]> = {}) =>
  render(
    <DetailView
      map={null}
      feature={feature}
      userLocation={null}
      onCenterFeature={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />
  );

// lets the share and clipboard promises settle before the state is checked
const click = (name: string) =>
  act(() => Promise.resolve(fireEvent.click(screen.getByRole('button', { name }))));

describe('ShareAedButton (detail view)', () => {
  afterEach(() => {
    vi.useRealTimers();
    // jsdom has no web share API
    Reflect.deleteProperty(navigator, 'share');
  });

  it('copies the link to the AED on desktop and confirms it for a moment', async () => {
    vi.useFakeTimers();
    const writeText = mockClipboard(() => Promise.resolve());
    renderDetailView();

    await click('linkAed');

    expect(writeText).toHaveBeenCalledWith(AED_URL);
    expect(screen.getByRole('status')).toHaveTextContent('aedLinkCopied');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the link to select by hand when copying fails', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')));
    renderDetailView();

    await click('linkAed');

    expect(screen.getByRole('status')).toHaveTextContent(AED_URL);
  });

  it('opens the share menu of the browser on mobile', async () => {
    const share = vi.fn(() => Promise.resolve());
    mockNavigator('share', share);
    const writeText = mockClipboard(() => Promise.resolve());
    renderDetailView({ compact: true });

    await click('shareAed');

    expect(share).toHaveBeenCalledWith({ title: 'Lobby', url: AED_URL });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('uses the share menu passed in by the app', async () => {
    const shareLink = vi.fn(() => Promise.resolve());
    renderDetailView({ compact: true, shareLink });

    await click('shareAed');

    expect(shareLink).toHaveBeenCalledWith(AED_URL, 'Lobby');
  });

  it('does nothing when the share menu is closed, but copies when sharing fails', async () => {
    const writeText = mockClipboard(() => Promise.resolve());
    const shareLink = vi.fn(() => Promise.reject(new DOMException('closed', 'AbortError')));
    renderDetailView({ compact: true, shareLink });

    await click('shareAed');
    expect(writeText).not.toHaveBeenCalled();

    shareLink.mockImplementation(() => Promise.reject(new Error('not supported')));
    await click('shareAed');
    expect(writeText).toHaveBeenCalledWith(AED_URL);
  });

  it('copies on mobile when the browser cannot share', async () => {
    const writeText = mockClipboard(() => Promise.resolve());
    renderDetailView({ compact: true });

    await click('shareAed');

    expect(writeText).toHaveBeenCalledWith(AED_URL);
  });
});
