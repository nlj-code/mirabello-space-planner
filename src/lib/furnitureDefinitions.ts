import { FurnitureDefinition } from '../types';

export const FURNITURE_LIBRARY: FurnitureDefinition[] = [
  // SEATING
  { id: 'armchair', name: 'Armchair', category: 'Seating', widthCm: 80, heightCm: 80, shape: 'rect' },
  { id: 'lounge-chair', name: 'Lounge Chair', category: 'Seating', widthCm: 90, heightCm: 90, shape: 'rect' },
  { id: 'sofa-2', name: '2-Seat Sofa', category: 'Seating', widthCm: 160, heightCm: 85, shape: 'rect' },
  { id: 'sofa-3', name: '3-Seat Sofa', category: 'Seating', widthCm: 220, heightCm: 85, shape: 'rect' },
  { id: 'sofa-l', name: 'L-Shape Sofa', category: 'Seating', widthCm: 270, heightCm: 270, shape: 'lshape' },
  { id: 'dining-chair', name: 'Dining Chair', category: 'Seating', widthCm: 45, heightCm: 50, shape: 'rect' },
  { id: 'bar-stool', name: 'Bar Stool', category: 'Seating', widthCm: 40, heightCm: 40, shape: 'circle' },
  { id: 'chaise', name: 'Chaise Longue', category: 'Seating', widthCm: 160, heightCm: 70, shape: 'rect' },
  { id: 'ottoman', name: 'Ottoman', category: 'Seating', widthCm: 80, heightCm: 80, shape: 'rect' },
  { id: 'bench', name: 'Bench', category: 'Seating', widthCm: 120, heightCm: 45, shape: 'rect' },
  { id: 'sofa-curved', name: 'Curved Sofa', category: 'Seating', widthCm: 250, heightCm: 130, shape: 'custom' },
  { id: 'sofa-curved-small', name: 'Curved Sofa Small', category: 'Seating', widthCm: 180, heightCm: 130, shape: 'custom' },
  { id: 'sofa-u', name: 'U-Shape Sofa', category: 'Seating', widthCm: 300, heightCm: 200, shape: 'custom' },
  { id: 'sofa-modular-4', name: '4-Piece Sectional', category: 'Seating', widthCm: 280, heightCm: 180, shape: 'custom' },
  { id: 'loveseat', name: 'Loveseat', category: 'Seating', widthCm: 130, heightCm: 75, shape: 'rect' },
  { id: 'daybed', name: 'Daybed', category: 'Seating', widthCm: 200, heightCm: 90, shape: 'rect' },
  { id: 'accent-chair', name: 'Accent Chair', category: 'Seating', widthCm: 70, heightCm: 75, shape: 'rect' },
  { id: 'office-chair', name: 'Office Chair', category: 'Seating', widthCm: 60, heightCm: 60, shape: 'circle' },
  { id: 'club-chair', name: 'Club Chair', category: 'Seating', widthCm: 85, heightCm: 80, shape: 'rect' },
  { id: 'recliner', name: 'Recliner', category: 'Seating', widthCm: 85, heightCm: 95, shape: 'rect' },
  { id: 'papasan', name: 'Papasan Chair', category: 'Seating', widthCm: 100, heightCm: 100, shape: 'circle' },
  { id: 'dining-chair-arm', name: 'Dining Chair w/ Arms', category: 'Seating', widthCm: 50, heightCm: 55, shape: 'rect' },

  // TABLES
  { id: 'coffee-round', name: 'Coffee Table Round', category: 'Tables', widthCm: 80, heightCm: 80, shape: 'circle' },
  { id: 'coffee-rect', name: 'Coffee Table Rect', category: 'Tables', widthCm: 120, heightCm: 60, shape: 'rect' },
  { id: 'side-table', name: 'Side Table', category: 'Tables', widthCm: 45, heightCm: 45, shape: 'rect' },
  { id: 'dining-4', name: 'Dining Table 4-Seat', category: 'Tables', widthCm: 120, heightCm: 80, shape: 'rect' },
  { id: 'dining-6', name: 'Dining Table 6-Seat', category: 'Tables', widthCm: 180, heightCm: 90, shape: 'rect' },
  { id: 'dining-8', name: 'Dining Table 8-Seat', category: 'Tables', widthCm: 240, heightCm: 100, shape: 'rect' },
  { id: 'dining-round-4', name: 'Round Dining 4-Seat', category: 'Tables', widthCm: 100, heightCm: 100, shape: 'circle' },
  { id: 'boardroom', name: 'Boardroom Table', category: 'Tables', widthCm: 400, heightCm: 120, shape: 'rect' },
  { id: 'console', name: 'Console Table', category: 'Tables', widthCm: 120, heightCm: 35, shape: 'rect' },
  { id: 'desk', name: 'Desk', category: 'Tables', widthCm: 140, heightCm: 70, shape: 'rect' },

  // BEDS
  { id: 'bed-single', name: 'Single Bed', category: 'Beds', widthCm: 90, heightCm: 200, shape: 'rect' },
  { id: 'bed-double', name: 'Double Bed', category: 'Beds', widthCm: 140, heightCm: 200, shape: 'rect' },
  { id: 'bed-queen', name: 'Queen Bed', category: 'Beds', widthCm: 160, heightCm: 200, shape: 'rect' },
  { id: 'bed-king', name: 'King Bed', category: 'Beds', widthCm: 180, heightCm: 200, shape: 'rect' },
  { id: 'bed-superking', name: 'Super King Bed', category: 'Beds', widthCm: 200, heightCm: 200, shape: 'rect' },

  // STORAGE & JOINERY
  { id: 'wardrobe-single', name: 'Wardrobe Single', category: 'Storage & Joinery', widthCm: 60, heightCm: 60, shape: 'rect' },
  { id: 'wardrobe-double', name: 'Wardrobe Double', category: 'Storage & Joinery', widthCm: 120, heightCm: 60, shape: 'rect' },
  { id: 'wardrobe-triple', name: 'Wardrobe Triple', category: 'Storage & Joinery', widthCm: 180, heightCm: 60, shape: 'rect' },
  { id: 'bookcase', name: 'Bookcase', category: 'Storage & Joinery', widthCm: 80, heightCm: 30, shape: 'rect' },
  { id: 'sideboard', name: 'Sideboard', category: 'Storage & Joinery', widthCm: 160, heightCm: 45, shape: 'rect' },
  { id: 'tv-unit', name: 'TV Unit', category: 'Storage & Joinery', widthCm: 180, heightCm: 45, shape: 'rect' },
  { id: 'kitchen-base', name: 'Kitchen Base Unit', category: 'Storage & Joinery', widthCm: 60, heightCm: 60, shape: 'rect' },
  { id: 'kitchen-wall', name: 'Kitchen Wall Unit', category: 'Storage & Joinery', widthCm: 60, heightCm: 35, shape: 'rect' },
  { id: 'vanity', name: 'Vanity Unit', category: 'Storage & Joinery', widthCm: 90, heightCm: 50, shape: 'rect' },
  { id: 'linen-cabinet', name: 'Linen Cabinet', category: 'Storage & Joinery', widthCm: 60, heightCm: 45, shape: 'rect' },

  // BATHROOM
  { id: 'bath-freestanding', name: 'Freestanding Bathtub', category: 'Bathroom', widthCm: 170, heightCm: 75, shape: 'rect' },
  { id: 'bath-builtin', name: 'Built-in Bathtub', category: 'Bathroom', widthCm: 170, heightCm: 75, shape: 'rect' },
  { id: 'shower', name: 'Shower Enclosure', category: 'Bathroom', widthCm: 90, heightCm: 90, shape: 'rect' },
  { id: 'wc', name: 'WC Toilet', category: 'Bathroom', widthCm: 40, heightCm: 65, shape: 'rect' },
  { id: 'bidet', name: 'Bidet', category: 'Bathroom', widthCm: 35, heightCm: 55, shape: 'rect' },
  { id: 'basin-single', name: 'Single Washbasin', category: 'Bathroom', widthCm: 60, heightCm: 50, shape: 'rect' },
  { id: 'basin-double', name: 'Double Washbasin', category: 'Bathroom', widthCm: 120, heightCm: 50, shape: 'rect' },

  // HOSPITALITY
  { id: 'reception-desk', name: 'Reception Desk', category: 'Hospitality', widthCm: 200, heightCm: 80, shape: 'rect' },
  { id: 'concierge', name: 'Concierge Podium', category: 'Hospitality', widthCm: 60, heightCm: 60, shape: 'rect' },
  { id: 'banquette', name: 'Banquette Seating', category: 'Hospitality', widthCm: 200, heightCm: 60, shape: 'rect' },
  { id: 'restaurant-booth', name: 'Restaurant Booth', category: 'Hospitality', widthCm: 120, heightCm: 80, shape: 'rect' },
  { id: 'bar-straight', name: 'Bar Counter Straight', category: 'Hospitality', widthCm: 300, heightCm: 60, shape: 'rect' },
  { id: 'bar-l', name: 'Bar Counter L-Shape', category: 'Hospitality', widthCm: 200, heightCm: 200, shape: 'lshape' },
  { id: 'majlis-seating', name: 'Majlis Seating', category: 'Hospitality', widthCm: 200, heightCm: 80, shape: 'rect' },
  { id: 'majlis-cushion', name: 'Majlis Floor Cushion', category: 'Hospitality', widthCm: 80, heightCm: 80, shape: 'rect' },
  { id: 'lobby-cluster', name: 'Lobby Seating Cluster', category: 'Hospitality', widthCm: 300, heightCm: 300, shape: 'rect', isGroup: true },
  { id: 'hotel-bed-set', name: 'Hotel Bed w/ Nightstands', category: 'Hospitality', widthCm: 280, heightCm: 220, shape: 'rect', isGroup: true },

  // PLANTS
  { id: 'plant-round', name: 'Round Pot Plant', category: 'Plants', widthCm: 50, heightCm: 50, shape: 'circle' },
  { id: 'plant-square', name: 'Square Pot Plant', category: 'Plants', widthCm: 50, heightCm: 50, shape: 'rect' },

  // GYM EQUIPMENT
  { id: 'treadmill', name: 'Treadmill', category: 'Gym Equipment', widthCm: 80, heightCm: 200, shape: 'rect' },
  { id: 'spin-bike', name: 'Spin Bike', category: 'Gym Equipment', widthCm: 55, heightCm: 120, shape: 'rect' },
  { id: 'rowing-machine', name: 'Rowing Machine', category: 'Gym Equipment', widthCm: 55, heightCm: 250, shape: 'rect' },
  { id: 'elliptical', name: 'Elliptical / Cross Trainer', category: 'Gym Equipment', widthCm: 70, heightCm: 180, shape: 'rect' },
  { id: 'cable-machine', name: 'Cable Machine', category: 'Gym Equipment', widthCm: 160, heightCm: 90, shape: 'rect' },
  { id: 'weight-bench', name: 'Weight Bench', category: 'Gym Equipment', widthCm: 65, heightCm: 130, shape: 'rect' },
  { id: 'power-rack', name: 'Power Rack', category: 'Gym Equipment', widthCm: 130, heightCm: 150, shape: 'rect' },
  { id: 'dumbbell-rack', name: 'Dumbbell Rack', category: 'Gym Equipment', widthCm: 120, heightCm: 50, shape: 'rect' },
  { id: 'smith-machine', name: 'Smith Machine', category: 'Gym Equipment', widthCm: 200, heightCm: 150, shape: 'rect' },
  { id: 'leg-press', name: 'Leg Press', category: 'Gym Equipment', widthCm: 120, heightCm: 180, shape: 'rect' },

  // RECREATIONAL EQUIPMENT
  { id: 'pool-table', name: 'Pool Table', category: 'Recreational', widthCm: 140, heightCm: 260, shape: 'rect' },
  { id: 'billiards-table', name: 'Billiards Table', category: 'Recreational', widthCm: 160, heightCm: 300, shape: 'rect' },
  { id: 'table-tennis', name: 'Table Tennis', category: 'Recreational', widthCm: 152, heightCm: 274, shape: 'rect' },
  { id: 'foosball', name: 'Foosball Table', category: 'Recreational', widthCm: 75, heightCm: 140, shape: 'rect' },
  { id: 'pinball-machine', name: 'Pinball Machine', category: 'Recreational', widthCm: 60, heightCm: 140, shape: 'rect' },

  // WELLNESS & SPA
  { id: 'sauna', name: 'Sauna Room', category: 'Wellness & Spa', widthCm: 200, heightCm: 200, shape: 'rect' },
  { id: 'steam-room', name: 'Steam Room', category: 'Wellness & Spa', widthCm: 200, heightCm: 200, shape: 'rect' },
  { id: 'hot-tub', name: 'Hot Tub / Jacuzzi', category: 'Wellness & Spa', widthCm: 220, heightCm: 220, shape: 'circle' },
  { id: 'massage-table', name: 'Massage Table', category: 'Wellness & Spa', widthCm: 75, heightCm: 190, shape: 'rect' },
  { id: 'barber-chair', name: 'Barber Chair', category: 'Wellness & Spa', widthCm: 65, heightCm: 70, shape: 'rect' },

  // ARCHITECTURAL ELEMENTS
  { id: 'wall', name: 'Wall', category: 'Architectural', widthCm: 20, heightCm: 200, shape: 'rect' },
  { id: 'door-single', name: 'Door Single', category: 'Architectural', widthCm: 90, heightCm: 90, shape: 'door' },
  { id: 'door-double', name: 'Door Double', category: 'Architectural', widthCm: 180, heightCm: 90, shape: 'door' },
  { id: 'sliding-door', name: 'Sliding Door', category: 'Architectural', widthCm: 90, heightCm: 15, shape: 'rect' },
  { id: 'window', name: 'Window', category: 'Architectural', widthCm: 120, heightCm: 15, shape: 'window' },
  { id: 'stair', name: 'Staircase Straight', category: 'Architectural', widthCm: 100, heightCm: 300, shape: 'stair' },
  { id: 'column-sq', name: 'Column Square', category: 'Architectural', widthCm: 30, heightCm: 30, shape: 'rect' },
  { id: 'column-round', name: 'Column Round', category: 'Architectural', widthCm: 30, heightCm: 30, shape: 'column-round' },
];

export const CATEGORIES = [...new Set(FURNITURE_LIBRARY.map(f => f.category))];

export const DEFAULT_COLORS: Record<string, string> = {
  Seating: '#7c9ab5',
  Tables: '#8fbc8f',
  Beds: '#d4a5a5',
  'Storage & Joinery': '#b8a87a',
  Bathroom: '#a5c8d4',
  Hospitality: '#c5a5d4',
  Plants: '#6b8f5e',
  'Gym Equipment': '#d48a5a',
  Recreational: '#5a9bd4',
  'Wellness & Spa': '#7ec8a5',
  Architectural: '#8a9bb0',
};

export function getDefaultColor(category: string): string {
  return DEFAULT_COLORS[category] || '#8a9bb0';
}
