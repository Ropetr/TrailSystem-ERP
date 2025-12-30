// =============================================
// TRAILSYSTEM ERP - Admin Sidebar (Softwarehouse)
// Painel de administração para gerenciar clientes/tenants
// =============================================

import React from 'react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// Estilo dos ícones - vermelho puro (consistente com ERP)
const neonIconClass = "w-5 h-5 text-red-500";

// Ícones SVG inline
const Icons = {
  home: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  users: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  layers: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  creditCard: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  key: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
  sliders: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
  shield: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  plug: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  support: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  activity: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  megaphone: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  chart: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  clipboard: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  cog: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  logout: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
};

interface SubMenuItem { label: string; path: string; }
interface MenuItem { id: string; label: string; icon: React.ReactNode; path?: string; children?: SubMenuItem[]; }

// Menu items para o Admin Softwarehouse (baseado na especificação de 14 seções)
const adminMenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.home, path: '/admin' },
  { id: 'clientes', label: 'Clientes', icon: Icons.users, children: [
    { label: 'Lista de Clientes', path: '/admin/clientes' },
    { label: 'Novo Cliente', path: '/admin/clientes/novo' },
  ]},
  { id: 'catalogo', label: 'Catálogo', icon: Icons.layers, children: [
    { label: 'Módulos', path: '/admin/catalogo/modulos' },
    { label: 'Planos', path: '/admin/catalogo/planos' },
    { label: 'Add-ons', path: '/admin/catalogo/addons' },
  ]},
  { id: 'billing', label: 'Billing', icon: Icons.creditCard, children: [
    { label: 'Assinaturas', path: '/admin/billing/assinaturas' },
    { label: 'Faturas', path: '/admin/billing/faturas' },
    { label: 'Pagamentos', path: '/admin/billing/pagamentos' },
  ]},
  { id: 'licenciamento', label: 'Licenciamento', icon: Icons.key, children: [
    { label: 'Ativações', path: '/admin/licenciamento/ativacoes' },
    { label: 'Provisionamento', path: '/admin/licenciamento/provisionamento' },
  ]},
  { id: 'parametrizacoes', label: 'Parametrizações', icon: Icons.sliders, children: [
    { label: 'Templates', path: '/admin/parametrizacoes/templates' },
    { label: 'Overrides', path: '/admin/parametrizacoes/overrides' },
  ]},
  { id: 'seguranca', label: 'Segurança', icon: Icons.shield, children: [
    { label: 'Usuários Admin', path: '/admin/seguranca/usuarios' },
    { label: 'Papéis', path: '/admin/seguranca/papeis' },
    { label: 'Sessões', path: '/admin/seguranca/sessoes' },
  ]},
  { id: 'integracoes', label: 'Integrações', icon: Icons.plug, children: [
    { label: 'Gateways', path: '/admin/integracoes/gateways' },
    { label: 'Credenciais', path: '/admin/integracoes/credenciais' },
    { label: 'Webhooks', path: '/admin/integracoes/webhooks' },
  ]},
  { id: 'suporte', label: 'Suporte', icon: Icons.support, children: [
    { label: 'Tickets', path: '/admin/suporte/tickets' },
    { label: 'Playbooks', path: '/admin/suporte/playbooks' },
    { label: 'Ferramentas', path: '/admin/suporte/ferramentas' },
  ]},
  { id: 'monitoramento', label: 'Monitoramento', icon: Icons.activity, children: [
    { label: 'Saúde do Sistema', path: '/admin/monitoramento/saude' },
    { label: 'Uso por Cliente', path: '/admin/monitoramento/uso' },
    { label: 'Alertas', path: '/admin/monitoramento/alertas' },
  ]},
  { id: 'comunicacao', label: 'Comunicação', icon: Icons.megaphone, children: [
    { label: 'Notificações', path: '/admin/comunicacao/notificacoes' },
    { label: 'Release Notes', path: '/admin/comunicacao/releases' },
  ]},
  { id: 'relatorios', label: 'Relatórios', icon: Icons.chart, children: [
    { label: 'MRR/ARR', path: '/admin/relatorios/mrr' },
    { label: 'Churn', path: '/admin/relatorios/churn' },
    { label: 'Inadimplência', path: '/admin/relatorios/inadimplencia' },
  ]},
  { id: 'auditoria', label: 'Auditoria', icon: Icons.clipboard, children: [
    { label: 'Logs', path: '/admin/auditoria/logs' },
    { label: 'LGPD', path: '/admin/auditoria/lgpd' },
  ]},
  { id: 'configuracoes', label: 'Configurações', icon: Icons.cog, children: [
    { label: 'Geral', path: '/admin/configuracoes/geral' },
    { label: 'Políticas', path: '/admin/configuracoes/politicas' },
    { label: 'Versões', path: '/admin/configuracoes/versoes' },
  ]},
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['clientes']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isMenuActive = (item: MenuItem) => {
    if (item.path) return isActive(item.path);
    return item.children?.some(child => location.pathname.startsWith(child.path));
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const menuActive = isMenuActive(item);

    if (!hasChildren && item.path) {
      return (
        <NavLink
          key={item.id}
          to={item.path}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-red-500/10 text-red-500 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
        >
          {item.icon}
          <span className="text-sm">{item.label}</span>
        </NavLink>
      );
    }

    return (
      <div key={item.id}>
        <button
          onClick={() => toggleMenu(item.id)}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            menuActive
              ? 'bg-red-500/10 text-red-500'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </div>
          <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            {Icons.chevronDown}
          </span>
        </button>

        {isExpanded && item.children && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children.map(child => (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-red-500/10 text-red-500 font-medium'
                      : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">TrailSystem</h1>
            <p className="text-xs text-red-500 font-medium">Admin Panel</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {adminMenuItems.map(renderMenuItem)}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <NavLink
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {Icons.logout}
            <span className="text-sm">Sair</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
