import { Reveal } from '../ui/Reveal'

export default function About() {
  return (
    <section id="about" className="px-6 py-16 md:py-24">
      <Reveal className="card mx-auto max-w-6xl p-8 shadow-xl md:rounded-[3.5rem] md:p-16">
        <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold md:text-3xl">
          <span className="text-indigo-600 dark:text-indigo-400">#</span> About Me
        </h2>
        <div className="grid gap-8 text-base leading-relaxed text-slate-600 dark:text-slate-400 md:grid-cols-2 md:gap-12 md:text-lg">
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
    </section>
  )
}
