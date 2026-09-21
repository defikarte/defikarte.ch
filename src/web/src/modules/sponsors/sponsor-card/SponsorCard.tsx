import classNames from 'classnames';

type SponsorCardProps = {
  href: string;
  src: string;
  compact?: boolean;
};

export const SponsorCard = ({ src, href, compact }: SponsorCardProps) => {
  const imgClass = classNames(compact ? 'h-[94px] object-contain' : 'w-full');
  return (
    <a href={href} className="cursor-pointer w-full md:w-auto" target="_blank">
      <div className="w-full px-8 md:px-9 lg:px-10.5 xl:px-8.5 py-12.5 md:py-14.5 lg:py-16.5 xl:py-13.5 md:w-77 rounded-2xl flex justify-center items-center bg-primary-100-white">
        <img src={src} className={imgClass} />
      </div>
    </a>
  );
};
