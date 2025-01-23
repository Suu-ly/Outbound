import {
  AnyPgColumn,
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const loginTypeEnum = pgEnum("login_type_enum", [
  "gmail",
  "github",
  "email",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export type InsertUser = typeof user.$inferInsert;
export type SelectUser = typeof user.$inferSelect;

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
    }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const resetLink = pgTable("reset_link", {
  id: varchar("id", { length: 12 }).primaryKey(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
    precision: 3,
  })
    .notNull()
    .defaultNow(),
  active: boolean("active").notNull().default(true),
});

export type InsertResetLink = typeof resetLink.$inferInsert;
export type SelectResetLink = typeof resetLink.$inferSelect;

export const location = pgTable("location", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  coverImg: text("cover_img").notNull(),
  coverImgSmall: text("cover_img_small").notNull(),
  bounds: numeric("bounds", { precision: 13, scale: 10 })
    .array(2)
    .array(2)
    .notNull(),
  windowXStep: integer("window_x_step").notNull(),
  windowYStep: integer("window_y_step").notNull(),
});

export type InsertLocation = typeof location.$inferInsert;
export type SelectLocation = typeof location.$inferSelect;

// Photos are not stored in database due to the expiry of the place photo name
export const place = pgTable("place", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  types: jsonb("types").notNull().$type<string[]>(),
  primaryTypeDisplayName: varchar("primary_type_display_name", {
    length: 64,
  }).notNull(),
  typeColor: varchar("type_color", { length: 8 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  address: text("address").notNull(),
  location: jsonb("location")
    .notNull()
    .$type<{ latitude: number; longitude: number }>(),
  viewport: jsonb("viewport").notNull().$type<{
    low: { latitude: number; longitude: number };
    high: { latitude: number; longitude: number };
  }>(),
  rating: real("rating"),
  ratingCount: integer("rating_count"),
  reviews: jsonb("reviews").$type<
    {
      name: string;
      relativePublishTimeDescription: string;
      text: {
        text: string;
        languageCode: string;
      };
      originalText: {
        text: string;
        languageCode: string;
      };
      rating: number;
      authorAttribution: {
        displayName: string;
        uri: string;
        photoUri: string;
      };
      publishTime: string;
      flagContentUri: string;
      googleMapsUri: string;
    }[]
  >(),
  reviewHighlight: text("review_highlight"),
  website: text("website"),
  googleMapsLink: text("google_maps_link").notNull(),
  description: text("description"),
  openingHours: jsonb("opening_hours").$type<{
    periods: {
      open: { day: number; hour: number; minute: number };
      close: { day: number; hour: number; minute: number };
    }[];
    text: string[];
  }>(),
  accessibilityOptions: jsonb("accessibility_options").$type<{
    wheelchairAccessibleParking?: boolean;
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleRestroom?: boolean;
    wheelchairAccessibleSeating?: boolean;
  }>(),
  parkingOptions: jsonb("parking_options").$type<{
    freeParkingLot?: boolean;
    paidParkingLot?: boolean;
    freeStreetParking?: boolean;
    paidStreetParking?: boolean;
    valetParking?: boolean;
    freeGarageParking?: boolean;
    paidGarageParking?: boolean;
  }>(),
  paymentOptions: jsonb("payment_options").$type<{
    acceptsCreditCards?: boolean;
    acceptsDebitCards?: boolean;
    acceptsCashOnly?: boolean;
    acceptsNfc?: boolean;
  }>(),
  allowsDogs: boolean("allows_dogs"),
  goodForChildren: boolean("good_for_children"),
  goodForGroups: boolean("good_for_groups"),
  goodForWatchingSports: boolean("good_for_watching_sports"),
  liveMusic: boolean("live_music"),
  outdoorSeating: boolean("outdoor_seating"),
  restroom: boolean("restroom"),
});

export type InsertPlace = typeof place.$inferInsert;
export type SelectPlace = typeof place.$inferSelect;

export const trip = pgTable("trip", {
  id: varchar("id", { length: 12 }).primaryKey(),
  // User ID foreign key
  userId: text("user_id")
    .references(() => user.id, {
      onDelete: "cascade",
    })
    .notNull(),
  // Location ID foreign key
  locationId: text("location_id")
    .references(() => location.id)
    .notNull(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  private: boolean("private").notNull().default(true),
  roundUpTime: boolean("round_up_time").notNull().default(true),
  currentXWindow: integer("current_X_window").default(1),
  currentYWindow: integer("current_Y_window").default(1),
  nextPageToken: text("next_page_token").array(),
  startTime: varchar("start_time", { length: 4 }).notNull().default("0900"),
  endTime: varchar("end_time", { length: 4 }).notNull().default("2100"),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
    precision: 3,
  })
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export type InsertTrip = typeof trip.$inferInsert;
export type SelectTrip = typeof trip.$inferSelect;

export const tripDay = pgTable("trip_day", {
  id: serial("id").primaryKey(),
  tripId: varchar("trip_id", { length: 12 })
    .references(() => trip.id, {
      onDelete: "cascade",
    })
    .notNull(),
  prevDay: integer("prev_day").references((): AnyPgColumn => tripDay.id),
  nextDay: integer("next_day").references((): AnyPgColumn => tripDay.id),
  startTime: varchar("end_time", { length: 4 })
    .notNull()
    .default("auto")
    .notNull(),
});

export type InsertTripDay = typeof tripDay.$inferInsert;
export type SelectTripDay = typeof tripDay.$inferSelect;

export const tripPlaceTypeEnum = pgEnum("trip_place_type_enum", [
  "saved",
  "skipped",
  "undecided",
]);

export const tripPlace = pgTable("trip_place", {
  id: serial("id").primaryKey(),
  tripId: varchar("trip_id", { length: 12 })
    .references(() => trip.id, { onDelete: "cascade" })
    .notNull(),
  placeId: text("place_id")
    .references(() => place.id)
    .notNull(),
  dayId: integer("day_id").references(() => tripDay.id, {
    onDelete: "set null",
  }),
  note: text("note"),
  type: tripPlaceTypeEnum("type").default("undecided").notNull(),
  prevPlace: integer("prev_place").references((): AnyPgColumn => tripPlace.id),
  nextPlace: integer("next_place").references((): AnyPgColumn => tripPlace.id),
});

export type InsertTripPlace = typeof tripPlace.$inferInsert;
export type SelectTripPlace = typeof tripPlace.$inferSelect;

export const tripTravelTimeTypeEnum = pgEnum("trip_travel_time_type_enum", [
  "drive",
  "walk",
  "cycle",
]);

export const tripTravelTime = pgTable("trip_travel_time", {
  id: serial("id").primaryKey(),
  from: integer("from")
    .references(() => tripPlace.id, { onDelete: "cascade" })
    .notNull(),
  to: integer("to")
    .references(() => tripPlace.id, { onDelete: "cascade" })
    .notNull(),
  type: tripTravelTimeTypeEnum("type").default("drive").notNull(),
  walk: jsonb("walk").$type<{
    distance: string;
    duration: string;
  }>(),
  cycle: jsonb("cycle").$type<{
    distance: string;
    duration: string;
  }>(),
  drive: jsonb("drive").$type<{
    distance: string;
    duration: string;
  }>(),
});

export type InsertTripTravelTime = typeof tripTravelTime.$inferInsert;
export type SelectTripTravelTime = typeof tripTravelTime.$inferSelect;
