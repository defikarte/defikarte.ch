const STORAGE_KEY = 'defikarte-install-id';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const INSTALL_ID_HEADER = 'x-defikarte-install-id';

/**
 * A random id that is created once per install and sent with the calls that change data, so the backend can
 * limit one caller without knowing who it is. It is not a login and holds no personal data.
 * Undefined if the id cannot be kept (no storage or no crypto), the backend then limits by IP only.
 */
export const getInstallId = (): string | undefined => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && UUID_PATTERN.test(stored)) {
      return stored;
    }

    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return undefined;
  }
};
