import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { Knowledge } from './Knowledge';

describe('Knowledge', () => {
  it('renders knowledge', () => {
    render(<Knowledge />);
  });
});
