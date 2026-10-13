ALTER TABLE "releases" ADD COLUMN "mix_deadline_date" date;--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "live_deadline_date" date;--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "mix_submitted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "live_submitted" boolean DEFAULT false NOT NULL;