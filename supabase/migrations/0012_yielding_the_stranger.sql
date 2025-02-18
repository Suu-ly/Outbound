ALTER TABLE "trip_day" RENAME COLUMN "end_time" TO "start_time";--> statement-breakpoint
ALTER TABLE "trip_travel_time" ALTER COLUMN "from" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trip_travel_time" ALTER COLUMN "to" SET DATA TYPE text;