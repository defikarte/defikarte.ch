import cn from 'classnames';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import iconLinkDarkGreen from '../../../../assets/icons/icon-link-dark-green.svg';
import iconShareDarkGreen from '../../../../assets/icons/icon-share-dark-green.svg';
import { IconButton } from '../../../../components/ui/icon-button/IconButton';

const COPIED_DURATION_MS = 2000;

const shareWithWebShareApi = (url: string, title: string) => navigator.share({ title, url });

interface ShareAedButtonProps {
  // the link that opens the detail view of the AED
  url: string;
  name: string;
  isOpen: boolean;
  // mobile opens the share menu of the platform, desktop copies the link
  isMobile: boolean;
  // opens the share menu, the web share API by default
  shareLink?: (url: string, title: string) => Promise<void>;
}

export const ShareAedButton = ({
  url,
  name,
  isOpen,
  isMobile,
  shareLink,
}: ShareAedButtonProps) => {
  const { t } = useTranslation();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

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

  const share = async () => {
    const shareWith = shareLink ?? ('share' in navigator ? shareWithWebShareApi : undefined);
    if (!isMobile || !shareWith) {
      await copyLink();
      return;
    }
    try {
      await shareWith(url, name);
    } catch (error) {
      // closing the share menu is no error
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await copyLink();
    }
  };

  const label = isMobile ? t('shareAed') : t('linkAed');

  return (
    <div className="relative flex">
      {copyState !== 'idle' && (
        <span
          role="status"
          className={cn(
            'absolute bottom-full right-0 mb-2 w-max max-w-64 px-3 py-2 break-all select-all',
            'text-xs leading-[150%] text-primary-100-green-04',
            'bg-primary-100-white rounded-2xl shadow-custom-lg shadow-green-shadow-64'
          )}
        >
          {copyState === 'copied' ? t('aedLinkCopied') : url}
        </span>
      )}
      <IconButton
        icon={isMobile ? iconShareDarkGreen : iconLinkDarkGreen}
        variant={isOpen ? 'tint' : 'secondary'}
        title={label}
        aria-label={label}
        className="flex"
        onClick={() => void share()}
      />
    </div>
  );
};
