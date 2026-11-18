CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_name" text NOT NULL,
	"iv" text NOT NULL,
	"ct" text NOT NULL,
	"sent_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history_entries" (
	"user_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"room_name" text NOT NULL,
	"page_url" text NOT NULL,
	"room_created_at" bigint,
	"last_attended_at" bigint,
	"is_favourite" boolean DEFAULT false NOT NULL,
	"last_read_at" bigint,
	CONSTRAINT "history_entries_user_id_room_id_pk" PRIMARY KEY("user_id","room_id")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"joined_at" bigint NOT NULL,
	"last_seen" bigint NOT NULL,
	CONSTRAINT "memberships_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"page_url" text NOT NULL,
	"selector" text NOT NULL,
	"frame_origin" text DEFAULT '' NOT NULL,
	"visibility" text NOT NULL,
	"chat_key" text DEFAULT '' NOT NULL,
	"chat_salt" text DEFAULT '' NOT NULL,
	"chat_check_iv" text,
	"chat_check_ct" text,
	"owner_id" uuid NOT NULL,
	"owner_name" text NOT NULL,
	"primary_owner_id" uuid NOT NULL,
	"primary_owner_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"playback_is_playing" boolean NOT NULL,
	"playback_current_time" double precision NOT NULL,
	"playback_rate" double precision NOT NULL,
	"playback_updated_at" bigint,
	"playback_updated_by" uuid NOT NULL,
	"host_current_time" double precision,
	"host_is_playing" boolean,
	"host_updated_at" bigint,
	"last_active_at" bigint NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_room_sent" ON "chat_messages" USING btree ("room_id","sent_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "history_entries_user_attended" ON "history_entries" USING btree ("user_id","last_attended_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "rooms_created_at" ON "rooms" USING btree ("created_at" DESC NULLS LAST);