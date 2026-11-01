import { Reveal, Stagger, StaggerItem } from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'
import { usePageMeta } from '../../hooks/usePageMeta'

const FOCUS = [
  { icon: 'fa-solid fa-chart-pie', title: 'Data visualization', text: 'Interactive Power BI dashboards and Excel models that show what needs attention.' },
  { icon: 'fa-solid fa-database', title: 'Data preparation', text: 'Cleaning, validating and standardizing messy field exports with SQL and Power Query.' },
  { icon: 'fa-solid fa-robot', title: 'Workflow automation', text: 'Apps Script, Power Automate, VBA and Python to take repetitive work off the team.' },
]

export default function About() {
  usePageMeta('About', 'About Ian Earl Besañez, a Data Analyst focused on dashboards, data preparation and workflow automation.')

  return (
    <div className="page">
      <SectionHeading command="cat about.md" title="About Me" subtitle="Data professional turning raw information into actionable insights." />

      <Reveal className="card p-6 md:p-10">
        <div className="grid gap-6 text-sm leading-relaxed text-ink2 md:grid-cols-2 md:gap-10 md:text-base">
          <p>
            I&apos;m Ian Earl, a data professional passionate about transforming raw information into actionable insights. I
            specialize in cleaning, organizing, and analyzing datasets to uncover meaningful patterns that support smarter
            decision-making. With strong attention to detail and a problem-solving mindset, I thrive on turning complex data
            into clear, impactful stories that drive business success.
          </p>
          <p>
            I also focus on improving efficiency in my work by automating about 30% of my routine tasks. This includes
            generating letters for merchandisers, setting up reminders, and managing renewal processes. By combining data
            expertise with workflow automation, I&apos;m able to deliver results that are both accurate and timely, while
            freeing up more time to focus on strategic analysis and innovation.
          </p>
        </div>
      </Reveal>

      <Stagger className="mt-5 grid gap-4 md:grid-cols-3">
        {FOCUS.map((f) => (
          <StaggerItem key={f.title} className="card card-hover p-5">
            <i className={`${f.icon} mb-3 text-accent-ink`} />
            <h2 className="mb-1 text-base font-semibold text-ink">{f.title}</h2>
            <p className="text-sm leading-relaxed text-ink2">{f.text}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}
