import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Map } from './Map';

// maplibre needs WebGL, which jsdom does not provide
vi.mock('@defikarte/shared', async importOriginal => ({
  ...(await importOriginal<typeof import('@defikarte/shared')>()),
  SharedMap: () => <div data-testid="shared-map" />,
}));

describe('Map', () => {
  it('renders map', () => {
    render(<Map isHash={false} />);

    expect(screen.getByTestId('shared-map')).toBeInTheDocument();
  });
});
