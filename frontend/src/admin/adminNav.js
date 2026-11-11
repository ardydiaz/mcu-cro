import {
  HiOutlineSquares2X2,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowsRightLeft,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2'
import { ALL_ROLES, ROLES } from '../constants/roles.js'

const { IT_ADMIN, CRO_ADMIN, COORDINATOR, COLLEGE } = ROLES

// Who works with beneficiary records (personal data). The IT Administrator has
// access to every page (system owner's decision).
const COMMUNITY = [IT_ADMIN, CRO_ADMIN, COORDINATOR, COLLEGE]

// Sidebar entries. `roles` decides who sees the link and who may open the page.
export const ADMIN_NAV = [
  {
    section: 'Overview',
    items: [{ path: 'dashboard', label: 'Dashboard', Icon: HiOutlineSquares2X2, roles: ALL_ROLES }],
  },
  {
    section: 'Community work',
    items: [
      { path: 'beneficiaries', label: 'Beneficiaries', Icon: HiOutlineUserGroup, roles: COMMUNITY },
      { path: 'service-records', label: 'Service Records', Icon: HiOutlineClipboardDocumentList, roles: COMMUNITY },
      { path: 'referrals', label: 'Referrals', Icon: HiOutlineArrowsRightLeft, roles: COMMUNITY },
      { path: 'reports', label: 'Reports', Icon: HiOutlineChartBar, roles: [IT_ADMIN, CRO_ADMIN] },
    ],
  },
  {
    section: 'Website',
    items: [{ path: 'cms', label: 'Content', Icon: HiOutlineDocumentText, roles: COMMUNITY }],
  },
  {
    section: 'Administration',
    items: [{ path: 'settings', label: 'Settings', Icon: HiOutlineCog6Tooth, roles: [IT_ADMIN] }],
  },
]

export const ADMIN_PAGES = ADMIN_NAV.flatMap((group) => group.items)
