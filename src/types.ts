export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'FOREMAN' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  active: boolean;
  assignedSites: string[]; // Site IDs
  avatar?: string;
  password?: string; // PIN or Password for authentication
  isLocked?: boolean; // Set to true when account PIN is locked
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  active: boolean;
}

export interface CleaningSite {
  id: string;
  name: string;
  address: string;
  supervisor: string;
  contact: string;
  active: boolean;
}

export type UnitType = 'Packet' | 'Box' | 'Bottle' | 'Can' | 'Canister' | 'Roll' | 'Piece' | 'Kg' | 'Litre';

export interface Product {
  id: string;
  code: string; // e.g. STK-000001
  name: string;
  categoryId: string;
  brand: string;
  description: string;
  unit: UnitType;
  packageSize: string;
  currentStock: number;
  minStock: number; // Reorder Level
  targetStock: number;
  maxStock: number;
  supplierId: string;
  supplierProductCode: string;
  purchasePrice: number;
  storageLocation: string;
  qrCode: string; // e.g. STK-000001
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGED' | 'EXPIRED' | 'LOST' | 'RETURN';

export interface StockTransaction {
  id: string;
  transactionId: string; // e.g. TXN-2026-0810-001
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  productId: string;
  productCode: string;
  productName: string;
  type: TransactionType;
  quantity: number;
  employeeId?: string;
  employeeName?: string;
  siteId?: string;
  siteName?: string;
  supplierId?: string;
  supplierName?: string;
  reason?: string;
  notes?: string;
  createdByUserId: string;
  createdByName: string;
  unitPrice?: number;
  totalValue?: number;
}

export type POStatus = 'Pending Approval' | 'Approved' | 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  targetStock: number;
  suggestedQuantity: number;
  orderedQuantity: number;
  unitPrice: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-001
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDeliveryDate?: string;
  status: POStatus;
  items: PurchaseOrderItem[];
  estimatedCost: number;
  notes?: string;
  requestedByUserId?: string;
  requestedByUserName?: string;
  requestedByUserRole?: UserRole;
  approvedByUserId?: string;
  approvedByUserName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForemanReportCustomItem {
  id: string;
  productName: string;
  supplierProductCode: string;
  quantity: number;
  unit?: string;
  addedByUserName: string;
  createdAt: string;
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProductRequest {
  id: string;
  productName: string;
  category?: string;
  brand?: string;
  suggestedSupplier?: string;
  siteId?: string;
  siteName?: string;
  estimatedQuantity: number;
  unit: string;
  reason: string;
  urgency: 'NORMAL' | 'HIGH' | 'URGENT';
  requestedByUserId: string;
  requestedByUserName: string;
  requestedByUserRole: UserRole;
  createdAt: string;
  status: RequestStatus;
  adminNotes?: string;
  convertedProductId?: string;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
}

export type NotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'LARGE_ISSUE'
  | 'ADJUSTMENT'
  | 'RECEIPT'
  | 'UNUSUAL_USAGE'
  | 'PRODUCT_REQUEST'
  | 'SYSTEM_ALERT'
  | 'DEEP_CLEANING';

export interface AppNotification {
  id: string;
  date: string;
  time: string;
  type: NotificationType;
  productId?: string;
  productName?: string;
  message: string;
  read: boolean;
  severity: 'info' | 'warning' | 'error' | 'success';
  isPriority?: boolean;
  relatedTaskId?: string;
  relatedTab?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  objectType: 'Product' | 'Transaction' | 'User' | 'Site' | 'Supplier' | 'PurchaseOrder' | 'Settings' | 'DeepCleaningTask';
  objectId: string;
  objectName: string;
  previousValue?: string;
  newValue?: string;
}

export interface CompanySettings {
  companyName: string;
  companyLogo?: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  defaultNotificationEmail: string;
  defaultSupplierId: string;
  stockLocation: string;
  allowNegativeStock: boolean;
  expectedDeliveryDays: number;
  enableLowStockAlerts: boolean;
  enableOutOfStockAlerts: boolean;
  enableLargeQuantityAlerts: boolean;
  largeQuantityThreshold: number;
}

export type StockStatus = 'NORMAL' | 'LOW' | 'REORDER_REQUIRED' | 'OUT_OF_STOCK';

export type DeepCleaningTaskType =
  | 'GENERAL_FURNITURE_REMOVAL'
  | 'CONFERENCE_ROOM_FURNITURE_REMOVAL'
  | 'REPEAT_TASK'
  | 'DEEP_CLEANING';

export type DeepCleaningTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type DeepCleaningTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export type RepeatFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';

export interface DeepCleaningTeam {
  id: string;
  name: string;
  leader?: string;
  members: string[];
  notes?: string;
  createdAt?: string;
}

export interface DeepCleaningTask {
  id: string;
  taskCode: string;
  title: string;
  taskType: DeepCleaningTaskType;
  location: string;
  siteId?: string;
  siteName?: string;
  clientName: string;
  whenDate: string; // Scheduled date e.g. YYYY-MM-DD
  startTime: string; // e.g. "08:00"
  deadlineDate: string; // e.g. YYYY-MM-DD
  deadlineTime: string; // e.g. "17:00"
  repeatFrequency: RepeatFrequency;
  description: string;
  assignedMembers: string[]; // List of member names from Deep Cleaning team
  assignedTeamId?: string;
  assignedTeamName?: string;
  priority: DeepCleaningTaskPriority;
  status: DeepCleaningTaskStatus;
  specialToolsEquipment?: string[];
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  completedByUserId?: string;
  completedByUserName?: string;
  completionNotes?: string;
}

// Strictly configured Deep Cleaning Team Members default seed
export const DEEP_CLEANING_TEAM_MEMBERS: string[] = [
  'Pasi Ylitalo',
  'Dayan',
  'Eranga',
  'Pubudu',
  'Ujitha',
  'Szabina',
  'Subashana',
  'Koshitha',
  'Ashen',
  'Yugan',
];

// Members authorized by name to add / create new Deep Cleaning tasks in addition to roles
export const DEEP_CLEANING_TASK_CREATORS: string[] = [
  'Dayan',
  'Eranga',
  'Pubudu',
  'Ashen',
];

// Check if user is in Deep Cleaning team or has supervisory oversight (Foreman, Supervisor, Admin)
export function isUserInDeepCleaningTeam(user?: User | null, customRoster?: string[]): boolean {
  if (!user || !user.name) return false;
  // Foreman, Supervisors, and Admin always have access to Deep Cleaning
  if (user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'FOREMAN') {
    return true;
  }
  const roster = customRoster && customRoster.length > 0 ? customRoster : DEEP_CLEANING_TEAM_MEMBERS;
  const trimmedLower = user.name.trim().toLowerCase();
  return roster.some(
    (name) => name.toLowerCase() === trimmedLower || trimmedLower.includes(name.toLowerCase())
  );
}

// Check if user is authorized to create/add tasks (Foreman, Supervisors, Admin + designated creators)
export function canUserAddDeepCleaningTask(user?: User | null): boolean {
  if (!user || !user.name) return false;
  if (user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'FOREMAN') {
    return true;
  }
  const trimmedLower = user.name.trim().toLowerCase();
  return DEEP_CLEANING_TASK_CREATORS.some(
    (name) => name.toLowerCase() === trimmedLower || trimmedLower.includes(name.toLowerCase())
  );
}

// Check if user can add / manage deep cleaning teams and roster (Foreman, Supervisors, Admin)
export function canUserManageDeepCleaningTeam(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'FOREMAN';
}
