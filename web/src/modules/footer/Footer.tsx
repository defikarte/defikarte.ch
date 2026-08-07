import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import defikarteLogoQuerGruenNegativRgb from '../../assets/logo/defikarte-logo-quer-gruen-negativ-rgb.svg';
import iconExternalLinkMiddleGreen from '../../assets/navigation/icon-external-link-middle-green.svg';
import lifetectLogoWhite from '../../assets/navigation/lifetec-logo-white.svg';
import openbracketsLogoWhite from '../../assets/navigation/openbrackets-logo-white.svg';
import procamedLogoWhite from '../../assets/navigation/procamed-logo-white.svg';
import { ContentWrapper } from '../../components/ui/content-wrapper/ContentWrapper';
import AppConfiguration from '../../configuration/app.configuration';

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <ContentWrapper variant="green" className="pt-20 md:pt-20 pb-10 md:pb-10 flex-col">
      <div className="w-full md:pb-20 flex flex-col md:flex-row md:justify-between">
        <div>
          <img
            src={defikarteLogoQuerGruenNegativRgb}
            alt="defikarte.ch"
            className="w-[150px] pb-8"
          />
        </div>
        <div className="w-full md:w-1/2 grid md:grid-cols-3 md:grid-flow-col md:grid-rows-3 gap-3 pt-10 md:pt-0">
          <a
            href="/"
            className="text-primary-100-white font-normal leading-[150%] text-sm cursor-pointer"
          >
            defikarte.ch
          </a>
          {AppConfiguration.routes
            .filter(r => r.key !== 'home')
            .map(r => (
              <NavLink
                key={r.key}
                to={r.route}
                className="text-primary-100-white font-normal leading-[150%] text-sm cursor-pointer"
              >
                {t(r.key)}
              </NavLink>
            ))}
          <NavLink
            key="legal"
            to="/privacy"
            className="text-primary-100-white font-normal leading-[150%] text-sm cursor-pointer row-span-2"
          >
            {t('legal')}
          </NavLink>
          <a
            href="https://github.com/defikarte/defikarte.ch"
            target="_blank"
            className="flex text-primary-100-white font-normal leading-[150%] text-sm cursor-pointer h-fit"
          >
            GitHub
            <img src={iconExternalLinkMiddleGreen} className="ps-1" />
          </a>
        </div>
      </div>
      <div className="w-full flex flex-col md:flex-row items-start md:items-center gap-6 py-14 md:py-0">
        <p className="text-[8px] text-primary-100-white leading-[150%] me-auto hidden md:flex">
          © {new Date().getFullYear()} defikarte.ch
        </p>
        <p className="text-xs text-primary-100-white leading-[150%]">{t('supportedBy')}</p>
        <div className="flex items-center gap-6">
          <a href="https://www.aed.ch/" target="_blank" className="cursor-pointer">
            <img src={procamedLogoWhite} alt="procamed" className="h-[25px]" />
          </a>
          <a href="https://www.lifetec.ch/" target="_blank" className="cursor-pointer">
            <img src={lifetectLogoWhite} alt="lifetec one" className="h-[25px]" />
          </a>
        </div>
      </div>
      <p className="text-[8px] text-primary-100-white leading-[150%] me-auto md:hidden">
        © {new Date().getFullYear()} defikarte.ch
      </p>
    </ContentWrapper>
  );
};
