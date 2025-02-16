ALTER TABLE "trip_place" DROP CONSTRAINT "composite";--> statement-breakpoint
ALTER TABLE "trip_travel_time" ALTER COLUMN "from" SET DATA TYPE text;
ALTER TABLE "trip_travel_time" ALTER COLUMN "to" SET DATA TYPE text;
ALTER TABLE "trip" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "trip_place" ALTER COLUMN "order" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_place" ADD CONSTRAINT "trip_place_id" PRIMARY KEY("trip_id","place_id");--> statement-breakpoint
ALTER TABLE "trip_place" ADD COLUMN "created_at" timestamp (3) DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_travel_time" ADD CONSTRAINT "trip_travel_time_from_place_id_fk" FOREIGN KEY ("from") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_travel_time" ADD CONSTRAINT "trip_travel_time_to_place_id_fk" FOREIGN KEY ("to") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_place" DROP COLUMN "id";