import classNames from 'classnames';

type SponsorCardProps = {
  href: string;
  src: string;
  compact?: boolean;
};

export const SponsorCard = ({ src, href, compact }: SponsorCardProps) => {
  const linkClass = classNames(
    'cursor-pointer',
    compact ? 'w-[calc(50%-10px)] md:w-52 lg:w-43 xl:w-55' : 'w-full md:w-auto'
  );
  const cardClass = classNames(
    'w-full rounded-2xl flex justify-center items-center bg-primary-100-white',
    compact
      ? 'px-4 py-8 lg:py-10'
      : 'px-8 md:px-9 lg:px-10.5 xl:px-8.5 py-12.5 md:py-14.5 lg:py-16.5 xl:py-13.5 md:w-77'
  );
  const imgClass = classNames(compact ? 'h-16 w-full object-contain' : 'w-full');
  return (
    <a href={href} className={linkClass} target="_blank">
      <div className={cardClass}>
        <img src={src} className={imgClass} />
      </div>
    </a>
  );
};
