CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"seo_title" text,
	"description" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"cover_url" text,
	"cover_alt" text,
	"category" text DEFAULT 'General' NOT NULL,
	"product" text DEFAULT 'cms' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"author_name" text DEFAULT 'Viewixsoft Team' NOT NULL,
	"author_role" text DEFAULT 'Editorial Team',
	"key_takeaways" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "use_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"seo_title" text,
	"industry" text NOT NULL,
	"tagline" text NOT NULL,
	"cover_url" text,
	"cover_alt" text,
	"challenge_heading" text DEFAULT 'What was the challenge?' NOT NULL,
	"challenge" text NOT NULL,
	"solution_heading" text DEFAULT 'How did Viewixsoft solve it?' NOT NULL,
	"solution" text NOT NULL,
	"results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quote" jsonb,
	"featured_products" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "use_cases_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "use_cases_slug_idx" ON "use_cases" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "use_cases_status_idx" ON "use_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "use_cases_published_at_idx" ON "use_cases" USING btree ("published_at");