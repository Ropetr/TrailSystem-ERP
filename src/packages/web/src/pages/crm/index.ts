// =============================================
// PLANAC ERP - CRM Module Exports
// =============================================

export { default as CRMDashboardPage } from "./CRMDashboardPage";
export { default as PipelinePage } from "./PipelinePage";
export { default as LeadsPage } from "./LeadsPage";
export { default as OportunidadesPage } from "./OportunidadesPage";
export { default as AtividadesPage } from "./AtividadesPage";

// Default export for lazy loading
export default {
  CRMDashboardPage: () => import('./CRMDashboardPage'),
  PipelinePage: () => import('./PipelinePage'),
  LeadsPage: () => import('./LeadsPage'),
  OportunidadesPage: () => import('./OportunidadesPage'),
  AtividadesPage: () => import('./AtividadesPage'),
};
