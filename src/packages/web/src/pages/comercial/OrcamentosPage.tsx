// =============================================
// PLANAC ERP - Orçamentos Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

interface Orcamento {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nome: string;
  vendedor_id: string;
  vendedor_nome: string;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'reprovado' | 'convertido' | 'expirado';
  valor_total: number;
  data_emissao: string;
  data_validade: string;
  itens_count: number;
  mesclado_de?: string[];
  created_at: string;
}

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'expirado', label: 'Expirado' },
];

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  rascunho: 'default',
  enviado: 'info',
  aprovado: 'success',
  reprovado: 'danger',
  convertido: 'success',
  expirado: 'warning',
};

export function OrcamentosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMergeModal, setShowMergeModal] = useState(false);

  // Filtro por cliente via URL
  const clienteIdFilter = searchParams.get('cliente');

  useEffect(() => {
    loadOrcamentos();
  }, [clienteIdFilter]);

  const loadOrcamentos = async () => {
    try {
      let url = '/orcamentos';
      if (clienteIdFilter) {
        url += `?cliente_id=${clienteIdFilter}`;
      }
      const response = await api.get<{ success: boolean; data: Orcamento[] }>(url);
      if (response.success) {
        setOrcamentos(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este orçamento?')) return;

    try {
      await api.delete(`/orcamentos/${id}`);
      toast.success('Orçamento excluído com sucesso');
      loadOrcamentos();
    } catch (error) {
      toast.error('Erro ao excluir orçamento');
    }
  };

  const handleConvertToSale = async (id: string) => {
    try {
      await api.post(`/orcamentos/${id}/converter`);
      toast.success('Orçamento convertido em pedido!');
      loadOrcamentos();
    } catch (error) {
      toast.error('Erro ao converter orçamento');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await api.post(`/orcamentos/${id}/duplicar`);
      toast.success('Orçamento duplicado com sucesso');
      if (response.data?.id) {
        navigate(`/orcamentos/${response.data.id}`);
      } else {
        loadOrcamentos();
      }
    } catch (error) {
      toast.error('Erro ao duplicar orçamento');
    }
  };

  const handleMerge = async () => {
    if (selectedIds.length < 2) {
      toast.error('Selecione pelo menos 2 orçamentos para mesclar');
      return;
    }

    try {
      const response = await api.post('/orcamentos/mesclar', { ids: selectedIds });
      toast.success('Orçamentos mesclados com sucesso!');
      setSelectedIds([]);
      setShowMergeModal(false);
      if (response.data?.id) {
        navigate(`/orcamentos/${response.data.id}`);
      } else {
        loadOrcamentos();
      }
    } catch (error) {
      toast.error('Erro ao mesclar orçamentos');
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      await api.post(`/orcamentos/${id}/enviar-email`);
      toast.success('Orçamento enviado por e-mail');
    } catch (error) {
      toast.error('Erro ao enviar e-mail');
    }
  };

  const handleSendWhatsApp = async (id: string) => {
    try {
      await api.post(`/orcamentos/${id}/enviar-whatsapp`);
      toast.success('Orçamento enviado por WhatsApp');
    } catch (error) {
      toast.error('Erro ao enviar WhatsApp');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredOrcamentos = orcamentos.filter((o) => {
    const matchSearch =
      o.numero?.toLowerCase().includes(search.toLowerCase()) ||
      o.cliente_nome?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || o.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedIds.length === filteredOrcamentos.length && filteredOrcamentos.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(filteredOrcamentos.map(o => o.id));
            } else {
              setSelectedIds([]);
            }
          }}
          className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
        />
      ),
      width: '40px',
      render: (o: Orcamento) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(o.id)}
          onChange={() => toggleSelect(o.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
        />
      ),
    },
    {
      key: 'numero',
      header: 'Nº',
      width: '100px',
      sortable: true,
      render: (o: Orcamento) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">{o.numero}</span>
          {o.mesclado_de && o.mesclado_de.length > 0 && (
            <Badge variant="info" size="sm" title={`Mesclado de: ${o.mesclado_de.join(', ')}`}>
              +{o.mesclado_de.length}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      sortable: true,
      render: (o: Orcamento) => (
        <p className="font-medium text-gray-900">{o.cliente_nome}</p>
      ),
    },
    {
      key: 'vendedor',
      header: 'Vendedor',
      width: '150px',
      render: (o: Orcamento) => o.vendedor_nome || '-',
    },
    {
      key: 'itens',
      header: 'Itens',
      width: '60px',
      render: (o: Orcamento) => o.itens_count,
    },
    {
      key: 'valor_total',
      header: 'Valor',
      width: '130px',
      render: (o: Orcamento) => (
        <span className="font-medium text-green-600">
          {formatCurrency(o.valor_total)}
        </span>
      ),
    },
    {
      key: 'data_emissao',
      header: 'Emissão',
      width: '100px',
      render: (o: Orcamento) => formatDate(o.data_emissao),
    },
    {
      key: 'data_validade',
      header: 'Validade',
      width: '100px',
      render: (o: Orcamento) => {
        const isExpired = new Date(o.data_validade) < new Date();
        return (
          <span className={isExpired && o.status !== 'convertido' ? 'text-red-600' : ''}>
            {formatDate(o.data_validade)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (o: Orcamento) => (
        <Badge variant={statusColors[o.status]}>
          {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
        </Badge>
      ),
    },
  ];

  const actions = (orcamento: Orcamento) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => navigate(`/orcamentos/${orcamento.id}`),
    },
    {
      label: 'Duplicar',
      icon: <Icons.copy className="w-4 h-4" />,
      onClick: () => handleDuplicate(orcamento.id),
    },
    {
      label: 'Imprimir',
      icon: <Icons.printer className="w-4 h-4" />,
      onClick: () => window.open(`/api/orcamentos/${orcamento.id}/pdf`, '_blank'),
    },
    { type: 'separator' as const },
    {
      label: 'Enviar por E-mail',
      icon: <Icons.mail className="w-4 h-4" />,
      onClick: () => handleSendEmail(orcamento.id),
    },
    {
      label: 'Enviar por WhatsApp',
      icon: <Icons.messageCircle className="w-4 h-4" />,
      onClick: () => handleSendWhatsApp(orcamento.id),
    },
    { type: 'separator' as const },
    ...(orcamento.status === 'aprovado' ? [{
      label: 'Converter em Pedido',
      icon: <Icons.shoppingCart className="w-4 h-4" />,
      variant: 'success' as const,
      onClick: () => handleConvertToSale(orcamento.id),
    }] : []),
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(orcamento.id),
    },
  ];

  // Stats
  const totalOrcamentos = orcamentos.length;
  const valorTotal = orcamentos.reduce((acc, o) => acc + o.valor_total, 0);
  const aprovados = orcamentos.filter(o => o.status === 'aprovado').length;
  const pendentes = orcamentos.filter(o => ['rascunho', 'enviado'].includes(o.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500">Gerencie seus orçamentos e propostas</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length >= 2 && (
            <Button 
              variant="secondary"
              leftIcon={<Icons.merge className="w-5 h-5" />}
              onClick={() => setShowMergeModal(true)}
            >
              Mesclar ({selectedIds.length})
            </Button>
          )}
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => navigate('/orcamentos/novo')}
          >
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.fileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalOrcamentos}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendentes}</p>
              <p className="text-sm text-gray-500">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.checkCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{aprovados}</p>
              <p className="text-sm text-gray-500">Aprovados</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.dollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(valorTotal)}</p>
              <p className="text-sm text-gray-500">Valor Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por número ou cliente..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredOrcamentos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum orçamento encontrado"
          onRowClick={(o) => navigate(`/orcamentos/${o.id}`)}
        />
      </Card>

      {/* Modal de Mesclagem */}
      <Modal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        title="Mesclar Orçamentos"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Você está prestes a mesclar {selectedIds.length} orçamentos em um único.
          </p>
          
          <div className="p-4 bg-yellow-50 rounded-xl">
            <h4 className="font-medium text-yellow-800 mb-2">
              <Icons.alertTriangle className="w-4 h-4 inline mr-2" />
              Atenção
            </h4>
            <ul className="text-sm text-yellow-700 list-disc list-inside">
              <li>Os itens de todos os orçamentos serão combinados</li>
              <li>Itens duplicados terão os preços mantidos (usar regra de preço)</li>
              <li>O orçamento resultante terá um novo número</li>
            </ul>
          </div>

          <div className="border rounded-lg divide-y">
            {selectedIds.map((id) => {
              const orc = orcamentos.find(o => o.id === id);
              return orc ? (
                <div key={id} className="p-3 flex justify-between items-center">
                  <div>
                    <span className="font-mono font-medium">{orc.numero}</span>
                    <span className="text-gray-500 ml-2">- {orc.cliente_nome}</span>
                  </div>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(orc.valor_total)}
                  </span>
                </div>
              ) : null;
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowMergeModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMerge}>
              Confirmar Mesclagem
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default OrcamentosPage;
