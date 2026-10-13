import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { Map } from './Map';

describe('Map', () => {
  it('renders map', () => {
    render(<Map isHash={false} />);
  });
});
