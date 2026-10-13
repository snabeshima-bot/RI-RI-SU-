CREATE TABLE "track_credits" (
	"track_id" integer NOT NULL,
	"writer_id" integer NOT NULL,
	"role" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "track_credits_track_id_writer_id_role_pk" PRIMARY KEY("track_id","writer_id","role")
);
--> statement-breakpoint
CREATE TABLE "writers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "writers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "track_credits" ADD CONSTRAINT "track_credits_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_credits" ADD CONSTRAINT "track_credits_writer_id_writers_id_fk" FOREIGN KEY ("writer_id") REFERENCES "public"."writers"("id") ON DELETE restrict ON UPDATE no action;