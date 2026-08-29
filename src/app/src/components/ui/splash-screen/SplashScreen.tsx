import defikarteLogo from '../../../assets/logo/defikarte-logo-quer-gruen-positiv-rgb.svg';
import procamedLogo from '../../../assets/logo/procamed-logo.svg';

/**
 * The splash the app itself draws, on top of everything, until the map is ready.
 *
 * It exists because the native launch splash cannot show this artwork on Android: the launch
 * splash goes through androidx.core:core-splashscreen, which only ever draws a background colour
 * and one centred icon. So the launch splash shows the mark, this takes over the moment it has
 * painted (see src/routes/__root.tsx), and the lockup is on screen for the rest of the start-up.
 * The proportions match assets/splash.png, which is what iOS shows before this - there the handover
 * is meant to be invisible.
 */
export const SplashScreen = () => {
  return (
    <div className="z-60 fixed inset-0 bg-primary-100-white flex flex-col items-center justify-center gap-[10vw]">
      <img src={defikarteLogo} alt="defikarte.ch" className="w-[69vw] max-w-100" />
      <img src={procamedLogo} alt="procamed" className="w-[33vw] max-w-48" />
    </div>
  );
};
