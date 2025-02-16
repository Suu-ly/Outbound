ALTER TABLE "trip_day" DROP CONSTRAINT "trip_day_prev_day_trip_day_id_fk";
--> statement-breakpoint
ALTER TABLE "trip_day" DROP CONSTRAINT "trip_day_next_day_trip_day_id_fk";
--> statement-breakpoint
ALTER TABLE "trip_place" DROP CONSTRAINT "trip_place_prev_place_trip_place_id_fk";
--> statement-breakpoint
ALTER TABLE "trip_place" DROP CONSTRAINT "trip_place_next_place_trip_place_id_fk";
--> statement-breakpoint
ALTER TABLE "trip_day" ADD COLUMN "order" text NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_place" ADD COLUMN "order" text NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_day" DROP COLUMN "prev_day";--> statement-breakpoint
ALTER TABLE "trip_day" DROP COLUMN "next_day";--> statement-breakpoint
ALTER TABLE "trip_place" DROP COLUMN "prev_place";--> statement-breakpoint
ALTER TABLE "trip_place" DROP COLUMN "next_place";