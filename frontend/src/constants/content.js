// Labels for website content. Values match backend/src/validators/content.js.
export const RESOURCE_TYPE_LABELS = {
  video: 'Video',
  module: 'Learning module',
  pamphlet: 'Pamphlet',
  presentation: 'Presentation',
  health_info: 'Health information',
  other: 'Other material',
}

export const LANGUAGE_LABELS = { fil: 'Filipino', en: 'English', both: 'Filipino & English' }

export const POST_KIND_LABELS = { activity: 'Activity', announcement: 'Announcement' }

export const CONTENT_STATUS_LABELS = {
  draft: 'Draft',
  pending: 'For review',
  published: 'Published',
  rejected: 'Sent back',
}

export const INQUIRY_TOPIC_LABELS = {
  general: 'General question',
  partnership: 'Partnership or coordination (barangay, school, organization)',
  service_request: 'Request a service or outreach activity',
  learning_materials: 'Learning materials',
}

// Programs and Services page (requirements: Medical, Dental, Optical, Physical
// Therapy, Health Education, other college/department services).
export const SERVICE_AREAS = [
  {
    key: 'medical',
    title: 'Medical',
    colleges: ['COM', 'CON', 'CMT', 'CPH'],
    text: 'Consultations, health screening, blood pressure and blood sugar monitoring, and medicines during medical missions.',
  },
  {
    key: 'dental',
    title: 'Dental',
    colleges: ['COD'],
    text: 'Dental check-ups, cleaning, extractions and oral hygiene education for children and adults.',
  },
  {
    key: 'optical',
    title: 'Optical',
    colleges: ['COO'],
    text: 'Eye examinations, vision screening and reading glasses, with referral for further eye care.',
  },
  {
    key: 'physical_therapy',
    title: 'Physical Therapy',
    colleges: ['CPT'],
    text: 'Assessment and exercise programs for back and joint pain, stroke recovery and mobility.',
  },
  {
    key: 'health_education',
    title: 'Health Education',
    colleges: ['CON', 'CAS', 'IOE'],
    text: 'Seminars and learning sessions on nutrition, hygiene, disease prevention and healthy living.',
  },
  {
    key: 'other',
    title: 'Other college and department services',
    colleges: ['CAS', 'BED', 'IOE', 'SBM'],
    text: 'Literacy and education programs, livelihood and business training, and environmental activities.',
  },
]
