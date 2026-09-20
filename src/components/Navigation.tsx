import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  MapPin,
  Lock,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const CANONICAL_NAV_MAP: Record<string, string> = {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    budgets: 'Budget',
    resources: 'Resources',
    vault: 'Documents',
    education: 'Learn Finance',
    admin: 'Admin Portal',
  };

  const resolveNavLabel = (id: string, key: string): string => {
    const canonical = CANONICAL_NAV_MAP[id] || 'Dashboard';
    const translated = t(key);
    if (!translated || translated === key || translated.startsWith('nav_')) {
      return canonical;
    }
    return translated;
  };

  const navItems = [
    { id: 'dashboard', label: resolveNavLabel('dashboard', 'nav_dashboard'), icon: LayoutDashboard },
    { id: 'transactions', label: resolveNavLabel('transactions', 'nav_transactions'), icon: ReceiptText },
    { id: 'budgets', label: resolveNavLabel('budgets', 'nav_budgets'), icon: PieChart },
    { id: 'resources', label: resolveNavLabel('resources', 'nav_resources'), icon: MapPin },
    { id: 'vault', label: resolveNavLabel('vault', 'nav_vault'), icon: Lock },
    { id: 'education', label: resolveNavLabel('education', 'nav_education'), icon: GraduationCap },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: resolveNavLabel('admin', 'nav_admin'),
      icon: ShieldCheck,
    });
  }

  return (
    <>
      {/* Desktop Top Sub-Bar Navigation */}
      <nav className="hidden md:block bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAdminTab = item.id === 'admin';

              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? isAdminTab
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/20'
                      : isAdminTab
                      ? 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-bottom">
        <div className="grid grid-cols-6 h-16">
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-medium leading-none tracking-tight truncate w-full text-center px-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
