import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRouter } from '../../test/renderWithRouter';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders footer', async () => {
    renderWithRouter(<Footer />);

    expect(await screen.findByText('imprint')).toBeInTheDocument();
  });
});
