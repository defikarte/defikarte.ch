import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { Accordion } from './Accordion';

describe('Accordion', () => {
  it('renders accordion', () => {
    render(<Accordion title="" content="" />);
  });
});
