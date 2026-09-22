import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { Privacy } from './Privacy';

describe('Privacy', () => {
  it('renders privacy', () => {
    render(<Privacy />);
  });
});
