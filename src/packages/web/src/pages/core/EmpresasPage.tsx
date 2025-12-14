// =============================================
// PLANAC ERP - Empresas Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import type { Empresa } from '@/types';

export function EmpresasPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Empresa[] }>('/empresas');
      if (response.success) {
        setEmpresas(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar empresas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta empresa?')) return;
    
    try {
      await api.delete(\`/empresas/\${id}\`);
      toast.success('Empresa excluída com sucesso');
      loadEmpresas();
    } catch (error) {
      toast.error('Erro ao excluir empresa');
    }
  };

  const filteredEmpresas = empresas.filter(
    (e) =>
      e.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      e.cnpj.includes(search) ||
      e.nome_fantasia?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'cnpj', header: 'CNPJ', width: '150px', sortable: true },
    { key: 'razao_social', header: 'Razão Social', sortable: true },
    { key: 'nome_fantasia', header: 'Nome Fantasia', sortable: true },
    {
      key: 'cidade',
      header: 'Cidade/UF',
      render: (e: Empresa) => e.cidade ? \`\${e.cidade}/\${e.uf}\` : '-',
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      render: (e: Empresa) => (
        <Badge variant={e.ativo ? 'success' : 'danger'}>
          {e.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (empresa: Empresa) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => navigate(\`/empresas/\${empresa.id}\`),
    },
    {
      label: empresa.ativo ? 'Inativar' : 'Ativar',
      icon: empresa.ativo ? <Icons.eyeOff className="w-4 h-4" /> : <Icons.eye className="w-4 h-4" />,
      onClick: () => {/* toggle ativo */},
    },
    { type: 'separator' as const },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(empresa.id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-500">Gerencie as empresas do sistema</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => navigate('/empresas/novo')}>
          Nova Empresa
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por razão social, CNPJ ou fantasia..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredEmpresas}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma empresa encontrada"
          onRowClick={(e) => navigate(\`/empresas/\${e.id}\`)}
        />
      </Card>
    </div>
  );
}

export default EmpresasPage;
