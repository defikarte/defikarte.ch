import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { OsmSection } from './OsmSection';

describe('OsmSection', () => {
  it('renders osm section', () => {
    render(<OsmSection />);
  });
});
