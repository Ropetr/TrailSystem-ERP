// =============================================
// TRAILSYSTEM ERP - Conta Bancaria Form Page
// Formulario completo com abas para configuracao
// =============================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface ContaBancariaForm {
  // Dados da Conta
  banco_codigo: string;
  agencia: string;
  agencia_digito: string;
  conta: string;
  conta_digito: string;
  tipo_conta: string;
  descricao: string;
  
  // Configuracao
  ambiente: string;
  integracao_ativa: boolean;
  boleto_ativo: boolean;
  pix_ativo: boolean;
  
  // Credenciais OAuth/API
  client_id: string;
  client_secret: string;
  developer_key: string;
  scope: string;
  
  // Boleto
  carteira: string;
  convenio: string;
  codigo_beneficiario: string;
  variacao_carteira: string;
  modalidade_cobranca: string;
  
  // PIX
  chave_pix: string;
  tipo_chave_pix: string;
  
  // Certificados
  certificado_pem: string;
  chave_privada_pem: string;
  certificado_senha: string;
  
  // Webhook
  webhook_url: string;
  webhook_secret: string;
  
  ativo: boolean;
}

interface Banco {
  codigo: string;
  nome: string;
  tem_api: boolean;
  campos_obrigatorios: string[];
  usa_mtls: boolean;
  usa_oauth: boolean;
}

const bancosConfig: Record<string, Banco> = {
  '084': {
    codigo: '084',
    nome: 'Sisprime do Brasil',
    tem_api: true,
    campos_obrigatorios: ['client_id', 'client_secret', 'carteira', 'convenio'],
    usa_mtls: false,
    usa_oauth: false, // Usa JWT HS512
  },
  '756': {
    codigo: '756',
    nome: 'Sicoob',
    tem_api: true,
    campos_obrigatorios: ['client_id', 'client_secret', 'certificado_pem', 'chave_privada_pem'],
    usa_mtls: true,
    usa_oauth: true,
  },
  '001': {
    codigo: '001',
    nome: 'Banco do Brasil',
    tem_api: true,
    campos_obrigatorios: ['client_id', 'client_secret', 'developer_key'],
    usa_mtls: false,
    usa_oauth: true,
  },
  '104': {
    codigo: '104',
    nome: 'Caixa Economica Federal',
    tem_api: true,
    campos_obrigatorios: ['client_id', 'client_secret', 'certificado_pem', 'chave_privada_pem'],
    usa_mtls: true,
    usa_oauth: true,
  },
  '422': {
    codigo: '422',
    nome: 'Banco Safra',
    tem_api: true,
    campos_obrigatorios: ['client_id', 'client_secret', 'certificado_pem', 'chave_privada_pem'],
    usa_mtls: true,
    usa_oauth: true,
  },
};

const bancosDisponiveis = [
  { value: '084', label: '084 - Sisprime do Brasil' },
  { value: '756', label: '756 - Sicoob' },
  { value: '001', label: '001 - Banco do Brasil' },
  { value: '104', label: '104 - Caixa Economica Federal' },
  { value: '422', label: '422 - Banco Safra' },
  { value: '237', label: '237 - Bradesco' },
  { value: '341', label: '341 - Itau' },
  { value: '033', label: '033 - Santander' },
  { value: '748', label: '748 - Sicredi' },
  { value: '077', label: '077 - Banco Inter' },
];

const tiposConta = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Poupanca' },
  { value: 'pagamento', label: 'Conta de Pagamento' },
];

const tiposChavePix = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'aleatoria', label: 'Chave Aleatoria' },
];

const tabs = [
  { id: 'dados', label: 'Dados da Conta', icon: 'building' },
  { id: 'credenciais', label: 'Credenciais API', icon: 'key' },
  { id: 'boleto', label: 'Boleto', icon: 'document' },
  { id: 'pix', label: 'PIX', icon: 'qrcode' },
  { id: 'certificados', label: 'Certificados', icon: 'shield' },
  { id: 'webhook', label: 'Webhook', icon: 'link' },
];

const initialForm: ContaBancariaForm = {
  banco_codigo: '',
  agencia: '',
  agencia_digito: '',
  conta: '',
  conta_digito: '',
  tipo_conta: 'corrente',
  descricao: '',
  ambiente: 'homologacao',
  integracao_ativa: false,
  boleto_ativo: false,
  pix_ativo: false,
  client_id: '',
  client_secret: '',
  developer_key: '',
  scope: '',
  carteira: '',
  convenio: '',
  codigo_beneficiario: '',
  variacao_carteira: '',
  modalidade_cobranca: '',
  chave_pix: '',
  tipo_chave_pix: '',
  certificado_pem: '',
  chave_privada_pem: '',
  certificado_senha: '',
  webhook_url: '',
  webhook_secret: '',
  ativo: true,
};

