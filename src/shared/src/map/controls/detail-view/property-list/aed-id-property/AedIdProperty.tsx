import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import iconLinkDarkGreen from '../../../../../assets/icons/icon-link-dark-green.svg';
import iconPinCircleGreen from '../../../../../assets/icons/icon-pin-circle-green.svg';
import iconPinCircleGrey from '../../../../../assets/icons/icon-pin-circle-grey.svg';
import { IconButton } from '../../../../../components/ui/icon-button/IconButton';
import { ItemProperty } from '../item-property/ItemProperty';

// `/map/aed/<OSM node id>` opens the detail view of that AED (see useAedDeepLink).
// The app copies the website link too, so people without the app can open it.
const AED_LINK_BASE_URL = 'https://defikarte.ch/map/aed/';
const COPIED_DURATION_MS = 2000;

interface AedIdPropertyProps {
  aedId: string | number;
  isOpen: boolean;
}

export const AedIdProperty = ({ aedId, isOpen }: AedIdPropertyProps) => {
  const { t } = useTranslation();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const url = `${AED_LINK_BASE_URL}${aedId}`;

  useEffect(() => {
    if (copyState !== 'copied') return;
    const timeout = setTimeout(() => setCopyState('idle'), COPIED_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [copyState]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState('copied');
    } catch {
      // e.g. no clipboard access: show the link so it can be selected by hand
      setCopyState('failed');
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <ItemProperty
            icon={isOpen ? iconPinCircleGreen : iconPinCircleGrey}
            title={t('node')}
            value={aedId}
          />
        </div>
        <span className="text-xs text-primary-100-green-03 leading-[150%]" aria-live="polite">
          {copyState === 'copied' && t('aedLinkCopied')}
        </span>
        <IconButton
          icon={iconLinkDarkGreen}
          variant="white"
          title={t('linkAed')}
          aria-label={t('linkAed')}
          className="flex shrink-0"
          onClick={() => void copyLink()}
        />
      </div>
      {copyState === 'failed' && (
        // ps-8 lines the link up with the value, past the 24px icon and the gap
        <span className="ps-8 text-xs text-primary-100-green-04 leading-[150%] break-all select-all">
          {url}
        </span>
      )}
    </div>
  );
};
