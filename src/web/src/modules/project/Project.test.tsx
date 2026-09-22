import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { Project } from './Project';

describe('Project', () => {
  it('renders project', () => {
    render(<Project />);
  });
});
