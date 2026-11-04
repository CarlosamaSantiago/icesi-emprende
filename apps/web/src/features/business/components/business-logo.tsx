'use client';

import { ImageUploader } from '@/components/ui/image-uploader';
import { uploadLogoAction } from '../actions';

export function BusinessLogo({ businessId, currentUrl }: { businessId: number; currentUrl: string | null }) {
  return (
    <ImageUploader
      currentUrl={currentUrl}
      onUpload={(fd) => uploadLogoAction(businessId, fd)}
      label="Subir logo"
    />
  );
}
