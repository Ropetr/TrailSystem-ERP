// =============================================
// PLANAC ERP - Ponto Eletrônico
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

interface RegistroPonto {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  funcionario_matricula: string;
  data: string;
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
  horas_trabalhadas: number;
  horas_extras: number;
  horas_faltantes: number;
  status: 'normal' | 'falta' | 'atraso' | 'hora_extra' | 'abono' | 'ferias' | 'atestado';
  observacao?: string;
  justificativa?: string;
}

interface ResumoFuncionario {
  funcionario_id: string;
  funcionario_nome: string;
  dias_trabalhados: number;
  horas_trabalhadas: number;
  horas_extras: number;
  faltas: number;
  atrasos: number;
}

const statusConfig = {
  normal: { label: 'Normal', variant: 'success' as const },
  falta: { label: 'Falta', variant: 'danger' as const },
  atraso: { label: 'Atraso', variant: 'warning' as const },
  hora_extra: { label: 'Hora Extra', variant: 'info' as const },
  abono: { label: 'Abono', variant: 'default' as const },
  ferias: { label: 'Férias', variant: 'info' as const },
  atestado: { label: 'Atestado', variant: 'warning' as const },
};

export function PontoPage() {
  const toast = useToast();
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [resumos, setResumos] = useState<ResumoFuncionario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'dia' | 'mes'>('dia');
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [mesFiltro, setMesFiltro] = useState(new Date().toISOString().slice(0, 7));
  const [funcionarioFiltro, setFuncionarioFiltro] = useState('');
  
  // Modal de ajuste
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [registroAjuste, setRegistroAjuste] = useState<RegistroPonto | null>(null);
  const [ajusteForm, setAjusteForm] = useState({
    entrada1: '',
    saida1: '',
    entrada2: '',
    saida2: '',
    justificativa: '',
  });
  
  // Modal de abono
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [abonoForm, setAbonoForm] = useState({
    funcionario_id: '',
    data_inicio: '',
    data_fim: '',
    tipo: 'abono',
    motivo: '',
  });

  useEffect(() => {
    loadRegistros();
  }, [dataFiltro, mesFiltro, viewMode]);

  const loadRegistros = async () => {
    try {
      const endpoint = viewMode === 'dia' 
        ? `/rh/ponto/dia?data=${dataFiltro}`
        : `/rh/ponto/mes?mes=${mesFiltro}`;
      
      const response = await api.get<{ success: boolean; data: RegistroPonto[]; resumos?: ResumoFuncionario[] }>(endpoint);
      if (response.success) {
        setRegistros(response.data);
        if (response.resumos) setResumos(response.resumos);
      }
    } catch (error) {
      toast.error('Erro ao carregar registros');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrarPonto = async () => {
    try {
      await api.post('/rh/ponto/registrar');
      toast.success('Ponto registrado');
      loadRegistros();
    } catch (error) {
      toast.error('Erro ao registrar ponto');
    }
  };

  const handleSalvarAjuste = async () => {
    if (!registroAjuste) return;

    try {
      await api.put(`/rh/ponto/${registroAjuste.id}/ajustar`, {
        ...ajusteForm,
      });
      toast.success('Ponto ajustado');
      setShowAjusteModal(false);
      loadRegistros();
    } catch (error) {
      toast.error('Erro ao ajustar ponto');
    }
  };

  const handleSalvarAbono = async () => {
    if (!abonoForm.funcionario_id || !abonoForm.data_inicio) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      await api.post('/rh/ponto/abono', abonoForm);
      toast.success('Abono registrado');
      setShowAbonoModal(false);
      setAbonoForm({ funcionario_id: '', data_inicio: '', data_fim: '', tipo: 'abono', motivo: '' });
      loadRegistros();
    } catch (error) {
      toast.error('Erro ao registrar abono');
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  const formatHoras = (horas: number) => {
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    return `${h}h${m > 0 ? `${m}m` : ''}`;
  };

  const filteredRegistros = registros.filter((reg) => {
    if (!funcionarioFiltro) return true;
    return reg.funcionario_nome.toLowerCase().includes(funcionarioFiltro.toLowerCase()) ||
           reg.funcionario_matricula.includes(funcionarioFiltro);
  });

  // Stats do dia
  const stats = {
    presentes: registros.filter(r => r.entrada1 && r.status !== 'falta').length,
    faltas: registros.filter(r => r.status === 'falta').length,
    atrasos: registros.filter(r => r.status === 'atraso').length,
    horasExtras: registros.reduce((acc, r) => acc + r.horas_extras, 0),
  };

  const columns = [
    {
      key: 'funcionario',
      header: 'Funcionário',
      render: (r: RegistroPonto) => (
        <div>
          <p className="font-medium">{r.funcionario_nome}</p>
          <p className="text-sm text-gray-500">{r.funcionario_matricula}</p>
        </div>
      ),
    },
    {
      key: 'entrada1',
      header: 'Entrada',
      width: '80px',
      render: (r: RegistroPonto) => (
        <span className={!r.entrada1 ? 'text-gray-400' : ''}>{formatTime(r.entrada1)}</span>
      ),
    },
    {
      key: 'saida1',
      header: 'Saída Almoço',
      width: '80px',
      render: (r: RegistroPonto) => formatTime(r.saida1),
    },
    {
      key: 'entrada2',
      header: 'Retorno',
      width: '80px',
      render: (r: RegistroPonto) => formatTime(r.entrada2),
    },
    {
      key: 'saida2',
      header: 'Saída',
      width: '80px',
      render: (r: RegistroPonto) => formatTime(r.saida2),
    },
    {
      key: 'horas',
      header: 'Trabalhado',
      width: '100px',
      render: (r: RegistroPonto) => (
        <div>
          <p className="font-medium">{formatHoras(r.horas_trabalhadas)}</p>
          {r.horas_extras > 0 && (
            <p className="text-xs text-green-600">+{formatHoras(r.horas_extras)} extra</p>
          )}
          {r.horas_faltantes > 0 && (
            <p className="text-xs text-red-600">-{formatHoras(r.horas_faltantes)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (r: RegistroPonto) => {
        const config = statusConfig[r.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (registro: RegistroPonto) => [
    {
      label: 'Ajustar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => {
        setRegistroAjuste(registro);
        setAjusteForm({
          entrada1: registro.entrada1 || '',
          saida1: registro.saida1 || '',
          entrada2: registro.entrada2 || '',
          saida2: registro.saida2 || '',
          justificativa: registro.justificativa || '',
        });
        setShowAjusteModal(true);
      },
    },
    {
      label: 'Ver Histórico',
      icon: <Icons.document className="w-4 h-4" />,
      onClick: () => {},
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ponto Eletrônico</h1>
          <p className="text-gray-500">Controle de frequência dos colaboradores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAbonoModal(true)}>
            Registrar Abono
          </Button>
          <Button leftIcon={<Icons.check className="w-5 h-5" />} onClick={handleRegistrarPonto}>
            Bater Ponto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visualização</label>
            <div className="flex">
              <Button
                size="sm"
                variant={viewMode === 'dia' ? 'primary' : 'secondary'}
                className="rounded-r-none"
                onClick={() => setViewMode('dia')}
              >
                Dia
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'mes' ? 'primary' : 'secondary'}
                className="rounded-l-none"
                onClick={() => setViewMode('mes')}
              >
                Mês
              </Button>
            </div>
          </div>
          
          {viewMode === 'dia' ? (
            <Input
              label="Data"
              type="date"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              className="w-40"
            />
          ) : (
            <Input
              label="Mês"
              type="month"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="w-40"
            />
          )}
          
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Funcionário"
              placeholder="Buscar por nome ou matrícula..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={funcionarioFiltro}
              onChange={(e) => setFuncionarioFiltro(e.target.value)}
            />
          </div>
          
          <Button variant="secondary" leftIcon={<Icons.printer className="w-5 h-5" />}>
            Exportar
          </Button>
        </div>
      </Card>

      {/* Stats */}
      {viewMode === 'dia' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <p className="text-sm text-gray-500">Presentes</p>
            <p className="text-2xl font-bold text-green-600">{stats.presentes}</p>
          </Card>
          <Card padding="sm">
            <p className="text-sm text-gray-500">Faltas</p>
            <p className="text-2xl font-bold text-red-600">{stats.faltas}</p>
          </Card>
          <Card padding="sm">
            <p className="text-sm text-gray-500">Atrasos</p>
            <p className="text-2xl font-bold text-orange-600">{stats.atrasos}</p>
          </Card>
          <Card padding="sm">
            <p className="text-sm text-gray-500">Horas Extras</p>
            <p className="text-2xl font-bold text-blue-600">{formatHoras(stats.horasExtras)}</p>
          </Card>
        </div>
      )}

      {/* Tabela */}
      <Card padding="none">
        <DataTable
          data={filteredRegistros}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum registro encontrado"
        />
      </Card>

      {/* Modal Ajuste */}
      <Modal
        isOpen={showAjusteModal}
        onClose={() => setShowAjusteModal(false)}
        title={`Ajustar Ponto - ${registroAjuste?.funcionario_nome}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Entrada"
              type="time"
              value={ajusteForm.entrada1}
              onChange={(e) => setAjusteForm({ ...ajusteForm, entrada1: e.target.value })}
            />
            <Input
              label="Saída Almoço"
              type="time"
              value={ajusteForm.saida1}
              onChange={(e) => setAjusteForm({ ...ajusteForm, saida1: e.target.value })}
            />
            <Input
              label="Retorno Almoço"
              type="time"
              value={ajusteForm.entrada2}
              onChange={(e) => setAjusteForm({ ...ajusteForm, entrada2: e.target.value })}
            />
            <Input
              label="Saída"
              type="time"
              value={ajusteForm.saida2}
              onChange={(e) => setAjusteForm({ ...ajusteForm, saida2: e.target.value })}
            />
          </div>
          <Input
            label="Justificativa *"
            value={ajusteForm.justificativa}
            onChange={(e) => setAjusteForm({ ...ajusteForm, justificativa: e.target.value })}
            placeholder="Motivo do ajuste..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAjusteModal(false)}>Cancelar</Button>
            <Button onClick={handleSalvarAjuste}>Salvar Ajuste</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Abono */}
      <Modal
        isOpen={showAbonoModal}
        onClose={() => setShowAbonoModal(false)}
        title="Registrar Abono/Atestado"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Funcionário *"
            value={abonoForm.funcionario_id}
            onChange={(v) => setAbonoForm({ ...abonoForm, funcionario_id: v })}
            options={[{ value: '', label: 'Selecione...' }]}
          />
          <Select
            label="Tipo"
            value={abonoForm.tipo}
            onChange={(v) => setAbonoForm({ ...abonoForm, tipo: v })}
            options={[
              { value: 'abono', label: 'Abono' },
              { value: 'atestado', label: 'Atestado Médico' },
              { value: 'ferias', label: 'Férias' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data Início *"
              type="date"
              value={abonoForm.data_inicio}
              onChange={(e) => setAbonoForm({ ...abonoForm, data_inicio: e.target.value })}
            />
            <Input
              label="Data Fim"
              type="date"
              value={abonoForm.data_fim}
              onChange={(e) => setAbonoForm({ ...abonoForm, data_fim: e.target.value })}
            />
          </div>
          <Input
            label="Motivo"
            value={abonoForm.motivo}
            onChange={(e) => setAbonoForm({ ...abonoForm, motivo: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAbonoModal(false)}>Cancelar</Button>
            <Button onClick={handleSalvarAbono}>Registrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PontoPage;
