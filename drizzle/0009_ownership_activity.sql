CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"entity_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "authors" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "use_cases" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_log_actor_id_idx" ON "activity_log" USING btree ("actor_id");--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_posts_created_by_idx" ON "blog_posts" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "use_cases_created_by_idx" ON "use_cases" USING btree ("created_by");--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
-- Posts written before ownership was tracked belong to the earliest admin, so someone can still edit them.
UPDATE "blog_posts" SET "created_by" = (SELECT "id" FROM "user" WHERE "role" = 'admin' ORDER BY "created_at" LIMIT 1) WHERE "created_by" IS NULL;--> statement-breakpoint
UPDATE "use_cases" SET "created_by" = (SELECT "id" FROM "user" WHERE "role" = 'admin' ORDER BY "created_at" LIMIT 1) WHERE "created_by" IS NULL;
