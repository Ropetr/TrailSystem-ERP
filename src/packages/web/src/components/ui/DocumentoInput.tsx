// =============================================
// PLANAC ERP - Documento Input Component
// Campo de CPF/CNPJ com deteccao automatica
// =============================================

import React, { useState, useCallback, useEffect } from 'react';
import { forwardRef } from 'react';

interface DocumentoInputProps {
  value: string;
  onChange: (value: string, tipo: 'CPF' | 'CNPJ' | null) => void;
  onConsultar?: (documento: string, tipo: 'CPF' | 'CNPJ') => void;
  isConsultando?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// Funcoes de validacao
function validarCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  if (/^(\d)\1+$/.test(numeros)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros[10])) return false;

  return true;
}

function validarCNPJ(cnpj: string): boolean {
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length !== 14) return false;
  if (/^(\d)\1+$/.test(numeros)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(numeros[i]) * pesos1[i];
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  if (digito1 !== parseInt(numeros[12])) return false;

  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(numeros[i]) * pesos2[i];
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  if (digito2 !== parseInt(numeros[13])) return false;

  return true;
}

// Funcoes de mascara
function aplicarMascaraCPF(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function aplicarMascaraCNPJ(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 14);
  return numeros
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function detectarTipo(valor: string): 'CPF' | 'CNPJ' | null {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 11) {
    return numeros.length === 11 ? 'CPF' : null;
  }
  return numeros.length === 14 ? 'CNPJ' : null;
}

function aplicarMascara(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 11) {
    return aplicarMascaraCPF(numeros);
  }
  return aplicarMascaraCNPJ(numeros);
}

// Icones
const LoaderIcon = () => (
  <svg className="w-5 h-5 animate-spin text-planac-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const DocumentoInput = forwardRef<HTMLInputElement, DocumentoInputProps>(
  ({ value, onChange, onConsultar, isConsultando = false, label, error, disabled = false, className = '' }, ref) => {
    const [tipo, setTipo] = useState<'CPF' | 'CNPJ' | null>(null);
    const [isValido, setIsValido] = useState<boolean | null>(null);

    // Detectar tipo e validar quando valor muda
    useEffect(() => {
      const numeros = value.replace(/\D/g, '');
      const novoTipo = detectarTipo(value);
      setTipo(novoTipo);

      if (novoTipo === 'CPF' && numeros.length === 11) {
        setIsValido(validarCPF(numeros));
      } else if (novoTipo === 'CNPJ' && numeros.length === 14) {
        setIsValido(validarCNPJ(numeros));
      } else {
        setIsValido(null);
      }
    }, [value]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const valorDigitado = e.target.value;
      const valorMascarado = aplicarMascara(valorDigitado);
      const novoTipo = detectarTipo(valorMascarado);
      onChange(valorMascarado, novoTipo);
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onConsultar && tipo && isValido) {
        e.preventDefault();
        onConsultar(value.replace(/\D/g, ''), tipo);
      }
    }, [onConsultar, tipo, isValido, value]);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const textoColado = e.clipboardData.getData('text');
      const valorMascarado = aplicarMascara(textoColado);
      const novoTipo = detectarTipo(valorMascarado);
      onChange(valorMascarado, novoTipo);
    }, [onChange]);

    // Determinar label dinamico
    const labelDinamico = label || (tipo === 'CPF' ? 'CPF' : tipo === 'CNPJ' ? 'CNPJ' : 'Documento (CPF/CNPJ)');
    const placeholder = tipo === 'CPF' ? '000.000.000-00' : tipo === 'CNPJ' ? '00.000.000/0000-00' : 'Digite CPF ou CNPJ';

    // Determinar icone de status
    const renderStatusIcon = () => {
      if (isConsultando) return <LoaderIcon />;
      if (isValido === true) return <CheckIcon />;
      if (isValido === false) return <ErrorIcon />;
      return null;
    };

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            {labelDinamico}
            <span className="text-planac-500 ml-1">*</span>
          </label>
          {tipo && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              tipo === 'CPF' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {tipo}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled || isConsultando}
            className={`
              w-full px-3 py-2.5 bg-white border rounded-lg text-sm
              placeholder:text-gray-400
              focus:outline-none focus:ring-2
              disabled:bg-gray-100 disabled:cursor-not-allowed
              pr-10
              ${error || isValido === false
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : isValido === true
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                  : 'border-gray-200 focus:border-planac-500 focus:ring-planac-500/20'
              }
              ${className}
            `}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {renderStatusIcon()}
          </div>
        </div>
        {isValido === true && onConsultar && (
          <p className="mt-1 text-xs text-gray-500">
            Pressione Enter para consultar dados
          </p>
        )}
        {isValido === false && (
          <p className="mt-1 text-sm text-red-500">
            {tipo === 'CPF' ? 'CPF invalido' : 'CNPJ invalido'}
          </p>
        )}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

DocumentoInput.displayName = 'DocumentoInput';
export default DocumentoInput;
