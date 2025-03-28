ALTER TABLE "travel_time" DROP CONSTRAINT "travel_time_from_place_id_fk";
--> statement-breakpoint
ALTER TABLE "travel_time" DROP CONSTRAINT "travel_time_to_place_id_fk";
--> statement-breakpoint
ALTER TABLE "trip_place" DROP CONSTRAINT "trip_place_place_id_place_id_fk";
--> statement-breakpoint
ALTER TABLE "travel_time" ADD CONSTRAINT "travel_time_from_place_id_fk" FOREIGN KEY ("from") REFERENCES "public"."place"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "travel_time" ADD CONSTRAINT "travel_time_to_place_id_fk" FOREIGN KEY ("to") REFERENCES "public"."place"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "trip_place" ADD CONSTRAINT "trip_place_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE no action ON UPDATE cascade;