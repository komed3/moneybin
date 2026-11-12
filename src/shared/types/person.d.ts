import type { PersonGender } from '@/src/shared/types/values';


export interface PersonRecord {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  gender: PersonGender;
  birthDate: string | null;
  street: string | null;
  addressExtra: string | null;
  postalCode: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  gender: PersonGender;
  birth_date: string | null;
  street: string | null;
  address_extra: string | null;
  postal_code: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonCreateData {
  name: string;
  description?: string | null;
  gender: PersonGender;
  birthDate?: string | null;
  street?: string | null;
  addressExtra?: string | null;
  postalCode?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
}

export type PersonUpdateData = Partial< PersonCreateData >;
