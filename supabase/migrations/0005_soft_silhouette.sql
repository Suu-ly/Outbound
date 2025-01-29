ALTER TABLE "trip" ALTER COLUMN "current_X_window" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "trip" ALTER COLUMN "current_Y_window" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "place" ADD COLUMN "cover_img" text NOT NULL;