import { t } from "elysia";
import { LANGUAGES_CONST, LAWYER_FEE_CONST, PRACTICE_AREAS_CONST } from "../user.types";

const FIRM_TYPE_CONST = ["sole", "partnership", "llp", "llc", "professional_corporation"] as const;
type FirmType = typeof FIRM_TYPE_CONST[number];

// make everything optional
const LawyerFirmSchema = t.Object({
  name: t.Optional(t.String()),
  firm_type: t.Optional(t.Enum(Object.fromEntries(FIRM_TYPE_CONST.map(x => [x, x])))),
  established_year: t.Optional(t.Number()),
  number_of_lawyers: t.Optional(t.Number()),
  specialties: t.Optional(t.Array(t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(x => [x, x]))))),
  office_address: t.Optional(t.String()),
  languages_supported: t.Optional(t.Array(t.Enum(Object.fromEntries(LANGUAGES_CONST.map(x => [x, x]))))),
  average_fee: t.Optional(t.Number()),
  fee_type: t.Optional(t.Enum(Object.fromEntries(LAWYER_FEE_CONST.map(x => [x, x])))),
  bio: t.Optional(t.String()),
  website_url: t.Optional(t.String()),
  contact_email: t.Optional(t.String()),
  contact_phone: t.Optional(t.Number()),
  profile_picture: t.Optional(t.String())
});

export { FIRM_TYPE_CONST, LawyerFirmSchema };
export type { FirmType };
