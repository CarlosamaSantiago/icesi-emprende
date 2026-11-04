'use client';

import { ImageUploader } from '@/components/ui/image-uploader';
import { uploadProfilePhotoAction } from '../actions';

export function ProfilePhoto({ currentUrl }: { currentUrl: string | null }) {
  return (
    <ImageUploader
      currentUrl={currentUrl}
      onUpload={uploadProfilePhotoAction}
      label="Cambiar foto"
      shape="circle"
    />
  );
}
