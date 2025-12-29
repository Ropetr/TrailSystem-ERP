// =============================================
// PLANAC ERP - Gestão de Frota
// =============================================

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  tipo: 'carro' | 'van' | 'caminhao' | 'moto';
  capacidade_kg: number;
  capacidade_volumes: number;
  status: 'disponivel' | 'em_uso' | 'manutencao' | 'inativo';
  km_atual: number;
  km_ultima_revisao: number;
  data_ultima_revisao?: string;
  proxima_revisao_km: number;
  vencimento_licenciamento: string;
  motorista_padrao_id?: string;
  motorista_padrao_nome?: string;
}

interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  categoria_cnh: string;
  vencimento_cnh: string;
  telefone: string;
  email?: string;
  status: 'ativo' | 'ferias' | 'afastado' | 'inativo';
  veiculo_atual?: string;
  entregas_mes: number;
  avaliacao: number;
}

interface Manutencao {
  id: string;
  veiculo_id: string;
  veiculo_placa: string;
  tipo: 'preventiva' | 'corretiva' | 'revisao';
  descricao: string;
  data_entrada: string;
  data_previsao_saida: string;
  data_saida?: string;
  km_entrada: number;
  valor: number;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  fornecedor?: string;
}

const statusVeiculoConfig = {
  disponivel: { label: 'Disponível', variant: 'success' as const },
  em_uso: { label: 'Em Uso', variant: 'info' as const },
  manutencao: { label: 'Manutenção', variant: 'warning' as const },
  inativo: { label: 'Inativo', variant: 'default' as const },
};

const statusMotoristaConfig = {
  ativo: { label: 'Ativo', variant: 'success' as const },
  ferias: { label: 'Férias', variant: 'info' as const },
  afastado: { label: 'Afastado', variant: 'warning' as const },
  inativo: { label: 'Inativo', variant: 'default' as const },
};

const tipoVeiculoConfig = {
  carro: { label: 'Carro', icon: '🚗' },
  van: { label: 'Van', icon: '🚐' },
  caminhao: { label: 'Caminhão', icon: '🚛' },
  moto: { label: 'Moto', icon: '🏍️' },
};

