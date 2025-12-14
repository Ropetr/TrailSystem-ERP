// =============================================
// PLANAC ERP - Configurações Fiscais
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface ConfigFiscal {
  // Certificado Digital
  certificado_tipo: 'A1' | 'A3';
  certificado_validade?: string;
  certificado_cnpj?: string;
  certificado_razao_social?: string;
  
  // Ambiente
  ambiente: 'homologacao' | 'producao';
  
  // Série e Numeração
  nfe_serie: number;
  nfe_proximo_numero: number;
  nfce_serie: number;
  nfce_proximo_numero: number;
  
  // CSC (Código de Segurança do Contribuinte) para NFC-e
  csc_id?: string;
  csc_token?: string;
  
  // Configurações de Impressão
  impressora_nfce?: string;
  modelo_danfe: 'retrato' | 'paisagem';
  
  // Integração Nuvem Fiscal
  nuvem_fiscal_client_id?: string;
  nuvem_fiscal_status: 'conectado' | 'desconectado' | 'erro';
}

const regimeTributarioOptions = [
  { value: '1', label: '1 - Simples Nacional' },
  { value: '2', label: '2 - Simples Nacional – Excesso de Sublimite de Receita Bruta' },
  { value: '3', label: '3 - Regime Normal' },
];

export function ConfigFiscalPage() {
  const toast = useToast();
  const [config, setConfig] = useState<ConfigFiscal>({
    certificado_tipo: 'A1',
    ambiente: 'homologacao',
    nfe_serie: 1,
    nfe_proximo_numero: 1,
    nfce_serie: 1,
    nfce_proximo_numero: 1,
    modelo_danfe: 'retrato',
    nuvem_fiscal_status: 'desconectado',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'certificado' | 'ambiente' | 'numeracao' | 'nfce' | 'integracao'>('certificado');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await api.get<{ success: boolean; data: ConfigFiscal }>('/fiscal/config');
      if (response.success) {
        setConfig(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar configurações fiscais');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvar = async () => {
    setIsSaving(true);
    try {
      await api.put('/fiscal/config', config);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadCertificado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('certificado', file);

    try {
      const response = await api.post<{ success: boolean; data: any }>('/fiscal/certificado/upload', formData);
      if (response.success) {
        setConfig({
          ...config,
          certificado_validade: response.data.validade,
          certificado_cnpj: response.data.cnpj,
          certificado_razao_social: response.data.razao_social,
        });
        toast.success('Certificado carregado com sucesso');
      }
    } catch (error) {
      toast.error('Erro ao carregar certificado');
    }
  };

  const handleTestarConexao = async () => {
    try {
      const response = await api.post<{ success: boolean; data: any }>('/fiscal/nuvem-fiscal/testar');
      if (response.success) {
        setConfig({ ...config, nuvem_fiscal_status: 'conectado' });
        toast.success('Conexão com Nuvem Fiscal estabelecida!');
      }
    } catch (error) {
      setConfig({ ...config, nuvem_fiscal_status: 'erro' });
      toast.error('Erro ao conectar com Nuvem Fiscal');
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const tabs = [
    { id: 'certificado' as const, label: 'Certificado Digital', icon: Icons.key },
    { id: 'ambiente' as const, label: 'Ambiente', icon: Icons.settings },
    { id: 'numeracao' as const, label: 'Numeração', icon: Icons.document },
    { id: 'nfce' as const, label: 'NFC-e', icon: Icons.document },
    { id: 'integracao' as const, label: 'Integração', icon: Icons.settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-planac-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações Fiscais</h1>
          <p className="text-gray-500">Configure certificado, ambiente e numeração fiscal</p>
        </div>
        <Button onClick={handleSalvar} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-planac-500 text-planac-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Aba Certificado Digital */}
      {activeTab === 'certificado' && (
        <Card>
          <h3 className="text-lg font-medium mb-6">Certificado Digital</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Tipo de Certificado"
                value={config.certificado_tipo}
                onChange={(v) => setConfig({ ...config, certificado_tipo: v as 'A1' | 'A3' })}
                options={[
                  { value: 'A1', label: 'A1 - Arquivo (PFX)' },
                  { value: 'A3', label: 'A3 - Token/Smartcard' },
                ]}
              />
              
              {config.certificado_tipo === 'A1' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arquivo do Certificado (.pfx)
                  </label>
                  <input
                    type="file"
                    accept=".pfx,.p12"
                    onChange={handleUploadCertificado}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-planac-50 file:text-planac-700 hover:file:bg-planac-100"
                  />
                </div>
              )}
            </div>
            
            {config.certificado_cnpj && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icons.check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Certificado Configurado</p>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-green-600">CNPJ:</span>
                        <span className="ml-2 text-green-800">{config.certificado_cnpj}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Validade:</span>
                        <span className="ml-2 text-green-800">{formatDate(config.certificado_validade)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-green-600">Razão Social:</span>
                        <span className="ml-2 text-green-800">{config.certificado_razao_social}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {config.certificado_tipo === 'A1' && (
              <Input
                label="Senha do Certificado"
                type="password"
                placeholder="Digite a senha do certificado"
              />
            )}
          </div>
        </Card>
      )}

      {/* Aba Ambiente */}
      {activeTab === 'ambiente' && (
        <Card>
          <h3 className="text-lg font-medium mb-6">Ambiente de Emissão</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setConfig({ ...config, ambiente: 'homologacao' })}
                className={`p-6 border-2 rounded-xl text-left transition-all ${
                  config.ambiente === 'homologacao'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    config.ambiente === 'homologacao' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                  }`}>
                    {config.ambiente === 'homologacao' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                  <Badge variant="warning">Homologação</Badge>
                </div>
                <p className="text-gray-600 text-sm">
                  Ambiente de testes. Notas não tem valor fiscal. Use para validar a configuração antes de ir para produção.
                </p>
              </button>
              
              <button
                onClick={() => setConfig({ ...config, ambiente: 'producao' })}
                className={`p-6 border-2 rounded-xl text-left transition-all ${
                  config.ambiente === 'producao'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    config.ambiente === 'producao' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                  }`}>
                    {config.ambiente === 'producao' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                  <Badge variant="success">Produção</Badge>
                </div>
                <p className="text-gray-600 text-sm">
                  Ambiente oficial. Notas emitidas tem valor fiscal e são transmitidas para a SEFAZ.
                </p>
              </button>
            </div>
            
            {config.ambiente === 'producao' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icons.eye className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Atenção!</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Em produção, todas as notas emitidas terão valor fiscal. Certifique-se de que todas as configurações estão corretas.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Aba Numeração */}
      {activeTab === 'numeracao' && (
        <Card>
          <h3 className="text-lg font-medium mb-6">Numeração das Notas</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-4">NF-e (Nota Fiscal Eletrônica)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Série"
                    type="number"
                    min={1}
                    value={config.nfe_serie}
                    onChange={(e) => setConfig({ ...config, nfe_serie: parseInt(e.target.value) || 1 })}
                  />
                  <Input
                    label="Próximo Número"
                    type="number"
                    min={1}
                    value={config.nfe_proximo_numero}
                    onChange={(e) => setConfig({ ...config, nfe_proximo_numero: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-4">NFC-e (Nota Fiscal ao Consumidor)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Série"
                    type="number"
                    min={1}
                    value={config.nfce_serie}
                    onChange={(e) => setConfig({ ...config, nfce_serie: parseInt(e.target.value) || 1 })}
                  />
                  <Input
                    label="Próximo Número"
                    type="number"
                    min={1}
                    value={config.nfce_proximo_numero}
                    onChange={(e) => setConfig({ ...config, nfce_proximo_numero: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Importante:</strong> A numeração é sequencial e não pode ser alterada após a emissão de notas. 
                Se precisar inutilizar uma faixa de numeração, use a funcionalidade específica.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Aba NFC-e */}
      {activeTab === 'nfce' && (
        <Card>
          <h3 className="text-lg font-medium mb-6">Configurações NFC-e</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="ID do CSC"
                placeholder="Código de Segurança do Contribuinte"
                value={config.csc_id || ''}
                onChange={(e) => setConfig({ ...config, csc_id: e.target.value })}
              />
              <Input
                label="Token CSC"
                type="password"
                placeholder="Token de segurança"
                value={config.csc_token || ''}
                onChange={(e) => setConfig({ ...config, csc_token: e.target.value })}
              />
            </div>
            
            <div className="bg-gray-50 border rounded-lg p-4">
              <p className="text-gray-700 text-sm">
                O CSC (Código de Segurança do Contribuinte) é obrigatório para emissão de NFC-e. 
                Você pode obtê-lo no portal da SEFAZ do seu estado.
              </p>
            </div>
            
            <Select
              label="Modelo de Impressão DANFE"
              value={config.modelo_danfe}
              onChange={(v) => setConfig({ ...config, modelo_danfe: v as 'retrato' | 'paisagem' })}
              options={[
                { value: 'retrato', label: 'Retrato (Padrão)' },
                { value: 'paisagem', label: 'Paisagem' },
              ]}
            />
          </div>
        </Card>
      )}

      {/* Aba Integração */}
      {activeTab === 'integracao' && (
        <Card>
          <h3 className="text-lg font-medium mb-6">Integração Nuvem Fiscal</h3>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icons.settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Nuvem Fiscal</p>
                <p className="text-gray-500 text-sm">API para emissão de documentos fiscais</p>
              </div>
              <div className="ml-auto">
                <Badge variant={
                  config.nuvem_fiscal_status === 'conectado' ? 'success' :
                  config.nuvem_fiscal_status === 'erro' ? 'danger' : 'default'
                }>
                  {config.nuvem_fiscal_status === 'conectado' ? 'Conectado' :
                   config.nuvem_fiscal_status === 'erro' ? 'Erro' : 'Desconectado'}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Client ID"
                placeholder="ID do cliente Nuvem Fiscal"
                value={config.nuvem_fiscal_client_id || ''}
                onChange={(e) => setConfig({ ...config, nuvem_fiscal_client_id: e.target.value })}
              />
              <Input
                label="Client Secret"
                type="password"
                placeholder="Chave secreta"
              />
            </div>
            
            <Button variant="secondary" onClick={handleTestarConexao}>
              Testar Conexão
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ConfigFiscalPage;
