const REQUIRED_CHURCH_FIELDS = [
  { key: "church_name", label: "name" },
  { key: "church_physical_city", label: "city" },
  //{ key: "church_mailing_address", label: "mailing address" },
  { key: "church_physical_state", label: "state" },
  { key: "church_physical_county", label: "county" },
  //{ key: "church_phone_number", label: "phone number" },
];

const isBlank = (value) => value === null || value === undefined || String(value).trim() === "";

export function getMissingChurchRequiredFields(church) {
  if (!church) {
    return REQUIRED_CHURCH_FIELDS.map((field) => field.label);
  }

  return REQUIRED_CHURCH_FIELDS
    .filter((field) => isBlank(church[field.key]))
    .map((field) => field.label);
}

export function hasInsufficientChurchInfo(church) {
  return getMissingChurchRequiredFields(church).length > 0;
}
