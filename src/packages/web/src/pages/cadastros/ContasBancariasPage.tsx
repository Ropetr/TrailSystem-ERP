// =============================================
// TRAILSYSTEM ERP - Contas Bancarias Page
// Cadastro de contas bancarias com integracao API
// =============================================

import { useState, useEffect } from 'react';
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

interface ContaBancaria {
  id: string;
  banco_id: string;
  banco_nome: string;
  banco_codigo: string;
  agencia: string;
  agencia_digito?: string;
  conta: string;
  conta_digito?: string;
  tipo_conta: 'corrente' | 'poupanca' | 'pagamento';
  descricao?: string;
  ambiente: 'homologacao' | 'producao';
  integracao_ativa: boolean;
  boleto_ativo: boolean;
  pix_ativo: boolean;
  ultima_sincronizacao?: string;
  status_conexao?: 'ok' | 'erro' | 'pendente';
  ativo: boolean;
  created_at: string;
}

interface Banco {
  id: string;
  codigo: string;
  nome: string;
  tem_api: boolean;
}

const bancosDisponiveis: Banco[] = [
  { id: '1', codigo: '084', nome: 'Sisprime do Brasil', tem_api: true },
  { id: '2', codigo: '756', nome: 'Sicoob', tem_api: true },
  { id: '3', codigo: '001', nome: 'Banco do Brasil', tem_api: true },
  { id: '4', codigo: '104', nome: 'Caixa Economica Federal', tem_api: true },
  { id: '5', codigo: '422', nome: 'Banco Safra', tem_api: true },
  { id: '6', codigo: '237', nome: 'Bradesco', tem_api: false },
  { id: '7', codigo: '341', nome: 'Itau', tem_api: false },
  { id: '8', codigo: '033', nome: 'Santander', tem_api: false },
  { id: '9', codigo: '748', nome: 'Sicredi', tem_api: false },
  { id: '10', codigo: '077', nome: 'Banco Inter', tem_api: false },
];

// tiposConta removido - não utilizado nesta página

const statusConexaoConfig = {
  ok: { label: 'Conectado', variant: 'success' as const, icon: '✓' },
  erro: { label: 'Erro', variant: 'danger' as const, icon: '✗' },
  pendente: { label: 'Pendente', variant: 'warning' as const, icon: '⏳' },
};

