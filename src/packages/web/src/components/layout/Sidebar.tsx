// =============================================
// PLANAC ERP - Sidebar com Módulo CADASTROS
// Aprovado: 15/12/2025 - 57 Especialistas DEV.com
// Ajustado: 15/12/2025 - Categorias com chevron
// =============================================

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// Ícones SVG inline
const Icons = {
  home: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  database: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  building: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
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
};

interface SubMenuItem { label: string; path: string; isCategory?: boolean; categoryId?: string; }
interface MenuItem { id: string; label: string; icon: React.ReactNode; path?: string; children?: SubMenuItem[]; }

const menuItems: MenuItem[] = [
  // Dashboard
  { id: 'dashboard', label: 'Dashboard', icon: Icons.home, path: '/dashboard' },
  
  // ========================================
  // CADASTROS - Módulo Central de Dados Base
  // Aprovado: 15/12/2025 - 57 Especialistas
  // Ajustado: Categorias com chevron + indentação itens
  // ========================================
  { id: 'cadastros', label: 'Cadastros', icon: Icons.database, children: [
    // Entidades
    { label: 'Entidades', path: '#entidades', isCategory: true, categoryId: 'entidades' },
    { label: 'Clientes', path: '/cadastros/clientes', categoryId: 'entidades' },
    { label: 'Fornecedores', path: '/cadastros/fornecedores', categoryId: 'entidades' },
    { label: 'Transportadoras', path: '/cadastros/transportadoras', categoryId: 'entidades' },
    { label: 'Colaboradores', path: '/cadastros/colaboradores', categoryId: 'entidades' },
    { label: 'Parceiros de Negócio', path: '/cadastros/parceiros', categoryId: 'entidades' },
    // Produtos
    { label: 'Produtos', path: '#produtos', isCategory: true, categoryId: 'produtos' },
    { label: 'Produtos e Serviços', path: '/cadastros/produtos', categoryId: 'produtos' },
    // Empresa
    { label: 'Empresa', path: '#empresa', isCategory: true, categoryId: 'empresa' },
    { label: 'Matriz & Filiais', path: '/cadastros/empresas', categoryId: 'empresa' },
    // Financeiro
    { label: 'Financeiro', path: '#financeiro', isCategory: true, categoryId: 'financeiro' },
    { label: 'Contas Bancárias', path: '/cadastros/contas-bancarias', categoryId: 'financeiro' },
    { label: 'Plano de Contas', path: '/cadastros/plano-contas', categoryId: 'financeiro' },
    { label: 'Centros de Custo', path: '/cadastros/centros-custo', categoryId: 'financeiro' },
    { label: 'Condições de Pagamento', path: '/cadastros/condicoes-pagamento', categoryId: 'financeiro' },
    // Comercial
    { label: 'Comercial', path: '#comercial', isCategory: true, categoryId: 'comercial' },
    { label: 'Tabelas de Preço', path: '/cadastros/tabelas-preco', categoryId: 'comercial' },
    // Patrimônio
    { label: 'Patrimônio', path: '#patrimonio', isCategory: true, categoryId: 'patrimonio' },
    { label: 'Veículos', path: '/cadastros/veiculos', categoryId: 'patrimonio' },
    { label: 'Bens', path: '/cadastros/bens', categoryId: 'patrimonio' },
    // Acessos
    { label: 'Acessos', path: '#acessos', isCategory: true, categoryId: 'acessos' },
    { label: 'Usuários', path: '/cadastros/usuarios', categoryId: 'acessos' },
    { label: 'Perfis de Usuários', path: '/cadastros/perfis', categoryId: 'acessos' },
  ]},
  
  // Comercial
  { id: 'comercial', label: 'Comercial', icon: Icons.shoppingCart, children: [
    { label: 'Orçamentos', path: '/comercial/orcamentos' },
    { label: 'Vendas', path: '/comercial/vendas' },
  ]},
  
  // Estoque
  { id: 'estoque', label: 'Estoque', icon: Icons.cube, children: [
    { label: 'Saldos', path: '/estoque/saldos' },
    { label: 'Movimentações', path: '/estoque/movimentacoes' },
    { label: 'Transferências', path: '/estoque/transferencias' },
    { label: 'Inventário', path: '/estoque/inventario' },
  ]},
  
  // Fiscal
  { id: 'fiscal', label: 'Fiscal', icon: Icons.document, children: [
    { label: 'Notas Fiscais', path: '/fiscal/notas' },
    { label: 'Emitir NF-e', path: '/fiscal/nfe/nova' },
    { label: 'PDV (NFC-e)', path: '/fiscal/pdv' },
    { label: 'NFS-e (Serviços)', path: '/fiscal/nfse' },
    { label: 'CT-e / MDF-e', path: '/fiscal/cte' },
    { label: 'SPED', path: '/fiscal/sped' },
  ]},
  
  // Financeiro
  { id: 'financeiro', label: 'Financeiro', icon: Icons.cash, children: [
    { label: 'Contas a Receber', path: '/financeiro/receber' },
    { label: 'Contas a Pagar', path: '/financeiro/pagar' },
    { label: 'Fluxo de Caixa', path: '/financeiro/fluxo-caixa' },
    { label: 'Boletos', path: '/financeiro/boletos' },
    { label: 'Conciliação', path: '/financeiro/conciliacao' },
  ]},
  
  // Compras
  { id: 'compras', label: 'Compras', icon: Icons.briefcase, children: [
    { label: 'Cotações', path: '/compras/cotacoes' },
    { label: 'Pedidos de Compra', path: '/compras/pedidos' },
  ]},
  
  // Logística
  { id: 'logistica', label: 'Logística', icon: Icons.truck, children: [
    { label: 'Entregas', path: '/logistica/entregas' },
    { label: 'Rotas', path: '/logistica/rotas' },
    { label: 'Rastreamento', path: '/logistica/rastreamento' },
  ]},
  
  // CRM
  { id: 'crm', label: 'CRM', icon: Icons.userGroup, children: [
    { label: 'Dashboard CRM', path: '/crm' },
    { label: 'Pipeline', path: '/crm/pipeline' },
    { label: 'Leads', path: '/crm/leads' },
    { label: 'Oportunidades', path: '/crm/oportunidades' },
    { label: 'Atividades', path: '/crm/atividades' },
  ]},
  
  // E-commerce
  { id: 'ecommerce', label: 'E-commerce', icon: Icons.globe, children: [
    { label: 'Configurar Loja', path: '/ecommerce/config' },
    { label: 'Produtos da Loja', path: '/ecommerce/produtos' },
    { label: 'Pedidos Online', path: '/ecommerce/pedidos' },
    { label: 'Banners', path: '/ecommerce/banners' },
    { label: 'Cupons', path: '/ecommerce/cupons' },
  ]},
  
  // Contábil
  { id: 'contabil', label: 'Contábil', icon: Icons.calculator, children: [
    { label: 'Lançamentos', path: '/contabil/lancamentos' },
    { label: 'Fechamento', path: '/contabil/fechamento' },
    { label: 'DRE', path: '/contabil/dre' },
    { label: 'Balanço', path: '/contabil/balanco' },
  ]},
  
  // RH
  { id: 'rh', label: 'RH', icon: Icons.users, children: [
    { label: 'Folha de Pagamento', path: '/rh/folha' },
    { label: 'Ponto Eletrônico', path: '/rh/ponto' },
    { label: 'Férias', path: '/rh/ferias' },
  ]},
  
  // Patrimônio
  { id: 'patrimonio', label: 'Patrimônio', icon: Icons.archive, children: [
    { label: 'Depreciação', path: '/patrimonio/depreciacao' },
    { label: 'Manutenção', path: '/patrimonio/manutencao' },
  ]},
  
  // BI & Relatórios
  { id: 'bi', label: 'BI & Relatórios', icon: Icons.chart, children: [
    { label: 'Dashboards', path: '/bi/dashboards' },
    { label: 'Relatórios', path: '/bi/relatorios' },
    { label: 'Indicadores', path: '/bi/indicadores' },
  ]},
  
  // Suporte
  { id: 'suporte', label: 'Suporte', icon: Icons.support, children: [
    { label: 'Tickets', path: '/suporte/tickets' },
    { label: 'Base de Conhecimento', path: '/suporte/base' },
  ]},
  
  // CONFIGURAÇÕES - Módulo Separado
  { id: 'configuracoes', label: 'Configurações', icon: Icons.cog, children: [
    { label: 'Geral', path: '/configuracoes/geral' },
    { label: 'Fiscal', path: '/configuracoes/fiscal' },
    { label: 'Impostos', path: '/configuracoes/impostos' },
    { label: 'Comercial', path: '/configuracoes/comercial' },
    { label: 'E-mail', path: '/configuracoes/email' },
    { label: 'Integrações', path: '/configuracoes/integracoes' },
  ]},
];

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['cadastros']);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'entidades', 'produtos', 'empresa', 'financeiro', 'comercial', 'patrimonio', 'acessos'
  ]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => 
      prev.includes(categoryId) 
        ? prev.filter((id) => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const isMenuActive = (item: MenuItem) => {
    if (item.path) return location.pathname === item.path;
    if (item.children) return item.children.some((child) => location.pathname.startsWith(child.path) && !child.path.startsWith('#'));
    return false;
  };

  const renderSubItem = (child: SubMenuItem) => {
    // É uma categoria clicável
    if (child.isCategory && child.categoryId) {
      const isExpanded = expandedCategories.includes(child.categoryId);
      
      return (
        <button
          key={child.path}
          onClick={() => toggleCategory(child.categoryId!)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-[#8e8e93] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] hover:text-gray-900 dark:hover:text-white mt-2 first:mt-0"
        >
          <span>{child.label}</span>
          <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            {Icons.chevronDown}
          </span>
        </button>
      );
    }
    
    // É um item normal - verifica se a categoria está expandida
    if (child.categoryId && !expandedCategories.includes(child.categoryId)) {
      return null;
    }
    
    // Adiciona indentação extra para itens dentro de categorias
    const itemIndent = child.categoryId ? 'ml-3' : '';
    
    return (
      <NavLink key={child.path} to={child.path} onClick={onClose}
        className={({ isActive }) => `block px-3 py-1.5 rounded-lg text-sm transition-colors ${itemIndent} ${
          isActive
            ? 'bg-red-500/20 text-red-500 dark:text-red-400 font-medium'
            : 'text-gray-500 dark:text-[#636366] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] hover:text-gray-700 dark:hover:text-white'
        }`}
      >
        {child.label}
      </NavLink>
    );
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64
        bg-white dark:bg-[#1c1c1e]
        border-r border-gray-200 dark:border-[#38383a]
        transform transition-all duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-100 dark:border-[#38383a] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">PLANAC</span>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.path && !item.children && (
                <NavLink to={item.path} onClick={onClose}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-500/20 text-red-500 dark:text-red-400'
                      : 'text-gray-600 dark:text-[#8e8e93] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              )}

              {item.children && (
                <>
                  <button onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isMenuActive(item)
                        ? 'bg-red-500/20 text-red-500 dark:text-red-400'
                        : 'text-gray-600 dark:text-[#8e8e93] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">{item.icon}<span>{item.label}</span></div>
                    <span className={`transition-transform duration-200 ${expandedMenus.includes(item.id) ? 'rotate-180' : ''}`}>
                      {Icons.chevronDown}
                    </span>
                  </button>

                  {expandedMenus.includes(item.id) && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 dark:border-[#38383a] pl-3">
                      {item.children.map((child) => renderSubItem(child))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-[#38383a] flex-shrink-0">
          <div className="text-xs text-gray-400 dark:text-[#636366] text-center">PLANAC ERP v1.0.0</div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
