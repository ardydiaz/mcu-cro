import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube, FaLinkedinIn } from 'react-icons/fa6'

export const SITE = {
  name: 'Community Relations Office',
  university: 'Manila Central University',
  address: ['Manila Central University', 'EDSA, Caloocan City 1400'],
  phone: '(+63) 917 104 6520',
  phoneHref: 'tel:+639171046520',
  email: 'eao.mcu1904@gmail.com',
}

// Website sections from the CRO requirements (Project 1, Step 2). Contact is
// shown as the header's call-to-action button instead of a menu link.
export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/colleges', label: 'Colleges' },
  { to: '/programs-services', label: 'Programs & Services' },
  { to: '/learning-resources', label: 'Learning Resources' },
  { to: '/activities', label: 'Activities' },
  { to: '/partner-communities', label: 'Partners' },
]

export const CONTACT_LINK = { to: '/contact', label: 'Contact us' }

export const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com/MCU1904/', label: 'Facebook', handle: '@MCU1904', Icon: FaFacebookF },
  { href: 'https://www.instagram.com/mcu1904', label: 'Instagram', handle: '@mcu1904', Icon: FaInstagram },
  { href: 'https://www.tiktok.com/@mcu1904', label: 'TikTok', handle: '@mcu1904', Icon: FaTiktok },
  { href: 'https://www.x.com/MCU1904', label: 'X', handle: '@MCU1904', Icon: FaXTwitter },
  { href: 'https://www.youtube.com/@mcu1904', label: 'YouTube', handle: '@mcu1904', Icon: FaYoutube },
  { href: 'https://www.linkedin.com/school/mcu1904/', label: 'LinkedIn', handle: '@mcu1904', Icon: FaLinkedinIn },
]
