import { SelectField } from '@defikarte/shared';
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';

describe('SelectField', () => {
  it('renders select field', () => {
    render(<SelectField label="" options={[]} />);
  });
});
