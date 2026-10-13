import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type LocalizedAsset,
  type LocalizedAssetKey,
  localizedAssetRegistration,
} from '../configuration/localizedAssetRegistration.configuration';

export const useLocalizedAsset = () => {
  const { i18n } = useTranslation();

  /**
   * Returns the localized asset path from the registration using the asset key and current language.
   * @param {LocalizedAssetKey} assetKey - The key for the asset in the registration
   * @returns {string | undefined} - The localized asset path, or undefined if not found
   */
  const getLocalizedAsset = useCallback(
    (assetKey: LocalizedAssetKey): string => {
      const currentLanguage = i18n.resolvedLanguage as keyof LocalizedAsset;
      const asset = localizedAssetRegistration[assetKey];
      return asset ? asset[currentLanguage] : '';
    },
    [i18n.resolvedLanguage]
  );

  return { a: getLocalizedAsset };
};
