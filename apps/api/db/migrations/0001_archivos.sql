CREATE TABLE "archivo" (
	"id_archivo" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mime" varchar(50) NOT NULL,
	"tamano" integer NOT NULL,
	"datos" "bytea" NOT NULL,
	"id_usuario" integer,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "archivo" ADD CONSTRAINT "archivo_id_usuario_usuario_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario") ON DELETE set null ON UPDATE no action;