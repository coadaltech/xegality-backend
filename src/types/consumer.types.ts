import { t } from 'elysia';
import { GENDER_CONST, LANGUAGES_CONST, LAWYER_FEE_CONST, PRACTICE_AREAS_CONST, PracticeAreasType, GenderType, LanguagesType, LawyerFeeType } from './user.types';

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

export { FiltersType, FilterLawyerSchema }
