'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/form';
import type { CategoriaAdmin } from '@/lib/api/types';
import { deleteCategoryAction, saveCategoryAction } from '../actions';

/** HU-28: create / edit in one dialog; delete asks for confirmation (API blocks categories in use). */
export function CategoryDialog({ categoria }: { categoria?: CategoriaAdmin }) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      setErrors({});
      const res = await saveCategoryAction({
        id: categoria?.id,
        nombre,
        descripcion: descripcion || undefined,
      });
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        if (!categoria) {
          setNombre('');
          setDescripcion('');
        }
      } else setErrors({ ...(res.fieldErrors ?? {}), ...(res.fieldErrors ? {} : { nombre: res.error }) });
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {categoria ? (
          <Button size="sm" variant="ghost" aria-label={`Editar ${categoria.nombre}`}>
            <Pencil aria-hidden />
          </Button>
        ) : (
          <Button size="md">
            <Plus aria-hidden /> Nueva categoría
          </Button>
        )}
      </DialogTrigger>
      <DialogContent title={categoria ? 'Editar categoría' : 'Nueva categoría'} className="max-w-md">
        <div className="space-y-4">
          <Field label="Nombre" htmlFor="cat-nombre" required error={errors.nombre}>
            <Input
              id="cat-nombre"
              value={nombre}
              maxLength={100}
              onChange={(e) => setNombre(e.target.value)}
              aria-invalid={!!errors.nombre}
              aria-describedby="cat-nombre-msg"
            />
          </Field>
          <Field label="Descripción" htmlFor="cat-desc" error={errors.descripcion}>
            <Input
              id="cat-desc"
              value={descripcion}
              maxLength={255}
              onChange={(e) => setDescripcion(e.target.value)}
              aria-describedby="cat-desc-msg"
            />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button loading={pending} onClick={submit}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteCategoryButton({ categoria }: { categoria: CategoriaAdmin }) {
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="soft-danger" aria-label={`Eliminar ${categoria.nombre}`}>
          <Trash2 aria-hidden />
        </Button>
      }
      title={`¿Eliminar "${categoria.nombre}"?`}
      description={
        categoria.totalEmprendimientos > 0
          ? `Tiene ${categoria.totalEmprendimientos} emprendimiento(s): no se podrá eliminar hasta que no tenga ninguno.`
          : 'Esta acción no se puede deshacer.'
      }
      confirmLabel="Eliminar"
      tone="danger"
      onConfirm={async () => {
        const res = await deleteCategoryAction({ id: categoria.id });
        if (res.ok) toast.success(res.message);
        else toast.error(res.error);
      }}
    />
  );
}
