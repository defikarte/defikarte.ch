import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Home } from './Home';

// maplibre needs WebGL, which jsdom does not provide
vi.mock('@defikarte/shared', async importOriginal => ({
  ...(await importOriginal<typeof import('@defikarte/shared')>()),
  SharedMap: () => <div data-testid="shared-map" />,
}));

describe('Home', () => {
  it('renders home', () => {
    render(<Home isMapFullscreen={false} setIsMapFullscreen={() => undefined} />);

    expect(screen.getByTestId('shared-map')).toBeInTheDocument();
  });
});
