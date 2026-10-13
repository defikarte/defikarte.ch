import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { SplashScreen } from './SplashScreen';

describe('SplashScreen', () => {
  it('renders splash screen', () => {
    render(<SplashScreen />);
  });
});
