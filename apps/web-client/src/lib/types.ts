export type Locale = 'ru' | 'kk' | 'en';

export type ServiceOption = {
  id: string;
  key: string;
  label: string;
  priceDelta: number;
  inputType: 'checkbox' | 'counter' | 'select';
};

export type Service = {
  id: string;
  slug: string;
  type: string;
  name: string;
  description: string;
  basePrice: number;
  currency: string;
  options: ServiceOption[];
};

export type Quote = {
  serviceSlug: string;
  currency: string;
  basePrice: number;
  options: { key: string; qty: number; lineTotal: number }[];
  total: number;
};

export type Address = {
  id: string;
  cityId: string;
  label: string | null;
  street: string;
  building: string;
  apartment: string | null;
  comment: string | null;
  lat: number | null;
  lng: number | null;
};

export type OrderStatus =
  | 'created'
  | 'paid'
  | 'assigned'
  | 'en_route'
  | 'in_progress'
  | 'done'
  | 'reviewed'
  | 'cancelled'
  | 'draft';

export type Order = {
  id: string;
  serviceId: string;
  addressId: string | null;
  cleanerId: string | null;
  status: OrderStatus;
  total: number;
  currency: string;
  scheduledAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type CleanerCard = {
  id: string;
  displayName: string;
  photoUrl: string | null;
  bio: string;
  yearsOfExperience: number;
  languages: string[];
  specialization: string[];
  ratingAvg: number;
  ratingCount: number;
  completedOrdersCount: number;
  verified: boolean;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string | null;
    email: string | null;
    name: string | null;
    role: string;
    locale: Locale;
  };
};
