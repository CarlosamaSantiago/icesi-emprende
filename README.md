# Emprende ICESI v2

Marketplace de emprendimientos universitarios — Universidad Icesi (CIEI).

|            | Stack                                                                                       | Deploy  |
| ---------- | ------------------------------------------------------------------------------------------- | ------- |
| `apps/web` | Next.js 15 (App Router) · TypeScript · Tailwind 4 · Radix · zod · react-hook-form · Zustand | Vercel  |
| `apps/api` | NestJS 12 · Drizzle ORM · PostgreSQL · JWT · class-validator · Swagger                      | Railway |

Arquitectura, design system, seguridad y ADRs: **[docs/architecture.md](docs/architecture.md)**.

## Desarrollo local

Requisitos: Node 22+, PostgreSQL 15+.

```bash
npm run install:all
cp apps/api/.env.example apps/api/.env        # ajusta DATABASE_URL y JWT_SECRET
cp apps/web/.env.example apps/web/.env.local  # mismo JWT_SECRET
npm run db:migrate                            # crea tablas + datos demo
npm run dev:api                               # http://localhost:3001  (Swagger: /docs)
npm run dev:web                               # http://localhost:3000
```

Usuarios demo (contraseña `1234`): `ximena@icesi.edu.co` (ADMIN + EMPRENDEDOR), `carlos@icesi.edu.co` (EMPRENDEDOR), `juan@icesi.edu.co` (COMPRADOR).

| Script                                  |                                                            |
| --------------------------------------- | ---------------------------------------------------------- |
| `npm test`                              | Pruebas unitarias (máquina de estados de pedidos, carrito) |
| `npm run typecheck` / `npm run lint`    | Verificación estática                                      |
| `npm --prefix apps/api run db:generate` | Genera una migración tras cambiar `src/database/schema.ts` |

## Sprint 2 (HU-24…HU-46)

La migración `0002_sprint2` agrega pagos, aprobaciones, consentimientos y Emprendimiento del Mes; `db/seed-sprint2.sql` agrega datos demo (se aplica tras `seed.sql`). Reglas y supuestos en `docs/architecture.md` §6b. Nuevas dependencias: `pdfkit` (API) y `@radix-ui/react-popover` (web).

## Despliegue

### 1. API + base de datos (Railway)

1. **New Project → Deploy from GitHub repo** → este repositorio.
2. En el mismo proyecto: **+ New → Database → PostgreSQL**.
3. Servicio de la API → **Settings**:
   - _Root Directory_: `/apps/api`
   - _(Opcional)_ _Config-as-code → Railway config file_: `/apps/api/railway.json` (healthcheck y reinicios)
   - `npm start` aplica las migraciones pendientes (y el seed si la BD está vacía) antes de arrancar
4. **Variables** de la API:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET` = cadena aleatoria de 32+ caracteres
   - `NODE_ENV` = `production`
5. **Settings → Networking → Generate Domain**. Verifica `https://<dominio>/health`.

### 2. Web (Vercel)

1. **Add New → Project** → importa el repo. _Root Directory_: `apps/web` (Next.js se detecta solo).
2. **Environment Variables**: `API_URL` = `https://<dominio-railway>` y `JWT_SECRET` = **el mismo** de la API.
3. **Deploy**.
