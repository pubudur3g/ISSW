import { saveToFirestore, deleteFromFirestore } from './firestoreSync';
import {
  User,
  UserRole,
  Category,
  Supplier,
  CleaningSite,
  Product,
  StockTransaction,
  PurchaseOrder,
  AppNotification,
  AuditLog,
  ProductRequest,
  CompanySettings,
  StockStatus,
  TransactionType,
  ForemanReportCustomItem,
  DeepCleaningTask,
  DeepCleaningTaskStatus,
  DeepCleaningTaskType,
  DeepCleaningTeam,
  DEEP_CLEANING_TEAM_MEMBERS,
  isUserInDeepCleaningTeam,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'cleanstock_users',
  CURRENT_USER: 'cleanstock_current_user',
  CATEGORIES: 'cleanstock_categories',
  SUPPLIERS: 'cleanstock_suppliers',
  SITES: 'cleanstock_sites',
  PRODUCTS: 'cleanstock_products',
  TRANSACTIONS: 'cleanstock_transactions',
  PURCHASE_ORDERS: 'cleanstock_purchase_orders',
  NOTIFICATIONS: 'cleanstock_notifications',
  AUDIT_LOGS: 'cleanstock_audit_logs',
  SETTINGS: 'cleanstock_settings',
  PRODUCT_REQUESTS: 'cleanstock_product_requests',
  FOREMAN_CUSTOM_ITEMS: 'cleanstock_foreman_custom_items',
  DEEP_CLEANING_TASKS: 'cleanstock_deep_cleaning_tasks',
  DEEP_CLEANING_TEAMS: 'cleanstock_deep_cleaning_teams',
  DEEP_CLEANING_TEAM_MEMBERS: 'cleanstock_deep_cleaning_team_members',
};

// Initial Seed Data
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Paper Products', description: 'Hand towels, tissues, toilet paper boxes' },
  { id: 'cat-2', name: 'Garbage Bags', description: 'Heavy duty, medium, and large capacity bags' },
  { id: 'cat-3', name: 'Gloves', description: 'Nitrile, latex, and heavy-duty rubber gloves' },
  { id: 'cat-4', name: 'Chemicals', description: 'Washroom, floor, hand, and general surface cleaners' },
  { id: 'cat-5', name: 'KW Products', description: 'KW specialized professional cleaning range' },
];

export const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'KW Professional Supplies', contactPerson: 'Markus Lindholm', email: 'orders@kwsupplies.com', phone: '+358 40 123 4567', address: 'Teollisuuskatu 12, Helsinki', notes: 'Primary supplier for KW line', active: true },
  { id: 'sup-2', name: 'PaperFlex Products', contactPerson: 'Anna Berg', email: 'sales@paperflex.fi', phone: '+358 50 987 6543', address: 'Varastotie 8, Espoo', notes: 'Paper products bulk supplier', active: true },
  { id: 'sup-3', name: 'EcoClean Chemicals Ltd', contactPerson: 'David Miller', email: 'info@ecoclean.com', phone: '+358 45 333 2211', address: 'Kemikaalitie 4, Vantaa', notes: 'Certified eco-friendly formulas', active: true },
  { id: 'sup-4', name: 'Safepack Solutions', contactPerson: 'Sari Koskinen', email: 'sari@safepack.fi', phone: '+358 40 555 7788', address: 'Pakkauskuja 2, Kerava', notes: 'Gloves and safety gear', active: true },
];

export const DEFAULT_SITES: CleaningSite[] = [
  { id: 'site-1', name: 'Site A (HQ Main Tower)', address: 'Mannerheimintie 10, Helsinki', supervisor: 'Marcus Vance', contact: '+358 40 111 2233', active: true },
  { id: 'site-2', name: 'Site B (Westside Medical)', address: 'Laajalahdentie 15, Espoo', supervisor: 'Marcus Vance', contact: '+358 40 222 3344', active: true },
  { id: 'site-3', name: 'Office Building A (Tech Hub)', address: 'Innopoli 2, Espoo', supervisor: 'Marcus Vance', contact: '+358 40 333 4455', active: true },
  { id: 'site-4', name: 'Shopping Centre (Grand Galleria)', address: 'Aleksanterinkatu 50, Helsinki', supervisor: 'Marcus Vance', contact: '+358 40 444 5566', active: true },
  { id: 'site-5', name: 'School (St. Jude Academy)', address: 'Koulutie 1, Vantaa', supervisor: 'Marcus Vance', contact: '+358 40 555 6677', active: true },
  { id: 'site-6', name: 'Hotel (Grand Horizon Hotel)', address: 'Satamakatu 3, Helsinki', supervisor: 'Marcus Vance', contact: '+358 40 666 7788', active: true },
];

const REQUIRED_EMPLOYEE_NAMES = [
  'Ashen',
  'Chamodi',
  'Chathuri',
  'Chinedum',
  'Dayan',
  'Dinusha',
  'Dominique',
  'Eranga',
  'Hanz',
  'Ian',
  'John',
  'Koshitha',
  'Madushika',
  'Marissa',
  'Michelle',
  'Nhat',
  'Collins',
  'Pabash',
  'Prathiksha',
  'Manjula',
  'Subashana',
  'Suresh',
  'Szabina',
  'Tuhin',
  'Ujitha',
  'Vincent',
  'Yugan',
];

