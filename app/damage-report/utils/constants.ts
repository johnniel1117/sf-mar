import { 
  Truck, Barcode, ClipboardList, Users, Download, Camera, Plus, X, 
  AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight, 
  ChevronLeft, Edit, Search, Star, Clock, Info, FileSpreadsheet, Eye 
} from 'lucide-react';

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

export const DAMAGE_TYPES = [
  "Broken",
  "Cracked",
  "Scratched",
  "Dented",
  "Missing Part",
  "Water Damage",
  "Other",
];

export const STEPS = [
  {
    number: 1,
    title: "Truck Info",
    description: "Vehicle & shipment details",
    icon: "Truck" as const,
  },
  {
    number: 2,
    title: "Scan Items",
    description: "Add damaged items",
    icon: "Barcode" as const,
  },
  {
    number: 3,
    title: "Damage Details",
    description: "Describe damages",
    icon: "ClipboardList" as const,
  },
  {
    number: 4,
    title: "Review & Save",
    description: "Finalize report",
    icon: "Users" as const,
  },
];