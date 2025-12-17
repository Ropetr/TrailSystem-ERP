// =============================================
// PLANAC ERP - ClienteSelect
// Componente padrão para seleção de cliente
// Criado: 17/12/2025
// =============================================

import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';

// =============================================
// INTERFACES
// =============================================
export interface ClienteData {
  id: string;
  codigo?: string;
  tipo?: 'PF' | 'PJ';
  nome?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cpf_cnpj?: string;
  ie_rg?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  saldo_credito?: number;
}

export interface ClienteOption {
  id: string;
  nome: string;
  cpf_cnpj?: string;
}

interface ClienteSelectProps {
  value: string;
  onChange: (clienteId: string, cliente?: ClienteData) => void;
  presets?: ClienteOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  showDetailsOnSelect?: boolean;
  presetsLabel?: string;
}

// =============================================
// ÍCONES
// =============================================
const Icons = {
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  x: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  spinner: (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  user: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export function ClienteSelect({
  value,
  onChange,
  presets = [],
  placeholder = 'Selecione o cliente...',
  disabled = false,
  className = '',
  label,
  error,
  showDetailsOnSelect = false,
  presetsLabel = 'Clientes sugeridos',
}: ClienteSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ClienteOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteData | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Encontrar cliente nos presets
  const presetCliente = presets.find(c => c.id === value);

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

  // Carregar dados completos do cliente quando selecionado
  useEffect(() => {
    if (value && showDetailsOnSelect && !selectedCliente) {
      loadClienteDetails(value);
    }
  }, [value, showDetailsOnSelect]);

  // Buscar clientes na API
  const searchClientes = async (termo: string) => {
    if (termo.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get<{ success: boolean; data: any[] }>(`/clientes?busca=${encodeURIComponent(termo)}&limit=10`);
      if (response.success) {
        setSearchResults(response.data.map((c: any) => ({
          id: c.id,
          nome: c.razao_social || c.nome_fantasia || c.nome,
          cpf_cnpj: c.cpf_cnpj,
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Carregar detalhes completos do cliente
  const loadClienteDetails = async (clienteId: string) => {
    try {
      const response = await api.get<{ success: boolean; data: ClienteData }>(`/clientes/${clienteId}`);
      if (response.success) {
        setSelectedCliente(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
    }
  };

  // Debounce na busca
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (isSearchMode && searchTerm) {
      searchTimeoutRef.current = setTimeout(() => {
        searchClientes(searchTerm);
      }, 300);
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

  const handleInputClick = () => {
    if (disabled) return;
    setIsSearchMode(true);
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setIsSearchMode(false);
    setSearchTerm('');
    setIsOpen(!isOpen);
  };

  const handleSelectCliente = async (cliente: ClienteOption) => {
    // Carregar dados completos se necessário
    if (showDetailsOnSelect) {
      await loadClienteDetails(cliente.id);
    }
    
    onChange(cliente.id, selectedCliente || undefined);
    setIsOpen(false);
    setIsSearchMode(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSelectedCliente(null);
  };

  // Lista para exibir
  const displayList = isSearchMode && searchTerm.length >= 2 ? searchResults : presets;
  
  // Nome para exibição
  const displayName = selectedCliente 
    ? (selectedCliente.razao_social || selectedCliente.nome_fantasia || selectedCliente.nome)
    : presetCliente?.nome;

  const displayCpfCnpj = selectedCliente?.cpf_cnpj || presetCliente?.cpf_cnpj;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <div 
          className={`w-full px-3 py-2 bg-white border rounded-lg text-sm flex items-center justify-between transition-colors ${
            disabled 
              ? 'bg-gray-100 cursor-not-allowed' 
              : isOpen 
                ? 'border-planac-500 ring-2 ring-planac-500/20' 
                : error
                  ? 'border-red-500'
                  : 'border-gray-200 hover:border-gray-300 cursor-pointer'
          }`}
        >
          {isSearchMode ? (
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
          ) : (
            <span 
              className={`flex-1 truncate ${displayName ? 'text-gray-800' : 'text-gray-400'}`}
              onClick={handleInputClick}
            >
              {displayName 
                ? `${displayName}${displayCpfCnpj ? ` (${displayCpfCnpj})` : ''}`
                : placeholder
              }
            </span>
          )}
          
          <div className="flex items-center gap-1 ml-2">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
                title="Limpar"
              >
                {Icons.x}
              </button>
            )}
            
            <button
              type="button"
              onClick={handleArrowClick}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={isSearchMode ? 'Voltar para lista' : 'Abrir lista'}
              disabled={disabled}
            >
              {isSearchMode ? (
                <span className="text-gray-400">{Icons.x}</span>
              ) : (
                <span className={`text-gray-400 transition-transform inline-block ${isOpen ? 'rotate-180' : ''}`}>
                  {Icons.chevronDown}
                </span>
              )}
            </button>
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
            {/* Mensagem de digitação mínima */}
            {isSearchMode && searchTerm.length < 2 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Digite pelo menos 2 caracteres para buscar...
              </div>
            )}

            {/* Loading */}
            {isSearchMode && isSearching && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                {Icons.spinner}
                Buscando...
              </div>
            )}

            {/* Header dos presets */}
            {!isSearchMode && presets.length > 0 && (
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
                {presetsLabel}
              </div>
            )}

            {/* Sem resultados */}
            {isSearchMode && searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Nenhum cliente encontrado
              </div>
            )}

            {/* Lista de clientes */}
            {displayList.map((cliente) => (
              <button
                key={cliente.id}
                onClick={() => handleSelectCliente(cliente)}
                className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition-colors ${
                  cliente.id === value
                    ? 'bg-planac-50 text-planac-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{Icons.user}</span>
                  <div>
                    <span>{cliente.nome}</span>
                    {cliente.cpf_cnpj && (
                      <span className="ml-2 text-xs text-gray-400 font-mono">{cliente.cpf_cnpj}</span>
                    )}
                  </div>
                </div>
                {cliente.id === value && <span className="text-planac-600">{Icons.check}</span>}
              </button>
            ))}

            {/* Botão para buscar outro cliente */}
            {!isSearchMode && (
              <button
                onClick={handleInputClick}
                className="w-full px-4 py-2.5 text-sm text-left text-planac-600 hover:bg-planac-50 border-t border-gray-100 flex items-center gap-2"
              >
                {Icons.search}
                Buscar outro cliente...
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Detalhes do cliente selecionado (opcional) */}
      {showDetailsOnSelect && selectedCliente && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Código:</span>
              <span className="ml-2 font-mono">{selectedCliente.codigo}</span>
            </div>
            <div>
              <span className="text-gray-500">CPF/CNPJ:</span>
              <span className="ml-2 font-mono">{selectedCliente.cpf_cnpj}</span>
            </div>
            {selectedCliente.telefone && (
              <div>
                <span className="text-gray-500">Telefone:</span>
                <span className="ml-2">{selectedCliente.telefone}</span>
              </div>
            )}
            {selectedCliente.cidade && (
              <div>
                <span className="text-gray-500">Cidade:</span>
                <span className="ml-2">{selectedCliente.cidade} - {selectedCliente.uf}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClienteSelect;
