// =============================================
// PLANAC ERP - Central de Relatórios
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Relatorio {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  categoria: 'vendas' | 'financeiro' | 'estoque' | 'fiscal' | 'rh' | 'clientes';
  tipo: 'listagem' | 'analitico' | 'grafico' | 'exportacao';
  parametros: Array<{
    nome: string;
    tipo: 'data' | 'periodo' | 'select' | 'text' | 'boolean';
    obrigatorio: boolean;
    opcoes?: Array<{ value: string; label: string }>;
  }>;
  favorito: boolean;
  ultimo_acesso?: string;
}

interface RelatorioAgendado {
  id: string;
  relatorio_id: string;
  relatorio_nome: string;
  frequencia: 'diario' | 'semanal' | 'mensal';
  horario: string;
  destinatarios: string[];
  formato: 'pdf' | 'xlsx' | 'csv';
  ativo: boolean;
  proxima_execucao: string;
}

const categoriaConfig = {
  vendas: { label: 'Vendas', icon: '📊', color: 'bg-blue-100 text-blue-700' },
  financeiro: { label: 'Financeiro', icon: '💰', color: 'bg-green-100 text-green-700' },
  estoque: { label: 'Estoque', icon: '📦', color: 'bg-orange-100 text-orange-700' },
  fiscal: { label: 'Fiscal', icon: '📑', color: 'bg-purple-100 text-purple-700' },
  rh: { label: 'RH', icon: '👥', color: 'bg-pink-100 text-pink-700' },
  clientes: { label: 'Clientes', icon: '🤝', color: 'bg-cyan-100 text-cyan-700' },
};

