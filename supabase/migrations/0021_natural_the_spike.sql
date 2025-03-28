CREATE INDEX "account_user_id_index" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reset_link_user_id_index" ON "reset_link" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_index" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "travel_time_from_index" ON "travel_time" USING btree ("from");--> statement-breakpoint
CREATE INDEX "travel_time_to_index" ON "travel_time" USING btree ("to");--> statement-breakpoint
CREATE INDEX "trip_location_id_index" ON "trip" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "trip_user_id_index" ON "trip" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trip_day_trip_id_index" ON "trip_day" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_place_place_id_index" ON "trip_place" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "trip_place_trip_id_index" ON "trip_place" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_place_day_id_index" ON "trip_place" USING btree ("day_id");--> statement-breakpoint
CREATE INDEX "trip_travel_time_trip_id_index" ON "trip_travel_time" USING btree ("trip_id");