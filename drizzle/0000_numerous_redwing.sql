CREATE TYPE "public"."role" AS ENUM('consumer', 'lawyer', 'student');--> statement-breakpoint
CREATE TABLE "consumers" (
	"id" bigint PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyers" (
	"id" bigint PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applied_internships" (
	"internship_id" bigint PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now(),
	"status" text DEFAULT 'applied'
);
--> statement-breakpoint
CREATE TABLE "internships" (
	"id" bigint PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"specialization" text NOT NULL,
	"designation" text NOT NULL,
	"duration" text NOT NULL,
	"compensation_type" text,
	"salary_amount" text,
	"application_deadline" timestamp with time zone NOT NULL,
	"requirements" text[],
	"benefits" text[],
	"posted_by" bigint NOT NULL,
	"posted_date" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posted_internships" (
	"internship_id" bigint PRIMARY KEY NOT NULL,
	"lawyer_id" bigint NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now(),
	"status" text DEFAULT 'open'
);
--> statement-breakpoint
CREATE TABLE "otps" (
	"id" bigint PRIMARY KEY NOT NULL,
	"phone" bigint,
	"email" text,
	"otp" integer NOT NULL,
	CONSTRAINT "otps_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" "role" NOT NULL,
	"phone" bigint,
	"email" text,
	"hashed_password" text,
	"refresh_token" text NOT NULL,
	"applied_internships" text[] DEFAULT '{}' NOT NULL,
	"profile_pic" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" bigint PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consumers" ADD CONSTRAINT "consumers_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyers" ADD CONSTRAINT "lawyers_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applied_internships" ADD CONSTRAINT "applied_internships_internship_id_internships_id_fk" FOREIGN KEY ("internship_id") REFERENCES "public"."internships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applied_internships" ADD CONSTRAINT "applied_internships_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posted_internships" ADD CONSTRAINT "posted_internships_internship_id_internships_id_fk" FOREIGN KEY ("internship_id") REFERENCES "public"."internships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posted_internships" ADD CONSTRAINT "posted_internships_lawyer_id_users_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;