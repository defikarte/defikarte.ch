import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type WikimediaPhoto,
  fetchWikimediaPhoto,
} from '../../../../../services/wikimedia.service';

type AedPhotoProps = {
  wikimediaCommons?: string;
  image?: string;
};

export const AedPhoto = ({ wikimediaCommons, image }: AedPhotoProps) => {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<WikimediaPhoto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wikimediaCommons && !image) return;

    const controller = new AbortController();
    setLoading(true);

    fetchWikimediaPhoto(wikimediaCommons, image, controller.signal).then(result => {
      if (!controller.signal.aborted) {
        setPhoto(result);
        setLoading(false);
      }
    });

    return () => controller.abort();
  }, [wikimediaCommons, image]);

  if (!wikimediaCommons && !image) return null;

  if (loading) {
    return (
      <div className="w-full h-32 flex items-center justify-center">
        <span className="text-xs text-primary-100-green-04 opacity-50">{t('photoLoading')}</span>
      </div>
    );
  }

  if (!photo) return null;

  return (
    <a href={photo.descriptionUrl} target="_blank" rel="noopener noreferrer">
      <img
        src={photo.thumbUrl}
        alt={t('photoAlt')}
        className="w-full h-32 rounded-lg object-cover"
        loading="lazy"
      />
    </a>
  );
};
