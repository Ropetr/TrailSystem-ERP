// =============================================
// PLANAC ERP - CRM Pipeline (Kanban) Page
// =============================================

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import api from '@/services/api';

interface Oportunidade {
  id: string;
  titulo: string;
  cliente_id: string;
  cliente_nome: string;
  vendedor_id: string;
  vendedor_nome: string;
  etapa: string;
  valor: number;
  probabilidade: number;
  data_previsao_fechamento?: string;
  dias_na_etapa: number;
  ultima_atividade?: string;
  proxima_atividade?: string;
  created_at: string;
}

interface Etapa {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  oportunidades: Oportunidade[];
  valor_total: number;
}

const etapasConfig: { id: string; nome: string; cor: string }[] = [
  { id: 'prospeccao', nome: 'Prospecção', cor: 'bg-slate-500' },
  { id: 'qualificacao', nome: 'Qualificação', cor: 'bg-blue-500' },
  { id: 'proposta', nome: 'Proposta', cor: 'bg-yellow-500' },
  { id: 'negociacao', nome: 'Negociação', cor: 'bg-orange-500' },
  { id: 'fechamento', nome: 'Fechamento', cor: 'bg-green-500' },
];

const vendedorOptions = [
  { value: '', label: 'Todos os vendedores' },
  { value: '1', label: 'João Silva' },
  { value: '2', label: 'Maria Santos' },
  { value: '3', label: 'Pedro Costa' },
];

