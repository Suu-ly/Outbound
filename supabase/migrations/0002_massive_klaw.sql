ALTER TABLE "location" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trip" ALTER COLUMN "location_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trip" ALTER COLUMN "next_page_token" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "location" ADD COLUMN "bounds" integer[2][2] NOT NULL;--> statement-breakpoint
ALTER TABLE "location" ADD COLUMN "window_x_step" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "location" ADD COLUMN "window_y_step" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "trip" ADD COLUMN "current_X_window" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "trip" ADD COLUMN "current_Y_window" integer DEFAULT 1;