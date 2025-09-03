import { t } from 'elysia';
import { GENDER_CONST, LANGUAGES_CONST, LAWYER_FEE_CONST, PRACTICE_AREAS_CONST, PracticeAreasType, GenderType, LanguagesType, LawyerFeeType, MARITAL_STATUS_CONST, } from './user.types';

interface FiltersType {
  gender?: GenderType
  experience_range?: number[],
  practice_areas?: PracticeAreasType[],
  practice_location?: string,
  languages?: LanguagesType[],
  fee_range?: number[],
  fee_type?: LawyerFeeType,
  rating_range?: number[],
}

const FilterLawyerSchema = t.Object({
  gender: t.Optional(t.Enum(Object.fromEntries(GENDER_CONST.map(g => [g, g])))),
  experience_range: t.Optional(t.Array(t.Number())),
  practice_areas: t.Optional(t.Array(t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(x => [x, x]))))),
  practice_location: t.Optional(t.String()),
  languages: t.Optional(t.Array(t.Enum(Object.fromEntries(LANGUAGES_CONST.map(x => [x, x]))))),
  fee_range: t.Optional(t.Array(t.Number())),
  fee_type: t.Optional(t.Enum(Object.fromEntries(LAWYER_FEE_CONST.map(x => [x, x])))),
  rating_range: t.Optional(t.Array(t.Number())),
});

const ConsumerProfileSchema = t.Object({
  name: t.Optional(t.String()),
  gender: t.Optional(t.Enum(Object.fromEntries(GENDER_CONST.map(x => [x, x])))),
  age: t.Optional(t.Number()),
  marital_status: t.Optional(t.Enum(Object.fromEntries(MARITAL_STATUS_CONST.map(x => [x, x])))),
  home_address: t.Optional(t.String()),
  postal_pincode: t.Optional(t.Number()),
  profile_picture: t.Optional(t.String())
})

export { FiltersType, FilterLawyerSchema, ConsumerProfileSchema };
