import { TextField } from '@defikarte/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('TextField', () => {
  it('renders text field', () => {
    render(<TextField label="click me" type="" />);
    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });
});
