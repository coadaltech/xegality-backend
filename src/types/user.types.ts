const ROLE_CONST = ["consumer", "lawyer", "student", "paralegal", "ca", "admin"] as const;
const GENDER_CONST = ["male", "female"] as const;
const MARITAL_STATUS_CONST = ["single", "married", "divorced", "widowed", "separated"] as const;

const LAWYER_FEE_CONST = [
  "fixed",
  "hourly",
  "per_consultation",
  "contingency",
  "pro_bono",
  "sliding_scale",
  "depends_on_case"
] as const;

const LANGUAGES_CONST = [
  "english",
  "assamese",
  "bengali",
  "bodo",
  "dogri",
  "gujarati",
  "hindi",
  "kannada",
  "kashmiri",
  "konkani",
  "maithili",
  "malayalam",
  "manipuri",
  "marathi",
  "nepali",
  "odia",
  "punjabi",
  "sanskrit",
  "santali",
  "sindhi",
  "tamil",
  "telugu",
  "urdu",
  "tulu",
  "bhojpuri",
  "rajasthani",
  "haryanvi",
  "chhattisgarhi",
  "mizo",
  "khasi",
  "nagamese",
  "mundari",
  "gondi"
] as const

const PRACTICE_AREAS_CONST = [
  "corporate",
  "criminal",
  "family",
  "constitutional",
  "civil",
  "intellectual_property",
  "taxation",
  "labor",
  "environmental",
  "cyber",
  "international",
  "banking",
  "media",
  "real_estate",
  "human_rights",
  "arbitration",
  "immigration",
  "startup",
  "litigation",
  "contract"
] as const;


type RoleType = typeof ROLE_CONST[number];
type GenderType = typeof GENDER_CONST[number];
type MaritalStatusType = typeof MARITAL_STATUS_CONST[number];
type LanguagesType = typeof LANGUAGES_CONST[number];
type LawyerFeeType = typeof LAWYER_FEE_CONST[number];
type PracticeAreasType = typeof PRACTICE_AREAS_CONST[number];

export { ROLE_CONST, RoleType, GENDER_CONST, GenderType, MARITAL_STATUS_CONST, MaritalStatusType, LAWYER_FEE_CONST, LawyerFeeType, LANGUAGES_CONST, LanguagesType, PRACTICE_AREAS_CONST, PracticeAreasType };
