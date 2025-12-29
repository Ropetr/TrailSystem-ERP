// =============================================
// PLANAC ERP - Gestão de Boletos
// =============================================

import { useState, useEffect } from 'react';
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

interface Boleto {
  id: string;
  numero: string;
  nosso_numero: string;
  codigo_barras: string;
  linha_digitavel: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_documento: string;
  valor: number;
  valor_pago?: number;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'emitido' | 'registrado' | 'pago' | 'vencido' | 'cancelado' | 'protestado';
  banco: string;
  url_pdf?: string;
  conta_receber_id?: string;
}

const statusConfig = {
  emitido: { label: 'Emitido', variant: 'info' as const },
  registrado: { label: 'Registrado', variant: 'info' as const },
  pago: { label: 'Pago', variant: 'success' as const },
  vencido: { label: 'Vencido', variant: 'danger' as const },
  cancelado: { label: 'Cancelado', variant: 'default' as const },
  protestado: { label: 'Protestado', variant: 'danger' as const },
};

export function BoletosPage() {
  const toast = useToast();
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  
  // Modal de detalhes
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [boletoDetalhes, setBoletoDetalhes] = useState<Boleto | null>(null);
  
  // Modal de novo boleto
  const [showNovoBoletoModal, setShowNovoBoletoModal] = useState(false);
  const [novoBoletoForm, setNovoBoletoForm] = useState({
    cliente_id: '',
    valor: 0,
    data_vencimento: '',
    descricao: '',
  });

  useEffect(() => {
    loadBoletos();
  }, []);

  const loadBoletos = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Boleto[] }>('/financeiro/boletos');
      if (response.success) {
        setBoletos(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar boletos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmitirBoleto = async () => {
    if (!novoBoletoForm.cliente_id || !novoBoletoForm.valor || !novoBoletoForm.data_vencimento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await api.post<{ success: boolean; data: Boleto }>('/financeiro/boletos', novoBoletoForm);
      if (response.success) {
        toast.success('Boleto emitido com sucesso');
        setShowNovoBoletoModal(false);
        loadBoletos();
        
        // Abrir PDF
        if (response.data.url_pdf) {
          window.open(response.data.url_pdf, '_blank');
        }
      }
    } catch (error) {
      toast.error('Erro ao emitir boleto');
    }
  };

  const handleCancelar = async (boleto: Boleto) => {
    if (!confirm('Deseja realmente cancelar este boleto?')) return;

    try {
      await api.post(`/financeiro/boletos/${boleto.id}/cancelar`);
      toast.success('Boleto cancelado');
      loadBoletos();
    } catch (error) {
      toast.error('Erro ao cancelar boleto');
    }
  };

  const handleProtestar = async (boleto: Boleto) => {
    if (!confirm('Deseja enviar este boleto para protesto?')) return;

    try {
      await api.post(`/financeiro/boletos/${boleto.id}/protestar`);
      toast.success('Boleto enviado para protesto');
      loadBoletos();
    } catch (error) {
      toast.error('Erro ao protestar boleto');
    }
  };

  const handleEnviarEmail = async (boleto: Boleto) => {
    try {
      await api.post(`/financeiro/boletos/${boleto.id}/enviar-email`);
      toast.success('Boleto enviado por e-mail');
    } catch (error) {
      toast.error('Erro ao enviar boleto');
    }
  };

  const handleEnviarWhatsApp = async (boleto: Boleto) => {
    try {
      await api.post(`/financeiro/boletos/${boleto.id}/enviar-whatsapp`);
      toast.success('Boleto enviado por WhatsApp');
    } catch (error) {
      toast.error('Erro ao enviar boleto');
    }
  };

  const handleSincronizar = async () => {
    try {
      const response = await api.post<{ success: boolean; data: { atualizados: number } }>(
        '/financeiro/boletos/sincronizar'
      );
      if (response.success) {
        toast.success(`${response.data.atualizados} boleto(s) atualizado(s)`);
        loadBoletos();
      }
    } catch (error) {
      toast.error('Erro ao sincronizar boletos');
    }
  };

  const filteredBoletos = boletos.filter((boleto) => {
    const matchSearch =
      boleto.numero?.includes(search) ||
      boleto.nosso_numero?.includes(search) ||
      boleto.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      boleto.cliente_documento?.includes(search);

    const matchStatus = !statusFilter || boleto.status === statusFilter;

    const dataVenc = new Date(boleto.data_vencimento);
    const matchPeriodoInicio = !periodoInicio || dataVenc >= new Date(periodoInicio);
    const matchPeriodoFim = !periodoFim || dataVenc <= new Date(periodoFim + 'T23:59:59');

    return matchSearch && matchStatus && matchPeriodoInicio && matchPeriodoFim;
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  // Estatísticas
  const stats = {
    total: filteredBoletos.length,
    emAberto: filteredBoletos.filter(b => ['emitido', 'registrado'].includes(b.status)).reduce((acc, b) => acc + b.valor, 0),
    vencidos: filteredBoletos.filter(b => b.status === 'vencido').reduce((acc, b) => acc + b.valor, 0),
    pagos: filteredBoletos.filter(b => b.status === 'pago').reduce((acc, b) => acc + (b.valor_pago || b.valor), 0),
  };

  const columns = [
    {
      key: 'numero',
      header: 'Número',
      width: '100px',
      render: (boleto: Boleto) => (
        <div>
          <p className="font-mono font-bold">{boleto.numero}</p>
          <p className="text-xs text-gray-500">NN: {boleto.nosso_numero}</p>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (boleto: Boleto) => (
        <div>
          <p className="font-medium text-gray-900">{boleto.cliente_nome}</p>
          <p className="text-sm text-gray-500">{boleto.cliente_documento}</p>
        </div>
      ),
    },
    {
      key: 'vencimento',
      header: 'Vencimento',
      width: '100px',
      sortable: true,
      render: (boleto: Boleto) => formatDate(boleto.data_vencimento),
    },
    {
      key: 'valor',
      header: 'Valor',
      width: '120px',
      sortable: true,
      render: (boleto: Boleto) => (
        <span className="font-bold">{formatCurrency(boleto.valor)}</span>
      ),
    },
    {
      key: 'banco',
      header: 'Banco',
      width: '80px',
      render: (boleto: Boleto) => (
        <span className="text-sm">{boleto.banco}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (boleto: Boleto) => {
        const config = statusConfig[boleto.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (boleto: Boleto) => {
    const items = [
      {
        label: 'Ver Detalhes',
        icon: <Icons.eye className="w-4 h-4" />,
        onClick: () => {
          setBoletoDetalhes(boleto);
          setShowDetalhesModal(true);
        },
      },
    ];

    if (boleto.url_pdf) {
      items.push({
        label: 'Baixar PDF',
        icon: <Icons.printer className="w-4 h-4" />,
        onClick: () => window.open(boleto.url_pdf, '_blank'),
      });
    }

    if (['emitido', 'registrado', 'vencido'].includes(boleto.status)) {
      items.push(
        {
          label: 'Enviar por E-mail',
          icon: <Icons.email className="w-4 h-4" />,
          onClick: () => handleEnviarEmail(boleto),
        },
        {
          label: 'Enviar WhatsApp',
          icon: <Icons.email className="w-4 h-4" />,
          onClick: () => handleEnviarWhatsApp(boleto),
        }
      );
    }

    if (boleto.status === 'vencido') {
      items.push({
        label: 'Protestar',
        icon: <Icons.x className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleProtestar(boleto),
      });
    }

    if (['emitido', 'registrado'].includes(boleto.status)) {
      items.push({
        label: 'Cancelar',
        icon: <Icons.x className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleCancelar(boleto),
      });
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boletos</h1>
          <p className="text-gray-500">Emissão e acompanhamento de boletos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Icons.settings className="w-5 h-5" />}
            onClick={handleSincronizar}
          >
            Sincronizar
          </Button>
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => setShowNovoBoletoModal(true)}
          >
            Novo Boleto
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-500">Total de Boletos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Icons.eye className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.emAberto)}</p>
              <p className="text-sm text-gray-500">Em Aberto</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icons.x className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.vencidos)}</p>
              <p className="text-sm text-gray-500">Vencidos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.pagos)}</p>
              <p className="text-sm text-gray-500">Recebido</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por número, cliente, documento..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'Todos Status' },
                ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
            />
          </div>
          <div className="w-36">
            <Input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Input
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredBoletos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum boleto encontrado"
        />
      </Card>

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetalhesModal}
        onClose={() => setShowDetalhesModal(false)}
        title={`Boleto ${boletoDetalhes?.numero}`}
        size="lg"
      >
        {boletoDetalhes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{boletoDetalhes.cliente_nome}</p>
                <p className="text-sm text-gray-500">{boletoDetalhes.cliente_documento}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor</p>
                <p className="text-2xl font-bold text-planac-600">{formatCurrency(boletoDetalhes.valor)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vencimento</p>
                <p className="font-medium">{formatDate(boletoDetalhes.data_vencimento)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={statusConfig[boletoDetalhes.status].variant}>
                  {statusConfig[boletoDetalhes.status].label}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Linha Digitável</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 p-2 rounded text-sm break-all">
                  {boletoDetalhes.linha_digitavel}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(boletoDetalhes.linha_digitavel)}
                >
                  <Icons.document className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Código de Barras</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 p-2 rounded text-sm break-all">
                  {boletoDetalhes.codigo_barras}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(boletoDetalhes.codigo_barras)}
                >
                  <Icons.document className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {boletoDetalhes.status === 'pago' && boletoDetalhes.data_pagamento && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800">
                  <strong>Pago em:</strong> {formatDate(boletoDetalhes.data_pagamento)}
                </p>
                {boletoDetalhes.valor_pago && (
                  <p className="text-green-800">
                    <strong>Valor Pago:</strong> {formatCurrency(boletoDetalhes.valor_pago)}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              {boletoDetalhes.url_pdf && (
                <Button 
                  variant="secondary" 
                  onClick={() => window.open(boletoDetalhes.url_pdf, '_blank')}
                  className="flex-1"
                >
                  <Icons.printer className="w-5 h-5 mr-2" />
                  Baixar PDF
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => handleEnviarEmail(boletoDetalhes)}
                className="flex-1"
              >
                <Icons.email className="w-5 h-5 mr-2" />
                Enviar E-mail
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Novo Boleto */}
      <Modal
        isOpen={showNovoBoletoModal}
        onClose={() => setShowNovoBoletoModal(false)}
        title="Emitir Novo Boleto"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Cliente"
            placeholder="Buscar cliente..."
            value={novoBoletoForm.cliente_id}
            onChange={(e) => setNovoBoletoForm({ ...novoBoletoForm, cliente_id: e.target.value })}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor"
              type="number"
              step="0.01"
              value={novoBoletoForm.valor || ''}
              onChange={(e) => setNovoBoletoForm({ ...novoBoletoForm, valor: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Vencimento"
              type="date"
              value={novoBoletoForm.data_vencimento}
              onChange={(e) => setNovoBoletoForm({ ...novoBoletoForm, data_vencimento: e.target.value })}
            />
          </div>
          
          <Input
            label="Descrição"
            placeholder="Descrição que aparecerá no boleto"
            value={novoBoletoForm.descricao}
            onChange={(e) => setNovoBoletoForm({ ...novoBoletoForm, descricao: e.target.value })}
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowNovoBoletoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEmitirBoleto}>
              Emitir Boleto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default BoletosPage;
