'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProductImage } from './product-image';

/** HU-14 CA3 / HU-17 CA2: browse all product images. Keyboard: ←/→ on the main image. */
export function ProductGallery({ images, alt }: { images: { id: number; url: string }[]; alt: string }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0)
    return <ProductImage src={null} alt={alt} className="aspect-square w-full rounded-xl" />;

  const go = (d: number) => setIndex((i) => (i + d + images.length) % images.length);
  const current = images[index];

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-xl border border-border bg-surface"
        tabIndex={0}
        aria-roledescription="carrusel"
        aria-label={`Imagen ${index + 1} de ${images.length}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(-1);
          if (e.key === 'ArrowRight') go(1);
        }}
      >
        <ProductImage
          src={current.url}
          alt={`${alt} — imagen ${index + 1}`}
          className="aspect-square w-full"
        />
        {images.length > 1 && (
          <>
            <GalleryArrow side="left" onClick={() => go(-1)} />
            <GalleryArrow side="right" onClick={() => go(1)} />
          </>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver imagen ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  'block w-full overflow-hidden rounded-md border-2',
                  i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <ProductImage src={img.url} alt="" className="aspect-square w-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GalleryArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Imagen anterior' : 'Imagen siguiente'}
      className={cn(
        'absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-md transition hover:bg-surface',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
