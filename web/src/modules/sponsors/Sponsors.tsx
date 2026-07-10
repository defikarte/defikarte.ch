import { useTranslation } from 'react-i18next';
import iconArrowDownWhite from '../../assets/landingpages/icon-arrow-down-white.svg';
import iconEmailWhite from '../../assets/landingpages/icon-email-white.svg';
import iconExternalLinkWhite from '../../assets/landingpages/icon-external-link-white.svg';
import imageDefikartePartnerByteworks from '../../assets/landingpages/unterstuetzung/defikarte-partner-byteworks.svg';
import imageDefikartePartnerFirstResponder from '../../assets/landingpages/unterstuetzung/defikarte-partner-first-responder.jpg';
import imageDefikartePartnerFurrer from '../../assets/landingpages/unterstuetzung/defikarte-partner-furrer.jpg';
import imageDefikartePartnerHostpoint from '../../assets/landingpages/unterstuetzung/defikarte-partner-hostpoint.svg';
import imageDefikartePartnerKtsg from '../../assets/landingpages/unterstuetzung/defikarte-partner-ktsg.svg';
import imageDefikartePartnerLifetec from '../../assets/landingpages/unterstuetzung/defikarte-partner-lifetec.svg';
import imageDefikartePartnerOctave from '../../assets/landingpages/unterstuetzung/defikarte-partner-octave.svg';
import imageDefikartePartnerProcamed from '../../assets/landingpages/unterstuetzung/defikarte-partner-procamed.svg';
import imageDefikartePartnerResqpro from '../../assets/landingpages/unterstuetzung/defikarte-partner-resqpro.jpg';
import imageDefikartePartnerSinoma from '../../assets/landingpages/unterstuetzung/defikarte-partner-sinoma.jpg';
import imageDefikartePartnerSirmed from '../../assets/landingpages/unterstuetzung/defikarte-partner-sirmed.svg';
import imageDefikartePartnerSusv from '../../assets/landingpages/unterstuetzung/defikarte-partner-susv.svg';
import imageDefikartePartnerAkkupoint from '../../assets/landingpages/unterstuetzung/defikarte-partner-akkupoint.jpg';
import imageDefikarteUnterstuetzungSackmesser from '../../assets/landingpages/unterstuetzung/defikarte-unterstuetzung-sackmesser.jpg';
import imageDefikarteUnterstuetzungTeaser from '../../assets/landingpages/unterstuetzung/defikarte-unterstuetzung-teaser.jpg';
import { Button } from '../../components/ui/button/Button';
import { ContentWrapper } from '../../components/ui/content-wrapper/ContentWrapper';
import { Hero } from '../../components/ui/hero/Hero';
import { Text } from '../../components/ui/text/Text';
import { useHandleNextViewClick } from '../../hooks/useHandleNextViewClick';
import { useLocalizedAsset } from '../../hooks/useLocalizedAsset';
import { AppAdvertisment } from '../app-advertisment/AppAdvertisment';
import { SponsorCard } from './sponsor-card/SponsorCard';
import { SponsorPlatinCard } from './sponsor-platin-card/SponsorPlatinCard';
import { TwintButton } from './twint-button/TwintButton';

