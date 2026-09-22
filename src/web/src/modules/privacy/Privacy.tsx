import { useTranslation } from 'react-i18next';
import iconEmailWhite from '../../assets/landingpages/icon-email-white.svg';
import { ContentWrapper } from '../../components/ui/content-wrapper/ContentWrapper';
import { Hero } from '../../components/ui/hero/Hero';
import { Text } from '../../components/ui/text/Text';

export const Privacy = () => {
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
          'Christian Nüssli',
          'Grüningerstrasse 149a',
          '8626 Ottikon',
        ]}
        buttonText="info@defikarte.ch"
        buttonIcon={iconEmailWhite}
        onButtonClick={handleMailtoClick}
      />
      <ContentWrapper variant="beige" paddingY="regular" className="flex-col items-start">
        <Text size="medium" weight="bold" className="pb-3 lg:max-w-full">
          {t('SectionImpressumPartOneTitle')}
        </Text>
        <Text size="regular" weight="regular" className="pb-10 lg:max-w-full">
          {t('SectionImpressumPartOneContent')}
        </Text>
        <Text size="medium" weight="bold" className="pb-3 lg:max-w-full">
          {t('SectionImpressumPartTwoTitle')}
        </Text>
        <Text size="regular" weight="regular" className="pb-10 lg:max-w-full">
          {t('SectionImpressumPartTwoContent')}
        </Text>
        <Text size="medium" weight="bold" className="pb-3 lg:max-w-full">
          {t('SectionImpressumPartThreeTitle')}
        </Text>
        <Text size="regular" weight="regular" className="pb-10 lg:max-w-full">
          {t('SectionImpressumPartThreeContent')}
        </Text>
        <Text size="medium" weight="bold" className="pb-3 lg:max-w-full">
          {t('SectionImpressumPartFourTitle')}
        </Text>
        <Text size="regular" weight="regular" className="pb-10 lg:max-w-full">
          {t('SectionImpressumPartFourContent')}
        </Text>
        <Text size="medium" weight="bold" className="pb-3 lg:max-w-full">
          {t('SectionImpressumPartFiveTitle')}
        </Text>
        <Text size="regular" weight="regular" className="pb-10 lg:max-w-full">
          {t('SectionImpressumPartFiveContent')}
        </Text>
        <Text size="medium" weight="bold" className="pb-3 lg:max-w-full">
          {t('SectionImpressumPartSixTitle')}
        </Text>
        <Text size="regular" weight="regular" className="pb-10 lg:max-w-full">
          {t('SectionImpressumPartSixContent')}
        </Text>
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
        <Text size="medium" weight="bold" className="pb-3 lg:max-w-full">
          {t('SectionImpressumPartNineTitle')}
        </Text>
        <Text size="regular" weight="regular" className="pb-10 lg:max-w-full">
          {t('SectionImpressumPartNineContent')}
        </Text>
        <Text size="medium" weight="bold" className="pb-3 lg:max-w-full">
          {t('SectionImpressumPartTenTitle')}
        </Text>
        <Text size="regular" weight="regular" className="pb-10 lg:max-w-full">
          {t('SectionImpressumPartTenContent')}
        </Text>
        <Text>Ottikon, 05.08.2023</Text>
        <Text>
          Quelle:{' '}
          <a
            href="https://www.swissanwalt.ch/"
            target="_blank"
            className="text-primary-100-green-03 cursor-pointer"
          >
            Swiss Anwalt
          </a>
        </Text>
      </ContentWrapper>
    </div>
  );
};
