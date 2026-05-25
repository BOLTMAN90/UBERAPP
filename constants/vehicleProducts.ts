import type { RideCategory } from '@/types';

export interface VehicleProduct {
  id: string;
  name: string;
  /** FontAwesome icon name. */
  icon: string;
  /** Marketing description shown on the product row. */
  description: string;
  /** Multiplier applied on top of the category's base fare. 1.0 = no change. */
  fareModifier: number;
  /** Capacity override (defaults to category capacity if omitted). */
  capacity?: number;
  /** Additional ETA in minutes for this specific product. */
  etaBiasMinutes?: number;
  /** Optional accent tag, e.g. POPULAR / NEW. */
  tag?: string;
}

/**
 * Curated product list inside each ride category — like Uber tiers.
 * Riders drill in from the category selector to choose a specific vehicle.
 */
export const VEHICLE_PRODUCTS: Record<RideCategory, VehicleProduct[]> = {
  economy: [
    {
      id: 'economy-corolla',
      name: 'Toyota Corolla',
      icon: 'car',
      description: 'Reliable sedan, A/C, smooth ride',
      fareModifier: 1,
      capacity: 3,
      tag: 'POPULAR',
    },
    {
      id: 'economy-civic',
      name: 'Honda Civic',
      icon: 'car',
      description: 'Comfortable everyday compact',
      fareModifier: 1.02,
      capacity: 3,
    },
    {
      id: 'economy-rio',
      name: 'KIA Rio',
      icon: 'car',
      description: 'Compact and fuel efficient',
      fareModifier: 0.96,
      capacity: 3,
    },
  ],
  comfort: [
    {
      id: 'comfort-camry',
      name: 'Toyota Camry',
      icon: 'car',
      description: 'Spacious sedan, top-rated drivers',
      fareModifier: 1,
      capacity: 4,
      tag: 'POPULAR',
    },
    {
      id: 'comfort-accord',
      name: 'Honda Accord',
      icon: 'car',
      description: 'Premium feel, smooth handling',
      fareModifier: 1.04,
      capacity: 4,
    },
    {
      id: 'comfort-mazda6',
      name: 'Mazda 6',
      icon: 'car',
      description: 'Sporty and refined',
      fareModifier: 1.06,
      capacity: 4,
    },
  ],
  xl: [
    {
      id: 'xl-sienna',
      name: 'Toyota Sienna',
      icon: 'bus',
      description: '6-seater MPV with luggage space',
      fareModifier: 1,
      capacity: 6,
      tag: 'POPULAR',
    },
    {
      id: 'xl-pilot',
      name: 'Honda Pilot',
      icon: 'bus',
      description: 'SUV for groups, large boot',
      fareModifier: 1.05,
      capacity: 6,
    },
    {
      id: 'xl-explorer',
      name: 'Ford Explorer',
      icon: 'bus',
      description: 'Roomy 7-seater for big trips',
      fareModifier: 1.08,
      capacity: 7,
      etaBiasMinutes: 1,
    },
  ],
  premium: [
    {
      id: 'premium-eclass',
      name: 'Mercedes-Benz E-Class',
      icon: 'diamond',
      description: 'Executive sedan, top drivers',
      fareModifier: 1,
      capacity: 4,
      tag: 'POPULAR',
    },
    {
      id: 'premium-5series',
      name: 'BMW 5 Series',
      icon: 'diamond',
      description: 'Sporty luxury sedan',
      fareModifier: 1.05,
      capacity: 4,
    },
    {
      id: 'premium-a6',
      name: 'Audi A6',
      icon: 'diamond',
      description: 'Quattro comfort sedan',
      fareModifier: 1.05,
      capacity: 4,
    },
  ],
  vip: [
    {
      id: 'vip-sclass',
      name: 'Mercedes-Benz S-Class',
      icon: 'trophy',
      description: 'Chauffeur-style luxury',
      fareModifier: 1,
      capacity: 4,
      tag: 'POPULAR',
    },
    {
      id: 'vip-rangerover',
      name: 'Range Rover',
      icon: 'trophy',
      description: 'Luxury SUV experience',
      fareModifier: 1.1,
      capacity: 4,
    },
    {
      id: 'vip-ls',
      name: 'Lexus LS',
      icon: 'trophy',
      description: 'Silent, smooth, refined',
      fareModifier: 1.06,
      capacity: 4,
    },
  ],
  bike: [
    {
      id: 'bike-nmax',
      name: 'Yamaha NMAX',
      icon: 'motorcycle',
      description: 'Quick scooter, beats traffic',
      fareModifier: 1,
      capacity: 1,
      tag: 'POPULAR',
    },
    {
      id: 'bike-pcx',
      name: 'Honda PCX',
      icon: 'motorcycle',
      description: 'Comfortable scooter ride',
      fareModifier: 1.02,
      capacity: 1,
    },
    {
      id: 'bike-classic',
      name: 'Honda CB Classic',
      icon: 'motorcycle',
      description: 'Standard commuter bike',
      fareModifier: 0.95,
      capacity: 1,
    },
  ],
  female: [
    {
      id: 'female-yaris',
      name: 'Toyota Yaris (Women+)',
      icon: 'female',
      description: 'Female driver, women & children',
      fareModifier: 1,
      capacity: 3,
      tag: 'POPULAR',
    },
    {
      id: 'female-rio',
      name: 'KIA Rio (Women+)',
      icon: 'female',
      description: 'Comfortable, female driver',
      fareModifier: 0.98,
      capacity: 3,
    },
  ],
  electric: [
    {
      id: 'electric-tesla3',
      name: 'Tesla Model 3',
      icon: 'leaf',
      description: 'Silent, fast, zero emission',
      fareModifier: 1.05,
      capacity: 4,
      tag: 'POPULAR',
    },
    {
      id: 'electric-bydatto',
      name: 'BYD Atto 3',
      icon: 'leaf',
      description: 'Comfortable electric SUV',
      fareModifier: 1,
      capacity: 4,
    },
    {
      id: 'electric-leaf',
      name: 'Nissan Leaf',
      icon: 'leaf',
      description: 'Reliable city EV',
      fareModifier: 0.97,
      capacity: 4,
    },
  ],
};

export function getVehicleProducts(category: RideCategory): VehicleProduct[] {
  return VEHICLE_PRODUCTS[category] ?? [];
}

export function getVehicleProductById(id: string): VehicleProduct | undefined {
  for (const list of Object.values(VEHICLE_PRODUCTS)) {
    const product = list.find((p) => p.id === id);
    if (product) return product;
  }
  return undefined;
}
