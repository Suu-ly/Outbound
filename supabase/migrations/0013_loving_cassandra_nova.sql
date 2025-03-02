ALTER TABLE "trip_travel_time" RENAME TO "travel_time";--> statement-breakpoint
ALTER TABLE "travel_time" DROP CONSTRAINT "trip_travel_time_from_place_id_fk";
--> statement-breakpoint
ALTER TABLE "travel_time" DROP CONSTRAINT "trip_travel_time_to_place_id_fk";
--> statement-breakpoint
ALTER TABLE "travel_time" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "travel_time" ADD CONSTRAINT "travel_time_id" PRIMARY KEY("from","to");--> statement-breakpoint
ALTER TABLE "trip_place" ADD COLUMN "updated_at" timestamp (3) DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "travel_time" ADD CONSTRAINT "travel_time_from_place_id_fk" FOREIGN KEY ("from") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_time" ADD CONSTRAINT "travel_time_to_place_id_fk" FOREIGN KEY ("to") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_time" DROP COLUMN "type";