// =============================================
// PLANAC ERP - Empresa Form Page
// =============================================

import { useState, useEffect } from 'react';
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

const empresaSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ inválido'),
  razao_social: z.string().min(3, 'Mínimo 3 caracteres'),
  nome_fantasia: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  regime_tributario: z.string(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
});

type EmpresaForm = z.infer<typeof empresaSchema>;

const regimeOptions = [
  { value: '1', label: 'Simples Nacional' },
  { value: '2', label: 'Simples Nacional - Excesso' },
  { value: '3', label: 'Lucro Presumido' },
  { value: '4', label: 'Lucro Real' },
];

const ufOptions = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
].map(uf => ({ value: uf, label: uf }));

export function EmpresaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');

  const isEdit = id && id !== 'novo';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmpresaForm>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      regime_tributario: '1',
    },
  });

  const regimeTributario = watch('regime_tributario');
  const uf = watch('uf');

  useEffect(() => {
    if (isEdit) {
      loadEmpresa();
    }
  }, [id]);

  const loadEmpresa = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: EmpresaForm }>(`/empresas/${id}`);
      if (response.success && response.data) {
        Object.entries(response.data).forEach(([key, value]) => {
          setValue(key as keyof EmpresaForm, value as string);
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar empresa');
      navigate('/empresas');
    } finally {
      setIsLoading(false);
    }
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setValue('logradouro', data.logradouro);
        setValue('bairro', data.bairro);
        setValue('cidade', data.localidade);
        setValue('uf', data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const onSubmit = async (data: EmpresaForm) => {
    setIsSaving(true);
    try {
      if (isEdit) {
        await api.put(`/empresas/${id}`, data);
        toast.success('Empresa atualizada com sucesso');
      } else {
        await api.post('/empresas', data);
        toast.success('Empresa criada com sucesso');
      }
      navigate('/empresas');
    } catch (error) {
      toast.error('Erro ao salvar empresa');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'dados', label: 'Dados Gerais', icon: <Icons.building className="w-4 h-4" /> },
    { id: 'endereco', label: 'Endereço', icon: <Icons.home className="w-4 h-4" /> },
    { id: 'contato', label: 'Contato', icon: <Icons.mail className="w-4 h-4" /> },
    { id: 'fiscal', label: 'Fiscal', icon: <Icons.document className="w-4 h-4" /> },
  ];

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
          onClick={() => navigate('/empresas')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Icons.back className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Empresa' : 'Nova Empresa'}
          </h1>
          <p className="text-gray-500">
            {isEdit ? 'Atualize os dados da empresa' : 'Preencha os dados da nova empresa'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-planac-600 border-planac-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Dados Gerais */}
          {activeTab === 'dados' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                error={errors.cnpj?.message}
                required
                {...register('cnpj')}
              />
              <Select
                label="Regime Tributário"
                value={regimeTributario}
                onChange={(v) => setValue('regime_tributario', v)}
                options={regimeOptions}
              />
              <Input
                label="Razão Social"
                placeholder="Razão Social da Empresa"
                error={errors.razao_social?.message}
                required
                {...register('razao_social')}
              />
              <Input
                label="Nome Fantasia"
                placeholder="Nome Fantasia"
                {...register('nome_fantasia')}
              />
              <Input
                label="Inscrição Estadual"
                placeholder="000.000.000.000"
                {...register('inscricao_estadual')}
              />
              <Input
                label="Inscrição Municipal"
                placeholder="00000000"
                {...register('inscricao_municipal')}
              />
            </div>
          )}

          {/* Tab: Endereço */}
          {activeTab === 'endereco' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="CEP"
                placeholder="00000-000"
                {...register('cep')}
                onBlur={(e) => buscarCep(e.target.value)}
              />
              <div className="md:col-span-2">
                <Input
                  label="Logradouro"
                  placeholder="Rua, Avenida..."
                  {...register('logradouro')}
                />
              </div>
              <Input
                label="Número"
                placeholder="123"
                {...register('numero')}
              />
              <Input
                label="Complemento"
                placeholder="Sala, Andar..."
                {...register('complemento')}
              />
              <Input
                label="Bairro"
                placeholder="Bairro"
                {...register('bairro')}
              />
              <Input
                label="Cidade"
                placeholder="Cidade"
                {...register('cidade')}
              />
              <Select
                label="UF"
                value={uf || ''}
                onChange={(v) => setValue('uf', v)}
                options={ufOptions}
                placeholder="Selecione..."
              />
            </div>
          )}

          {/* Tab: Contato */}
          {activeTab === 'contato' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telefone"
                placeholder="(00) 0000-0000"
                {...register('telefone')}
              />
              <Input
                label="E-mail"
                type="email"
                placeholder="contato@empresa.com.br"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
          )}

          {/* Tab: Fiscal */}
          {activeTab === 'fiscal' && (
            <div className="text-center py-12 text-gray-500">
              <Icons.document className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Configurações fiscais serão implementadas em breve.</p>
              <p className="text-sm">Certificado digital, séries NF-e, etc.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/empresas')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              leftIcon={<Icons.check className="w-4 h-4" />}
            >
              {isEdit ? 'Salvar Alterações' : 'Criar Empresa'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default EmpresaFormPage;
