// =============================================
// PLANAC ERP - Cliente Form Modal Component
// Modal completo para cadastro/edicao de clientes
// Com novas abas: Fiscal, Empresarial, QSA, Pessoal, Credito
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { DocumentoInput } from '../ui/DocumentoInput';
import { DataComparisonPopup } from '../ui/DataComparisonPopup';

// =============================================
// TIPOS
// =============================================

interface Endereco {
  id?: string;
  tipo: 'fiscal' | 'cobranca' | 'entrega';
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  ibge?: string;
  principal: boolean;
  estatisticas?: {
    totalPedidos: number;
    ultimoPedido?: string;
    valorTotal: number;
  };
}

interface Telefone {
  id?: string;
  tipo: 'fixo' | 'celular' | 'whatsapp';
  numero: string;
  principal: boolean;
}

interface Email {
  id?: string;
  email: string;
  principal: boolean;
}

interface Contato {
  id?: string;
  nome: string;
  cargo?: string;
  departamento?: string;
  principal: boolean;
  telefones: Telefone[];
  emails: Email[];
  recebeBoletos: boolean;
  recebeNfe: boolean;
  recebeOrcamentos: boolean;
}

interface Socio {
  nome: string;
  cpf?: string;
  cargo: string;
  dataEntrada?: string;
  participacao?: number;
}

interface ClienteFormData {
  // Dados Gerais
  documento: string;
  tipoDocumento: 'CPF' | 'CNPJ' | null;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  
  // Fiscal/Regime
  indicadorIe: 'contribuinte' | 'isento' | 'nao_contribuinte';
  consumidorFinal: boolean;
  regimeTributario: 'simples' | 'lucro_presumido' | 'lucro_real' | '';
  simplesOptante: boolean;
  simplesDesde?: string;
  
  // Dados Empresariais (PJ)
  cnaePrincipal: string;
  cnaePrincipalDescricao: string;
  naturezaJuridica: string;
  porte: string;
  situacaoCadastral: string;
  dataSituacao?: string;
  capitalSocial?: number;
  dataFundacao?: string;
  
  // QSA/Socios (PJ)
  socios: Socio[];
  
  // Dados Pessoais (PF)
  dataNascimento?: string;
  genero?: string;
  nomeMae?: string;
  
  // Enderecos
  enderecos: Endereco[];
  
  // Contatos
  contatos: Contato[];
  
  // Comercial
  vendedorId?: string;
  tabelaPrecoId?: string;
  condicaoPagamentoId?: string;
  transportadoraId?: string;
  observacoesComerciais?: string;
  
  // Credito/Financeiro
  limiteCredito: number;
  saldoDevedor: number;
  statusCredito: 'liberado' | 'bloqueado' | 'em_analise';
  
  // Tags
  tagIds: string[];
  
  // Metadados
  fonteConsulta?: string;
  dataUltimaConsulta?: string;
}

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClienteFormData) => void;
  cliente?: Partial<ClienteFormData> | null;
  isLoading?: boolean;
}

// =============================================
// ICONES
// =============================================

const Icons = {
  close: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  copy: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  loader: <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  building: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  user: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  document: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  mapPin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  phone: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  shoppingCart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  creditCard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  tag: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
};

// =============================================
// ESTADO INICIAL
// =============================================

