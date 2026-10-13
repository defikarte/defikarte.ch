import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders footer', () => {
    render(<Footer />);

    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });
});
