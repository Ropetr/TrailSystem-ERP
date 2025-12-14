// =============================================
// PLANAC ERP - Usuario Form Page
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

const usuarioSchema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  confirmar_senha: z.string().optional().or(z.literal('')),
  perfil_id: z.string().min(1, 'Selecione um perfil'),
  empresa_id: z.string().min(1, 'Selecione uma empresa'),
  ativo: z.boolean(),
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

export function UsuarioFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [perfis, setPerfis] = useState<{ value: string; label: string }[]>([]);
  const [empresas, setEmpresas] = useState<{ value: string; label: string }[]>([]);

  const isEdit = id && id !== 'novo';

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
    },
  });

  const perfilId = watch('perfil_id');
  const empresaId = watch('empresa_id');

  useEffect(() => {
    loadOptions();
    if (isEdit) {
      loadUsuario();
    }
  }, [id]);

  const loadOptions = async () => {
    try {
      // Carregar perfis
      const perfisRes = await api.get<{ success: boolean; data: { id: string; nome: string }[] }>('/perfis');
      if (perfisRes.success) {
        setPerfis(perfisRes.data.map(p => ({ value: p.id, label: p.nome })));
      }

      // Carregar empresas
      const empresasRes = await api.get<{ success: boolean; data: { id: string; razao_social: string }[] }>('/empresas');
      if (empresasRes.success) {
        setEmpresas(empresasRes.data.map(e => ({ value: e.id, label: e.razao_social })));
      }
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

  const loadUsuario = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: any }>(`/usuarios/${id}`);
      if (response.success && response.data) {
        setValue('nome', response.data.nome);
        setValue('email', response.data.email);
        setValue('perfil_id', response.data.perfil_id);
        setValue('empresa_id', response.data.empresa_id);
        setValue('ativo', response.data.ativo);
      }
    } catch (error) {
      toast.error('Erro ao carregar usuário');
      navigate('/usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UsuarioForm) => {
    setIsSaving(true);
    try {
      const payload = { ...data };
      // Não enviar senha vazia em edição
      if (isEdit && !payload.senha) {
        delete payload.senha;
      }
      delete payload.confirmar_senha;

      if (isEdit) {
        await api.put(`/usuarios/${id}`, payload);
        toast.success('Usuário atualizado com sucesso');
      } else {
        await api.post('/usuarios', payload);
        toast.success('Usuário criado com sucesso');
      }
      navigate('/usuarios');
    } catch (error) {
      toast.error('Erro ao salvar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="w-8 h-8 text-planac-500 animate-spin" />
      </div>
    );
  }

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
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p className="text-gray-500">
            {isEdit ? 'Atualize os dados do usuário' : 'Preencha os dados do novo usuário'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados Principais */}
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados do Usuário</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo"
                  placeholder="Nome do usuário"
                  error={errors.nome?.message}
                  required
                  {...register('nome')}
                />
              </div>
              
              <div className="md:col-span-2">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="usuario@empresa.com.br"
                  error={errors.email?.message}
                  required
                  {...register('email')}
                />
              </div>

              <div className="relative">
                <Input
                  label={isEdit ? 'Nova Senha (opcional)' : 'Senha'}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.senha?.message}
                  required={!isEdit}
                  {...register('senha')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <Icons.eyeOff className="w-5 h-5" /> : <Icons.eye className="w-5 h-5" />}
                </button>
              </div>

              <Input
                label="Confirmar Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.confirmar_senha?.message}
                {...register('confirmar_senha')}
              />
            </div>
          </Card>

          {/* Permissões */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Permissões</h2>
            
            <div className="space-y-4">
              <Select
                label="Perfil de Acesso"
                value={perfilId || ''}
                onChange={(v) => setValue('perfil_id', v)}
                options={perfis}
                placeholder="Selecione um perfil"
                error={errors.perfil_id?.message}
              />

              <Select
                label="Empresa"
                value={empresaId || ''}
                onChange={(v) => setValue('empresa_id', v)}
                options={empresas}
                placeholder="Selecione uma empresa"
                error={errors.empresa_id?.message}
              />

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="ativo"
                  className="w-4 h-4 text-planac-500 border-gray-300 rounded focus:ring-planac-500"
                  {...register('ativo')}
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Usuário Ativo
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/usuarios')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSaving}
            leftIcon={<Icons.check className="w-4 h-4" />}
          >
            {isEdit ? 'Salvar Alterações' : 'Criar Usuário'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default UsuarioFormPage;
