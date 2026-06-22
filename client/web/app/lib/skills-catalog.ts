/**
 * Curated catalog of skills offered as pickable suggestions during onboarding.
 * `studentProfile.skills` is a free-form string[], so users can also add their
 * own — this list just gives a wide, organized starting point.
 */
export interface SkillGroup {
  category: string
  skills: string[]
}

export const SKILL_CATALOG: SkillGroup[] = [
  {
    category: 'Software Development',
    skills: [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby',
      'Kotlin', 'Swift', 'HTML', 'CSS', 'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt',
      'Node.js', 'Express', 'Django', 'Flask', 'Laravel', 'Spring Boot', 'Ruby on Rails',
      'React Native', 'Flutter', 'iOS Development', 'Android Development', 'GraphQL', 'REST APIs',
      'SQL', 'PostgreSQL', 'MongoDB', 'Tailwind CSS', 'WordPress', 'Webflow', 'Shopify',
    ],
  },
  {
    category: 'DevOps & Cloud',
    skills: [
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Linux',
      'Terraform', 'Nginx', 'Serverless', 'Monitoring', 'System Administration',
    ],
  },
  {
    category: 'Design',
    skills: [
      'UI Design', 'UX Design', 'Product Design', 'Graphic Design', 'Web Design', 'Logo Design',
      'Brand Identity', 'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD', 'Sketch',
      'Wireframing', 'Prototyping', 'Design Systems', 'Typography', 'Illustration',
      'Motion Graphics', '3D Modeling', 'Blender',
    ],
  },
  {
    category: 'Writing & Content',
    skills: [
      'Copywriting', 'Content Writing', 'Blog Writing', 'Technical Writing', 'Creative Writing',
      'Editing', 'Proofreading', 'Ghostwriting', 'Scriptwriting', 'SEO Writing', 'Resume Writing',
      'Translation', 'Transcription', 'Storytelling',
    ],
  },
  {
    category: 'Marketing',
    skills: [
      'Digital Marketing', 'Social Media Management', 'SEO', 'SEM', 'Content Marketing',
      'Email Marketing', 'Marketing Strategy', 'Brand Strategy', 'Influencer Marketing',
      'Google Ads', 'Meta Ads', 'Paid Advertising', 'Marketing Analytics', 'Public Relations',
      'Community Management',
    ],
  },
  {
    category: 'Data & AI',
    skills: [
      'Data Analysis', 'Data Science', 'Machine Learning', 'Deep Learning', 'Data Visualization',
      'Excel', 'Power BI', 'Tableau', 'R', 'Statistics', 'SQL Analytics', 'AI Prompt Engineering',
      'Natural Language Processing', 'Computer Vision',
    ],
  },
  {
    category: 'Video & Audio',
    skills: [
      'Video Editing', 'Videography', 'After Effects', 'Premiere Pro', 'DaVinci Resolve',
      'Animation', 'Audio Editing', 'Podcast Production', 'Voice Over', 'Music Production',
      'Sound Design',
    ],
  },
  {
    category: 'Photography',
    skills: [
      'Photography', 'Photo Editing', 'Product Photography', 'Portrait Photography',
      'Event Photography', 'Adobe Lightroom', 'Retouching',
    ],
  },
  {
    category: 'Business & Admin',
    skills: [
      'Project Management', 'Product Management', 'Business Analysis', 'Consulting', 'Accounting',
      'Bookkeeping', 'Financial Analysis', 'Virtual Assistance', 'Customer Support', 'Sales',
      'Lead Generation', 'Data Entry', 'Operations', 'Human Resources', 'Market Research',
    ],
  },
]

/** Flat, de-duplicated list of every catalog skill. */
export const ALL_SKILLS: string[] = Array.from(
  new Set(SKILL_CATALOG.flatMap((g) => g.skills)),
)
