// types/index.ts
export interface DeliveryPoint {
  id: string;
  name: string;
  type: string;
  address?: string;
  latitude: number;
  longitude: number;
}