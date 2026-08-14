import React, { useState, useEffect } from 'react';
import { Sparkles, Store, ChevronRight } from 'lucide-react';
import { User, Product, isUserInDeepCleaningTeam } from './types';
import {
  StorageService,
  DEFAULT_PRODUCTS,
  DEFAULT_CATEGORIES,
  DEFAULT_SUPPLIERS,
  DEFAULT_SITES,
  DEFAULT_USERS,
  DEFAULT_DEEP_CLEANING_TASKS,
  DEFAULT_DEEP_CLEANING_MEMBERS,
  DEFAULT_DEEP_CLEANING_TEAMS,
} from './lib/storage';
import { testFirestoreConnection } from './lib/firebase';
import { subscribeToCollection, initializeFirestoreFromLocal } from './lib/firestoreSync';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { QRScannerModal } from './components/QRScannerModal';

// Views
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { StockIssueView } from './views/StockIssueView';
import { StockReceiveView } from './views/StockReceiveView';
import { StockAdjustmentView } from './views/StockAdjustmentView';
import { ReorderView } from './views/ReorderView';
import { TransactionsView } from './views/TransactionsView';
import { EmployeesView } from './views/EmployeesView';
import { SitesView } from './views/SitesView';
import { ReportsView } from './views/ReportsView';
import { AuditLogView } from './views/AuditLogView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { DeepCleaningView } from './views/DeepCleaningView';

import { PasswordAuthModal } from './components/PasswordAuthModal';

