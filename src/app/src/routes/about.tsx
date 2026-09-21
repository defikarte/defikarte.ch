import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import iconExternalLink from '../assets/icons/icon-external-link-middle-green.svg';
import logo from '../assets/infos_page/defikarte-logo-hochformat.svg';
import moodImage from '../assets/infos_page/defikarte-mood-image-01-de.jpg';
import partnerLifetec from '../assets/infos_page/defikarte-partner-lifetec.svg';
import partnerProcamed from '../assets/infos_page/defikarte-partner-procamed.svg';

export const Route = createFileRoute('/about')({
  component: RouteComponent,
});

function ExternalLinkCard({ url, title }: { url: string; title?: string }) {
  return (
    <a
      href={`https://${url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-xl bg-primary-100-white p-4"
    >
      <span className="text-xs font-medium leading-normal text-primary-100-green-04">
        {title ?? url}
      </span>
      <img src={iconExternalLink} alt="" className="ms-5 h-4 w-4" />
    </a>
  );
}

function SponsorCard({ logo, alt, url }: { logo: string; alt: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center rounded-2xl px-6 py-10 bg-primary-100-white"
    >
      <img src={logo} alt={alt} className="max-h-12" />
    </a>
  );
}

function Divider() {
  return <div className="my-10 h-px w-full bg-grey-divider"></div>;
}

function RouteComponent() {
  const { t } = useTranslation();
  return (
    // Inline rather than an arbitrary bg-[...] value: Tailwind's normalisation of the math in the
    // colour stops drops the space that separates a stop's colour from its position, which makes
    // the gradient invalid. The band grows with the top inset so it still ends at the same point
    // below the status bar as it did without one.
    <div
      style={{
        background:
          'linear-gradient(to bottom, var(--color-primary-100-green-04) calc(250px + var(--sa-top)), var(--color-beige) calc(250px + var(--sa-top)))',
      }}
    >
      <div className="pl-[calc(1rem+var(--sa-left))] pr-[calc(1rem+var(--sa-right))]">
        {/* Hero */}
        <div className="flex flex-col items-center pt-[calc(2rem+var(--sa-top))] pb-8">
          <img src={logo} alt="defikarte.ch" />
        </div>
        {/* Mood image */}
        <img src={moodImage} alt="" className="w-full rounded-xl object-cover" />

        {/* Das Projekt */}
        <section className="pt-8">
          <h2 className="text-2xl font-medium text-primary-100-green-04">{t('infos.project')}</h2>
          <p className="mt-3 text-xs leading-normal text-primary-100-green-04">
            {t('infos.projectText')}
          </p>
          <div className="mt-6">
            <ExternalLinkCard url="www.openbrackets.ch" />
          </div>
        </section>

        <Divider />

        {/* Sponsoren */}
        <section>
          <h2 className="text-2xl font-medium text-primary-100-green-04">{t('infos.sponsors')}</h2>
          <p className="mt-3 text-xs leading-normal text-primary-100-green-04">
            {t('infos.sponsorsText')}
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <SponsorCard url="https://www.aed.ch/" logo={partnerProcamed} alt="Procamed" />
            <SponsorCard url="https://www.lifetec.ch/" logo={partnerLifetec} alt="Lifetec" />
          </div>

          <div className="mt-4">
            <ExternalLinkCard url="www.defikarte.ch/sponsors" title={t('infos.allSponsors')} />
          </div>
        </section>

        <Divider />

        {/* Open Source */}
        <section className="pb-8">
          <h2 className="text-2xl font-medium text-primary-100-green-04">
            {t('infos.openSource')}
          </h2>
          <p className="mt-3 text-xs leading-normal text-primary-100-green-04">
            {t('infos.openSourceText')}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <ExternalLinkCard url="www.openstreetmap.org" />
            <ExternalLinkCard url="www.github.com/OpenBracketsCH" />
          </div>
        </section>
      </div>
    </div>
  );
}
