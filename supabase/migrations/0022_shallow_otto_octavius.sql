ALTER TABLE "trip" ALTER COLUMN "current_search_index" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "trip" ALTER COLUMN "current_search_index" DROP NOT NULL;