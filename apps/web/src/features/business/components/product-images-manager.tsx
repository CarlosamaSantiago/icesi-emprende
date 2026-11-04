'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ImageUploader } from '@/components/ui/image-uploader';
import { ProductImage } from '@/features/marketplace/components/product-image';
import { addProductImageAction, deleteProductImageAction } from '../actions';

const MAX_IMAGES = 8;

/** HU-14 CA1/CA2: add photos, see existing ones, delete. */
export function ProductImagesManager({
  productoId,
  imagenes,
}: {
  productoId: number;
  imagenes: { id: number; url: string }[];
}) {
  return (
    <div className="space-y-5">
      {imagenes.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {imagenes.map((img, i) => (
            <li key={img.id} className="group relative overflow-hidden rounded-lg border border-border">
              <ProductImage src={img.url} alt={`Imagen ${i + 1}`} className="aspect-square w-full" />
              {i === 0 && (
                <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  Principal
                </span>
              )}
              <div className="absolute top-2 right-2">
                <ConfirmDialog
                  trigger={
                    <Button
                      size="icon"
                      variant="danger"
                      className="size-8"
                      aria-label={`Eliminar imagen ${i + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  }
                  title="¿Eliminar esta imagen?"
                  description="Dejará de mostrarse en la galería del producto."
                  confirmLabel="Eliminar"
                  tone="danger"
                  onConfirm={async () => {
                    const res = await deleteProductImageAction(productoId, img.id);
                    if (res.ok) toast.success(res.message);
                    else toast.error(res.error);
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted">Este producto aún no tiene imágenes.</p>
      )}
      {imagenes.length < MAX_IMAGES ? (
        <ImageUploader
          onUpload={(fd) => addProductImageAction(productoId, fd)}
          label="Agregar imagen"
          resetOnSuccess
        />
      ) : (
        <p className="text-xs text-muted">Máximo {MAX_IMAGES} imágenes por producto.</p>
      )}
    </div>
  );
}
