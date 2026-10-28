import { motion } from 'framer-motion'
import { TOOLS } from '../../lib/constants'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'

export default function Expertise() {
  return (
    <section id="expertise" className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Tools & Expertise" subtitle="The technologies I use to build data solutions." />
        <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 lg:grid-cols-8" gap={0.05}>
          {TOOLS.map((tool) => (
            <StaggerItem key={tool.name}>
              <motion.div
                whileHover={{ y: -8, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                className="card flex flex-col items-center rounded-2xl p-5 text-center hover:shadow-lg"
              >
                <i className={`${tool.icon} ${tool.color} mb-3 text-3xl`} />
                <h3 className="text-[10px] font-bold uppercase tracking-tighter">{tool.name}</h3>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
