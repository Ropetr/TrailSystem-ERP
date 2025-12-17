// =============================================
// PLANAC ERP - Orçamentos Page
// Atualizado: 2025-12-17 15:07
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
  cliente_cpf_cnpj?: string;
  vendedor_id?: string;
  vendedor_nome?: string;
  data_emissao: string;
  data_validade: string;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'reprovado' | 'convertido' | 'expirado';
  valor_total: number;
  itens_count: number;
  observacao?: string;
  orcamentos_mesclados?: string[];
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

const statusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
  rascunho: { variant: 'default', label: 'Rascunho' },
  enviado: { variant: 'info', label: 'Enviado' },
  aprovado: { variant: 'success', label: 'Aprovado' },
  reprovado: { variant: 'danger', label: 'Reprovado' },
  convertido: { variant: 'success', label: 'Convertido' },
  expirado: { variant: 'warning', label: 'Expirado' },
};

export function OrcamentosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clienteIdParam = searchParams.get('cliente');
  const toast = useToast();

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrcamentos, setSelectedOrcamentos] = useState<string[]>([]);
  const [showMesclarModal, setShowMesclarModal] = useState(false);

  useEffect(() => {
    loadOrcamentos();
  }, [clienteIdParam]);

  const loadOrcamentos = async () => {
    try {
      const url = clienteIdParam 
        ? `/orcamentos?cliente_id=${clienteIdParam}` 
        : '/orcamentos';
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

  const handleMesclar = async () => {
    if (selectedOrcamentos.length < 2) {
      toast.error('Selecione pelo menos 2 orçamentos para mesclar');
      return;
    }

    try {
      await api.post('/orcamentos/mesclar', { orcamentos_ids: selectedOrcamentos });
      toast.success('Orçamentos mesclados com sucesso');
      setSelectedOrcamentos([]);
      setShowMesclarModal(false);
      loadOrcamentos();
    } catch (error) {
      toast.error('Erro ao mesclar orçamentos');
    }
  };

  const handleConverterPedido = async (id: string) => {
    try {
      const response = await api.post(`/orcamentos/${id}/converter`);
      if (response.success) {
        toast.success('Orçamento convertido em pedido');
        navigate(`/vendas/${response.data.pedido_id}`);
      }
    } catch (error) {
      toast.error('Erro ao converter orçamento');
    }
  };

  const handleEnviarEmail = async (id: string) => {
    try {
      await api.post(`/orcamentos/${id}/enviar-email`);
      toast.success('Orçamento enviado por e-mail');
      loadOrcamentos();
    } catch (error) {
      toast.error('Erro ao enviar e-mail');
    }
  };

  const handleEnviarWhatsApp = async (orcamento: Orcamento) => {
    // Abrir WhatsApp com mensagem pré-formatada
    const mensagem = `Olá! Segue seu orçamento #${orcamento.numero} no valor de R$ ${orcamento.valor_total.toFixed(2)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const toggleSelect = (id: string) => {
    setSelectedOrcamentos((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredOrcamentos = orcamentos.filter((o) => {
    const searchLower = (search || '').toLowerCase();
    const matchSearch =
      String(o.numero || '').toLowerCase().includes(searchLower) ||
      String(o.cliente_nome || '').toLowerCase().includes(searchLower);

    const matchStatus = !statusFilter || o.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const columns = [
    {
      key: 'select',
      header: '',
      width: '40px',
      render: (o: Orcamento) => (
        <input
          type="checkbox"
          checked={selectedOrcamentos.includes(o.id)}
          onChange={() => toggleSelect(o.id)}
          className="w-4 h-4 rounded border-gray-300 text-planac-500 focus:ring-planac-500"
          onClick={(e) => e.stopPropagation()}
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
          <span className="font-mono font-medium text-planac-600">#{o.numero}</span>
          {o.orcamentos_mesclados && o.orcamentos_mesclados.length > 0 && (
            <Badge variant="info" size="sm" title={`Mesclado de ${o.orcamentos_mesclados.length} orçamentos`}>
              +{o.orcamentos_mesclados.length}
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
        <div>
          <p className="font-medium text-gray-900">{o.cliente_nome}</p>
          {o.cliente_cpf_cnpj && (
            <p className="text-sm text-gray-500">{o.cliente_cpf_cnpj}</p>
          )}
        </div>
      ),
    },
    {
      key: 'vendedor_nome',
      header: 'Vendedor',
      width: '150px',
      render: (o: Orcamento) => o.vendedor_nome || '-',
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
          <span className={isExpired ? 'text-red-600' : ''}>
            {formatDate(o.data_validade)}
          </span>
        );
      },
    },
    {
      key: 'itens_count',
      header: 'Itens',
      width: '60px',
      render: (o: Orcamento) => o.itens_count,
    },
    {
      key: 'valor_total',
      header: 'Total',
      width: '120px',
      render: (o: Orcamento) => (
        <span className="font-medium text-green-600">
          {formatCurrency(o.valor_total)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (o: Orcamento) => {
        const config = statusConfig[o.status] || statusConfig.rascunho;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (orcamento: Orcamento) => {
    const items = [
      {
        label: 'Editar',
        icon: <Icons.edit className="w-4 h-4" />,
        onClick: () => navigate(`/comercial/orcamentos/${orcamento.id}`),
      },
      {
        label: 'Duplicar',
        icon: <Icons.copy className="w-4 h-4" />,
        onClick: () => navigate(`/comercial/orcamentos/novo?duplicar=${orcamento.id}`),
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
        onClick: () => handleEnviarEmail(orcamento.id),
      },
      {
        label: 'Enviar WhatsApp',
        icon: <Icons.messageCircle className="w-4 h-4" />,
        onClick: () => handleEnviarWhatsApp(orcamento),
      },
    ];

    if (orcamento.status === 'aprovado') {
      items.push(
        { type: 'separator' as const },
        {
          label: 'Converter em Pedido',
          icon: <Icons.shoppingCart className="w-4 h-4" />,
          variant: 'success' as const,
          onClick: () => handleConverterPedido(orcamento.id),
        }
      );
    }

    items.push(
      { type: 'separator' as const },
      {
        label: 'Excluir',
        icon: <Icons.trash className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleDelete(orcamento.id),
      }
    );

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500">Gerencie seus orçamentos</p>
        </div>
        <div className="flex gap-3">
          {selectedOrcamentos.length >= 2 && (
            <Button
              variant="secondary"
              leftIcon={<Icons.merge className="w-5 h-5" />}
              onClick={() => setShowMesclarModal(true)}
            >
              Mesclar ({selectedOrcamentos.length})
            </Button>
          )}
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => navigate('/comercial/orcamentos/novo')}
          >
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{orcamentos.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {orcamentos.filter((o) => o.status === 'enviado').length}
            </p>
            <p className="text-sm text-gray-500">Enviados</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {orcamentos.filter((o) => o.status === 'aprovado').length}
            </p>
            <p className="text-sm text-gray-500">Aprovados</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {orcamentos.filter((o) => new Date(o.data_validade) < new Date() && o.status !== 'convertido').length}
            </p>
            <p className="text-sm text-gray-500">Expirados</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(orcamentos.filter((o) => o.status === 'aprovado').reduce((acc, o) => acc + o.valor_total, 0))}
            </p>
            <p className="text-sm text-gray-500">Aprovados (R$)</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredOrcamentos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum orçamento encontrado"
          onRowClick={(o) => navigate(`/comercial/orcamentos/${o.id}`)}
        />
      </Card>

      {/* Modal Mesclar */}
      <Modal
        isOpen={showMesclarModal}
        onClose={() => setShowMesclarModal(false)}
        title="Mesclar Orçamentos"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Você está prestes a mesclar {selectedOrcamentos.length} orçamentos.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icons.alertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Atenção:</p>
                <ul className="list-disc ml-4 mt-1">
                  <li>Os orçamentos selecionados serão combinados em um único</li>
                  <li>O cliente do primeiro orçamento será mantido</li>
                  <li>Itens duplicados terão o menor preço aplicado</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowMesclarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMesclar}>
              Confirmar Mesclagem
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default OrcamentosPage;

