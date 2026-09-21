import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tag } from '@defikarte/shared';

describe('Tag', () => {
  it('renders tag', () => {
    render(<Tag icon="">Click me</Tag>);
    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });
});
