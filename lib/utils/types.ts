export interface DamageItem {
  item_number: number;
  barcode: string;
  material_code: string;
  material_description: string;
  damage_type: string;
  damage_description: string;
  photo_url?: string;
  mapping_id?: string | null;
}

export interface DamageReport {
  id?: string;
  report_number: string;
  report_date: string;
  seal_no: string;
  driver_name: string;
  plate_no: string;
  container_no: string;
  prepared_by: string;
  noted_by: string;
  acknowledged_by: string;
  narrative_findings: string;
  actions_required: string;
  status: 'draft' | 'submitted' | 'completed';
  items: DamageItem[];
  admin_id?: string;
  guard_id?: string;
  supervisor_id?: string;
}

export type Step = 1 | 2 | 3 | 4;

export interface PersonnelData {
  admins: Array<{ id: string; name: string }>;
  guards: Array<{ id: string; name: string }>;
  supervisors: Array<{ id: string; name: string }>;
}

export interface SelectedPersonnel {
  admin: string;
  guard: string;
  supervisor: string;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

export interface ConfirmModalState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface MaterialMapping {
  id: string;
  serial_number: string;
  material_description: string;
  category: string;
  last_used_at: string;
  usage_count?: number;
}