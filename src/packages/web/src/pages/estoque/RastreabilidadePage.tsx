// =============================================
// PLANAC ERP - Rastreabilidade de Estoque
// =============================================

import { useState, useEffect } from 'react';
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

interface Lote {
  id: string;
  numero: string;
  produto_id: string;
  produto_codigo: string;
  produto_descricao: string;
  quantidade: number;
  quantidade_reservada: number;
  quantidade_disponivel: number;
  custo_unitario: number;
  data_fabricacao?: string;
  data_validade?: string;
  dias_para_vencer?: number;
  status: 'ativo' | 'vencido' | 'bloqueado' | 'esgotado';
  filial_id: string;
  filial_nome: string;
  localizacao?: string;
  fornecedor_nome?: string;
  nota_entrada?: string;
  observacao?: string;
  created_at: string;
}

interface MovimentacaoLote {
  id: string;
  tipo: 'entrada' | 'saida' | 'reserva' | 'liberacao';
  quantidade: number;
  documento_tipo?: string;
  documento_numero?: string;
  usuario_nome: string;
  created_at: string;
}

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'bloqueado', label: 'Bloqueado' },
  { value: 'esgotado', label: 'Esgotado' },
];

const validadeOptions = [
  { value: '', label: 'Todas as Validades' },
  { value: 'vencido', label: 'Vencidos' },
  { value: '7', label: 'Vence em 7 dias' },
  { value: '15', label: 'Vence em 15 dias' },
  { value: '30', label: 'Vence em 30 dias' },
  { value: '60', label: 'Vence em 60 dias' },
  { value: '90', label: 'Vence em 90 dias' },
];

