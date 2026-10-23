ALTER TABLE "media_slots" ALTER COLUMN "asset_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media_slots" DROP COLUMN "url";--> statement-breakpoint
ALTER TABLE "media_slots" DROP COLUMN "storage_key";--> statement-breakpoint
ALTER TABLE "media_slots" DROP COLUMN "width";--> statement-breakpoint
ALTER TABLE "media_slots" DROP COLUMN "height";