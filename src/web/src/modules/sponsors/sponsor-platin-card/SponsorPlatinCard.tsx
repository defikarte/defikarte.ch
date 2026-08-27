import iconExternalLinkMiddleGreen from '../../../assets/icons/icon-external-link-middle-green.svg';
import { IconButton } from '@defikarte/shared';
import { Text } from '../../../components/ui/text/Text';

interface SponsorPlatinCardProps {
  title: string;
  description: string;
  src: string;
  href: string;
}

export const SponsorPlatinCard = ({ title, description, src, href }: SponsorPlatinCardProps) => {
  return (
    <a href={href} className="cursor-pointer lg:w-1/2" target="_blank">
      <div className="bg-beige rounded-2xl flex flex-col h-112">
        <div className="bg-primary-100-white rounded-t-2xl flex justify-center items-center grow-1">
          <img src={src} className="w-[230px]" />
        </div>
        <div className="p-5 md:p-8">
          <Text size="medium" weight="bold" className="pb-3">
            {title}
          </Text>
          <div className="flex items-start md:items-end flex-col md:flex-row gap-4 md:gap-8 lg:gap-9">
            <Text>{description}</Text>
            <IconButton
              size="large"
              variant="white-transparent"
              icon={iconExternalLinkMiddleGreen}
              className="self-end md:self-auto"
            />
          </div>
        </div>
      </div>
    </a>
  );
};
