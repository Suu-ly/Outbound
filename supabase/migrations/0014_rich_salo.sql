CREATE TABLE "trip_travel_time" (
	"from" text NOT NULL,
	"to" text NOT NULL,
	"trip_id" varchar(12) NOT NULL,
	"type" "trip_travel_time_type_enum" DEFAULT 'drive' NOT NULL,
	CONSTRAINT "trip_travel_time_id" PRIMARY KEY("from","to","trip_id")
);
--> statement-breakpoint
ALTER TABLE "trip_place" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "trip_travel_time" ADD CONSTRAINT "trip_travel_time_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_travel_time" ADD CONSTRAINT "trip_travel_time_fk" FOREIGN KEY ("from","to") REFERENCES "public"."travel_time"("from","to") ON DELETE cascade ON UPDATE no action;