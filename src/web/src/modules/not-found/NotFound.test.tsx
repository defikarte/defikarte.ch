import { describe, it } from 'vitest';
import { renderWithRouter } from '../../test/renderWithRouter';
import { NotFound } from './NotFound';

describe('NotFound', () => {
  it('renders not found', () => {
    renderWithRouter(<NotFound />);
  });
});
