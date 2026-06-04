export interface Swatch {
  bg: string;
  bd: string;
  dot: string;
}

// Muted, theme-harmonious palette — assigned to barbers by their position.
export const BARBER_PALETTE: Swatch[] = [
  { bg: 'rgba(122,151,110,0.18)', bd: 'rgba(122,151,110,0.9)', dot: '#6f8f5f' }, // sage
  { bg: 'rgba(86,130,178,0.18)', bd: 'rgba(86,130,178,0.9)', dot: '#5682b2' }, // blue
  { bg: 'rgba(192,118,82,0.18)', bd: 'rgba(192,118,82,0.9)', dot: '#c07652' }, // terracotta
  { bg: 'rgba(150,104,162,0.18)', bd: 'rgba(150,104,162,0.9)', dot: '#9668a2' }, // plum
  { bg: 'rgba(70,150,148,0.18)', bd: 'rgba(70,150,148,0.9)', dot: '#469694' }, // teal
  { bg: 'rgba(196,112,140,0.18)', bd: 'rgba(196,112,140,0.9)', dot: '#c4708c' }, // rose
  { bg: 'rgba(190,156,72,0.20)', bd: 'rgba(190,156,72,0.95)', dot: '#b6952f' }, // amber
  { bg: 'rgba(110,120,140,0.18)', bd: 'rgba(110,120,140,0.9)', dot: '#6e7889' } // slate
];

export const ANY_SWATCH: Swatch = {
  bg: 'rgba(120,116,108,0.13)',
  bd: 'rgba(120,116,108,0.6)',
  dot: '#8a857c'
};

export const STATUS_INFO: Record<string, { dot: string; label: string }> = {
  pending: { dot: '#d39a3f', label: 'Pending' },
  confirmed: { dot: '#4a8fc2', label: 'Confirmed' },
  completed: { dot: '#3a9d6b', label: 'Completed' },
  no_show: { dot: '#b06a6a', label: 'No-show' }
};
