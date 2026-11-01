// Not a secret: the real lock is the is_admin() check in the database (RLS).
export const ADMIN_EMAIL = 'ianearlbesanez@gmail.com'
export const STORAGE_BUCKET = 'portfolio'

// Each link is its own page (route).
export const NAV_LINKS = [
  { path: '/', label: 'Home', icon: 'fa-solid fa-house' },
  { path: '/about', label: 'About', icon: 'fa-solid fa-user' },
  { path: '/expertise', label: 'Expertise', icon: 'fa-solid fa-screwdriver-wrench' },
  { path: '/certifications', label: 'Certifications', icon: 'fa-solid fa-award' },
  { path: '/projects', label: 'Projects', icon: 'fa-solid fa-diagram-project' },
  { path: '/blog', label: 'Blog', icon: 'fa-solid fa-pen-nib' },
  { path: '/shop', label: 'Shop', icon: 'fa-solid fa-bag-shopping' },
  { path: '/experience', label: 'Experience', icon: 'fa-solid fa-briefcase' },
  { path: '/affiliation', label: 'Affiliation', icon: 'fa-solid fa-people-group' },
]

export const SITE_URL = 'https://dataportfolio.vercel.app'
export const DEFAULT_PORTRAIT = '/img/ian-portrait.webp'
// Start of BS Information Systems. Editable in Admin > Profile.
export const DEFAULT_LEARNING_SINCE = 2017

export const TYPED_STRINGS = [
  'SELECT insights FROM raw_data;',
  'building dashboards in Power BI',
  'automating the repetitive work',
  'turning data into decisions',
]

export const CORE_STACK = ['SQL', 'Power BI', 'Excel', 'PostgreSQL']

export const RESUME_FILENAME = 'IanEarlBesanez_Resume_withProjects.pdf'
export const RESUME_URL = `/pdf/${RESUME_FILENAME}`

export const CONTACT = { email: 'ianearlbesanez@gmail.com' }

export const GITHUB_URL = 'https://github.com/IanEarl123'
export const LINKEDIN_URL = 'https://www.linkedin.com/in/ian-earl-besa%C3%B1ez-6a1886288/'

export const SOCIALS = [
  { label: 'GitHub', href: GITHUB_URL, icon: 'fa-brands fa-github' },
  { label: 'LinkedIn', href: LINKEDIN_URL, icon: 'fa-brands fa-linkedin-in' },
  { label: 'Facebook', href: 'https://web.facebook.com/ianearl.besanez', icon: 'fa-brands fa-facebook-f' },
  { label: 'Instagram', href: 'https://www.instagram.com/silentchinitoprince/', icon: 'fa-brands fa-instagram' },
]

// Shown on the Expertise page until the skills table has rows.
export const FALLBACK_SKILLS = [
  { name: 'Power BI', icon: 'fa-solid fa-chart-column', color: '#F2C811' },
  { name: 'Excel', icon: 'fa-solid fa-file-excel', color: '#21A366' },
  { name: 'SQL', icon: 'fa-solid fa-database', color: '#00B4D8' },
  { name: 'PostgreSQL', icon: 'fa-solid fa-server', color: '#5B8DEF' },
  { name: 'Python', icon: 'fa-brands fa-python', color: '#4B9CD3' },
  { name: 'Power Query', icon: 'fa-solid fa-filter', color: '#F2C811' },
  { name: 'Apps Script', icon: 'fa-solid fa-gears', color: '#34A853' },
  { name: 'Power Automate', icon: 'fa-solid fa-bolt', color: '#2F96EF' },
  { name: 'VBA', icon: 'fa-solid fa-table-cells', color: '#21A366' },
  { name: 'JavaScript', icon: 'fa-brands fa-js', color: '#F7DF1E' },
  { name: 'HTML5', icon: 'fa-brands fa-html5', color: '#E34F26' },
  { name: 'Tailwind', icon: 'fa-solid fa-wind', color: '#06B6D4' },
]
