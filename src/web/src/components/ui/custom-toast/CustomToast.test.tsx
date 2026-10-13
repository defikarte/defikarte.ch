import { render, screen } from '@testing-library/react';
import { type Toast } from 'react-hot-toast';
import { describe, expect, it } from 'vitest';
import { CustomToast } from './CustomToast';

describe('CustomToast', () => {
  it('renders customToast', () => {
    render(<CustomToast toastInstance={{} as Toast} title="click me" />);
    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });
});
