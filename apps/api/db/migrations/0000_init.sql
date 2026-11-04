CREATE TABLE "calificacion" (
	"id_calificacion" serial PRIMARY KEY NOT NULL,
	"puntuacion" integer NOT NULL,
	"comentario" text,
	"fecha" timestamp DEFAULT now() NOT NULL,
	"id_usuario" integer NOT NULL,
	"id_emprendimiento" integer NOT NULL,
	"id_pedido" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calificacion_producto" (
	"id_calificacion_producto" serial PRIMARY KEY NOT NULL,
	"puntuacion" integer NOT NULL,
	"comentario" text,
	"fecha" timestamp DEFAULT now() NOT NULL,
	"id_usuario" integer NOT NULL,
	"id_producto" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categoria" (
	"id_categoria" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" varchar(255),
	CONSTRAINT "categoria_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "detalle_pedido" (
	"id_detalle" serial PRIMARY KEY NOT NULL,
	"cantidad" integer NOT NULL,
	"precio_unitario" numeric(10, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"id_pedido" integer NOT NULL,
	"id_producto" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emprendimiento" (
	"id_emprendimiento" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" text NOT NULL,
	"logo_url" varchar(500),
	"destacado" boolean DEFAULT false NOT NULL,
	"id_usuario" integer NOT NULL,
	"id_categoria" integer NOT NULL,
	"id_semestre" integer NOT NULL,
	"id_estado" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estado" (
	"id_estado" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(50) NOT NULL,
	CONSTRAINT "estado_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "imagen_producto" (
	"id_imagen" serial PRIMARY KEY NOT NULL,
	"url_imagen" varchar(500) NOT NULL,
	"id_producto" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensaje" (
	"id_mensaje" serial PRIMARY KEY NOT NULL,
	"contenido" text NOT NULL,
	"fecha" timestamp DEFAULT now() NOT NULL,
	"id_remitente" integer NOT NULL,
	"id_receptor" integer NOT NULL,
	"id_pedido" integer
);
--> statement-breakpoint
CREATE TABLE "notificacion" (
	"id_notificacion" serial PRIMARY KEY NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"contenido" text NOT NULL,
	"fecha" timestamp DEFAULT now() NOT NULL,
	"id_usuario" integer NOT NULL,
	"referencia_id" integer
);
--> statement-breakpoint
CREATE TABLE "pedido" (
	"id_pedido" serial PRIMARY KEY NOT NULL,
	"fecha_pedido" timestamp DEFAULT now() NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"id_usuario" integer NOT NULL,
	"id_emprendimiento" integer NOT NULL,
	"id_estado" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission" (
	"id_permission" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" varchar(255),
	CONSTRAINT "permission_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "producto" (
	"id_producto" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" text NOT NULL,
	"precio" numeric(10, 2) NOT NULL,
	"stock_disponible" integer NOT NULL,
	"id_emprendimiento" integer NOT NULL,
	"id_estado" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reporte" (
	"id_reporte" serial PRIMARY KEY NOT NULL,
	"fecha_generacion" timestamp DEFAULT now() NOT NULL,
	"periodo" varchar(50) NOT NULL,
	"ruta_archivo" varchar(500),
	"id_usuario" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rol" (
	"id_rol" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	CONSTRAINT "rol_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"id_rol" integer NOT NULL,
	"id_permission" integer NOT NULL,
	CONSTRAINT "role_permission_id_rol_id_permission_pk" PRIMARY KEY("id_rol","id_permission")
);
--> statement-breakpoint
CREATE TABLE "semestre" (
	"id_semestre" serial PRIMARY KEY NOT NULL,
	"periodo" varchar(20) NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"id_estado" integer NOT NULL,
	CONSTRAINT "semestre_periodo_unique" UNIQUE("periodo")
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id_usuario" integer NOT NULL,
	"id_rol" integer NOT NULL,
	CONSTRAINT "user_role_id_usuario_id_rol_pk" PRIMARY KEY("id_usuario","id_rol")
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id_usuario" serial PRIMARY KEY NOT NULL,
	"nombre_completo" varchar(255) NOT NULL,
	"correo_institucional" varchar(255) NOT NULL,
	"programa_academico" varchar(255) NOT NULL,
	"semestre_academico" integer NOT NULL,
	"foto_perfil" varchar(500),
	"clave" varchar(255) NOT NULL,
	CONSTRAINT "usuario_correo_institucional_unique" UNIQUE("correo_institucional")
);
--> statement-breakpoint
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_id_usuario_usuario_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_id_emprendimiento_emprendimiento_id_emprendimiento_fk" FOREIGN KEY ("id_emprendimiento") REFERENCES "public"."emprendimiento"("id_emprendimiento") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_id_pedido_pedido_id_pedido_fk" FOREIGN KEY ("id_pedido") REFERENCES "public"."pedido"("id_pedido") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calificacion_producto" ADD CONSTRAINT "calificacion_producto_id_usuario_usuario_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calificacion_producto" ADD CONSTRAINT "calificacion_producto_id_producto_producto_id_producto_fk" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_pedido_pedido_id_pedido_fk" FOREIGN KEY ("id_pedido") REFERENCES "public"."pedido"("id_pedido") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_producto_producto_id_producto_fk" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emprendimiento" ADD CONSTRAINT "emprendimiento_id_usuario_usuario_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emprendimiento" ADD CONSTRAINT "emprendimiento_id_categoria_categoria_id_categoria_fk" FOREIGN KEY ("id_categoria") REFERENCES "public"."categoria"("id_categoria") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emprendimiento" ADD CONSTRAINT "emprendimiento_id_semestre_semestre_id_semestre_fk" FOREIGN KEY ("id_semestre") REFERENCES "public"."semestre"("id_semestre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emprendimiento" ADD CONSTRAINT "emprendimiento_id_estado_estado_id_estado_fk" FOREIGN KEY ("id_estado") REFERENCES "public"."estado"("id_estado") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagen_producto" ADD CONSTRAINT "imagen_producto_id_producto_producto_id_producto_fk" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_id_remitente_usuario_id_usuario_fk" FOREIGN KEY ("id_remitente") REFERENCES "public"."usuario"("id_usuario") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_id_receptor_usuario_id_usuario_fk" FOREIGN KEY ("id_receptor") REFERENCES "public"."usuario"("id_usuario") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_id_pedido_pedido_id_pedido_fk" FOREIGN KEY ("id_pedido") REFERENCES "public"."pedido"("id_pedido") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_usuario_usuario_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_id_usuario_usuario_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_id_emprendimiento_emprendimiento_id_emprendimiento_fk" FOREIGN KEY ("id_emprendimiento") REFERENCES "public"."emprendimiento"("id_emprendimiento") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_id_estado_estado_id_estado_fk" FOREIGN KEY ("id_estado") REFERENCES "public"."estado"("id_estado") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto" ADD CONSTRAINT "producto_id_emprendimiento_emprendimiento_id_emprendimiento_fk" FOREIGN KEY ("id_emprendimiento") REFERENCES "public"."emprendimiento"("id_emprendimiento") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto" ADD CONSTRAINT "producto_id_estado_estado_id_estado_fk" FOREIGN KEY ("id_estado") REFERENCES "public"."estado"("id_estado") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_id_usuario_usuario_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_id_rol_rol_id_rol_fk" FOREIGN KEY ("id_rol") REFERENCES "public"."rol"("id_rol") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_id_permission_permission_id_permission_fk" FOREIGN KEY ("id_permission") REFERENCES "public"."permission"("id_permission") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semestre" ADD CONSTRAINT "semestre_id_estado_estado_id_estado_fk" FOREIGN KEY ("id_estado") REFERENCES "public"."estado"("id_estado") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_id_usuario_usuario_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_id_rol_rol_id_rol_fk" FOREIGN KEY ("id_rol") REFERENCES "public"."rol"("id_rol") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_emprendimiento_usuario" ON "emprendimiento" USING btree ("id_usuario");--> statement-breakpoint
CREATE INDEX "idx_emprendimiento_categoria" ON "emprendimiento" USING btree ("id_categoria");--> statement-breakpoint
CREATE INDEX "idx_notificacion_usuario" ON "notificacion" USING btree ("id_usuario");--> statement-breakpoint
CREATE INDEX "idx_pedido_usuario" ON "pedido" USING btree ("id_usuario");--> statement-breakpoint
CREATE INDEX "idx_pedido_emprendimiento" ON "pedido" USING btree ("id_emprendimiento");--> statement-breakpoint
CREATE INDEX "idx_producto_emprendimiento" ON "producto" USING btree ("id_emprendimiento");