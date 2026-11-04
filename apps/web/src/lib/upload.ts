/** Client-safe upload rules (UX). The API re-validates with magic bytes — this is not the security control. */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function validateImageFile(file: File | null | undefined): string | null {
  if (!file || file.size === 0) return 'Selecciona una imagen';
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type))
    return 'Formato no permitido. Usa JPG, PNG o WebP.';
  if (file.size > MAX_IMAGE_BYTES) return 'La imagen supera 2 MB.';
  return null;
}
