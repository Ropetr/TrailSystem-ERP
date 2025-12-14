// =============================================
// PLANAC ERP - CRM Module Exports
// =============================================

export { CRMDashboardPage } from './CRMDashboardPage';
export { PipelinePage } from './PipelinePage';
export { LeadsPage } from './LeadsPage';
export { OportunidadesPage } from './OportunidadesPage';
export { AtividadesPage } from './AtividadesPage';

// Default export for lazy loading
export default {
  CRMDashboardPage: () => import('./CRMDashboardPage'),
  PipelinePage: () => import('./PipelinePage'),
  LeadsPage: () => import('./LeadsPage'),
  OportunidadesPage: () => import('./OportunidadesPage'),
  AtividadesPage: () => import('./AtividadesPage'),
};
