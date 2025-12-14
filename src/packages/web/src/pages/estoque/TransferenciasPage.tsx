// =============================================
// PLANAC ERP - Transferências entre Filiais
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

interface ItemTransferencia {
  produto_id: string;
  produto_nome: string;
  produto_codigo: string;
  quantidade: number;
  estoque_origem: number;
  estoque_destino: number;
}

interface Transferencia {
  id: string;
  numero: string;
  filial_origem_id: string;
  filial_origem_nome: string;
  filial_destino_id: string;
  filial_destino_nome: string;
  status: 'rascunho' | 'enviada' | 'em_transito' | 'recebida' | 'cancelada';
  total_itens: number;
  total_quantidade: number;
  observacao?: string;
  usuario_criacao: string;
  usuario_recebimento?: string;
  created_at: string;
  enviada_em?: string;
  recebida_em?: string;
  itens?: ItemTransferencia[];
}

interface Filial {
  id: string;
  nome: string;
}

const statusConfig = {
  rascunho: { label: 'Rascunho', variant: 'default' as const },
  enviada: { label: 'Enviada', variant: 'warning' as const },
  em_transito: { label: 'Em Trânsito', variant: 'info' as const },
  recebida: { label: 'Recebida', variant: 'success' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
};

export function TransferenciasPage() {
  const toast = useToast();
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal de nova transferência
  const [showModal, setShowModal] = useState(false);
  const [novaTransferencia, setNovaTransferencia] = useState({
    filial_origem_id: '',
    filial_destino_id: '',
    observacao: '',
    itens: [] as { produto_id: string; quantidade: number }[],
  });
  
  // Modal de detalhes
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [transferenciaDetalhes, setTransferenciaDetalhes] = useState<Transferencia | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transResponse, filiaisResponse] = await Promise.all([
        api.get<{ success: boolean; data: Transferencia[] }>('/estoque/transferencias'),
        api.get<{ success: boolean; data: Filial[] }>('/filiais'),
      ]);
      
      if (transResponse.success) setTransferencias(transResponse.data);
      if (filiaisResponse.success) setFiliais(filiaisResponse.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnviar = async (id: string) => {
    try {
      await api.post(`/estoque/transferencias/${id}/enviar`);
      toast.success('Transferência enviada');
      loadData();
    } catch (error) {
      toast.error('Erro ao enviar transferência');
    }
  };

  const handleReceber = async (id: string) => {
    try {
      await api.post(`/estoque/transferencias/${id}/receber`);
      toast.success('Transferência recebida! Estoque atualizado.');
      loadData();
    } catch (error) {
      toast.error('Erro ao receber transferência');
    }
  };

  const handleCancelar = async (id: string) => {
    if (!confirm('Deseja realmente cancelar esta transferência?')) return;
    
    try {
      await api.post(`/estoque/transferencias/${id}/cancelar`);
      toast.success('Transferência cancelada');
      loadData();
    } catch (error) {
      toast.error('Erro ao cancelar transferência');
    }
  };

  const handleVerDetalhes = async (transferencia: Transferencia) => {
    try {
      const response = await api.get<{ success: boolean; data: Transferencia }>(
        `/estoque/transferencias/${transferencia.id}`
      );
      if (response.success) {
        setTransferenciaDetalhes(response.data);
        setShowDetalhes(true);
      }
    } catch (error) {
      toast.error('Erro ao carregar detalhes');
    }
  };

  const filteredTransferencias = transferencias.filter((t) => {
    const matchSearch =
      t.numero?.toLowerCase().includes(search.toLowerCase()) ||
      t.filial_origem_nome?.toLowerCase().includes(search.toLowerCase()) ||
      t.filial_destino_nome?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || t.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'numero',
      header: 'Número',
      width: '100px',
      sortable: true,
      render: (t: Transferencia) => (
        <span className="font-mono font-medium">{t.numero}</span>
      ),
    },
    {
      key: 'origem_destino',
      header: 'Origem → Destino',
      render: (t: Transferencia) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{t.filial_origem_nome}</span>
          <Icons.chevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{t.filial_destino_nome}</span>
        </div>
      ),
    },
    {
      key: 'itens',
      header: 'Itens/Qtd',
      width: '100px',
      render: (t: Transferencia) => (
        <div className="text-center">
          <p className="font-bold">{t.total_itens}</p>
          <p className="text-xs text-gray-500">{t.total_quantidade} un.</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (t: Transferencia) => {
        const config = statusConfig[t.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'created_at',
      header: 'Criada em',
      width: '140px',
      render: (t: Transferencia) => formatDate(t.created_at),
    },
    {
      key: 'recebida_em',
      header: 'Recebida em',
      width: '140px',
      render: (t: Transferencia) => formatDate(t.recebida_em),
    },
  ];

  const actions = (transferencia: Transferencia) => {
    const items = [
      {
        label: 'Ver Detalhes',
        icon: <Icons.eye className="w-4 h-4" />,
        onClick: () => handleVerDetalhes(transferencia),
      },
    ];

    if (transferencia.status === 'rascunho') {
      items.push(
        {
          label: 'Enviar',
          icon: <Icons.check className="w-4 h-4" />,
          onClick: () => handleEnviar(transferencia.id),
        },
        {
          label: 'Cancelar',
          icon: <Icons.x className="w-4 h-4" />,
          variant: 'danger' as const,
          onClick: () => handleCancelar(transferencia.id),
        }
      );
    }

    if (transferencia.status === 'enviada' || transferencia.status === 'em_transito') {
      items.push({
        label: 'Receber',
        icon: <Icons.check className="w-4 h-4" />,
        variant: 'success' as const,
        onClick: () => handleReceber(transferencia.id),
      });
    }

    return items;
  };

  // Stats
  const stats = {
    pendentes: transferencias.filter(t => t.status === 'rascunho').length,
    emTransito: transferencias.filter(t => ['enviada', 'em_transito'].includes(t.status)).length,
    recebidas: transferencias.filter(t => t.status === 'recebida').length,
    total: transferencias.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transferências entre Filiais</h1>
          <p className="text-gray-500">Gerencie movimentações entre unidades</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={() => setShowModal(true)}
        >
          Nova Transferência
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por número, filial..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'Todos' },
                ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
              placeholder="Status"
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
              <p className="text-sm text-gray-500">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.chevronRight className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.emTransito}</p>
              <p className="text-sm text-gray-500">Em Trânsito</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.recebidas}</p>
              <p className="text-sm text-gray-500">Recebidas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icons.building className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredTransferencias}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma transferência encontrada"
        />
      </Card>

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetalhes}
        onClose={() => setShowDetalhes(false)}
        title={`Transferência ${transferenciaDetalhes?.numero}`}
        size="lg"
      >
        {transferenciaDetalhes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Origem</p>
                <p className="font-medium">{transferenciaDetalhes.filial_origem_nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Destino</p>
                <p className="font-medium">{transferenciaDetalhes.filial_destino_nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={statusConfig[transferenciaDetalhes.status].variant}>
                  {statusConfig[transferenciaDetalhes.status].label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Criada em</p>
                <p className="font-medium">{formatDate(transferenciaDetalhes.created_at)}</p>
              </div>
            </div>
            
            {transferenciaDetalhes.observacao && (
              <div>
                <p className="text-sm text-gray-500">Observação</p>
                <p className="text-gray-700">{transferenciaDetalhes.observacao}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Itens da Transferência</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produto</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transferenciaDetalhes.itens?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">
                          <p className="font-medium">{item.produto_nome}</p>
                          <p className="text-xs text-gray-500">{item.produto_codigo}</p>
                        </td>
                        <td className="px-4 py-2 text-center font-bold">{item.quantidade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TransferenciasPage;
