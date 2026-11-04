'use client';

import { ImagePlus, Upload } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { IMAGE_TYPES, validateImageFile } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ImageUploaderProps {
  /** Current image (already resolved with mediaUrl). Kept untouched if the upload fails (HU-04 CA3). */
  currentUrl?: string | null;
  /** Receives FormData with field `archivo`. Must return an ActionResult-like object. */
  onUpload: (fd: FormData) => Promise<{ ok: boolean; error?: string; message?: string }>;
  label?: string;
  shape?: 'circle' | 'square';
  /** Reset the preview after a successful upload (e.g. gallery adds). */
  resetOnSuccess?: boolean;
}

/** Select → local preview → confirm upload. Reused for profile photo, business logo and product gallery. */
export function ImageUploader({
  currentUrl,
  onUpload,
  label = 'Cambiar imagen',
  shape = 'square',
  resetOnSuccess,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const pick = (f: File | undefined) => {
    const err = validateImageFile(f);
    setError(err);
    if (err || !f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f)); // HU-04 CA1: preview before saving
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const upload = () =>
    startTransition(async () => {
      if (!file) return;
      const fd = new FormData();
      fd.set('archivo', file);
      const res = await onUpload(fd);
      if (res.ok) {
        toast.success(res.message ?? 'Imagen guardada');
        if (resetOnSuccess) reset();
        else setFile(null);
      } else {
        setError(res.error ?? 'No se pudo subir la imagen'); // existing image is kept
      }
    });

  const shown = preview ?? currentUrl;
  const frame = cn(
    'flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-border bg-surface-muted',
    shape === 'circle' ? 'size-24 rounded-full' : 'size-28 rounded-lg',
  );

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className={frame}>
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: preview or same-origin media
          <img src={shown} alt="Vista previa" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-7 text-subtle" aria-hidden />
        )}
      </div>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          className="sr-only"
          id={`uploader-${label}`}
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
          >
            <ImagePlus aria-hidden /> {label}
          </Button>
          {file && (
            <>
              <Button type="button" size="sm" onClick={upload} loading={pending}>
                <Upload aria-hidden /> Guardar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={pending}>
                Descartar
              </Button>
            </>
          )}
        </div>
        <p className={cn('text-xs', error ? 'text-danger' : 'text-muted')} role={error ? 'alert' : undefined}>
          {error ?? 'JPG, PNG o WebP · máx. 2 MB'}
        </p>
      </div>
    </div>
  );
}
