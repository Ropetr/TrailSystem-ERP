// =============================================
// TRAILSYSTEM ERP - Admin Ativações Page
// Gestão de ativações e licenciamento
// =============================================

import { AdminPlaceholder } from '../components/AdminPlaceholder';

export function AtivacoesPage() {
  return (
    <AdminPlaceholder
      title="Ativações"
      description="Gerencie as ativações de módulos e licenças dos clientes"
      features={[
        'Ativar/desativar módulos por cliente',
        'Gerenciar licenças e seats',
        'Suspender por inadimplência',
        'Histórico de ativações',
        'Provisionar novos ambientes',
        'Migrações de versão',
      ]}
    />
  );
}

export default AtivacoesPage;
