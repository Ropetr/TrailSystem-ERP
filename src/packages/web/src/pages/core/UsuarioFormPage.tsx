// =============================================
// PLANAC ERP - Usuário Form Page
// Especificação: docs/06-especificacao-telas
// Especialistas: Frontend, UX/UI, Guardião
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

// =============================================
// VALIDAÇÃO (Zod)
// =============================================
const usuarioSchema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  confirmar_senha: z.string().optional().or(z.literal('')),
  perfil_id: z.string().min(1, 'Selecione um perfil'),
  empresas: z.array(z.string()).min(1, 'Selecione ao menos uma empresa'),
  vendedor_id: z.string().optional(),
  ativo: z.boolean().default(true),
  two_factor_enabled: z.boolean().default(false),
}).refine((data) => {
  if (data.senha && data.senha !== data.confirmar_senha) {
    return false;
  }
  return true;
}, {
  message: 'As senhas não conferem',
  path: ['confirmar_senha'],
});

type UsuarioForm = z.infer<typeof usuarioSchema>;

// =============================================
// INTERFACES
// =============================================
interface Perfil {
  id: string;
  nome: string;
}

interface Empresa {
  id: string;
  nome_fantasia: string;
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export function UsuarioFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditing = !!id && id !== 'novo';
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresas, setSelectedEmpresas] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      ativo: true,
      two_factor_enabled: false,
      empresas: [],
    },
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadPerfis();
    loadEmpresas();
    if (isEditing) {
      loadUsuario();
    }
  }, [id]);

  const loadPerfis = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Perfil[] }>('/perfis');
      if (response.success) {
        setPerfis(response.data);
      }
    } catch {
      // Dados mock para desenvolvimento
      setPerfis([
        { id: '1', nome: 'Administrador' },
        { id: '2', nome: 'Gerente' },
        { id: '3', nome: 'Vendedor' },
        { id: '4', nome: 'Financeiro' },
        { id: '5', nome: 'Operacional' },
      ]);
    }
  };

  const loadEmpresas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Empresa[] }>('/empresas');
      if (response.success) {
        setEmpresas(response.data);
      }
    } catch {
      // Dados mock para desenvolvimento
      setEmpresas([
        { id: '1', nome_fantasia: 'PLANAC Matriz' },
        { id: '2', nome_fantasia: 'PLANAC Filial SP' },
        { id: '3', nome_fantasia: 'PLANAC Filial RJ' },
      ]);
    }
  };

  const loadUsuario = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ success: boolean; data: any }>(`/usuarios/${id}`);
      if (response.success && response.data) {
        const usuario = response.data;
        setValue('nome', usuario.nome);
        setValue('email', usuario.email);
        setValue('perfil_id', usuario.perfil_id);
        setValue('ativo', usuario.ativo);
        setValue('two_factor_enabled', usuario.two_factor_enabled || false);
        
        const empresaIds = usuario.empresas?.map((e: any) => e.id) || [];
        setValue('empresas', empresaIds);
        setSelectedEmpresas(empresaIds);
      }
    } catch (error) {
      toast.error('Erro ao carregar usuário');
      navigate('/usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle empresa na seleção
  const toggleEmpresa = (empresaId: string) => {
    const newSelection = selectedEmpresas.includes(empresaId)
      ? selectedEmpresas.filter(id => id !== empresaId)
      : [...selectedEmpresas, empresaId];
    
    setSelectedEmpresas(newSelection);
    setValue('empresas', newSelection);
  };

  // Salvar
  const onSubmit = async (data: UsuarioForm) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        empresas: selectedEmpresas,
      };

      // Remover senha se vazia (edição sem alterar senha)
      if (!payload.senha) {
        delete (payload as any).senha;
        delete (payload as any).confirmar_senha;
      }

      if (isEditing) {
        await api.put(`/usuarios/${id}`, payload);
        toast.success('Usuário atualizado!');
      } else {
        await api.post('/usuarios', payload);
        toast.success('Usuário cadastrado!');
      }
      navigate('/usuarios');
    } catch (error) {
      toast.error('Erro ao salvar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const perfilOptions = perfis.map(p => ({ value: p.id, label: p.nome }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Icons.back className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Atualize os dados do usuário' : 'Preencha os dados para cadastrar'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados Básicos */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icons.user className="w-5 h-5 text-planac-500" />
                Dados do Usuário
              </h2>

              <div className="space-y-4">
                <Input
                  label="Nome Completo"
                  error={errors.nome?.message}
                  {...register('nome')}
                  required
                />

                <Input
                  label="E-mail (Login)"
                  type="email"
                  error={errors.email?.message}
                  {...register('email')}
                  required
                />

                <Select
                  label="Perfil de Acesso"
                  value={watch('perfil_id') || ''}
                  onChange={(v) => setValue('perfil_id', v)}
                  options={perfilOptions}
                  error={errors.perfil_id?.message}
                />
              </div>
            </Card>

            {/* Senha */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icons.lock className="w-5 h-5 text-planac-500" />
                {isEditing ? 'Alterar Senha' : 'Senha de Acesso'}
              </h2>

              {isEditing && (
                <p className="text-sm text-gray-500 mb-4">
                  Deixe em branco para manter a senha atual
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    error={errors.senha?.message}
                    {...register('senha')}
                    required={!isEditing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <Icons.eyeOff className="w-5 h-5" />
                    ) : (
                      <Icons.eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <Input
                  label="Confirmar Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.confirmar_senha?.message}
                  {...register('confirmar_senha')}
                  required={!isEditing}
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                A senha deve ter no mínimo 8 caracteres
              </p>
            </Card>

            {/* Empresas */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icons.building className="w-5 h-5 text-planac-500" />
                Empresas com Acesso
              </h2>

              {errors.empresas && (
                <p className="text-sm text-red-500 mb-3">{errors.empresas.message}</p>
              )}

              <div className="space-y-2">
                {empresas.map((empresa) => (
                  <label
                    key={empresa.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                      ${selectedEmpresas.includes(empresa.id)
                        ? 'border-planac-500 bg-planac-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmpresas.includes(empresa.id)}
                      onChange={() => toggleEmpresa(empresa.id)}
                      className="w-4 h-4 text-planac-500 rounded border-gray-300 focus:ring-planac-500"
                    />
                    <Icons.building className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {empresa.nome_fantasia}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Icons.check className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Usuário Ativo</span>
                  </div>
                  <input
                    type="checkbox"
                    {...register('ativo')}
                    className="w-4 h-4 text-planac-500 rounded border-gray-300 focus:ring-planac-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Icons.lock className="w-5 h-5 text-blue-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 block">2FA Habilitado</span>
                      <span className="text-xs text-gray-500">Autenticação em dois fatores</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    {...register('two_factor_enabled')}
                    className="w-4 h-4 text-planac-500 rounded border-gray-300 focus:ring-planac-500"
                  />
                </label>
              </div>
            </Card>

            {/* Avatar */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Foto</h2>

              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Icons.user className="w-12 h-12 text-gray-400" />
                </div>
                <Button type="button" variant="ghost" size="sm">
                  Alterar Foto
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  JPG ou PNG, máx. 2MB
                </p>
              </div>
            </Card>

            {/* Ações */}
            <Card>
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  leftIcon={<Icons.check className="w-4 h-4" />}
                >
                  Salvar Usuário
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/usuarios')}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UsuarioFormPage;
