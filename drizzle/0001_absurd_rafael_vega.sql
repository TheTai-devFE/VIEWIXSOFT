CREATE TABLE "page_overrides" (
	"key" text PRIMARY KEY NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"hero_eyebrow" text,
	"hero_title" text,
	"hero_highlight" text,
	"hero_description" text,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
