import { isDescriptionRedundant } from '@defikarte/shared';
import { describe, expect, it } from 'vitest';

describe('isDescriptionRedundant', () => {
  const openingHours = 'Mo-Fr 08:00-18:00';

  it('detects a mention of the opening hours when they are set', () => {
    expect(isDescriptionRedundant('Während Öffnungszeiten verfügbar', openingHours)).toBe(true);
    expect(isDescriptionRedundant('nur während Öffnungszeit', '24/7')).toBe(true);
    expect(isDescriptionRedundant("Pendant les heures d'ouverture", openingHours)).toBe(true);
    expect(isDescriptionRedundant("Durante gli orari d'apertura", openingHours)).toBe(true);
    expect(isDescriptionRedundant('During opening hours', openingHours)).toBe(true);
  });

  it('ignores the description without opening hours', () => {
    expect(isDescriptionRedundant('Während Öffnungszeiten verfügbar', undefined)).toBe(false);
    expect(isDescriptionRedundant('Während Öffnungszeiten verfügbar', ' ')).toBe(false);
  });

  it('ignores other descriptions', () => {
    expect(isDescriptionRedundant('Im Eingangsbereich links', '24/7')).toBe(false);
    expect(isDescriptionRedundant(undefined, '24/7')).toBe(false);
  });
});
