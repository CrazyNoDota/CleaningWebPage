export type Role = 'client' | 'cleaner' | 'operator' | 'manager' | 'admin';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string | null;
    email: string | null;
    name: string | null;
    role: Role;
    locale: string;
  };
}

export interface AdminCleanerListItem {
  id: string;
  userId: string;
  ratingAvg: number;
  ratingCount: number;
  yearsOfExperience: number;
  languages: string[];
  specialization: string[];
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  isActive: boolean;
  createdAt: string;
  user: { phone: string | null; name: string | null; email: string | null };
}

export interface AdminCleanerFull extends AdminCleanerListItem {
  bioRu: string;
  bioKk: string;
  bioEn: string;
  photoUrl: string | null;
  completedOrdersCount: number;
}

export interface CreateCleanerBody {
  phone: string;
  name: string;
  bioRu?: string;
  bioKk?: string;
  bioEn?: string;
  yearsOfExperience?: number;
  languages?: string[];
  specialization?: string[];
}

export interface UpdateCleanerBody {
  name?: string;
  bioRu?: string;
  bioKk?: string;
  bioEn?: string;
  yearsOfExperience?: number;
  languages?: string[];
  specialization?: string[];
  verificationStatus?: VerificationStatus;
  isActive?: boolean;
}

export type OrderStatus =
  | 'draft'
  | 'created'
  | 'paid'
  | 'assigned'
  | 'en_route'
  | 'in_progress'
  | 'done'
  | 'reviewed'
  | 'cancelled';

export interface AdminOrderListItem {
  id: string;
  status: OrderStatus;
  total: number;
  currency: string;
  scheduledAt: string | null;
  notes: string | null;
  createdAt: string;
  user: { name: string | null; phone: string | null } | null;
  service: { slug: string; nameRu: string };
  cleaner: { id: string; user: { name: string | null } } | null;
}

export interface AdminOrderEvent {
  id: string;
  type: string;
  payload: unknown;
  actorId: string | null;
  createdAt: string;
}

export interface AdminOrderFull {
  id: string;
  status: OrderStatus;
  total: number;
  currency: string;
  scheduledAt: string | null;
  notes: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  service: { slug: string; nameRu: string; basePrice: number; currency: string };
  address: {
    street: string;
    building: string;
    apartment: string | null;
    comment: string | null;
    city: { slug: string; name: string };
  } | null;
  cleaner: {
    id: string;
    photoUrl: string | null;
    user: { name: string | null; phone: string | null };
  } | null;
  events: AdminOrderEvent[];
  review: { id: string; rating: number; comment: string | null; status: string } | null;
}
