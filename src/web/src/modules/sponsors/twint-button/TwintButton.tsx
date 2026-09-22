import { useTranslation } from 'react-i18next';

export const TwintButton = () => {
  const { i18n } = useTranslation();

  const imageSrc = `https://go.twint.ch/static/img/button_dark_${i18n.resolvedLanguage}.svg`;
  return (
    <button
      className="w-auto h-11 rounded-md flex justify-center cursor-pointer bg-transparent items-center"
      onClick={() =>
        window.open(
          'https://go.twint.ch/1/e/tw?tw=acq.1wealJmTTB2VY9vmBrijw0QIZtEGyjGr0KW7E0XaFfvJ5Hcx0fAdVhJvWMfSyVHt.',
          '_blank'
        )
      }
    >
      <img className="w-auto h-11" alt="Pay with TWINT" src={imageSrc} />
    </button>
  );
};