export function App() {
  const users = StorageService.getUsers();
  
  // First page requirement: Defaults to null/logged out so Login screen is always the first page shown
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(true);

  // Second page requirement: default to deep-cleaning (most important) or dashboard (grocery store)
  const [activeTab, setActiveTab] = useState<string>('deep-cleaning');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState<boolean>(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [, setSyncTick] = useState<number>(0);

  // Authentication State
  const [pendingSwitchUser, setPendingSwitchUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Initialize Storage and Firebase Cloud Sync
  useEffect(() => {
    StorageService.initialize();

    // Verify Firestore connection
    testFirestoreConnection();

    // Seed Cloud Firestore with initial default data if empty or missing catalog items
    initializeFirestoreFromLocal('products', 'cleanstock_products', DEFAULT_PRODUCTS);
    initializeFirestoreFromLocal('categories', 'cleanstock_categories', DEFAULT_CATEGORIES);
    initializeFirestoreFromLocal('suppliers', 'cleanstock_suppliers', DEFAULT_SUPPLIERS);
    initializeFirestoreFromLocal('sites', 'cleanstock_sites', DEFAULT_SITES);
    initializeFirestoreFromLocal('transactions', 'cleanstock_transactions', StorageService.getTransactions());
    initializeFirestoreFromLocal('reorderRequests', 'cleanstock_purchase_orders', StorageService.getPurchaseOrders());
    initializeFirestoreFromLocal('auditLogs', 'cleanstock_audit_logs', StorageService.getAuditLogs());
    initializeFirestoreFromLocal('notifications', 'cleanstock_notifications', StorageService.getNotifications());
    initializeFirestoreFromLocal('users', 'cleanstock_users', DEFAULT_USERS);
    initializeFirestoreFromLocal('productRequests', 'cleanstock_product_requests', StorageService.getProductRequests());
    initializeFirestoreFromLocal('deepCleaningTasks', 'cleanstock_deep_cleaning_tasks', DEFAULT_DEEP_CLEANING_TASKS);
    initializeFirestoreFromLocal('deepCleaningTeams', 'cleanstock_deep_cleaning_teams', DEFAULT_DEEP_CLEANING_TEAMS);
    initializeFirestoreFromLocal('deepCleaningTeamMembers', 'cleanstock_deep_cleaning_team_members', DEFAULT_DEEP_CLEANING_MEMBERS);

    // Subscribe to real-time updates from Firestore
    const unsubProducts = subscribeToCollection('products', 'cleanstock_products');
    const unsubCategories = subscribeToCollection('categories', 'cleanstock_categories');
    const unsubSuppliers = subscribeToCollection('suppliers', 'cleanstock_suppliers');
    const unsubSites = subscribeToCollection('sites', 'cleanstock_sites');
    const unsubTransactions = subscribeToCollection('transactions', 'cleanstock_transactions');
    const unsubOrders = subscribeToCollection('reorderRequests', 'cleanstock_purchase_orders');
    const unsubLogs = subscribeToCollection('auditLogs', 'cleanstock_audit_logs');
    const unsubNotifs = subscribeToCollection('notifications', 'cleanstock_notifications');
    const unsubUsers = subscribeToCollection('users', 'cleanstock_users');
    const unsubRequests = subscribeToCollection('productRequests', 'cleanstock_product_requests');
    const unsubDeepCleaning = subscribeToCollection('deepCleaningTasks', 'cleanstock_deep_cleaning_tasks');
    const unsubDeepTeams = subscribeToCollection('deepCleaningTeams', 'cleanstock_deep_cleaning_teams');
    const unsubDeepMembers = subscribeToCollection('deepCleaningTeamMembers', 'cleanstock_deep_cleaning_team_members');

    const handleDataUpdate = () => {
      setSyncTick((prev) => prev + 1);
    };

    window.addEventListener('cleanstock_data_updated', handleDataUpdate);

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSuppliers();
      unsubSites();
      unsubTransactions();
      unsubOrders();
      unsubLogs();
      unsubNotifs();
      unsubUsers();
      unsubRequests();
      unsubDeepCleaning();
      unsubDeepTeams();
      unsubDeepMembers();
      window.removeEventListener('cleanstock_data_updated', handleDataUpdate);
    };
  }, []);

  const notifications = currentUser
    ? StorageService.getNotificationsForUser(currentUser)
    : StorageService.getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const handleInitiateSwitchUser = (user: User) => {
    if (currentUser && user.id === currentUser.id) return;
    setPendingSwitchUser(user);
    setIsAuthModalOpen(true);
  };

  const handleConfirmSwitchUser = (user: User) => {
    setCurrentUser(user);
    setIsLoggedOut(false);
    StorageService.setCurrentUser(user);
    StorageService.logAudit(user, 'User Login', 'User', user.id, user.name);
    setIsAuthModalOpen(false);
    setPendingSwitchUser(null);
  };

  const handleLogout = () => {
    if (currentUser) {
      StorageService.logAudit(currentUser, 'User Logout', 'User', currentUser.id, currentUser.name);
    }
    StorageService.setCurrentUser(null);
    setIsLoggedOut(true);
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoggedOut(false);
    // When logging in, route to Deep Cleaning if user is part of the deep cleaning team, otherwise route to dashboard/stock-out
    if (isUserInDeepCleaningTeam(user)) {
      setActiveTab('deep-cleaning');
    } else if (user.role === 'EMPLOYEE') {
      setActiveTab('stock-out');
    } else {
      setActiveTab('dashboard');
    }
    StorageService.setCurrentUser(user);
    StorageService.logAudit(user, 'User Login', 'User', user.id, user.name);
  };

  const handleGlobalScanSuccess = (prod: Product) => {
    setScannedProduct(prod);
    setActiveTab('stock-out'); // Route directly to stock issue workflow for fast <30s checkouts!
  };

  const canAccessDeepCleaning = isUserInDeepCleaningTeam(currentUser);

  // Auto-redirect if non-team member tries to view deep cleaning
  useEffect(() => {
    if (currentUser && !canAccessDeepCleaning && activeTab === 'deep-cleaning') {
      setActiveTab(currentUser.role === 'EMPLOYEE' ? 'stock-out' : 'dashboard');
    }
  }, [currentUser, canAccessDeepCleaning, activeTab]);

  // 1. FIRST PAGE: Render dedicated Login View if user is not authenticated
  if (isLoggedOut || !currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const isDeepCleaningActive = activeTab === 'deep-cleaning';
  const isGroceryStoreActive = activeTab !== 'deep-cleaning';

  // 2. SECOND PAGE: Authenticated application with primary hub tabs at the top
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        unreadNotificationCount={unreadCount}
        onOpenScanner={() => setIsGlobalScannerOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onSelectNotifications={() => setActiveTab('notifications')}
        onSwitchUser={handleInitiateSwitchUser}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          currentUserRole={currentUser.role}
          currentUser={currentUser}
          unreadCount={unreadCount}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 transition-all duration-200 max-w-7xl mx-auto w-full">
          
          {/* PRIMARY HEADER SWITCHER: 
              Tab 1: Deep Cleaning (Only accessible for Deep Cleaning Team Members) 
              Tab 2: Grocery Store
          */}
          <div className="mb-6 rounded-2xl bg-white border border-slate-200/90 p-2.5 shadow-sm space-y-2">
            <div className={`grid gap-2.5 ${canAccessDeepCleaning ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {/* TAB 1: DEEP CLEANING (LIGHT PURPLE THEME - RESTRICTED TO DEEP CLEANING TEAM) */}
              {canAccessDeepCleaning && (
                <button
                  id="tab-deep-cleaning-hub"
                  onClick={() => handleNavigate('deep-cleaning')}
                  className={`relative flex items-center justify-between rounded-xl p-3.5 sm:p-4 text-left transition-all group ${
                    isDeepCleaningActive
                      ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-lg shadow-purple-600/30 border-2 border-purple-300 ring-2 ring-purple-400/20'
                      : 'bg-purple-50/80 hover:bg-purple-100/90 text-purple-950 border border-purple-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black transition ${
                        isDeepCleaningActive
                          ? 'bg-white text-purple-700 shadow-md'
                          : 'bg-purple-600 text-white group-hover:scale-105 shadow-sm'
                      }`}
                    >
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm sm:text-base tracking-tight leading-none">
                          Deep Cleaning
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            isDeepCleaningActive
                              ? 'bg-white text-purple-700 shadow-xs'
                              : 'bg-purple-200 text-purple-900 border border-purple-300'
                          }`}
                        >
                          TEAM ACCESS
                        </span>
                      </div>
                      <p
                        className={`text-[11px] font-medium mt-1 ${
                          isDeepCleaningActive ? 'text-purple-100' : 'text-purple-700'
                        }`}
                      >
                        Specialized Tasks, Deadlines, Crew Rostering &amp; Operations
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center space-x-1">
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${
                        isDeepCleaningActive
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-200/80 text-purple-900'
                      }`}
                    >
                      {isDeepCleaningActive ? 'ACTIVE' : 'OPEN'}
                    </span>
                  </div>
                </button>
              )}

              {/* TAB 2: GROCERY STORE */}
              <button
                id="tab-grocery-store-hub"
                onClick={() => handleNavigate('dashboard')}
                className={`relative flex items-center justify-between rounded-xl p-3.5 sm:p-4 text-left transition-all group ${
                  isGroceryStoreActive
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/30 border-2 border-emerald-400 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black transition ${
                      isGroceryStoreActive
                        ? 'bg-white text-emerald-700 shadow-md'
                        : 'bg-emerald-600 text-white group-hover:scale-105 shadow-sm'
                    }`}
                  >
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm sm:text-base tracking-tight leading-none">
                        Grocery Store
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-medium mt-1 ${
                        isGroceryStoreActive ? 'text-emerald-100' : 'text-slate-500'
                      }`}
                    >
                      Inventory, Stock In/Out, PO Approvals &amp; Reports
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex items-center space-x-1">
                  <span
                    className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${
                      isGroceryStoreActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isGroceryStoreActive ? 'ACTIVE' : 'OPEN'}
                  </span>
                </div>
              </button>
            </div>

            {/* Subview Breadcrumb if user is in a Grocery Store Sub-View (e.g. Products, Reorders, Reports) */}
            {isGroceryStoreActive && activeTab !== 'dashboard' && (
              <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-600 border-t border-slate-100">
                <div className="flex items-center space-x-1.5 font-medium">
                  <Store className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Grocery Store</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-black text-slate-900 capitalize">
                    {activeTab.replace('-', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline text-xs"
                >
                  &larr; Back to Grocery Store Dashboard
                </button>
              </div>
            )}
          </div>

          {/* DEDICATED SEPARATE DASHBOARDS & VIEWS */}
          {activeTab === 'deep-cleaning' && (
            <DeepCleaningView currentUser={currentUser} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onOpenScanner={() => setIsGlobalScannerOpen(true)}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              currentUser={currentUser}
              onOpenScanner={() => setIsGlobalScannerOpen(true)}
              onSelectProductForIssue={(prod) => {
                setScannedProduct(prod);
                setActiveTab('stock-out');
              }}
            />
          )}

          {activeTab === 'stock-out' && (
            <StockIssueView
              currentUser={currentUser}
              onOpenScanner={() => setIsGlobalScannerOpen(true)}
              preselectedProduct={scannedProduct}
            />
          )}

          {activeTab === 'stock-in' && (
            <StockReceiveView
              currentUser={currentUser}
              onOpenScanner={() => setIsGlobalScannerOpen(true)}
            />
          )}

          {(activeTab === 'stock-adjustment' || activeTab === 'adjustment') && (
            <StockAdjustmentView currentUser={currentUser} />
          )}

          {activeTab === 'reorder' && (
            <ReorderView currentUser={currentUser} />
          )}

          {activeTab === 'transactions' && <TransactionsView />}

          {activeTab === 'employees' && <EmployeesView currentUser={currentUser} />}

          {activeTab === 'sites' && <SitesView currentUser={currentUser} />}

          {activeTab === 'reports' && <ReportsView currentUser={currentUser} />}

          {(activeTab === 'audit-logs' || activeTab === 'audit') && <AuditLogView />}

          {activeTab === 'notifications' && (
            <NotificationsView
              currentUser={currentUser}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'settings' && <SettingsView currentUser={currentUser} />}
        </main>
      </div>

      {/* Global Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isGlobalScannerOpen}
        onClose={() => setIsGlobalScannerOpen(false)}
        onScanSuccess={handleGlobalScanSuccess}
      />

      {/* Password & Authority Verification Modal */}
      <PasswordAuthModal
        isOpen={isAuthModalOpen}
        targetUser={pendingSwitchUser}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingSwitchUser(null);
        }}
        onSuccess={handleConfirmSwitchUser}
      />
    </div>
  );
}
export default App;
