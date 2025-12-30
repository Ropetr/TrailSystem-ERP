/**
 * TrailSystem - Cadastro Page
 */

import React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';

export default function CadastroPage() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1 - Dados da empresa
  const [companyName, setCompanyName] = useState('');
  const [companyDocument, setCompanyDocument] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  
  // Step 2 - Dados do usuário
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordConfirm, setUserPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    // Apenas CNPJ (14 dígitos)
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
  };

  const validateStep1 = () => {
    if (!companyName.trim()) {
      setError('Nome da empresa é obrigatório');
      return false;
    }
    if (companyName.trim().length < 3) {
      setError('Nome da empresa deve ter no mínimo 3 caracteres');
      return false;
    }
    const cnpjNumbers = companyDocument.replace(/\D/g, '');
    if (!cnpjNumbers) {
      setError('CNPJ é obrigatório');
      return false;
    }
    if (cnpjNumbers.length !== 14) {
      setError('CNPJ deve ter 14 dígitos');
      return false;
    }
    const phoneNumbers = companyPhone.replace(/\D/g, '');
    if (!phoneNumbers) {
      setError('Telefone é obrigatório');
      return false;
    }
    if (phoneNumbers.length < 10) {
      setError('Telefone inválido');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!userName.trim()) {
      setError('Seu nome é obrigatório');
      return false;
    }
    if (!userEmail.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setError('Email inválido');
      return false;
    }
    if (userPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return false;
    }
    if (userPassword !== userPasswordConfirm) {
      setError('As senhas não conferem');
      return false;
    }
    if (!acceptTerms) {
      setError('Você precisa aceitar os termos de uso');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateStep2()) return;

    setLoading(true);

    try {
      const response = await api.register({
        userName,
        userEmail,
        userPassword,
        companyName,
        companyDocument: companyDocument.replace(/\D/g, '') || undefined,
        companyPhone: companyPhone.replace(/\D/g, '') || undefined,
      });

      if (response.success) {
        navigate('/login?registered=true');
      } else {
        setError(response.message || 'Erro ao criar conta');
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-bl from-red-600 via-red-700 to-gray-900 relative overflow-hidden">
        {/* Faixa branca horizontal - alinhada com a logo */}
        <div className="absolute left-0 right-0 top-[28%] h-52 bg-white"></div>
        
        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="max-w-lg text-center">
            {/* Logo Vertical sobre a faixa branca */}
            <div className="mb-8">
              <img 
                src="/logo-vertical.png" 
                alt="TrailSystem" 
                className="h-48 mx-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Comece agora mesmo!
            </h2>
            <p className="text-white/80 text-lg">
              Teste grátis por 14 dias. Sem cartão de crédito. Cancele quando quiser.
            </p>
            
            <div className="mt-12 space-y-4 text-left">
              <div className="flex items-center gap-3 text-white/90">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Todos os módulos liberados no trial</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Suporte por email durante o período</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dados seguros na nuvem</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Sem compromisso de permanência</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 1 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 2 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Dados da Empresa' : 'Seus Dados'}
            </h1>
            <p className="text-gray-600 mt-1">
              {step === 1 ? 'Passo 1 de 2' : 'Passo 2 de 2'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit}>
            {step === 1 ? (
              <div className="space-y-4">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Razão Social ou Nome Fantasia"
                  />
                </div>

                {/* Document */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    value={companyDocument}
                    onChange={(e) => setCompanyDocument(formatDocument(e.target.value))}
                    maxLength={18}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(formatPhone(e.target.value))}
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all mt-6"
                >
                  Continuar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seu Nome *
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Nome completo"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="seu@email.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 pr-12"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userPasswordConfirm}
                    onChange={(e) => setUserPasswordConfirm(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Repita a senha"
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    Li e aceito os{' '}
                    <a href="/termos" target="_blank" className="text-red-600 hover:underline">
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href="/privacidade" target="_blank" className="text-red-600 hover:underline">
                      Política de Privacidade
                    </a>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Criando...' : 'Criar Conta'}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

