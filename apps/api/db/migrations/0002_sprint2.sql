CREATE TABLE "aprobacion_emprendimiento" (
	"id_aprobacion" serial PRIMARY KEY NOT NULL,
	"id_emprendimiento" integer NOT NULL,
	"decision" varchar(20) NOT NULL,
	"motivo" text,
	"id_admin" integer,
	"fecha" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consentimiento" (
	"id_consentimiento" serial PRIMARY KEY NOT NULL,
	"id_usuario" integer NOT NULL,
	"version" varchar(50) NOT NULL,
	"aceptado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emprendimiento_del_mes" (
	"id_designacion" serial PRIMARY KEY NOT NULL,
	"id_emprendimiento" integer NOT NULL,
	"periodo" varchar(7) NOT NULL,
	"id_designado_por" integer,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pago" (
	"id_pago" serial PRIMARY KEY NOT NULL,
	"id_pedido" integer NOT NULL,
	"estado" varchar(20) NOT NULL,
	"monto" numeric(12, 2) NOT NULL,
	"comision_ciei" numeric(12, 2) DEFAULT 0 NOT NULL,
	"costo_pasarela" numeric(12, 2) DEFAULT 0 NOT NULL,
	"referencia" varchar(100),
	"id_registrado_por" integer,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_notificacion_usuario";--> statement-breakpoint
ALTER TABLE "notificacion" ADD COLUMN "leida" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "aprobacion_emprendimiento" ADD CONSTRAINT "aprobacion_emprendimiento_id_emprendimiento_emprendimiento_id_emprendimiento_fk" FOREIGN KEY ("id_emprendimiento") REFERENCES "public"."emprendimiento"("id_emprendimiento") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aprobacion_emprendimiento" ADD CONSTRAINT "aprobacion_emprendimiento_id_admin_usuario_id_usuario_fk" FOREIGN KEY ("id_admin") REFERENCES "public"."usuario"("id_usuario") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consentimiento" ADD CONSTRAINT "consentimiento_id_usuario_usuario_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emprendimiento_del_mes" ADD CONSTRAINT "emprendimiento_del_mes_id_emprendimiento_emprendimiento_id_emprendimiento_fk" FOREIGN KEY ("id_emprendimiento") REFERENCES "public"."emprendimiento"("id_emprendimiento") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emprendimiento_del_mes" ADD CONSTRAINT "emprendimiento_del_mes_id_designado_por_usuario_id_usuario_fk" FOREIGN KEY ("id_designado_por") REFERENCES "public"."usuario"("id_usuario") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pago" ADD CONSTRAINT "pago_id_pedido_pedido_id_pedido_fk" FOREIGN KEY ("id_pedido") REFERENCES "public"."pedido"("id_pedido") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pago" ADD CONSTRAINT "pago_id_registrado_por_usuario_id_usuario_fk" FOREIGN KEY ("id_registrado_por") REFERENCES "public"."usuario"("id_usuario") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_aprobacion_emprendimiento" ON "aprobacion_emprendimiento" USING btree ("id_emprendimiento");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_consentimiento_usuario_version" ON "consentimiento" USING btree ("id_usuario","version");--> statement-breakpoint
CREATE INDEX "idx_edm_periodo" ON "emprendimiento_del_mes" USING btree ("periodo");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pago_pedido" ON "pago" USING btree ("id_pedido");--> statement-breakpoint
DELETE FROM "calificacion" a USING "calificacion" b WHERE a."id_pedido" = b."id_pedido" AND a."id_calificacion" > b."id_calificacion";--> statement-breakpoint
DELETE FROM "calificacion_producto" a USING "calificacion_producto" b WHERE a."id_usuario" = b."id_usuario" AND a."id_producto" = b."id_producto" AND a."id_calificacion_producto" > b."id_calificacion_producto";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_calificacion_pedido" ON "calificacion" USING btree ("id_pedido");--> statement-breakpoint
CREATE INDEX "idx_calificacion_emprendimiento" ON "calificacion" USING btree ("id_emprendimiento");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_calificacion_producto_usuario" ON "calificacion_producto" USING btree ("id_usuario","id_producto");--> statement-breakpoint
CREATE INDEX "idx_calificacion_producto_producto" ON "calificacion_producto" USING btree ("id_producto");--> statement-breakpoint
CREATE INDEX "idx_notificacion_usuario" ON "notificacion" USING btree ("id_usuario","leida");