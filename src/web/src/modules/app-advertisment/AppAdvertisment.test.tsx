import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { AppAdvertisment } from './AppAdvertisment';

describe('AppAdvertisment', () => {
  it('renders AppAdvertisment', () => {
    render(<AppAdvertisment />);
  });
});
