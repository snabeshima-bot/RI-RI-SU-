import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const releases = pgTable("releases", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  type: text("type").notNull().default("single"),
  notes: text("notes").notNull().default(""),

  release: date("release_date"),
  musicSubmission: date("music_submission_date"),
  jacketSubmission: date("jacket_submission_date"),
  karaokeRelease: date("karaoke_release_date"),
  karaokeSubmission: date("karaoke_submission_date"),
  teaserShoot: date("teaser_shoot_date"),
  teaserRelease: date("teaser_release_date"),

  musicSubmitted: boolean("music_submitted").notNull().default(false),
  jacketSubmitted: boolean("jacket_submitted").notNull().default(false),
  karaokeSubmitted: boolean("karaoke_submitted").notNull().default(false),

  /** マイルストーン種別 → GoogleカレンダーのイベントID */
  gcalEventIds: jsonb("gcal_event_ids").$type<Record<string, string>>().notNull().default({}),
  gcalError: text("gcal_error"),

  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  releaseId: integer("release_id")
    .notNull()
    .references(() => releases.id, { onDelete: "cascade" }),
  trackNo: integer("track_no").notNull(),
  title: text("title").notNull(),
  isrc: text("isrc").notNull().default(""),
});

export const users = pgTable("users", {
  email: text("email").primaryKey(),
  name: text("name"),
  image: text("image"),
  /** 全アーティストの通知を受け取る */
  notifyAll: boolean("notify_all").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    userEmail: text("user_email")
      .notNull()
      .references(() => users.email, { onDelete: "cascade" }),
    artistId: integer("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userEmail, t.artistId] })],
);

export const reminderLogs = pgTable(
  "reminder_logs",
  {
    id: serial("id").primaryKey(),
    releaseId: integer("release_id")
      .notNull()
      .references(() => releases.id, { onDelete: "cascade" }),
    milestone: text("milestone").notNull(),
    targetDate: date("target_date").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reminder_logs_unique").on(t.releaseId, t.milestone, t.targetDate)],
);

export type Artist = typeof artists.$inferSelect;
export type Release = typeof releases.$inferSelect;
export type Track = typeof tracks.$inferSelect;
