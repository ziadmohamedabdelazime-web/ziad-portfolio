import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProjectCard from './ProjectCard'
import type { Project } from '../data/seed'

interface ProjectsGridProps {
  projects: Project[]
}

export default function ProjectsGrid({ projects }: ProjectsGridProps) {
  const [showAll, setShowAll] = useState(false)

  // عرض أول 6 مشاريع فقط إلا إذا تم الضغط على See More
  const visibleProjects = showAll ? projects : projects.slice(0, 6)
  const hasMore = projects.length > 6

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  }

  return (
    <div className="w-full space-y-10">
      {/* Container flex-wrap with justify-center centered behavior */}
      <motion.div
        className="flex flex-wrap justify-center gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {visibleProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={cardVariants}
              layout
              className="w-full max-w-[360px] shrink-0"
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* See More / See Less Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="secondary-button text-sm font-medium transition-transform duration-200 hover:scale-105"
          >
            {showAll ? 'See Less' : `See More (${projects.length - 6} more)`}
          </button>
        </div>
      )}
    </div>
  )
}