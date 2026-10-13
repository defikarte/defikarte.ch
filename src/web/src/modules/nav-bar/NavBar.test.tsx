import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { Navbar } from './NavBar';

describe('Navbar', () => {
  it('renders navbar', () => {
    render(<Navbar />);
  });
});
