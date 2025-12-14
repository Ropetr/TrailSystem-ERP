// =============================================
// PLANAC ERP - Cliente Form Page
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

// Schema de validação
const clienteSchema = z.object({
  tipo: z.enum(['PF', 'PJ']),
  // Pessoa Física
  nome: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  data_nascimento: z.string().optional(),
  // Pessoa Jurídica
  razao_social: z.string().optional(),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().optional(),
  ie: z.string().optional(),
  im: z.string().optional(),
  // Endereço
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  // Contato
  telefone: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  // Comercial
  vendedor_id: z.string().optional(),
  tabela_preco_id: z.string().optional(),
  condicao_pagamento_id: z.string().optional(),
  limite_credito: z.number().optional(),
  // Status
  ativo: z.boolean().default(true),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

const tabs = [
  { id: 'dados', label: 'Dados Gerais', icon: Icons.user },
  { id: 'endereco', label: 'Endereço', icon: Icons.mapPin },
  { id: 'contato', label: 'Contato', icon: Icons.phone },
  { id: 'comercial', label: 'Comercial', icon: Icons.dollarSign },
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

export function ClienteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditing = Boolean(id);

  const [activeTab, setActiveTab] = useState('dados');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [vendedores, setVendedores] = useState<{ value: string; label: string }[]>([]);
  const [tabelasPreco, setTabelasPreco] = useState<{ value: string; label: string }[]>([]);
  const [condicoesPagamento, setCondicoesPagamento] = useState<{ value: string; label: string }[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo: 'PJ',
      ativo: true,
      limite_credito: 0,
    },
  });

  const tipo = watch('tipo');

  useEffect(() => {
    loadOptions();
    if (id) {
      loadCliente();
    }
  }, [id]);

  const loadOptions = async () => {
    try {
      // Carregar vendedores, tabelas de preço, condições de pagamento
      const [vendedoresRes, tabelasRes, condicoesRes] = await Promise.all([
        api.get('/usuarios?perfil=vendedor'),
        api.get('/tabelas-preco'),
        api.get('/condicoes-pagamento'),
      ]);

      if (vendedoresRes.success) {
        setVendedores(vendedoresRes.data.map((v: any) => ({ value: v.id, label: v.nome })));
      }
      if (tabelasRes.success) {
        setTabelasPreco(tabelasRes.data.map((t: any) => ({ value: t.id, label: t.nome })));
      }
      if (condicoesRes.success) {
        setCondicoesPagamento(condicoesRes.data.map((c: any) => ({ value: c.id, label: c.nome })));
      }
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

  const loadCliente = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/clientes/${id}`);
      if (response.success) {
        reset(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar cliente');
      navigate('/clientes');
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

  const onSubmit = async (data: ClienteFormData) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/clientes/${id}`, data);
        toast.success('Cliente atualizado com sucesso');
      } else {
        await api.post('/clientes', data);
        toast.success('Cliente cadastrado com sucesso');
      }
      navigate('/clientes');
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="w-8 h-8 animate-spin text-planac-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/clientes')}>
          <Icons.arrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Tipo de Cliente */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Tipo de Cliente:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue('tipo', 'PJ')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tipo === 'PJ'
                    ? 'bg-planac-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pessoa Jurídica
              </button>
              <button
                type="button"
                onClick={() => setValue('tipo', 'PF')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tipo === 'PF'
                    ? 'bg-planac-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pessoa Física
              </button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-planac-500 text-planac-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <Card>
          {/* Dados Gerais */}
          {activeTab === 'dados' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tipo === 'PJ' ? (
                <>
                  <Input
                    label="CNPJ"
                    {...register('cnpj')}
                    error={errors.cnpj?.message}
                    required
                  />
                  <Input
                    label="Inscrição Estadual"
                    {...register('ie')}
                    error={errors.ie?.message}
                  />
                  <Input
                    label="Razão Social"
                    {...register('razao_social')}
                    error={errors.razao_social?.message}
                    required
                    className="md:col-span-2"
                  />
                  <Input
                    label="Nome Fantasia"
                    {...register('nome_fantasia')}
                    error={errors.nome_fantasia?.message}
                    className="md:col-span-2"
                  />
                  <Input
                    label="Inscrição Municipal"
                    {...register('im')}
                    error={errors.im?.message}
                  />
                </>
              ) : (
                <>
                  <Input
                    label="CPF"
                    {...register('cpf')}
                    error={errors.cpf?.message}
                    required
                  />
                  <Input
                    label="RG"
                    {...register('rg')}
                    error={errors.rg?.message}
                  />
                  <Input
                    label="Nome Completo"
                    {...register('nome')}
                    error={errors.nome?.message}
                    required
                    className="md:col-span-2"
                  />
                  <Input
                    label="Data de Nascimento"
                    type="date"
                    {...register('data_nascimento')}
                    error={errors.data_nascimento?.message}
                  />
                </>
              )}
            </div>
          )}

          {/* Endereço */}
          {activeTab === 'endereco' && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="CEP"
                  {...register('cep')}
                  error={errors.cep?.message}
                  onBlur={(e) => buscarCep(e.target.value)}
                  rightIcon={
                    <button type="button" className="text-gray-400 hover:text-planac-500">
                      <Icons.search className="w-4 h-4" />
                    </button>
                  }
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  label="Logradouro"
                  {...register('logradouro')}
                  error={errors.logradouro?.message}
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  label="Número"
                  {...register('numero')}
                  error={errors.numero?.message}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Complemento"
                  {...register('complemento')}
                  error={errors.complemento?.message}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Bairro"
                  {...register('bairro')}
                  error={errors.bairro?.message}
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  label="Cidade"
                  {...register('cidade')}
                  error={errors.cidade?.message}
                />
              </div>
              <div className="md:col-span-2">
                <Select
                  label="UF"
                  value={watch('uf') || ''}
                  onChange={(v) => setValue('uf', v)}
                  options={ufOptions}
                  error={errors.uf?.message}
                />
              </div>
            </div>
          )}

          {/* Contato */}
          {activeTab === 'contato' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Telefone"
                {...register('telefone')}
                error={errors.telefone?.message}
              />
              <Input
                label="Celular"
                {...register('celular')}
                error={errors.celular?.message}
              />
              <Input
                label="E-mail"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                className="md:col-span-2"
              />
            </div>
          )}

          {/* Comercial */}
          {activeTab === 'comercial' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Vendedor"
                value={watch('vendedor_id') || ''}
                onChange={(v) => setValue('vendedor_id', v)}
                options={vendedores}
                placeholder="Selecione o vendedor"
              />
              <Select
                label="Tabela de Preço"
                value={watch('tabela_preco_id') || ''}
                onChange={(v) => setValue('tabela_preco_id', v)}
                options={tabelasPreco}
                placeholder="Selecione a tabela"
              />
              <Select
                label="Condição de Pagamento"
                value={watch('condicao_pagamento_id') || ''}
                onChange={(v) => setValue('condicao_pagamento_id', v)}
                options={condicoesPagamento}
                placeholder="Selecione a condição"
              />
              <Input
                label="Limite de Crédito"
                type="number"
                step="0.01"
                {...register('limite_credito', { valueAsNumber: true })}
                error={errors.limite_credito?.message}
                leftIcon={<span className="text-gray-400 text-sm">R$</span>}
              />
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('ativo')}
                    className="w-5 h-5 rounded border-gray-300 text-planac-500 focus:ring-planac-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Cliente ativo</span>
                </label>
              </div>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => navigate('/clientes')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ClienteFormPage;
