CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"profile_url" text,
	"kind" text DEFAULT 'person' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "author_id" uuid;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "faq" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;