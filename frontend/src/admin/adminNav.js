import {
  HiOutlineSquares2X2,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowsRightLeft,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2'
import { ROLES } from '../constants/roles.js'

const ALL = [ROLES.ADMIN, ROLES.STAFF]

// Sidebar entries. `roles` decides who sees the link and who may open the page.
export const ADMIN_NAV = [
  {
    section: 'Overview',
    items: [{ path: 'dashboard', label: 'Dashboard', Icon: HiOutlineSquares2X2, roles: ALL }],
  },
  {
    section: 'Community work',
    items: [
      { path: 'beneficiaries', label: 'Beneficiaries', Icon: HiOutlineUserGroup, roles: ALL },
      { path: 'service-records', label: 'Service Records', Icon: HiOutlineClipboardDocumentList, roles: ALL },
      { path: 'referrals', label: 'Referrals', Icon: HiOutlineArrowsRightLeft, roles: ALL },
      { path: 'reports', label: 'Reports', Icon: HiOutlineChartBar, roles: ALL },
    ],
  },
  {
    section: 'Website',
    items: [{ path: 'cms', label: 'Content', Icon: HiOutlineDocumentText, roles: ALL }],
  },
  {
    section: 'Administration',
    items: [{ path: 'settings', label: 'Settings', Icon: HiOutlineCog6Tooth, roles: [ROLES.ADMIN] }],
  },
]

export const ADMIN_PAGES = ADMIN_NAV.flatMap((group) => group.items)
