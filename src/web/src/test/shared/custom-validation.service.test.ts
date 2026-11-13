import { isDescriptionRedundant } from '@defikarte/shared';
import { describe, expect, it } from 'vitest';

describe('isDescriptionRedundant', () => {
  it('detects a mention of the opening hours', () => {
    expect(isDescriptionRedundant('Während Öffnungszeiten verfügbar')).toBe(true);
    expect(isDescriptionRedundant('nur während Öffnungszeit')).toBe(true);
    expect(isDescriptionRedundant("Pendant les heures d'ouverture")).toBe(true);
    expect(isDescriptionRedundant("Durante gli orari d'apertura")).toBe(true);
    expect(isDescriptionRedundant('During opening hours')).toBe(true);
    expect(isDescriptionRedundant('nur waehrend Oeffnungszeiten')).toBe(true);
    expect(isDescriptionRedundant('während Geschäftszeiten')).toBe(true);
    expect(isDescriptionRedundant('During business hours')).toBe(true);
    expect(isDescriptionRedundant('nur zu Bürozeiten')).toBe(true);
    expect(isDescriptionRedundant('Öffnungszeiten')).toBe(true);
  });

  it('detects the opening hours written out in the description', () => {
    expect(isDescriptionRedundant('Mo-Fr 8-17 Uhr')).toBe(true);
    expect(isDescriptionRedundant('08:00 - 17:00')).toBe(true);
    expect(isDescriptionRedundant('lundi à vendredi')).toBe(true);
    expect(isDescriptionRedundant('rund um die Uhr')).toBe(true);
    expect(isDescriptionRedundant('24h zugänglich')).toBe(true);
    expect(isDescriptionRedundant('jederzeit zugänglich')).toBe(true);
  });

  it('ignores other descriptions', () => {
    expect(isDescriptionRedundant(undefined)).toBe(false);
    expect(isDescriptionRedundant('')).toBe(false);
    expect(isDescriptionRedundant('Im Eingangsbereich links')).toBe(false);
    expect(isDescriptionRedundant('Schrank mit Alarm, Schlüssel beim Empfang')).toBe(false);
    expect(isDescriptionRedundant('2. Stock, Raum 12-14')).toBe(false);
    expect(isDescriptionRedundant('Telefon 044 123 45 67')).toBe(false);
    expect(isDescriptionRedundant('Mode-Geschäft, neben dem Lift')).toBe(false);
  });
});
