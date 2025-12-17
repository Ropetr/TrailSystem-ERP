// =============================================
// PLANAC ERP - Fornecedor Form Page
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

const fornecedorSchema = z.object({
  tipo: z.enum(['PF', 'PJ']),
  razao_social: z.string().min(1, 'Razão Social é obrigatória'),
  nome_fantasia: z.string().optional(),
  cpf_cnpj: z.string().min(1, 'CPF/CNPJ é obrigatório'),
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
  prazo_entrega_dias: z.number().optional(),
  condicao_pagamento: z.string().optional(),
  tipo_fornecedor: z.string().optional(),
  categorias: z.string().optional(),
  avaliacao: z.number().min(0).max(5).optional(),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

const tabs = [
  { id: 'dados', label: 'Dados Gerais', icon: Icons.building },
  { id: 'endereco', label: 'Endereço', icon: Icons.mapPin },
  { id: 'contato', label: 'Contato', icon: Icons.phone },
  { id: 'comercial', label: 'Comercial', icon: Icons.truck },
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

const tipoFornecedorOptions = [
  { value: 'fabricante', label: 'Fabricante' },
  { value: 'distribuidor', label: 'Distribuidor' },
  { value: 'importador', label: 'Importador' },
  { value: 'representante', label: 'Representante' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outros', label: 'Outros' },
];

export function FornecedorFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditing = Boolean(id);

  const [activeTab, setActiveTab] = useState('dados');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: { tipo: 'PJ', ativo: true, prazo_entrega_dias: 0, avaliacao: 0 },
  });

  const tipo = watch('tipo');

  useEffect(() => { if (id) loadFornecedor(); }, [id]);

  const loadFornecedor = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/fornecedores/${id}`);
      if (response.success) reset(response.data);
    } catch (error) {
      toast.error('Erro ao carregar fornecedor');
      navigate('/cadastros/fornecedores');
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
    } catch (error) { console.error('Erro ao buscar CEP:', error); }
  };

  const buscarCnpj = async (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return;
    try {
      toast.info('Consultando CNPJ...');
      const response = await api.get(`/consultas/cnpj/${cnpjLimpo}`);
      if (response.success && response.data) {
        const dados = response.data;
        setValue('razao_social', dados.razao_social || '');
        setValue('nome_fantasia', dados.nome_fantasia || '');
        if (dados.endereco) {
          setValue('cep', dados.endereco.cep || '');
          setValue('logradouro', dados.endereco.logradouro || '');
          setValue('numero', dados.endereco.numero || '');
          setValue('bairro', dados.endereco.bairro || '');
          setValue('cidade', dados.endereco.cidade || '');
          setValue('uf', dados.endereco.uf || '');
        }
        toast.success('Dados do CNPJ carregados!');
      }
    } catch (error) { console.error('Erro ao consultar CNPJ:', error); }
  };

  const onSubmit = async (data: FornecedorFormData) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/fornecedores/${id}`, data);
        toast.success('Fornecedor atualizado com sucesso');
      } else {
        await api.post('/fornecedores', data);
        toast.success('Fornecedor cadastrado com sucesso');
      }
      navigate('/cadastros/fornecedores');
    } catch (error) {
      toast.error('Erro ao salvar fornecedor');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/cadastros/fornecedores')}>
          <Icons.arrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Atualize os dados do fornecedor' : 'Cadastre um novo fornecedor'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <Card className="p-6">
          {activeTab === 'dados' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="PJ" {...register('tipo')} className="w-4 h-4 text-red-500" />
                  <span>Pessoa Jurídica</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="PF" {...register('tipo')} className="w-4 h-4 text-red-500" />
                  <span>Pessoa Física</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={tipo === 'PJ' ? 'CNPJ *' : 'CPF *'} placeholder={tipo === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                  {...register('cpf_cnpj')} onBlur={(e) => tipo === 'PJ' && buscarCnpj(e.target.value)} error={errors.cpf_cnpj?.message} />
                <Input label="Inscrição Estadual" placeholder="000.000.000.000" {...register('inscricao_estadual')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={tipo === 'PJ' ? 'Razão Social *' : 'Nome *'} placeholder={tipo === 'PJ' ? 'Razão social da empresa' : 'Nome completo'}
                  {...register('razao_social')} error={errors.razao_social?.message} />
                <Input label="Nome Fantasia" placeholder="Nome fantasia" {...register('nome_fantasia')} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ativo" {...register('ativo')} className="w-4 h-4 text-red-500 rounded" />
                <label htmlFor="ativo" className="text-sm text-gray-700">Fornecedor ativo</label>
              </div>
            </div>
          )}

          {activeTab === 'endereco' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="CEP" placeholder="00000-000" {...register('cep')} onBlur={(e) => buscarCep(e.target.value)} />
                <div className="md:col-span-2">
                  <Input label="Logradouro" placeholder="Rua, Avenida, etc" {...register('logradouro')} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input label="Número" placeholder="Nº" {...register('numero')} />
                <div className="md:col-span-3">
                  <Input label="Complemento" placeholder="Sala, Andar, etc" {...register('complemento')} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Bairro" placeholder="Bairro" {...register('bairro')} />
                <Input label="Cidade" placeholder="Cidade" {...register('cidade')} />
                <Select label="UF" options={ufOptions} {...register('uf')} />
              </div>
            </div>
          )}

          {activeTab === 'contato' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Telefone" placeholder="(00) 0000-0000" {...register('telefone')} />
                <Input label="Celular" placeholder="(00) 00000-0000" {...register('celular')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="E-mail" type="email" placeholder="email@empresa.com.br" {...register('email')} error={errors.email?.message} />
                <Input label="Site" placeholder="https://www.empresa.com.br" {...register('site')} />
              </div>
            </div>
          )}

          {activeTab === 'comercial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select label="Tipo de Fornecedor" options={tipoFornecedorOptions} {...register('tipo_fornecedor')} />
                <Input label="Prazo de Entrega (dias)" type="number" min="0" {...register('prazo_entrega_dias', { valueAsNumber: true })} />
                <Input label="Avaliação (0-5)" type="number" min="0" max="5" {...register('avaliacao', { valueAsNumber: true })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Condição de Pagamento" placeholder="Ex: 30/60/90 dias" {...register('condicao_pagamento')} />
                <Input label="Categorias" placeholder="Ex: Drywall, Ferragens, Tintas" {...register('categorias')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea rows={4} placeholder="Observações sobre o fornecedor..." {...register('observacoes')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" />
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/cadastros/fornecedores')}>Cancelar</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (<><Icons.spinner className="w-4 h-4 animate-spin mr-2" />Salvando...</>) : (<><Icons.check className="w-4 h-4 mr-2" />{isEditing ? 'Atualizar' : 'Cadastrar'}</>)}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default FornecedorFormPage;
