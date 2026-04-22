export const CATEGORIES_DATA = [
  { id: 'books', name: 'Books', icon: 'menu-book', color: '#93c5fd', bgColor: '#1e3a5f' },
  { id: 'tech', name: 'Tech', icon: 'devices', color: '#d8b4fe', bgColor: '#4c1d95' },
  { id: 'lab', name: 'Lab Gear', icon: 'science', color: '#5eead4', bgColor: '#0f3d38' },
  { id: 'furniture', name: 'Furniture', icon: 'chair', color: '#fdba74', bgColor: '#431407' },
  { id: 'clothing', name: 'Clothing', icon: 'checkroom', color: '#f9a8d4', bgColor: '#500724' },
  { id: 'sports', name: 'Sports', icon: 'sports-soccer', color: '#86efac', bgColor: '#052e16' },
  { id: 'notes', name: 'Notes', icon: 'description', color: '#fde68a', bgColor: '#451a03' },
  { id: 'transport', name: 'Transport', icon: 'directions-bike', color: '#67e8f9', bgColor: '#083344' },
  { id: 'services', name: 'Services', icon: 'handyman', color: '#fca5a5', bgColor: '#450a0a' },
  { id: 'other', name: 'Other', icon: 'more-horiz', color: '#94a3b8', bgColor: '#1e293b' },
];

export const CATEGORY_NAMES = CATEGORIES_DATA.map(c => c.name).filter(n => n !== 'All');
