// =============================================
// PLANAC ERP - Inscrições Estaduais Page
// Gerenciamento de múltiplas IEs por filial
// =============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

// Tipos
interface InscricaoEstadual {
  id: string;
  empresa_id: string;
  filial_id: string;
  uf: string;
  inscricao_estadual: string;
  tipo: 'normal' | 'st' | 'produtor_rural';
  indicador_ie: '1' | '2' | '9';
  data_inicio?: string;
  data_fim?: string;
  situacao_cadastral: 'ativa' | 'suspensa' | 'cancelada' | 'baixada';
  data_situacao?: string;
  regime_especial?: string;
  regime_especial_descricao?: string;
  principal: number;
  ativo: number;
  observacoes?: string;
  // Config tributária (join)
  aliquota_icms_interna?: number;
  responsavel_st?: number;
  recolhe_difal?: number;
  aliquota_fcp?: number;
}

interface Filial {
  id: string;
  nome: string;
  cnpj?: string;
  uf?: string;
  inscricao_estadual?: string;
}

// Constantes
const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const TIPOS_IE = [
  { value: 'normal', label: 'Normal (IE Principal)' },
  { value: 'st', label: 'IEST (Substituto Tributário)' },
  { value: 'produtor_rural', label: 'Produtor Rural' },
];

const INDICADORES_IE = [
  { value: '1', label: '1 - Contribuinte ICMS' },
  { value: '2', label: '2 - Contribuinte isento' },
  { value: '9', label: '9 - Não Contribuinte' },
];

const SITUACOES_CADASTRAIS = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'suspensa', label: 'Suspensa' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'baixada', label: 'Baixada' },
];

