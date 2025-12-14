// =============================================
// PLANAC ERP - Certificado Digital Upload
// Componente React para upload e gestão
// =============================================

import React, { useState, useCallback, useEffect } from 'react';

// ===== TIPOS =====

interface CertificadoInfo {
  id: number;
  cnpj: string;
  tipo: 'A1' | 'A3';
  nome_arquivo: string;
  serial_number?: string;
  razao_social_certificado?: string;
  issuer?: string;
  validade_inicio?: string;
  validade_fim?: string;
  dias_para_vencer?: number;
  status: 'ativo' | 'expirado' | 'revogado' | 'pendente';
  principal: boolean;
  nuvem_fiscal_sync: boolean;
  uploaded_at: string;
}

interface CertificadoStatus {
  cnpj: string;
  possui_certificado: boolean;
  pode_emitir_nfe: boolean;
  status?: string;
  validade_fim?: string;
  dias_para_vencer?: number;
  sincronizado_nuvem_fiscal?: boolean;
  mensagem: string;
}

interface Props {
  cnpj: string;
  onSuccess?: (certificado: CertificadoInfo) => void;
  onError?: (error: string) => void;
  apiBaseUrl?: string;
}

// ===== COMPONENTE PRINCIPAL =====

export function CertificadoUpload({ cnpj, onSuccess, onError, apiBaseUrl = '/api' }: Props) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [definirPrincipal, setDefinirPrincipal] = useState(true);
  const [sincronizarNuvem, setSincronizarNuvem] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  
  // Status atual
  const [status, setStatus] = useState<CertificadoStatus | null>(null);
  const [certificados, setCertificados] = useState<CertificadoInfo[]>([]);
  const [carregandoStatus, setCarregandoStatus] = useState(true);

  // Carregar status ao montar
  useEffect(() => {
    carregarStatus();
    carregarCertificados();
  }, [cnpj]);

  const carregarStatus = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/certificados/${cnpj}/status`);
      const data = await response.json();
      setStatus(data);
    } catch (e) {
      console.error('Erro ao carregar status:', e);
    } finally {
      setCarregandoStatus(false);
    }
  };

  const carregarCertificados = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/certificados/${cnpj}/todos`);
      const data = await response.json();
      setCertificados(data.data || []);
    } catch (e) {
      console.error('Erro ao carregar certificados:', e);
    }
  };

  // Handler de seleção de arquivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar extensão
      const nome = file.name.toLowerCase();
      if (!nome.endsWith('.pfx') && !nome.endsWith('.p12')) {
        setErro('Selecione um arquivo .pfx ou .p12');
        return;
      }
      
      // Validar tamanho (máx 50KB)
      if (file.size > 50 * 1024) {
        setErro('Arquivo muito grande. Certificados A1 geralmente têm menos de 50KB');
        return;
      }
      
      setArquivo(file);
      setErro(null);
    }
  }, []);

  // Handler de upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!arquivo) {
      setErro('Selecione o arquivo do certificado');
      return;
    }
    
    if (!senha) {
      setErro('Informe a senha do certificado');
      return;
    }

    setCarregando(true);
    setErro(null);
    setSucesso(null);

    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('senha', senha);
      formData.append('principal', definirPrincipal.toString());
      formData.append('sincronizar_nuvem_fiscal', sincronizarNuvem.toString());

      const response = await fetch(`${apiBaseUrl}/certificados/${cnpj}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar certificado');
      }

      setSucesso('Certificado enviado com sucesso!');
      setArquivo(null);
      setSenha('');
      
      // Recarregar dados
      carregarStatus();
      carregarCertificados();
      
      onSuccess?.(data.certificado);
    } catch (error: any) {
      const mensagem = error.message || 'Erro ao enviar certificado';
      setErro(mensagem);
      onError?.(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  // Handler de remoção
  const handleRemover = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este certificado?')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/certificados/${cnpj}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      carregarStatus();
      carregarCertificados();
    } catch (error: any) {
      setErro(error.message);
    }
  };

  // Handler de definir principal
  const handleDefinirPrincipal = async (id: number) => {
    try {
      const response = await fetch(`${apiBaseUrl}/certificados/${cnpj}/${id}/principal`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      carregarStatus();
      carregarCertificados();
    } catch (error: any) {
      setErro(error.message);
    }
  };

  // Renderizar status badge
  const renderStatusBadge = (cert: CertificadoInfo) => {
    const cores: Record<string, string> = {
      ativo: 'bg-green-100 text-green-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      expirado: 'bg-red-100 text-red-800',
      revogado: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cores[cert.status]}`}>
        {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
      </span>
    );
  };

  // Renderizar alerta de vencimento
  const renderAlertaVencimento = () => {
    if (!status?.dias_para_vencer) return null;
    
    if (status.dias_para_vencer <= 7) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">
              URGENTE: Certificado vence em {status.dias_para_vencer} {status.dias_para_vencer === 1 ? 'dia' : 'dias'}!
            </span>
          </div>
          <p className="text-red-700 text-sm mt-2">
            Renove o certificado imediatamente para continuar emitindo notas fiscais.
          </p>
        </div>
      );
    }
    
    if (status.dias_para_vencer <= 30) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 font-medium">
              Certificado vence em {status.dias_para_vencer} dias
            </span>
          </div>
          <p className="text-yellow-700 text-sm mt-2">
            Providencie a renovação do certificado para evitar interrupção na emissão de notas.
          </p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificado Digital</h1>
        <p className="text-gray-600 mt-1">
          Gerencie o certificado digital A1 para emissão de documentos fiscais
        </p>
      </div>

      {/* Alertas */}
      {renderAlertaVencimento()}

      {/* Status Card */}
      {!carregandoStatus && status && (
        <div className={`rounded-lg p-6 mb-6 ${
          status.pode_emitir_nfe 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Status: {status.pode_emitir_nfe ? '✅ Apto para emissão' : '❌ Não pode emitir'}
              </h2>
              <p className="text-gray-600 mt-1">{status.mensagem}</p>
              {status.validade_fim && (
                <p className="text-sm text-gray-500 mt-2">
                  Validade: {new Date(status.validade_fim).toLocaleDateString('pt-BR')}
                  {status.dias_para_vencer && ` (${status.dias_para_vencer} dias restantes)`}
                </p>
              )}
            </div>
            {status.sincronizado_nuvem_fiscal && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                ☁️ Sincronizado
              </span>
            )}
          </div>
        </div>
      )}

      {/* Formulário de Upload */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {status?.possui_certificado ? 'Atualizar Certificado' : 'Enviar Certificado'}
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Arquivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo do Certificado (.pfx ou .p12)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
                ${arquivo ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {arquivo ? (
                    <>
                      <svg className="w-8 h-8 text-green-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-green-600 font-medium">{arquivo.name}</p>
                      <p className="text-xs text-gray-500">{(arquivo.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600">Clique para selecionar ou arraste o arquivo</p>
                      <p className="text-xs text-gray-500">Apenas .pfx ou .p12 (máx 50KB)</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept=".pfx,.p12" onChange={handleFileSelect} />
              </label>
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha do Certificado
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a senha do certificado"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {mostrarSenha ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              A senha é armazenada de forma criptografada e segura
            </p>
          </div>

          {/* Opções */}
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={definirPrincipal}
                onChange={(e) => setDefinirPrincipal(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Definir como certificado principal</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={sincronizarNuvem}
                onChange={(e) => setSincronizarNuvem(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sincronizar com Nuvem Fiscal automaticamente</span>
            </label>
          </div>

          {/* Mensagens */}
          {erro && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              ❌ {erro}
            </div>
          )}
          {sucesso && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
              ✅ {sucesso}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={carregando || !arquivo || !senha}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors
              ${carregando || !arquivo || !senha
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {carregando ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : (
              '📤 Enviar Certificado'
            )}
          </button>
        </form>
      </div>

      {/* Lista de Certificados */}
      {certificados.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificados Cadastrados</h2>
          
          <div className="space-y-4">
            {certificados.map((cert) => (
              <div
                key={cert.id}
                className={`border rounded-lg p-4 ${cert.principal ? 'border-blue-500 bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{cert.nome_arquivo}</span>
                      {cert.principal && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          Principal
                        </span>
                      )}
                      {renderStatusBadge(cert)}
                    </div>
                    
                    {cert.razao_social_certificado && (
                      <p className="text-sm text-gray-600 mt-1">{cert.razao_social_certificado}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      {cert.issuer && <span>📜 {cert.issuer}</span>}
                      {cert.validade_fim && (
                        <span className={cert.dias_para_vencer && cert.dias_para_vencer <= 30 ? 'text-orange-600 font-medium' : ''}>
                          📅 Válido até {new Date(cert.validade_fim).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {cert.nuvem_fiscal_sync && <span>☁️ Sincronizado</span>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {!cert.principal && cert.status === 'ativo' && (
                      <button
                        onClick={() => handleDefinirPrincipal(cert.id)}
                        className="px-3 py-1 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-50"
                      >
                        Definir Principal
                      </button>
                    )}
                    <button
                      onClick={() => handleRemover(cert.id)}
                      className="px-3 py-1 text-sm border border-red-500 text-red-600 rounded hover:bg-red-50"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info de Segurança */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <h3 className="font-medium text-gray-900 mb-2">🔒 Segurança</h3>
        <ul className="space-y-1">
          <li>• O arquivo do certificado é armazenado de forma criptografada</li>
          <li>• A senha é protegida com criptografia AES-256</li>
          <li>• Apenas sua empresa tem acesso ao certificado</li>
          <li>• Conexão segura via HTTPS</li>
        </ul>
      </div>
    </div>
  );
}

export default CertificadoUpload;
