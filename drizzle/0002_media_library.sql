CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"bytes" integer,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt" text NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "media_slots" ADD COLUMN "asset_id" uuid;--> statement-breakpoint
ALTER TABLE "media_slots" ADD CONSTRAINT "media_slots_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
-- Move every image uploaded straight to a slot into the library, then point the slot at it.
INSERT INTO "media_assets" ("url", "storage_key", "file_name", "content_type", "width", "height", "alt", "uploaded_by", "created_at")
SELECT "url", "storage_key", regexp_replace("storage_key", '^.*/', ''),
	CASE lower(substring("storage_key" from '\.([a-z]+)$'))
		WHEN 'webp' THEN 'image/webp' WHEN 'avif' THEN 'image/avif' WHEN 'png' THEN 'image/png' ELSE 'image/jpeg'
	END,
	"width", "height", "alt", "updated_by", "updated_at"
FROM "media_slots"
ON CONFLICT ("storage_key") DO NOTHING;--> statement-breakpoint
UPDATE "media_slots" SET "asset_id" = "media_assets"."id" FROM "media_assets" WHERE "media_assets"."storage_key" = "media_slots"."storage_key";
