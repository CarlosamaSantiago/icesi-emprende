import { Package } from 'lucide-react';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

/** Product/business image with the v1 gradient placeholder when there is no picture. */
export function ProductImage({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const url = mediaUrl(src);
  if (!url) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-linear-135 from-primary-soft to-accent-soft',
          className,
        )}
        aria-hidden
      >
        <Package className="size-9 text-primary opacity-40" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- sources are same-origin /media or allow-listed hosts (CSP)
  return <img src={url} alt={alt} loading="lazy" className={cn('object-cover', className)} />;
}
