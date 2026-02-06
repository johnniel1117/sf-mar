export const DAMAGE_TYPES = [
  'Damage Box',
  'Broken Item',
  'Dent',
  'Crack',
  'Water Damage',
  'Missing Parts',
  'Other',
]

export type Step = 1 | 2 | 3 | 4

export const STEPS = [
  { number: 1, title: 'Truck Info', icon: 'Truck', description: 'Vehicle & shipment details' },
  { number: 2, title: 'Scan Items', icon: 'Barcode', description: 'Scan damaged items' },
  { number: 3, title: 'Details', icon: 'ClipboardList', description: 'Damage information' },
  { number: 4, title: 'Review', icon: 'Users', description: 'Finalize & save' },
] as const