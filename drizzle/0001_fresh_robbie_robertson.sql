CREATE TABLE "internship_opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"firm_name" text NOT NULL,
	"location" text NOT NULL,
	"department" text NOT NULL,
	"position_type" text NOT NULL,
	"duration" text NOT NULL,
	"compensation_type" text,
	"salary_amount" text,
	"start_date" timestamp with time zone NOT NULL,
	"application_deadline" timestamp with time zone NOT NULL,
	"description" text NOT NULL,
	"requirements" text[] NOT NULL,
	"benefits" text[],
	"is_remote" boolean DEFAULT false,
	"accepts_international" boolean DEFAULT false,
	"provides_housing" boolean DEFAULT false,
	"contact_person" text NOT NULL,
	"contact_email" text NOT NULL,
	"posted_date" timestamp with time zone DEFAULT now(),
	"applicants_till_now" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"rating" real DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "refresh_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "otps" ALTER COLUMN "otp" SET NOT NULL;