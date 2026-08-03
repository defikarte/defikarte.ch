export const isMobileAgent = () => {
  const isMobile = () => {
    return /Mobi|Android/i.test(navigator.userAgent);
  };

  return isMobile;
};
