// =============================================
// PLANAC ERP - Empresas Page (Listagem)
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DataTable, 
  Column, 
  Button, 
  Badge, 
  Icons, 
  DropdownMenuItem,
  useToast 
} from '@/components/ui';
import api from '@/services/api';
import type { Empresa, PaginatedResponse } from '@/types';

export function EmpresasPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadEmpresas = async (searchQuery = '') => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Empresa>>(
        \`/empresas?page=\${page}&limit=10&q=\${searchQuery}\`
      );
      setEmpresas(response.data);
      setTotal(response.total);
    } catch (err) {
      error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpresas();
  }, [page]);

  const columns: Column<Empresa>[] = [
    {
      key: 'cnpj',
      header: 'CNPJ',
      width: '150px',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm">{formatCNPJ(row.cnpj)}</span>
      ),
    },
    {
      key: 'razao_social',
      header: 'Razão Social',
      sortable: true,
    },
    {
      key: 'nome_fantasia',
      header: 'Nome Fantasia',
      sortable: true,
    },
    {
      key: 'cidade',
      header: 'Cidade/UF',
      render: (row) => row.cidade ? \`\${row.cidade}/\${row.uf}\` : '-',
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      render: (row) => (
        <Badge variant={row.ativo ? 'success' : 'danger'}>
          {row.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const getActions = (row: Empresa): DropdownMenuItem[] => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => navigate(\`/empresas/\${row.id}\`),
    },
    {
      label: 'Visualizar',
      icon: <Icons.eye className="w-4 h-4" />,
      onClick: () => navigate(\`/empresas/\${row.id}/view\`),
    },
    { type: 'separator' },
    {
      label: row.ativo ? 'Inativar' : 'Ativar',
      icon: row.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      variant: row.ativo ? 'danger' : 'success',
      onClick: () => toggleStatus(row),
    },
  ];

  const toggleStatus = async (empresa: Empresa) => {
    try {
      await api.put(\`/empresas/\${empresa.id}\`, { ativo: !empresa.ativo });
      success(\`Empresa \${empresa.ativo ? 'inativada' : 'ativada'} com sucesso\`);
      loadEmpresas();
    } catch (err) {
      error('Erro ao alterar status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>
          <p className="text-gray-500 mt-1">Gerencie as empresas do sistema</p>
        </div>
        <Button icon={<Icons.plus className="w-4 h-4" />} onClick={() => navigate('/empresas/novo')}>
          Nova Empresa
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        data={empresas}
        columns={columns}
        loading={loading}
        emptyMessage="Nenhuma empresa encontrada"
        searchPlaceholder="Buscar por CNPJ, razão social..."
        onSearch={loadEmpresas}
        actions={getActions}
        onRowClick={(row) => navigate(\`/empresas/\${row.id}\`)}
        pagination={{
          page,
          totalPages: Math.ceil(total / 10),
          total,
          onPageChange: setPage,
        }}
        headerActions={
          <Button variant="secondary" icon={<Icons.printer className="w-4 h-4" />}>
            Exportar
          </Button>
        }
      />
    </div>
  );
}

// Helpers
function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export default EmpresasPage;
