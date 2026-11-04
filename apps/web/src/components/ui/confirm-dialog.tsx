'use client';

import * as React from 'react';
import { Button } from './button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from './dialog';

interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => Promise<unknown> | unknown;
}

/** Ask before destructive / irreversible actions. Closes itself once onConfirm resolves. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirmar',
  tone = 'primary',
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={title} description={description} className="max-w-md">
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                await onConfirm();
                setOpen(false);
              })
            }
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
