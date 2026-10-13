import { Link } from '@tanstack/react-router';
import iconArrowLeftWhite from '../../../assets/icons/icon-arrow-left-white.svg';

interface SettingsPageProps extends React.PropsWithChildren {
  title: string;
  backTo?: string;
}

export const SettingsPage = ({ backTo, children, title }: SettingsPageProps) => {
  return (
    // The gradient stays full-bleed under the status bar; only the content is pushed down by the
    // top inset.
    <div className="relative min-h-full flex gap-2 flex-col pl-[calc(1rem+var(--sa-left))] pr-[calc(1rem+var(--sa-right))] pt-[calc(4rem+var(--sa-top))] bg-linear-to-b from-primary-100-green-04 to-[#487745]">
      {/* The back link sits in the top-left corner of the page, outside the flex flow, so it
          neither shifts the title down nor pushes it off centre. Being absolutely positioned, it
          resolves against the padding box and so is not moved by the padding above - it has to
          carry the top and left insets itself, or it lands under the notch in landscape. */}
      {backTo && (
        <Link
          to={backTo}
          className="absolute top-[calc(1rem+var(--sa-top))] left-[calc(1rem+var(--sa-left))] flex items-center"
        >
          <img src={iconArrowLeftWhite} alt="" className="h-5" />
        </Link>
      )}
      <h1 className="mb-9 text-center text-2xl font-medium text-primary-100-green-01">{title}</h1>
      {children}
    </div>
  );
};
