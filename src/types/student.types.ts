import { t } from 'elysia';
import { GENDER_CONST, GenderType, PRACTICE_AREAS_CONST, PracticeAreasType } from './user.types';

interface StudentProfileType {
  id: number,
  name?: string,
  gender?: GenderType,
  age?: number,
  home_address?: string,
  current_location?: string,
  law_school?: string,
  degree?: string,
  graduation_year?: number,
  cgpa?: number,
  area_of_interest?: PracticeAreasType[],
  linked_in_profile?: string,
  profile_picture?: string
}

const StudentProfileSchema = t.Object({
  name: t.Optional(t.String()),
  gender: t.Optional(t.Enum(Object.fromEntries(GENDER_CONST.map(g => [g, g])))),
  age: t.Optional(t.Number()),
  home_address: t.Optional(t.String()),
  current_location: t.Optional(t.String()),
  law_school: t.Optional(t.String()),
  degree: t.Optional(t.String()),
  graduation_year: t.Optional(t.Number()),
  cgpa: t.Optional(t.Number()),
  area_of_interest: t.Optional(t.Array(t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(x => [x, x]))))),
  linked_in_profile: t.Optional(t.String()),
  profile_picture: t.Optional(t.String())
})


export { StudentProfileType, StudentProfileSchema };

