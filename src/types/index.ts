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
  image?: string;
  pdf?: string;
  category: 'Publication' | 'Communiqué' | 'Newsletter' | 'Journal Officiel' | 'Rapport';
  contentType?: 'publication' | 'communique' | 'jo' | 'rapport';
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

export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  infopro?: string;
  isadmin: boolean;
  newsletter: boolean;
  hospital?: string;
  address?: string;
  subscription?: string;
  avatar?: string;
  membershipNumber?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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