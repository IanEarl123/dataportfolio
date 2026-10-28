import { motion } from 'framer-motion'
import { CONTACT, SOCIALS } from '../../lib/constants'
import { Stagger, StaggerItem } from '../ui/Reveal'

export default function Footer() {
  return (
    <footer id="contact" className="rounded-t-[3rem] bg-slate-950 py-20 text-white md:rounded-t-[4rem] md:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-3xl font-extrabold md:mb-12 md:text-5xl"
        >
          Connect With Me
        </motion.h2>

        <Stagger className="mx-auto mb-16 grid max-w-3xl gap-6 md:grid-cols-2">
          <StaggerItem>
            <motion.a
              whileHover={{ y: -6 }}
              href={`mailto:${CONTACT.email}`}
              className="group flex flex-col items-center rounded-4xl border border-white/10 bg-white/5 p-6 transition-colors duration-500 hover:bg-indigo-600 md:p-8"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl transition-transform group-hover:scale-110">
                <i className="fa-solid fa-envelope" />
              </div>
              <p className="mb-1 text-[10px] font-bold uppercase text-slate-400 group-hover:text-indigo-100 md:text-xs">Email Me</p>
              <p className="break-all text-sm font-bold md:text-lg">{CONTACT.email}</p>
            </motion.a>
          </StaggerItem>
          <StaggerItem>
            <motion.a
              whileHover={{ y: -6 }}
              href={`tel:${CONTACT.phone}`}
              className="group flex flex-col items-center rounded-4xl border border-white/10 bg-white/5 p-6 transition-colors duration-500 hover:bg-emerald-600 md:p-8"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl transition-transform group-hover:scale-110">
                <i className="fa-solid fa-phone" />
              </div>
              <p className="mb-1 text-[10px] font-bold uppercase text-slate-400 group-hover:text-emerald-100 md:text-xs">Call Me</p>
              <p className="text-sm font-bold md:text-lg">{CONTACT.phoneDisplay}</p>
            </motion.a>
          </StaggerItem>
        </Stagger>

        <div className="mb-8 flex justify-center gap-3">
          {SOCIALS.map((s) => (
            <motion.a
              key={s.label}
              whileHover={{ y: -4 }}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <i className={s.icon} />
            </motion.a>
          ))}
        </div>

        <p className="text-[10px] text-slate-500 sm:text-sm">
          © {new Date().getFullYear()} Ian Earl Besañez. Developed with Passion.
        </p>
      </div>
    </footer>
  )
}
