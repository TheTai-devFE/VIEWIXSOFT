CREATE TABLE "section_content" (
	"page" text NOT NULL,
	"section_key" text NOT NULL,
	"content" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "section_content_page_section_key_pk" PRIMARY KEY("page","section_key")
);
