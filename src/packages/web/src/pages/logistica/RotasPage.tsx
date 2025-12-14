// =============================================
// PLANAC ERP - Gestão de Rotas de Entrega
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface EntregaRota {
  id: string;
  codigo: string;
  cliente_nome: string;
  endereco: string;
  bairro: string;
  ordem: number;
  status: 'pendente' | 'em_rota' | 'entregue' | 'problema';
  volumes: number;
}

interface Rota {
  id: string;
  codigo: string;
  data: string;
  motorista_id: string;
  motorista_nome: string;
  veiculo_id: string;
  veiculo_placa: string;
  veiculo_modelo: string;
  status: 'planejada' | 'em_andamento' | 'finalizada' | 'cancelada';
  entregas: EntregaRota[];
  total_entregas: number;
  entregas_realizadas: number;
  km_estimado: number;
  km_percorrido?: number;
  hora_inicio?: string;
  hora_fim?: string;
}

interface Motorista {
  id: string;
  nome: string;
  cnh: string;
  telefone: string;
}

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  capacidade_kg: number;
  capacidade_volumes: number;
}

const statusConfig = {
  planejada: { label: 'Planejada', variant: 'default' as const },
  em_andamento: { label: 'Em Andamento', variant: 'info' as const },
  finalizada: { label: 'Finalizada', variant: 'success' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
};

export function RotasPage() {
  const toast = useToast();
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataFilter, setDataFilter] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal de nova rota
  const [showNovaRotaModal, setShowNovaRotaModal] = useState(false);
  const [novaRotaForm, setNovaRotaForm] = useState({
    motorista_id: '',
    veiculo_id: '',
    data: new Date().toISOString().split('T')[0],
  });
  
  // Modal de detalhes
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [rotaSelecionada, setRotaSelecionada] = useState<Rota | null>(null);
  
  // Entregas disponíveis para roteirização
  const [entregasDisponiveis, setEntregasDisponiveis] = useState<EntregaRota[]>([]);
  const [entregasSelecionadas, setEntregasSelecionadas] = useState<string[]>([]);

  useEffect(() => {
    loadRotas();
    loadMotoristas();
    loadVeiculos();
  }, [dataFilter]);

  const loadRotas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Rota[] }>(
        `/logistica/rotas?data=${dataFilter}`
      );
      if (response.success) {
        setRotas(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar rotas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMotoristas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Motorista[] }>('/logistica/motoristas');
      if (response.success) {
        setMotoristas(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar motoristas');
    }
  };

  const loadVeiculos = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Veiculo[] }>('/logistica/veiculos');
      if (response.success) {
        setVeiculos(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar veículos');
    }
  };

  const loadEntregasDisponiveis = async () => {
    try {
      const response = await api.get<{ success: boolean; data: EntregaRota[] }>(
        `/logistica/entregas/disponiveis?data=${novaRotaForm.data}`
      );
      if (response.success) {
        setEntregasDisponiveis(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar entregas');
    }
  };

  const handleCriarRota = async () => {
    if (!novaRotaForm.motorista_id || !novaRotaForm.veiculo_id || entregasSelecionadas.length === 0) {
      toast.error('Selecione motorista, veículo e pelo menos uma entrega');
      return;
    }

    try {
      await api.post('/logistica/rotas', {
        ...novaRotaForm,
        entregas: entregasSelecionadas,
      });
      toast.success('Rota criada com sucesso');
      setShowNovaRotaModal(false);
      setEntregasSelecionadas([]);
      loadRotas();
    } catch (error) {
      toast.error('Erro ao criar rota');
    }
  };

  const handleIniciarRota = async (rota: Rota) => {
    try {
      await api.post(`/logistica/rotas/${rota.id}/iniciar`);
      toast.success('Rota iniciada');
      loadRotas();
    } catch (error) {
      toast.error('Erro ao iniciar rota');
    }
  };

  const handleFinalizarRota = async (rota: Rota) => {
    try {
      await api.post(`/logistica/rotas/${rota.id}/finalizar`);
      toast.success('Rota finalizada');
      loadRotas();
    } catch (error) {
      toast.error('Erro ao finalizar rota');
    }
  };

  const handleOtimizarRota = async (rota: Rota) => {
    try {
      await api.post(`/logistica/rotas/${rota.id}/otimizar`);
      toast.success('Rota otimizada');
      loadRotas();
    } catch (error) {
      toast.error('Erro ao otimizar rota');
    }
  };

  const calcularProgresso = (rota: Rota) => {
    if (rota.total_entregas === 0) return 0;
    return Math.round((rota.entregas_realizadas / rota.total_entregas) * 100);
  };

  // Estatísticas
  const stats = {
    total: rotas.length,
    emAndamento: rotas.filter(r => r.status === 'em_andamento').length,
    finalizadas: rotas.filter(r => r.status === 'finalizada').length,
    entregasHoje: rotas.reduce((acc, r) => acc + r.total_entregas, 0),
    entregasRealizadas: rotas.reduce((acc, r) => acc + r.entregas_realizadas, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rotas de Entrega</h1>
          <p className="text-gray-500">Planeje e acompanhe as rotas de entrega</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dataFilter}
            onChange={(e) => setDataFilter(e.target.value)}
            className="w-40"
          />
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => {
              loadEntregasDisponiveis();
              setShowNovaRotaModal(true);
            }}
          >
            Nova Rota
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Rotas</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Em Andamento</p>
          <p className="text-2xl font-bold text-blue-600">{stats.emAndamento}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Finalizadas</p>
          <p className="text-2xl font-bold text-green-600">{stats.finalizadas}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Entregas do Dia</p>
          <p className="text-2xl font-bold">{stats.entregasHoje}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Realizadas</p>
          <p className="text-2xl font-bold text-planac-600">{stats.entregasRealizadas}</p>
        </Card>
      </div>

      {/* Lista de Rotas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-planac-500" />
          </div>
        ) : rotas.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Icons.document className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma rota para esta data</p>
          </div>
        ) : (
          rotas.map((rota) => (
            <Card key={rota.id} padding="md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-lg">{rota.codigo}</p>
                  <Badge variant={statusConfig[rota.status].variant}>
                    {statusConfig[rota.status].label}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progresso</p>
                  <p className="text-xl font-bold text-planac-600">{calcularProgresso(rota)}%</p>
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-planac-500 h-2 rounded-full transition-all"
                  style={{ width: `${calcularProgresso(rota)}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Motorista</p>
                  <p className="font-medium">{rota.motorista_nome}</p>
                </div>
                <div>
                  <p className="text-gray-500">Veículo</p>
                  <p className="font-medium">{rota.veiculo_placa}</p>
                </div>
                <div>
                  <p className="text-gray-500">Entregas</p>
                  <p className="font-medium">{rota.entregas_realizadas} / {rota.total_entregas}</p>
                </div>
                <div>
                  <p className="text-gray-500">KM Estimado</p>
                  <p className="font-medium">{rota.km_estimado} km</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setRotaSelecionada(rota);
                    setShowDetalhesModal(true);
                  }}
                >
                  <Icons.eye className="w-4 h-4 mr-1" /> Detalhes
                </Button>
                
                {rota.status === 'planejada' && (
                  <Button size="sm" className="flex-1" onClick={() => handleIniciarRota(rota)}>
                    <Icons.check className="w-4 h-4 mr-1" /> Iniciar
                  </Button>
                )}
                
                {rota.status === 'em_andamento' && (
                  <Button size="sm" className="flex-1" onClick={() => handleFinalizarRota(rota)}>
                    <Icons.check className="w-4 h-4 mr-1" /> Finalizar
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Nova Rota */}
      <Modal
        isOpen={showNovaRotaModal}
        onClose={() => setShowNovaRotaModal(false)}
        title="Nova Rota de Entrega"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Data"
              type="date"
              value={novaRotaForm.data}
              onChange={(e) => {
                setNovaRotaForm({ ...novaRotaForm, data: e.target.value });
                loadEntregasDisponiveis();
              }}
            />
            <Select
              label="Motorista"
              value={novaRotaForm.motorista_id}
              onChange={(v) => setNovaRotaForm({ ...novaRotaForm, motorista_id: v })}
              options={[
                { value: '', label: 'Selecione...' },
                ...motoristas.map(m => ({ value: m.id, label: m.nome })),
              ]}
            />
            <Select
              label="Veículo"
              value={novaRotaForm.veiculo_id}
              onChange={(v) => setNovaRotaForm({ ...novaRotaForm, veiculo_id: v })}
              options={[
                { value: '', label: 'Selecione...' },
                ...veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` })),
              ]}
            />
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Entregas Disponíveis ({entregasDisponiveis.length})
            </p>
            <div className="border rounded-lg max-h-64 overflow-auto">
              {entregasDisponiveis.length === 0 ? (
                <p className="text-center py-8 text-gray-500">Nenhuma entrega disponível</p>
              ) : (
                entregasDisponiveis.map((entrega) => (
                  <label
                    key={entrega.id}
                    className={`flex items-center p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                      entregasSelecionadas.includes(entrega.id) ? 'bg-planac-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={entregasSelecionadas.includes(entrega.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEntregasSelecionadas([...entregasSelecionadas, entrega.id]);
                        } else {
                          setEntregasSelecionadas(entregasSelecionadas.filter(id => id !== entrega.id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{entrega.cliente_nome}</p>
                      <p className="text-sm text-gray-500">{entrega.endereco} - {entrega.bairro}</p>
                    </div>
                    <span className="text-sm text-gray-500">{entrega.volumes} vol</span>
                  </label>
                ))
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm">
              <strong>{entregasSelecionadas.length}</strong> entrega(s) selecionada(s)
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowNovaRotaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarRota}>
              Criar Rota
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalhes da Rota */}
      <Modal
        isOpen={showDetalhesModal}
        onClose={() => setShowDetalhesModal(false)}
        title={`Rota ${rotaSelecionada?.codigo}`}
        size="lg"
      >
        {rotaSelecionada && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Motorista</p>
                <p className="font-medium">{rotaSelecionada.motorista_nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Veículo</p>
                <p className="font-medium">{rotaSelecionada.veiculo_placa} - {rotaSelecionada.veiculo_modelo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={statusConfig[rotaSelecionada.status].variant}>
                  {statusConfig[rotaSelecionada.status].label}
                </Badge>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Entregas da Rota</p>
                {rotaSelecionada.status === 'planejada' && (
                  <Button size="sm" variant="secondary" onClick={() => handleOtimizarRota(rotaSelecionada)}>
                    <Icons.settings className="w-4 h-4 mr-1" /> Otimizar
                  </Button>
                )}
              </div>
              <div className="border rounded-lg divide-y max-h-80 overflow-auto">
                {rotaSelecionada.entregas.map((entrega, index) => (
                  <div key={entrega.id} className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-planac-100 flex items-center justify-center text-sm font-bold text-planac-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{entrega.cliente_nome}</p>
                      <p className="text-sm text-gray-500">{entrega.endereco} - {entrega.bairro}</p>
                    </div>
                    <Badge variant={
                      entrega.status === 'entregue' ? 'success' : 
                      entrega.status === 'problema' ? 'danger' : 
                      entrega.status === 'em_rota' ? 'info' : 'default'
                    }>
                      {entrega.status === 'entregue' ? 'Entregue' : 
                       entrega.status === 'problema' ? 'Problema' :
                       entrega.status === 'em_rota' ? 'Em Rota' : 'Pendente'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default RotasPage;
