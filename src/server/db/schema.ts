import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const loginType = pgEnum("login_type", ["gmail", "github", "email"]);

export const userTable = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  loginType: loginType().notNull(),
  profilePicture: text("profile_picture"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
    precision: 3,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
    precision: 3,
  })
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export type InsertUser = typeof userTable.$inferInsert;
export type SelectUser = typeof userTable.$inferSelect;

export const tripTable = pgTable("trip", {
  id: varchar("id", { length: 12 }).primaryKey(),
  userId: integer("user_id")
    .references(() => userTable.id)
    .notNull(),
  locationId: integer("location_id"), //.references(() => locationTable.id),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  private: boolean("private").notNull().default(true),
  roundUpTime: boolean("round_up_time").notNull().default(true),
  nextPageToken: text("next_page_token"),
  endTime: varchar("end_time", { length: 4 }).notNull().default("2100"),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
    precision: 3,
  })
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export type InsertTrip = typeof tripTable.$inferInsert;
export type SelectTrip = typeof tripTable.$inferSelect;
