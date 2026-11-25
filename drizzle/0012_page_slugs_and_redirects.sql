CREATE TABLE "page_slugs" (
	"page_key" text PRIMARY KEY NOT NULL,
	"default_path" text NOT NULL,
	"custom_path" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_slugs_default_path_unique" UNIQUE("default_path"),
	CONSTRAINT "page_slugs_custom_path_unique" UNIQUE("custom_path")
);
--> statement-breakpoint
CREATE TABLE "url_redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "url_redirects_from_path_unique" UNIQUE("from_path")
);
--> statement-breakpoint
CREATE INDEX "url_redirects_to_path_idx" ON "url_redirects" USING btree ("to_path");