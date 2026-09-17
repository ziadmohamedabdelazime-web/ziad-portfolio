import type {
  Project,
  Certificate,
  Skill,
  Experience,
  Education,
  Profile,
} from './seed'

export function mapProjectRow(r: any): Project & { images?: string[] } {
  return {
    id: r.id,
    title: r.title,
    shortDescription: r.short_description,
    fullDescription: r.full_description,
    technologies: r.technologies ?? [],
    githubUrl: r.github_url,
    liveUrl: r.live_url,
    category: r.category,
    date: r.project_date,
    featured: r.featured,
    image: r.image_url,
    images: Array.isArray(r.images) && r.images.length > 0 
      ? r.images 
      : (r.image_url ? [r.image_url] : []),
    keyFeatures: r.key_features ?? [],
  }
}

export function mapCertificateRow(r: any): Certificate {
  return {
    id: r.id,
    title: r.title,
    organization: r.organization,
    issueDate: r.issue_date,
    credentialUrl: r.credential_url,
    image: r.image_url ?? r.image ?? '',
  }
}

export function mapSkillRow(r: any): Skill {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description ?? undefined,
    image_url: r.image_url ?? undefined,
  }
}

export function mapExperienceRow(r: any): Experience {
  return {
    id: r.id,
    organization: r.organization,
    position: r.position,
    startDate: r.start_date,
    endDate: r.end_date,
    description: r.description ?? [],
  }
}

export function mapEducationRow(r: any): Education {
  return {
    id: r.id,
    institution: r.institution,
    degree: r.degree,
    startDate: r.start_date ?? '',
    endDate: r.end_date,
    logoUrl: r.logo_url ?? null,
  }
}

export function mapProfileRow(r: any): Profile {
  const data = Array.isArray(r) ? r[0] : r;
  if (!data) return {} as Profile;

  return {
    name: data.name ?? data.full_name ?? '',
    title: data.title ?? data.job_title ?? '',
    bio: data.bio ?? data.about ?? '',
    quote: data.quote ?? null,
    email: data.email ?? '',
    phone: data.phone ?? '',
    linkedin: data.linkedin ?? '',
    github: data.github ?? '',
    cvUrl: data.cv_url ?? data.cvUrl ?? '',
    profileImage: data.profile_image ?? data.profile_image_url ?? data.profileImage ?? data.image_url ?? '',
  };
}