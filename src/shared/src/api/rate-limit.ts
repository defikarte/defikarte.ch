import axios from 'axios';

/** The backend answers 429 if one caller changed too much data in a short time. */
export const isRateLimitError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 429;