export const DEFAULT_USERS: User[] = [
  { id: 'usr-1', name: 'Pubudu', email: 'pubudur3g@gmail.com', role: 'ADMIN', phone: '+358 40 100 0001', active: true, assignedSites: ['site-1', 'site-2', 'site-3', 'site-4', 'site-5', 'site-6'], avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', password: 'admin123' },
  { id: 'usr-2', name: 'Marcus Vance', email: 'supervisor@cleanstock.com', role: 'SUPERVISOR', phone: '+358 40 100 0002', active: true, assignedSites: ['site-1', 'site-2', 'site-3', 'site-4', 'site-5', 'site-6'], avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', password: '1234' },
  { id: 'usr-foreman-1', name: 'Pasi Ylitalo', email: 'pasi.ylitalo@cleanstock.com', role: 'FOREMAN', phone: '+358 40 100 0003', active: true, assignedSites: ['site-1', 'site-2', 'site-3', 'site-4', 'site-5', 'site-6'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', password: '1234' },
  ...REQUIRED_EMPLOYEE_NAMES.map((name, index) => ({
    id: `emp-${index + 1}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '')}@cleanstock.com`,
    role: 'EMPLOYEE' as UserRole,
    phone: `+358 40 100 ${String(index + 10).padStart(4, '0')}`,
    active: true,
    assignedSites: ['site-1', 'site-2', 'site-3', 'site-4', 'site-5', 'site-6'],
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`,
    password: '1234',
  })),
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'STK-000001',
    name: 'SURE Floor Cleaner — 1 L',
    categoryId: 'cat-4',
    brand: 'SURE',
    description: 'Plant-based eco floor cleaner concentrate',
    unit: 'Bottle',
    packageSize: '1 L',
    currentStock: 0,
    minStock: 15,
    targetStock: 50,
    maxStock: 100,
    supplierId: 'sup-3',
    supplierProductCode: 'SURE-FC-1L',
    purchasePrice: 7.50,
    storageLocation: 'Aisle 1 - Shelf A',
    qrCode: 'STK-000001',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-2',
    code: 'STK-000002',
    name: 'SURE Washroom Cleaner — 1 L',
    categoryId: 'cat-4',
    brand: 'SURE',
    description: 'Eco-friendly washroom and sanitary cleaner',
    unit: 'Bottle',
    packageSize: '1 L',
    currentStock: 0,
    minStock: 15,
    targetStock: 50,
    maxStock: 100,
    supplierId: 'sup-3',
    supplierProductCode: 'SURE-WC-1L',
    purchasePrice: 7.80,
    storageLocation: 'Aisle 1 - Shelf B',
    qrCode: 'STK-000002',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-3',
    code: 'STK-000003',
    name: 'SURE Glass Cleaner — 750 ml',
    categoryId: 'cat-4',
    brand: 'SURE',
    description: 'Streak-free window and mirror glass cleaner spray',
    unit: 'Bottle',
    packageSize: '750 ml',
    currentStock: 0,
    minStock: 12,
    targetStock: 40,
    maxStock: 80,
    supplierId: 'sup-3',
    supplierProductCode: 'SURE-GC-750',
    purchasePrice: 6.20,
    storageLocation: 'Aisle 1 - Shelf C',
    qrCode: 'STK-000003',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-4',
    code: 'STK-000004',
    name: 'SURE Interior & Surface Cleaner — 1 L',
    categoryId: 'cat-4',
    brand: 'SURE',
    description: 'All-round multi-surface interior cleaner',
    unit: 'Bottle',
    packageSize: '1 L',
    currentStock: 0,
    minStock: 15,
    targetStock: 50,
    maxStock: 100,
    supplierId: 'sup-3',
    supplierProductCode: 'SURE-ISC-1L',
    purchasePrice: 7.20,
    storageLocation: 'Aisle 1 - Shelf D',
    qrCode: 'STK-000004',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-5',
    code: 'STK-000005',
    name: 'SURE Cleaner & Degreaser — 1 L',
    categoryId: 'cat-4',
    brand: 'SURE',
    description: 'Heavy duty kitchen grease and fat cleaner',
    unit: 'Bottle',
    packageSize: '1 L',
    currentStock: 0,
    minStock: 10,
    targetStock: 40,
    maxStock: 80,
    supplierId: 'sup-3',
    supplierProductCode: 'SURE-CD-1L',
    purchasePrice: 8.50,
    storageLocation: 'Aisle 2 - Shelf A',
    qrCode: 'STK-000005',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-6',
    code: 'STK-000006',
    name: 'SURE Hand Dishwash — 1 L',
    categoryId: 'cat-4',
    brand: 'SURE',
    description: 'Gentle plant-based manual dishwashing liquid',
    unit: 'Bottle',
    packageSize: '1 L',
    currentStock: 0,
    minStock: 10,
    targetStock: 40,
    maxStock: 80,
    supplierId: 'sup-3',
    supplierProductCode: 'SURE-HD-1L',
    purchasePrice: 5.50,
    storageLocation: 'Aisle 2 - Shelf B',
    qrCode: 'STK-000006',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-7',
    code: 'STK-000007',
    name: 'Sterisol Ultra Liquid Soap 0.7 L',
    categoryId: 'cat-4',
    brand: 'Sterisol',
    description: 'Hygienic ultra-gentle hand soap refill bag',
    unit: 'Bottle',
    packageSize: '0.7 L',
    currentStock: 0,
    minStock: 20,
    targetStock: 60,
    maxStock: 120,
    supplierId: 'sup-1',
    supplierProductCode: 'STER-ULS-07',
    purchasePrice: 9.80,
    storageLocation: 'Aisle 3 - Shelf A',
    qrCode: 'STK-000007',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-8',
    code: 'STK-000008',
    name: 'Sterisol Hand Disinfectant 0.7 L',
    categoryId: 'cat-4',
    brand: 'Sterisol',
    description: 'Ethanol-based medical grade hand sanitizer',
    unit: 'Bottle',
    packageSize: '0.7 L',
    currentStock: 0,
    minStock: 25,
    targetStock: 80,
    maxStock: 150,
    supplierId: 'sup-1',
    supplierProductCode: 'STER-HD-07',
    purchasePrice: 11.50,
    storageLocation: 'Aisle 3 - Shelf B',
    qrCode: 'STK-000008',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-9',
    code: 'STK-000009',
    name: 'Sterisol Original Hand Cleanser 0.7 L',
    categoryId: 'cat-4',
    brand: 'Sterisol',
    description: 'Preservative-free skin cleanser 0.7L bag',
    unit: 'Bottle',
    packageSize: '0.7 L',
    currentStock: 0,
    minStock: 20,
    targetStock: 60,
    maxStock: 120,
    supplierId: 'sup-1',
    supplierProductCode: 'STER-OHC-07',
    purchasePrice: 10.20,
    storageLocation: 'Aisle 3 - Shelf C',
    qrCode: 'STK-000009',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-10',
    code: 'STK-000010',
    name: 'Sterisol Sweden Liquid Soap 0.75 L',
    categoryId: 'cat-4',
    brand: 'Sterisol',
    description: 'Nourishing liquid hand soap 0.75L pouch',
    unit: 'Bottle',
    packageSize: '0.75 L',
    currentStock: 0,
    minStock: 20,
    targetStock: 60,
    maxStock: 120,
    supplierId: 'sup-1',
    supplierProductCode: 'STER-SLS-075',
    purchasePrice: 10.50,
    storageLocation: 'Aisle 3 - Shelf D',
    qrCode: 'STK-000010',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-11',
    code: 'STK-000011',
    name: 'Sterisol Soft Skin Cream 0.7 L',
    categoryId: 'cat-4',
    brand: 'Sterisol',
    description: 'Moisturizing protective hand cream refill',
    unit: 'Bottle',
    packageSize: '0.7 L',
    currentStock: 0,
    minStock: 15,
    targetStock: 50,
    maxStock: 100,
    supplierId: 'sup-1',
    supplierProductCode: 'STER-SSC-07',
    purchasePrice: 12.80,
    storageLocation: 'Aisle 4 - Shelf A',
    qrCode: 'STK-000011',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-12',
    code: 'STK-000012',
    name: 'Sterisol Super Hand Cleanser 2.5 L',
    categoryId: 'cat-4',
    brand: 'Sterisol',
    description: 'Heavy duty workshop hand cleanser 2.5L canister',
    unit: 'Canister',
    packageSize: '2.5 L',
    currentStock: 0,
    minStock: 10,
    targetStock: 30,
    maxStock: 60,
    supplierId: 'sup-1',
    supplierProductCode: 'STER-SHC-25',
    purchasePrice: 24.00,
    storageLocation: 'Aisle 4 - Shelf B',
    qrCode: 'STK-000012',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-13',
    code: 'STK-000013',
    name: 'Sterisol Ultra Liquid Soap 2.5 L',
    categoryId: 'cat-4',
    brand: 'Sterisol',
    description: 'Bulk 2.5L liquid soap refill canister',
    unit: 'Canister',
    packageSize: '2.5 L',
    currentStock: 0,
    minStock: 10,
    targetStock: 30,
    maxStock: 60,
    supplierId: 'sup-1',
    supplierProductCode: 'STER-ULS-25',
    purchasePrice: 22.50,
    storageLocation: 'Aisle 4 - Shelf C',
    qrCode: 'STK-000013',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-14',
    code: 'STK-000014',
    name: 'Sterisol Original Hand Cleanser 2.5 L',
    categoryId: 'cat-4',
    brand: 'Sterisol',
    description: 'Large 2.5L skin cleanser canister',
    unit: 'Canister',
    packageSize: '2.5 L',
    currentStock: 0,
    minStock: 10,
    targetStock: 30,
    maxStock: 60,
    supplierId: 'sup-1',
    supplierProductCode: 'STER-OHC-25',
    purchasePrice: 23.50,
    storageLocation: 'Aisle 4 - Shelf D',
    qrCode: 'STK-000014',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-15',
    code: 'STK-000015',
    name: 'Sterisol Sweden Liquid Soap 2.5 L',
    categoryId: 'cat-4',
    brand: 'Sterisol',
    description: 'Bulk 2.5L Sweden liquid soap refill',
    unit: 'Canister',
    packageSize: '2.5 L',
    currentStock: 0,
    minStock: 10,
    targetStock: 30,
    maxStock: 60,
    supplierId: 'sup-1',
    supplierProductCode: 'STER-SLS-25',
    purchasePrice: 23.80,
    storageLocation: 'Aisle 5 - Shelf A',
    qrCode: 'STK-000015',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-16',
    code: 'STK-000016',
    name: 'KW Special 5l',
    categoryId: 'cat-5',
    brand: 'KW',
    description: 'KW special professional cleaning formula 5L container',
    unit: 'Canister',
    packageSize: '5 L',
    currentStock: 0,
    minStock: 8,
    targetStock: 25,
    maxStock: 50,
    supplierId: 'sup-1',
    supplierProductCode: 'KW-SPEC-5L',
    purchasePrice: 26.50,
    storageLocation: 'Aisle 5 - Shelf B',
    qrCode: 'STK-000016',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-17',
    code: 'STK-000017',
    name: 'Katrin Toilet Papaer box',
    categoryId: 'cat-1',
    brand: 'Katrin',
    description: 'Katrin commercial toilet paper rolls box (36 rolls)',
    unit: 'Box',
    packageSize: '36 rolls/box',
    currentStock: 0,
    minStock: 15,
    targetStock: 45,
    maxStock: 90,
    supplierId: 'sup-2',
    supplierProductCode: 'KAT-TP-BOX',
    purchasePrice: 21.00,
    storageLocation: 'Aisle 1 - Shelf A',
    qrCode: 'STK-000017',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-18',
    code: 'STK-000018',
    name: 'Katrin Hand paper towels',
    categoryId: 'cat-1',
    brand: 'Katrin',
    description: 'Katrin folded hand paper towels packet',
    unit: 'Packet',
    packageSize: '200 sheets/pack',
    currentStock: 0,
    minStock: 25,
    targetStock: 80,
    maxStock: 160,
    supplierId: 'sup-2',
    supplierProductCode: 'KAT-HT-PACK',
    purchasePrice: 4.80,
    storageLocation: 'Aisle 1 - Shelf B',
    qrCode: 'STK-000018',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-19',
    code: 'STK-000019',
    name: 'Garbage Bags 30L',
    categoryId: 'cat-2',
    brand: 'Safepack',
    description: 'Light office bin liners (50 pcs/pack)',
    unit: 'Packet',
    packageSize: '50 pcs',
    currentStock: 0,
    minStock: 30,
    targetStock: 100,
    maxStock: 200,
    supplierId: 'sup-4',
    supplierProductCode: 'SP-GB30',
    purchasePrice: 3.20,
    storageLocation: 'Aisle 2 - Shelf A',
    qrCode: 'STK-000019',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-20',
    code: 'STK-000020',
    name: 'Garbage Bags 75L',
    categoryId: 'cat-2',
    brand: 'Safepack',
    description: 'Medium heavy duty waste bags (25 pcs/pack)',
    unit: 'Packet',
    packageSize: '25 pcs',
    currentStock: 0,
    minStock: 30,
    targetStock: 100,
    maxStock: 200,
    supplierId: 'sup-4',
    supplierProductCode: 'SP-GB75',
    purchasePrice: 5.80,
    storageLocation: 'Aisle 2 - Shelf B',
    qrCode: 'STK-000020',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-21',
    code: 'STK-000021',
    name: 'Garbage Bags 150L',
    categoryId: 'cat-2',
    brand: 'Safepack',
    description: 'Large commercial waste sacks (20 pcs/pack)',
    unit: 'Packet',
    packageSize: '20 pcs',
    currentStock: 0,
    minStock: 20,
    targetStock: 80,
    maxStock: 150,
    supplierId: 'sup-4',
    supplierProductCode: 'SP-GB150',
    purchasePrice: 8.50,
    storageLocation: 'Aisle 2 - Shelf C',
    qrCode: 'STK-000021',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-22',
    code: 'STK-000022',
    name: 'Garbage Bags 250L',
    categoryId: 'cat-2',
    brand: 'Safepack',
    description: 'Extra heavy duty outdoor wheelie bin bags (10 pcs/pack)',
    unit: 'Packet',
    packageSize: '10 pcs',
    currentStock: 0,
    minStock: 15,
    targetStock: 60,
    maxStock: 120,
    supplierId: 'sup-4',
    supplierProductCode: 'SP-GB250',
    purchasePrice: 11.20,
    storageLocation: 'Aisle 2 - Shelf D',
    qrCode: 'STK-000022',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-23',
    code: 'STK-000023',
    name: 'Gloves Size 7',
    categoryId: 'cat-3',
    brand: 'Safepack',
    description: 'Nitrile powder-free disposable gloves - Small',
    unit: 'Box',
    packageSize: '100 pcs',
    currentStock: 0,
    minStock: 20,
    targetStock: 60,
    maxStock: 120,
    supplierId: 'sup-4',
    supplierProductCode: 'SP-GLV7',
    purchasePrice: 12.50,
    storageLocation: 'Aisle 3 - Shelf A',
    qrCode: 'STK-000023',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-24',
    code: 'STK-000024',
    name: 'Gloves Size 8',
    categoryId: 'cat-3',
    brand: 'Safepack',
    description: 'Nitrile powder-free disposable gloves - Medium',
    unit: 'Box',
    packageSize: '100 pcs',
    currentStock: 0,
    minStock: 25,
    targetStock: 80,
    maxStock: 150,
    supplierId: 'sup-4',
    supplierProductCode: 'SP-GLV8',
    purchasePrice: 12.50,
    storageLocation: 'Aisle 3 - Shelf B',
    qrCode: 'STK-000024',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-25',
    code: 'STK-000025',
    name: 'Gloves Size 9',
    categoryId: 'cat-3',
    brand: 'Safepack',
    description: 'Nitrile powder-free disposable gloves - Large',
    unit: 'Box',
    packageSize: '100 pcs',
    currentStock: 0,
    minStock: 30,
    targetStock: 100,
    maxStock: 200,
    supplierId: 'sup-4',
    supplierProductCode: 'SP-GLV9',
    purchasePrice: 12.50,
    storageLocation: 'Aisle 3 - Shelf C',
    qrCode: 'STK-000025',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
  {
    id: 'prod-26',
    code: 'STK-000026',
    name: 'Gloves Size 10',
    categoryId: 'cat-3',
    brand: 'Safepack',
    description: 'Nitrile powder-free disposable gloves - Extra Large',
    unit: 'Box',
    packageSize: '100 pcs',
    currentStock: 0,
    minStock: 20,
    targetStock: 60,
    maxStock: 120,
    supplierId: 'sup-4',
    supplierProductCode: 'SP-GLV10',
    purchasePrice: 13.00,
    storageLocation: 'Aisle 3 - Shelf D',
    qrCode: 'STK-000026',
    active: true,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-11T08:00:00.000Z',
  },
];

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'ISS Deep Cleaning and Grocery Store',
  address: 'Teollisuuskatu 24, 00510 Helsinki, Finland',
  phone: '+358 20 700 8000',
  email: 'stock@isscleanstore.fi',
  currency: '€',
  defaultNotificationEmail: 'manager@isscleanstore.fi',
  defaultSupplierId: 'sup-1',
  stockLocation: 'Central Store - Warehouse 1',
  allowNegativeStock: false,
  expectedDeliveryDays: 3,
  enableLowStockAlerts: true,
  enableOutOfStockAlerts: true,
  enableLargeQuantityAlerts: true,
  largeQuantityThreshold: 25,
};

const DEFAULT_TRANSACTIONS: StockTransaction[] = [];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    date: '2026-08-10',
    time: '10:00',
    type: 'OUT_OF_STOCK',
    productId: 'prod-14',
    productName: 'KW Heavy Duty Degreaser',
    message: '🔴 KW Heavy Duty Degreaser is completely OUT OF STOCK! Reorder required immediately.',
    read: false,
    severity: 'error',
  },
  {
    id: 'notif-2',
    date: '2026-08-10',
    time: '08:15',
    type: 'LOW_STOCK',
    productId: 'prod-9',
    productName: 'Gloves Size 9',
    message: '🟠 Gloves Size 9 reached reorder level (Current: 18, Min: 30). Suggested order: 82 Boxes.',
    read: false,
    severity: 'warning',
  },
  {
    id: 'notif-3',
    date: '2026-08-10',
    time: '08:00',
    type: 'LOW_STOCK',
    productId: 'prod-2',
    productName: 'Toilet Paper Boxes',
    message: '🟠 Toilet Paper Boxes reached reorder level (Current: 12, Min: 20). Suggested order: 38 Boxes.',
    read: true,
    severity: 'warning',
  },
  {
    id: 'notif-4',
    date: '2026-08-09',
    time: '16:30',
    type: 'LOW_STOCK',
    productId: 'prod-4',
    productName: 'Garbage Bags 75L',
    message: '🟠 Garbage Bags 75L reached reorder level (Current: 35, Min: 50). Suggested order: 115 Packets.',
    read: true,
    severity: 'warning',
  },
];

const DEFAULT_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-001',
    supplierId: 'sup-4',
    supplierName: 'Safepack Solutions',
    date: '2026-08-10',
    expectedDeliveryDate: '2026-08-13',
    status: 'Ordered',
    estimatedCost: 1691.00,
    notes: 'Urgent glove and garbage bag restock',
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-10T09:00:00.000Z',
    items: [
      {
        productId: 'prod-9',
        productName: 'Gloves Size 9',
        productCode: 'STK-000009',
        unit: 'Box',
        currentStock: 18,
        reorderLevel: 30,
        targetStock: 100,
        suggestedQuantity: 82,
        orderedQuantity: 80,
        unitPrice: 12.50,
        receivedQuantity: 0,
      },
      {
        productId: 'prod-4',
        productName: 'Garbage Bags 75L',
        productCode: 'STK-000004',
        unit: 'Packet',
        currentStock: 35,
        reorderLevel: 50,
        targetStock: 150,
        suggestedQuantity: 115,
        orderedQuantity: 100,
        unitPrice: 5.80,
        receivedQuantity: 0,
      },
    ],
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    timestamp: '2026-08-10T10:05:00.000Z',
    userId: 'usr-1',
    userName: 'Sarah Jenkins',
    action: 'Stock IN',
    objectType: 'Product',
    objectId: 'prod-1',
    objectName: 'Hand Paper Packets',
    previousValue: 'Stock: 50',
    newValue: 'Stock: 100 (+50)',
  },
  {
    id: 'audit-2',
    timestamp: '2026-08-10T09:30:00.000Z',
    userId: 'usr-4',
    userName: 'Elena Rostova',
    action: 'Stock OUT',
    objectType: 'Product',
    objectId: 'prod-4',
    objectName: 'Garbage Bags 75L',
    previousValue: 'Stock: 45',
    newValue: 'Stock: 35 (-10)',
  },
  {
    id: 'audit-3',
    timestamp: '2026-08-10T08:15:00.000Z',
    userId: 'usr-3',
    userName: 'John Doe',
    action: 'Stock OUT',
    objectType: 'Product',
    objectId: 'prod-9',
    objectName: 'Gloves Size 9',
    previousValue: 'Stock: 23',
    newValue: 'Stock: 18 (-5)',
  },
  {
    id: 'audit-4',
    timestamp: '2026-08-08T11:45:00.000Z',
    userId: 'usr-2',
    userName: 'Marcus Vance',
    action: 'Stock Adjustment',
    objectType: 'Product',
    objectId: 'prod-11',
    objectName: 'Sure Washroom Cleaner',
    previousValue: 'Stock: 27',
    newValue: 'Stock: 25 (-2 Reason: Damaged)',
  },
];

// Database Storage Helper Class
export class StorageService {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('Storage write error', err);
    }
  }

  public static initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.setItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
      this.setItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      this.setItem(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
      this.setItem(STORAGE_KEYS.SITES, DEFAULT_SITES);
      this.setItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      this.setItem(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
      this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, DEFAULT_PURCHASE_ORDERS);
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
      this.setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      this.setItem(STORAGE_KEYS.DEEP_CLEANING_TASKS, DEFAULT_DEEP_CLEANING_TASKS);
    }
  }

  public static resetToInitialData(): void {
    localStorage.clear();
    this.initialize();
  }

  // Users & Auth
  public static getUsers(): User[] {
    let users = this.getItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
    let updated = false;
    // Ensure all users have passwords set
    users.forEach((u) => {
      if (!u.password) {
        u.password = u.role === 'ADMIN' ? 'admin123' : '1234';
        updated = true;
      }
    });
    // If first user has legacy default name, update to Pubudu
    if (users.length > 0 && (users[0].name === 'Sarah Jenkins' || (users[0].id === 'usr-1' && users[0].name !== 'Pubudu'))) {
      users[0].name = 'Pubudu';
      users[0].email = 'pubudur3g@gmail.com';
      updated = true;
    }

    // Ensure Foreman Pasi Ylitalo exists in the users list
    const foremanExists = users.some(
      (u) => u.name.toLowerCase() === 'pasi ylitalo' || u.role === 'FOREMAN'
    );
    if (!foremanExists) {
      users.splice(2, 0, {
        id: 'usr-foreman-1',
        name: 'Pasi Ylitalo',
        email: 'pasi.ylitalo@cleanstock.com',
        role: 'FOREMAN',
        phone: '+358 40 100 0003',
        active: true,
        assignedSites: ['site-1', 'site-2', 'site-3', 'site-4', 'site-5', 'site-6'],
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        password: '1234',
      });
      updated = true;
    } else {
      const fUser = users.find(
        (u) => u.name.toLowerCase() === 'pasi ylitalo' || u.role === 'FOREMAN'
      );
      if (fUser) {
        if (fUser.name !== 'Pasi Ylitalo' || fUser.role !== 'FOREMAN') {
          fUser.name = 'Pasi Ylitalo';
          fUser.role = 'FOREMAN';
          fUser.email = 'pasi.ylitalo@cleanstock.com';
          updated = true;
        }
      }
    }

    // Ensure all required employees exist in users list
    REQUIRED_EMPLOYEE_NAMES.forEach((empName, index) => {
      const exists = users.some(
        (u) => u.name.toLowerCase() === empName.toLowerCase()
      );
      if (!exists) {
        users.push({
          id: `emp-${index + 1}`,
          name: empName,
          email: `${empName.toLowerCase().replace(/\s+/g, '')}@cleanstock.com`,
          role: 'EMPLOYEE',
          phone: `+358 40 100 ${String(index + 10).padStart(4, '0')}`,
          active: true,
          assignedSites: ['site-1', 'site-2', 'site-3', 'site-4', 'site-5', 'site-6'],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(empName)}&background=0284c7&color=fff`,
          password: '1234',
        });
        updated = true;
      }
    });

    if (updated) {
      this.setItem(STORAGE_KEYS.USERS, users);
    }
    return users;
  }

  public static getCurrentUser(): User | null {
    return this.getItem(STORAGE_KEYS.CURRENT_USER, null);
  }

  public static setCurrentUser(user: User | null): void {
    if (user === null) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    }
  }

  public static saveUser(user: User): User {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.setItem(STORAGE_KEYS.USERS, users);
    saveToFirestore('users', user);
    return user;
  }

  public static deleteUser(id: string): void {
    const users = this.getUsers().filter((u) => u.id !== id);
    this.setItem(STORAGE_KEYS.USERS, users);
    deleteFromFirestore('users', id);
  }

  // Categories
  public static getCategories(): Category[] {
    return this.getItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }

  public static saveCategory(cat: Category): Category {
    const cats = this.getCategories();
    const idx = cats.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      cats[idx] = cat;
    } else {
      cats.push(cat);
    }
    this.setItem(STORAGE_KEYS.CATEGORIES, cats);
    saveToFirestore('categories', cat);
    return cat;
  }

  public static deleteCategory(id: string): void {
    const cats = this.getCategories().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CATEGORIES, cats);
    deleteFromFirestore('categories', id);
  }

  // Suppliers
  public static getSuppliers(): Supplier[] {
    return this.getItem(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
  }

  public static saveSupplier(sup: Supplier): Supplier {
    const sups = this.getSuppliers();
    const idx = sups.findIndex((s) => s.id === sup.id);
    if (idx >= 0) {
      sups[idx] = sup;
    } else {
      sups.push(sup);
    }
    this.setItem(STORAGE_KEYS.SUPPLIERS, sups);
    saveToFirestore('suppliers', sup);
    return sup;
  }

  public static deleteSupplier(id: string): void {
    const sups = this.getSuppliers().filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.SUPPLIERS, sups);
    deleteFromFirestore('suppliers', id);
  }

  // Sites
  public static getSites(): CleaningSite[] {
    return this.getItem(STORAGE_KEYS.SITES, DEFAULT_SITES);
  }

  public static saveSite(site: CleaningSite): CleaningSite {
    const sites = this.getSites();
    const idx = sites.findIndex((s) => s.id === site.id);
    if (idx >= 0) {
      sites[idx] = site;
    } else {
      sites.push(site);
    }
    this.setItem(STORAGE_KEYS.SITES, sites);
    saveToFirestore('sites', site);
    return site;
  }

  public static deleteSite(id: string): void {
    const sites = this.getSites().filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.SITES, sites);
    deleteFromFirestore('sites', id);
  }

  // Products
  public static getProducts(): Product[] {
    let products: Product[] = this.getItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    
    // Ensure all 26 catalog items exist
    const existingIds = new Set(products.map((p) => p.id));
    let hasMissing = false;
    for (const defP of DEFAULT_PRODUCTS) {
      if (!existingIds.has(defP.id)) {
        products.push(defP);
        saveToFirestore('products', defP);
        hasMissing = true;
      }
    }
    if (hasMissing) {
      this.setItem(STORAGE_KEYS.PRODUCTS, products);
    }
    
    return products;
  }

  public static emptyAllStockValues(user?: User): void {
    const products = this.getProducts().map((p) => {
      const updated = {
        ...p,
        currentStock: 0,
        updatedAt: new Date().toISOString(),
      };
      saveToFirestore('products', updated);
      return updated;
    });
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, []);
    if (user) {
      this.logAudit(user, 'Zeroed All Stock Values', 'Product', 'all', 'All product stock levels set to 0');
    }
  }

  public static getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  public static getProductByCode(code: string): Product | undefined {
    const cleanCode = code.trim().toUpperCase();
    return this.getProducts().find(
      (p) => p.code.toUpperCase() === cleanCode || p.qrCode.toUpperCase() === cleanCode
    );
  }

  public static generateNextProductCode(): string {
    const products = this.getProducts();
    let maxNum = 0;
    products.forEach((p) => {
      const match = p.code.match(/STK-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `STK-${nextNum.toString().padStart(6, '0')}`;
  }

  public static saveProduct(product: Product, user: User): Product {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === product.id);
    const now = new Date().toISOString();

    let prevValue = '';
    let newValue = '';

    let updatedProduct = product;
    if (idx >= 0) {
      prevValue = `Stock: ${products[idx].currentStock}, Min: ${products[idx].minStock}, Name: ${products[idx].name}`;
      updatedProduct = { ...product, updatedAt: now };
      products[idx] = updatedProduct;
      newValue = `Stock: ${product.currentStock}, Min: ${product.minStock}, Name: ${product.name}`;
      this.logAudit(user, 'Product Updated', 'Product', product.id, product.name, prevValue, newValue);
    } else {
      updatedProduct = {
        ...product,
        createdAt: now,
        updatedAt: now,
      };
      products.push(updatedProduct);
      this.logAudit(user, 'Product Created', 'Product', product.id, product.name, '', `Code: ${product.code}, Stock: ${product.currentStock}`);
    }

    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    saveToFirestore('products', updatedProduct);
    this.checkStockAlerts(updatedProduct);
    return updatedProduct;
  }

  public static deactivateProduct(id: string, user: User): void {
    const products = this.getProducts();
    const product = products.find((p) => p.id === id);
    if (product) {
      product.active = false;
      product.updatedAt = new Date().toISOString();
      this.setItem(STORAGE_KEYS.PRODUCTS, products);
      saveToFirestore('products', product);
      this.logAudit(user, 'Product Deactivated', 'Product', id, product.name, 'Active', 'Inactive');
    }
  }

  // Stock Status Logic
  public static getStockStatus(product: Product): StockStatus {
    if (product.currentStock <= 0) return 'OUT_OF_STOCK';
    if (product.currentStock <= product.minStock) return 'REORDER_REQUIRED';
    if (product.currentStock <= product.minStock * 1.25) return 'LOW';
    return 'NORMAL';
  }

  // Stock Operations
  public static issueStock(
    productId: string,
    quantity: number,
    siteId: string,
    user: User,
    notes?: string
  ): { success: boolean; message: string; transaction?: StockTransaction } {
    const settings = this.getSettings();
    const product = this.getProductById(productId);
    const site = this.getSites().find((s) => s.id === siteId);

    if (!product) return { success: false, message: 'Product not found.' };
    if (!site) return { success: false, message: 'Cleaning site must be selected.' };
    if (quantity <= 0) return { success: false, message: 'Quantity must be greater than zero.' };

    if (!settings.allowNegativeStock && product.currentStock < quantity) {
      return {
        success: false,
        message: `Only ${product.currentStock} ${product.unit}(s) available. You cannot issue ${quantity} ${product.unit}(s).`,
      };
    }

    const prevStock = product.currentStock;
    product.currentStock -= quantity;
    product.updatedAt = new Date().toISOString();

    // Save product update
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx >= 0) products[idx] = product;
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    saveToFirestore('products', product);

    // Record Stock OUT Transaction
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const transaction: StockTransaction = {
      id: `tx-${Date.now()}`,
      transactionId: `TXN-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      date: dateStr,
      time: timeStr,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      type: 'OUT',
      quantity,
      employeeId: user.id,
      employeeName: user.name,
      siteId: site.id,
      siteName: site.name,
      notes: notes || '',
      createdByUserId: user.id,
      createdByName: user.name,
      unitPrice: product.purchasePrice,
      totalValue: quantity * product.purchasePrice,
    };

    this.addTransaction(transaction);
    this.logAudit(
      user,
      'Stock OUT',
      'Product',
      product.id,
      product.name,
      `Previous Stock: ${prevStock}`,
      `New Stock: ${product.currentStock} (-${quantity} issued for ${site.name})`
    );

    // Large quantity alert
    if (settings.enableLargeQuantityAlerts && quantity >= settings.largeQuantityThreshold) {
      this.addNotification({
        id: `notif-${Date.now()}`,
        date: dateStr,
        time: timeStr,
        type: 'LARGE_ISSUE',
        productId: product.id,
        productName: product.name,
        message: `⚡ Large stock issue recorded: ${user.name} issued ${quantity} ${product.unit}(s) of ${product.name} to ${site.name}.`,
        read: false,
        severity: 'info',
      });
    }

    // Low stock / Out of stock alerts
    this.checkStockAlerts(product);

    return {
      success: true,
      message: `Successfully issued ${quantity} ${product.unit}(s) of ${product.name} to ${site.name}.`,
      transaction,
    };
  }

  public static receiveStock(
    productId: string,
    quantity: number,
    supplierId: string,
    user: User,
    purchasePrice?: number,
    invoiceNo?: string,
    notes?: string
  ): { success: boolean; message: string; transaction?: StockTransaction } {
    const product = this.getProductById(productId);
    const supplier = this.getSuppliers().find((s) => s.id === supplierId);

    if (!product) return { success: false, message: 'Product not found.' };
    if (quantity <= 0) return { success: false, message: 'Quantity must be greater than zero.' };

    const prevStock = product.currentStock;
    product.currentStock += quantity;
    if (purchasePrice && purchasePrice > 0) {
      product.purchasePrice = purchasePrice;
    }
    if (supplierId) {
      product.supplierId = supplierId;
    }
    product.updatedAt = new Date().toISOString();

    // Save product update
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx >= 0) products[idx] = product;
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    saveToFirestore('products', product);

    // Record Stock IN Transaction
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const transaction: StockTransaction = {
      id: `tx-${Date.now()}`,
      transactionId: `TXN-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      date: dateStr,
      time: timeStr,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      type: 'IN',
      quantity,
      supplierId: supplier?.id || product.supplierId,
      supplierName: supplier?.name || 'Default Supplier',
      notes: invoiceNo ? `Invoice/PO: ${invoiceNo}. ${notes || ''}` : notes || '',
      createdByUserId: user.id,
      createdByName: user.name,
      unitPrice: purchasePrice || product.purchasePrice,
      totalValue: quantity * (purchasePrice || product.purchasePrice),
    };

    this.addTransaction(transaction);
    this.logAudit(
      user,
      'Stock IN',
      'Product',
      product.id,
      product.name,
      `Previous Stock: ${prevStock}`,
      `New Stock: ${product.currentStock} (+${quantity} received)`
    );

    this.addNotification({
      id: `notif-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      type: 'RECEIPT',
      productId: product.id,
      productName: product.name,
      message: `📦 New stock received: +${quantity} ${product.unit}(s) of ${product.name} (New Stock: ${product.currentStock}).`,
      read: false,
      severity: 'success',
    });

    return {
      success: true,
      message: `Successfully received ${quantity} ${product.unit}(s) of ${product.name}. New Stock: ${product.currentStock}`,
      transaction,
    };
  }

  public static adjustStock(
    productId: string,
    newStockLevel: number,
    type: 'ADJUSTMENT' | 'DAMAGED' | 'EXPIRED' | 'LOST',
    reason: string,
    user: User,
    notes?: string
  ): { success: boolean; message: string; transaction?: StockTransaction } {
    if (user.role === 'EMPLOYEE') {
      return { success: false, message: 'Employees are not authorized to make stock adjustments.' };
    }

    const product = this.getProductById(productId);
    if (!product) return { success: false, message: 'Product not found.' };
    if (!reason || reason.trim() === '') return { success: false, message: 'A reason is required for stock adjustments.' };

    const prevStock = product.currentStock;
    const delta = newStockLevel - prevStock;
    product.currentStock = newStockLevel;
    product.updatedAt = new Date().toISOString();

    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx >= 0) products[idx] = product;
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    saveToFirestore('products', product);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const transaction: StockTransaction = {
      id: `tx-${Date.now()}`,
      transactionId: `TXN-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      date: dateStr,
      time: timeStr,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      type: type,
      quantity: delta,
      reason,
      notes: notes || '',
      createdByUserId: user.id,
      createdByName: user.name,
      unitPrice: product.purchasePrice,
      totalValue: delta * product.purchasePrice,
    };

    this.addTransaction(transaction);
    this.logAudit(
      user,
      `Stock Adjustment (${type})`,
      'Product',
      product.id,
      product.name,
      `Previous Stock: ${prevStock}`,
      `New Stock: ${product.currentStock} (Adjustment: ${delta >= 0 ? '+' + delta : delta}, Reason: ${reason})`
    );

    this.addNotification({
      id: `notif-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      type: 'ADJUSTMENT',
      productId: product.id,
      productName: product.name,
      message: `🔧 Stock adjustment on ${product.name}: ${prevStock} ➔ ${product.currentStock} (${delta >= 0 ? '+' : ''}${delta}). Reason: ${reason}.`,
      read: false,
      severity: 'warning',
    });

    this.checkStockAlerts(product);

    return {
      success: true,
      message: `Stock adjusted for ${product.name}. Updated balance: ${product.currentStock} ${product.unit}(s).`,
      transaction,
    };
  }

  // Alert check engine
  private static checkStockAlerts(product: Product): void {
    const settings = this.getSettings();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    if (product.currentStock <= 0 && settings.enableOutOfStockAlerts) {
      this.addNotification({
        id: `notif-out-${product.id}-${Date.now()}`,
        date: dateStr,
        time: timeStr,
        type: 'OUT_OF_STOCK',
        productId: product.id,
        productName: product.name,
        message: `🔴 Stock Alert: ${product.name} is OUT OF STOCK! Minimum level is ${product.minStock}.`,
        read: false,
        severity: 'error',
      });
    } else if (product.currentStock <= product.minStock && settings.enableLowStockAlerts) {
      const suggestedOrder = Math.max(0, product.targetStock - product.currentStock);
      this.addNotification({
        id: `notif-low-${product.id}-${Date.now()}`,
        date: dateStr,
        time: timeStr,
        type: 'LOW_STOCK',
        productId: product.id,
        productName: product.name,
        message: `🟠 Stock Alert: ${product.name} is below reorder level (Current: ${product.currentStock}, Minimum: ${product.minStock}). Suggested order: ${suggestedOrder} ${product.unit}(s).`,
        read: false,
        severity: 'warning',
      });
    }
  }

  // Transactions
  public static getTransactions(): StockTransaction[] {
    return this.getItem(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
  }

  public static addTransaction(tx: StockTransaction): void {
    const txs = this.getTransactions();
    txs.unshift(tx);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, txs);
    saveToFirestore('transactions', tx);
  }

  // Purchase Orders
  public static getPurchaseOrders(): PurchaseOrder[] {
    return this.getItem(STORAGE_KEYS.PURCHASE_ORDERS, DEFAULT_PURCHASE_ORDERS);
  }

  public static savePurchaseOrder(po: PurchaseOrder, user: User): PurchaseOrder {
    const pos = this.getPurchaseOrders();
    const idx = pos.findIndex((p) => p.id === po.id);
    const now = new Date().toISOString();

    let savedPO = po;
    if (idx >= 0) {
      const prevStatus = pos[idx].status;
      savedPO = { ...po, updatedAt: now };
      pos[idx] = savedPO;
      this.logAudit(user, 'Purchase Order Updated', 'PurchaseOrder', po.id, po.poNumber, `Status: ${prevStatus}`, `Status: ${po.status}`);
    } else {
      savedPO = { ...po, createdAt: now, updatedAt: now };
      pos.unshift(savedPO);
      this.logAudit(user, 'Purchase Order Created', 'PurchaseOrder', po.id, po.poNumber, '', `Supplier: ${po.supplierName}, Cost: €${po.estimatedCost.toFixed(2)}`);
    }

    this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, pos);
    saveToFirestore('reorderRequests', savedPO);
    return savedPO;
  }

  // Foreman Custom Report Items
  public static getForemanCustomItems(): ForemanReportCustomItem[] {
    return this.getItem(STORAGE_KEYS.FOREMAN_CUSTOM_ITEMS, []);
  }

  public static addForemanCustomItem(item: ForemanReportCustomItem, user: User): ForemanReportCustomItem[] {
    const items = this.getForemanCustomItems();
    items.unshift(item);
    this.setItem(STORAGE_KEYS.FOREMAN_CUSTOM_ITEMS, items);
    this.logAudit(user, 'Added Foreman Report Item', 'PurchaseOrder', item.id, item.productName, '', `Code: ${item.supplierProductCode}, Qty: ${item.quantity}`);
    return items;
  }

  public static deleteForemanCustomItem(id: string, user: User): ForemanReportCustomItem[] {
    let items = this.getForemanCustomItems();
    items = items.filter((i) => i.id !== id);
    this.setItem(STORAGE_KEYS.FOREMAN_CUSTOM_ITEMS, items);
    this.logAudit(user, 'Removed Foreman Report Item', 'PurchaseOrder', id, id, '', 'Deleted');
    return items;
  }

  // Notifications
  public static getNotifications(): AppNotification[] {
    return this.getItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  }

  public static isNotificationVisibleForUser(
    notif: AppNotification,
    user?: User | null
  ): boolean {
    if (!user) return true;

    // Deep Cleaning Task notifications
    if (notif.type === 'DEEP_CLEANING' || notif.relatedTab === 'deep-cleaning') {
      if (user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'FOREMAN') {
        return true;
      }
      const teamMembers = this.getDeepCleaningTeamMembers();
      if (isUserInDeepCleaningTeam(user, teamMembers)) {
        return true;
      }
      const userName = (user.name || '').toLowerCase();
      const msg = (notif.message || '').toLowerCase();
      return msg.includes(userName);
    }

    // Employees should receive out of stock notifications, order request approvals/rejections, and assigned tasks
    if (user.role === 'EMPLOYEE') {
      const msg = (notif.message || '').toLowerCase();
      const isOutOfStock =
        notif.type === 'OUT_OF_STOCK' ||
        msg.includes('out of stock') ||
        (notif.severity === 'error' && msg.includes('0 units'));

      const isOrderApproveOrReject =
        msg.includes('approved') ||
        msg.includes('rejected') ||
        msg.includes('approval') ||
        notif.type === 'PRODUCT_REQUEST' ||
        (notif.type === 'RECEIPT' && (msg.includes('approved') || msg.includes('po')));

      return isOutOfStock || isOrderApproveOrReject;
    }
    return true;
  }

  public static getNotificationsForUser(user?: User | null): AppNotification[] {
    const allNotifs = this.getNotifications();
    if (!user) return allNotifs;
    return allNotifs.filter((n) => this.isNotificationVisibleForUser(n, user));
  }

  public static addNotification(notif: AppNotification): void {
    const notifications = this.getNotifications();
    notifications.unshift(notif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    saveToFirestore('notifications', notif);
  }

  public static markNotificationAsRead(id: string): void {
    const notifications = this.getNotifications();
    const notif = notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
      saveToFirestore('notifications', notif);
    }
  }

  public static markAllNotificationsAsRead(): void {
    const notifications = this.getNotifications();
    notifications.forEach((n) => {
      n.read = true;
      saveToFirestore('notifications', n);
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  // Audit Logs
  public static getAuditLogs(): AuditLog[] {
    return this.getItem(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
  }

  public static logAudit(
    user: User,
    action: string,
    objectType: AuditLog['objectType'],
    objectId: string,
    objectName: string,
    previousValue?: string,
    newValue?: string
  ): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      action,
      objectType,
      objectId,
      objectName,
      previousValue: previousValue ?? '',
      newValue: newValue ?? '',
    };
    logs.unshift(newLog);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
    saveToFirestore('auditLogs', newLog);
  }

  // Settings
  public static getSettings(): CompanySettings {
    return this.getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  public static saveSettings(settings: CompanySettings, user?: User): CompanySettings {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
    if (user) {
      this.logAudit(user, 'Settings Updated', 'Settings', 'global', 'Company Settings');
    }
    return settings;
  }

  public static updateSettings(settings: CompanySettings, user: User): CompanySettings {
    return this.saveSettings(settings, user);
  }

  public static resetToSeedData(): void {
    localStorage.clear();
    this.setItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
    this.setItem(STORAGE_KEYS.CURRENT_USER, DEFAULT_USERS[0]);
    this.setItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    this.setItem(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
    this.setItem(STORAGE_KEYS.SITES, DEFAULT_SITES);
    this.setItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, DEFAULT_PURCHASE_ORDERS);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    this.setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    this.setItem(STORAGE_KEYS.PRODUCT_REQUESTS, DEFAULT_PRODUCT_REQUESTS);
  }

  // Product Requests
  public static getProductRequests(): ProductRequest[] {
    return this.getItem(STORAGE_KEYS.PRODUCT_REQUESTS, DEFAULT_PRODUCT_REQUESTS);
  }

  public static saveProductRequest(req: ProductRequest, user?: User): ProductRequest {
    const requests = this.getProductRequests();
    const index = requests.findIndex((r) => r.id === req.id);
    if (index >= 0) {
      requests[index] = req;
    } else {
      requests.unshift(req);
    }
    this.setItem(STORAGE_KEYS.PRODUCT_REQUESTS, requests);

    // Also trigger notification for Admins/Supervisors if new
    if (index < 0) {
      const now = new Date();
      this.addNotification({
        id: `notif-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0].substring(0, 5),
        type: 'PRODUCT_REQUEST',
        message: `Unregistered Product Request: "${req.productName}" submitted by ${req.requestedByUserName} (${req.siteName || 'Site'}).`,
        read: false,
        severity: req.urgency === 'URGENT' ? 'error' : req.urgency === 'HIGH' ? 'warning' : 'info',
      });
    }

    if (user) {
      this.logAudit(
        user,
        index >= 0 ? 'Update Product Request' : 'Submit Unregistered Product Request',
        'Product',
        req.id,
        req.productName
      );
    }
    saveToFirestore('productRequests', req);
    return req;
  }

  public static deleteProductRequest(id: string): void {
    const requests = this.getProductRequests().filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.PRODUCT_REQUESTS, requests);
    deleteFromFirestore('productRequests', id);
  }

  // Deep Cleaning Teams & Roster Management (Foreman, Supervisors, Admin)
  public static getDeepCleaningTeamMembers(): string[] {
    const members = this.getItem<string[]>(STORAGE_KEYS.DEEP_CLEANING_TEAM_MEMBERS, []);
    if (!members || members.length === 0) {
      this.setItem(STORAGE_KEYS.DEEP_CLEANING_TEAM_MEMBERS, DEFAULT_DEEP_CLEANING_MEMBERS);
      return DEFAULT_DEEP_CLEANING_MEMBERS;
    }
    return members;
  }

  public static saveDeepCleaningTeamMembers(members: string[], user?: User): string[] {
    const uniqueMembers = Array.from(new Set(members.map((m) => m.trim()).filter(Boolean)));
    this.setItem(STORAGE_KEYS.DEEP_CLEANING_TEAM_MEMBERS, uniqueMembers);
    if (user) {
      this.logAudit(user, 'Updated Deep Cleaning Roster', 'Settings', 'deep-cleaning-roster', `Total: ${uniqueMembers.length} members`);
    }
    saveToFirestore('deepCleaningRoster', { id: 'roster', members: uniqueMembers, updatedAt: new Date().toISOString() });
    return uniqueMembers;
  }

  public static addDeepCleaningTeamMember(name: string, user?: User): string[] {
    const members = this.getDeepCleaningTeamMembers();
    const trimmed = name.trim();
    if (!trimmed || members.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      return members;
    }
    const updated = [...members, trimmed];
    return this.saveDeepCleaningTeamMembers(updated, user);
  }

  public static removeDeepCleaningTeamMember(name: string, user?: User): string[] {
    const members = this.getDeepCleaningTeamMembers();
    const updated = members.filter((m) => m.toLowerCase() !== name.trim().toLowerCase());
    return this.saveDeepCleaningTeamMembers(updated, user);
  }

  public static getDeepCleaningTeams(): DeepCleaningTeam[] {
    const teams = this.getItem<DeepCleaningTeam[]>(STORAGE_KEYS.DEEP_CLEANING_TEAMS, []);
    if (!teams || teams.length === 0) {
      this.setItem(STORAGE_KEYS.DEEP_CLEANING_TEAMS, DEFAULT_DEEP_CLEANING_TEAMS);
      return DEFAULT_DEEP_CLEANING_TEAMS;
    }
    return teams;
  }

  public static saveDeepCleaningTeams(teams: DeepCleaningTeam[], user?: User): DeepCleaningTeam[] {
    this.setItem(STORAGE_KEYS.DEEP_CLEANING_TEAMS, teams);
    if (user) {
      this.logAudit(user, 'Updated Deep Cleaning Teams', 'Settings', 'deep-cleaning-teams', `Total Teams: ${teams.length}`);
    }
    return teams;
  }

  public static saveDeepCleaningTeam(team: DeepCleaningTeam, user?: User): DeepCleaningTeam {
    const teams = this.getDeepCleaningTeams();
    const index = teams.findIndex((t) => t.id === team.id);
    const now = new Date().toISOString();
    const prepared: DeepCleaningTeam = {
      ...team,
      createdAt: team.createdAt || now,
    };

    if (index >= 0) {
      teams[index] = prepared;
    } else {
      teams.unshift(prepared);
    }

    this.setItem(STORAGE_KEYS.DEEP_CLEANING_TEAMS, teams);
    if (user) {
      this.logAudit(
        user,
        index >= 0 ? 'Update Deep Cleaning Team' : 'Create Deep Cleaning Team',
        'Settings',
        team.id,
        team.name,
        index >= 0 ? 'Updated team composition' : undefined,
        `Members: ${team.members.join(', ')}`
      );
    }
    saveToFirestore('deepCleaningTeams', prepared);

    // Also ensure all team members are in the general deep cleaning roster
    const currentRoster = this.getDeepCleaningTeamMembers();
    const newMembers = team.members.filter((m) => !currentRoster.some((r) => r.toLowerCase() === m.toLowerCase()));
    if (newMembers.length > 0) {
      this.saveDeepCleaningTeamMembers([...currentRoster, ...newMembers]);
    }

    return prepared;
  }

  public static deleteDeepCleaningTeam(id: string, user?: User): void {
    const teams = this.getDeepCleaningTeams();
    const target = teams.find((t) => t.id === id);
    const filtered = teams.filter((t) => t.id !== id);
    this.setItem(STORAGE_KEYS.DEEP_CLEANING_TEAMS, filtered);
    deleteFromFirestore('deepCleaningTeams', id);

    if (user && target) {
      this.logAudit(user, 'Delete Deep Cleaning Team', 'Settings', id, target.name);
    }
  }

  // Deep Cleaning Tasks (Special Dedicated Team)
  public static getDeepCleaningTasks(): DeepCleaningTask[] {
    const tasks = this.getItem<DeepCleaningTask[]>(STORAGE_KEYS.DEEP_CLEANING_TASKS, []);
    if (tasks.length === 0 && DEFAULT_DEEP_CLEANING_TASKS.length > 0) {
      this.setItem(STORAGE_KEYS.DEEP_CLEANING_TASKS, DEFAULT_DEEP_CLEANING_TASKS);
      return DEFAULT_DEEP_CLEANING_TASKS;
    }
    return tasks;
  }

  public static saveDeepCleaningTask(task: DeepCleaningTask, user?: User | null): DeepCleaningTask {
    const tasks = this.getDeepCleaningTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    const now = new Date().toISOString();

    const preparedTask: DeepCleaningTask = {
      ...task,
      updatedAt: now,
    };

    if (index >= 0) {
      tasks[index] = preparedTask;
    } else {
      tasks.unshift(preparedTask);
    }

    // Prioritized cleaning task notification
    const isUrgent = task.priority === 'URGENT';
    const isHigh = task.priority === 'HIGH';
    const assignedStr = task.assignedMembers && task.assignedMembers.length > 0
      ? ` | Assigned: ${task.assignedMembers.join(', ')}`
      : '';

    this.addNotification({
      id: `notif-dc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: now.split('T')[0],
      time: now.split('T')[1].substring(0, 5),
      type: 'DEEP_CLEANING',
      isPriority: true,
      severity: isUrgent ? 'error' : isHigh ? 'warning' : 'info',
      relatedTaskId: preparedTask.id,
      relatedTab: 'deep-cleaning',
      message: isUrgent
        ? `🚨 [URGENT CLEANING TASK] "${task.title}" at ${task.location}. Deadline: ${task.deadlineDate} ${task.deadlineTime || '17:00'}${assignedStr}`
        : index >= 0
        ? `✨ [UPDATED TASK] "${task.title}" scheduled for ${task.whenDate} (${task.location})${assignedStr}`
        : `✨ [NEW DEEP CLEANING TASK] "${task.title}" scheduled for ${task.whenDate} (${task.location})${assignedStr}`,
      read: false,
    });

    this.setItem(STORAGE_KEYS.DEEP_CLEANING_TASKS, tasks);

    if (user) {
      this.logAudit(
        user,
        index >= 0 ? 'Update Deep Cleaning Task' : 'Create Deep Cleaning Task',
        'Transaction',
        task.id,
        task.title,
        index >= 0 ? 'Status: ' + tasks[index]?.status : undefined,
        'Status: ' + task.status
      );
    }

    saveToFirestore('deepCleaningTasks', preparedTask);
    return preparedTask;
  }

  public static updateDeepCleaningTaskStatus(
    taskId: string,
    status: DeepCleaningTaskStatus,
    user: User,
    notes?: string
  ): DeepCleaningTask | null {
    const tasks = this.getDeepCleaningTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const prevStatus = task.status;
    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (status === 'DONE') {
      task.completedAt = new Date().toISOString();
      task.completedByUserId = user.id;
      task.completedByUserName = user.name;
      if (notes) {
        task.completionNotes = notes;
      }
      this.addNotification({
        id: `notif-dc-done-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toISOString().split('T')[1].substring(0, 5),
        type: 'DEEP_CLEANING',
        isPriority: true,
        severity: 'success',
        relatedTaskId: task.id,
        relatedTab: 'deep-cleaning',
        message: `✅ [TASK COMPLETED] "${task.title}" marked DONE and signed off by ${user.name}.`,
        read: false,
      });
    } else if (status === 'IN_PROGRESS') {
      task.completedAt = undefined;
      task.completedByUserId = undefined;
      task.completedByUserName = undefined;
      this.addNotification({
        id: `notif-dc-prog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toISOString().split('T')[1].substring(0, 5),
        type: 'DEEP_CLEANING',
        isPriority: true,
        severity: 'info',
        relatedTaskId: task.id,
        relatedTab: 'deep-cleaning',
        message: `🚀 [IN PROGRESS] "${task.title}" is now active and in progress by ${user.name}.`,
        read: false,
      });
    } else {
      task.completedAt = undefined;
      task.completedByUserId = undefined;
      task.completedByUserName = undefined;
    }

    this.setItem(STORAGE_KEYS.DEEP_CLEANING_TASKS, tasks);
    this.logAudit(
      user,
      status === 'DONE' ? 'Mark Task Done' : `Task Status: ${status}`,
      'Transaction',
      task.id,
      task.title,
      `Previous: ${prevStatus}`,
      `Current: ${status}${notes ? ` (${notes})` : ''}`
    );

    saveToFirestore('deepCleaningTasks', task);
    return task;
  }

  public static deleteDeepCleaningTask(id: string, user?: User | null): void {
    const tasks = this.getDeepCleaningTasks();
    const target = tasks.find((t) => t.id === id);
    const filtered = tasks.filter((t) => t.id !== id);
    this.setItem(STORAGE_KEYS.DEEP_CLEANING_TASKS, filtered);
    deleteFromFirestore('deepCleaningTasks', id);

    if (user && target) {
      this.logAudit(user, 'Delete Deep Cleaning Task', 'Transaction', id, target.title);
    }
  }
}

export const DEFAULT_DEEP_CLEANING_MEMBERS: string[] = [
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

export const DEFAULT_DEEP_CLEANING_TEAMS: DeepCleaningTeam[] = [
  {
    id: 'team-dc-1',
    name: 'Alpha Deep Cleaning Squad',
    leader: 'Pasi Ylitalo',
    members: ['Pasi Ylitalo', 'Dayan', 'Eranga', 'Subashana', 'Ashen'],
    notes: 'Primary heavy furniture removal, staging, and high-pressure rotary floor stripping team.',
    createdAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'team-dc-2',
    name: 'Specialized Carpet & Extraction Crew',
    leader: 'Pubudu',
    members: ['Pubudu', 'Ujitha', 'Szabina', 'Koshitha', 'Yugan'],
    notes: 'Hot-water extraction, boardroom conference setups, and high-care sanitization specialists.',
    createdAt: '2026-08-01T08:00:00.000Z',
  },
];

export const DEFAULT_DEEP_CLEANING_TASKS: DeepCleaningTask[] = [
  {
    id: 'task-dc-1',
    taskCode: 'DCT-2026-001',
    title: 'Urgent Furniture Moval & Executive Suite Deep Stripping',
    taskType: 'GENERAL_FURNITURE_REMOVAL',
    location: 'Site A (HQ Main Tower) - 3rd Floor Executive Suite & Zone B',
    siteId: 'site-1',
    siteName: 'Site A (HQ Main Tower)',
    clientName: 'Nordic Corporate Facilities Management',
    whenDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    deadlineDate: new Date().toISOString().split('T')[0],
    deadlineTime: '15:30',
    repeatFrequency: 'NONE',
    description: 'Relocate 24 modular workstations, pedestals and heavy conference storage. High-pressure stripping and protective felt pad placement prior to floor handover.',
    assignedMembers: ['Pasi Ylitalo', 'Dayan', 'Ashen', 'Yugan', 'Ujitha'],
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    specialToolsEquipment: ['Heavy-duty Furniture Dolly', 'Felt Sliders', 'Single-disc Rotary Machine', 'Corner Guards'],
    createdByUserId: 'usr-pasi',
    createdByUserName: 'Pasi Ylitalo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-dc-2',
    taskCode: 'DCT-2026-002',
    title: 'Conference Room Furniture Removal & Carpet Deep Extraction',
    taskType: 'CONFERENCE_ROOM_FURNITURE_REMOVAL',
    location: 'Office Building A (Tech Hub) - Boardroom 4A & Meeting Suite 4B',
    siteId: 'site-3',
    siteName: 'Office Building A (Tech Hub)',
    clientName: 'Tech Hub Executive Board',
    whenDate: new Date().toISOString().split('T')[0],
    startTime: '13:00',
    deadlineDate: new Date().toISOString().split('T')[0],
    deadlineTime: '18:00',
    repeatFrequency: 'NONE',
    description: 'Clear out massive boardroom conference table modular sections, AV cabling channels, 16 leather conference chairs and credenzas to hallway storage. Perform industrial hot-water carpet extraction and sanitize all touchpoints.',
    assignedMembers: ['Eranga', 'Subashana', 'Koshitha', 'Pubudu'],
    priority: 'URGENT',
    status: 'PENDING',
    specialToolsEquipment: ['Industrial Carpet Extractor', 'Kärcher Vacuum', 'Furniture Dollies', 'Hex Key Tool Kit'],
    createdByUserId: 'usr-eranga',
    createdByUserName: 'Eranga',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-dc-3',
    taskCode: 'DCT-2026-003',
    title: 'Weekly High-Level Dusting & Ventilation Grille Deep Degreasing',
    taskType: 'REPEAT_TASK',
    location: 'Shopping Centre (Grand Galleria) - Atrium & Food Court Exhausts',
    siteId: 'site-4',
    siteName: 'Shopping Centre (Grand Galleria)',
    clientName: 'Grand Galleria Operations Ltd',
    whenDate: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    deadlineDate: new Date().toISOString().split('T')[0],
    deadlineTime: '10:00',
    repeatFrequency: 'WEEKLY',
    description: 'Scheduled weekly repeat task: Telescopic pole dusting on ceiling architecture, skylight ledges, and deep degreasing of food court intake grilles before retail opening hours.',
    assignedMembers: ['Ashen', 'Szabina', 'Pasi Ylitalo'],
    priority: 'MEDIUM',
    status: 'DONE',
    completedAt: new Date().toISOString(),
    completedByUserId: 'emp-ashen',
    completedByUserName: 'Ashen',
    completionNotes: 'All atrium skylights and 8 intake grilles completely degreased and inspected by Galleria duty manager.',
    specialToolsEquipment: ['Telescopic Carbon Extension Poles', 'Steam Degreaser Machine', 'Safety Harness'],
    createdByUserId: 'emp-ashen',
    createdByUserName: 'Ashen',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-dc-4',
    taskCode: 'DCT-2026-004',
    title: 'Commercial Kitchen Deep Degreasing & Floor Rotary Scrubbing',
    taskType: 'DEEP_CLEANING',
    location: 'Hotel (Grand Horizon Hotel) - Main Banquet Kitchen & Dish Prep',
    siteId: 'site-6',
    siteName: 'Hotel (Grand Horizon Hotel)',
    clientName: 'Grand Horizon Hospitality Management',
    whenDate: new Date().toISOString().split('T')[0],
    startTime: '20:00',
    deadlineDate: new Date().toISOString().split('T')[0],
    deadlineTime: '23:30',
    repeatFrequency: 'NONE',
    description: 'Overnight intensive deep clean: Stainless steel canopy degreasing, drain pressure jetting, tile wall alkaline wash, and heavy single-disc rotary machine scrub with wet-vac slurry recovery.',
    assignedMembers: ['Pubudu', 'Dayan', 'Eranga', 'Pasi Ylitalo', 'Ujitha', 'Yugan'],
    priority: 'URGENT',
    status: 'PENDING',
    specialToolsEquipment: ['Single-disc Rotary Machine', 'Wet Vacuum Extractor', 'High-Pressure Steam Lance', 'Alkaline Foam Gun'],
    createdByUserId: 'usr-1',
    createdByUserName: 'Pubudu',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_PRODUCT_REQUESTS: ProductRequest[] = [
  {
    id: 'req-1',
    productName: 'Heavy-Duty Degreaser Spray 5L',
    category: 'Chemicals',
    brand: 'KW Professional',
    suggestedSupplier: 'KW Professional Supplies',
    siteId: 'site-1',
    siteName: 'Helsinki Central Station',
    estimatedQuantity: 5,
    unit: 'Bottle',
    reason: 'Frequent stubborn grease on platform tiles needs concentrated degreaser spray not currently in system stock list.',
    urgency: 'HIGH',
    requestedByUserId: 'usr-3',
    requestedByUserName: 'Mikko Laine',
    requestedByUserRole: 'EMPLOYEE',
    createdAt: '2026-08-09T14:30:00.000Z',
    status: 'PENDING',
  },
  {
    id: 'req-2',
    productName: 'Microfiber Floor Mop Pads - Yellow',
    category: 'KW Products',
    brand: 'PaperFlex',
    suggestedSupplier: 'PaperFlex Products',
    siteId: 'site-2',
    siteName: 'Espoo Hospital Ward B',
    estimatedQuantity: 20,
    unit: 'Piece',
    reason: 'Color-coded yellow pads required for isolation area sanitation standards.',
    urgency: 'URGENT',
    requestedByUserId: 'usr-2',
    requestedByUserName: 'Sanna Virtanen',
    requestedByUserRole: 'SUPERVISOR',
    createdAt: '2026-08-10T09:15:00.000Z',
    status: 'PENDING',
  },
];
