import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MapIconButton } from '@defikarte/shared';

describe('MapIconButton', () => {
  it('renders map icon button', () => {
    render(<MapIconButton icon="" active={false} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
