'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { Avatar } from '@/components/ui/feedback';
import { useCart } from '@/features/cart/store';
import { logoutAction } from '../actions';

export function UserMenu({ nombre, email, foto }: { nombre: string; email: string; foto: string | null }) {
  const clearCart = useCart((s) => s.clear);
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition hover:bg-surface-muted">
        <Avatar src={foto} name={nombre} />
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] leading-tight font-semibold">{nombre}</span>
          <span className="block text-[11px] leading-tight text-muted">{email}</span>
        </span>
        <ChevronDown className="size-4 text-muted" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-48 rounded-lg border border-border bg-surface p-1.5 shadow-lg"
        >
          <DropdownMenu.Item asChild>
            <Link
              href="/perfil"
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-[13px] outline-none data-highlighted:bg-surface-muted"
            >
              <User className="size-4" aria-hidden /> Mi perfil
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            disabled={pending}
            onSelect={() =>
              startTransition(async () => {
                clearCart(); // the cart belongs to this browser session; never leak it to the next user
                await logoutAction();
              })
            }
            className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-[13px] text-danger outline-none data-highlighted:bg-danger-soft"
          >
            <LogOut className="size-4" aria-hidden /> Cerrar sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
