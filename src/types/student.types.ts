import { t, Static } from "elysia";
import { GENDER_CONST, LANGUAGES_CONST, PRACTICE_AREAS_CONST } from "./user.types";

const StudentProfileSchema = t.Object({
  // Basic Info
  name: t.Optional(t.String()),
  gender: t.Optional(t.Enum(Object.fromEntries(GENDER_CONST.map(x => [x, x])))),
  age: t.Optional(t.Number()),
  home_address: t.Optional(t.String()),
  languages: t.Optional(t.Array(t.Enum(Object.fromEntries(LANGUAGES_CONST.map(x => [x, x]))))),
  profile_picture: t.Optional(t.String()),
  cover_image: t.Optional(t.String()),
  profile_headline: t.Optional(t.String()),
  bio: t.Optional(t.String()),

  // Academic
  university_name: t.Optional(t.String()),
  degree: t.Optional(t.String({ maxLength: 100 })),
  grades: t.Optional(t.Number()),  // float/real
  passing_year: t.Optional(t.String({ format: "date" })),

  // Application
  practice_area_interests: t.Optional(t.Array(t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(x => [x, x]))))),
  prior_internships: t.Optional(t.Array(
    t.Object({
      organization: t.String(),
      role: t.String(),
      start_date: t.String({ format: "date" }),
      end_date: t.Optional(t.String({ format: "date" })),
      practice_area: t.Optional(t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(x => [x, x]))))
    })
  )),
  cv_resume: t.Optional(t.String()), // S3 URL
  linkedin_url: t.Optional(t.String()),

  // Availability
  availability: t.Optional(t.String({ format: "date" })),
  preferred_locations: t.Optional(t.Array(t.String({ maxLength: 50 }))),
  remote_ok: t.Optional(t.Boolean())
});

export { StudentProfileSchema };