export const Sponsors = () => {
  const { t } = useTranslation('static');
  const { a } = useLocalizedAsset();
  const { ref: firstViewRef, onClick: handleNextViewClick } = useHandleNextViewClick();

  const handleMailtoClick = () => {
    const email = 'sponsoring@defikarte.ch';
    window.location.href = `mailto:${email}`;
  };

  const handleOrderKnifeClick = () => {
    const email = 'orders@defikarte.ch';
    const subject = t('OrderKnifeSubject');
    const body = t('OrderKnifeBody');
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div>
      <Hero
        title={t('SectionSponsorsTitle')}
        description={[t('SectionSponsorsContent')]}
        image={imageDefikarteUnterstuetzungTeaser}
        buttonText={t('InformKnow')}
        buttonIcon={iconArrowDownWhite}
        onButtonClick={handleNextViewClick}
      />
      <ContentWrapper
        paddingY="regular"
        variant="white"
        className="flex-col break-words"
        ref={firstViewRef}
      >
        <Text className="pb-6" variant="primary" size="large" weight="bold" center>
          {t('SectionSponsorsSearchTitle')}
        </Text>
        <Text className="pb-8 whitespace-pre-line" center variant="primary" size="regular">
          {t('SectionSponsorsSearchContent')}
        </Text>
        <Button icon={iconEmailWhite} size="large" onClick={handleMailtoClick}>
          sponsoring@defikarte.ch
        </Button>
      </ContentWrapper>
      <ContentWrapper variant="beige" paddingY="regular" className="flex-col gap-28 pb-16 md:pb-32">
        <div className="w-full md:w-95 lg:w-auto flex flex-col lg:flex-row gap-10 xl:gap-20 items-center justify-center">
          <img
            className="rounded-2xl md:w-95 xl:w-115"
            src={imageDefikarteUnterstuetzungSackmesser}
          />
          <div className="w-full">
            <Text size="large" weight="bold" className="pb-4">
              {t('SectionSponsorsKnifeTitle')}
            </Text>
            <Text size="regular" className="pb-8">
              {t('SectionSponsorsKnifeContent')}
            </Text>
            <Button icon={iconExternalLinkWhite} size="large" onClick={handleOrderKnifeClick}>
              {t('Order')}
            </Button>
          </div>
        </div>
        <div className="md:w-95 lg:w-auto flex flex-col lg:flex-row gap-10 xl:gap-20 items-center justify-center">
          <img className="rounded-2xl md:w-95 xl:w-115" src={a('unterstuetzungTwint')} />
          <div>
            <Text size="large" weight="bold" className="pb-4">
              {t('SectionSponsorsTwintTitle')}
            </Text>
            <Text size="regular" className="pb-8">
              {t('SectionSponsorsTwintContent')}
            </Text>
            <TwintButton />
          </div>
        </div>
      </ContentWrapper>
      <ContentWrapper paddingY="regular" variant="green-gradient" className="flex-col">
        <Text variant="tint" size="large" weight="bold" className="pb-6" center>
          {t('SectionSponsorsPlatinTitle')}
        </Text>
        <Text variant="white" size="regular" center className="pb-20">
          {t('SectionSponsorsPlatinContent')}
        </Text>
        <div className="flex flex-col lg:flex-row w-full gap-5 md:gap-9">
          <SponsorPlatinCard
            description={t('ClaimSponsorsProcamed')}
            title="Procamed AG"
            href="https://www.aed.ch/"
            src={imageDefikartePartnerProcamed}
          />
          <SponsorPlatinCard
            description={t('ClaimSponsorsLifetec')}
            title="Lifetec AG"
            href="https://www.lifetec.ch/"
            src={imageDefikartePartnerLifetec}
          />
        </div>
      </ContentWrapper>
      <ContentWrapper variant="beige" paddingY="regular" className="flex-col">
        <Text size="large" weight="bold" className="pb-16">
          {t('SectionSponsorsGold')}
        </Text>
        <div className="flex gap-5 md:gap-9 justify-center flex-wrap">
          <SponsorCard
            src={imageDefikartePartnerFirstResponder}
            href="https://www.first-responder.ch/"
          />
          <SponsorCard src={imageDefikartePartnerSirmed} href="https://www.sirmed.ch/" />
          <SponsorCard src={imageDefikartePartnerResqpro} href="https://www.resqpro.ch/" />
          <SponsorCard src={imageDefikartePartnerByteworks} href="https://www.byteworks.ch/" />
          <SponsorCard src={imageDefikartePartnerFurrer} href="https://www.furrerit.ch/" />
          <SponsorCard src={imageDefikartePartnerSinoma} href="https://www.sinoma.ch/" />
          <SponsorCard src={imageDefikartePartnerKtsg} href="https://www.sg.ch/" />
        </div>
        <Text size="large" weight="bold" className="pt-32 pb-16">
          {t('SectionSponsorsSilver')}
        </Text>
        <div className="flex gap-5 md:gap-9 justify-center flex-wrap">
          <SponsorCard
            src={imageDefikartePartnerOctave}
            href="https://www.octave.com/"
            className="h-[94px]"
          />
          <SponsorCard
            src={imageDefikartePartnerHostpoint}
            href="https://www.hostpoint.ch/"
            className="h-[94px]"
          />
          <SponsorCard
            src={imageDefikartePartnerSusv}
            href="https://www.susv.ch/"
            className="h-[94px]"
          />
                    <SponsorCard
            src={imageDefikartePartnerAkkupoint}
            href="https://www.akkupoint.ch/"
            className="h-[94px]"
          />
        </div>
      </ContentWrapper>
      <AppAdvertisment />
    </div>
  );
};
