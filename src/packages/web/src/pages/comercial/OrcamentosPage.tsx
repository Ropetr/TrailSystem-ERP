// =============================================
// PLANAC ERP - Orçamentos Page
// Atualizado: 2025-12-17 18:00
// =============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { ClienteSelect, ClienteOption } from '@/components/ui/ClienteSelect';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

// =============================================
// INTERFACES
// =============================================
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
  orcamentos_mesclados?: { id: string; numero: string }[];
}

// =============================================
// CONSTANTES
// =============================================
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

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export function OrcamentosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clienteIdParam = searchParams.get('cliente');
  const toast = useToast();

  // Estados
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrcamentos, setSelectedOrcamentos] = useState<string[]>([]);
  const [showMesclarModal, setShowMesclarModal] = useState(false);
  const [clientesDosMesclados, setClientesDosMesclados] = useState<ClienteOption[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');

  // =============================================
  // EFEITOS
  // =============================================
  
  // Atalho de teclado "+" para novo orçamento
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (e.key === '+' || (e.key === '=' && !e.shiftKey)) {
        e.preventDefault();
        navigate('/comercial/orcamentos/novo');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    loadOrcamentos();
  }, [clienteIdParam]);

  // =============================================
  // FUNÇÕES DE CARREGAMENTO
  // =============================================
  const loadOrcamentos = async () => {
    try {
      const url = clienteIdParam 
        ? `/orcamentos?cliente_id=${clienteIdParam}` 
        : '/orcamentos';
      const response = await api.get<{ success: boolean; data: Orcamento[] }>(url);
      if (response.success) {
        const data = response.data.map((o: any) => ({
          ...o,
          orcamentos_mesclados: typeof o.orcamentos_mesclados === 'string' 
            ? JSON.parse(o.orcamentos_mesclados) 
            : o.orcamentos_mesclados
        }));
        setOrcamentos(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // HANDLERS
  // =============================================
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

  const handleAbrirModalMesclar = useCallback(() => {
    const clientesUnicos = new Map<string, ClienteOption>();
    
    selectedOrcamentos.forEach((id) => {
      const orc = orcamentos.find((o) => o.id === id);
      if (orc && !clientesUnicos.has(orc.cliente_id)) {
        clientesUnicos.set(orc.cliente_id, {
          id: orc.cliente_id,
          nome: orc.cliente_nome,
          cpf_cnpj: orc.cliente_cpf_cnpj,
        });
      }
    });
    
    const clientes = Array.from(clientesUnicos.values());
    setClientesDosMesclados(clientes);
    
    // Se todos são do mesmo cliente, seleciona automaticamente
    if (clientes.length === 1) {
      setClienteSelecionado(clientes[0].id);
    } else {
      setClienteSelecionado('');
    }
    
    setShowMesclarModal(true);
  }, [selectedOrcamentos, orcamentos]);

  const handleMesclar = async () => {
    if (selectedOrcamentos.length < 2) {
      toast.error('Selecione pelo menos 2 orçamentos para mesclar');
      return;
    }
    
    if (!clienteSelecionado) {
      toast.error('Selecione o cliente para o novo orçamento');
      return;
    }

    try {
      await api.post('/orcamentos/mesclar', { 
        orcamentos_ids: selectedOrcamentos,
        cliente_id: clienteSelecionado,
      });
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
      toast.success('E-mail enviado com sucesso');
    } catch (error) {
      toast.error('Erro ao enviar e-mail');
    }
  };

  const handleEnviarWhatsApp = (orcamento: Orcamento) => {
    const mensagem = `Olá! Segue seu orçamento ${orcamento.numero} no valor de R$ ${orcamento.valor_total.toFixed(2)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  // =============================================
  // DADOS FILTRADOS
  // =============================================
  const filteredOrcamentos = orcamentos
    .filter((o) => {
      const searchLower = (search || '').toLowerCase();
      const matchSearch =
        String(o.numero || '').toLowerCase().includes(searchLower) ||
        String(o.cliente_nome || '').toLowerCase().includes(searchLower);

      const matchStatus = !statusFilter || o.status === statusFilter;

      return matchSearch && matchStatus;
    })
    .sort((a, b) => Number(a.numero) - Number(b.numero));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // =============================================
  // COLUNAS DA TABELA
  // =============================================
  const columns = [
    {
      key: 'select',
      header: '',
      width: '40px',
      render: (o: Orcamento) => (
        <input
          type="checkbox"
          checked={selectedOrcamentos.includes(o.id)}
          onChange={(e) => {
            e.stopPropagation();
            if (e.target.checked) {
              setSelectedOrcamentos([...selectedOrcamentos, o.id]);
            } else {
              setSelectedOrcamentos(selectedOrcamentos.filter((id) => id !== o.id));
            }
          }}
          className="w-4 h-4 rounded border-gray-300 text-planac-500 focus:ring-planac-500"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'numero',
      header: 'Número',
      width: '140px',
      sortable: true,
      render: (o: Orcamento) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-planac-600">{o.numero}</span>
          {o.orcamentos_mesclados && o.orcamentos_mesclados.length > 0 && (
            <MescladosIndicator mesclados={o.orcamentos_mesclados} onNavigate={(id) => navigate(`/comercial/orcamentos/${id}`)} />
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
            <p className="text-xs text-gray-500 font-mono">{o.cliente_cpf_cnpj}</p>
          )}
        </div>
      ),
    },
    {
      key: 'data_emissao',
      header: 'Emissão',
      width: '100px',
      sortable: true,
      render: (o: Orcamento) => formatDate(o.data_emissao),
    },
    {
      key: 'data_validade',
      header: 'Validade',
      width: '100px',
      sortable: true,
      render: (o: Orcamento) => {
        const validade = new Date(o.data_validade);
        const hoje = new Date();
        const expirado = validade < hoje && o.status !== 'convertido';
        return (
          <span className={expirado ? 'text-red-600 font-medium' : ''}>
            {formatDate(o.data_validade)}
          </span>
        );
      },
    },
    {
      key: 'valor_total',
      header: 'Valor',
      width: '120px',
      sortable: true,
      render: (o: Orcamento) => (
        <span className="font-medium text-gray-900">{formatCurrency(o.valor_total)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (o: Orcamento) => {
        const config = statusConfig[o.status] || { variant: 'default', label: o.status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  // =============================================
  // AÇÕES DO MENU
  // =============================================
  const getActions = useCallback((orcamento: Orcamento) => {
    const items: { label?: string; icon?: React.ReactNode; onClick?: () => void; variant?: 'default' | 'danger' | 'success'; type?: 'separator' }[] = [];
    
    // Mesclar - só aparece se este orçamento está selecionado E há 2+ selecionados
    const isSelected = selectedOrcamentos.includes(orcamento.id);
    if (isSelected && selectedOrcamentos.length >= 2) {
      items.push({
        label: 'Mesclar',
        icon: <Icons.merge className="w-4 h-4" />,
        onClick: handleAbrirModalMesclar,
      });
      items.push({ type: 'separator' as const });
    }
    
    items.push(
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
        icon: <Icons.whatsapp className="w-4 h-4" />,
        onClick: () => handleEnviarWhatsApp(orcamento),
      }
    );

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
  }, [selectedOrcamentos, handleAbrirModalMesclar, navigate]);

  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500">Gerencie seus orçamentos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/comercial/orcamentos/novo')}
            className="p-2 text-gray-600 hover:text-planac-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Novo Orçamento (tecla +)"
          >
            <Icons.plus className="w-6 h-6" />
          </button>
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
      <Card padding="none" className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <DataTable
          data={filteredOrcamentos}
          columns={columns}
          actions={getActions}
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
          
          {/* Seleção de cliente - usando componente padronizado */}
          <ClienteSelect
            label="Selecione o cliente para o novo orçamento:"
            value={clienteSelecionado}
            onChange={(cliente) => setClienteSelecionado(cliente?.id || '')}
            presets={clientesDosMesclados}
            presetsHeader="Clientes dos orçamentos"
            placeholder="Selecione o cliente..."
          />
          <p className="text-xs text-gray-500">
            Clique na setinha para ver os clientes dos orçamentos ou clique no campo para buscar outro cliente.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icons.alertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Atenção:</p>
                <ul className="list-disc ml-4 mt-1">
                  <li>Os orçamentos selecionados serão combinados em um único</li>
                  <li>Itens duplicados terão o menor preço aplicado</li>
                  <li>Você poderá ver quais orçamentos foram mesclados</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowMesclarModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleMesclar}
              disabled={!clienteSelecionado}
            >
              Confirmar Mesclagem
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// =============================================
// COMPONENTE: Indicador de Mesclados
// =============================================
function MescladosIndicator({ 
  mesclados, 
  onNavigate 
}: { 
  mesclados: { id: string; numero: string }[]; 
  onNavigate: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-planac-600 transition-colors"
        title={`Mesclado de ${mesclados.length} orçamentos`}
      >
        <Icons.chevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        <span className="font-medium">{mesclados.length}</span>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
            Orçamentos mesclados
          </div>
          {mesclados.map((m) => (
            <button
              key={m.id}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(m.id);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <Icons.fileText className="w-4 h-4 text-gray-400" />
              <span className="font-mono">{m.numero}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrcamentosPage;
