// Fixed homepage content taken from the current cro.mcu.edu.ph site. News,
// announcements, programs and learning materials come from /api/public.
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
