import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import iconMarkerCircleGreen from '../../../../../assets/icons/icon-marker-circle-green-m.svg';
import iconMarkerCircleGrey from '../../../../../assets/icons/icon-marker-circle-grey.svg';

// `/map/aed/<OSM node id>` opens the detail view of that AED (see useAedDeepLink).
// The app copies the website link too, so people without the app can open it.
const AED_LINK_BASE_URL = 'https://defikarte.ch/map/aed/';
const COPIED_DURATION_MS = 2000;

interface LinkAedPropertyProps {
  aedId: string | number;
  isOpen: boolean;
}

export const LinkAedProperty = ({ aedId, isOpen }: LinkAedPropertyProps) => {
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
    <button
      type="button"
      className="group flex items-center gap-2 text-left cursor-pointer"
      onClick={copyLink}
    >
      <img src={isOpen ? iconMarkerCircleGreen : iconMarkerCircleGrey} alt="" />
      <span className="flex-1 min-w-0" aria-live="polite">
        <span className="block text-xs font-semibold text-primary-100-green-04 leading-[150%] group-hover:underline">
          {copyState === 'copied' ? t('aedLinkCopied') : t('linkAed')}
        </span>
        {copyState === 'failed' && (
          <span className="block text-xs font-normal text-primary-100-green-04 leading-[150%] break-all select-all">
            {url}
          </span>
        )}
      </span>
    </button>
  );
};
