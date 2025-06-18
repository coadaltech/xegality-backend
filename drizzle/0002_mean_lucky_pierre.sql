ALTER TABLE "otps" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "internship_opportunities" ADD COLUMN "employer_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "internship_opportunities" ADD COLUMN "employer_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "internship_opportunities" DROP COLUMN "contact_person";--> statement-breakpoint
ALTER TABLE "internship_opportunities" DROP COLUMN "contact_email";--> statement-breakpoint
ALTER TABLE "internship_opportunities" ADD CONSTRAINT "internship_opportunities_employer_id_unique" UNIQUE("employer_id");