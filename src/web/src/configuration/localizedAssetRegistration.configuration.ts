import appScreenTeaserDe from '../assets/landingpages/home/app-screen-teaser-de.png';
import appScreenTeaserEn from '../assets/landingpages/home/app-screen-teaser-en.png';
import appScreenTeaserFr from '../assets/landingpages/home/app-screen-teaser-fr.png';
import appScreenTeaserkIt from '../assets/landingpages/home/app-screen-teaser-it.png';

import illustrationFeaturesCaptureDe from '../assets/landingpages/home/illustration-features-capture-de.png';
import illustrationFeaturesCaptureEn from '../assets/landingpages/home/illustration-features-capture-en.png';
import illustrationFeaturesCaptureFr from '../assets/landingpages/home/illustration-features-capture-fr.png';
import illustrationFeaturesCaptureIt from '../assets/landingpages/home/illustration-features-capture-it.png';

import illustrationFeaturesCorrectDe from '../assets/landingpages/home/illustration-features-correct-de.png';
import illustrationFeaturesCorrectEn from '../assets/landingpages/home/illustration-features-correct-en.png';
import illustrationFeaturesCorrectFr from '../assets/landingpages/home/illustration-features-correct-fr.png';
import illustrationFeaturesCorrectIt from '../assets/landingpages/home/illustration-features-correct-it.png';

import illustrationFeaturesFastDe from '../assets/landingpages/home/illustration-features-fast-de.png';
import illustrationFeaturesFastEn from '../assets/landingpages/home/illustration-features-fast-en.png';
import illustrationFeaturesFastFr from '../assets/landingpages/home/illustration-features-fast-fr.png';
import illustrationFeaturesFastIt from '../assets/landingpages/home/illustration-features-fast-it.png';

import illustrationFeaturesEmergencyDe from '../assets/landingpages/projekt/illustration-features-emergency-de.png';
import illustrationFeaturesEmergencyEn from '../assets/landingpages/projekt/illustration-features-emergency-en.png';
import illustrationFeaturesEmergencyFr from '../assets/landingpages/projekt/illustration-features-emergency-fr.png';
import illustrationFeaturesEmergencyIt from '../assets/landingpages/projekt/illustration-features-emergency-it.png';

import illustrationFeaturesFindDe from '../assets/landingpages/projekt/illustration-features-find-de.jpg';
import illustrationFeaturesFindEn from '../assets/landingpages/projekt/illustration-features-find-en.png';
import illustrationFeaturesFindFr from '../assets/landingpages/projekt/illustration-features-find-fr.png';
import illustrationFeaturesFindIt from '../assets/landingpages/projekt/illustration-features-find-it.png';

import unterstuetzungTwintDe from '../assets/landingpages/unterstuetzung/defikarte-unterstuetzung-twint-de.png';
import unterstuetzungTwintEn from '../assets/landingpages/unterstuetzung/defikarte-unterstuetzung-twint-en.png';
import unterstuetzungTwintFr from '../assets/landingpages/unterstuetzung/defikarte-unterstuetzung-twint-fr.png';
import unterstuetzungTwintIt from '../assets/landingpages/unterstuetzung/defikarte-unterstuetzung-twint-it.png';

import defikarteProjektTeaserDe from '../assets/landingpages/projekt/defikarte-projekt-teaser-de.jpg';
import defikarteProjektTeaserEn from '../assets/landingpages/projekt/defikarte-projekt-teaser-en.jpg';
import defikarteProjektTeaserFr from '../assets/landingpages/projekt/defikarte-projekt-teaser-fr.jpg';
import defikarteProjektTeaserIt from '../assets/landingpages/projekt/defikarte-projekt-teaser-it.jpg';

export interface LocalizedAsset {
  en: string;
  de: string;
  fr: string;
  it: string;
}

export type LocalizedAssetKey =
  | 'appScreenTeaser'
  | 'illustrationFeaturesCapture'
  | 'illustrationFeaturesCorrect'
  | 'illustrationFeaturesFast'
  | 'illustrationFeaturesEmergency'
  | 'illustrationFeaturesFind'
  | 'unterstuetzungTwint'
  | 'defikarteProjektTeaser';

export const localizedAssetRegistration: Record<LocalizedAssetKey, LocalizedAsset> = {
  appScreenTeaser: {
    en: appScreenTeaserEn,
    de: appScreenTeaserDe,
    fr: appScreenTeaserFr,
    it: appScreenTeaserkIt,
  },
  illustrationFeaturesCapture: {
    en: illustrationFeaturesCaptureEn,
    de: illustrationFeaturesCaptureDe,
    fr: illustrationFeaturesCaptureFr,
    it: illustrationFeaturesCaptureIt,
  },
  illustrationFeaturesCorrect: {
    en: illustrationFeaturesCorrectEn,
    de: illustrationFeaturesCorrectDe,
    fr: illustrationFeaturesCorrectFr,
    it: illustrationFeaturesCorrectIt,
  },
  illustrationFeaturesFast: {
    en: illustrationFeaturesFastEn,
    de: illustrationFeaturesFastDe,
    fr: illustrationFeaturesFastFr,
    it: illustrationFeaturesFastIt,
  },
  illustrationFeaturesEmergency: {
    en: illustrationFeaturesEmergencyEn,
    de: illustrationFeaturesEmergencyDe,
    fr: illustrationFeaturesEmergencyFr,
    it: illustrationFeaturesEmergencyIt,
  },
  illustrationFeaturesFind: {
    en: illustrationFeaturesFindEn,
    de: illustrationFeaturesFindDe,
    fr: illustrationFeaturesFindFr,
    it: illustrationFeaturesFindIt,
  },
  unterstuetzungTwint: {
    en: unterstuetzungTwintEn,
    de: unterstuetzungTwintDe,
    fr: unterstuetzungTwintFr,
    it: unterstuetzungTwintIt,
  },
  defikarteProjektTeaser: {
    en: defikarteProjektTeaserEn,
    de: defikarteProjektTeaserDe,
    fr: defikarteProjektTeaserFr,
    it: defikarteProjektTeaserIt,
  },
};
