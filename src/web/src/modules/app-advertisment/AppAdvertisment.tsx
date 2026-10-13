import { useTranslation } from 'react-i18next';
import imageAppleAppStoreGreenDe from '../../assets/landingpages/apple-app-store-green-de.svg';
import imageAppleAppStoreWhiteDe from '../../assets/landingpages/apple-app-store-white-de.svg';
import imageGooglePlayStoreGreenDe from '../../assets/landingpages/google-play-store-green-de.svg';
import imageGooglePlayStoreWhiteDe from '../../assets/landingpages/google-play-store-white-de.svg';
import { ContentWrapper } from '../../components/ui/content-wrapper/ContentWrapper';
import { Text } from '../../components/ui/text/Text';
import { useLocalizedAsset } from '../../hooks/useLocalizedAsset';

interface AppAdvertismentProps {
  variant?: 'white' | 'green';
}

export const AppAdvertisment = ({ variant = 'green' }: AppAdvertismentProps) => {
  const { t } = useTranslation('static');
  const { a } = useLocalizedAsset();

  const titleText = variant === 'green' ? t('SectionAppTitle') : t('SectionProjectAppTitle');
  const contentText = variant === 'green' ? t('SectionAppContent') : t('SectionProjectAppContent');
  return (
    <ContentWrapper
      variant={variant === 'green' ? 'green-gradient' : 'white'}
      paddingY="regular"
      className="pb-0 md:pb-0 xl:pt-0 flex-col xl:flex-row"
    >
      <div>
        <Text
          size="large"
          variant={variant === 'green' ? 'tint' : 'primary'}
          weight="bold"
          className="pb-8 text-center xl:text-left"
        >
          {titleText}
        </Text>
        <Text
          size="small"
          variant={variant === 'green' ? 'white' : 'primary'}
          weight="regular"
          className="text-center xl:text-left"
        >
          {contentText}
        </Text>
        <div className="flex flex-row gap-2 md:gap-4 pt-10 justify-center xl:justify-start">
          <a
            href="https://apps.apple.com/us/app/defikarte-ch/id1549569525"
            target="_blank"
            className="cursor-pointer"
          >
            <img
              src={variant === 'green' ? imageAppleAppStoreWhiteDe : imageAppleAppStoreGreenDe}
              className="h-9 md:h-auto"
            />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=ch.defikarte.app"
            target="_blank"
            className="cursor-pointer"
          >
            <img
              src={variant === 'green' ? imageGooglePlayStoreWhiteDe : imageGooglePlayStoreGreenDe}
              className="h-9 md:h-auto"
            />
          </a>
        </div>
      </div>
      <img
        src={a('appScreenTeaser')}
        className="md:max-w-[469px] xl:max-w-[570px] pt-[52px] xl:ms-[45px] xl:-me-8"
      />
    </ContentWrapper>
  );
};
