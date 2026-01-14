export const PAYMENT_TYPE = {
  COMMISSION: ['commission', 'comission', 'comisión'],
  OVERRIDE: ['override']
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
} as const;

export const RECORD_STATUS = {
  ACTIVE: 'active'
} as const;

export const EXCLUDED_BOB_FIELDS = [
  'insured name',
  'insured',
  'asegurado',
  'customer',
  'nombre',
  'policy number',
  'status'
] as const;

export const MAX_BOB_FIELD_DISPLAY = 2;
export const TABLE_MAX_HEIGHT = 600;
export const ERROR_MESSAGES = {
  MISSING_FILES: 'Please select both Book of Business and Commission Report files.',
  PROCESS_FAILED: "Failed to process files. Ensure headers like 'Policy Number', 'Status', 'Net Payment', and 'Payment Type' exist."
} as const;
