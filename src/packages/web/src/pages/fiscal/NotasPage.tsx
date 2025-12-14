// =============================================
// PLANAC ERP - Notas Fiscais (NF-e / NFC-e)
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

interface NotaFiscal {
  id: string;
  tipo: 'NFE' | 'NFCE';
  numero: number;
  serie: number;
  chave_acesso: string;
  natureza_operacao: string;
  cliente_nome: string;
  cliente_documento: string;
  valor_total: number;
  status: 'rascunho' | 'validando' | 'autorizada' | 'rejeitada' | 'cancelada' | 'inutilizada';
  ambiente: 'homologacao' | 'producao';
  protocolo_autorizacao?: string;
  data_emissao: string;
  data_autorizacao?: string;
  motivo_rejeicao?: string;
}

const statusConfig = {
  rascunho: { label: 'Rascunho', variant: 'default' as const },
  validando: { label: 'Validando', variant: 'warning' as const },
  autorizada: { label: 'Autorizada', variant: 'success' as const },
  rejeitada: { label: 'Rejeitada', variant: 'danger' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
  inutilizada: { label: 'Inutilizada', variant: 'default' as const },
};

const tipoOptions = [
  { value: '', label: 'Todos' },
  { value: 'NFE', label: 'NF-e' },
  { value: 'NFCE', label: 'NFC-e' },
];

export function NotasPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  
  // Modal de cancelamento
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [notaCancelar, setNotaCancelar] = useState<NotaFiscal | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  
  // Modal de detalhes
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [notaDetalhes, setNotaDetalhes] = useState<NotaFiscal | null>(null);

  useEffect(() => {
    loadNotas();
  }, []);

  const loadNotas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: NotaFiscal[] }>('/fiscal/notas');
      if (response.success) {
        setNotas(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar notas fiscais');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmitir = async (nota: NotaFiscal) => {
    try {
      await api.post(`/fiscal/notas/${nota.id}/emitir`);
      toast.success('Nota enviada para autorização');
      loadNotas();
    } catch (error) {
      toast.error('Erro ao emitir nota fiscal');
    }
  };

  const handleCancelar = async () => {
    if (!notaCancelar || motivoCancelamento.length < 15) {
      toast.error('Motivo deve ter pelo menos 15 caracteres');
      return;
    }

    try {
      await api.post(`/fiscal/notas/${notaCancelar.id}/cancelar`, { motivo: motivoCancelamento });
      toast.success('Nota cancelada com sucesso');
      setShowCancelModal(false);
      setNotaCancelar(null);
      setMotivoCancelamento('');
      loadNotas();
    } catch (error) {
      toast.error('Erro ao cancelar nota fiscal');
    }
  };

  const handleDownloadPDF = async (nota: NotaFiscal) => {
    try {
      const response = await api.get(`/fiscal/notas/${nota.id}/danfe`);
      // Abrir PDF em nova aba
      window.open(response.url, '_blank');
    } catch (error) {
      toast.error('Erro ao gerar DANFE');
    }
  };

  const handleDownloadXML = async (nota: NotaFiscal) => {
    try {
      const response = await api.get(`/fiscal/notas/${nota.id}/xml`);
      // Download do XML
      const blob = new Blob([response.xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nota.chave_acesso}.xml`;
      a.click();
    } catch (error) {
      toast.error('Erro ao baixar XML');
    }
  };

  const handleEnviarEmail = async (nota: NotaFiscal) => {
    try {
      await api.post(`/fiscal/notas/${nota.id}/enviar-email`);
      toast.success('E-mail enviado com sucesso');
    } catch (error) {
      toast.error('Erro ao enviar e-mail');
    }
  };

  const filteredNotas = notas.filter((nota) => {
    const matchSearch =
      nota.numero?.toString().includes(search) ||
      nota.chave_acesso?.includes(search) ||
      nota.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      nota.cliente_documento?.includes(search);

    const matchTipo = !tipoFilter || nota.tipo === tipoFilter;
    const matchStatus = !statusFilter || nota.status === statusFilter;

    const dataEmissao = new Date(nota.data_emissao);
    const matchPeriodoInicio = !periodoInicio || dataEmissao >= new Date(periodoInicio);
    const matchPeriodoFim = !periodoFim || dataEmissao <= new Date(periodoFim + 'T23:59:59');

    return matchSearch && matchTipo && matchStatus && matchPeriodoInicio && matchPeriodoFim;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Estatísticas
  const stats = {
    total: notas.length,
    autorizadas: notas.filter(n => n.status === 'autorizada').length,
    pendentes: notas.filter(n => ['rascunho', 'validando'].includes(n.status)).length,
    valorTotal: notas
      .filter(n => n.status === 'autorizada')
      .reduce((acc, n) => acc + n.valor_total, 0),
  };

  const columns = [
    {
      key: 'numero',
      header: 'Número/Série',
      width: '110px',
      sortable: true,
      render: (nota: NotaFiscal) => (
        <div>
          <p className="font-mono font-bold">{nota.numero}</p>
          <p className="text-xs text-gray-500">Série {nota.serie}</p>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      width: '80px',
      render: (nota: NotaFiscal) => (
        <Badge variant={nota.tipo === 'NFE' ? 'info' : 'default'}>
          {nota.tipo === 'NFE' ? 'NF-e' : 'NFC-e'}
        </Badge>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (nota: NotaFiscal) => (
        <div>
          <p className="font-medium text-gray-900">{nota.cliente_nome}</p>
          <p className="text-sm text-gray-500">{nota.cliente_documento}</p>
        </div>
      ),
    },
    {
      key: 'natureza',
      header: 'Natureza',
      width: '150px',
      render: (nota: NotaFiscal) => (
        <span className="text-sm">{nota.natureza_operacao}</span>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      width: '120px',
      sortable: true,
      render: (nota: NotaFiscal) => (
        <span className="font-bold">{formatCurrency(nota.valor_total)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (nota: NotaFiscal) => {
        const config = statusConfig[nota.status];
        return (
          <div>
            <Badge variant={config.variant}>{config.label}</Badge>
            {nota.ambiente === 'homologacao' && (
              <p className="text-xs text-orange-500 mt-1">Homologação</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'data_emissao',
      header: 'Emissão',
      width: '140px',
      sortable: true,
      render: (nota: NotaFiscal) => formatDate(nota.data_emissao),
    },
  ];

  const actions = (nota: NotaFiscal) => {
    const items = [
      {
        label: 'Ver Detalhes',
        icon: <Icons.eye className="w-4 h-4" />,
        onClick: () => {
          setNotaDetalhes(nota);
          setShowDetalhesModal(true);
        },
      },
    ];

    if (nota.status === 'rascunho') {
      items.push(
        {
          label: 'Editar',
          icon: <Icons.edit className="w-4 h-4" />,
          onClick: () => navigate(`/fiscal/notas/${nota.id}`),
        },
        {
          label: 'Emitir',
          icon: <Icons.check className="w-4 h-4" />,
          variant: 'success' as const,
          onClick: () => handleEmitir(nota),
        }
      );
    }

    if (nota.status === 'autorizada') {
      items.push(
        {
          label: 'DANFE (PDF)',
          icon: <Icons.printer className="w-4 h-4" />,
          onClick: () => handleDownloadPDF(nota),
        },
        {
          label: 'Download XML',
          icon: <Icons.document className="w-4 h-4" />,
          onClick: () => handleDownloadXML(nota),
        },
        {
          label: 'Enviar por E-mail',
          icon: <Icons.email className="w-4 h-4" />,
          onClick: () => handleEnviarEmail(nota),
        }
      );
      
      // Cancelamento só até 24h
      const horasDesdeAutorizacao = nota.data_autorizacao
        ? (Date.now() - new Date(nota.data_autorizacao).getTime()) / (1000 * 60 * 60)
        : 0;
      
      if (horasDesdeAutorizacao <= 24) {
        items.push({
          label: 'Cancelar',
          icon: <Icons.x className="w-4 h-4" />,
          variant: 'danger' as const,
          onClick: () => {
            setNotaCancelar(nota);
            setShowCancelModal(true);
          },
        });
      }
    }

    if (nota.status === 'rejeitada') {
      items.push({
        label: 'Ver Motivo',
        icon: <Icons.eye className="w-4 h-4" />,
        onClick: () => {
          setNotaDetalhes(nota);
          setShowDetalhesModal(true);
        },
      });
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notas Fiscais</h1>
          <p className="text-gray-500">NF-e e NFC-e emitidas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Icons.document className="w-5 h-5" />}
            onClick={() => navigate('/fiscal/nfce')}
          >
            Emitir NFC-e
          </Button>
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => navigate('/fiscal/notas/nova')}
          >
            Nova NF-e
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por número, chave, cliente..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-32">
            <Select
              value={tipoFilter}
              onChange={setTipoFilter}
              options={tipoOptions}
              placeholder="Tipo"
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
              placeholder="Status"
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-500">Total de Notas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.autorizadas}</p>
              <p className="text-sm text-gray-500">Autorizadas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.eye className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
              <p className="text-sm text-gray-500">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-planac-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-planac-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-planac-600">{formatCurrency(stats.valorTotal)}</p>
              <p className="text-sm text-gray-500">Valor Autorizadas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredNotas}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma nota fiscal encontrada"
        />
      </Card>

      {/* Modal Cancelamento */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setNotaCancelar(null);
          setMotivoCancelamento('');
        }}
        title="Cancelar Nota Fiscal"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Atenção!</p>
            <p className="text-red-600 text-sm mt-1">
              O cancelamento é irreversível e será enviado para a SEFAZ.
            </p>
          </div>
          
          {notaCancelar && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Número</p>
                <p className="font-medium">{notaCancelar.numero}</p>
              </div>
              <div>
                <p className="text-gray-500">Valor</p>
                <p className="font-medium">{formatCurrency(notaCancelar.valor_total)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Chave de Acesso</p>
                <p className="font-mono text-xs">{notaCancelar.chave_acesso}</p>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo do Cancelamento (mínimo 15 caracteres)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
              rows={3}
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              placeholder="Descreva o motivo do cancelamento..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {motivoCancelamento.length}/15 caracteres
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              Voltar
            </Button>
            <Button 
              variant="danger"
              onClick={handleCancelar}
              disabled={motivoCancelamento.length < 15}
            >
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetalhesModal}
        onClose={() => setShowDetalhesModal(false)}
        title={`Nota Fiscal ${notaDetalhes?.numero}`}
        size="lg"
      >
        {notaDetalhes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-medium">{notaDetalhes.tipo === 'NFE' ? 'NF-e' : 'NFC-e'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={statusConfig[notaDetalhes.status].variant}>
                  {statusConfig[notaDetalhes.status].label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ambiente</p>
                <p className="font-medium">{notaDetalhes.ambiente === 'producao' ? 'Produção' : 'Homologação'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="font-bold text-lg">{formatCurrency(notaDetalhes.valor_total)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Chave de Acesso</p>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                {notaDetalhes.chave_acesso}
              </p>
            </div>
            
            {notaDetalhes.protocolo_autorizacao && (
              <div>
                <p className="text-sm text-gray-500">Protocolo de Autorização</p>
                <p className="font-mono text-sm">{notaDetalhes.protocolo_autorizacao}</p>
              </div>
            )}
            
            {notaDetalhes.status === 'rejeitada' && notaDetalhes.motivo_rejeicao && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Motivo da Rejeição</p>
                <p className="text-red-600 mt-1">{notaDetalhes.motivo_rejeicao}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Data de Emissão</p>
                <p className="font-medium">{formatDate(notaDetalhes.data_emissao)}</p>
              </div>
              {notaDetalhes.data_autorizacao && (
                <div>
                  <p className="text-sm text-gray-500">Data de Autorização</p>
                  <p className="font-medium">{formatDate(notaDetalhes.data_autorizacao)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default NotasPage;
