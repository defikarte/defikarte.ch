import { Share } from '@capacitor/share';

/**
 * The link to an AED on the website. The app runs on its own local origin (capacitor://localhost
 * on iOS, https://localhost on Android), so it always links to defikarte.ch.
 */
export const getAedUrl = (aedId: string | number): string =>
  `https://defikarte.ch/map/aed/${aedId}`;

/**
 * Opens the share menu of the platform. The web share API is missing in the Android WebView,
 * the Capacitor plugin works on both platforms.
 */
export const shareLink = async (url: string, title: string): Promise<void> => {
  try {
    await Share.share({ title, url, dialogTitle: title });
  } catch (error) {
    // closing the share menu rejects too, that is no error
    if (error instanceof Error && error.message === 'Share canceled') return;
    throw error;
  }
};
