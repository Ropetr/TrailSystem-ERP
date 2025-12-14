// =============================================
// PLANAC ERP - Inventário / Contagem de Estoque
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

interface ItemInventario {
  id: string;
  produto_id: string;
  produto_nome: string;
  produto_codigo: string;
  estoque_sistema: number;
  estoque_contado: number | null;
  diferenca: number | null;
  status: 'pendente' | 'contado' | 'conferido';
  observacao?: string;
}

interface Inventario {
  id: string;
  numero: string;
  filial_id: string;
  filial_nome: string;
  tipo: 'geral' | 'parcial' | 'rotativo';
  status: 'aberto' | 'em_contagem' | 'em_conferencia' | 'finalizado' | 'cancelado';
  total_itens: number;
  itens_contados: number;
  itens_divergentes: number;
  usuario_criacao: string;
  created_at: string;
  finalizado_em?: string;
  itens?: ItemInventario[];
}

const statusConfig = {
  aberto: { label: 'Aberto', variant: 'default' as const },
  em_contagem: { label: 'Em Contagem', variant: 'warning' as const },
  em_conferencia: { label: 'Em Conferência', variant: 'info' as const },
  finalizado: { label: 'Finalizado', variant: 'success' as const },
  cancelado: { label: 'Cancelado', variant: 'danger' as const },
};

const tipoConfig = {
  geral: { label: 'Geral', desc: 'Todos os produtos' },
  parcial: { label: 'Parcial', desc: 'Produtos selecionados' },
  rotativo: { label: 'Rotativo', desc: 'Por categoria/corredor' },
};