export function PipelinePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vendedorFilter, setVendedorFilter] = useState('');
  const [draggedItem, setDraggedItem] = useState<Oportunidade | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedOportunidade, setSelectedOportunidade] = useState<Oportunidade | null>(null);

  useEffect(() => {
    loadPipeline();
  }, [vendedorFilter]);

  const loadPipeline = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (vendedorFilter) params.append('vendedor_id', vendedorFilter);
      
      const response = await api.get<{ success: boolean; data: Oportunidade[] }>(
        `/crm/oportunidades?${params.toString()}`
      );
      
      if (response.success) {
        organizeByEtapa(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar pipeline');
      // Mock data para desenvolvimento
      const mockData: Oportunidade[] = [
        { id: '1', titulo: 'Obra Shopping Center', cliente_id: '1', cliente_nome: 'Construtora ABC', vendedor_id: '1', vendedor_nome: 'João Silva', etapa: 'prospeccao', valor: 85000, probabilidade: 20, dias_na_etapa: 3, created_at: '2024-12-10' },
        { id: '2', titulo: 'Hotel Marina', cliente_id: '2', cliente_nome: 'Rede Hoteleira XYZ', vendedor_id: '2', vendedor_nome: 'Maria Santos', etapa: 'prospeccao', valor: 120000, probabilidade: 25, dias_na_etapa: 5, created_at: '2024-12-08' },
        { id: '3', titulo: 'Escritório Tech', cliente_id: '3', cliente_nome: 'Tech Solutions', vendedor_id: '1', vendedor_nome: 'João Silva', etapa: 'qualificacao', valor: 45000, probabilidade: 40, dias_na_etapa: 2, created_at: '2024-12-09' },
        { id: '4', titulo: 'Clínica Saúde+', cliente_id: '4', cliente_nome: 'Clínica Saúde+', vendedor_id: '3', vendedor_nome: 'Pedro Costa', etapa: 'qualificacao', valor: 38000, probabilidade: 50, dias_na_etapa: 4, created_at: '2024-12-07' },
        { id: '5', titulo: 'Galpão Industrial', cliente_id: '5', cliente_nome: 'Indústria Metal', vendedor_id: '2', vendedor_nome: 'Maria Santos', etapa: 'proposta', valor: 220000, probabilidade: 60, dias_na_etapa: 3, created_at: '2024-12-06' },
        { id: '6', titulo: 'Escola Particular', cliente_id: '6', cliente_nome: 'Colégio ABC', vendedor_id: '1', vendedor_nome: 'João Silva', etapa: 'proposta', valor: 95000, probabilidade: 65, dias_na_etapa: 1, created_at: '2024-12-12' },
        { id: '7', titulo: 'Reforma Banco', cliente_id: '7', cliente_nome: 'Banco XYZ', vendedor_id: '3', vendedor_nome: 'Pedro Costa', etapa: 'negociacao', valor: 180000, probabilidade: 75, dias_na_etapa: 6, created_at: '2024-12-01' },
        { id: '8', titulo: 'Apartamento Luxo', cliente_id: '8', cliente_nome: 'Incorporadora Top', vendedor_id: '2', vendedor_nome: 'Maria Santos', etapa: 'fechamento', valor: 65000, probabilidade: 90, dias_na_etapa: 2, created_at: '2024-12-11' },
      ];
      organizeByEtapa(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  const organizeByEtapa = (oportunidades: Oportunidade[]) => {
    const organized: Etapa[] = etapasConfig.map((config, index) => {
      const ops = oportunidades.filter(o => o.etapa === config.id);
      return {
        ...config,
        ordem: index,
        oportunidades: ops,
        valor_total: ops.reduce((sum, o) => sum + o.valor, 0),
      };
    });
    setEtapas(organized);
  };

  const handleDragStart = (e: React.DragEvent, oportunidade: Oportunidade) => {
    setDraggedItem(oportunidade);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, novaEtapa: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.etapa === novaEtapa) {
      setDraggedItem(null);
      return;
    }

    const etapaAnterior = draggedItem.etapa;
    const oportunidadeId = draggedItem.id;

    // Atualiza localmente primeiro (otimistic update)
    setEtapas(prev => prev.map(etapa => {
      if (etapa.id === etapaAnterior) {
        return {
          ...etapa,
          oportunidades: etapa.oportunidades.filter(o => o.id !== oportunidadeId),
          valor_total: etapa.valor_total - draggedItem.valor,
        };
      }
      if (etapa.id === novaEtapa) {
        const updatedOp = { ...draggedItem, etapa: novaEtapa, dias_na_etapa: 0 };
        return {
          ...etapa,
          oportunidades: [...etapa.oportunidades, updatedOp],
          valor_total: etapa.valor_total + draggedItem.valor,
        };
      }
      return etapa;
    }));

    try {
      await api.put(`/crm/oportunidades/${oportunidadeId}`, { etapa: novaEtapa });
      toast.success(`Movido para ${etapasConfig.find(e => e.id === novaEtapa)?.nome}`);
    } catch (error) {
      toast.error('Erro ao mover oportunidade');
      loadPipeline(); // Recarrega em caso de erro
    }

    setDraggedItem(null);
  };

  const handleQuickView = (oportunidade: Oportunidade) => {
    setSelectedOportunidade(oportunidade);
    setShowQuickView(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredEtapas = etapas.map(etapa => ({
    ...etapa,
    oportunidades: etapa.oportunidades.filter(o =>
      o.titulo.toLowerCase().includes(search.toLowerCase()) ||
      o.cliente_nome.toLowerCase().includes(search.toLowerCase())
    ),
  }));

  const totalPipeline = etapas.reduce((sum, e) => sum + e.valor_total, 0);
  const totalOportunidades = etapas.reduce((sum, e) => sum + e.oportunidades.length, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <p className="text-gray-500">
            {totalOportunidades} oportunidades • {formatCurrency(totalPipeline)} em pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Icons.barChart className="w-4 h-4" />}
            onClick={() => navigate('/crm/dashboard')}
          >
            Dashboard
          </Button>
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => navigate('/crm/oportunidades/nova')}
          >
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar oportunidade ou cliente..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              value={vendedorFilter}
              onChange={setVendedorFilter}
              options={vendedorOptions}
              placeholder="Vendedor"
            />
          </div>
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {filteredEtapas.map((etapa) => (
          <div
            key={etapa.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, etapa.id)}
          >
            {/* Column Header */}
            <div className={`${etapa.cor} rounded-t-lg px-4 py-3`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{etapa.nome}</span>
                  <Badge variant="light" className="bg-white/20 text-white">
                    {etapa.oportunidades.length}
                  </Badge>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(etapa.valor_total)}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div className="bg-gray-100 rounded-b-lg p-2 min-h-[500px] space-y-2">
              {etapa.oportunidades.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <Icons.inbox className="w-8 h-8 mb-2" />
                  <p className="text-sm">Nenhuma oportunidade</p>
                </div>
              ) : (
                etapa.oportunidades.map((oportunidade) => (
                  <div
                    key={oportunidade.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, oportunidade)}
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-grab hover:shadow-md transition-shadow ${
                      draggedItem?.id === oportunidade.id ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-2">
                      <h3
                        className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer truncate flex-1"
                        onClick={() => navigate(`/crm/oportunidades/${oportunidade.id}`)}
                      >
                        {oportunidade.titulo}
                      </h3>
                      <button
                        onClick={() => handleQuickView(oportunidade)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Icons.moreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    {/* Cliente */}
                    <p className="text-sm text-gray-500 mb-2 truncate">
                      <Icons.building className="w-3 h-3 inline mr-1" />
                      {oportunidade.cliente_nome}
                    </p>

                    {/* Valor */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(oportunidade.valor)}
                      </span>
                      <Badge
                        variant={
                          oportunidade.probabilidade >= 70 ? 'success' :
                          oportunidade.probabilidade >= 40 ? 'warning' : 'default'
                        }
                        size="sm"
                      >
                        {oportunidade.probabilidade}%
                      </Badge>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Icons.user className="w-3 h-3" />
                        <span>{oportunidade.vendedor_nome.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icons.clock className="w-3 h-3" />
                        <span className={oportunidade.dias_na_etapa > 7 ? 'text-red-500' : ''}>
                          {oportunidade.dias_na_etapa}d
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Add Button */}
              <button
                onClick={() => navigate(`/crm/oportunidades/nova?etapa=${etapa.id}`)}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg border-2 border-dashed border-gray-200 transition-colors"
              >
                <Icons.plus className="w-4 h-4 inline mr-1" />
                Adicionar
              </button>
            </div>
          </div>
        ))}

        {/* Coluna de Ganhos/Perdidos */}
        <div className="flex-shrink-0 w-80">
          <div className="rounded-lg overflow-hidden">
            {/* Ganhos */}
            <div className="bg-green-500 px-4 py-3">
              <div className="flex items-center gap-2 text-white">
                <Icons.checkCircle className="w-5 h-5" />
                <span className="font-semibold">Ganhos</span>
              </div>
            </div>
            <div className="bg-green-50 p-3 min-h-[200px]">
              <button
                onClick={() => navigate('/crm/oportunidades?status=ganho')}
                className="w-full py-8 text-sm text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              >
                Ver oportunidades ganhas
              </button>
            </div>

            {/* Perdidos */}
            <div className="bg-red-500 px-4 py-3 mt-2">
              <div className="flex items-center gap-2 text-white">
                <Icons.xCircle className="w-5 h-5" />
                <span className="font-semibold">Perdidos</span>
              </div>
            </div>
            <div className="bg-red-50 p-3 min-h-[200px]">
              <button
                onClick={() => navigate('/crm/oportunidades?status=perdido')}
                className="w-full py-8 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                Ver oportunidades perdidas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <Modal
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        title="Visualização Rápida"
        size="md"
      >
        {selectedOportunidade && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{selectedOportunidade.titulo}</h3>
              <p className="text-gray-500">{selectedOportunidade.cliente_nome}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Valor</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(selectedOportunidade.valor)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Probabilidade</p>
                <p className="text-xl font-bold text-blue-600">
                  {selectedOportunidade.probabilidade}%
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Vendedor</p>
              <p className="font-medium">{selectedOportunidade.vendedor_nome}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Tempo na etapa</p>
              <p className="font-medium">{selectedOportunidade.dias_na_etapa} dias</p>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                className="flex-1"
                onClick={() => {
                  setShowQuickView(false);
                  navigate(`/crm/oportunidades/${selectedOportunidade.id}`);
                }}
              >
                Ver Detalhes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuickView(false);
                  navigate(`/crm/atividades/nova?oportunidade=${selectedOportunidade.id}`);
                }}
              >
                Agendar Atividade
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PipelinePage;
