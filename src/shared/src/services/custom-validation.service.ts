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
