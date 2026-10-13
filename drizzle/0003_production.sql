ALTER TABLE "releases" ADD COLUMN "demo_deadline_date" date;--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "recording_date" date;--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "master_deadline_date" date;--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "demo_submitted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "master_submitted" boolean DEFAULT false NOT NULL;