export function RastreabilidadePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [validadeFilter, setValidadeFilter] = useState('');
  const [filialFilter, setFilialFilter] = useState('');

  const [filiais, setFiliais] = useState<Array<{ id: string; nome: string }>>([]);

  // Modal de detalhes
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState<Lote | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoLote[]>([]);

  // Modal de bloqueio
  const [showBloquearModal, setShowBloquearModal] = useState(false);
  const [motivoBloqueio, setMotivoBloqueio] = useState('');

  // Modal de ajuste
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [quantidadeAjuste, setQuantidadeAjuste] = useState(0);
  const [motivoAjuste, setMotivoAjuste] = useState('');

  useEffect(() => {
    loadLotes();
    loadFiliais();
  }, [validadeFilter, filialFilter]);

  const loadLotes = async () => {
    try {
      let url = '/estoque/lotes?';
      if (validadeFilter) url += `validade=${validadeFilter}&`;
      if (filialFilter) url += `filial_id=${filialFilter}&`;
      
      const response = await api.get<{ success: boolean; data: Lote[] }>(url);
      if (response.success) {
        setLotes(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar lotes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiliais = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Array<{ id: string; nome: string }> }>('/filiais');
      if (response.success) {
        setFiliais(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar filiais', error);
    }
  };

  const handleVerDetalhes = async (lote: Lote) => {
    setLoteSelecionado(lote);
    try {
      const response = await api.get<{ success: boolean; data: MovimentacaoLote[] }>(
        `/estoque/lotes/${lote.id}/movimentacoes`
      );
      if (response.success) {
        setMovimentacoes(response.data);
      }
    } catch (error) {
      setMovimentacoes([]);
    }
    setShowDetalhesModal(true);
  };

  const handleBloquear = async () => {
    if (!loteSelecionado) return;
    if (!motivoBloqueio.trim()) {
      toast.error('Informe o motivo do bloqueio');
      return;
    }

    try {
      await api.put(`/estoque/lotes/${loteSelecionado.id}/bloquear`, {
        motivo: motivoBloqueio,
      });
      toast.success('Lote bloqueado!');
      setShowBloquearModal(false);
      setMotivoBloqueio('');
      loadLotes();
    } catch (error) {
      toast.error('Erro ao bloquear lote');
    }
  };

  const handleDesbloquear = async (lote: Lote) => {
    if (!confirm('Deseja desbloquear este lote?')) return;

    try {
      await api.put(`/estoque/lotes/${lote.id}/desbloquear`, {});
      toast.success('Lote desbloqueado!');
      loadLotes();
    } catch (error) {
      toast.error('Erro ao desbloquear lote');
    }
  };

  const handleAjustar = async () => {
    if (!loteSelecionado) return;
    if (!motivoAjuste.trim()) {
      toast.error('Informe o motivo do ajuste');
      return;
    }

    try {
      await api.put(`/estoque/lotes/${loteSelecionado.id}/ajustar`, {
        quantidade: quantidadeAjuste,
        motivo: motivoAjuste,
      });
      toast.success('Quantidade ajustada!');
      setShowAjusteModal(false);
      setQuantidadeAjuste(0);
      setMotivoAjuste('');
      loadLotes();
    } catch (error) {
      toast.error('Erro ao ajustar quantidade');
    }
  };

  const filteredLotes = lotes.filter((lote) => {
    const matchSearch =
      lote.numero?.toLowerCase().includes(search.toLowerCase()) ||
      lote.produto_descricao?.toLowerCase().includes(search.toLowerCase()) ||
      lote.produto_codigo?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || lote.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'danger' | 'warning' | 'default'; label: string }> = {
      ativo: { variant: 'success', label: 'Ativo' },
      vencido: { variant: 'danger', label: 'Vencido' },
      bloqueado: { variant: 'warning', label: 'Bloqueado' },
      esgotado: { variant: 'default', label: 'Esgotado' },
    };
    const { variant, label } = config[status] || { variant: 'default', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getValidadeBadge = (diasParaVencer?: number) => {
    if (diasParaVencer === undefined || diasParaVencer === null) return null;
    
    if (diasParaVencer < 0) {
      return <Badge variant="danger" size="sm">Vencido há {Math.abs(diasParaVencer)} dias</Badge>;
    } else if (diasParaVencer <= 7) {
      return <Badge variant="danger" size="sm">Vence em {diasParaVencer} dias</Badge>;
    } else if (diasParaVencer <= 30) {
      return <Badge variant="warning" size="sm">Vence em {diasParaVencer} dias</Badge>;
    } else if (diasParaVencer <= 60) {
      return <Badge variant="info" size="sm">Vence em {diasParaVencer} dias</Badge>;
    }
    return null;
  };

  // Stats
  const stats = {
    total: lotes.length,
    ativos: lotes.filter(l => l.status === 'ativo').length,
    vencidos: lotes.filter(l => l.status === 'vencido').length,
    aVencer: lotes.filter(l => l.dias_para_vencer !== undefined && l.dias_para_vencer >= 0 && l.dias_para_vencer <= 30).length,
    bloqueados: lotes.filter(l => l.status === 'bloqueado').length,
  };

  const columns = [
    {
      key: 'numero',
      header: 'Lote',
      width: '100px',
      sortable: true,
      render: (lote: Lote) => (
        <span className="font-mono font-medium">{lote.numero}</span>
      ),
    },
    {
      key: 'produto',
      header: 'Produto',
      render: (lote: Lote) => (
        <div>
          <p className="font-medium">{lote.produto_descricao}</p>
          <p className="text-sm text-gray-500">{lote.produto_codigo}</p>
        </div>
      ),
    },
    {
      key: 'quantidade',
      header: 'Quantidade',
      width: '130px',
      render: (lote: Lote) => (
        <div>
          <p className="font-medium">{lote.quantidade_disponivel}</p>
          {lote.quantidade_reservada > 0 && (
            <p className="text-xs text-orange-500">
              {lote.quantidade_reservada} reservados
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'validade',
      header: 'Validade',
      width: '150px',
      sortable: true,
      render: (lote: Lote) => (
        <div>
          <p className="text-sm">{formatDate(lote.data_validade)}</p>
          {getValidadeBadge(lote.dias_para_vencer)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (lote: Lote) => getStatusBadge(lote.status),
    },
    {
      key: 'filial',
      header: 'Filial',
      width: '120px',
      render: (lote: Lote) => (
        <div>
          <p className="text-sm">{lote.filial_nome}</p>
          {lote.localizacao && (
            <p className="text-xs text-gray-500">{lote.localizacao}</p>
          )}
        </div>
      ),
    },
    {
      key: 'fornecedor',
      header: 'Fornecedor',
      width: '140px',
      render: (lote: Lote) => (
        <span className="text-sm text-gray-600">{lote.fornecedor_nome || '-'}</span>
      ),
    },
  ];

  const actions = (lote: Lote) => {
    const items = [
      {
        label: 'Ver Detalhes',
        icon: <Icons.eye className="w-4 h-4" />,
        onClick: () => handleVerDetalhes(lote),
      },
      {
        label: 'Ver Produto',
        icon: <Icons.document className="w-4 h-4" />,
        onClick: () => navigate(`/produtos/${lote.produto_id}`),
      },
    ];

    if (lote.status === 'ativo') {
      items.push(
        {
          label: 'Ajustar Quantidade',
          icon: <Icons.edit className="w-4 h-4" />,
          onClick: () => {
            setLoteSelecionado(lote);
            setQuantidadeAjuste(lote.quantidade);
            setShowAjusteModal(true);
          },
        },
        {
          label: 'Bloquear',
          icon: <Icons.x className="w-4 h-4" />,
          variant: 'danger' as const,
          onClick: () => {
            setLoteSelecionado(lote);
            setShowBloquearModal(true);
          },
        }
      );
    }

    if (lote.status === 'bloqueado') {
      items.push({
        label: 'Desbloquear',
        icon: <Icons.check className="w-4 h-4" />,
        onClick: () => handleDesbloquear(lote),
      });
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rastreabilidade</h1>
          <p className="text-gray-500">Controle de lotes e validades</p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<Icons.document className="w-5 h-5" />}
          onClick={() => toast.info('Relatório em desenvolvimento')}
        >
          Relatório de Validades
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total de Lotes</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.aVencer}</p>
              <p className="text-sm text-gray-500">A Vencer (30d)</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icons.x className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.vencidos}</p>
              <p className="text-sm text-gray-500">Vencidos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.x className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.bloqueados}</p>
              <p className="text-sm text-gray-500">Bloqueados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por lote, produto..."
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
            />
          </div>
          <div className="w-48">
            <Select
              value={validadeFilter}
              onChange={setValidadeFilter}
              options={validadeOptions}
            />
          </div>
          <div className="w-40">
            <Select
              value={filialFilter}
              onChange={setFilialFilter}
              options={[{ value: '', label: 'Todas Filiais' }, ...filiais.map(f => ({ value: f.id, label: f.nome }))]}
            />
          </div>
        </div>
      </Card>

      {/* Alertas de Validade */}
      {stats.vencidos > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <Icons.x className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-medium text-red-800">Atenção: {stats.vencidos} lote(s) vencido(s)</p>
            <p className="text-sm text-red-600">Revise os lotes vencidos e tome as providências necessárias.</p>
          </div>
        </div>
      )}

      {stats.aVencer > 0 && stats.vencidos === 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
          <Icons.document className="w-6 h-6 text-orange-500" />
          <div>
            <p className="font-medium text-orange-800">{stats.aVencer} lote(s) próximo(s) da validade</p>
            <p className="text-sm text-orange-600">Priorize a saída destes lotes para evitar perdas.</p>
          </div>
        </div>
      )}

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredLotes}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum lote encontrado"
        />
      </Card>

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetalhesModal}
        onClose={() => {
          setShowDetalhesModal(false);
          setLoteSelecionado(null);
        }}
        title={`Lote ${loteSelecionado?.numero || ''}`}
        size="lg"
      >
        {loteSelecionado && (
          <div className="space-y-4">
            {/* Info do lote */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Produto</p>
                <p className="font-medium">{loteSelecionado.produto_descricao}</p>
                <p className="text-sm text-gray-500">{loteSelecionado.produto_codigo}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1">{getStatusBadge(loteSelecionado.status)}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Quantidade</p>
                <p className="font-medium text-lg">{loteSelecionado.quantidade}</p>
                <p className="text-xs text-gray-500">
                  Disponível: {loteSelecionado.quantidade_disponivel} | 
                  Reservado: {loteSelecionado.quantidade_reservada}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Custo Unitário</p>
                <p className="font-medium">{formatCurrency(loteSelecionado.custo_unitario)}</p>
                <p className="text-xs text-gray-500">
                  Total: {formatCurrency(loteSelecionado.custo_unitario * loteSelecionado.quantidade)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Data de Fabricação</p>
                <p className="font-medium">{formatDate(loteSelecionado.data_fabricacao)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Data de Validade</p>
                <p className="font-medium">{formatDate(loteSelecionado.data_validade)}</p>
                {getValidadeBadge(loteSelecionado.dias_para_vencer)}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Filial / Localização</p>
                <p className="font-medium">{loteSelecionado.filial_nome}</p>
                <p className="text-sm text-gray-500">{loteSelecionado.localizacao || 'Não informada'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Fornecedor / NF</p>
                <p className="font-medium">{loteSelecionado.fornecedor_nome || '-'}</p>
                <p className="text-sm text-gray-500">{loteSelecionado.nota_entrada || ''}</p>
              </div>
            </div>

            {/* Histórico de movimentações */}
            <div>
              <h3 className="font-medium mb-2">Histórico de Movimentações</h3>
              {movimentacoes.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma movimentação registrada</p>
              ) : (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {movimentacoes.map((mov) => (
                    <div key={mov.id} className="p-3 flex justify-between items-center">
                      <div>
                        <Badge 
                          variant={mov.tipo === 'entrada' ? 'success' : mov.tipo === 'saida' ? 'danger' : 'info'} 
                          size="sm"
                        >
                          {mov.tipo}
                        </Badge>
                        <span className="ml-2 text-sm">
                          {mov.documento_tipo} {mov.documento_numero}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                          {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(mov.created_at).toLocaleString('pt-BR')} - {mov.usuario_nome}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Bloquear */}
      <Modal
        isOpen={showBloquearModal}
        onClose={() => {
          setShowBloquearModal(false);
          setMotivoBloqueio('');
        }}
        title="Bloquear Lote"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="font-medium text-yellow-800">Atenção!</p>
            <p className="text-sm text-yellow-600">
              Ao bloquear este lote, ele não poderá ser utilizado em novas vendas ou movimentações.
            </p>
          </div>

          <Input
            label="Motivo do Bloqueio *"
            value={motivoBloqueio}
            onChange={(e) => setMotivoBloqueio(e.target.value)}
            placeholder="Descreva o motivo do bloqueio"
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowBloquearModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleBloquear}>
              Bloquear Lote
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ajustar Quantidade */}
      <Modal
        isOpen={showAjusteModal}
        onClose={() => {
          setShowAjusteModal(false);
          setQuantidadeAjuste(0);
          setMotivoAjuste('');
        }}
        title="Ajustar Quantidade"
      >
        {loteSelecionado && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{loteSelecionado.produto_descricao}</p>
              <p className="text-sm text-gray-500">Lote: {loteSelecionado.numero}</p>
              <p className="text-sm mt-2">
                Quantidade atual: <span className="font-bold">{loteSelecionado.quantidade}</span>
              </p>
            </div>

            <Input
              label="Nova Quantidade *"
              type="number"
              min={0}
              value={quantidadeAjuste}
              onChange={(e) => setQuantidadeAjuste(parseInt(e.target.value) || 0)}
            />

            {quantidadeAjuste !== loteSelecionado.quantidade && (
              <div className={`p-3 rounded-lg ${quantidadeAjuste < loteSelecionado.quantidade ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                <p className="font-medium">
                  Diferença: {quantidadeAjuste > loteSelecionado.quantidade ? '+' : ''}{quantidadeAjuste - loteSelecionado.quantidade}
                </p>
              </div>
            )}

            <Input
              label="Motivo do Ajuste *"
              value={motivoAjuste}
              onChange={(e) => setMotivoAjuste(e.target.value)}
              placeholder="Descreva o motivo do ajuste"
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowAjusteModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAjustar}>
                Confirmar Ajuste
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default RastreabilidadePage;
