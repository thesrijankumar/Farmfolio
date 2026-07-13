import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  doublePrecision,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*  Enums                                                                     */
/* -------------------------------------------------------------------------- */

export const userRoleEnum = pgEnum("user_role", [
  "farmer",
  "extension_worker",
  "admin",
]);

export const moistureLevelEnum = pgEnum("moisture_level", [
  "low",
  "medium",
  "high",
]);

// Drives the traffic-light indicator (🔴🟡🟢) in the UI
export const statusEnum = pgEnum("field_status", [
  "red", // irrigate now
  "yellow", // irrigate soon
  "green", // sufficient
]);

/* -------------------------------------------------------------------------- */
/*  Users                                                                     */
/*  Covers Ramesh (farmer), Anjali (extension worker), Anoop (commercial)     */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    passwordHash: text("password_hash"), // nullable if you add OAuth/OTP login later
    role: userRoleEnum("role").notNull().default("farmer"),
    preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    phoneIdx: uniqueIndex("users_phone_idx").on(table.phone),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  fields: many(fields), // fields this user owns (as a farmer)
  managedFields: many(fieldManagers), // fields this user monitors (as an extension worker)
}));

/* -------------------------------------------------------------------------- */
/*  Fields                                                                    */
/*  A farmer's plot of land, identified by GPS coordinates                   */
/* -------------------------------------------------------------------------- */

export const fields = pgTable(
  "fields",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(), // e.g. "North Plot"
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    // Static soil type/pH/texture from SoilGrids — rarely changes, so cached on the field itself
    soilType: varchar("soil_type", { length: 60 }),
    soilPh: doublePrecision("soil_ph"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index("fields_owner_idx").on(table.ownerId),
    // Speeds up "nearby fields" / duplicate-field checks
    coordsIdx: index("fields_coords_idx").on(table.latitude, table.longitude),
  })
);

export const fieldsRelations = relations(fields, ({ one, many }) => ({
  owner: one(users, {
    fields: [fields.ownerId],
    references: [users.id],
  }),
  reports: many(soilReports),
  managers: many(fieldManagers),
}));

/* -------------------------------------------------------------------------- */
/*  Field Managers (join table)                                              */
/*  Lets an extension worker (Anjali) monitor fields she doesn't own,        */
/*  powering the multi-field dashboard                                       */
/* -------------------------------------------------------------------------- */

export const fieldManagers = pgTable(
  "field_managers",
  {
    fieldId: uuid("field_id")
      .notNull()
      .references(() => fields.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.fieldId, table.userId] }),
  })
);

export const fieldManagersRelations = relations(fieldManagers, ({ one }) => ({
  field: one(fields, {
    fields: [fieldManagers.fieldId],
    references: [fields.id],
  }),
  user: one(users, {
    fields: [fieldManagers.userId],
    references: [users.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/*  Soil Reports                                                             */
/*  One row per data fetch — powers the instant report, historical trend    */
/*  view, and the Gemini-generated AI summary                                */
/* -------------------------------------------------------------------------- */

export const soilReports = pgTable(
  "soil_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => fields.id, { onDelete: "cascade" }),

    // Simplified values shown to the farmer
    moistureLevel: moistureLevelEnum("moisture_level").notNull(),
    status: statusEnum("status").notNull(),
    temperatureC: doublePrecision("temperature_c"),
    rainfallForecastMm: doublePrecision("rainfall_forecast_mm"),
    recommendation: text("recommendation"), // e.g. "Irrigate within 24 hours"

    // AI-generated summary from the Gemini agentic layer
    aiSummary: text("ai_summary"),

    // Raw upstream payloads kept for auditing / re-processing without new API calls
    rawNasaPower: jsonb("raw_nasa_power"),
    rawSoilGrids: jsonb("raw_soilgrids"),

    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Historical Trend View queries by field + time range constantly
    fieldFetchedIdx: index("soil_reports_field_fetched_idx").on(
      table.fieldId,
      table.fetchedAt
    ),
  })
);

export const soilReportsRelations = relations(soilReports, ({ one }) => ({
  field: one(fields, {
    fields: [soilReports.fieldId],
    references: [fields.id],
  }),
}));