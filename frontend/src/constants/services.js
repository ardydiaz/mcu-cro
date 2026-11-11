// Labels for service records and referrals. Values match
// backend/src/validators/serviceRecords.js and referrals.js.
export const SERVICE_TYPE_LABELS = {
  medical: 'Medical',
  dental: 'Dental',
  optical: 'Optical',
  physical_therapy: 'Physical therapy',
  nursing: 'Nursing',
  laboratory: 'Laboratory / screening',
  pharmacy: 'Pharmacy',
  health_education: 'Health education',
  other: 'Other',
}

// Usual responsible college per type of service, used to pre-fill the form.
export const DEFAULT_COLLEGE_FOR_SERVICE = {
  medical: 'COM',
  dental: 'COD',
  optical: 'COO',
  physical_therapy: 'CPT',
  nursing: 'CON',
  laboratory: 'CMT',
  pharmacy: 'CPH',
}

export const FOLLOW_UP_LABELS = {
  none: 'No follow-up',
  scheduled: 'Scheduled',
  completed: 'Completed',
  missed: 'Missed',
}

export const URGENCY_LABELS = { routine: 'Routine', urgent: 'Urgent', emergency: 'Emergency' }

export const REFERRAL_STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
