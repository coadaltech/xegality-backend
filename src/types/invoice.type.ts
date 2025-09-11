import { t, Static } from "elysia";
import { GENDER_CONST, GenderType, LANGUAGES_CONST, LanguagesType, LAWYER_FEE_CONST, LawyerFeeType, PAYMENT_STATUS_CONST, PRACTICE_AREAS_CONST, PracticeAreasType } from "./user.types";


const LawyerInvoiceSchema = t.Object({
  invoice_number: t.Optional(t.String()),
  client_id: t.Optional(t.Number()),
  client_name: t.Optional(t.String()),
  client_phone: t.Optional(t.String()),
  client_email: t.Optional(t.String()),
  case_reference: t.Optional(t.String()),
  description: t.Optional(t.String()),
  date_issued: t.Optional(t.String()),
  items: t.Optional(t.Array(t.Object({
    title: t.String(),
    quantity: t.Number(),
    price: t.Number()
  }))),
  total_amount: t.Optional(t.Number()),
  status: t.Optional(t.Enum(Object.fromEntries(PAYMENT_STATUS_CONST.map(x => [x, x])))),
  note: t.Optional(t.String())
})

// type Hello = Static<typeof LawyerProfileSchema>

export { LawyerInvoiceSchema };

