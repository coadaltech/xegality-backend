import { t, Static } from "elysia";
import { GENDER_CONST, GenderType, LANGUAGES_CONST, LanguagesType, LAWYER_FEE_CONST, LawyerFeeType, PRACTICE_AREAS_CONST, PracticeAreasType } from "./user.types";

const LawyerProfileSchema = t.Object({
  name: t.Optional(t.String()),
  experience: t.Optional(t.Number()),
  gender: t.Optional(t.Enum(Object.fromEntries(GENDER_CONST.map(x => [x, x])))),
  age: t.Optional(t.Number()),
  bio: t.Optional(t.String()),
  bar_number: t.Optional(t.String()),
  practice_areas: t.Optional(t.Array(t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(x => [x, x]))))),
  law_firm: t.Optional(t.String()),
  law_firm_id: t.Optional(t.Number()),
  practice_location: t.Optional(t.String()),
  practicing_courts: t.Optional(t.Array(t.String())),
  home_address: t.Optional(t.String()),
  languages: t.Optional(t.Array(t.Enum(Object.fromEntries(LANGUAGES_CONST.map(x => [x, x]))))),
  fee: t.Optional(t.Number()),
  fee_type: t.Optional(t.Enum(Object.fromEntries(LAWYER_FEE_CONST.map(x => [x, x])))),
  profile_picture: t.Optional(t.String())
})

// type Hello = Static<typeof LawyerProfileSchema>

export { LawyerProfileSchema };
