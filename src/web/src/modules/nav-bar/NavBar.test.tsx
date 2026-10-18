import { describe, it } from 'vitest';
import { renderWithRouter } from '../../test/renderWithRouter';
import { Navbar } from './NavBar';

describe('Navbar', () => {
  it('renders navbar', () => {
    renderWithRouter(<Navbar />);
  });
});
