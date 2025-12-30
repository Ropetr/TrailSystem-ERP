// =============================================
// TRAILSYSTEM ERP - Admin Configurações Gerais Page
// Configurações globais do sistema
// =============================================

import { AdminPlaceholder } from '../components/AdminPlaceholder';

export function GeralPage() {
  return (
    <AdminPlaceholder
      title="Configurações Gerais"
      description="Configure os parâmetros globais do sistema"
      features={[
        'Configurações de gateways de pagamento',
        'Configurações de NF-e e certificados',
        'Configurações de e-mail',
        'Políticas de suspensão por atraso',
        'Limites padrão por plano',
        'Régua de cobrança',
        'Gestão de versões e rollout',
      ]}
    />
  );
}

export default GeralPage;