export function InscricoesEstaduaisPage() {
  const { filialId } = useParams<{ filialId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [filial, setFilial] = useState<Filial | null>(null);
  const [inscricoes, setInscricoes] = useState<InscricaoEstadual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUf, setFilterUf] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIE, setEditingIE] = useState<InscricaoEstadual | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'config'>('dados');

  // Form state
  const [formData, setFormData] = useState({
    uf: '',
    inscricao_estadual: '',
    tipo: 'normal' as const,
    indicador_ie: '1' as const,
    data_inicio: '',
    data_fim: '',
    situacao_cadastral: 'ativa' as const,
    regime_especial: '',
    regime_especial_descricao: '',
    principal: false,
    observacoes: '',
  });

  const [configData, setConfigData] = useState({
    aliquota_icms_interna: '',
    aliquota_icms_interestadual_sul_sudeste: '',
    aliquota_icms_interestadual_outros: '',
    responsavel_st: false,
    mva_padrao: '',
    recolhe_difal: false,
    aliquota_fcp: '',
    codigo_beneficio: '',
    cfop_venda_interna: '',
    cfop_venda_interestadual: '',
    cfop_devolucao: '',
    informacoes_complementares: '',
  });

  useEffect(() => {
    if (filialId) {
      loadData();
    }
  }, [filialId]);

  const loadData = async () => {
    if (!filialId) return;

    try {
      const [filialRes, inscricoesRes] = await Promise.all([
        api.get<{ success: boolean; data: Filial }>(`/filiais/${filialId}`),
        api.get<{ success: boolean; data: InscricaoEstadual[] }>(`/filiais/${filialId}/inscricoes-estaduais`),
      ]);

      if (filialRes.success) setFilial(filialRes.data);
      if (inscricoesRes.success) setInscricoes(inscricoesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (ie?: InscricaoEstadual) => {
    if (ie) {
      setEditingIE(ie);
      setFormData({
        uf: ie.uf,
        inscricao_estadual: ie.inscricao_estadual,
        tipo: ie.tipo,
        indicador_ie: ie.indicador_ie,
        data_inicio: ie.data_inicio || '',
        data_fim: ie.data_fim || '',
        situacao_cadastral: ie.situacao_cadastral,
        regime_especial: ie.regime_especial || '',
        regime_especial_descricao: ie.regime_especial_descricao || '',
        principal: ie.principal === 1,
        observacoes: ie.observacoes || '',
      });
      setConfigData({
        aliquota_icms_interna: ie.aliquota_icms_interna?.toString() || '',
        aliquota_icms_interestadual_sul_sudeste: '',
        aliquota_icms_interestadual_outros: '',
        responsavel_st: ie.responsavel_st === 1,
        mva_padrao: '',
        recolhe_difal: ie.recolhe_difal === 1,
        aliquota_fcp: ie.aliquota_fcp?.toString() || '',
        codigo_beneficio: '',
        cfop_venda_interna: '',
        cfop_venda_interestadual: '',
        cfop_devolucao: '',
        informacoes_complementares: '',
      });
    } else {
      setEditingIE(null);
      setFormData({
        uf: filial?.uf || '',
        inscricao_estadual: '',
        tipo: 'normal',
        indicador_ie: '1',
        data_inicio: '',
        data_fim: '',
        situacao_cadastral: 'ativa',
        regime_especial: '',
        regime_especial_descricao: '',
        principal: false,
        observacoes: '',
      });
      setConfigData({
        aliquota_icms_interna: '',
        aliquota_icms_interestadual_sul_sudeste: '',
        aliquota_icms_interestadual_outros: '',
        responsavel_st: false,
        mva_padrao: '',
        recolhe_difal: false,
        aliquota_fcp: '',
        codigo_beneficio: '',
        cfop_venda_interna: '',
        cfop_venda_interestadual: '',
        cfop_devolucao: '',
        informacoes_complementares: '',
      });
    }
    setActiveTab('dados');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.uf || !formData.inscricao_estadual) {
      toast.error('Preencha UF e Inscrição Estadual');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        config: {
          aliquota_icms_interna: configData.aliquota_icms_interna ? parseFloat(configData.aliquota_icms_interna) : undefined,
          aliquota_icms_interestadual_sul_sudeste: configData.aliquota_icms_interestadual_sul_sudeste ? parseFloat(configData.aliquota_icms_interestadual_sul_sudeste) : undefined,
          aliquota_icms_interestadual_outros: configData.aliquota_icms_interestadual_outros ? parseFloat(configData.aliquota_icms_interestadual_outros) : undefined,
          responsavel_st: configData.responsavel_st,
          mva_padrao: configData.mva_padrao ? parseFloat(configData.mva_padrao) : undefined,
          recolhe_difal: configData.recolhe_difal,
          aliquota_fcp: configData.aliquota_fcp ? parseFloat(configData.aliquota_fcp) : undefined,
          codigo_beneficio: configData.codigo_beneficio || undefined,
          cfop_venda_interna: configData.cfop_venda_interna || undefined,
          cfop_venda_interestadual: configData.cfop_venda_interestadual || undefined,
          cfop_devolucao: configData.cfop_devolucao || undefined,
          informacoes_complementares: configData.informacoes_complementares || undefined,
        },
      };

      if (editingIE) {
        await api.put(`/filiais/${filialId}/inscricoes-estaduais/${editingIE.id}`, payload);
        toast.success('Inscrição Estadual atualizada com sucesso');
      } else {
        await api.post(`/filiais/${filialId}/inscricoes-estaduais`, payload);
        toast.success('Inscrição Estadual criada com sucesso');
      }
      setModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar Inscrição Estadual');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente desativar esta Inscrição Estadual?')) return;

    try {
      await api.delete(`/filiais/${filialId}/inscricoes-estaduais/${id}`);
      toast.success('Inscrição Estadual desativada com sucesso');
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao desativar Inscrição Estadual');
    }
  };

  // Filtros
  const filteredInscricoes = inscricoes.filter((ie) => {
    const matchSearch = ie.inscricao_estadual.toLowerCase().includes(search.toLowerCase()) ||
                        ie.uf.toLowerCase().includes(search.toLowerCase());
    const matchUf = !filterUf || ie.uf === filterUf;
    const matchTipo = !filterTipo || ie.tipo === filterTipo;
    return matchSearch && matchUf && matchTipo;
  });

  // Helpers
  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'normal':
        return <Badge variant="primary">Normal</Badge>;
      case 'st':
        return <Badge variant="warning">IEST</Badge>;
      case 'produtor_rural':
        return <Badge variant="info">Produtor Rural</Badge>;
      default:
        return <Badge>{tipo}</Badge>;
    }
  };

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case 'ativa':
        return <Badge variant="success">Ativa</Badge>;
      case 'suspensa':
        return <Badge variant="warning">Suspensa</Badge>;
      case 'cancelada':
        return <Badge variant="danger">Cancelada</Badge>;
      case 'baixada':
        return <Badge variant="secondary">Baixada</Badge>;
      default:
        return <Badge>{situacao}</Badge>;
    }
  };

  if (!filialId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Selecione uma filial para gerenciar suas Inscrições Estaduais
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/filiais')}>
            <Icons.arrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inscrições Estaduais</h1>
            <p className="text-gray-500">
              {filial ? `${filial.nome} - CNPJ: ${filial.cnpj || 'N/A'}` : 'Carregando...'}
            </p>
          </div>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => openModal()}>
          Nova IE
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Buscar por IE ou UF..."
            leftIcon={<Icons.search className="w-5 h-5" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Select
            value={filterUf}
            onChange={(v) => setFilterUf(v)}
            options={[{ value: '', label: 'Todas as UFs' }, ...UFS_BRASIL.map(uf => ({ value: uf, label: uf }))]}
            className="w-32"
          />
          <Select
            value={filterTipo}
            onChange={(v) => setFilterTipo(v)}
            options={[{ value: '', label: 'Todos os tipos' }, ...TIPOS_IE]}
            className="w-48"
          />
        </div>
      </Card>

      {/* List */}
      <Card padding="none">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : filteredInscricoes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {inscricoes.length === 0 
              ? 'Nenhuma Inscrição Estadual cadastrada. Clique em "Nova IE" para adicionar.'
              : 'Nenhuma Inscrição Estadual encontrada com os filtros aplicados.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredInscricoes.map((ie) => (
              <div key={ie.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-planac-100 rounded-lg flex items-center justify-center">
                    <span className="text-planac-700 font-bold">{ie.uf}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{ie.inscricao_estadual}</span>
                      {ie.principal === 1 && (
                        <Badge variant="primary" size="sm">Principal</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getTipoBadge(ie.tipo)}
                      {getSituacaoBadge(ie.situacao_cadastral)}
                      {ie.regime_especial && (
                        <span className="text-xs text-gray-500">RE: {ie.regime_especial}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {ie.tipo === 'st' && ie.responsavel_st === 1 && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      Responsável ST
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(ie)}
                      title="Editar"
                    >
                      <Icons.edit className="w-4 h-4" />
                    </Button>
                    {ie.ativo === 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ie.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Desativar"
                      >
                        <Icons.trash className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingIE ? 'Editar Inscrição Estadual' : 'Nova Inscrição Estadual'}
        size="lg"
      >
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dados')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dados'
                  ? 'border-planac-500 text-planac-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dados da IE
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-planac-500 text-planac-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configuração Tributária
            </button>
          </nav>
        </div>

        {/* Tab: Dados */}
        {activeTab === 'dados' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="UF"
                value={formData.uf}
                onChange={(v) => setFormData({ ...formData, uf: v })}
                options={UFS_BRASIL.map(uf => ({ value: uf, label: uf }))}
                placeholder="Selecione a UF"
                required
              />
              <Input
                label="Inscrição Estadual"
                placeholder="000.000.000.000"
                value={formData.inscricao_estadual}
                onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo"
                value={formData.tipo}
                onChange={(v) => setFormData({ ...formData, tipo: v as any })}
                options={TIPOS_IE}
              />
              <Select
                label="Indicador IE"
                value={formData.indicador_ie}
                onChange={(v) => setFormData({ ...formData, indicador_ie: v as any })}
                options={INDICADORES_IE}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Situação Cadastral"
                value={formData.situacao_cadastral}
                onChange={(v) => setFormData({ ...formData, situacao_cadastral: v as any })}
                options={SITUACOES_CADASTRAIS}
              />
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="ie-principal"
                  checked={formData.principal}
                  onChange={(e) => setFormData({ ...formData, principal: e.target.checked })}
                  className="w-4 h-4 text-planac-500 border-gray-300 rounded"
                />
                <label htmlFor="ie-principal" className="text-sm font-medium text-gray-700">
                  IE Principal para esta UF
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Data Início"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
              <Input
                label="Data Fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Regime Especial (Número)"
                placeholder="Número do regime especial"
                value={formData.regime_especial}
                onChange={(e) => setFormData({ ...formData, regime_especial: e.target.value })}
              />
              <Input
                label="Descrição do Regime"
                placeholder="Descrição do regime especial"
                value={formData.regime_especial_descricao}
                onChange={(e) => setFormData({ ...formData, regime_especial_descricao: e.target.value })}
              />
            </div>

            <Input
              label="Observações"
              placeholder="Observações sobre esta IE"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>
        )}

        {/* Tab: Config Tributária */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700">
                Configure as alíquotas e regras tributárias específicas para esta Inscrição Estadual.
                Estas configurações serão usadas na emissão de NF-e.
              </p>
            </div>

            <h4 className="font-medium text-gray-900">Alíquotas ICMS</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="ICMS Interno (%)"
                type="number"
                step="0.01"
                placeholder="18.00"
                value={configData.aliquota_icms_interna}
                onChange={(e) => setConfigData({ ...configData, aliquota_icms_interna: e.target.value })}
              />
              <Input
                label="Interestadual Sul/Sudeste (%)"
                type="number"
                step="0.01"
                placeholder="12.00"
                value={configData.aliquota_icms_interestadual_sul_sudeste}
                onChange={(e) => setConfigData({ ...configData, aliquota_icms_interestadual_sul_sudeste: e.target.value })}
              />
              <Input
                label="Interestadual Outros (%)"
                type="number"
                step="0.01"
                placeholder="7.00"
                value={configData.aliquota_icms_interestadual_outros}
                onChange={(e) => setConfigData({ ...configData, aliquota_icms_interestadual_outros: e.target.value })}
              />
            </div>

            <h4 className="font-medium text-gray-900 mt-6">Substituição Tributária</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="responsavel-st"
                  checked={configData.responsavel_st}
                  onChange={(e) => setConfigData({ ...configData, responsavel_st: e.target.checked })}
                  className="w-4 h-4 text-planac-500 border-gray-300 rounded"
                />
                <label htmlFor="responsavel-st" className="text-sm font-medium text-gray-700">
                  Responsável por ST nesta UF
                </label>
              </div>
              <Input
                label="MVA Padrão (%)"
                type="number"
                step="0.01"
                placeholder="40.00"
                value={configData.mva_padrao}
                onChange={(e) => setConfigData({ ...configData, mva_padrao: e.target.value })}
              />
            </div>

            <h4 className="font-medium text-gray-900 mt-6">DIFAL e FCP</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recolhe-difal"
                  checked={configData.recolhe_difal}
                  onChange={(e) => setConfigData({ ...configData, recolhe_difal: e.target.checked })}
                  className="w-4 h-4 text-planac-500 border-gray-300 rounded"
                />
                <label htmlFor="recolhe-difal" className="text-sm font-medium text-gray-700">
                  Recolhe DIFAL nesta UF
                </label>
              </div>
              <Input
                label="Alíquota FCP (%)"
                type="number"
                step="0.01"
                placeholder="2.00"
                value={configData.aliquota_fcp}
                onChange={(e) => setConfigData({ ...configData, aliquota_fcp: e.target.value })}
              />
            </div>

            <h4 className="font-medium text-gray-900 mt-6">CFOPs Padrão</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="CFOP Venda Interna"
                placeholder="5102"
                value={configData.cfop_venda_interna}
                onChange={(e) => setConfigData({ ...configData, cfop_venda_interna: e.target.value })}
              />
              <Input
                label="CFOP Venda Interestadual"
                placeholder="6102"
                value={configData.cfop_venda_interestadual}
                onChange={(e) => setConfigData({ ...configData, cfop_venda_interestadual: e.target.value })}
              />
              <Input
                label="CFOP Devolução"
                placeholder="1202"
                value={configData.cfop_devolucao}
                onChange={(e) => setConfigData({ ...configData, cfop_devolucao: e.target.value })}
              />
            </div>

            <Input
              label="Código Benefício Fiscal (CBENEF)"
              placeholder="SP123456"
              value={configData.codigo_beneficio}
              onChange={(e) => setConfigData({ ...configData, codigo_beneficio: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Informações Complementares para NF-e
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-planac-500 focus:border-planac-500"
                rows={3}
                placeholder="Texto adicional para campo de informações complementares da NF-e"
                value={configData.informacoes_complementares}
                onChange={(e) => setConfigData({ ...configData, informacoes_complementares: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            {editingIE ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default InscricoesEstaduaisPage;
