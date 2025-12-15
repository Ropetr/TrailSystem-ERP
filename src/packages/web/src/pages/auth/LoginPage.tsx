// =============================================
// PLANAC ERP - Login Page
// Design completo com logo e formulário
// =============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';

// Ícones SVG inline
const Icons = {
  eye: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  eyeOff: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  loading: (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  mail: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  lock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  alert: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Validação de email
  const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Função de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // Validações
    if (!email.trim()) {
      setErro('Digite seu e-mail');
      return;
    }
    if (!emailValido(email)) {
      setErro('E-mail inválido');
      return;
    }
    if (!senha) {
      setErro('Digite sua senha');
      return;
    }
    if (senha.length < 4) {
      setErro('Senha deve ter pelo menos 4 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Usar o login do auth store que atualiza o estado do React
      const result = await login(email, senha);
      
      if (result.success) {
        // Navegar para o dashboard
        navigate('/dashboard');
      } else {
        setErro(result.error || 'Credenciais inválidas');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setErro('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header com logo */}
          <div className="px-8 pt-10 pb-6 text-center">
            {/* Logo PLANAC */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 bg-red-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-1 border-2 border-white/30 rounded" />
                  <span className="text-white font-black text-2xl">P</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-black text-gray-900 tracking-tight">PLANAC</span>
                  <span className="text-xs font-semibold text-gray-400 tracking-[0.2em] -mt-0.5">DISTRIBUIDORA</span>
                </div>
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-1">Bem-vindo de volta!</h1>
            <p className="text-sm text-gray-500">Entre com suas credenciais para acessar o sistema</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="px-8 pb-8 space-y-5">
            {/* Mensagem de erro */}
            {erro && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {Icons.alert}
                <span>{erro}</span>
              </div>
            )}

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {Icons.mail}
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {Icons.lock}
                </span>
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:opacity-50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                >
                  {mostrarSenha ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
            </div>

            {/* Lembrar + Esqueci */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-sm text-gray-600">Lembrar-me</span>
              </label>
              <a href="#" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                Esqueci minha senha
              </a>
            </div>

            {/* Botão Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  {Icons.loading}
                  <span>Entrando...</span>
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Footer do card */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Problemas para acessar?{' '}
              <a href="#" className="font-medium text-red-600 hover:text-red-700 transition-colors">
                Fale com o suporte
              </a>
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-sm text-gray-400 mt-6">
          PLANAC ERP v1.0.0 • Sistema de Gestão Empresarial
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
