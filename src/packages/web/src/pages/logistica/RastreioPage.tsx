// =============================================
// PLANAC ERP - Rastreamento de Entregas
// =============================================

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface EventoRastreio {
  id: string;
  data: string;
  status: string;
  descricao: string;
  local?: string;
  responsavel?: string;
}

interface DadosRastreio {
  codigo: string;
  pedido_numero: string;
  cliente_nome: string;
  status: 'processando' | 'separacao' | 'expedido' | 'em_transito' | 'saiu_entrega' | 'entregue' | 'problema';
  status_label: string;
  data_previsao: string;
  data_entrega?: string;
  endereco_entrega: {
    cidade: string;
    uf: string;
    bairro: string;
  };
  transportadora?: string;
  motorista?: string;
  eventos: EventoRastreio[];
}

const statusConfig = {
  processando: { label: 'Processando', color: 'bg-gray-400', step: 1 },
  separacao: { label: 'Em Separação', color: 'bg-yellow-400', step: 2 },
  expedido: { label: 'Expedido', color: 'bg-blue-400', step: 3 },
  em_transito: { label: 'Em Trânsito', color: 'bg-blue-500', step: 4 },
  saiu_entrega: { label: 'Saiu para Entrega', color: 'bg-orange-500', step: 5 },
  entregue: { label: 'Entregue', color: 'bg-green-500', step: 6 },
  problema: { label: 'Problema', color: 'bg-red-500', step: 0 },
};

const etapas = [
  { key: 'processando', label: 'Pedido Recebido', icon: '📋' },
  { key: 'separacao', label: 'Separação', icon: '📦' },
  { key: 'expedido', label: 'Expedido', icon: '🚚' },
  { key: 'em_transito', label: 'Em Trânsito', icon: '🛣️' },
  { key: 'saiu_entrega', label: 'Saiu p/ Entrega', icon: '📍' },
  { key: 'entregue', label: 'Entregue', icon: '✅' },
];

export function RastreioPage() {
  const { codigo: codigoParam } = useParams<{ codigo: string }>();
  const toast = useToast();
  const [codigoBusca, setCodigoBusca] = useState(codigoParam || '');
  const [rastreio, setRastreio] = useState<DadosRastreio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (codigoParam) {
      handleBuscar(codigoParam);
    }
  }, [codigoParam]);

  const handleBuscar = async (codigo?: string) => {
    const codigoFinal = codigo || codigoBusca;
    if (!codigoFinal.trim()) {
      toast.error('Digite o código de rastreio');
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setRastreio(null);

    try {
      const response = await api.get<{ success: boolean; data: DadosRastreio }>(
        `/logistica/rastreio/${codigoFinal}`
      );
      if (response.success && response.data) {
        setRastreio(response.data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEtapaAtual = () => {
    if (!rastreio) return 0;
    const config = statusConfig[rastreio.status];
    return config?.step || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-planac-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Rastreamento de Entrega</h1>
          <p className="text-planac-100">Acompanhe o status da sua entrega em tempo real</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* Busca */}
        <Card className="mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código de rastreio ou número do pedido"
              value={codigoBusca}
              onChange={(e) => setCodigoBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              className="flex-1"
            />
            <Button onClick={() => handleBuscar()} disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Icons.search className="w-5 h-5 mr-2" />
                  Rastrear
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Loading */}
        {isLoading && (
          <Card className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-planac-500 mx-auto mb-4" />
            <p className="text-gray-500">Buscando informações...</p>
          </Card>
        )}

        {/* Not Found */}
        {notFound && !isLoading && (
          <Card className="text-center py-12">
            <Icons.x className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">Código não encontrado</h3>
            <p className="text-gray-500">
              Verifique se o código de rastreio está correto e tente novamente.
            </p>
          </Card>
        )}

        {/* Resultado */}
        {rastreio && !isLoading && (
          <div className="space-y-6">
            {/* Status Principal */}
            <Card>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Código de Rastreio</p>
                  <p className="text-2xl font-bold text-gray-900">{rastreio.codigo}</p>
                  <p className="text-sm text-gray-500 mt-1">Pedido: {rastreio.pedido_numero}</p>
                </div>
                <Badge 
                  variant={rastreio.status === 'entregue' ? 'success' : rastreio.status === 'problema' ? 'danger' : 'info'}
                  className="text-lg px-4 py-2"
                >
                  {rastreio.status_label}
                </Badge>
              </div>

              {/* Timeline de Etapas */}
              {rastreio.status !== 'problema' && (
                <div className="relative">
                  <div className="flex justify-between">
                    {etapas.map((etapa, index) => {
                      const etapaAtual = getEtapaAtual();
                      const concluida = index + 1 <= etapaAtual;
                      const atual = index + 1 === etapaAtual;
                      
                      return (
                        <div key={etapa.key} className="flex flex-col items-center relative z-10">
                          <div 
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                              concluida ? 'bg-green-100' : 'bg-gray-100'
                            } ${atual ? 'ring-4 ring-green-200' : ''}`}
                          >
                            {etapa.icon}
                          </div>
                          <p className={`text-xs mt-2 text-center max-w-[80px] ${
                            concluida ? 'text-green-600 font-medium' : 'text-gray-400'
                          }`}>
                            {etapa.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {/* Linha de progresso */}
                  <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-0">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${((getEtapaAtual() - 1) / (etapas.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Info de Previsão */}
              <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">{rastreio.cliente_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Destino</p>
                  <p className="font-medium">
                    {rastreio.endereco_entrega.cidade}/{rastreio.endereco_entrega.uf}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Previsão</p>
                  <p className="font-medium">{formatDate(rastreio.data_previsao)}</p>
                </div>
                {rastreio.data_entrega && (
                  <div>
                    <p className="text-sm text-gray-500">Entregue em</p>
                    <p className="font-medium text-green-600">{formatDate(rastreio.data_entrega)}</p>
                  </div>
                )}
              </div>

              {rastreio.motorista && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>🚚 Em rota de entrega</strong> - Motorista: {rastreio.motorista}
                  </p>
                </div>
              )}
            </Card>

            {/* Histórico de Eventos */}
            <Card>
              <h3 className="text-lg font-bold mb-4">Histórico de Movimentação</h3>
              <div className="relative">
                {rastreio.eventos.map((evento, index) => (
                  <div key={evento.id} className="flex gap-4 pb-6 last:pb-0">
                    {/* Linha vertical */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-planac-500' : 'bg-gray-300'}`} />
                      {index < rastreio.eventos.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 -mt-1">
                      <p className="text-sm text-gray-500">{formatDateTime(evento.data)}</p>
                      <p className="font-medium">{evento.status}</p>
                      <p className="text-sm text-gray-600">{evento.descricao}</p>
                      {evento.local && (
                        <p className="text-sm text-gray-500 mt-1">📍 {evento.local}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Ações */}
            <Card>
              <div className="flex flex-wrap gap-4">
                <Button variant="secondary" leftIcon={<Icons.printer className="w-5 h-5" />}>
                  Imprimir Comprovante
                </Button>
                <Button variant="secondary" leftIcon={<Icons.email className="w-5 h-5" />}>
                  Receber Atualizações
                </Button>
                {rastreio.status !== 'entregue' && (
                  <Button variant="secondary" leftIcon={<Icons.x className="w-5 h-5" />}>
                    Reportar Problema
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default RastreioPage;
