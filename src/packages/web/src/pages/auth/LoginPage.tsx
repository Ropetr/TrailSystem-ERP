/**
 * TrailSystem - Login Page
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/stores/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, isLoading, usuario } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar mensagens da URL
    if (searchParams.get('verified') === 'true') {
      setSuccess('Email verificado com sucesso! Faça login para continuar.');
    }
    if (searchParams.get('error') === 'invalid_token') {
      setError('Link de verificação inválido ou expirado.');
    }
    if (searchParams.get('registered') === 'true') {
      setSuccess('Conta criada! Verifique seu email para ativar.');
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirecionar para dashboard se já autenticado
    if (isAuthenticated && !isLoading && usuario) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, usuario, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Redirecionar para dashboard após login bem-sucedido
        navigate('/dashboard');
      } else {
        setError(result.error || 'Email ou senha inválidos');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta!</h1>
            <p className="text-gray-600 mt-2">Entre com suas credenciais para acessar</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link 
                to="/esqueci-senha" 
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-8 text-center text-gray-600">
            Não tem uma conta?{' '} 
            <Link to="/cadastro" className="text-red-600 hover:text-red-700 font-semibold">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Brand */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-red-600 via-red-700 to-gray-900 relative overflow-hidden">
        {/* Faixa branca horizontal - alinhada com a logo */}
        <div className="absolute left-0 right-0 top-[29%] h-52 bg-white"></div>
        
        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="max-w-lg text-center">
            {/* Logo Vertical - centralizada na faixa branca */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[29%] h-52 flex items-center justify-center w-full">
              <img 
                src="/logo-vertical.png" 
                alt="TrailSystem" 
                className="h-44"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Gerencie sua empresa com eficiência
            </h2>
            <p className="text-white/80 text-lg">
              Sistema completo de gestão empresarial com módulos integrados para vendas, estoque, financeiro, fiscal e muito mais.
            </p>
            
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">16+</div>
                <div className="text-white/70 text-sm">Módulos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">100%</div>
                <div className="text-white/70 text-sm">Na Nuvem</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">24/7</div>
                <div className="text-white/70 text-sm">Disponível</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



