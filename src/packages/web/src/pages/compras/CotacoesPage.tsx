// =============================================
// PLANAC ERP - Cotações de Compra
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface ItemCotacao {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

interface RespostaFornecedor {
  fornecedor_id: string;
  fornecedor_nome: string;
  valor_total: number;
  prazo_entrega: number;
  condicao_pagamento: string;
  validade_proposta: string;
  selecionado: boolean;
}

interface Cotacao {
  id: string;
  numero: string;
  titulo: string;
  data_abertura: string;
  data_encerramento: string;
  status: 'aberta' | 'em_analise' | 'finalizada' | 'cancelada';
  itens: ItemCotacao[];
  fornecedores_convidados: number;
  respostas_recebidas: number;
  respostas: RespostaFornecedor[];
  melhor_proposta?: {
    fornecedor_nome: string;
    valor_total: number;
  };
}

const statusConfig = {
  aberta: { label: 'Aberta', variant: 'info' as const },
  em_analise: { label: 'Em Análise', variant: 'warning' as const },
  finalizada: { label: 'Finalizada', variant: 'success' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
};

export function CotacoesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal de comparação
  const [showCompararModal, setShowCompararModal] = useState(false);
  const [cotacaoComparar, setCotacaoComparar] = useState<Cotacao | null>(null);

  useEffect(() => {
    loadCotacoes();
  }, []);

  const loadCotacoes = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Cotacao[] }>('/compras/cotacoes');
      if (response.success) {
        setCotacoes(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar cotações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEncerrar = async (cotacao: Cotacao) => {
    try {
      await api.post(`/compras/cotacoes/${cotacao.id}/encerrar`);
      toast.success('Cotação encerrada');
      loadCotacoes();
    } catch (error) {
      toast.error('Erro ao encerrar cotação');
    }
  };

  const handleSelecionarVencedor = async (cotacaoId: string, fornecedorId: string) => {
    try {
      await api.post(`/compras/cotacoes/${cotacaoId}/selecionar`, {
        fornecedor_id: fornecedorId,
      });
      toast.success('Fornecedor selecionado! Pedido de compra gerado.');
      setShowCompararModal(false);
      loadCotacoes();
    } catch (error) {
      toast.error('Erro ao selecionar fornecedor');
    }
  };

  const filteredCotacoes = cotacoes.filter((cotacao) => {
    const matchSearch =
      cotacao.numero?.includes(search) ||
      cotacao.titulo?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || cotacao.status === statusFilter;

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
      key: 'numero',
      header: 'Número',
      width: '100px',
      render: (cotacao: Cotacao) => (
        <span className="font-mono font-bold">{cotacao.numero}</span>
      ),
    },
    {
      key: 'titulo',
      header: 'Título',
      render: (cotacao: Cotacao) => (
        <div>
          <p className="font-medium text-gray-900">{cotacao.titulo}</p>
          <p className="text-sm text-gray-500">{cotacao.itens.length} item(ns)</p>
        </div>
      ),
    },
    {
      key: 'abertura',
      header: 'Abertura',
      width: '100px',
      render: (cotacao: Cotacao) => formatDate(cotacao.data_abertura),
    },
    {
      key: 'encerramento',
      header: 'Encerramento',
      width: '100px',
      render: (cotacao: Cotacao) => formatDate(cotacao.data_encerramento),
    },
    {
      key: 'respostas',
      header: 'Respostas',
      width: '100px',
      render: (cotacao: Cotacao) => (
        <span>
          {cotacao.respostas_recebidas} / {cotacao.fornecedores_convidados}
        </span>
      ),
    },
    {
      key: 'melhor',
      header: 'Melhor Proposta',
      width: '150px',
      render: (cotacao: Cotacao) => cotacao.melhor_proposta ? (
        <div>
          <p className="font-bold text-green-600">{formatCurrency(cotacao.melhor_proposta.valor_total)}</p>
          <p className="text-xs text-gray-500">{cotacao.melhor_proposta.fornecedor_nome}</p>
        </div>
      ) : '-',
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (cotacao: Cotacao) => {
        const config = statusConfig[cotacao.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (cotacao: Cotacao) => {
    const items = [];

    if (cotacao.respostas_recebidas > 0) {
      items.push({
        label: 'Comparar Propostas',
        icon: <Icons.document className="w-4 h-4" />,
        onClick: () => {
          setCotacaoComparar(cotacao);
          setShowCompararModal(true);
        },
      });
    }

    if (cotacao.status === 'aberta') {
      items.push(
        {
          label: 'Editar',
          icon: <Icons.edit className="w-4 h-4" />,
          onClick: () => navigate(`/compras/cotacoes/${cotacao.id}`),
        },
        {
          label: 'Encerrar Cotação',
          icon: <Icons.check className="w-4 h-4" />,
          onClick: () => handleEncerrar(cotacao),
        }
      );
    }

    items.push({
      label: 'Ver Detalhes',
      icon: <Icons.eye className="w-4 h-4" />,
      onClick: () => navigate(`/compras/cotacoes/${cotacao.id}`),
    });

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotações de Compra</h1>
          <p className="text-gray-500">Compare preços entre fornecedores</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={() => navigate('/compras/cotacoes/nova')}
        >
          Nova Cotação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Cotações Abertas</p>
          <p className="text-2xl font-bold text-blue-600">
            {cotacoes.filter(c => c.status === 'aberta').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Em Análise</p>
          <p className="text-2xl font-bold text-orange-600">
            {cotacoes.filter(c => c.status === 'em_analise').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Finalizadas (mês)</p>
          <p className="text-2xl font-bold text-green-600">
            {cotacoes.filter(c => c.status === 'finalizada').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Economia Média</p>
          <p className="text-2xl font-bold text-planac-600">12%</p>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por número, título..."
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
                { value: '', label: 'Todos Status' },
                ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredCotacoes}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma cotação encontrada"
        />
      </Card>

      {/* Modal Comparar Propostas */}
      <Modal
        isOpen={showCompararModal}
        onClose={() => setShowCompararModal(false)}
        title={`Comparar Propostas - ${cotacaoComparar?.titulo}`}
        size="xl"
      >
        {cotacaoComparar && cotacaoComparar.respostas && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Compare as propostas recebidas e selecione o fornecedor vencedor
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Fornecedor</th>
                    <th className="text-right p-3">Valor Total</th>
                    <th className="text-center p-3">Prazo (dias)</th>
                    <th className="text-left p-3">Condição Pgto</th>
                    <th className="text-center p-3">Validade</th>
                    <th className="text-center p-3">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cotacaoComparar.respostas
                    .sort((a, b) => a.valor_total - b.valor_total)
                    .map((resp, index) => (
                      <tr 
                        key={resp.fornecedor_id}
                        className={index === 0 ? 'bg-green-50' : ''}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <Badge variant="success">Melhor Preço</Badge>
                            )}
                            {resp.fornecedor_nome}
                          </div>
                        </td>
                        <td className="p-3 text-right font-bold">
                          {formatCurrency(resp.valor_total)}
                        </td>
                        <td className="p-3 text-center">{resp.prazo_entrega}</td>
                        <td className="p-3">{resp.condicao_pagamento}</td>
                        <td className="p-3 text-center">{formatDate(resp.validade_proposta)}</td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant={resp.selecionado ? 'primary' : 'secondary'}
                            onClick={() => handleSelecionarVencedor(cotacaoComparar.id, resp.fornecedor_id)}
                            disabled={resp.selecionado}
                          >
                            {resp.selecionado ? 'Selecionado' : 'Selecionar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CotacoesPage;
