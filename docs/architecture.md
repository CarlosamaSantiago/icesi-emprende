# Arquitectura — Emprende ICESI (v2)

Documento vivo. Toda decisión que cambie la forma de escribir código se registra aquí como ADR.

## 1. Vista general

```
 Navegador ──HTTPS──▶  apps/web  (Next.js 15, Vercel)
                         │  · Server Components / Server Actions
                         │  · Cookie de sesión httpOnly (el JWT nunca llega al navegador)
                         ▼
                       apps/api  (NestJS, Railway)  ──▶  PostgreSQL (Railway)
                         · REST /api/*, Swagger en /docs
                         · JWT + guards de rol, validación de DTOs
```

El navegador **solo** habla con `apps/web`. Las llamadas a la API se hacen servidor-a-servidor
(BFF, _Backend For Frontend_). Excepción: las imágenes públicas (`GET /api/archivos/:id`).

## 2. Estructura del repositorio

```
apps/
  api/                    NestJS
    src/
      common/             decoradores, guards, filtros (transversal)
      config/             validación de variables de entorno
      database/           esquema Drizzle + módulo de conexión
      modules/<dominio>/  controller · service · dto · module
    db/                   migraciones SQL + seed
  web/                    Next.js
    src/
      app/                SOLO rutas y composición (páginas delgadas)
      components/ui/      primitivas del design system (sin lógica de negocio)
      components/layout/  AppShell, Sidebar, Topbar
      features/<dominio>/ componentes, schemas (zod), actions, queries del dominio
      lib/                api client (server-only), sesión, env, utilidades
docs/                     este documento
```

**Regla de dependencias (web):** `app → features → components/ui → lib`.
Una _feature_ puede reutilizar **componentes** de otra (p. ej. `ProductImage`), nunca sus `actions`/`queries` internas.
`components/ui` no conoce el dominio (no sabe qué es un "pedido"). `lib/api/*`, `lib/auth/session.ts` y `*/queries.ts` son `server-only`.

## 3. Design system

Tokens heredados de la v1 (`SID/frontend/src/index.css`), formalizados en `apps/web/src/app/globals.css` (`@theme`).

| Token     | Valor                                           | Uso                                   |
| --------- | ----------------------------------------------- | ------------------------------------- |
| `primary` | `#6366F1` (hover `#4F46E5`, bg `#EEF2FF`)       | acciones principales, enlaces activos |
| `success` | `#22C55E` / bg `#DCFCE7`                        | estados positivos                     |
| `danger`  | `#EF4444` / bg `#FEE2E2`                        | destructivo, errores                  |
| `warning` | `#F59E0B` / bg `#FEF3C7`                        | pendiente                             |
| `sidebar` | `#111827`                                       | navegación lateral                    |
| `radius`  | sm 8 · md 12 · lg 16 · xl 20 · botones _pill_   |                                       |
| fuente    | Plus Jakarta Sans (self-hosted vía `next/font`) |                                       |

Reglas:

1. **Prohibido** usar colores hex o clases de color de Tailwind fuera de los tokens (`bg-primary`, no `bg-blue-600`).
2. **Prohibido** `style={{…}}` inline para estilos estáticos.
3. Toda UI se construye con primitivas de `components/ui`. Variantes con `cva`; composición de clases con `cn()`.
4. Los estados de dominio (PENDIENTE, ACTIVO…) se pintan **solo** con `<StatusBadge>` — un único mapa estado→color.

## 4. Seguridad

| Amenaza                 | Control                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Robo de token por XSS   | JWT en cookie `httpOnly; Secure; SameSite=Lax`. Nunca en `localStorage`.                                                                          |
| XSS                     | React escapa por defecto; `dangerouslySetInnerHTML` prohibido; CSP estricta.                                                                      |
| CSRF                    | Server Actions verifican `Origin`; cookie `SameSite=Lax`; la API no usa cookies y **no habilita CORS** (solo la llama el servidor Next).          |
| Fuerza bruta            | `/auth/login` limitado a 10 intentos/min **por correo** (por IP no sirve: con BFF todo llega desde la IP del servidor web).                       |
| Asignación masiva       | DTOs con `whitelist + forbidNonWhitelisted`; los servicios escriben columnas explícitas (nunca `...dto`). Precios siempre desde la BD.            |
| Concurrencia en pedidos | `SELECT … FOR UPDATE` en checkout; cambio de estado con `WHERE estado = <actual>` (no hay doble descuento/restitución de stock).                  |
| Clickjacking            | `frame-ancestors 'none'` + `X-Frame-Options: DENY`.                                                                                               |
| Escalada de privilegios | La UI oculta por rol **solo por UX**. La autorización real está en la API (guards + verificación de propietario en el servicio).                  |
| Datos inválidos         | Validación en 3 capas: zod en cliente (UX) → zod en Server Action (frontera de confianza del BFF) → DTO `class-validator` con `whitelist` en API. |
| Archivos maliciosos     | Firma binaria (magic bytes) JPG/PNG/WebP, máx. 2 MB, `nosniff`, nombre generado por servidor.                                                     |
| Enumeración de usuarios | Login responde el mismo mensaje para correo inexistente y clave errónea.                                                                          |
| Secretos                | Solo en variables de entorno del servidor; nada sensible con prefijo `NEXT_PUBLIC_`; `.env` en `.gitignore`. Env validado al arrancar.            |

## 5. ADRs

