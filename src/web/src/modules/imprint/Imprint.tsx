import { useTranslation } from 'react-i18next';
import iconEmailWhite from '../../assets/landingpages/icon-email-white.svg';
import { ContentWrapper } from '../../components/ui/content-wrapper/ContentWrapper';
import { Hero } from '../../components/ui/hero/Hero';
import { Text } from '../../components/ui/text/Text';

export const Imprint = () => {
  const { t } = useTranslation('static');
  const handleMailtoClick = () => {
    const email = 'info@defikarte.ch';
    window.location.href = `mailto:${email}`;
  };

  return (
    <div>
      <Hero
        title={t('SectionImpressumTitle')}
        description={[
          'Verein defikarte.ch',
          `Christian Nüssli, ${t('SectionImpressumPresident')}`,
          'Grüningerstrasse 149a',
          '8626 Ottikon',
        ]}
        buttonText="info@defikarte.ch"
        buttonIcon={iconEmailWhite}
        onButtonClick={handleMailtoClick}
      />
      <ContentWrapper variant="beige" paddingY="regular" className="flex-col items-start">
        <Text size="medium" weight="bold" className="pb-3 lg:max-w-full">
          {t('SectionImpressumPartSevenTitle')}
        </Text>
        <Text size="regular" weight="regular" className="pb-10 lg:max-w-full">
          {t('SectionImpressumPartSevenContent')}
        </Text>
        <Text size="medium" weight="bold" className="pb-3 lg:max-w-full">
          {t('SectionImpressumPartEightTitle')}
        </Text>
        <Text size="regular" weight="regular" className="pb-10 lg:max-w-full">
          {t('SectionImpressumPartEightContent')}
        </Text>
      </ContentWrapper>
    </div>
  );
};
