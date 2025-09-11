const TAX_AND_COMPLIANCES_CONST = [
  "gst_registration",
  "income_tax_return_filing_for_llp",
  "gst_return_filing_online",
  "accounting_and_bookkeeping_services",
  "director_removal",
  "change_address",
  "shop_and_establishment_registration",
  "indirect_tax",
  "changes_to_llp_agreement",
  "accounting_and_bookkeeping_package",
  "secretarial_audit",
  "professional_tax_registration",
  "llp_annual_filings",
] as const;

const COMPANY_REGISTRATION_AND_SETUP_CONST = [
  "limited_liability_partnership_registration",
  "one_person_company_registration",
  "register_private_limited_company",
  "partnership_firm_registration",
  "producer_company_registration",
  "increase_authorized_capital",
  "convert_private_into_public_limited_company",
  "close_llp",
  "convert_partnership_into_llp",
  "company_fresh_start_scheme",
  "add_designated_partner",
] as const;

const LICENSES_AND_REGISTRATIONS_CONST = [
  "digital_signature_certificate_registration",
  "udyam_registration_online",
  "msme_registration",
  "iso_certification",
  "online_fssai_registration",
  "import_export_code_registration",
  "revocation_and_cancellation_of_gst",
  "ngo_registration_in_india",
  "appointment_of_director_in_company",
  "apeda_rcmc",
] as const;

const TRADEMARK_AND_INTELLECTUAL_PROPERTY_CONST = [
  "trademark_registration",
  "trademark_search",
  "trademark_renewal",
] as const;

const BUSINESS_CONTRACTS_CONST = [
  "collaboration_agreement",
  "royalty_agreement",
] as const;


const NGO_REGISTRATION_AND_COMPLIANCE_CONST = [
  "irdai_registration",
] as const;

const FUNDRAISING_CONST = [
  "due_diligence",
] as const;

const LEGAL_SERVICES_CONST = [
  ...TAX_AND_COMPLIANCES_CONST,
  ...COMPANY_REGISTRATION_AND_SETUP_CONST,
  ...LICENSES_AND_REGISTRATIONS_CONST,
  ...TRADEMARK_AND_INTELLECTUAL_PROPERTY_CONST,
  ...BUSINESS_CONTRACTS_CONST,
  ...NGO_REGISTRATION_AND_COMPLIANCE_CONST,
  ...FUNDRAISING_CONST,
] as const;

type LegalServiceType = (typeof LEGAL_SERVICES_CONST)[number];
type TaxAndComplianceType = (typeof TAX_AND_COMPLIANCES_CONST)[number];
type CompanyRegistrationAndSetupType = (typeof COMPANY_REGISTRATION_AND_SETUP_CONST)[number];
type LicensesAndRegistrationsType = (typeof LICENSES_AND_REGISTRATIONS_CONST)[number];
type TrademarkAndIntellectualPropertyType = (typeof TRADEMARK_AND_INTELLECTUAL_PROPERTY_CONST)[number];
type BusinessContractsType = (typeof BUSINESS_CONTRACTS_CONST)[number];
type NGORegistrationAndComplianceType = (typeof NGO_REGISTRATION_AND_COMPLIANCE_CONST)[number];
type FundraisingType = (typeof FUNDRAISING_CONST)[number];

export {
  LEGAL_SERVICES_CONST,
  TAX_AND_COMPLIANCES_CONST,
  COMPANY_REGISTRATION_AND_SETUP_CONST,
  LICENSES_AND_REGISTRATIONS_CONST,
  TRADEMARK_AND_INTELLECTUAL_PROPERTY_CONST,
  BUSINESS_CONTRACTS_CONST,
  NGO_REGISTRATION_AND_COMPLIANCE_CONST,
  FUNDRAISING_CONST
};

export type {
  LegalServiceType,
  TaxAndComplianceType,
  CompanyRegistrationAndSetupType,
  LicensesAndRegistrationsType,
  TrademarkAndIntellectualPropertyType,
  BusinessContractsType,
  NGORegistrationAndComplianceType,
  FundraisingType
};