- **ADR-01 — Monorepo sin workspaces.** `apps/web` y `apps/api` con lockfile propio: despliegues independientes (Vercel / Railway) sin acoplar builds.
- **ADR-02 — NestJS para la API.** Módulos, DI, guards y DTOs equivalentes a Spring Boot; facilita la transición del equipo.
- **ADR-03 — Drizzle ORM en vez de Prisma.** TypeScript puro, sin binarios nativos (evita fallos de instalación en Windows/CI), migraciones SQL versionadas. Nombres de tablas idénticos a la v1.
- **ADR-04 — BFF con cookie httpOnly.** Ver §4. Next verifica la firma del JWT (`jose`) para pintar la UI; la API vuelve a verificarlo en cada petición.
- **ADR-05 — Sin Redux.** Datos del servidor en Server Components + `revalidatePath`. Estado de cliente solo para el carrito (Zustand + `localStorage`, sin datos sensibles).
- **ADR-06 — Primitivas estilo shadcn sobre Radix.** Accesibilidad (foco, teclado, ARIA) resuelta; código propio y tematizado con nuestros tokens.
- **ADR-07 — Almacenamiento de imágenes detrás de `StorageService`.** Implementación actual en PostgreSQL (`archivo`), sustituible por S3/Vercel Blob sin cambiar contratos.
- **ADR-08 — Reglas de negocio en el servidor.** Transiciones de pedido, stock, propiedad de recursos y visibilidad se validan en la API; el front solo las refleja.

## 6. Reglas de negocio (sprint HU-01…HU-23)

- Emprendimiento nuevo → estado `PENDIENTE`. Solo ADMIN cambia a `ACTIVO`/`INACTIVO` (HU-09) y marca destacado (HU-10).
- Marketplace = productos `ACTIVO` de emprendimientos `ACTIVO` (HU-15, HU-09 CA3, HU-13 CA3). Los agotados se muestran como "Agotado" y no se pueden agregar.
- Carrito: cantidad 1…stock; agregar de nuevo suma sin superar stock (HU-18 CA3).
- Checkout: un pedido por emprendimiento, estado `PENDIENTE`, transacción atómica; si algún ítem no tiene stock suficiente se rechaza todo (HU-20).
- Transiciones de pedido: `PENDIENTE→CONFIRMADO→PREPARANDO→ENTREGADO`; `CANCELADO` desde cualquiera excepto `ENTREGADO`. Solo el dueño del emprendimiento (HU-23). Implementado como máquina de estados pura (`pedido-state.ts`) con pruebas unitarias.
- Inventario: se valida en checkout y se **descuenta al confirmar**; se restituye al cancelar solo si ya se había descontado (adelanta HU-24/HU-25).
- Comprar en el propio emprendimiento está bloqueado.

## 6b. Reglas de negocio (sprint 2, HU-24…HU-46)

Reglas compartidas en `apps/api/src/modules/shared/reglas.ts` (+ gemelo SQL en `shared/sql.ts`).

- **Pedido válido** (HU-30/35/36): estado ∈ {`CONFIRMADO`, `PREPARANDO`, `ENTREGADO`} y pago no `FALLIDO`/`REEMBOLSADO`. Solo los válidos suman a ingresos, ranking y GMV. Mismo criterio en métricas, PDF, CSV, ranking e indicadores.
- **Pagos** (HU-44): el emprendedor registra el resultado (`CONFIRMADO`/`FALLIDO`); comisión CIEI 10 % + costo pasarela 2 % se calculan en el API, nunca en el cliente. Cancelar un pedido con pago confirmado lo pasa a `REEMBOLSADO`. No hay pasarela real: *supuesto a validar con el PO*.
- **Calificaciones** (HU-37…40): emprendimiento se califica una vez por pedido `ENTREGADO` (índice único); producto, una vez por usuario con compra verificada; solo el autor edita/retira. Promedio derivado, `null` (no 0) si no hay opiniones.
- **Notificaciones** (HU-41/42): persistidas con `leida`; todas las consultas filtran por usuario. El front las obtiene por *polling* de un route handler BFF (la capa web es serverless, sin WebSocket) y muestra un toast al llegar una nueva.
- **Aprobación CIEI** (HU-43): `PENDIENTE → ACTIVO` (aprobar) o `INACTIVO` (rechazar, motivo obligatorio). Cada decisión queda en `aprobacion_emprendimiento` (quién, cuándo, motivo). Activar/desactivar no sustituye la revisión.
- **Usuarios y roles** (HU-26/27): el guard relee los roles de la BD en cada request (cambio inmediato). No se puede quitar el último rol, quitarse el propio ADMIN, ni dejar la plataforma sin admin. **Política de borrado**: no se eliminan cuentas con emprendimientos o pedidos (historial comercial); el resto se elimina con sus datos personales. *Supuesto a validar con el CIEI.*
- **Categorías** (HU-28): nombre único sin distinguir mayúsculas; no se elimina una con emprendimientos.
- **Consentimiento** (HU-45): el registro exige aceptar la política; se guarda `consentimiento(usuario, versión, fecha)`. El texto de `GET /legal/tratamiento-datos` es **provisional** hasta que jurídica entregue el definitivo.
- **Emprendimiento del Mes** (HU-46): la última designación del mes gana; solo emprendimientos `ACTIVO`; notifica al propietario; insignia en marketplace y detalle.
- **Ranking** (HU-35): por ventas válidas, desempate por unidades, pedidos y nombre; empates comparten posición. **Indicadores** (HU-36): GMV, comisión y pasarela por mes, con meses sin actividad en cero.
- Filtros de fecha de métricas/pagos comparan por fecha calendario (sin ajuste de zona horaria).

## 7. Convenciones

- TypeScript `strict`. Sin `any` explícito.
- Commits: Conventional Commits (`feat(web): …`, `fix(api): …`).
- Nombres de dominio en español (como la v1); código de infraestructura en inglés.
- Componentes: `PascalCase.tsx`, un componente exportado por archivo. Hooks `useX`. Schemas `xSchema`.
