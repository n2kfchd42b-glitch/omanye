export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: string | number
  section?: string
}

export const NAV_ITEMS: NavItem[] = [
  // Core
  { label: 'Dashboard',      href: '/',                icon: 'LayoutDashboard', section: 'core' },
  { label: 'Projects',       href: '/projects',        icon: 'FolderOpen',      section: 'core', badge: 12 },
  { label: 'Beneficiaries',  href: '/beneficiaries',   icon: 'Users',           section: 'core', badge: 'New' },
  { label: 'Field Data',     href: '/field-data',      icon: 'ClipboardList',   section: 'core' },

  // Reporting
  { label: 'Impact Reports', href: '/reports',         icon: 'BarChart3',       section: 'reporting' },
  { label: 'Donors',         href: '/donors',          icon: 'HandHeart',       section: 'reporting' },
  { label: 'Grants',         href: '/grants',          icon: 'Landmark',        section: 'reporting' },

  // Admin
  { label: 'Team',           href: '/team',            icon: 'UserCog',         section: 'admin' },
  { label: 'Settings',       href: '/settings',        icon: 'Settings',        section: 'admin' },
]

export const NAV_SECTIONS = [
  { key: 'core',      label: 'Operations' },
  { key: 'reporting', label: 'Reporting' },
  { key: 'admin',     label: 'Admin' },
]
