import {
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumberWithError,
  validatePhoneNumberLength,
} from 'libphonenumber-js';
import opening_hours from 'opening_hours';
import { type Translate } from '../model/common';

export const areOpeningHoursValid = (
  value: string | undefined,
  t: Translate
): string | boolean => {
  if (value === undefined) {
    return true;
  }

  let msg = '';
  try {
    const oh = new opening_hours(value);
    const warnings = oh.getWarnings();
    msg = warnings.join(', ');
  } catch {
    msg = t('openingHoursInvalid');
  }

  return msg === '' || value === null || value === '' ? true : msg;
};

const DAY = '(mo|di|mi|do|fr|sa|so|lu|ma|me|je|ve|gi|tu|we|th|su)[a-z]*\\.?';
const RANGE = '\\s*(-|–|bis|à|al|to)\\s*';

// "nur während Öffnungszeiten" and the like in de (also without umlauts), fr, it and en, the
// hours written out ("Mo-Fr", "8-17 Uhr", "08:00-17:00") or "always open" ("24h", "rund um die Uhr")
const OPENING_HOURS_MENTION = new RegExp(
  [
    '(ö|oe)ffnungszeit',
    '(gesch(ä|ae)fts|b(ü|ue)ro)zeit',
    "(heures|horaires?) d['’]ouverture",
    "orari\\w* d['’i ]+apertura",
    '(opening|business|office) hours',
    `\\b${DAY}${RANGE}${DAY}\\b`,
    `\\b\\d{1,2}[:.]\\d{2}${RANGE}\\d{1,2}`,
    `\\b\\d{1,2}${RANGE}\\d{1,2}\\s*(uhr|h)\\b`,
    '\\b24\\s*(/\\s*(7|24)|h|std|stunden|heures|ore|hours)\\b',
    'rund um die uhr|jederzeit|jour et nuit|around the clock',
  ].join('|'),
  'i'
);

/** Whether the description mentions the opening hours, which belong in their own field. */
export const isDescriptionRedundant = (description: string | undefined): boolean =>
  !!description &&
  // "Ö" can also be typed as "O" and a combining diaeresis
  OPENING_HOURS_MENTION.test(description.normalize('NFC'));

export const isPhoneNumberValid = (value: string | undefined, t: Translate): string | boolean => {
  if (value === undefined) {
    return true;
  }

  const valid =
    isPossiblePhoneNumber(value) === true &&
    isValidPhoneNumber(value) === true &&
    validatePhoneNumberLength(value, 'CH') === undefined;

  return value === null || value === '' || valid || t('phoneNumberInvalid');
};

export const formatPhoneNumber = (
  value: string | undefined
): { value: string; isValid: boolean } => {
  if (!value) {
    return { value: '', isValid: false };
  }

  // Only format if the value starts with a '+'
  if (!value.trim().startsWith('+')) {
    return { value, isValid: false };
  }

  try {
    const phoneNumber = parsePhoneNumberWithError(value, 'CH');
    return { value: phoneNumber.formatInternational(), isValid: phoneNumber.isValid() };
  } catch {
    // If parsing fails, return the original value
  }

  return { value, isValid: false };
};
