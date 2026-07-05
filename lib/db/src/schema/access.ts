import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const membershipRoleEnum = pgEnum("membership_role", [
  "agency_admin",
  "sub_account_holder",
  "member",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "revoked",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "redeemed",
  "revoked",
]);

export const agenciesTable = pgTable("agencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subAccountsTable = pgTable("sub_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agenciesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// A membership links a Clerk user (userId is the Clerk user id) to a place in
// the tenant hierarchy. Agency admins have a null subAccountId (scoped to the
// whole agency); sub-account holders and members are scoped to one sub-account.
// accessExpiresAt is null for non-expiring staff and set for time-limited
// members.
export const membershipsTable = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    agencyId: uuid("agency_id")
      .notNull()
      .references(() => agenciesTable.id, { onDelete: "cascade" }),
    subAccountId: uuid("sub_account_id").references(() => subAccountsTable.id, {
      onDelete: "cascade",
    }),
    role: membershipRoleEnum("role").notNull(),
    status: membershipStatusEnum("status").notNull().default("active"),
    email: text("email"),
    accessExpiresAt: timestamp("access_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One membership per (user, sub-account) for holders and members.
    uniqueIndex("memberships_user_sub_account_uq")
      .on(t.userId, t.subAccountId)
      .where(sql`${t.subAccountId} IS NOT NULL`),
    // One agency-admin membership per (user, agency).
    uniqueIndex("memberships_user_agency_admin_uq")
      .on(t.userId, t.agencyId)
      .where(sql`${t.subAccountId} IS NULL`),
    // agency_admin <=> no sub-account; holders/members must have one.
    check(
      "memberships_admin_no_sub_account",
      sql`(${t.role} = 'agency_admin') = (${t.subAccountId} IS NULL)`,
    ),
  ],
);

export const invitesTable = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agenciesTable.id, { onDelete: "cascade" }),
  subAccountId: uuid("sub_account_id").references(() => subAccountsTable.id, {
    onDelete: "cascade",
  }),
  role: membershipRoleEnum("role").notNull(),
  accessDurationDays: integer("access_duration_days").default(365),
  inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }),
  status: inviteStatusEnum("status").notNull().default("pending"),
  // Optional invitee email. When set, the redeem link is emailed on create and
  // can be re-sent. emailSentAt records the last successful delivery (null =
  // never sent, e.g. no email captured or a send failure).
  email: text("email"),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  createdByUserId: text("created_by_user_id").notNull(),
  redeemedByUserId: text("redeemed_by_user_id"),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertAgencySchema = createInsertSchema(agenciesTable);
export const insertSubAccountSchema = createInsertSchema(subAccountsTable);
export const insertMembershipSchema = createInsertSchema(membershipsTable);
export const insertInviteSchema = createInsertSchema(invitesTable);

export type Agency = typeof agenciesTable.$inferSelect;
export type SubAccount = typeof subAccountsTable.$inferSelect;
export type Membership = typeof membershipsTable.$inferSelect;
export type Invite = typeof invitesTable.$inferSelect;
export type MembershipRole = (typeof membershipRoleEnum.enumValues)[number];
export type MembershipStatus = (typeof membershipStatusEnum.enumValues)[number];
export type InviteStatus = (typeof inviteStatusEnum.enumValues)[number];

export type InsertAgency = z.infer<typeof insertAgencySchema>;
export type InsertSubAccount = z.infer<typeof insertSubAccountSchema>;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
