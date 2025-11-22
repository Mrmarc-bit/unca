export enum EventStatus {
  UPCOMING = 'Mendatang',
  OPEN = 'Terbuka',
  CLOSED = 'Ditutup',
  DRAFT = 'Draft'
}

export enum EventType {
  SEMINAR = 'Seminar',
  WORKSHOP = 'Workshop',
  COMPETITION = 'Lomba',
  UKM = 'UKM',
  TECHNOLOGY = 'Teknologi',
  ART_CULTURE = 'Seni Budaya',
  AI = 'AI'
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: EventType;
  status: EventStatus;
  imageUrl: string;
  host: string;
  description: string;
  attendees: number;
  price: 'Gratis' | 'Berbayar';
  organization_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  description: string;
  members_count: number;
  rating: number;
  image_url: string;
  banner_url: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'organizer' | 'participant';
}

export interface StatMetric {
  label: string;
  value: string | number;
  trend?: number; // percentage
}