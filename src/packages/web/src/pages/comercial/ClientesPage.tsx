// =============================================
// PLANAC ERP - Clientes Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Cliente {
  id: string;
  tipo: 'PF' | 'PJ';
  nome: string;
  razao_social?: string;
  nome_fantasia?: string;
  cpf_cnpj: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
  limite_credito: number;
  saldo_credito: number;
  ativo: boolean;
  created_at: string;
}

const tipoOptions = [
  { value: '', label: 'Todos' },
  { value: 'PF', label: 'Pessoa Física' },
  { value: 'PJ', label: 'Pessoa Jurídica' },
];

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'inativo', label: 'Inativos' },
];

export function ClientesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Cliente[] }>('/clientes');
      if (response.success) {
        setClientes(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;

    try {
      await api.delete(`/clientes/${id}`);
      toast.success('Cliente excluído com sucesso');
      loadClientes();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleToggleStatus = async (cliente: Cliente) => {
    try {
      await api.put(`/clientes/${cliente.id}`, { ativo: !cliente.ativo });
      toast.success(cliente.ativo ? 'Cliente inativado' : 'Cliente ativado');
      loadClientes();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const filteredClientes = clientes.filter((c) => {
    const matchSearch =
      c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      c.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf_cnpj?.includes(search);

    const matchTipo = !tipoFilter || c.tipo === tipoFilter;
    const matchStatus = !statusFilter || 
      (statusFilter === 'ativo' && c.ativo) || 
      (statusFilter === 'inativo' && !c.ativo);

    return matchSearch && matchTipo && matchStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const columns = [
    {
      key: 'tipo',
      header: 'Tipo',
      width: '80px',
      render: (c: Cliente) => (
        <Badge variant={c.tipo === 'PJ' ? 'info' : 'default'} size="sm">
          {c.tipo}
        </Badge>
      ),
    },
    {
      key: 'nome',
      header: 'Nome / Razão Social',
      sortable: true,
      render: (c: Cliente) => (
        <div>
          <p className="font-medium text-gray-900">
            {c.tipo === 'PJ' ? c.razao_social : c.nome}
          </p>
          {c.tipo === 'PJ' && c.nome_fantasia && (
            <p className="text-sm text-gray-500">{c.nome_fantasia}</p>
          )}
        </div>
      ),
    },
    {
      key: 'cpf_cnpj',
      header: 'CPF/CNPJ',
      width: '160px',
    },
    {
      key: 'cidade',
      header: 'Cidade/UF',
      render: (c: Cliente) => c.cidade ? `${c.cidade}/${c.uf}` : '-',
    },
    {
      key: 'telefone',
      header: 'Telefone',
      width: '140px',
      render: (c: Cliente) => c.telefone || '-',
    },
    {
      key: 'limite_credito',
      header: 'Limite',
      width: '120px',
      render: (c: Cliente) => (
        <span className="text-green-600 font-medium">
          {formatCurrency(c.limite_credito)}
        </span>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      render: (c: Cliente) => (
        <Badge variant={c.ativo ? 'success' : 'danger'}>
          {c.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (cliente: Cliente) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => navigate(`/clientes/${cliente.id}`),
    },
    {
      label: 'Ver Orçamentos',
      icon: <Icons.document className="w-4 h-4" />,
      onClick: () => navigate(`/orcamentos?cliente=${cliente.id}`),
    },
    { type: 'separator' as const },
    {
      label: cliente.ativo ? 'Inativar' : 'Ativar',
      icon: cliente.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      variant: cliente.ativo ? 'danger' as const : 'success' as const,
      onClick: () => handleToggleStatus(cliente),
    },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(cliente.id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gerencie sua base de clientes</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={() => navigate('/clientes/novo')}
        >
          Novo Cliente
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nome, CNPJ, CPF..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              value={tipoFilter}
              onChange={setTipoFilter}
              options={tipoOptions}
              placeholder="Tipo"
            />
          </div>
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="Status"
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {clientes.filter(c => c.ativo).length}
              </p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {clientes.filter(c => c.tipo === 'PJ').length}
              </p>
              <p className="text-sm text-gray-500">Empresas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Icons.user className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {clientes.filter(c => c.tipo === 'PF').length}
              </p>
              <p className="text-sm text-gray-500">Pessoas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredClientes}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum cliente encontrado"
          onRowClick={(c) => navigate(`/clientes/${c.id}`)}
        />
      </Card>
    </div>
  );
}

export default ClientesPage;
