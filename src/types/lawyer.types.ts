import { t } from "elysia";
import { GENDER_CONST, GenderType, LANGUAGES_CONST, LanguagesType, LAWYER_FEE_CONST, LawyerFeeType, PRACTICE_AREAS_CONST, PracticeAreasType } from "./user.types";

interface LawyerProfileType {
  id: number,
  name?: string,
  experience?: number,
  gender?: GenderType,
  age?: number,
  bio?: string,
  bar_number?: string,
  bar_state?: string,
  practice_area?: PracticeAreasType,
  practice_location?: string,
  practicing_courts?: string[],
  home_address?: string,
  languages?: LanguagesType[],
  fee?: number,
  fee_type?: LawyerFeeType,
  rating?: number,
  profile_picture?: string
}

const LawyerProfileSchema = t.Object({
  name: t.Optional(t.String()),
  experience: t.Optional(t.Number()),
  gender: t.Optional(t.Enum(Object.fromEntries(GENDER_CONST.map(g => [g, g])))),
  age: t.Optional(t.Number()),
  bio: t.Optional(t.String()),
  bar_number: t.Optional(t.String()),
  bar_state: t.Optional(t.String()),
  practice_area: t.Optional(t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(x => [x, x])))),
  practice_location: t.Optional(t.String()),
  practicing_courts: t.Optional(t.Array(t.String())),
  home_address: t.Optional(t.String()),
  languages: t.Optional(t.Array(t.Enum(Object.fromEntries(LANGUAGES_CONST.map(x => [x, x]))))),
  fee: t.Optional(t.Number()),
  fee_type: t.Optional(t.Enum(Object.fromEntries(LAWYER_FEE_CONST.map(x => [x, x])))),
  rating: t.Optional(t.Number()),
  profile_picture: t.Optional(t.String())
})

export { LawyerProfileType, LawyerProfileSchema };
