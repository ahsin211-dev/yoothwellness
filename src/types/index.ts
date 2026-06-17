import type {
  User,
  Patient,
  LabResult,
  LabFile,
  Biomarker,
  TreatmentPlan,
  TreatmentItem,
  Order,
  OrderItem,
  ConsentForm,
  PatientDocument,
  Appointment,
  Message,
  ActivityLog,
  Recommendation,
  RecommendedProduct,
  Role,
  LabResultStatus,
  OrderStatus,
  TreatmentPlanStatus,
  ConsentStatus,
  MessageStatus,
  ActivityType,
  Gender,
} from "@prisma/client";

// Re-export Prisma enums for convenience
export type {
  Role,
  Gender,
  LabResultStatus,
  OrderStatus,
  TreatmentPlanStatus,
  ConsentStatus,
  MessageStatus,
  ActivityType,
};

// ─── Extended types with relations ───────────────────────────────────────────

export type PatientWithUser = Patient & {
  user: Pick<User, "id" | "name" | "email" | "phone" | "image" | "isActive" | "lastLoginAt" | "createdAt">;
};

export type LabResultWithFiles = LabResult & {
  files: LabFile[];
  biomarkers: Biomarker[];
};

export type TreatmentPlanWithItems = TreatmentPlan & {
  items: TreatmentItem[];
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type PatientProfile = Patient & {
  user: User;
  labResults: LabResult[];
  treatmentPlans: TreatmentPlan[];
  orders: Order[];
  consentForms: ConsentForm[];
  documents: PatientDocument[];
  appointments: Appointment[];
};

export type RecommendationWithProducts = Recommendation & {
  products: RecommendedProduct[];
};

export type MessageWithUsers = Message & {
  from: Pick<User, "id" | "name" | "email" | "image">;
  to: Pick<User, "id" | "name" | "email" | "image">;
  replies?: MessageWithUsers[];
};

// ─── API Response types ───────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Form types ───────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface PatientProfileFormData {
  name: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodType?: string;
  height?: number;
  weight?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  primaryPhysician?: string;
  insuranceProvider?: string;
  insuranceId?: string;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  notes?: string;
}

export interface LabResultFormData {
  patientId: string;
  labName: string;
  testName: string;
  collectedAt?: string;
  receivedAt?: string;
  notes?: string;
}

export interface OrderFormData {
  patientId: string;
  items: Array<{
    productName: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
}

export interface TreatmentPlanFormData {
  patientId: string;
  title: string;
  description?: string;
  goals?: string;
  startDate?: string;
  endDate?: string;
  items: Array<{
    category: string;
    name: string;
    description?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    sortOrder?: number;
  }>;
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalPatients: number;
  activePatients: number;
  pendingLabResults: number;
  pendingOrders: number;
  totalRevenue: number;
  recentActivity: ActivityLog[];
  newPatientsThisMonth: number;
}

export interface PatientDashboardData {
  patient: PatientWithUser;
  recentLabResults: LabResult[];
  activeTreatmentPlans: TreatmentPlan[];
  pendingOrders: Order[];
  pendingConsents: ConsentForm[];
  unreadMessages: number;
  upcomingAppointments: Appointment[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Session extension ────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}
