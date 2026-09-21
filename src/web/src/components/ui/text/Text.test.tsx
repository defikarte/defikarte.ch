import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text } from './Text';

describe('Text', () => {
  it('renders text', () => {
    render(<Text>Click me</Text>);

    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });
});