const initialFormData: ClienteFormData = {
  documento: '',
  tipoDocumento: null,
  razaoSocial: '',
  nomeFantasia: '',
  inscricaoEstadual: '',
  inscricaoMunicipal: '',
  indicadorIe: 'nao_contribuinte',
  consumidorFinal: true,
  regimeTributario: '',
  simplesOptante: false,
  cnaePrincipal: '',
  cnaePrincipalDescricao: '',
  naturezaJuridica: '',
  porte: '',
  situacaoCadastral: '',
  socios: [],
  enderecos: [{
    tipo: 'fiscal',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    principal: true,
  }],
  contatos: [],
  limiteCredito: 0,
  saldoDevedor: 0,
  statusCredito: 'liberado',
  tagIds: [],
};

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export function ClienteFormModal({
  isOpen,
  onClose,
  onSave,
  cliente,
  isLoading = false,
}: ClienteFormModalProps) {
  const [activeTab, setActiveTab] = useState('dados');
  const [formData, setFormData] = useState<ClienteFormData>(initialFormData);
  const [isConsultando, setIsConsultando] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [dadosConsulta, setDadosConsulta] = useState<Partial<ClienteFormData> | null>(null);

  // Carregar dados do cliente ao abrir
  useEffect(() => {
    if (cliente) {
      setFormData({ ...initialFormData, ...cliente });
    } else {
      setFormData(initialFormData);
    }
    setActiveTab('dados');
  }, [cliente, isOpen]);

  // Atualizar consumidor final automaticamente
  useEffect(() => {
    if (formData.tipoDocumento === 'CPF') {
      setFormData(prev => ({
        ...prev,
        consumidorFinal: true,
        indicadorIe: 'nao_contribuinte',
      }));
    } else if (formData.tipoDocumento === 'CNPJ' && !formData.inscricaoEstadual) {
      setFormData(prev => ({
        ...prev,
        consumidorFinal: true,
        indicadorIe: 'nao_contribuinte',
      }));
    }
  }, [formData.tipoDocumento, formData.inscricaoEstadual]);

  // Handler para mudanca de documento
  const handleDocumentoChange = useCallback((valor: string, tipo: 'CPF' | 'CNPJ' | null) => {
    setFormData(prev => ({
      ...prev,
      documento: valor,
      tipoDocumento: tipo,
    }));
  }, []);

    // Handler para consulta de documento
    const handleConsultar = useCallback(async (_documento: string, tipo: 'CPF' | 'CNPJ') => {
    setIsConsultando(true);
    
    try {
      // Simular consulta API (substituir por chamada real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dados simulados da consulta
      const dadosSimulados: Partial<ClienteFormData> = tipo === 'CNPJ' ? {
        razaoSocial: 'EMPRESA CONSULTADA VIA API LTDA',
        nomeFantasia: 'Empresa Teste',
        inscricaoEstadual: '123456789',
        indicadorIe: 'contribuinte',
        consumidorFinal: false,
        regimeTributario: 'simples',
        simplesOptante: true,
        simplesDesde: '2020-01-01',
        cnaePrincipal: '4751-2/01',
        cnaePrincipalDescricao: 'Comercio varejista especializado de equipamentos e suprimentos de informatica',
        naturezaJuridica: '206-2 - Sociedade Empresaria Limitada',
        porte: 'ME',
        situacaoCadastral: 'ATIVA',
        dataSituacao: '2020-01-15',
        capitalSocial: 100000,
        dataFundacao: '2020-01-01',
        socios: [
          { nome: 'JOAO DA SILVA', cpf: '123.456.789-00', cargo: 'Socio-Administrador', participacao: 50 },
          { nome: 'MARIA SANTOS', cpf: '987.654.321-00', cargo: 'Socio', participacao: 50 },
        ],
        enderecos: [{
          tipo: 'fiscal',
          cep: '87020-000',
          logradouro: 'Avenida Brasil',
          numero: '1000',
          complemento: 'Sala 101',
          bairro: 'Centro',
          cidade: 'Maringa',
          uf: 'PR',
          ibge: '4115200',
          principal: true,
        }],
        fonteConsulta: 'CNPja + CPF.CNPJ',
        dataUltimaConsulta: new Date().toISOString(),
      } : {
        razaoSocial: 'PESSOA FISICA CONSULTADA',
        dataNascimento: '1990-05-15',
        genero: 'M',
        nomeMae: 'MARIA DA SILVA',
        situacaoCadastral: 'REGULAR',
        fonteConsulta: 'CPF.CNPJ',
        dataUltimaConsulta: new Date().toISOString(),
      };

      setDadosConsulta(dadosSimulados);
      
      // Se ja tem dados, mostrar popup de comparacao
      if (formData.razaoSocial) {
        setShowComparison(true);
      } else {
        // Se nao tem dados, aplicar diretamente
        setFormData(prev => ({ ...prev, ...dadosSimulados }));
      }
    } catch (error) {
      console.error('Erro ao consultar documento:', error);
    } finally {
      setIsConsultando(false);
    }
  }, [formData.razaoSocial]);

  // Handler para aplicar campos selecionados da comparacao
  const handleAplicarCampos = useCallback((camposSelecionados: string[]) => {
    if (!dadosConsulta) return;

    setFormData(prev => {
      const novosDados = { ...prev };
      camposSelecionados.forEach(campo => {
        if (campo in dadosConsulta) {
          (novosDados as Record<string, unknown>)[campo] = (dadosConsulta as Record<string, unknown>)[campo];
        }
      });
      return novosDados;
    });
    setShowComparison(false);
    setDadosConsulta(null);
  }, [dadosConsulta]);

  // Handler para adicionar endereco
  const handleAddEndereco = useCallback(() => {
    const tipoNovo = formData.enderecos.length === 0 ? 'fiscal' 
      : formData.enderecos.length === 1 ? 'cobranca' 
      : 'entrega';
    
    setFormData(prev => ({
      ...prev,
      enderecos: [...prev.enderecos, {
        tipo: tipoNovo,
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        principal: false,
      }],
    }));
  }, [formData.enderecos.length]);

  // Handler para remover endereco
  const handleRemoveEndereco = useCallback((index: number) => {
    if (index === 0) return; // Nao pode remover endereco fiscal
    setFormData(prev => ({
      ...prev,
      enderecos: prev.enderecos.filter((_, i) => i !== index),
    }));
  }, []);

  // Handler para duplicar endereco fiscal
  const handleDuplicarFiscal = useCallback(() => {
    const fiscal = formData.enderecos[0];
    if (!fiscal) return;
    
    const tipoNovo = formData.enderecos.length === 1 ? 'cobranca' : 'entrega';
    setFormData(prev => ({
      ...prev,
      enderecos: [...prev.enderecos, {
        ...fiscal,
        id: undefined,
        tipo: tipoNovo,
        principal: false,
      }],
    }));
  }, [formData.enderecos]);

  // Handler para adicionar contato
  const handleAddContato = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      contatos: [...prev.contatos, {
        nome: '',
        principal: prev.contatos.length === 0,
        telefones: [],
        emails: [],
        recebeBoletos: false,
        recebeNfe: false,
        recebeOrcamentos: false,
      }],
    }));
  }, []);

  // Handler para remover contato
  const handleRemoveContato = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      contatos: prev.contatos.filter((_, i) => i !== index),
    }));
  }, []);

  // Handler para salvar
  const handleSave = useCallback(() => {
    onSave(formData);
  }, [formData, onSave]);

  // Tabs disponiveis
  const tabs = [
    { id: 'dados', label: 'Dados Gerais', icon: Icons.document },
    { id: 'fiscal', label: 'Fiscal/Regime', icon: Icons.document, show: true },
    { id: 'empresarial', label: 'Empresarial', icon: Icons.building, show: formData.tipoDocumento === 'CNPJ' },
    { id: 'qsa', label: 'QSA/Socios', icon: Icons.users, show: formData.tipoDocumento === 'CNPJ' },
    { id: 'pessoal', label: 'Dados Pessoais', icon: Icons.user, show: formData.tipoDocumento === 'CPF' },
    { id: 'enderecos', label: 'Enderecos', icon: Icons.mapPin },
    { id: 'contatos', label: 'Contatos', icon: Icons.phone },
    { id: 'comercial', label: 'Comercial', icon: Icons.shoppingCart },
    { id: 'credito', label: 'Credito/Financeiro', icon: Icons.creditCard },
  ].filter(tab => tab.show !== false);

  // Campos para comparacao
  const camposComparacao = dadosConsulta ? [
    { campo: 'razaoSocial', label: 'Razao Social', valorAtual: formData.razaoSocial, valorConsulta: dadosConsulta.razaoSocial, grupo: 'Dados Gerais' },
    { campo: 'nomeFantasia', label: 'Nome Fantasia', valorAtual: formData.nomeFantasia, valorConsulta: dadosConsulta.nomeFantasia, grupo: 'Dados Gerais' },
    { campo: 'inscricaoEstadual', label: 'Inscricao Estadual', valorAtual: formData.inscricaoEstadual, valorConsulta: dadosConsulta.inscricaoEstadual, grupo: 'Fiscal' },
    { campo: 'regimeTributario', label: 'Regime Tributario', valorAtual: formData.regimeTributario, valorConsulta: dadosConsulta.regimeTributario, grupo: 'Fiscal' },
    { campo: 'cnaePrincipal', label: 'CNAE Principal', valorAtual: formData.cnaePrincipal, valorConsulta: dadosConsulta.cnaePrincipal, grupo: 'Empresarial' },
    { campo: 'naturezaJuridica', label: 'Natureza Juridica', valorAtual: formData.naturezaJuridica, valorConsulta: dadosConsulta.naturezaJuridica, grupo: 'Empresarial' },
    { campo: 'porte', label: 'Porte', valorAtual: formData.porte, valorConsulta: dadosConsulta.porte, grupo: 'Empresarial' },
    { campo: 'capitalSocial', label: 'Capital Social', valorAtual: formData.capitalSocial?.toString(), valorConsulta: dadosConsulta.capitalSocial?.toString(), grupo: 'Empresarial' },
  ] : [];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-planac-500 to-planac-600">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {cliente ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <p className="text-sm text-planac-100">
                  {formData.tipoDocumento === 'CPF' ? 'Pessoa Fisica' : 
                   formData.tipoDocumento === 'CNPJ' ? 'Pessoa Juridica' : 
                   'Preencha o documento para iniciar'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                {Icons.close}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 bg-gray-50 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-planac-500 text-planac-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
              
              {/* Tab: Dados Gerais */}
              {activeTab === 'dados' && (
                <div className="space-y-6">
                  {/* Documento */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <DocumentoInput
                        value={formData.documento}
                        onChange={handleDocumentoChange}
                        onConsultar={handleConsultar}
                        isConsultando={isConsultando}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Indicador IE
                      </label>
                      <select
                        value={formData.indicadorIe}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          indicadorIe: e.target.value as 'contribuinte' | 'isento' | 'nao_contribuinte',
                          consumidorFinal: e.target.value !== 'contribuinte',
                        }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      >
                        <option value="contribuinte">Contribuinte</option>
                        <option value="isento">Isento</option>
                        <option value="nao_contribuinte">Nao Contribuinte</option>
                      </select>
                    </div>
                  </div>

                  {/* Razao Social / Nome */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.tipoDocumento === 'CNPJ' ? 'Razao Social' : 'Nome Completo'}
                        <span className="text-planac-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.razaoSocial}
                        onChange={(e) => setFormData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      />
                    </div>
                    {formData.tipoDocumento === 'CNPJ' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome Fantasia
                        </label>
                        <input
                          type="text"
                          value={formData.nomeFantasia}
                          onChange={(e) => setFormData(prev => ({ ...prev, nomeFantasia: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                        />
                      </div>
                    )}
                  </div>

                  {/* IE / IM */}
                  {formData.tipoDocumento === 'CNPJ' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Inscricao Estadual
                        </label>
                        <input
                          type="text"
                          value={formData.inscricaoEstadual}
                          onChange={(e) => setFormData(prev => ({ ...prev, inscricaoEstadual: e.target.value }))}
                          placeholder="ISENTO ou numero"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Inscricao Municipal
                        </label>
                        <input
                          type="text"
                          value={formData.inscricaoMunicipal}
                          onChange={(e) => setFormData(prev => ({ ...prev, inscricaoMunicipal: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.consumidorFinal}
                            onChange={(e) => setFormData(prev => ({ ...prev, consumidorFinal: e.target.checked }))}
                            className="w-4 h-4 text-planac-500 border-gray-300 rounded focus:ring-planac-500"
                          />
                          <span className="text-sm text-gray-700">Consumidor Final</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Info de consulta */}
                  {formData.fonteConsulta && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Dados consultados via <strong>{formData.fonteConsulta}</strong> em{' '}
                        {formData.dataUltimaConsulta ? new Date(formData.dataUltimaConsulta).toLocaleString('pt-BR') : '-'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Fiscal/Regime */}
              {activeTab === 'fiscal' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Regime Tributario
                      </label>
                      <select
                        value={formData.regimeTributario}
                        onChange={(e) => setFormData(prev => ({ ...prev, regimeTributario: e.target.value as ClienteFormData['regimeTributario'] }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      >
                        <option value="">Selecione...</option>
                        <option value="simples">Simples Nacional</option>
                        <option value="lucro_presumido">Lucro Presumido</option>
                        <option value="lucro_real">Lucro Real</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Optante Simples
                      </label>
                      <div className="flex items-center gap-4 h-[42px]">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={formData.simplesOptante}
                            onChange={() => setFormData(prev => ({ ...prev, simplesOptante: true }))}
                            className="w-4 h-4 text-planac-500 border-gray-300 focus:ring-planac-500"
                          />
                          <span className="text-sm text-gray-700">Sim</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={!formData.simplesOptante}
                            onChange={() => setFormData(prev => ({ ...prev, simplesOptante: false }))}
                            className="w-4 h-4 text-planac-500 border-gray-300 focus:ring-planac-500"
                          />
                          <span className="text-sm text-gray-700">Nao</span>
                        </label>
                      </div>
                    </div>
                    {formData.simplesOptante && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Optante Desde
                        </label>
                        <input
                          type="date"
                          value={formData.simplesDesde || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, simplesDesde: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Indicador IE
                      </label>
                      <select
                        value={formData.indicadorIe}
                        onChange={(e) => setFormData(prev => ({ ...prev, indicadorIe: e.target.value as ClienteFormData['indicadorIe'] }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      >
                        <option value="contribuinte">1 - Contribuinte ICMS</option>
                        <option value="isento">2 - Contribuinte Isento</option>
                        <option value="nao_contribuinte">9 - Nao Contribuinte</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.consumidorFinal}
                          onChange={(e) => setFormData(prev => ({ ...prev, consumidorFinal: e.target.checked }))}
                          className="w-4 h-4 text-planac-500 border-gray-300 rounded focus:ring-planac-500"
                        />
                        <span className="text-sm text-gray-700">Consumidor Final</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Empresarial (PJ) */}
              {activeTab === 'empresarial' && formData.tipoDocumento === 'CNPJ' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CNAE Principal
                      </label>
                      <input
                        type="text"
                        value={formData.cnaePrincipal}
                        onChange={(e) => setFormData(prev => ({ ...prev, cnaePrincipal: e.target.value }))}
                        placeholder="0000-0/00"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descricao CNAE
                      </label>
                      <input
                        type="text"
                        value={formData.cnaePrincipalDescricao}
                        onChange={(e) => setFormData(prev => ({ ...prev, cnaePrincipalDescricao: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Natureza Juridica
                      </label>
                      <input
                        type="text"
                        value={formData.naturezaJuridica}
                        onChange={(e) => setFormData(prev => ({ ...prev, naturezaJuridica: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Porte
                      </label>
                      <select
                        value={formData.porte}
                        onChange={(e) => setFormData(prev => ({ ...prev, porte: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      >
                        <option value="">Selecione...</option>
                        <option value="MEI">MEI</option>
                        <option value="ME">ME - Microempresa</option>
                        <option value="EPP">EPP - Empresa de Pequeno Porte</option>
                        <option value="MEDIO">Medio Porte</option>
                        <option value="GRANDE">Grande Porte</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situacao Cadastral
                      </label>
                      <input
                        type="text"
                        value={formData.situacaoCadastral}
                        readOnly
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capital Social
                      </label>
                      <input
                        type="number"
                        value={formData.capitalSocial || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, capitalSocial: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Fundacao
                      </label>
                      <input
                        type="date"
                        value={formData.dataFundacao || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, dataFundacao: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: QSA/Socios (PJ) */}
              {activeTab === 'qsa' && formData.tipoDocumento === 'CNPJ' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {formData.socios.length} socio(s) cadastrado(s)
                    </p>
                  </div>

                  {formData.socios.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nenhum socio cadastrado.</p>
                      <p className="text-sm mt-1">Consulte o CNPJ para importar os socios automaticamente.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.socios.map((socio, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{socio.nome}</p>
                              <p className="text-sm text-gray-500">{socio.cargo}</p>
                            </div>
                            <div className="text-right">
                              {socio.cpf && (
                                <p className="text-sm text-gray-600">CPF: {socio.cpf}</p>
                              )}
                              {socio.participacao !== undefined && (
                                <p className="text-sm text-gray-500">{socio.participacao}% de participacao</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Dados Pessoais (PF) */}
              {activeTab === 'pessoal' && formData.tipoDocumento === 'CPF' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={formData.dataNascimento || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, dataNascimento: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Genero
                      </label>
                      <select
                        value={formData.genero || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, genero: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      >
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="O">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situacao Cadastral
                      </label>
                      <input
                        type="text"
                        value={formData.situacaoCadastral}
                        readOnly
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Mae
                    </label>
                    <input
                      type="text"
                      value={formData.nomeMae || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomeMae: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Tab: Enderecos */}
              {activeTab === 'enderecos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      1o = Fiscal | 2o = Cobranca | 3o+ = Entrega
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDuplicarFiscal}
                        className="text-planac-500 hover:text-planac-600 hover:bg-planac-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                      >
                        {Icons.copy}
                        <span>Duplicar Fiscal</span>
                      </button>
                      <button
                        onClick={handleAddEndereco}
                        className="text-planac-500 hover:text-planac-600 hover:bg-planac-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                      >
                        {Icons.plus}
                        <span>Novo Endereco</span>
                      </button>
                    </div>
                  </div>

                  {formData.enderecos.map((endereco, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            endereco.tipo === 'fiscal' ? 'bg-blue-100 text-blue-700' :
                            endereco.tipo === 'cobranca' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {endereco.tipo === 'fiscal' ? 'Fiscal' :
                             endereco.tipo === 'cobranca' ? 'Cobranca' : 'Entrega'}
                          </span>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              Principal
                            </span>
                          )}
                        </div>
                        {index > 0 && (
                          <button
                            onClick={() => handleRemoveEndereco(index)}
                            className="text-red-500 hover:text-red-600 p-1 rounded transition-colors"
                          >
                            {Icons.trash}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">CEP</label>
                          <input
                            type="text"
                            value={endereco.cep}
                            onChange={(e) => {
                              const novosEnderecos = [...formData.enderecos];
                              novosEnderecos[index] = { ...novosEnderecos[index], cep: e.target.value };
                              setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Logradouro</label>
                          <input
                            type="text"
                            value={endereco.logradouro}
                            onChange={(e) => {
                              const novosEnderecos = [...formData.enderecos];
                              novosEnderecos[index] = { ...novosEnderecos[index], logradouro: e.target.value };
                              setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Numero</label>
                          <input
                            type="text"
                            value={endereco.numero}
                            onChange={(e) => {
                              const novosEnderecos = [...formData.enderecos];
                              novosEnderecos[index] = { ...novosEnderecos[index], numero: e.target.value };
                              setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Complemento</label>
                          <input
                            type="text"
                            value={endereco.complemento}
                            onChange={(e) => {
                              const novosEnderecos = [...formData.enderecos];
                              novosEnderecos[index] = { ...novosEnderecos[index], complemento: e.target.value };
                              setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Bairro</label>
                          <input
                            type="text"
                            value={endereco.bairro}
                            onChange={(e) => {
                              const novosEnderecos = [...formData.enderecos];
                              novosEnderecos[index] = { ...novosEnderecos[index], bairro: e.target.value };
                              setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                          <input
                            type="text"
                            value={endereco.cidade}
                            onChange={(e) => {
                              const novosEnderecos = [...formData.enderecos];
                              novosEnderecos[index] = { ...novosEnderecos[index], cidade: e.target.value };
                              setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">UF</label>
                          <input
                            type="text"
                            value={endereco.uf}
                            onChange={(e) => {
                              const novosEnderecos = [...formData.enderecos];
                              novosEnderecos[index] = { ...novosEnderecos[index], uf: e.target.value.toUpperCase() };
                              setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
                            }}
                            maxLength={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                          />
                        </div>
                      </div>

                      {/* Estatisticas do endereco */}
                      {endereco.estatisticas && endereco.estatisticas.totalPedidos > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{endereco.estatisticas.totalPedidos} pedido(s)</span>
                            {endereco.estatisticas.ultimoPedido && (
                              <span>Ultimo: {new Date(endereco.estatisticas.ultimoPedido).toLocaleDateString('pt-BR')}</span>
                            )}
                            <span>Total: R$ {endereco.estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Contatos */}
              {activeTab === 'contatos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {formData.contatos.length} contato(s) cadastrado(s)
                    </p>
                    <button
                      onClick={handleAddContato}
                      className="text-planac-500 hover:text-planac-600 hover:bg-planac-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      {Icons.plus}
                      <span>Novo Contato</span>
                    </button>
                  </div>

                  {formData.contatos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nenhum contato cadastrado.</p>
                      <p className="text-sm mt-1">Clique em "Novo Contato" para adicionar.</p>
                    </div>
                  ) : (
                    formData.contatos.map((contato, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={contato.nome}
                              onChange={(e) => {
                                const novosContatos = [...formData.contatos];
                                novosContatos[index] = { ...novosContatos[index], nome: e.target.value };
                                setFormData(prev => ({ ...prev, contatos: novosContatos }));
                              }}
                              placeholder="Nome do contato"
                              className="font-medium text-gray-900 border-0 border-b border-transparent hover:border-gray-300 focus:border-planac-500 focus:outline-none px-0 py-1"
                            />
                            {contato.principal && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Principal</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveContato(index)}
                            className="text-red-500 hover:text-red-600 p-1 rounded transition-colors"
                          >
                            {Icons.trash}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Cargo</label>
                            <input
                              type="text"
                              value={contato.cargo || ''}
                              onChange={(e) => {
                                const novosContatos = [...formData.contatos];
                                novosContatos[index] = { ...novosContatos[index], cargo: e.target.value };
                                setFormData(prev => ({ ...prev, contatos: novosContatos }));
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Departamento</label>
                            <select
                              value={contato.departamento || ''}
                              onChange={(e) => {
                                const novosContatos = [...formData.contatos];
                                novosContatos[index] = { ...novosContatos[index], departamento: e.target.value };
                                setFormData(prev => ({ ...prev, contatos: novosContatos }));
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                            >
                              <option value="">Selecione...</option>
                              <option value="financeiro">Financeiro</option>
                              <option value="compras">Compras</option>
                              <option value="comercial">Comercial</option>
                              <option value="diretoria">Diretoria</option>
                              <option value="logistica">Logistica</option>
                              <option value="outro">Outro</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Recebe notificacoes:</p>
                          <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contato.recebeBoletos}
                                onChange={(e) => {
                                  const novosContatos = [...formData.contatos];
                                  novosContatos[index] = { ...novosContatos[index], recebeBoletos: e.target.checked };
                                  setFormData(prev => ({ ...prev, contatos: novosContatos }));
                                }}
                                className="w-4 h-4 text-planac-500 border-gray-300 rounded focus:ring-planac-500"
                              />
                              <span>Boletos</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contato.recebeNfe}
                                onChange={(e) => {
                                  const novosContatos = [...formData.contatos];
                                  novosContatos[index] = { ...novosContatos[index], recebeNfe: e.target.checked };
                                  setFormData(prev => ({ ...prev, contatos: novosContatos }));
                                }}
                                className="w-4 h-4 text-planac-500 border-gray-300 rounded focus:ring-planac-500"
                              />
                              <span>NF-e</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contato.recebeOrcamentos}
                                onChange={(e) => {
                                  const novosContatos = [...formData.contatos];
                                  novosContatos[index] = { ...novosContatos[index], recebeOrcamentos: e.target.checked };
                                  setFormData(prev => ({ ...prev, contatos: novosContatos }));
                                }}
                                className="w-4 h-4 text-planac-500 border-gray-300 rounded focus:ring-planac-500"
                              />
                              <span>Orcamentos</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Comercial */}
              {activeTab === 'comercial' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendedor
                      </label>
                      <select
                        value={formData.vendedorId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, vendedorId: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      >
                        <option value="">Selecione...</option>
                        <option value="1">Carlos Silva</option>
                        <option value="2">Maria Santos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tabela de Preco
                      </label>
                      <select
                        value={formData.tabelaPrecoId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, tabelaPrecoId: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      >
                        <option value="">Selecione...</option>
                        <option value="1">Tabela Padrao</option>
                        <option value="2">Atacado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condicao de Pagamento
                      </label>
                      <select
                        value={formData.condicaoPagamentoId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, condicaoPagamentoId: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      >
                        <option value="">Selecione...</option>
                        <option value="1">A Vista</option>
                        <option value="2">30/60/90</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transportadora Preferencial
                      </label>
                      <select
                        value={formData.transportadoraId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, transportadoraId: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      >
                        <option value="">Selecione...</option>
                        <option value="1">Transportadora A</option>
                        <option value="2">Transportadora B</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observacoes Comerciais
                    </label>
                    <textarea
                      value={formData.observacoesComerciais || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoesComerciais: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Tab: Credito/Financeiro */}
              {activeTab === 'credito' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Limite de Credito
                      </label>
                      <input
                        type="number"
                        value={formData.limiteCredito}
                        onChange={(e) => setFormData(prev => ({ ...prev, limiteCredito: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Saldo Devedor
                      </label>
                      <input
                        type="number"
                        value={formData.saldoDevedor}
                        readOnly
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status de Credito
                      </label>
                      <select
                        value={formData.statusCredito}
                        onChange={(e) => setFormData(prev => ({ ...prev, statusCredito: e.target.value as ClienteFormData['statusCredito'] }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                      >
                        <option value="liberado">Liberado</option>
                        <option value="bloqueado">Bloqueado</option>
                        <option value="em_analise">Em Analise</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Resumo Financeiro</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Credito Disponivel</p>
                        <p className="text-lg font-semibold text-green-600">
                          R$ {(formData.limiteCredito - formData.saldoDevedor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Limite Total</p>
                        <p className="text-lg font-semibold text-gray-900">
                          R$ {formData.limiteCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Utilizacao</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formData.limiteCredito > 0 
                            ? ((formData.saldoDevedor / formData.limiteCredito) * 100).toFixed(1) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !formData.documento || !formData.razaoSocial}
                className="px-4 py-2 text-sm font-medium text-white bg-planac-500 rounded-lg hover:bg-planac-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading && Icons.loader}
                {cliente ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popup de comparacao */}
      <DataComparisonPopup
        isOpen={showComparison}
        onClose={() => {
          setShowComparison(false);
          setDadosConsulta(null);
        }}
        onAplicar={handleAplicarCampos}
        campos={camposComparacao}
        titulo="Dados Encontrados na Consulta"
      />
    </>
  );
}

export default ClienteFormModal;
