// =============================================
// PLANAC ERP - Configurações Page
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

const sections = [
  { id: 'geral', label: 'Geral', icon: <Icons.settings className="w-5 h-5" /> },
  { id: 'empresa', label: 'Empresa', icon: <Icons.building className="w-5 h-5" /> },
  { id: 'fiscal', label: 'Fiscal', icon: <Icons.document className="w-5 h-5" /> },
  { id: 'email', label: 'E-mail', icon: <Icons.mail className="w-5 h-5" /> },
  { id: 'seguranca', label: 'Segurança', icon: <Icons.lock className="w-5 h-5" /> },
];

export function ConfiguracoesPage() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('geral');
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    // Geral
    nome_sistema: 'PLANAC ERP',
    fuso_horario: 'America/Sao_Paulo',
    formato_data: 'DD/MM/YYYY',
    moeda: 'BRL',
    casas_decimais: '2',
    
    // Fiscal
    ambiente_nfe: 'homologacao',
    serie_nfe: '1',
    serie_nfce: '1',
    
    // E-mail
    smtp_host: '',
    smtp_porta: '587',
    smtp_usuario: '',
    smtp_senha: '',
    smtp_seguranca: 'tls',
    email_remetente: '',
    
    // Segurança
    sessao_timeout: '30',
    tentativas_login: '5',
    senha_minimo: '8',
    senha_expira: '90',
    dois_fatores: false,
  });

  const handleChange = (key: string, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/configuracoes', config);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">Configure os parâmetros do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu lateral */}
        <Card className="lg:col-span-1 h-fit">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-planac-50 text-planac-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Conteúdo */}
        <Card className="lg:col-span-3">
          {/* Geral */}
          {activeSection === 'geral' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Configurações Gerais</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Sistema"
                  value={config.nome_sistema}
                  onChange={(e) => handleChange('nome_sistema', e.target.value)}
                />
                <Select
                  label="Fuso Horário"
                  value={config.fuso_horario}
                  onChange={(v) => handleChange('fuso_horario', v)}
                  options={[
                    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
                    { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
                    { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)' },
                  ]}
                />
                <Select
                  label="Formato de Data"
                  value={config.formato_data}
                  onChange={(v) => handleChange('formato_data', v)}
                  options={[
                    { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA' },
                    { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD' },
                  ]}
                />
                <Select
                  label="Casas Decimais"
                  value={config.casas_decimais}
                  onChange={(v) => handleChange('casas_decimais', v)}
                  options={[
                    { value: '2', label: '2 casas' },
                    { value: '3', label: '3 casas' },
                    { value: '4', label: '4 casas' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Empresa */}
          {activeSection === 'empresa' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Dados da Empresa</h2>
              <p className="text-gray-500">
                Configure os dados da empresa padrão em{' '}
                <a href="/empresas" className="text-planac-600 hover:underline">
                  Cadastro de Empresas
                </a>
              </p>
            </div>
          )}

          {/* Fiscal */}
          {activeSection === 'fiscal' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Configurações Fiscais</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Ambiente NF-e"
                  value={config.ambiente_nfe}
                  onChange={(v) => handleChange('ambiente_nfe', v)}
                  options={[
                    { value: 'homologacao', label: 'Homologação' },
                    { value: 'producao', label: 'Produção' },
                  ]}
                />
                <Input
                  label="Série NF-e"
                  type="number"
                  value={config.serie_nfe}
                  onChange={(e) => handleChange('serie_nfe', e.target.value)}
                />
                <Input
                  label="Série NFC-e"
                  type="number"
                  value={config.serie_nfce}
                  onChange={(e) => handleChange('serie_nfce', e.target.value)}
                />
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex gap-3">
                  <Icons.x className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Certificado Digital</p>
                    <p className="mt-1">O certificado digital deve ser configurado individualmente por empresa.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* E-mail */}
          {activeSection === 'email' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Configurações de E-mail</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Servidor SMTP"
                  placeholder="smtp.exemplo.com"
                  value={config.smtp_host}
                  onChange={(e) => handleChange('smtp_host', e.target.value)}
                />
                <Input
                  label="Porta"
                  type="number"
                  placeholder="587"
                  value={config.smtp_porta}
                  onChange={(e) => handleChange('smtp_porta', e.target.value)}
                />
                <Input
                  label="Usuário"
                  placeholder="usuario@exemplo.com"
                  value={config.smtp_usuario}
                  onChange={(e) => handleChange('smtp_usuario', e.target.value)}
                />
                <Input
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  value={config.smtp_senha}
                  onChange={(e) => handleChange('smtp_senha', e.target.value)}
                />
                <Select
                  label="Segurança"
                  value={config.smtp_seguranca}
                  onChange={(v) => handleChange('smtp_seguranca', v)}
                  options={[
                    { value: 'tls', label: 'TLS' },
                    { value: 'ssl', label: 'SSL' },
                    { value: 'none', label: 'Nenhuma' },
                  ]}
                />
                <Input
                  label="E-mail Remetente"
                  type="email"
                  placeholder="noreply@empresa.com"
                  value={config.email_remetente}
                  onChange={(e) => handleChange('email_remetente', e.target.value)}
                />
              </div>

              <Button variant="secondary">
                Testar Conexão
              </Button>
            </div>
          )}

          {/* Segurança */}
          {activeSection === 'seguranca' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Configurações de Segurança</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Timeout da Sessão (minutos)"
                  type="number"
                  value={config.sessao_timeout}
                  onChange={(e) => handleChange('sessao_timeout', e.target.value)}
                />
                <Input
                  label="Tentativas de Login"
                  type="number"
                  value={config.tentativas_login}
                  onChange={(e) => handleChange('tentativas_login', e.target.value)}
                />
                <Input
                  label="Tamanho Mínimo Senha"
                  type="number"
                  value={config.senha_minimo}
                  onChange={(e) => handleChange('senha_minimo', e.target.value)}
                />
                <Input
                  label="Senha Expira (dias)"
                  type="number"
                  value={config.senha_expira}
                  onChange={(e) => handleChange('senha_expira', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <input
                  type="checkbox"
                  id="dois_fatores"
                  checked={config.dois_fatores as boolean}
                  onChange={(e) => handleChange('dois_fatores', e.target.checked)}
                  className="w-4 h-4 text-planac-500 border-gray-300 rounded"
                />
                <label htmlFor="dois_fatores" className="text-sm font-medium text-gray-700">
                  Exigir autenticação em dois fatores (2FA)
                </label>
              </div>
            </div>
          )}

          {/* Botão Salvar */}
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Icons.check className="w-4 h-4" />}
            >
              Salvar Configurações
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ConfiguracoesPage;
