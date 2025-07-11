import { t } from 'elysia';
import { GENDER_CONST, LANGUAGES_CONST, LAWYER_FEE_CONST, PRACTICE_AREAS_CONST, PracticeAreasType, GenderType, LanguagesType, LawyerFeeType } from './user.types';

const EMPLOYMENT_STATUS_CONST = ['employed', 'unemployed', 'self_employed', 'student', 'retired'] as const;
const MARITAL_STATUS_CONST = ['single', 'married', 'divorced', 'widowed'] as const;
type EmploymentStatusType = (typeof EMPLOYMENT_STATUS_CONST)[number];
type MaritalStatusType = (typeof MARITAL_STATUS_CONST)[number];

interface FiltersType {
  gender?: GenderType
  experience?: number,
  bar_state?: string,
  practice_area?: PracticeAreasType,
  practice_location?: string,
  languages?: LanguagesType[],
  fee_range?: [number, number],
  fee_type?: LawyerFeeType,
  rating?: number,
}

const FilterLawyerSchema = t.Object({
  gender: t.Optional(t.Enum(Object.fromEntries(GENDER_CONST.map(g => [g, g])))),
  experience: t.Optional(t.Number()),
  bar_state: t.Optional(t.String()),
  practice_area: t.Optional(t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(x => [x, x])))),
  practice_location: t.Optional(t.String()),
  languages: t.Optional(t.Array(t.Enum(Object.fromEntries(LANGUAGES_CONST.map(x => [x, x]))))),
  fee_range: t.Optional(t.Array(t.Number())),
  fee_type: t.Optional(t.Enum(Object.fromEntries(LAWYER_FEE_CONST.map(x => [x, x])))),
  rating: t.Optional(t.Number())
});

interface ConsumerProfileType {
  id: number,
  name?: string,
  gender?: GenderType,
  age?: number,
  employment_status?: EmploymentStatusType,
  marital_status?: MaritalStatusType,
  home_address?: string,
  current_location?: string,
  profile_picture?: string
}

const ConsumerProfileSchema = t.Object({
  name: t.Optional(t.String()),
  gender: t.Optional(t.Enum(Object.fromEntries(GENDER_CONST.map(g => [g, g])))),
  age: t.Optional(t.Number()),
  employment_status: t.Optional(t.Enum(Object.fromEntries(EMPLOYMENT_STATUS_CONST.map(x => [x, x])))),
  marital_status: t.Optional(t.Enum(Object.fromEntries(MARITAL_STATUS_CONST.map(x => [x, x])))),
  home_address: t.Optional(t.String()),
  current_location: t.Optional(t.String()),
  profile_picture: t.Optional(t.String())
})


export { FiltersType, FilterLawyerSchema, ConsumerProfileType, ConsumerProfileSchema, EMPLOYMENT_STATUS_CONST, EmploymentStatusType, MARITAL_STATUS_CONST, MaritalStatusType };
