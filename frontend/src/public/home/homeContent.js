// Static homepage content taken from the current cro.mcu.edu.ph site.
// Replace with data from /api/public once the CMS is in place.
import { HiOutlineHeart, HiOutlineLightBulb, HiOutlineGlobeAsiaAustralia } from 'react-icons/hi2'
import { HiOutlineAcademicCap } from 'react-icons/hi'
import { PiPlant, PiFirstAidKit } from 'react-icons/pi'

export const HERO_SLIDES = [
  { src: '/images/slides/slide-1.jpg', alt: 'MCU volunteers and community members gathered at a covered court outreach event' },
  { src: '/images/slides/slide-2.jpg', alt: 'MCU nursing students with community partners at the university auditorium' },
  { src: '/images/slides/slide-3.jpg', alt: 'MCU community outreach activity' },
]

export const COMMITMENTS = [
  { Icon: HiOutlineHeart, title: 'Support', text: 'We support communities with moral, financial, and technological aid.' },
  { Icon: HiOutlineLightBulb, title: 'Empower', text: 'We empower Centralinos to contribute solutions to societal issues.' },
  {
    Icon: HiOutlineGlobeAsiaAustralia,
    title: 'Impact',
    text: 'We commit to use our resources to make a positive impact in communities.',
  },
]

const SDG_NAMES = {
  2: 'Zero Hunger',
  3: 'Good Health and Well-being',
  4: 'Quality Education',
  5: 'Gender Equality',
  8: 'Decent Work and Economic Growth',
  13: 'Climate Action',
  14: 'Life Below Water',
  15: 'Life on Land',
  17: 'Partnerships for the Goals',
}

const sdgs = (...goals) =>
  goals.map((n) => ({ n, name: SDG_NAMES[n], src: `/images/sdg/sdg-${n}.png` }))

export const PILLARS = [
  {
    key: 'education',
    Icon: HiOutlineAcademicCap,
    title: 'Education',
    items: ['Capacity Building', 'Literacy Education', 'Trainings and Seminars'],
    sdgs: sdgs(4, 5, 8),
  },
  {
    key: 'environment',
    Icon: PiPlant,
    title: 'Environment',
    items: ['Coastal Cleanup', 'Community Cleanup', 'Tree Planting'],
    sdgs: sdgs(13, 14, 15),
  },
  {
    key: 'health',
    Icon: PiFirstAidKit,
    title: 'Health & Wellness',
    items: ['Awareness Lectures', 'Consultation', 'Medical Missions'],
    sdgs: sdgs(2, 3, 17),
  },
]

// Newest first.
export const NEWS = [
  {
    slug: 'malusog-na-atay-masayang-buhay',
    title: 'MCU x Caloocan City Health Dept: Malusog na Atay, Masayang Buhay',
    date: '2026-04-08',
    image: '/images/news/malusog-na-atay.jpg',
    tag: 'Health & Wellness',
  },
  {
    slug: 'lifeline-2026-blood-donation',
    title: 'Lifeline 2026: A Blood Donation Initiative',
    date: '2026-04-08',
    image: '/images/news/lifeline-2026.jpg',
    tag: 'Health & Wellness',
  },
  {
    slug: 'pusong-masigla-ngiting-masaya',
    title: 'Pusong Masigla, Ngiting Masaya',
    date: '2026-04-08',
    image: '/images/news/pusong-masigla.jpg',
    tag: 'Outreach',
  },
  {
    slug: 'proud-moment-community-partnership',
    title: 'A proud moment for community partnership efforts!',
    date: '2026-04-08',
    image: '/images/news/oca-awards.jpg',
    tag: 'Recognition',
  },
  {
    slug: 'welcome-event-mcu-students',
    title: 'Welcome event for MCU students',
    date: '2025-08-15',
    image: '/images/news/welcome-event.jpg',
    tag: 'Events',
  },
  {
    slug: 'mcu-medical-mission',
    title: 'MCU Medical Mission',
    date: '2025-03-06',
    image: '/images/news/medical-mission.jpg',
    tag: 'Health & Wellness',
  },
  {
    slug: 'memorandum-signing',
    title: 'Memorandum Signing',
    date: '2025-03-04',
    image: '/images/news/memorandum-signing.jpg',
    tag: 'Partnerships',
  },
]