export function RelatoriosPage() {
  const toast = useToast();
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [agendados, setAgendados] = useState<RelatorioAgendado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todos');
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  
  // Modal de execução
  const [showExecModal, setShowExecModal] = useState(false);
  const [relatorioExec, setRelatorioExec] = useState<Relatorio | null>(null);
  const [execParams, setExecParams] = useState<Record<string, any>>({});
  const [execFormato, setExecFormato] = useState('pdf');
  
  // Modal de agendamento
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [agendaForm, setAgendaForm] = useState({
    frequencia: 'mensal',
    horario: '08:00',
    destinatarios: '',
    formato: 'pdf',
  });

  useEffect(() => {
    loadRelatorios();
    loadAgendados();
  }, []);

  const loadRelatorios = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Relatorio[] }>('/bi/relatorios');
      if (response.success) {
        setRelatorios(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgendados = async () => {
    try {
      const response = await api.get<{ success: boolean; data: RelatorioAgendado[] }>('/bi/relatorios/agendados');
      if (response.success) {
        setAgendados(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar agendados');
    }
  };

  const handleExecutar = async () => {
    if (!relatorioExec) return;

    // Validar parâmetros obrigatórios
    const faltando = relatorioExec.parametros
      .filter(p => p.obrigatorio && !execParams[p.nome])
      .map(p => p.nome);
    
    if (faltando.length > 0) {
      toast.error(`Preencha: ${faltando.join(', ')}`);
      return;
    }

    try {
      const response = await api.post(`/bi/relatorios/${relatorioExec.id}/executar`, {
        parametros: execParams,
        formato: execFormato,
      });
      
      if (response.success && response.url) {
        window.open(response.url, '_blank');
        toast.success('Relatório gerado');
      }
      
      setShowExecModal(false);
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    }
  };

  const handleAgendar = async () => {
    if (!relatorioExec) return;

    try {
      await api.post(`/bi/relatorios/${relatorioExec.id}/agendar`, {
        ...agendaForm,
        parametros: execParams,
        destinatarios: agendaForm.destinatarios.split(',').map(e => e.trim()),
      });
      toast.success('Relatório agendado');
      setShowAgendaModal(false);
      loadAgendados();
    } catch (error) {
      toast.error('Erro ao agendar');
    }
  };

  const handleToggleFavorito = async (relatorio: Relatorio) => {
    try {
      await api.post(`/bi/relatorios/${relatorio.id}/favorito`);
      loadRelatorios();
    } catch (error) {
      toast.error('Erro ao atualizar favorito');
    }
  };

  const handleCancelarAgendamento = async (agendado: RelatorioAgendado) => {
    if (!confirm('Deseja cancelar este agendamento?')) return;

    try {
      await api.delete(`/bi/relatorios/agendados/${agendado.id}`);
      toast.success('Agendamento cancelado');
      loadAgendados();
    } catch (error) {
      toast.error('Erro ao cancelar');
    }
  };

  const filteredRelatorios = relatorios.filter((rel) => {
    const matchSearch = rel.nome.toLowerCase().includes(search.toLowerCase()) ||
                       rel.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = !categoriaFilter || rel.categoria === categoriaFilter;
    const matchTab = activeTab === 'todos' || 
                    (activeTab === 'favoritos' && rel.favorito) ||
                    (activeTab === 'recentes' && rel.ultimo_acesso);
    return matchSearch && matchCategoria && matchTab;
  });

  const relatoriosPorCategoria = Object.entries(categoriaConfig).map(([key, config]) => ({
    categoria: key,
    ...config,
    quantidade: relatorios.filter(r => r.categoria === key).length,
  }));

  const renderParametroInput = (param: Relatorio['parametros'][0]) => {
    switch (param.tipo) {
      case 'data':
        return (
          <Input
            type="date"
            value={execParams[param.nome] || ''}
            onChange={(e) => setExecParams({ ...execParams, [param.nome]: e.target.value })}
          />
        );
      case 'periodo':
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="Início"
              value={execParams[`${param.nome}_inicio`] || ''}
              onChange={(e) => setExecParams({ ...execParams, [`${param.nome}_inicio`]: e.target.value })}
            />
            <Input
              type="date"
              placeholder="Fim"
              value={execParams[`${param.nome}_fim`] || ''}
              onChange={(e) => setExecParams({ ...execParams, [`${param.nome}_fim`]: e.target.value })}
            />
          </div>
        );
      case 'select':
        return (
          <Select
            value={execParams[param.nome] || ''}
            onChange={(v) => setExecParams({ ...execParams, [param.nome]: v })}
            options={[
              { value: '', label: 'Selecione...' },
              ...(param.opcoes || []),
            ]}
          />
        );
      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={execParams[param.nome] || false}
              onChange={(e) => setExecParams({ ...execParams, [param.nome]: e.target.checked })}
            />
            <span className="text-sm">Sim</span>
          </label>
        );
      default:
        return (
          <Input
            value={execParams[param.nome] || ''}
            onChange={(e) => setExecParams({ ...execParams, [param.nome]: e.target.value })}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Relatórios</h1>
          <p className="text-gray-500">Gere e agende relatórios do sistema</p>
        </div>
      </div>

      {/* Categorias */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {relatoriosPorCategoria.map((cat) => (
          <Card
            key={cat.categoria}
            className={`cursor-pointer transition-all hover:shadow-md ${
              categoriaFilter === cat.categoria ? 'ring-2 ring-planac-500' : ''
            }`}
            padding="sm"
            onClick={() => setCategoriaFilter(categoriaFilter === cat.categoria ? '' : cat.categoria)}
          >
            <div className="text-center">
              <span className="text-3xl">{cat.icon}</span>
              <p className="font-medium mt-1">{cat.label}</p>
              <p className="text-sm text-gray-500">{cat.quantidade} relatórios</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs e Filtros */}
      <div className="flex flex-wrap gap-4 items-end">
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'todos', label: 'Todos' },
            { id: 'favoritos', label: '⭐ Favoritos' },
            { id: 'recentes', label: '🕐 Recentes' },
            { id: 'agendados', label: '📅 Agendados' },
          ]}
        />
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar relatório..."
            leftIcon={<Icons.search className="w-5 h-5" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Relatórios */}
      {activeTab !== 'agendados' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRelatorios.map((rel) => {
            const cat = categoriaConfig[rel.categoria];
            return (
              <Card key={rel.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={cat.color}>{cat.label}</Badge>
                  <button
                    onClick={() => handleToggleFavorito(rel)}
                    className={`text-xl ${rel.favorito ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                  >
                    ⭐
                  </button>
                </div>
                <h4 className="font-bold text-lg mb-1">{rel.nome}</h4>
                <p className="text-sm text-gray-500 mb-4">{rel.descricao}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setRelatorioExec(rel);
                      setExecParams({});
                      setShowExecModal(true);
                    }}
                  >
                    <Icons.printer className="w-4 h-4 mr-1" /> Gerar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setRelatorioExec(rel);
                      setExecParams({});
                      setShowAgendaModal(true);
                    }}
                  >
                    <Icons.calendar className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Lista de Agendados */
        <Card padding="none">
          {agendados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icons.calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum relatório agendado</p>
            </div>
          ) : (
            <div className="divide-y">
              {agendados.map((ag) => (
                <div key={ag.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ag.relatorio_nome}</p>
                    <p className="text-sm text-gray-500">
                      {ag.frequencia === 'diario' ? 'Diariamente' :
                       ag.frequencia === 'semanal' ? 'Semanalmente' : 'Mensalmente'} às {ag.horario}
                    </p>
                    <p className="text-xs text-gray-400">
                      Próxima execução: {new Date(ag.proxima_execucao).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={ag.ativo ? 'success' : 'default'}>
                      {ag.ativo ? 'Ativo' : 'Pausado'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCancelarAgendamento(ag)}
                    >
                      <Icons.x className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modal Executar */}
      <Modal
        isOpen={showExecModal}
        onClose={() => setShowExecModal(false)}
        title={`Gerar: ${relatorioExec?.nome}`}
        size="md"
      >
        {relatorioExec && (
          <div className="space-y-4">
            {relatorioExec.parametros.map((param) => (
              <div key={param.nome}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {param.nome} {param.obrigatorio && <span className="text-red-500">*</span>}
                </label>
                {renderParametroInput(param)}
              </div>
            ))}
            
            <Select
              label="Formato de Saída"
              value={execFormato}
              onChange={setExecFormato}
              options={[
                { value: 'pdf', label: 'PDF' },
                { value: 'xlsx', label: 'Excel (XLSX)' },
                { value: 'csv', label: 'CSV' },
              ]}
            />
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowExecModal(false)}>Cancelar</Button>
              <Button onClick={handleExecutar}>Gerar Relatório</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Agendar */}
      <Modal
        isOpen={showAgendaModal}
        onClose={() => setShowAgendaModal(false)}
        title={`Agendar: ${relatorioExec?.nome}`}
        size="md"
      >
        <div className="space-y-4">
          {relatorioExec?.parametros.map((param) => (
            <div key={param.nome}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {param.nome} {param.obrigatorio && <span className="text-red-500">*</span>}
              </label>
              {renderParametroInput(param)}
            </div>
          ))}
          
          <Select
            label="Frequência"
            value={agendaForm.frequencia}
            onChange={(v) => setAgendaForm({ ...agendaForm, frequencia: v })}
            options={[
              { value: 'diario', label: 'Diariamente' },
              { value: 'semanal', label: 'Semanalmente' },
              { value: 'mensal', label: 'Mensalmente' },
            ]}
          />
          
          <Input
            label="Horário"
            type="time"
            value={agendaForm.horario}
            onChange={(e) => setAgendaForm({ ...agendaForm, horario: e.target.value })}
          />
          
          <Input
            label="E-mails (separados por vírgula)"
            value={agendaForm.destinatarios}
            onChange={(e) => setAgendaForm({ ...agendaForm, destinatarios: e.target.value })}
            placeholder="email1@empresa.com, email2@empresa.com"
          />
          
          <Select
            label="Formato"
            value={agendaForm.formato}
            onChange={(v) => setAgendaForm({ ...agendaForm, formato: v })}
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'xlsx', label: 'Excel (XLSX)' },
              { value: 'csv', label: 'CSV' },
            ]}
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAgendaModal(false)}>Cancelar</Button>
            <Button onClick={handleAgendar}>Agendar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RelatoriosPage;
