import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';
import iconArrowDownWhite from '../../assets/landingpages/icon-arrow-down-white.svg';
import iconExternalLinkWhite from '../../assets/landingpages/icon-external-link-white.svg';
import imageDefikarteUnterstuetzungSackmesser from '../../assets/landingpages/unterstuetzung/defikarte-unterstuetzung-sackmesser.jpg';
import imageDefikarteWissenTeaser from '../../assets/landingpages/wissen/defikarte-wissen-teaser.jpg';
import imageProcamedInfobox from '../../assets/landingpages/wissen/procamed-infobox.jpg';
import imageDefirbillationHoch01 from '../../assets/landingpages/wissen/wissen-defibrillation-hoch-01.jpg';
import imageDefirbillationHoch02 from '../../assets/landingpages/wissen/wissen-defibrillation-hoch-02.jpg';
import imageDefirbillationHoch03 from '../../assets/landingpages/wissen/wissen-defibrillation-hoch-03.jpg';
import imageDefirbillationQuer01 from '../../assets/landingpages/wissen/wissen-defibrillation-quer-01.jpg';
import imageDefirbillationQuer02 from '../../assets/landingpages/wissen/wissen-defibrillation-quer-02.jpg';
import imageDefirbillationQuer03 from '../../assets/landingpages/wissen/wissen-defibrillation-quer-03.jpg';
import { Button } from '@defikarte/shared';
import { ContentWrapper } from '../../components/ui/content-wrapper/ContentWrapper';
import { Hero } from '../../components/ui/hero/Hero';
import { Text } from '../../components/ui/text/Text';
import { useHandleNextViewClick } from '../../hooks/useHandleNextViewClick';
import { AppAdvertisment } from '../app-advertisment/AppAdvertisment';

export const Knowledge = () => {
  const { t } = useTranslation('static');
  const isMediumOnly = useMediaQuery({ maxWidth: 1023, minWidth: 320 });
  const { ref: firstViewRef, onClick: handleNextViewClick } = useHandleNextViewClick();

  const handleOrderKnifeClick = () => {
    const email = 'orders@defikarte.ch';
    const subject = t('OrderKnifeSubject');
    const body = t('OrderKnifeBody');
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div>
      <Hero
        title={t('SectionKnowledgeTitle')}
        description={[t('SectionKnowledgeContent')]}
        buttonText={t('InformKnow')}
        buttonIcon={iconArrowDownWhite}
        image={imageDefikarteWissenTeaser}
        onButtonClick={handleNextViewClick}
      />
      <ContentWrapper
        variant="beige"
        paddingY="large"
        className="flex-col lg:flex-row"
        ref={firstViewRef}
      >
        <div>
          <Text size="large" weight="bold" className="pb-6">
            {t('SectionKnowledgePartOneTitle')}
          </Text>
          <Text size="small">{t('SectionKnowledgePartOneContent')}</Text>
        </div>
        {!isMediumOnly && (
          <img
            src={imageDefirbillationHoch01}
            className="w-[262px] rounded-2xl lg:ms-[88px] mt-10 md:mt-0"
          />
        )}
        {isMediumOnly && (
          <img src={imageDefirbillationQuer01} className="w-full rounded-2xl mt-10" />
        )}
      </ContentWrapper>
      <ContentWrapper variant="white" paddingY="large" className="flex-col lg:flex-row">
        {!isMediumOnly && (
          <img
            src={imageDefirbillationHoch02}
            className="w-[262px] rounded-2xl lg:me-[88px] mt-10 md:mt-0"
          />
        )}
        <div>
          <Text size="large" weight="bold" className="pb-6">
            {t('SectionKnowledgePartTwoTitle')}
          </Text>
          <Text size="small">{t('SectionKnowledgePartTwoContent')}</Text>
        </div>
        {isMediumOnly && (
          <img src={imageDefirbillationQuer02} className="w-full rounded-2xl mt-10" />
        )}
      </ContentWrapper>
      <ContentWrapper variant="beige" paddingY="large" className="flex-col lg:flex-row">
        <div>
          <Text size="large" weight="bold" className="pb-6">
            {t('SectionKnowledgePartThreeTitle')}
          </Text>
          <Text size="small">{t('SectionKnowledgePartThreeContent')}</Text>
        </div>
        {!isMediumOnly && (
          <img
            src={imageDefirbillationHoch03}
            className="w-[262px] rounded-2xl lg:ms-[88px] mt-10 md:mt-0"
          />
        )}
        {isMediumOnly && (
          <img src={imageDefirbillationQuer03} className="w-full rounded-2xl mt-10" />
        )}
      </ContentWrapper>
      <ContentWrapper variant="white" paddingY="regular" className="flex-col">
        <Text size="large" weight="bold" center className="pb-6">
          {t('SectionKnowledgeProcessTitle')}
        </Text>
        <Text size="small" className="pb-16" weight="light" center>
          {t('SectionKnowledgeProcessContent')}
        </Text>
        <iframe
          className="w-full aspect-video md:w-[700px]  lg:w-[800px] xl:w-[1000px]"
          src="https://www.youtube.com/embed/A8kgbQnVHfc"
          title="In der City: Leben Retten mit dem ZOLL AED 3 Defibrillator"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      </ContentWrapper>
      <ContentWrapper variant="beige" paddingY="regular">
        <div className="w-full flex flex-col lg:flex-row justify-center items-center lg:items-start lg:justify-between">
          <div className="flex flex-col w-full md:w-[380px] xl:w-[470px] pb-[50px] lg:pb-0">
            <img src={imageProcamedInfobox} className="rounded-2xl" />
            <Text size="medium" weight="bold" className="pb-4 pt-10">
              {t('SectionKnowledgeInfoboxTitle')}
            </Text>
            <Text size="small" weight="light" className="pb-6">
              {t('SectionKnowledgeInfoboxContent')}
            </Text>
            <Button
              icon={iconExternalLinkWhite}
              size="large"
              className="w-fit"
              onClick={() => open('https://www.aed.ch/kontakt/Erste-Hilfeset.php', '_blank')}
            >
              {t('Order')}
            </Button>
          </div>
          <div className="flex flex-col w-full md:w-[380px] xl:w-[470px]">
            <img src={imageDefikarteUnterstuetzungSackmesser} className="rounded-2xl" />
            <Text size="medium" weight="bold" className="pb-4 pt-10">
              {t('SectionKnowledgeKnifeTitle')}
            </Text>
            <Text size="small" weight="light" className="pb-6">
              {t('SectionKnowledgeKnifeContent')}
            </Text>
            <Button
              icon={iconExternalLinkWhite}
              size="large"
              className="w-fit"
              onClick={handleOrderKnifeClick}
            >
              {t('Order')}
            </Button>
          </div>
        </div>
      </ContentWrapper>
      <AppAdvertisment />
    </div>
  );
};
