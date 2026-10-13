import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../../../components/ui/accordion/Accordion';
import { ContentWrapper } from '../../../components/ui/content-wrapper/ContentWrapper';
import { Text } from '../../../components/ui/text/Text';
import { useLocalizedAsset } from '../../../hooks/useLocalizedAsset';
import { AppAdvertisment } from '../../app-advertisment/AppAdvertisment';

interface HomeInfoProps {
  ref: Ref<HTMLDivElement>;
}

export const HomeInfo = ({ ref }: HomeInfoProps) => {
  const { t } = useTranslation('static');
  const { a } = useLocalizedAsset();

  return (
    <div ref={ref}>
      <ContentWrapper paddingY="small" className="flex-col pb-28 md:pb-28" variant="beige">
        <Text size="x-large" weight="bold" center className="pb-6">
          {t('SectionHomeTitle')}
        </Text>
        <Text size="regular" weight="light" center>
          {t('SectionHomeContent')}
        </Text>
        <div className="pt-20 flex w-full flex-col lg:flex-row justify-center items-center lg:items-baseline lg:justify-between gap-20 lg:gap-0">
          <div className="w-full md:w-[288px] lg:w-[232px] xl:w-[300px]">
            <img src={a('illustrationFeaturesFast')} />
            <Text size="medium" weight="bold" className="pt-10 pb-4 text-center lg:text-left">
              {t('SectionHomeClaimOneTitle')}
            </Text>
            <Text size="small" weight="regular" className="text-center lg:text-left">
              {t('SectionHomeClaimOneContent')}
            </Text>
          </div>
          <div className="w-full md:w-[288px] lg:w-[232px] xl:w-[300px]">
            <img src={a('illustrationFeaturesCorrect')} />
            <Text size="medium" weight="bold" className="pt-10 pb-4 text-center lg:text-left">
              {t('SectionHomeClaimTwoTitle')}
            </Text>
            <Text size="small" weight="regular" className="text-center lg:text-left">
              {t('SectionHomeClaimTwoContent')}
            </Text>
          </div>
          <div className="w-full md:w-[288px] lg:w-[232px] xl:w-[300px]">
            <img src={a('illustrationFeaturesCapture')} />
            <Text size="medium" weight="bold" className="pt-10 pb-4 text-center lg:text-left">
              {t('SectionHomeClaimThreeTitle')}
            </Text>
            <Text size="small" weight="regular" className="text-center lg:text-left">
              {t('SectionHomeClaimThreeContent')}
            </Text>
          </div>
        </div>
      </ContentWrapper>
      <AppAdvertisment />
      <ContentWrapper className="flex-col" variant="beige" paddingY="regular">
        <Text size="x-large" weight="bold" className="pb-4 text-center md:text-left">
          {t('SectionFAQTitle')}
        </Text>
        <Text className="text-center md:text-left">{t('SectionFAQContent')}</Text>
        <div className="pt-12 w-full flex flex-col gap-2">
          <Accordion title={t('SectionFAQQuestionOne')} content={t('SectionFAQAnswerOne')} />
          <Accordion title={t('SectionFAQQuestionTwo')} content={t('SectionFAQAnswerTwo')} />
          <Accordion title={t('SectionFAQQuestionThree')} content={t('SectionFAQAnswerThree')} />
          <Accordion title={t('SectionFAQQuestionFour')} content={t('SectionFAQAnswerFour')} />
          <Accordion title={t('SectionFAQQuestionFive')} content={t('SectionFAQAnswerFive')} />
        </div>
      </ContentWrapper>
    </div>
  );
};