export function ContasBancariasPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bancoFilter, setBancoFilter] = useState('');
  const [_testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get<{ success: boolean; data: ContaBancaria[] }>('/cadastros/contas-bancarias');
      if (response.success) {
        setContas(response.data);
      }
    } catch (error) {
      // Mock data para desenvolvimento
      setContas([
        {
          id: '1',
          banco_id: '1',
          banco_nome: 'Sisprime do Brasil',
          banco_codigo: '084',
          agencia: '0016',
          agencia_digito: '7',
          conta: '117811',
          conta_digito: '3',
          tipo_conta: 'corrente',
          descricao: 'Conta Principal - Planac',
          ambiente: 'homologacao',
          integracao_ativa: true,
          boleto_ativo: true,
          pix_ativo: true,
          ultima_sincronizacao: '2026-01-01T10:30:00Z',
          status_conexao: 'ok',
          ativo: true,
          created_at: '2025-12-01T00:00:00Z',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    navigate('/cadastros/financeiro/contas-bancarias/novo');
  };

  const handleEdit = (conta: ContaBancaria) => {
    navigate(`/cadastros/financeiro/contas-bancarias/${conta.id}`);
  };

  const handleTestarConexao = async (conta: ContaBancaria) => {
    setTestingConnection(conta.id);
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/cadastros/contas-bancarias/${conta.id}/testar-conexao`
      );
      if (response.success) {
        toast.success('Conexao estabelecida com sucesso!');
        loadData();
      } else {
        toast.error(response.message || 'Falha na conexao');
      }
    } catch (error) {
      toast.error('Erro ao testar conexao com o banco');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSincronizar = async (conta: ContaBancaria) => {
    try {
      await api.post(`/cadastros/contas-bancarias/${conta.id}/sincronizar`);
      toast.success('Sincronizacao iniciada');
      loadData();
    } catch (error) {
      toast.error('Erro ao sincronizar');
    }
  };

  const handleToggleStatus = async (conta: ContaBancaria) => {
    try {
      await api.put(`/cadastros/contas-bancarias/${conta.id}`, { ativo: !conta.ativo });
      toast.success(`Conta ${conta.ativo ? 'desativada' : 'ativada'} com sucesso`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta conta bancaria?')) return;

    try {
      await api.delete(`/cadastros/contas-bancarias/${id}`);
      toast.success('Conta excluida com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir conta');
    }
  };

  const filteredContas = contas.filter((c) => {
    const matchSearch =
      c.banco_nome.toLowerCase().includes(search.toLowerCase()) ||
      c.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      c.agencia.includes(search) ||
      c.conta.includes(search);
    const matchStatus =
      !statusFilter ||
      (statusFilter === 'ativo' && c.ativo) ||
      (statusFilter === 'inativo' && !c.ativo) ||
      (statusFilter === 'integrado' && c.integracao_ativa);
    const matchBanco = !bancoFilter || c.banco_codigo === bancoFilter;
    return matchSearch && matchStatus && matchBanco;
  });

  const formatAgenciaConta = (conta: ContaBancaria) => {
    const agencia = conta.agencia_digito ? `${conta.agencia}-${conta.agencia_digito}` : conta.agencia;
    const contaNum = conta.conta_digito ? `${conta.conta}-${conta.conta_digito}` : conta.conta;
    return `Ag: ${agencia} | Cc: ${contaNum}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  };

  const columns = [
    {
      key: 'banco',
      header: 'Banco',
      render: (c: ContaBancaria) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600">{c.banco_codigo}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{c.banco_nome}</p>
            <p className="text-sm text-gray-500">{c.descricao || formatAgenciaConta(c)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'conta',
      header: 'Conta',
      width: '180px',
      render: (c: ContaBancaria) => (
        <div>
          <p className="font-mono text-sm">{formatAgenciaConta(c)}</p>
          <p className="text-xs text-gray-500 capitalize">{c.tipo_conta}</p>
        </div>
      ),
    },
    {
      key: 'integracao',
      header: 'Integracao',
      width: '150px',
      render: (c: ContaBancaria) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {c.boleto_ativo && (
              <Badge variant="info" size="sm">
                Boleto
              </Badge>
            )}
            {c.pix_ativo && (
              <Badge variant="success" size="sm">
                PIX
              </Badge>
            )}
          </div>
          {!c.boleto_ativo && !c.pix_ativo && (
            <span className="text-xs text-gray-400">Sem integracao</span>
          )}
        </div>
      ),
    },
    {
      key: 'ambiente',
      header: 'Ambiente',
      width: '120px',
      render: (c: ContaBancaria) => (
        <Badge variant={c.ambiente === 'producao' ? 'success' : 'warning'} size="sm">
          {c.ambiente === 'producao' ? 'Producao' : 'Homologacao'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (c: ContaBancaria) => {
        if (!c.integracao_ativa) {
          return (
            <Badge variant="default" size="sm">
              Inativo
            </Badge>
          );
        }
        const status = c.status_conexao || 'pendente';
        const config = statusConexaoConfig[status];
        return (
          <Badge variant={config.variant} size="sm">
            {config.icon} {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'sincronizacao',
      header: 'Ultima Sinc.',
      width: '150px',
      render: (c: ContaBancaria) => (
        <span className="text-sm text-gray-500">{formatDate(c.ultima_sincronizacao)}</span>
      ),
    },
  ];

  const actions = (conta: ContaBancaria) => {
    const items = [
      {
        label: 'Editar',
        icon: <Icons.edit className="w-4 h-4" />,
        onClick: () => handleEdit(conta),
      },
            {
              label: 'Configurar Credenciais',
              icon: <Icons.lock className="w-4 h-4" />,
              onClick: () => navigate(`/cadastros/financeiro/contas-bancarias/${conta.id}?tab=credenciais`),
            },
    ];

    if (conta.integracao_ativa) {
      items.push(
                {
                  label: 'Testar Conexao',
                  icon: <Icons.check className="w-4 h-4" />,
                  onClick: () => handleTestarConexao(conta),
                },
        {
          label: 'Sincronizar',
          icon: <Icons.download className="w-4 h-4" />,
          onClick: () => handleSincronizar(conta),
        }
      );
    }

        items.push(
          {
            label: conta.ativo ? 'Desativar' : 'Ativar',
            icon: conta.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
            onClick: () => handleToggleStatus(conta),
          },
          {
            label: 'Excluir',
            icon: <Icons.trash className="w-4 h-4" />,
            onClick: () => handleDelete(conta.id),
          }
        );

    return items;
  };

  // Stats
  const stats = {
    total: contas.length,
    ativas: contas.filter((c) => c.ativo).length,
    integradas: contas.filter((c) => c.integracao_ativa).length,
    producao: contas.filter((c) => c.ambiente === 'producao').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas Bancarias</h1>
          <p className="text-gray-500">Gerencie suas contas bancarias e integracoes com APIs</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={handleNew}>
          Nova Conta
        </Button>
      </div>

      {/* Info Card - Bancos com API */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icons.alertCircle className="w-5 h-5 text-blue-600" />
                    </div>
          <div>
            <p className="font-medium text-blue-900">Bancos com Integracao API Disponivel</p>
            <p className="text-sm text-blue-700 mt-1">
              {bancosDisponiveis
                .filter((b) => b.tem_api)
                .map((b) => b.nome)
                .join(', ')}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Esses bancos permitem registro automatico de boletos, PIX e consulta de extratos via API.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total de Contas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.ativas}</p>
              <p className="text-sm text-gray-500">Ativas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Icons.settings className="w-5 h-5 text-purple-600" />
                        </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.integradas}</p>
              <p className="text-sm text-gray-500">Com Integracao</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Icons.shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.producao}</p>
              <p className="text-sm text-gray-500">Em Producao</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Buscar por banco, agencia, conta..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              value={bancoFilter}
              onChange={setBancoFilter}
              options={[
                { value: '', label: 'Todos os bancos' },
                ...bancosDisponiveis.map((b) => ({ value: b.codigo, label: `${b.codigo} - ${b.nome}` })),
              ]}
              placeholder="Banco"
            />
          </div>
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'Todos' },
                { value: 'ativo', label: 'Ativas' },
                { value: 'inativo', label: 'Inativas' },
                { value: 'integrado', label: 'Com Integracao' },
              ]}
              placeholder="Status"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredContas}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma conta bancaria cadastrada"
          onRowClick={handleEdit}
        />
      </Card>

      {/* Empty State with Quick Start */}
      {contas.length === 0 && !isLoading && (
        <Card>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.building className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conta cadastrada</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Cadastre suas contas bancarias para emitir boletos, receber PIX e conciliar extratos
              automaticamente.
            </p>
            <Button onClick={handleNew} leftIcon={<Icons.plus className="w-5 h-5" />}>
              Cadastrar Primeira Conta
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ContasBancariasPage;
