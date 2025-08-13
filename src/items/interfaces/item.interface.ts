export interface Item {
  id: string;
  name: string;
  description?: string;
  createdAt: number; // timestamp
  updatedAt?: number; // timestamp
}