export function InventarioPage() {
  const toast = useToast();
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal de novo inventário
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoInventario, setNovoInventario] = useState({
    tipo: 'geral' as 'geral' | 'parcial' | 'rotativo',
    filial_id: '',
    observacao: '',
  });
  
  // Modal de contagem
  const [showContagemModal, setShowContagemModal] = useState(false);
  const [inventarioAtivo, setInventarioAtivo] = useState<Inventario | null>(null);
  const [itensContagem, setItensContagem] = useState<ItemInventario[]>([]);
  const [itemAtual, setItemAtual] = useState(0);
  const [quantidadeContada, setQuantidadeContada] = useState('');
  const [codigoBusca, setCodigoBusca] = useState('');

  useEffect(() => {
    loadInventarios();
  }, []);

  const loadInventarios = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Inventario[] }>('/estoque/inventarios');
      if (response.success) {
        setInventarios(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar inventários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCriarInventario = async () => {
    if (!novoInventario.filial_id) {
      toast.error('Selecione uma filial');
      return;
    }

    try {
      await api.post('/estoque/inventarios', novoInventario);
      toast.success('Inventário criado com sucesso');
      setShowNovoModal(false);
      setNovoInventario({ tipo: 'geral', filial_id: '', observacao: '' });
      loadInventarios();
    } catch (error) {
      toast.error('Erro ao criar inventário');
    }
  };

  const handleIniciarContagem = async (inventario: Inventario) => {
    try {
      const response = await api.get<{ success: boolean; data: Inventario }>(
        `/estoque/inventarios/${inventario.id}`
      );
      if (response.success) {
        setInventarioAtivo(response.data);
        setItensContagem(response.data.itens || []);
        setItemAtual(0);
        setQuantidadeContada('');
        setShowContagemModal(true);
      }
    } catch (error) {
      toast.error('Erro ao carregar itens do inventário');
    }
  };

  const handleRegistrarContagem = async () => {
    if (!inventarioAtivo || itensContagem.length === 0) return;
    
    const item = itensContagem[itemAtual];
    const quantidade = parseInt(quantidadeContada);
    
    if (isNaN(quantidade) || quantidade < 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }

    try {
      await api.put(`/estoque/inventarios/${inventarioAtivo.id}/itens/${item.id}`, {
        estoque_contado: quantidade,
      });
      
      // Atualizar item local
      const novosItens = [...itensContagem];
      novosItens[itemAtual] = {
        ...item,
        estoque_contado: quantidade,
        diferenca: quantidade - item.estoque_sistema,
        status: 'contado',
      };
      setItensContagem(novosItens);
      
      // Próximo item ou finalizar
      if (itemAtual < itensContagem.length - 1) {
        setItemAtual(itemAtual + 1);
        setQuantidadeContada('');
        setCodigoBusca('');
      } else {
        toast.success('Contagem finalizada!');
        setShowContagemModal(false);
        loadInventarios();
      }
    } catch (error) {
      toast.error('Erro ao registrar contagem');
    }
  };

  const handleBuscarProduto = () => {
    const idx = itensContagem.findIndex(
      i => i.produto_codigo === codigoBusca || i.produto_id === codigoBusca
    );
    if (idx >= 0) {
      setItemAtual(idx);
      setCodigoBusca('');
    } else {
      toast.error('Produto não encontrado no inventário');
    }
  };

  const handleFinalizarInventario = async (id: string) => {
    if (!confirm('Deseja finalizar o inventário e aplicar os ajustes de estoque?')) return;
    
    try {
      await api.post(`/estoque/inventarios/${id}/finalizar`);
      toast.success('Inventário finalizado! Estoque ajustado.');
      loadInventarios();
    } catch (error) {
      toast.error('Erro ao finalizar inventário');
    }
  };

  const filteredInventarios = inventarios.filter((inv) => {
    const matchSearch =
      inv.numero?.toLowerCase().includes(search.toLowerCase()) ||
      inv.filial_nome?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || inv.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const columns = [
    {
      key: 'numero',
      header: 'Número',
      width: '100px',
      sortable: true,
      render: (inv: Inventario) => (
        <span className="font-mono font-medium">{inv.numero}</span>
      ),
    },
    {
      key: 'filial',
      header: 'Filial',
      render: (inv: Inventario) => inv.filial_nome,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      width: '100px',
      render: (inv: Inventario) => (
        <Badge variant="default">{tipoConfig[inv.tipo].label}</Badge>
      ),
    },
    {
      key: 'progresso',
      header: 'Progresso',
      width: '150px',
      render: (inv: Inventario) => {
        const percentual = inv.total_itens > 0 
          ? Math.round((inv.itens_contados / inv.total_itens) * 100) 
          : 0;
        return (
          <div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-planac-500 h-2 rounded-full" 
                  style={{ width: `${percentual}%` }}
                />
              </div>
              <span className="text-xs font-medium">{percentual}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {inv.itens_contados}/{inv.total_itens} itens
            </p>
          </div>
        );
      },
    },
    {
      key: 'divergencias',
      header: 'Divergências',
      width: '100px',
      render: (inv: Inventario) => (
        <span className={inv.itens_divergentes > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}>
          {inv.itens_divergentes}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (inv: Inventario) => {
        const config = statusConfig[inv.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'created_at',
      header: 'Criado em',
      width: '120px',
      render: (inv: Inventario) => formatDate(inv.created_at),
    },
  ];

  const actions = (inventario: Inventario) => {
    const items = [];

    if (['aberto', 'em_contagem'].includes(inventario.status)) {
      items.push({
        label: 'Iniciar/Continuar Contagem',
        icon: <Icons.edit className="w-4 h-4" />,
        onClick: () => handleIniciarContagem(inventario),
      });
    }

    if (inventario.status === 'em_conferencia') {
      items.push({
        label: 'Finalizar e Ajustar Estoque',
        icon: <Icons.check className="w-4 h-4" />,
        variant: 'success' as const,
        onClick: () => handleFinalizarInventario(inventario.id),
      });
    }

    if (inventario.status !== 'finalizado' && inventario.status !== 'cancelado') {
      items.push({
        label: 'Cancelar',
        icon: <Icons.x className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => {},
      });
    }

    return items;
  };

  // Item atual da contagem
  const itemContagem = itensContagem[itemAtual];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventário</h1>
          <p className="text-gray-500">Contagem e conferência de estoque</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={() => setShowNovoModal(true)}
        >
          Novo Inventário
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

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredInventarios}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum inventário encontrado"
        />
      </Card>

      {/* Modal Novo Inventário */}
      <Modal
        isOpen={showNovoModal}
        onClose={() => setShowNovoModal(false)}
        title="Novo Inventário"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Tipo de Inventário"
            value={novoInventario.tipo}
            onChange={(v) => setNovoInventario({ ...novoInventario, tipo: v as any })}
            options={Object.entries(tipoConfig).map(([k, v]) => ({ 
              value: k, 
              label: `${v.label} - ${v.desc}` 
            }))}
          />
          
          <Select
            label="Filial"
            value={novoInventario.filial_id}
            onChange={(v) => setNovoInventario({ ...novoInventario, filial_id: v })}
            options={[
              { value: '', label: 'Selecione...' },
              { value: '1', label: 'Matriz' },
              { value: '2', label: 'Filial 01' },
            ]}
          />
          
          <Input
            label="Observação"
            placeholder="Motivo ou observação do inventário..."
            value={novoInventario.observacao}
            onChange={(e) => setNovoInventario({ ...novoInventario, observacao: e.target.value })}
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowNovoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarInventario}>
              Criar Inventário
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Contagem */}
      <Modal
        isOpen={showContagemModal}
        onClose={() => setShowContagemModal(false)}
        title={`Contagem - ${inventarioAtivo?.numero}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Busca por código */}
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por código de barras ou SKU..."
              value={codigoBusca}
              onChange={(e) => setCodigoBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarProduto()}
            />
            <Button variant="secondary" onClick={handleBuscarProduto}>
              Buscar
            </Button>
          </div>
          
          {/* Progresso */}
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Progresso da Contagem</span>
              <span className="font-medium">{itemAtual + 1} de {itensContagem.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-planac-500 h-2 rounded-full transition-all" 
                style={{ width: `${((itemAtual + 1) / itensContagem.length) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Item atual */}
          {itemContagem && (
            <Card className="border-2 border-planac-500">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Código</p>
                  <p className="font-mono font-bold text-lg">{itemContagem.produto_codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estoque Sistema</p>
                  <p className="font-bold text-lg text-blue-600">{itemContagem.estoque_sistema}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Produto</p>
                  <p className="font-medium text-lg">{itemContagem.produto_nome}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade Contada
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={quantidadeContada}
                    onChange={(e) => setQuantidadeContada(e.target.value)}
                    placeholder="Digite a quantidade..."
                    className="text-2xl font-bold text-center"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRegistrarContagem()}
                  />
                  <Button onClick={handleRegistrarContagem} size="lg">
                    <Icons.check className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* Navegação */}
          <div className="flex justify-between">
            <Button 
              variant="secondary" 
              onClick={() => setItemAtual(Math.max(0, itemAtual - 1))}
              disabled={itemAtual === 0}
            >
              <Icons.chevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <Button 
              variant="secondary"
              onClick={() => setItemAtual(Math.min(itensContagem.length - 1, itemAtual + 1))}
              disabled={itemAtual === itensContagem.length - 1}
            >
              Próximo <Icons.chevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default InventarioPage;
