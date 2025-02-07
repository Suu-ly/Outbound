ALTER TABLE "place" ADD COLUMN "amenities" jsonb;--> statement-breakpoint
ALTER TABLE "place" ADD COLUMN "additional_info" jsonb;--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "allows_dogs";--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "good_for_children";--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "good_for_groups";--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "good_for_watching_sports";--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "live_music";--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "outdoor_seating";--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "restroom";