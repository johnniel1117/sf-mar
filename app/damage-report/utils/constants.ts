import { 
  Truck, Barcode, ClipboardList, Users, Download, Camera, Plus, X, 
  AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight, 
  ChevronLeft, Edit, Search, Star, Clock, Info, FileSpreadsheet, Eye 
} from 'lucide-react';
import { Step } from './types';

export const STEPS: Array<{
  number: Step;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    number: 1,
    title: "Truck Info",
    description: "Vehicle & shipment details",
    icon: Truck,
  },
  {
    number: 2,
    title: "Scan Items",
    description: "Add damaged items",
    icon: Barcode,
  },
  {
    number: 3,
    title: "Damage Details",
    description: "Describe damages",
    icon: ClipboardList,
  },
  {
    number: 4,
    title: "Review & Save",
    description: "Finalize report",
    icon: Users,
  },
];

export const DAMAGE_TYPES = [
  "Broken",
  "Cracked",
  "Scratched",
  "Dented",
  "Missing Part",
  "Water Damage",
  "Other",
];

export const ICONS = {
  Truck,
  Barcode,
  ClipboardList,
  Users,
  Download,
  Camera,
  Plus,
  X,
  AlertCircle,
  Save,
  FileText,
  CheckCircle2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Edit,
  Search,
  Star,
  Clock,
  Info,
  FileSpreadsheet,
  Eye,
} as const;

export const INITIAL_REPORT = {
  report_number: '',
  report_date: new Date().toISOString().split('T')[0],
  seal_no: '',
  driver_name: '',
  plate_no: '',
  container_no: '',
  prepared_by: '',
  noted_by: '',
  acknowledged_by: '',
  narrative_findings: '',
  actions_required: '',
  status: 'draft' as const,
  items: [],
};

export const INITIAL_PERSONNEL = {
  admins: [],
  guards: [],
  supervisors: []
};