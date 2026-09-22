import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { Home } from './Home';

describe('Home', () => {
  it('renders home', () => {
    render(<Home isMapFullscreen={false} setIsMapFullscreen={() => undefined} />);
  });
});
