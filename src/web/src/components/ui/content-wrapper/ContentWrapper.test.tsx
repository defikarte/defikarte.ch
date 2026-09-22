import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentWrapper } from './ContentWrapper';

describe('ContentWrapper', () => {
  it('renders contentWrapper', () => {
    render(<ContentWrapper>Click me</ContentWrapper>);

    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });
});
