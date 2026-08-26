import { Link } from '@tanstack/react-router';
import iconArrowLeftWhite from '../../../assets/icons/icon-arrow-left-white.svg';

interface SettingsPageProps extends React.PropsWithChildren {
  title: string;
  backTo?: string;
}

export const SettingsPage = ({ backTo, children, title }: SettingsPageProps) => {
  return (
    <div className="h-full flex gap-2 flex-col px-4 pt-16 bg-linear-to-b from-primary-100-green-04 to-[#487745]">
      {/* The back link is absolutely positioned so the title stays centred on the page, not in
          the space left over next to the link. */}
      <div className="relative mb-9">
        {backTo && (
          <Link to={backTo} className="absolute inset-y-0 start-0 flex items-center">
            <img src={iconArrowLeftWhite} alt="" className="h-6" />
          </Link>
        )}
        <h1 className="text-center text-2xl font-medium text-primary-100-green-01">{title}</h1>
      </div>
      {children}
    </div>
  );
};
