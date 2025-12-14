// =============================================
// PLANAC ERP - Movimentações de Estoque
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Movimentacao {
  id: string;
  tipo: 'entrada' | 'saida' | 'transferencia' | 'ajuste' | 'devolucao';
  produto_id: string;
  produto_nome: string;
  produto_codigo: string;
  quantidade: number;
  quantidade_anterior: number;
  quantidade_nova: number;
  filial_origem?: string;
  filial_destino?: string;
  documento_tipo?: string;
  documento_numero?: string;
  motivo?: string;
  usuario_nome: string;
  created_at: string;
}

const tipoOptions = [
  { value: '', label: 'Todos' },
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'devolucao', label: 'Devolução' },
];

const tipoConfig = {
  entrada: { label: 'Entrada', variant: 'success' as const, icon: '↑' },
  saida: { label: 'Saída', variant: 'danger' as const, icon: '↓' },
  transferencia: { label: 'Transferência', variant: 'info' as const, icon: '↔' },
  ajuste: { label: 'Ajuste', variant: 'warning' as const, icon: '±' },
  devolucao: { label: 'Devolução', variant: 'default' as const, icon: '↩' },
};

export function MovimentacoesPage() {
  const toast = useToast();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Modal de nova movimentação
  const [showModal, setShowModal] = useState(false);
  const [novaMovimentacao, setNovaMovimentacao] = useState({
    tipo: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    produto_id: '',
    quantidade: 0,
    motivo: '',
  });

  useEffect(() => {
    loadMovimentacoes();
  }, []);

  const loadMovimentacoes = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Movimentacao[] }>('/estoque/movimentacoes');
      if (response.success) {
        setMovimentacoes(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar movimentações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvarMovimentacao = async () => {
    if (!novaMovimentacao.produto_id || novaMovimentacao.quantidade <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await api.post('/estoque/movimentacoes', novaMovimentacao);
      toast.success('Movimentação registrada com sucesso');
      setShowModal(false);
      setNovaMovimentacao({ tipo: 'entrada', produto_id: '', quantidade: 0, motivo: '' });
      loadMovimentacoes();
    } catch (error) {
      toast.error('Erro ao registrar movimentação');
    }
  };

  const filteredMovimentacoes = movimentacoes.filter((m) => {
    const matchSearch =
      m.produto_nome?.toLowerCase().includes(search.toLowerCase()) ||
      m.produto_codigo?.includes(search) ||
      m.documento_numero?.includes(search);

    const matchTipo = !tipoFilter || m.tipo === tipoFilter;
    
    const dataMovimentacao = new Date(m.created_at);
    const matchDataInicio = !dataInicio || dataMovimentacao >= new Date(dataInicio);
    const matchDataFim = !dataFim || dataMovimentacao <= new Date(dataFim + 'T23:59:59');

    return matchSearch && matchTipo && matchDataInicio && matchDataFim;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Estatísticas
  const stats = {
    entradas: movimentacoes.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.quantidade, 0),
    saidas: movimentacoes.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.quantidade, 0),
    ajustes: movimentacoes.filter(m => m.tipo === 'ajuste').length,
    transferencias: movimentacoes.filter(m => m.tipo === 'transferencia').length,
  };

  const columns = [
    {
      key: 'created_at',
      header: 'Data/Hora',
      width: '150px',
      sortable: true,
      render: (m: Movimentacao) => formatDate(m.created_at),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      width: '130px',
      render: (m: Movimentacao) => {
        const config = tipoConfig[m.tipo];
        return (
          <Badge variant={config.variant}>
            {config.icon} {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'produto',
      header: 'Produto',
      render: (m: Movimentacao) => (
        <div>
          <p className="font-medium text-gray-900">{m.produto_nome}</p>
          <p className="text-sm text-gray-500">{m.produto_codigo}</p>
        </div>
      ),
    },
    {
      key: 'quantidade',
      header: 'Quantidade',
      width: '120px',
      render: (m: Movimentacao) => (
        <span className={`font-bold ${
          m.tipo === 'entrada' || m.tipo === 'devolucao' ? 'text-green-600' : 
          m.tipo === 'saida' ? 'text-red-600' : 'text-gray-600'
        }`}>
          {m.tipo === 'entrada' || m.tipo === 'devolucao' ? '+' : m.tipo === 'saida' ? '-' : ''}
          {m.quantidade}
        </span>
      ),
    },
    {
      key: 'estoque',
      header: 'Estoque',
      width: '140px',
      render: (m: Movimentacao) => (
        <div className="text-sm">
          <span className="text-gray-500">{m.quantidade_anterior}</span>
          <span className="mx-1">→</span>
          <span className="font-medium text-gray-900">{m.quantidade_nova}</span>
        </div>
      ),
    },
    {
      key: 'documento',
      header: 'Documento',
      width: '130px',
      render: (m: Movimentacao) => m.documento_numero ? (
        <div className="text-sm">
          <p className="text-gray-500">{m.documento_tipo}</p>
          <p className="font-medium">{m.documento_numero}</p>
        </div>
      ) : <span className="text-gray-400">-</span>,
    },
    {
      key: 'usuario',
      header: 'Usuário',
      width: '120px',
      render: (m: Movimentacao) => m.usuario_nome,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimentações de Estoque</h1>
          <p className="text-gray-500">Histórico de entradas, saídas e ajustes</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={() => setShowModal(true)}
        >
          Nova Movimentação
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar produto, código, documento..."
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
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              placeholder="Data início"
            />
          </div>
          <div className="w-40">
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              placeholder="Data fim"
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">+{stats.entradas}</p>
              <p className="text-sm text-gray-500">Entradas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icons.x className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">-{stats.saidas}</p>
              <p className="text-sm text-gray-500">Saídas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.edit className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.ajustes}</p>
              <p className="text-sm text-gray-500">Ajustes</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.transferencias}</p>
              <p className="text-sm text-gray-500">Transferências</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredMovimentacoes}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="Nenhuma movimentação encontrada"
        />
      </Card>

      {/* Modal Nova Movimentação */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Movimentação de Estoque"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Tipo de Movimentação"
            value={novaMovimentacao.tipo}
            onChange={(v) => setNovaMovimentacao({ ...novaMovimentacao, tipo: v as any })}
            options={[
              { value: 'entrada', label: '↑ Entrada' },
              { value: 'saida', label: '↓ Saída' },
              { value: 'ajuste', label: '± Ajuste' },
            ]}
          />
          
          <Input
            label="Produto"
            placeholder="Buscar por código ou nome..."
            value={novaMovimentacao.produto_id}
            onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, produto_id: e.target.value })}
          />
          
          <Input
            label="Quantidade"
            type="number"
            min={1}
            value={novaMovimentacao.quantidade || ''}
            onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, quantidade: parseInt(e.target.value) || 0 })}
          />
          
          <Input
            label="Motivo/Observação"
            placeholder="Descreva o motivo da movimentação..."
            value={novaMovimentacao.motivo}
            onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, motivo: e.target.value })}
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarMovimentacao}>
              Salvar Movimentação
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MovimentacoesPage;
