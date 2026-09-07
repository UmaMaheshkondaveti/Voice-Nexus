export interface PlanOption {
  name: string;
  price: number;
  speedMbps: number;
  description: string;
}

export const PLAN_CATALOG: PlanOption[] = [
  { name: 'Essentials 100', price: 39.99, speedMbps: 100, description: 'Entry broadband plan, no contract.' },
  { name: 'Home 300', price: 59.99, speedMbps: 300, description: 'Popular mid-tier plan for streaming households.' },
  { name: 'Home 500', price: 74.99, speedMbps: 500, description: 'Higher speed for multi-device homes.' },
  { name: 'Gig 1000', price: 89.99, speedMbps: 1000, description: 'Gigabit plan for heavy usage and gaming.' },
];

export function findPlanByName(name: string): PlanOption | undefined {
  const normalized = name.trim().toLowerCase();
  return PLAN_CATALOG.find((p) => p.name.toLowerCase() === normalized);
}
