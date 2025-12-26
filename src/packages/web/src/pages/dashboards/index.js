// TrailSystem ERP - Dashboards por Perfil
// ========================================
// Cada dashboard é otimizado para um tipo de usuário específico
// com KPIs, widgets e insights relevantes para sua função.

export { default as DashboardVendas } from './DashboardVendas';
export { default as DashboardCompras } from './DashboardCompras';
export { default as DashboardFinanceiro } from './DashboardFinanceiro';
export { default as DashboardGestor } from './DashboardGestor';

// Mapeamento de perfil para dashboard
export const dashboardByRole = {
  vendedor: 'DashboardVendas',
  supervisor_comercial: 'DashboardVendas',
  comprador: 'DashboardCompras',
  gestor_compras: 'DashboardCompras',
  analista_financeiro: 'DashboardFinanceiro',
  tesoureiro: 'DashboardFinanceiro',
  diretor: 'DashboardGestor',
  proprietario: 'DashboardGestor',
  admin: 'DashboardGestor',
};
