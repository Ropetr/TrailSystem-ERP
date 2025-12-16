// =============================================
// PLANAC ERP - Sidebar com Flyout Hover
// Atualizado: 16/12/2025
// - Menus fechados no login
// - Submenus com flyout hover para a direita
// =============================================

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// Ícones SVG inline
const Icons = {
  home: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  database: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  shoppingCart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  cube: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  document: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  cash: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  truck: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  briefcase: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  userGroup: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  globe: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  calculator: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  archive: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  chart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  support: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  cog: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronRight: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
};

// Estrutura de Categorias para Cadastros (com flyout)
interface CategoryItem {
  id: string;
  label: string;
  items: { label: string; path: string }[];
}

const cadastroCategories: CategoryItem[] = [
  {
    id: 'entidades',
    label: 'Entidades',
    items: [
      { label: 'Clientes', path: '/cadastros/clientes' },
      { label: 'Fornecedores', path: '/cadastros/fornecedores' },
      { label: 'Transportadoras', path: '/cadastros/transportadoras' },
      { label: 'Colaboradores', path: '/cadastros/colaboradores' },
      { label: 'Parceiros de Negócio', path: '/cadastros/parceiros' },
    ],
  },
  {
    id: 'produtos',
    label: 'Produtos',
    items: [
      { label: 'Produtos e Serviços', path: '/cadastros/produtos' },
    ],
  },
  {
    id: 'empresa',
    label: 'Empresa',
    items: [
      { label: 'Matriz & Filiais', path: '/cadastros/empresas' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    items: [
      { label: 'Contas Bancárias', path: '/cadastros/contas-bancarias' },
      { label: 'Plano de Contas', path: '/cadastros/plano-contas' },
      { label: 'Centros de Custo', path: '/cadastros/centros-custo' },
      { label: 'Condições de Pagamento', path: '/cadastros/condicoes-pagamento' },
    ],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    items: [
      { label: 'Tabelas de Preço', path: '/cadastros/tabelas-preco' },
    ],
  },
  {
    id: 'patrimonio',
    label: 'Patrimônio',
    items: [
      { label: 'Veículos', path: '/cadastros/veiculos' },
      { label: 'Bens', path: '/cadastros/bens' },
    ],
  },
  {
    id: 'acessos',
    label: 'Acessos',
    items: [
      { label: 'Usuários', path: '/cadastros/usuarios' },
      { label: 'Perfis de Usuários', path: '/cadastros/perfis' },
    ],
  },
];

// Menus simples (sem subcategorias)
interface SimpleMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: { label: string; path: string }[];
}

const simpleMenuItems: SimpleMenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.home, path: '/dashboard' },
  { id: 'comercial', label: 'Comercial', icon: Icons.shoppingCart, children: [
    { label: 'Orçamentos', path: '/comercial/orcamentos' },
    { label: 'Vendas', path: '/comercial/vendas' },
  ]},
  { id: 'estoque', label: 'Estoque', icon: Icons.cube, children: [
    { label: 'Saldos', path: '/estoque/saldos' },
    { label: 'Movimentações', path: '/estoque/movimentacoes' },
    { label: 'Transferências', path: '/estoque/transferencias' },
    { label: 'Inventário', path: '/estoque/inventario' },
  ]},
  { id: 'fiscal', label: 'Fiscal', icon: Icons.document, children: [
    { label: 'Notas Fiscais', path: '/fiscal/notas' },
    { label: 'Emitir NF-e', path: '/fiscal/nfe/nova' },
    { label: 'PDV (NFC-e)', path: '/fiscal/pdv' },
    { label: 'NFS-e (Serviços)', path: '/fiscal/nfse' },
    { label: 'CT-e / MDF-e', path: '/fiscal/cte' },
    { label: 'SPED', path: '/fiscal/sped' },
  ]},
  { id: 'financeiro', label: 'Financeiro', icon: Icons.cash, children: [
    { label: 'Contas a Receber', path: '/financeiro/receber' },
    { label: 'Contas a Pagar', path: '/financeiro/pagar' },
    { label: 'Fluxo de Caixa', path: '/financeiro/fluxo-caixa' },
    { label: 'Boletos', path: '/financeiro/boletos' },
    { label: 'Conciliação', path: '/financeiro/conciliacao' },
  ]},
  { id: 'compras', label: 'Compras', icon: Icons.briefcase, children: [
    { label: 'Cotações', path: '/compras/cotacoes' },
    { label: 'Pedidos de Compra', path: '/compras/pedidos' },
  ]},
  { id: 'logistica', label: 'Logística', icon: Icons.truck, children: [
    { label: 'Entregas', path: '/logistica/entregas' },
    { label: 'Rotas', path: '/logistica/rotas' },
    { label: 'Rastreamento', path: '/logistica/rastreamento' },
  ]},
  { id: 'crm', label: 'CRM', icon: Icons.userGroup, children: [
    { label: 'Dashboard CRM', path: '/crm' },
    { label: 'Pipeline', path: '/crm/pipeline' },
    { label: 'Leads', path: '/crm/leads' },
    { label: 'Oportunidades', path: '/crm/oportunidades' },
    { label: 'Atividades', path: '/crm/atividades' },
  ]},
  { id: 'ecommerce', label: 'E-commerce', icon: Icons.globe, children: [
    { label: 'Configurar Loja', path: '/ecommerce/config' },
    { label: 'Produtos da Loja', path: '/ecommerce/produtos' },
    { label: 'Pedidos Online', path: '/ecommerce/pedidos' },
    { label: 'Banners', path: '/ecommerce/banners' },
    { label: 'Cupons', path: '/ecommerce/cupons' },
  ]},
  { id: 'contabil', label: 'Contábil', icon: Icons.calculator, children: [
    { label: 'Lançamentos', path: '/contabil/lancamentos' },
    { label: 'Fechamento', path: '/contabil/fechamento' },
    { label: 'DRE', path: '/contabil/dre' },
    { label: 'Balanço', path: '/contabil/balanco' },
  ]},
  { id: 'rh', label: 'RH', icon: Icons.users, children: [
    { label: 'Folha de Pagamento', path: '/rh/folha' },
    { label: 'Ponto Eletrônico', path: '/rh/ponto' },
    { label: 'Férias', path: '/rh/ferias' },
  ]},
  { id: 'patrimonio', label: 'Patrimônio', icon: Icons.archive, children: [
    { label: 'Depreciação', path: '/patrimonio/depreciacao' },
    { label: 'Manutenção', path: '/patrimonio/manutencao' },
  ]},
  { id: 'bi', label: 'BI & Relatórios', icon: Icons.chart, children: [
    { label: 'Dashboards', path: '/bi/dashboards' },
    { label: 'Relatórios', path: '/bi/relatorios' },
    { label: 'Indicadores', path: '/bi/indicadores' },
  ]},
  { id: 'suporte', label: 'Suporte', icon: Icons.support, children: [
    { label: 'Tickets', path: '/suporte/tickets' },
    { label: 'Base de Conhecimento', path: '/suporte/base' },
  ]},
  { id: 'configuracoes', label: 'Configurações', icon: Icons.cog, children: [
    { label: 'Geral', path: '/configuracoes/geral' },
    { label: 'Fiscal', path: '/configuracoes/fiscal' },
    { label: 'Impostos', path: '/configuracoes/impostos' },
    { label: 'Comercial', path: '/configuracoes/comercial' },
    { label: 'E-mail', path: '/configuracoes/email' },
    { label: 'Integrações', path: '/configuracoes/integracoes' },
  ]},
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  // CORREÇÃO 1: Menus fechados no login (arrays vazios)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const isPathActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Componente de item de submenu com flyout hover
  const CategoryWithFlyout = ({ category }: { category: CategoryItem }) => {
    const isHovered = hoveredCategory === category.id;
    const hasActiveItem = category.items.some((item) => isPathActive(item.path));

    return (
      <div
        className="relative"
        onMouseEnter={() => setHoveredCategory(category.id)}
        onMouseLeave={() => setHoveredCategory(null)}
      >
        {/* Categoria com seta para direita */}
        <div
          className={`flex items-center justify-between px-3 py-2 ml-3 rounded-lg cursor-pointer transition-colors ${
            hasActiveItem
              ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          <span className="text-sm font-medium">{category.label}</span>
          <span className="text-gray-400">{Icons.chevronRight}</span>
        </div>

        {/* Flyout Box - aparece à direita no hover */}
        {isHovered && (
          <div
            className="absolute left-full top-0 ml-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 min-w-48 z-[9999]"
            style={{ marginTop: '-4px' }}
          >
            {category.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar menu Cadastros (especial, com flyout)
  const renderCadastrosMenu = () => {
    const isExpanded = expandedMenus.includes('cadastros');
    const hasActiveChild = cadastroCategories.some((cat) =>
      cat.items.some((item) => isPathActive(item.path))
    );

    return (
      <div key="cadastros">
        <button
          onClick={() => toggleMenu('cadastros')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
            hasActiveChild
              ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={hasActiveChild ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}>
              {Icons.database}
            </span>
            <span className="font-medium">Cadastros</span>
          </div>
          <span
            className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            {Icons.chevronDown}
          </span>
        </button>

        {/* Subcategorias com flyout */}
        {isExpanded && (
          <div className="mt-1 space-y-1">
            {cadastroCategories.map((category) => (
              <CategoryWithFlyout key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar menus simples
  const renderSimpleMenu = (menu: SimpleMenuItem) => {
    // Menu sem filhos (Dashboard)
    if (!menu.children) {
      return (
        <NavLink
          key={menu.id}
          to={menu.path!}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              isActive
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`
          }
        >
          <span className="text-gray-500 dark:text-gray-400">{menu.icon}</span>
          <span className="font-medium">{menu.label}</span>
        </NavLink>
      );
    }

    // Menu com filhos
    const isExpanded = expandedMenus.includes(menu.id);
    const hasActiveChild = menu.children.some((child) => isPathActive(child.path));

    return (
      <div key={menu.id}>
        <button
          onClick={() => toggleMenu(menu.id)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
            hasActiveChild
              ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={hasActiveChild ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}>
              {menu.icon}
            </span>
            <span className="font-medium">{menu.label}</span>
          </div>
          <span
            className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            {Icons.chevronDown}
          </span>
        </button>

        {isExpanded && (
          <div className="mt-1 ml-3 space-y-1">
            {menu.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">PLANAC</span>
          </NavLink>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {/* Dashboard */}
          {renderSimpleMenu(simpleMenuItems[0])}

          {/* Cadastros (especial com flyout) */}
          {renderCadastrosMenu()}

          {/* Demais menus */}
          {simpleMenuItems.slice(1).map((menu) => renderSimpleMenu(menu))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-600">PLANAC ERP v1.0.0</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

