export interface UserRecord {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRow {
  id: string;
  username: string;
  pw_hash: string;
  created_at: string;
  updated_at: string;
}
