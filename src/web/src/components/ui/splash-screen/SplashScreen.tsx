import iconDefikarte from '../../../assets/icons/icon-defikarte.svg';

export const SplashScreen = () => {
  return (
    <>
      <div className="z-20 absolute top-0 bg-primary-60-white h-full w-full"></div>
      <div className="z-20 absolute top-0 h-full w-full flex justify-center items-center">
        <img src={iconDefikarte} alt="defikarte.ch" className="w-15 animate-bounce" />
      </div>
    </>
  );
};
