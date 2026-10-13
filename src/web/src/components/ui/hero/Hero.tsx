import { Button } from '@defikarte/shared';
import { ContentWrapper } from '../content-wrapper/ContentWrapper';
import { Text } from '../text/Text';

interface HeroProps {
  title: string;
  description: string[];
  image?: string;
  buttonText: string;
  buttonIcon: string;
  onButtonClick: () => void;
}

export const Hero = ({
  title,
  description,
  image,
  buttonText,
  buttonIcon,
  onButtonClick,
}: HeroProps) => {
  return (
    <>
      <ContentWrapper variant="green" paddingY="regular" className="flex-col 2xl:w-[1200px]">
        <Text size="x-large" variant="tint" weight="bold" center className="pb-6 break-words">
          {title}
        </Text>
        <div>
          {description.map((d, i) => (
            <Text
              /* eslint-disable-next-line @eslint-react/no-array-index-key */
              key={i}
              size="regular"
              variant="white"
              weight="light"
              center
              className="last:pb-10"
            >
              {d}
            </Text>
          ))}
        </div>
        <Button icon={buttonIcon} size="large" onClick={onButtonClick}>
          {buttonText}
        </Button>
        {image && <img src={image} className="mt-20 rounded-2xl" />}
      </ContentWrapper>
    </>
  );
};
