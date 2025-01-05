CREATE TYPE "public"."login_type_enum" AS ENUM('gmail', 'github', 'email');--> statement-breakpoint
CREATE TYPE "public"."trip_place_type_enum" AS ENUM('saved', 'skipped', 'undecided');--> statement-breakpoint
CREATE TYPE "public"."trip_travel_time_type_enum" AS ENUM('drive', 'walk', 'cycle');--> statement-breakpoint
CREATE TABLE "location" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"cover_img" text NOT NULL,
	"cover_img_small" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"types" jsonb NOT NULL,
	"primary_type_display_name" varchar(64) NOT NULL,
	"type_color" varchar(8) NOT NULL,
	"phone" varchar(32),
	"address" text NOT NULL,
	"location" jsonb NOT NULL,
	"viewport" jsonb NOT NULL,
	"rating" real,
	"rating_count" integer,
	"reviews" jsonb,
	"review_highlight" text,
	"website" text,
	"google_maps_link" text NOT NULL,
	"description" text,
	"opening_hours" jsonb,
	"accessibility_options" jsonb,
	"parking_options" jsonb,
	"payment_options" jsonb,
	"allows_dogs" boolean,
	"good_for_children" boolean,
	"good_for_groups" boolean,
	"good_for_watching_sports" boolean,
	"live_music" boolean,
	"outdoor_seating" boolean,
	"restroom" boolean
);
--> statement-breakpoint
CREATE TABLE "reset_link" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"private" boolean DEFAULT true NOT NULL,
	"round_up_time" boolean DEFAULT true NOT NULL,
	"next_page_token" text,
	"start_time" varchar(4) DEFAULT '0900' NOT NULL,
	"end_time" varchar(4) DEFAULT '2100' NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_day" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" varchar(12) NOT NULL,
	"prev_day" integer,
	"next_day" integer,
	"end_time" varchar(4) DEFAULT 'auto' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_place" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" varchar(12) NOT NULL,
	"place_id" text NOT NULL,
	"day_id" integer,
	"note" text,
	"type" "trip_place_type_enum" DEFAULT 'undecided' NOT NULL,
	"prev_place" integer,
	"next_place" integer
);
--> statement-breakpoint
CREATE TABLE "trip_travel_time" (
	"id" serial PRIMARY KEY NOT NULL,
	"from" integer NOT NULL,
	"to" integer NOT NULL,
	"type" "trip_travel_time_type_enum" DEFAULT 'drive' NOT NULL,
	"walk" jsonb,
	"cycle" jsonb,
	"drive" jsonb
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"login_type" "login_type_enum" NOT NULL,
	"profile_picture" text,
	"access_token" text,
	"refresh_token" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "reset_link" ADD CONSTRAINT "reset_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip" ADD CONSTRAINT "trip_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip" ADD CONSTRAINT "trip_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_day" ADD CONSTRAINT "trip_day_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_day" ADD CONSTRAINT "trip_day_prev_day_trip_day_id_fk" FOREIGN KEY ("prev_day") REFERENCES "public"."trip_day"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_day" ADD CONSTRAINT "trip_day_next_day_trip_day_id_fk" FOREIGN KEY ("next_day") REFERENCES "public"."trip_day"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_place" ADD CONSTRAINT "trip_place_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_place" ADD CONSTRAINT "trip_place_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_place" ADD CONSTRAINT "trip_place_day_id_trip_day_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."trip_day"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_place" ADD CONSTRAINT "trip_place_prev_place_trip_place_id_fk" FOREIGN KEY ("prev_place") REFERENCES "public"."trip_place"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_place" ADD CONSTRAINT "trip_place_next_place_trip_place_id_fk" FOREIGN KEY ("next_place") REFERENCES "public"."trip_place"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_travel_time" ADD CONSTRAINT "trip_travel_time_from_trip_place_id_fk" FOREIGN KEY ("from") REFERENCES "public"."trip_place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_travel_time" ADD CONSTRAINT "trip_travel_time_to_trip_place_id_fk" FOREIGN KEY ("to") REFERENCES "public"."trip_place"("id") ON DELETE cascade ON UPDATE no action;