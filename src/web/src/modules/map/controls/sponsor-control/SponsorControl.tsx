import { useTranslation } from 'react-i18next';
import logoLifetec from '../../../../assets/logo/lifetec-logo.svg';
import logoProcamed from '../../../../assets/logo/procamed-logo.svg';

export const SponsorControl = () => {
  const { t } = useTranslation();

  return (
    <div className="z-30 absolute bottom-0 right-6 bg-primary-100-white rounded-t-2xl hidden md:visible md:flex items-center px-4 py-1 w-[304px] shadow-custom-partner">
      <p className="text-primary-100-green-04 text-xs leading-[150%]">{t('partner')}</p>
      <a href="https://www.aed.ch/" target="_blank" className="cursor-pointer">
        <img src={logoProcamed} alt="procamed" className="ml-4 mr-3" />
      </a>
      <a href="https://www.lifetec.ch/" target="_blank" className="cursor-pointer">
        <img src={logoLifetec} alt="lifetec" className="" />
      </a>
    </div>
  );
};
