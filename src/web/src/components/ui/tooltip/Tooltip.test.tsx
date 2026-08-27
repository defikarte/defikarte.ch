import { Tooltip } from '@defikarte/shared';
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';

describe('Tooltip', () => {
  it('renders tooltip', () => {
    render(<Tooltip />);
  });
});
