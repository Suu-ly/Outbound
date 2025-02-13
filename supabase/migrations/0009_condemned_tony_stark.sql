ALTER TABLE "location" DROP COLUMN "bounds";--> statement-breakpoint
ALTER TABLE "location" ADD COLUMN "viewport" jsonb NOT NULL;
ALTER TABLE "location" ADD COLUMN "windows" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "trip" ADD COLUMN "current_search_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "location" DROP COLUMN "window_x_step";--> statement-breakpoint
ALTER TABLE "location" DROP COLUMN "window_y_step";--> statement-breakpoint
ALTER TABLE "trip" DROP COLUMN "current_X_window";--> statement-breakpoint
ALTER TABLE "trip" DROP COLUMN "current_Y_window";