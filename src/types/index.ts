// Common types for the SRH website

export interface NavItem {
  title: string;
  href: string;
  children?: NavItem[];
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  slug: string;
}

export interface JobPosting {
  id: string;
  title: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  publishedAt: string;
}

export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'other';
  url: string;
  category: string;
  publishedAt: string;
}

export interface ContactInfo {
  address: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface SiteContent {
  navigation: NavItem[];
  hero: {
    title: string;
    subtitle: string;
    description: string;
  };
  news: NewsItem[];
  jobs: JobPosting[];
  documents: Document[];
  contact: ContactInfo;
}