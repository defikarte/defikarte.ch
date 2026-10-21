import { describe, expect, it } from 'vitest';
import { getBackTarget } from './useBackHandler';

describe('getBackTarget', () => {
  it('leads from a settings sub-page to the settings list', () => {
    expect(getBackTarget('/settings/mapdesign')).toBe('/settings');
    expect(getBackTarget('/settings/language')).toBe('/settings');
  });

  it('leads from a tab root to the map', () => {
    expect(getBackTarget('/settings')).toBe('/');
    expect(getBackTarget('/about')).toBe('/');
  });

  it('has no target on the map, where back leaves the app', () => {
    expect(getBackTarget('/')).toBeNull();
  });
});
