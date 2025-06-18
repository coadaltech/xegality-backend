CREATE TYPE "public"."role" AS ENUM('consumer', 'lawyer', 'student');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"role" "role" NOT NULL,
	"phone" bigint,
	"email" text,
	"hashed_password" text,
	"refresh_token" text,
	"profile_pic" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" bigint,
	"email" text,
	"otp" integer,
	CONSTRAINT "otps_phone_unique" UNIQUE("phone")
);
