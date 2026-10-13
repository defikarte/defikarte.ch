import { Link, type LinkProps } from '@tanstack/react-router';

interface IconLinkProps extends LinkProps {
  iconSrc: string;
  children: React.ReactNode;
  activeProps?: {
    iconSrc?: string;
    className?: string;
  };
}

export const IconLink = ({ iconSrc, activeProps, children, ...props }: IconLinkProps) => {
  const activeLinkProps = { className: activeProps?.className };
  return (
    <Link className="flex items-center flex-col flex-1" activeProps={activeLinkProps} {...props}>
      {({ isActive }) => (
        <>
          <img src={isActive ? activeProps?.iconSrc : iconSrc} />
          <span className="text-xs leading-normal font-medium">{children}</span>
        </>
      )}
    </Link>
  );
};
