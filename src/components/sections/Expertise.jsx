import { motion } from 'framer-motion'
import { FALLBACK_SKILLS } from '../../lib/constants'
import { useCollection } from '../../hooks/useCollection'
import { usePageMeta } from '../../hooks/usePageMeta'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { SkeletonGrid } from '../ui/States'

export default function Expertise() {
  usePageMeta('Expertise', 'Tools and technologies: Power BI, Excel, SQL, PostgreSQL, Python, Power Query, Apps Script and more.')
  const { data, loading } = useCollection('skills')
  const skills = data.length ? data : FALLBACK_SKILLS

  return (
    <div className="page">
      <SectionHeading
        command="SELECT name FROM skills;"
        title="Tools & Expertise"
        subtitle="The technologies I use to build data solutions."
        manageTab="skills"
      />
      {loading ? (
        <SkeletonGrid count={8} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" itemClass="h-28" />
      ) : (
        <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" gap={0.04}>
          {skills.map((skill) => (
            <StaggerItem key={skill.id ?? skill.name}>
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }} className="card card-hover group flex h-full flex-col items-center gap-3 p-5 text-center">
                <span className="flex h-11 w-11 items-center justify-center">
                  {skill.logo_url ? (
                    <img src={skill.logo_url} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <i
                      className={`${skill.icon || 'fa-solid fa-code'} text-3xl transition-transform duration-300 group-hover:scale-110`}
                      style={{ color: skill.color || 'rgb(var(--accent-ink))' }}
                    />
                  )}
                </span>
                <h2 className="font-mono text-xs font-semibold text-ink2">{skill.name}</h2>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}
