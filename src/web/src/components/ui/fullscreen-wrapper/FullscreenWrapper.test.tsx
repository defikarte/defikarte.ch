import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FullscreenWrapper } from './FullscreenWrapper';

describe('FullscreenWrapper', () => {
  it('renders fullscreenWrapper', () => {
    render(<FullscreenWrapper>Click me</FullscreenWrapper>);
    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });
});
