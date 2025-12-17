// =============================================
// PLANAC ERP - ClienteSelect
// Componente padrão para seleção de cliente
// Criado: 2025-12-17
// =============================================
// 
// COMPORTAMENTO:
// - Clique na SETINHA (▼) → Abre dropdown com presets
// - Clique no CAMPO → Ativa modo busca na API
// - Digite 2+ caracteres → Busca automática com debounce
//
// USO:
// <ClienteSelect
//   value={clienteId}
//   onChange={(cliente) => setCliente(cliente)}
//   presets={clientesRecentes}  // opcional
//   placeholder="Selecione..."
// />
// =============================================

import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import api from '@/services/api';

// =============================================
// INTERFACES
// =============================================
export interface ClienteOption {
  id: string;
  nome: string;
  razao_social?: string;
  cpf_cnpj?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  ie_rg?: string;
  tipo?: 'PF' | 'PJ';
  codigo?: string;
}

export interface ClienteSelectProps {
  /** ID do cliente selecionado */
  value: string;
  /** Callback quando cliente é selecionado - recebe objeto completo */
  onChange: (cliente: ClienteOption | null) => void;
  /** Lista de clientes pré-definidos (ex: clientes dos orçamentos) */
  presets?: ClienteOption[];
  /** Texto do placeholder */
  placeholder?: string;
  /** Label do campo */
  label?: string;
  /** Mensagem de erro */
  error?: string;
  /** Se está desabilitado */
  disabled?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Texto do header dos presets */
  presetsHeader?: string;
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export function ClienteSelect({
  value,
  onChange,
  presets = [],
  placeholder = 'Selecione o cliente...',
  label,
  error,
  disabled = false,
  className = '',
  presetsHeader = 'Clientes sugeridos',
}: ClienteSelectProps) {
  // Estados
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ClienteOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null);

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // =============================================
  // EFEITOS
  // =============================================

  // Encontrar cliente selecionado nos presets ou resultados
  useEffect(() => {
    if (value) {
      const found = presets.find(c => c.id === value) || 
                   searchResults.find(c => c.id === value);
      if (found) {
        setSelectedCliente(found);
      }
    } else {
      setSelectedCliente(null);
    }
  }, [value, presets, searchResults]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSearchMode(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce na busca
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (isSearchMode && searchTerm && searchTerm.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchClientes(searchTerm);
      }, 300);
    } else if (!searchTerm) {
      setSearchResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, isSearchMode]);

  // Focar no input quando entrar em modo busca
  useEffect(() => {
    if (isSearchMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchMode]);

  // =============================================
  // FUNÇÕES
  // =============================================

  // Buscar clientes na API
  const searchClientes = async (termo: string) => {
    setIsSearching(true);
    try {
      const response = await api.get<{ success: boolean; data: any[] }>(
        `/clientes?busca=${encodeURIComponent(termo)}&limit=10`
      );
      if (response.success && response.data) {
        const clientes = response.data.map((c: any) => ({
          id: c.id,
          nome: c.nome || c.razao_social,
          razao_social: c.razao_social,
          cpf_cnpj: c.cpf_cnpj,
          telefone: c.telefone,
          celular: c.celular,
          email: c.email,
          logradouro: c.logradouro,
          numero: c.numero,
          bairro: c.bairro,
          cidade: c.cidade,
          uf: c.uf,
          cep: c.cep,
          ie_rg: c.ie_rg,
          tipo: c.tipo,
          codigo: c.codigo,
        }));
        setSearchResults(clientes);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputClick = () => {
    if (disabled) return;
    setIsSearchMode(true);
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (isSearchMode) {
      setIsSearchMode(false);
      setSearchTerm('');
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleSelectCliente = (cliente: ClienteOption) => {
    setSelectedCliente(cliente);
    onChange(cliente);
    setIsOpen(false);
    setIsSearchMode(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCliente(null);
    onChange(null);
  };

  // Lista a exibir
  const displayList = isSearchMode && searchTerm.length >= 2 ? searchResults : presets;

  // Nome para exibição
  const displayName = selectedCliente 
    ? (selectedCliente.razao_social || selectedCliente.nome)
    : '';

  // =============================================
  // RENDER
  // =============================================
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Campo principal */}
      <div 
        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm flex items-center justify-between transition-colors ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed' 
            : isOpen 
              ? 'border-planac-500 ring-2 ring-planac-500/20' 
              : error
                ? 'border-red-300 hover:border-red-400'
                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
        }`}
      >
        {isSearchMode ? (
          // Modo busca - input ativo
          <div className="flex items-center gap-2 flex-1">
            <Icons.search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite para buscar cliente..."
              className="flex-1 outline-none bg-transparent text-gray-800"
              onClick={(e) => e.stopPropagation()}
              disabled={disabled}
            />
          </div>
        ) : (
          // Modo normal - mostra seleção
          <span 
            className={`flex-1 truncate ${selectedCliente ? 'text-gray-800' : 'text-gray-400'}`}
            onClick={handleInputClick}
          >
            {selectedCliente ? (
              <span>
                {displayName}
                {selectedCliente.cpf_cnpj && (
                  <span className="ml-2 text-gray-400 text-xs font-mono">
                    ({selectedCliente.cpf_cnpj})
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </span>
        )}
        
        {/* Botões da direita */}
        <div className="flex items-center gap-1 ml-2">
          {/* Botão limpar */}
          {selectedCliente && !isSearchMode && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Limpar seleção"
            >
              <Icons.x className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          
          {/* Botão setinha/fechar */}
          <button
            type="button"
            onClick={handleArrowClick}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isSearchMode ? 'Voltar para lista' : (presets.length > 0 ? 'Ver sugestões' : 'Buscar cliente')}
            disabled={disabled}
          >
            {isSearchMode ? (
              <Icons.x className="w-4 h-4 text-gray-400" />
            ) : (
              <Icons.chevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
          {/* Modo busca - mensagens de status */}
          {isSearchMode && searchTerm.length < 2 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Digite pelo menos 2 caracteres para buscar...
            </div>
          )}

          {isSearchMode && isSearching && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
              <Icons.spinner className="w-4 h-4 animate-spin" />
              Buscando...
            </div>
          )}

          {isSearchMode && searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Nenhum cliente encontrado
            </div>
          )}

          {/* Header dos presets */}
          {!isSearchMode && presets.length > 0 && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
              {presetsHeader}
            </div>
          )}

          {/* Lista de clientes */}
          {displayList.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              onClick={() => handleSelectCliente(cliente)}
              className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition-colors ${
                cliente.id === value
                  ? 'bg-planac-50 text-planac-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className={`block truncate ${cliente.id === value ? 'font-medium' : ''}`}>
                  {cliente.razao_social || cliente.nome}
                </span>
                {cliente.cpf_cnpj && (
                  <span className="block text-xs text-gray-400 font-mono truncate">
                    {cliente.cpf_cnpj}
                  </span>
                )}
              </div>
              {cliente.id === value && (
                <Icons.check className="w-4 h-4 flex-shrink-0 ml-2" />
              )}
            </button>
          ))}

          {/* Botão para buscar outro cliente */}
          {!isSearchMode && (
            <button
              type="button"
              onClick={handleInputClick}
              className="w-full px-4 py-2.5 text-sm text-left text-planac-600 hover:bg-planac-50 border-t border-gray-100 flex items-center gap-2"
            >
              <Icons.search className="w-4 h-4" />
              Buscar outro cliente...
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ClienteSelect;
