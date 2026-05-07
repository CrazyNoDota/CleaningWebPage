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
