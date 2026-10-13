import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import iconExternalLinkMiddleGreen from '../../assets/icons/icon-external-link-middle-green.svg';
import { Button } from '@defikarte/shared';
import { ContentWrapper } from '../../components/ui/content-wrapper/ContentWrapper';
import { Text } from '../../components/ui/text/Text';

export const NotFound = () => {
  const { t } = useTranslation();

  return (
    <ContentWrapper
      variant="green"
      className="flex-col gap-10 items-center justify-center h-[calc(100vh-(52px))] lg:h-[calc(100vh-(--spacing(16)))]"
    >
      <Text variant="tint" size="large">
        {t('notFound')}
      </Text>
      <Link to={'/'}>
        <Button icon={iconExternalLinkMiddleGreen} variant="white" size="large">
          {t('goHome')}
        </Button>
      </Link>
    </ContentWrapper>
  );
};
