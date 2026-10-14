ALTER TABLE "releases" ADD COLUMN "utawari_fix_date" date;--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "first_performance_date" date;--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "utawari_fixed" boolean DEFAULT false NOT NULL;