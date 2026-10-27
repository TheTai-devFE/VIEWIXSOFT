ALTER TABLE "use_cases" ALTER COLUMN "challenge" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "use_cases" ALTER COLUMN "solution" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "mode" text DEFAULT 'guide' NOT NULL;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "highlights" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "sections" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "setup" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "stories" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "faq" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "reviewed_by" jsonb;