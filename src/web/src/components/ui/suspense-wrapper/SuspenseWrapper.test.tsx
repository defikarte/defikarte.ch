import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SuspenseWrapper } from './SuspenseWrapper';

describe('SuspenseWrapper', () => {
  it('renders suspense wrapper', () => {
    render(<SuspenseWrapper>click me</SuspenseWrapper>);
    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });
});
