import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders hero', () => {
    render(
      <Hero
        buttonIcon=""
        buttonText=""
        description={[]}
        onButtonClick={() => undefined}
        title="click me"
      />
    );

    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });
});