export function ContaBancariaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  
  const [form, setForm] = useState<ContaBancariaForm>(initialForm);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dados');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const isEditing = !!id;
  const bancoConfig = form.banco_codigo ? bancosConfig[form.banco_codigo] : null;

  useEffect(() => {
    if (id) {
      loadConta();
    }
  }, [id]);

  const loadConta = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: ContaBancariaForm }>(
        `/cadastros/contas-bancarias/${id}`
      );
      if (response.success) {
        setForm(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar conta bancaria');
      navigate('/cadastros/financeiro/contas-bancarias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ContaBancariaForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validacoes basicas
    if (!form.banco_codigo) {
      toast.error('Selecione o banco');
      setActiveTab('dados');
      return;
    }
    if (!form.agencia || !form.conta) {
      toast.error('Preencha agencia e conta');
      setActiveTab('dados');
      return;
    }

    // Validar credenciais se integracao ativa
    if (form.integracao_ativa && bancoConfig) {
      if (!form.client_id) {
        toast.error('Client ID e obrigatorio para integracao');
        setActiveTab('credenciais');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/cadastros/contas-bancarias/${id}`, form);
        toast.success('Conta atualizada com sucesso');
      } else {
        await api.post('/cadastros/contas-bancarias', form);
        toast.success('Conta cadastrada com sucesso');
      }
      navigate('/cadastros/financeiro/contas-bancarias');
    } catch (error) {
      toast.error('Erro ao salvar conta bancaria');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestarConexao = async () => {
    if (!form.client_id) {
      toast.error('Preencha as credenciais antes de testar');
      return;
    }

    setIsTesting(true);
    setConnectionStatus('testing');
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        '/cadastros/contas-bancarias/testar-conexao',
        {
          banco_codigo: form.banco_codigo,
          ambiente: form.ambiente,
          client_id: form.client_id,
          client_secret: form.client_secret,
          developer_key: form.developer_key,
          certificado_pem: form.certificado_pem,
          chave_privada_pem: form.chave_privada_pem,
        }
      );
      if (response.success) {
        setConnectionStatus('success');
        toast.success('Conexao estabelecida com sucesso!');
      } else {
        setConnectionStatus('error');
        toast.error(response.message || 'Falha na conexao');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Erro ao testar conexao');
    } finally {
      setIsTesting(false);
    }
  };

  const toggleShowSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFileUpload = async (field: 'certificado_pem' | 'chave_privada_pem', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleChange(field, content);
      toast.success(`Arquivo ${field === 'certificado_pem' ? 'certificado' : 'chave privada'} carregado`);
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/cadastros/financeiro/contas-bancarias')}>
            <Icons.arrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Conta Bancaria' : 'Nova Conta Bancaria'}
            </h1>
            <p className="text-gray-500">
              {isEditing ? 'Atualize os dados da conta e credenciais' : 'Cadastre uma nova conta bancaria'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/cadastros/financeiro/contas-bancarias')}>
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Icons.check className="w-4 h-4" />}>
            {isEditing ? 'Salvar Alteracoes' : 'Cadastrar Conta'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card padding="none">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Dados da Conta */}
          {activeTab === 'dados' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banco *</label>
                  <Select
                    value={form.banco_codigo}
                    onChange={(v) => handleChange('banco_codigo', v)}
                    options={bancosDisponiveis}
                    placeholder="Selecione o banco"
                  />
                  {bancoConfig && (
                    <div className="mt-2 flex gap-2">
                      {bancoConfig.tem_api && (
                        <Badge variant="success" size="sm">
                          API Disponivel
                        </Badge>
                      )}
                      {bancoConfig.usa_mtls && (
                        <Badge variant="info" size="sm">
                          mTLS
                        </Badge>
                      )}
                      {bancoConfig.usa_oauth && (
                        <Badge variant="info" size="sm">
                          OAuth2
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta *</label>
                  <Select
                    value={form.tipo_conta}
                    onChange={(v) => handleChange('tipo_conta', v)}
                    options={tiposConta}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agencia *</label>
                    <Input
                      value={form.agencia}
                      onChange={(e) => handleChange('agencia', e.target.value)}
                      placeholder="0000"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Digito</label>
                    <Input
                      value={form.agencia_digito}
                      onChange={(e) => handleChange('agencia_digito', e.target.value)}
                      placeholder="0"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conta *</label>
                    <Input
                      value={form.conta}
                      onChange={(e) => handleChange('conta', e.target.value)}
                      placeholder="00000000"
                      maxLength={12}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Digito</label>
                    <Input
                      value={form.conta_digito}
                      onChange={(e) => handleChange('conta_digito', e.target.value)}
                      placeholder="0"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
                  <Input
                    value={form.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    placeholder="Ex: Conta Principal, Conta Boletos, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
                  <Select
                    value={form.ambiente}
                    onChange={(v) => handleChange('ambiente', v)}
                    options={[
                      { value: 'homologacao', label: 'Homologacao (Testes)' },
                      { value: 'producao', label: 'Producao' },
                    ]}
                  />
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.integracao_ativa}
                      onChange={(e) => handleChange('integracao_ativa', e.target.checked)}
                      className="w-4 h-4 text-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Integracao Ativa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.ativo}
                      onChange={(e) => handleChange('ativo', e.target.checked)}
                      className="w-4 h-4 text-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Conta Ativa</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Credenciais API */}
          {activeTab === 'credenciais' && (
            <div className="space-y-6">
              {!bancoConfig?.tem_api && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Icons.x className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-800">Banco sem integracao API</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Este banco ainda nao possui integracao via API disponivel no sistema.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {bancoConfig?.tem_api && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex gap-3">
                                          <Icons.alertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-800">Credenciais do {bancoConfig.nome}</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Obtenha as credenciais no portal de desenvolvedores do banco. As credenciais sao
                          armazenadas de forma segura e criptografada.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client ID {bancoConfig.campos_obrigatorios.includes('client_id') && '*'}
                      </label>
                      <div className="relative">
                        <Input
                          type={showSecrets['client_id'] ? 'text' : 'password'}
                          value={form.client_id}
                          onChange={(e) => handleChange('client_id', e.target.value)}
                          placeholder="Seu Client ID"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowSecret('client_id')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSecrets['client_id'] ? (
                            <Icons.eyeOff className="w-4 h-4" />
                          ) : (
                            <Icons.eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Secret {bancoConfig.campos_obrigatorios.includes('client_secret') && '*'}
                      </label>
                      <div className="relative">
                        <Input
                          type={showSecrets['client_secret'] ? 'text' : 'password'}
                          value={form.client_secret}
                          onChange={(e) => handleChange('client_secret', e.target.value)}
                          placeholder="Seu Client Secret"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowSecret('client_secret')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSecrets['client_secret'] ? (
                            <Icons.eyeOff className="w-4 h-4" />
                          ) : (
                            <Icons.eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {form.banco_codigo === '001' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Developer Application Key *
                        </label>
                        <div className="relative">
                          <Input
                            type={showSecrets['developer_key'] ? 'text' : 'password'}
                            value={form.developer_key}
                            onChange={(e) => handleChange('developer_key', e.target.value)}
                            placeholder="Chave do desenvolvedor BB"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('developer_key')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSecrets['developer_key'] ? (
                              <Icons.eyeOff className="w-4 h-4" />
                            ) : (
                              <Icons.eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scopes (opcional)</label>
                      <Input
                        value={form.scope}
                        onChange={(e) => handleChange('scope', e.target.value)}
                        placeholder="Ex: cobranca.boletos-requisicao"
                      />
                    </div>
                  </div>

                  {/* Testar Conexao */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                        <Button
                                          variant="secondary"
                                          onClick={handleTestarConexao}
                                          isLoading={isTesting}
                                          leftIcon={<Icons.check className="w-4 h-4" />}
                                        >
                                          Testar Conexao
                                        </Button>
                    {connectionStatus === 'success' && (
                      <Badge variant="success">Conexao OK</Badge>
                    )}
                    {connectionStatus === 'error' && (
                      <Badge variant="danger">Falha na Conexao</Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Boleto */}
          {activeTab === 'boleto' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.boleto_ativo}
                    onChange={(e) => handleChange('boleto_ativo', e.target.checked)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Habilitar emissao de boletos</span>
                </label>
              </div>

              {form.boleto_ativo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carteira *</label>
                    <Input
                      value={form.carteira}
                      onChange={(e) => handleChange('carteira', e.target.value)}
                      placeholder="Ex: 17, 09, 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Convenio / Codigo Cedente</label>
                    <Input
                      value={form.convenio}
                      onChange={(e) => handleChange('convenio', e.target.value)}
                      placeholder="Numero do convenio"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Codigo Beneficiario</label>
                    <Input
                      value={form.codigo_beneficiario}
                      onChange={(e) => handleChange('codigo_beneficiario', e.target.value)}
                      placeholder="Codigo do beneficiario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variacao Carteira</label>
                    <Input
                      value={form.variacao_carteira}
                      onChange={(e) => handleChange('variacao_carteira', e.target.value)}
                      placeholder="Ex: 019"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade Cobranca</label>
                    <Select
                      value={form.modalidade_cobranca}
                      onChange={(v) => handleChange('modalidade_cobranca', v)}
                      options={[
                        { value: '', label: 'Selecione' },
                        { value: 'simples', label: 'Simples' },
                        { value: 'vinculada', label: 'Vinculada' },
                        { value: 'caucionada', label: 'Caucionada' },
                        { value: 'descontada', label: 'Descontada' },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: PIX */}
          {activeTab === 'pix' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.pix_ativo}
                    onChange={(e) => handleChange('pix_ativo', e.target.checked)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Habilitar recebimento via PIX</span>
                </label>
              </div>

              {form.pix_ativo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Chave PIX *</label>
                    <Select
                      value={form.tipo_chave_pix}
                      onChange={(v) => handleChange('tipo_chave_pix', v)}
                      options={tiposChavePix}
                      placeholder="Selecione o tipo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX *</label>
                    <Input
                      value={form.chave_pix}
                      onChange={(e) => handleChange('chave_pix', e.target.value)}
                      placeholder={
                        form.tipo_chave_pix === 'cpf'
                          ? '000.000.000-00'
                          : form.tipo_chave_pix === 'cnpj'
                          ? '00.000.000/0000-00'
                          : form.tipo_chave_pix === 'email'
                          ? 'email@empresa.com'
                          : form.tipo_chave_pix === 'telefone'
                          ? '+5511999999999'
                          : 'Chave aleatoria'
                      }
                    />
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-600">
                  <strong>PIX no Boleto:</strong> Quando habilitado, os boletos emitidos incluirao automaticamente
                  um QR Code PIX para pagamento. O cliente pode escolher pagar via boleto ou PIX.
                </p>
              </div>
            </div>
          )}

          {/* Tab: Certificados */}
          {activeTab === 'certificados' && (
            <div className="space-y-6">
              {!bancoConfig?.usa_mtls && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-600">
                    Este banco nao requer certificado mTLS para autenticacao.
                  </p>
                </div>
              )}

              {bancoConfig?.usa_mtls && (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <Icons.shield className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-800">Certificado Digital Obrigatorio</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          O {bancoConfig.nome} exige certificado digital para autenticacao mTLS. Faca upload do
                          certificado em formato PEM e da chave privada.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certificado (PEM) *
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept=".pem,.crt,.cer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('certificado_pem', file);
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                        {form.certificado_pem && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Icons.check className="w-4 h-4" />
                            Certificado carregado
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chave Privada (PEM) *
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept=".pem,.key"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('chave_privada_pem', file);
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                        {form.chave_privada_pem && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Icons.check className="w-4 h-4" />
                            Chave privada carregada
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha do Certificado (se houver)
                      </label>
                      <Input
                        type="password"
                        value={form.certificado_senha}
                        onChange={(e) => handleChange('certificado_senha', e.target.value)}
                        placeholder="Senha para descriptografar a chave"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Webhook */}
          {activeTab === 'webhook' && (
            <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex gap-3">
                                <Icons.alertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-blue-800">Configuracao de Webhook</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Configure a URL de webhook no portal do banco para receber notificacoes automaticas de
                      pagamentos, liquidacoes e alteracoes de status.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL do Webhook (sua URL)</label>
                  <div className="flex gap-2">
                    <Input
                      value={form.webhook_url || `https://api.seudominio.com/webhooks/${form.banco_codigo || 'banco'}`}
                      onChange={(e) => handleChange('webhook_url', e.target.value)}
                      placeholder="https://api.seudominio.com/webhooks/banco"
                      readOnly
                      className="bg-gray-50"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          form.webhook_url || `https://api.seudominio.com/webhooks/${form.banco_codigo || 'banco'}`
                        );
                        toast.success('URL copiada!');
                      }}
                    >
                      <Icons.document className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure esta URL no portal do banco para receber notificacoes
                  </p>
                </div>

                <div className="md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secret do Webhook (para validacao)
                  </label>
                  <div className="relative">
                    <Input
                      type={showSecrets['webhook_secret'] ? 'text' : 'password'}
                      value={form.webhook_secret}
                      onChange={(e) => handleChange('webhook_secret', e.target.value)}
                      placeholder="Secret para validar assinatura"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret('webhook_secret')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets['webhook_secret'] ? (
                        <Icons.eyeOff className="w-4 h-4" />
                      ) : (
                        <Icons.eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instrucoes por banco */}
              {form.banco_codigo && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="font-medium text-gray-800 mb-2">
                    Instrucoes para {bancosConfig[form.banco_codigo]?.nome || 'o banco'}:
                  </p>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                    <li>Acesse o portal de desenvolvedores do banco</li>
                    <li>Localize a secao de Webhooks ou Notificacoes</li>
                    <li>Cadastre a URL acima como endpoint de notificacao</li>
                    <li>Copie o secret gerado e cole no campo acima</li>
                    <li>Ative as notificacoes desejadas (pagamento, liquidacao, etc.)</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ContaBancariaFormPage;
