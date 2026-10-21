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

// "nur während Öffnungszeiten" and the like, in de, fr, it and en
const OPENING_HOURS_MENTION =
  /öffnungszeit|(heures|horaires?) d['’]ouverture|orari\w* d['’i ]+apertura|opening hours/i;

/** Whether the description mentions the opening hours although they are already set. */
export const isDescriptionRedundant = (
  description: string | undefined,
  openingHours: string | undefined
): boolean => !!openingHours?.trim() && !!description && OPENING_HOURS_MENTION.test(description);

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
