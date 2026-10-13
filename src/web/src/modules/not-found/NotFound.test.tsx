import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { NotFound } from './NotFound';

describe('NotFound', () => {
  it('renders not found', () => {
    render(<NotFound />);
  });
});
