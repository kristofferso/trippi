ALTER TABLE "group_members" ADD COLUMN "email_notifications_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "group_members" ADD COLUMN "email_unsubscribed_at" timestamp with time zone;


