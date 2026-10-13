import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { Imprint } from './Imprint';

describe('Imprint', () => {
  it('renders imprint', () => {
    render(<Imprint />);
  });
});
