// =============================================
// PLANAC ERP - Plano de Contas
// =============================================

import React from 'react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'ativo' | 'passivo' | 'receita' | 'despesa' | 'patrimonio';
  natureza: 'devedora' | 'credora';
  nivel: number;
  conta_pai_id?: string;
  aceita_lancamento: boolean;
  ativa: boolean;
  saldo_atual: number;
  filhos?: ContaContabil[];
}

const tipoConfig = {
  ativo: { label: 'Ativo', color: 'bg-blue-100 text-blue-700', icon: '📊' },
  passivo: { label: 'Passivo', color: 'bg-red-100 text-red-700', icon: '💳' },
  receita: { label: 'Receita', color: 'bg-green-100 text-green-700', icon: '📈' },
  despesa: { label: 'Despesa', color: 'bg-orange-100 text-orange-700', icon: '📉' },
  patrimonio: { label: 'Patrimônio', color: 'bg-purple-100 text-purple-700', icon: '🏦' },
};

export function PlanoContasPage() {
  const toast = useToast();
  const [contas, setContas] = useState<ContaContabil[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [expandedContas, setExpandedContas] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'arvore' | 'lista'>('arvore');
  
  // Modal
  const [showContaModal, setShowContaModal] = useState(false);
  const [contaEdit, setContaEdit] = useState<ContaContabil | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tipo: 'ativo',
    natureza: 'devedora',
    conta_pai_id: '',
    aceita_lancamento: true,
  });

  useEffect(() => {
    loadContas();
  }, []);

  const loadContas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: ContaContabil[] }>('/contabil/plano-contas');
      if (response.success) {
        setContas(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar plano de contas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!formData.codigo || !formData.nome) {
      toast.error('Preencha código e nome da conta');
      return;
    }

    try {
      if (contaEdit) {
        await api.put(`/contabil/plano-contas/${contaEdit.id}`, formData);
        toast.success('Conta atualizada');
      } else {
        await api.post('/contabil/plano-contas', formData);
        toast.success('Conta criada');
      }

      setShowContaModal(false);
      resetForm();
      loadContas();
    } catch (error) {
      toast.error('Erro ao salvar conta');
    }
  };

  const handleDesativar = async (conta: ContaContabil) => {
    if (!confirm(`Deseja ${conta.ativa ? 'desativar' : 'ativar'} esta conta?`)) return;

    try {
      await api.put(`/contabil/plano-contas/${conta.id}/status`, { ativa: !conta.ativa });
      toast.success(`Conta ${conta.ativa ? 'desativada' : 'ativada'}`);
      loadContas();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const resetForm = () => {
    setContaEdit(null);
    setFormData({
      codigo: '',
      nome: '',
      tipo: 'ativo',
      natureza: 'devedora',
      conta_pai_id: '',
      aceita_lancamento: true,
    });
  };

  const toggleExpand = (contaId: string) => {
    const newExpanded = new Set(expandedContas);
    if (newExpanded.has(contaId)) {
      newExpanded.delete(contaId);
    } else {
      newExpanded.add(contaId);
    }
    setExpandedContas(newExpanded);
  };

  const expandAll = () => {
    const getAllIds = (contas: ContaContabil[]): string[] => {
      return contas.flatMap(c => [c.id, ...(c.filhos ? getAllIds(c.filhos) : [])]);
    };
    setExpandedContas(new Set(getAllIds(contas)));
  };

  const collapseAll = () => {
    setExpandedContas(new Set());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const contasRaiz = contas.filter(c => !c.conta_pai_id);

  const filterContas = (contas: ContaContabil[]): ContaContabil[] => {
    return contas.filter(conta => {
      const matchSearch = conta.codigo.includes(search) || 
                         conta.nome.toLowerCase().includes(search.toLowerCase());
      const matchTipo = !tipoFilter || conta.tipo === tipoFilter;
      
      if (conta.filhos && conta.filhos.length > 0) {
        const filteredFilhos = filterContas(conta.filhos);
        if (filteredFilhos.length > 0) {
          return true;
        }
      }
      
      return matchSearch && matchTipo;
    });
  };

  const renderContaArvore = (conta: ContaContabil, depth: number = 0) => {
    const hasFilhos = conta.filhos && conta.filhos.length > 0;
    const isExpanded = expandedContas.has(conta.id);
    const config = tipoConfig[conta.tipo];

    return (
      <React.Fragment key={conta.id}>
        <div 
          className={`flex items-center justify-between p-2 hover:bg-gray-50 border-b ${!conta.ativa ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${20 + depth * 24}px` }}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasFilhos ? (
              <button onClick={() => toggleExpand(conta.id)} className="text-gray-400 hover:text-gray-600">
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span className="w-4"></span>
            )}
            
            <span className="font-mono text-sm text-gray-500 w-24">{conta.codigo}</span>
            <span className={conta.nivel <= 2 ? 'font-semibold' : ''}>{conta.nome}</span>
            
            {conta.aceita_lancamento && (
              <Badge variant="default" className="text-xs">Analítica</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`font-mono text-sm ${conta.saldo_atual < 0 ? 'text-red-600' : ''}`}>
              {formatCurrency(conta.saldo_atual)}
            </span>
            
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setContaEdit(conta);
                  setFormData({
                    codigo: conta.codigo,
                    nome: conta.nome,
                    tipo: conta.tipo,
                    natureza: conta.natureza,
                    conta_pai_id: conta.conta_pai_id || '',
                    aceita_lancamento: conta.aceita_lancamento,
                  });
                  setShowContaModal(true);
                }}
                className="p-1 text-gray-400 hover:text-blue-600"
              >
                <Icons.edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDesativar(conta)}
                className={`p-1 ${conta.ativa ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
              >
                {conta.ativa ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        
        {hasFilhos && isExpanded && conta.filhos!.map(filho => renderContaArvore(filho, depth + 1))}
      </React.Fragment>
    );
  };

  // Stats
  const stats = {
    total: contas.length,
    ativas: contas.filter(c => c.ativa).length,
    analiticas: contas.filter(c => c.aceita_lancamento).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plano de Contas</h1>
          <p className="text-gray-500">Estrutura contábil da empresa</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => { resetForm(); setShowContaModal(true); }}>
          Nova Conta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(tipoConfig).map(([tipo, config]) => (
          <Card key={tipo} padding="sm" className="cursor-pointer hover:shadow-md" onClick={() => setTipoFilter(tipoFilter === tipo ? '' : tipo)}>
            <div className={`flex items-center gap-2 ${tipoFilter === tipo ? 'ring-2 ring-planac-500 rounded' : ''}`}>
              <span className="text-2xl">{config.icon}</span>
              <div>
                <p className="text-sm text-gray-500">{config.label}</p>
                <p className="text-lg font-bold">{contas.filter(c => c.tipo === tipo).length}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por código ou nome..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={expandAll}>
              Expandir Tudo
            </Button>
            <Button size="sm" variant="secondary" onClick={collapseAll}>
              Recolher Tudo
            </Button>
          </div>
          <Button variant="secondary" leftIcon={<Icons.printer className="w-5 h-5" />}>
            Imprimir
          </Button>
        </div>
      </Card>

      {/* Árvore de Contas */}
      <Card padding="none">
        <div className="bg-gray-100 p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-medium">Código</span>
            <span className="font-medium">Descrição</span>
          </div>
          <span className="font-medium">Saldo</span>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-planac-500 mx-auto" />
          </div>
        ) : (
          <div className="max-h-[600px] overflow-auto">
            {filterContas(contasRaiz).map(conta => renderContaArvore(conta))}
          </div>
        )}
      </Card>

      {/* Modal Conta */}
      <Modal
        isOpen={showContaModal}
        onClose={() => setShowContaModal(false)}
        title={contaEdit ? 'Editar Conta' : 'Nova Conta'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código *"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ex: 1.1.01"
            />
            <Select
              label="Tipo *"
              value={formData.tipo}
              onChange={(v) => setFormData({ ...formData, tipo: v, natureza: ['ativo', 'despesa'].includes(v) ? 'devedora' : 'credora' })}
              options={Object.entries(tipoConfig).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          </div>
          
          <Input
            label="Nome *"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Nome da conta"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Natureza"
              value={formData.natureza}
              onChange={(v) => setFormData({ ...formData, natureza: v })}
              options={[
                { value: 'devedora', label: 'Devedora' },
                { value: 'credora', label: 'Credora' },
              ]}
            />
            <Select
              label="Conta Pai"
              value={formData.conta_pai_id}
              onChange={(v) => setFormData({ ...formData, conta_pai_id: v })}
              options={[
                { value: '', label: 'Nenhuma (Raiz)' },
                ...contas.filter(c => !c.aceita_lancamento).map(c => ({ value: c.id, label: `${c.codigo} - ${c.nome}` })),
              ]}
            />
          </div>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.aceita_lancamento}
              onChange={(e) => setFormData({ ...formData, aceita_lancamento: e.target.checked })}
            />
            <span className="text-sm">Conta analítica (aceita lançamentos)</span>
          </label>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowContaModal(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>{contaEdit ? 'Atualizar' : 'Criar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PlanoContasPage;
