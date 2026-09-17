export interface Profile {
  name: string
  title: string
  bio: string
  quote?: string | null
  email: string
  phone?: string | null
  linkedin: string
  github?: string | null
  cvUrl?: string | null
  profileImage?: string | null
}

export interface Skill {
  id: string
  name: string
  category: 'Data Analysis' | 'Business Intelligence' | 'Other'
  description?: string
  image_url?: string
}

export interface Project {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  technologies: string[]
  githubUrl?: string | null
  liveUrl?: string | null
  category: string
  date?: string | null
  featured?: boolean
  image?: string | null
  keyFeatures?: string[]
}

export interface Certificate {
  id: string
  title: string
  organization: string
  issueDate?: string | null
  credentialUrl?: string | null
  image?: string | null
}

export interface Experience {
  id: string
  organization: string
  position: string
  startDate: string
  endDate?: string | null
  description: string[]
}

export interface Education {
  id: string
  institution: string
  degree: string
  startDate: string
  endDate?: string | null
  logoUrl?: string | null
}

export const profile: Profile = {
  name: '',
  title: 'Data Analyst',
  bio: '',
  quote: null,
  email: '',
  phone: null,
  linkedin: '',
  github: null,
  cvUrl: null,
  profileImage: null,
}

export const skills: Skill[] = []

export const projects: Project[] = []

export const certificates: Certificate[] = []

export const experience: Experience[] = []

export const education: Education[] = []