// =============================================
// PLANAC ERP - Fornecedor Form Page
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

const fornecedorSchema = z.object({
  tipo: z.enum(['PF', 'PJ']),
  razao_social: z.string().min(3, 'Razão Social é obrigatória'),
  nome_fantasia: z.string().optional(),
  cpf_cnpj: z.string().min(11, 'CPF/CNPJ é obrigatório'),
  inscricao_estadual: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  site: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  tipo_fornecedor: z.string().optional(),
  categorias: z.string().optional(),
  prazo_entrega_dias: z.number().optional(),
  condicao_pagamento: z.string().optional(),
  avaliacao: z.number().min(0).max(5).optional(),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

const tabs = [
  { id: 'dados', label: 'Dados Gerais', icon: 'building' },
  { id: 'endereco', label: 'Endereço', icon: 'mapPin' },
  { id: 'contato', label: 'Contato', icon: 'phone' },
  { id: 'comercial', label: 'Comercial', icon: 'truck' },
];

const ufOptions = [
  { value: 'AC', label: 'AC' }, { value: 'AL', label: 'AL' }, { value: 'AP', label: 'AP' },
  { value: 'AM', label: 'AM' }, { value: 'BA', label: 'BA' }, { value: 'CE', label: 'CE' },
  { value: 'DF', label: 'DF' }, { value: 'ES', label: 'ES' }, { value: 'GO', label: 'GO' },
  { value: 'MA', label: 'MA' }, { value: 'MT', label: 'MT' }, { value: 'MS', label: 'MS' },
  { value: 'MG', label: 'MG' }, { value: 'PA', label: 'PA' }, { value: 'PB', label: 'PB' },
  { value: 'PR', label: 'PR' }, { value: 'PE', label: 'PE' }, { value: 'PI', label: 'PI' },
  { value: 'RJ', label: 'RJ' }, { value: 'RN', label: 'RN' }, { value: 'RS', label: 'RS' },
  { value: 'RO', label: 'RO' }, { value: 'RR', label: 'RR' }, { value: 'SC', label: 'SC' },
  { value: 'SP', label: 'SP' }, { value: 'SE', label: 'SE' }, { value: 'TO', label: 'TO' },
];

const tiposFornecedorOptions = [
  { value: 'fabricante', label: 'Fabricante' },
  { value: 'distribuidor', label: 'Distribuidor' },
  { value: 'revendedor', label: 'Revendedor' },
  { value: 'prestador', label: 'Prestador de Serviços' },
  { value: 'importador', label: 'Importador' },
];

export function FornecedorFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = Boolean(id);
  
  const [activeTab, setActiveTab] = useState('dados');
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: { tipo: 'PJ', ativo: true, prazo_entrega_dias: 0, avaliacao: 0 },
  });

  const tipo = watch('tipo');

  useEffect(() => {
    if (id) loadFornecedor();
  }, [id]);

  const loadFornecedor = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/fornecedores/${id}`);
      reset(response.data);
    } catch (error) {
      toast({ title: 'Erro ao carregar fornecedor', variant: 'destructive' });
      navigate('/cadastros/fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      setLoadingCep(true);
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
    } finally {
      setLoadingCep(false);
    }
  };

  const buscarCnpj = async (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return;
    try {
      setLoadingCnpj(true);
      const response = await api.get(`/consultas/cnpj/${cnpjLimpo}`);
      const data = response.data;
      if (data) {
        setValue('razao_social', data.razao_social || '');
        setValue('nome_fantasia', data.nome_fantasia || '');
        setValue('email', data.email || '');
        setValue('telefone', data.telefone || '');
        if (data.cep) {
          setValue('cep', data.cep);
          buscarCep(data.cep);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
    } finally {
      setLoadingCnpj(false);
    }
  };

  const onSubmit = async (data: FornecedorFormData) => {
    try {
      if (isEditing) {
        await api.put(`/fornecedores/${id}`, data);
        toast({ title: 'Fornecedor atualizado com sucesso!' });
      } else {
        await api.post('/fornecedores', data);
        toast({ title: 'Fornecedor cadastrado com sucesso!' });
      }
      navigate('/cadastros/fornecedores');
    } catch (error: any) {
      toast({ title: 'Erro ao salvar fornecedor', description: error.response?.data?.message || 'Tente novamente', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icons.spinner className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/cadastros/fornecedores')}>
          <Icons.arrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h1>
          <p className="text-sm text-gray-500">{isEditing ? 'Atualize os dados do fornecedor' : 'Preencha os dados do novo fornecedor'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-2 mb-6 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dados' && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pessoa *</label>
                <Select {...register('tipo')} options={[{ value: 'PJ', label: 'Pessoa Jurídica' }, { value: 'PF', label: 'Pessoa Física' }]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tipo === 'PJ' ? 'CNPJ *' : 'CPF *'}</label>
                <div className="flex gap-2">
                  <Input {...register('cpf_cnpj')} placeholder={tipo === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'} error={errors.cpf_cnpj?.message} className="flex-1" />
                  {tipo === 'PJ' && (
                    <Button type="button" variant="outline" onClick={() => buscarCnpj(watch('cpf_cnpj') || '')} disabled={loadingCnpj}>
                      {loadingCnpj ? <Icons.spinner className="w-4 h-4 animate-spin" /> : <Icons.search className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{tipo === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}</label>
                <Input {...register('razao_social')} placeholder={tipo === 'PJ' ? 'Razão Social da empresa' : 'Nome completo'} error={errors.razao_social?.message} />
              </div>
              {tipo === 'PJ' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                    <Input {...register('nome_fantasia')} placeholder="Nome Fantasia" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
                    <Input {...register('inscricao_estadual')} placeholder="Inscrição Estadual" />
                  </div>
                </>
              )}
              <div className="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" {...register('ativo')} className="w-4 h-4 text-red-600 rounded" />
                <label className="text-sm text-gray-700">Fornecedor Ativo</label>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'endereco' && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <div className="flex gap-2">
                  <Input {...register('cep')} placeholder="00000-000" onBlur={(e) => buscarCep(e.target.value)} className="flex-1" />
                  <Button type="button" variant="outline" onClick={() => buscarCep(watch('cep') || '')} disabled={loadingCep}>
                    {loadingCep ? <Icons.spinner className="w-4 h-4 animate-spin" /> : <Icons.search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                <Input {...register('logradouro')} placeholder="Rua, Avenida, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <Input {...register('numero')} placeholder="Nº" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <Input {...register('complemento')} placeholder="Sala, Andar, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <Input {...register('bairro')} placeholder="Bairro" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <Input {...register('cidade')} placeholder="Cidade" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                <Select {...register('uf')} options={ufOptions} placeholder="UF" />
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'contato' && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <Input {...register('email')} type="email" placeholder="email@empresa.com" error={errors.email?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <Input {...register('site')} placeholder="www.empresa.com.br" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <Input {...register('telefone')} placeholder="(00) 0000-0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                <Input {...register('celular')} placeholder="(00) 00000-0000" />
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'comercial' && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Fornecedor</label>
                <Select {...register('tipo_fornecedor')} options={tiposFornecedorOptions} placeholder="Selecione..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorias</label>
                <Input {...register('categorias')} placeholder="Ex: Drywall, Acabamentos, Ferramentas" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega (dias)</label>
                <Input {...register('prazo_entrega_dias', { valueAsNumber: true })} type="number" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condição de Pagamento</label>
                <Input {...register('condicao_pagamento')} placeholder="Ex: 30/60/90" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea {...register('observacoes')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Observações sobre o fornecedor..." />
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/cadastros/fornecedores')}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (<><Icons.spinner className="w-4 h-4 mr-2 animate-spin" />Salvando...</>) : (<><Icons.check className="w-4 h-4 mr-2" />{isEditing ? 'Atualizar' : 'Cadastrar'}</>)}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default FornecedorFormPage;
