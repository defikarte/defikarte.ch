import { Button } from '@defikarte/shared';
import { useTranslation } from 'react-i18next';
import iconExternalLinkMiddleGreen from '../../../assets/icons/icon-external-link-middle-green.svg';
import imageOpenStreetMapLogo from '../../../assets/landingpages/projekt/openstreetmap-logo.svg';
import { ContentWrapper } from '../../../components/ui/content-wrapper/ContentWrapper';
import { Text } from '../../../components/ui/text/Text';

const openExternal = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

export const OsmSection = () => {
  const { t } = useTranslation('static');

  return (
    <ContentWrapper
      variant="green-gradient"
      paddingY="regular"
      className="flex-col-reverse xl:flex-row gap-10 xl:gap-16"
    >
      <div className="w-full">
        <Text variant="tint" size="large" weight="bold" className="pb-8 text-center xl:text-left">
          {t('SectionProjectOsmTitle')}
        </Text>
        <Text variant="white" size="small" className="text-center xl:text-left">
          {t('SectionProjectOsmContent')}
        </Text>
        <div className="flex flex-col md:flex-row items-center gap-4 pt-10 justify-center xl:justify-start">
          <Button
            variant="white"
            size="large"
            icon={iconExternalLinkMiddleGreen}
            onClick={() => openExternal('https://www.openstreetmap.org')}
          >
            OpenStreetMap.org
          </Button>
          <Button
            variant="white"
            size="large"
            icon={iconExternalLinkMiddleGreen}
            onClick={() => openExternal('https://www.openstreetmap.org/copyright')}
          >
            {t('SectionProjectOsmLicense')}
          </Button>
        </div>
      </div>
      <img
        src={imageOpenStreetMapLogo}
        alt="OpenStreetMap"
        className="w-[160px] md:w-[220px] shrink-0"
      />
    </ContentWrapper>
  );
};
