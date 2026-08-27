import { Link } from '@tanstack/react-router';
import iconArrowLeftWhite from '../../../assets/icons/icon-arrow-left-white.svg';

interface SettingsPageProps extends React.PropsWithChildren {
  title: string;
  backTo?: string;
}

export const SettingsPage = ({ backTo, children, title }: SettingsPageProps) => {
  return (
    <div className="relative h-full flex gap-2 flex-col px-4 pt-16 bg-linear-to-b from-primary-100-green-04 to-[#487745]">
      {/* The back link sits in the top-left corner of the page, outside the flex flow, so it
          neither shifts the title down nor pushes it off centre. */}
      {backTo && (
        <Link to={backTo} className="absolute top-4 start-4 flex items-center">
          <img src={iconArrowLeftWhite} alt="" className="h-5" />
        </Link>
      )}
      <h1 className="mb-9 text-center text-2xl font-medium text-primary-100-green-01">{title}</h1>
      {children}
    </div>
  );
};
