import { Share } from '@capacitor/share';

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
