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

export const TYPED_STRINGS = ['Ian Earl Besañez', 'Data Analyst', 'Operations Analyst']

export const RESUME_FILENAME = 'IanEarlBesanez_Resume_withProjects.pdf'
export const RESUME_URL = `/pdf/${RESUME_FILENAME}`

export const CONTACT = {
  email: 'ianearlbesanez@gmail.com',
  phone: '+639635313583',
  phoneDisplay: '+63 963 531 3583',
}

export const SOCIALS = [
  { label: 'Facebook', href: 'https://web.facebook.com/ianearl.besanez', icon: 'fa-brands fa-facebook-f', hover: 'hover:text-blue-600' },
  { label: 'Instagram', href: 'https://www.instagram.com/silentchinitoprince/', icon: 'fa-brands fa-instagram', hover: 'hover:text-pink-600' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ian-earl-besa%C3%B1ez-6a1886288/', icon: 'fa-brands fa-linkedin-in', hover: 'hover:text-blue-500' },
  { label: 'GitHub', href: 'https://github.com/IanEarl123', icon: 'fa-brands fa-github', hover: 'hover:text-slate-900 dark:hover:text-white' },
]

export const TOOLS = [
  { name: 'Power BI', icon: 'fa-solid fa-chart-column', color: 'text-brand-pbi' },
  { name: 'Excel', icon: 'fa-solid fa-file-excel', color: 'text-brand-excel' },
  { name: 'SQL', icon: 'fa-solid fa-database', color: 'text-brand-sql' },
  { name: 'Python', icon: 'fa-brands fa-python', color: 'text-brand-python' },
  { name: 'JavaScript', icon: 'fa-brands fa-js', color: 'text-brand-js' },
  { name: 'HTML5', icon: 'fa-brands fa-html5', color: 'text-brand-html' },
  { name: 'Tailwind', icon: 'fa-solid fa-wind', color: 'text-brand-tailwind' },
  { name: 'Apps Script', icon: 'fa-solid fa-gears', color: 'text-slate-500' },
]