export function FrotaPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('veiculos');
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modais
  const [showVeiculoModal, setShowVeiculoModal] = useState(false);
  const [showMotoristaModal, setShowMotoristaModal] = useState(false);
  const [showManutencaoModal, setShowManutencaoModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [veiculosRes, motoristasRes, manutencoesRes] = await Promise.all([
        api.get<{ success: boolean; data: Veiculo[] }>('/logistica/veiculos'),
        api.get<{ success: boolean; data: Motorista[] }>('/logistica/motoristas'),
        api.get<{ success: boolean; data: Manutencao[] }>('/logistica/manutencoes'),
      ]);
      
      if (veiculosRes.success) setVeiculos(veiculosRes.data);
      if (motoristasRes.success) setMotoristas(motoristasRes.data);
      if (manutencoesRes.success) setManutencoes(manutencoesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const formatKm = (km: number) => {
    return new Intl.NumberFormat('pt-BR').format(km) + ' km';
  };

  const getDiasVencimento = (data: string) => {
    const hoje = new Date();
    const venc = new Date(data);
    return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  // Stats
  const statsVeiculos = {
    total: veiculos.length,
    disponiveis: veiculos.filter(v => v.status === 'disponivel').length,
    emUso: veiculos.filter(v => v.status === 'em_uso').length,
    manutencao: veiculos.filter(v => v.status === 'manutencao').length,
    alertas: veiculos.filter(v => {
      const diasLicenciamento = getDiasVencimento(v.vencimento_licenciamento);
      const kmRevisao = v.proxima_revisao_km - v.km_atual;
      return diasLicenciamento <= 30 || kmRevisao <= 1000;
    }).length,
  };

  const statsMotoristas = {
    total: motoristas.length,
    ativos: motoristas.filter(m => m.status === 'ativo').length,
    alertaCNH: motoristas.filter(m => getDiasVencimento(m.vencimento_cnh) <= 30).length,
  };

  // Colunas de Veículos
  const columnsVeiculos = [
    {
      key: 'veiculo',
      header: 'Veículo',
      render: (v: Veiculo) => (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{tipoVeiculoConfig[v.tipo].icon}</span>
          <div>
            <p className="font-bold">{v.placa}</p>
            <p className="text-sm text-gray-500">{v.marca} {v.modelo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'capacidade',
      header: 'Capacidade',
      width: '120px',
      render: (v: Veiculo) => (
        <div className="text-sm">
          <p>{v.capacidade_kg} kg</p>
          <p className="text-gray-500">{v.capacidade_volumes} vol</p>
        </div>
      ),
    },
    {
      key: 'km',
      header: 'KM Atual',
      width: '120px',
      render: (v: Veiculo) => (
        <div>
          <p className="font-medium">{formatKm(v.km_atual)}</p>
          {v.proxima_revisao_km - v.km_atual <= 1000 && (
            <p className="text-xs text-orange-600">⚠️ Revisão próxima</p>
          )}
        </div>
      ),
    },
    {
      key: 'licenciamento',
      header: 'Licenciamento',
      width: '120px',
      render: (v: Veiculo) => {
        const dias = getDiasVencimento(v.vencimento_licenciamento);
        return (
          <div>
            <p className="text-sm">{formatDate(v.vencimento_licenciamento)}</p>
            {dias <= 30 && (
              <p className={`text-xs ${dias <= 0 ? 'text-red-600' : 'text-orange-600'}`}>
                {dias <= 0 ? '⚠️ Vencido' : `⚠️ ${dias} dias`}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'motorista',
      header: 'Motorista',
      width: '150px',
      render: (v: Veiculo) => v.motorista_padrao_nome || '-',
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (v: Veiculo) => {
        const config = statusVeiculoConfig[v.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  // Colunas de Motoristas
  const columnsMotoristas = [
    {
      key: 'motorista',
      header: 'Motorista',
      render: (m: Motorista) => (
        <div>
          <p className="font-medium">{m.nome}</p>
          <p className="text-sm text-gray-500">{m.telefone}</p>
        </div>
      ),
    },
    {
      key: 'cnh',
      header: 'CNH',
      width: '150px',
      render: (m: Motorista) => {
        const dias = getDiasVencimento(m.vencimento_cnh);
        return (
          <div>
            <p className="text-sm">{m.cnh} ({m.categoria_cnh})</p>
            <p className={`text-xs ${dias <= 30 ? (dias <= 0 ? 'text-red-600' : 'text-orange-600') : 'text-gray-500'}`}>
              Venc: {formatDate(m.vencimento_cnh)}
            </p>
          </div>
        );
      },
    },
    {
      key: 'veiculo',
      header: 'Veículo',
      width: '100px',
      render: (m: Motorista) => m.veiculo_atual || '-',
    },
    {
      key: 'entregas',
      header: 'Entregas/Mês',
      width: '100px',
      render: (m: Motorista) => m.entregas_mes,
    },
    {
      key: 'avaliacao',
      header: 'Avaliação',
      width: '100px',
      render: (m: Motorista) => (
        <span className="text-yellow-500">{renderStars(m.avaliacao)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (m: Motorista) => {
        const config = statusMotoristaConfig[m.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Frota</h1>
          <p className="text-gray-500">Veículos, motoristas e manutenções</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'veiculos', label: `Veículos (${veiculos.length})` },
          { id: 'motoristas', label: `Motoristas (${motoristas.length})` },
          { id: 'manutencoes', label: `Manutenções (${manutencoes.filter(m => m.status !== 'concluida').length})` },
        ]}
      />

      {/* Tab: Veículos */}
      {activeTab === 'veiculos' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card padding="sm">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{statsVeiculos.total}</p>
            </Card>
            <Card padding="sm">
              <p className="text-sm text-gray-500">Disponíveis</p>
              <p className="text-2xl font-bold text-green-600">{statsVeiculos.disponiveis}</p>
            </Card>
            <Card padding="sm">
              <p className="text-sm text-gray-500">Em Uso</p>
              <p className="text-2xl font-bold text-blue-600">{statsVeiculos.emUso}</p>
            </Card>
            <Card padding="sm">
              <p className="text-sm text-gray-500">Manutenção</p>
              <p className="text-2xl font-bold text-orange-600">{statsVeiculos.manutencao}</p>
            </Card>
            <Card padding="sm">
              <p className="text-sm text-gray-500">Alertas</p>
              <p className="text-2xl font-bold text-red-600">{statsVeiculos.alertas}</p>
            </Card>
          </div>

          {/* Filtros e Tabela */}
          <Card padding="sm">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por placa, modelo..."
                  leftIcon={<Icons.search className="w-5 h-5" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: '', label: 'Todos Status' },
                  ...Object.entries(statusVeiculoConfig).map(([k, v]) => ({ value: k, label: v.label })),
                ]}
              />
              <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => setShowVeiculoModal(true)}>
                Novo Veículo
              </Button>
            </div>
          </Card>

          <Card padding="none">
            <DataTable
              data={veiculos.filter(v => {
                const matchSearch = v.placa.toLowerCase().includes(search.toLowerCase()) ||
                  v.modelo.toLowerCase().includes(search.toLowerCase());
                const matchStatus = !statusFilter || v.status === statusFilter;
                return matchSearch && matchStatus;
              })}
              columns={columnsVeiculos}
              isLoading={isLoading}
              emptyMessage="Nenhum veículo cadastrado"
            />
          </Card>
        </>
      )}

      {/* Tab: Motoristas */}
      {activeTab === 'motoristas' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card padding="sm">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{statsMotoristas.total}</p>
            </Card>
            <Card padding="sm">
              <p className="text-sm text-gray-500">Ativos</p>
              <p className="text-2xl font-bold text-green-600">{statsMotoristas.ativos}</p>
            </Card>
            <Card padding="sm">
              <p className="text-sm text-gray-500">CNH Vencendo</p>
              <p className="text-2xl font-bold text-orange-600">{statsMotoristas.alertaCNH}</p>
            </Card>
          </div>

          <Card padding="sm">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por nome, CNH..."
                  leftIcon={<Icons.search className="w-5 h-5" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => setShowMotoristaModal(true)}>
                Novo Motorista
              </Button>
            </div>
          </Card>

          <Card padding="none">
            <DataTable
              data={motoristas.filter(m => {
                return m.nome.toLowerCase().includes(search.toLowerCase()) ||
                  m.cnh.includes(search);
              })}
              columns={columnsMotoristas}
              isLoading={isLoading}
              emptyMessage="Nenhum motorista cadastrado"
            />
          </Card>
        </>
      )}

      {/* Tab: Manutenções */}
      {activeTab === 'manutencoes' && (
        <>
          <Card padding="sm">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por placa..."
                  leftIcon={<Icons.search className="w-5 h-5" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => setShowManutencaoModal(true)}>
                Nova Manutenção
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {manutencoes.filter(m => m.status !== 'concluida').map((manutencao) => (
              <Card key={manutencao.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">{manutencao.veiculo_placa}</p>
                    <Badge variant={manutencao.tipo === 'corretiva' ? 'danger' : 'info'}>
                      {manutencao.tipo === 'preventiva' ? 'Preventiva' : manutencao.tipo === 'corretiva' ? 'Corretiva' : 'Revisão'}
                    </Badge>
                  </div>
                  <Badge variant={manutencao.status === 'em_andamento' ? 'warning' : 'default'}>
                    {manutencao.status === 'agendada' ? 'Agendada' : manutencao.status === 'em_andamento' ? 'Em Andamento' : manutencao.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{manutencao.descricao}</p>
                <div className="text-sm text-gray-500">
                  <p>Entrada: {formatDate(manutencao.data_entrada)}</p>
                  <p>Previsão: {formatDate(manutencao.data_previsao_saida)}</p>
                  {manutencao.valor > 0 && <p>Valor: {formatCurrency(manutencao.valor)}</p>}
                </div>
              </Card>
            ))}
            {manutencoes.filter(m => m.status !== 'concluida').length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                Nenhuma manutenção em andamento
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default FrotaPage;
