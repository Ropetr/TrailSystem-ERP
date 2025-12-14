// =============================================
// PLANAC ERP - Cliente Form Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
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
  // Contato
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  // Endereço
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  // Comercial
  vendedor_id: z.string().optional(),
  tabela_preco_id: z.string().optional(),
  condicao_pagamento_id: z.string().optional(),
  limite_credito: z.number().min(0).optional(),
  // Observações
  observacoes: z.string().optional(),
  ativo: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.tipo === 'PF') {
      return data.nome && data.nome.length >= 3;
    }
    return data.razao_social && data.razao_social.length >= 3;
  },
  { message: 'Nome/Razão Social é obrigatório (mínimo 3 caracteres)', path: ['nome'] }
);

type ClienteFormData = z.infer<typeof clienteSchema>;

const tipoOptions = [
  { value: 'PJ', label: 'Pessoa Jurídica' },
  { value: 'PF', label: 'Pessoa Física' },
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
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'endereco' | 'comercial' | 'observacoes'>('dados');
  const [vendedores, setVendedores] = useState<{ value: string; label: string }[]>([]);
  const [tabelas, setTabelas] = useState<{ value: string; label: string }[]>([]);
  const [condicoes, setCondicoes] = useState<{ value: string; label: string }[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
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
    loadDependencies();
    if (isEditing) {
      loadCliente();
    }
  }, [id]);

  const loadDependencies = async () => {
    try {
      // Carregar vendedores, tabelas de preço e condições de pagamento
      const [vendRes, tabRes, condRes] = await Promise.all([
        api.get('/usuarios?perfil=vendedor').catch(() => ({ data: [] })),
        api.get('/tabelas-preco').catch(() => ({ data: [] })),
        api.get('/condicoes-pagamento').catch(() => ({ data: [] })),
      ]);

      setVendedores(vendRes.data?.map((v: any) => ({ value: v.id, label: v.nome })) || []);
      setTabelas(tabRes.data?.map((t: any) => ({ value: t.id, label: t.nome })) || []);
      setCondicoes(condRes.data?.map((c: any) => ({ value: c.id, label: c.nome })) || []);
    } catch (error) {
      console.error('Erro ao carregar dependências:', error);
    }
  };

  const loadCliente = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/clientes/${id}`);
      if (response.success && response.data) {
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
        setValue('logradouro', data.logradouro || '');
        setValue('bairro', data.bairro || '');
        setValue('cidade', data.localidade || '');
        setValue('uf', data.uf || '');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const buscarCnpj = async (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return;

    try {
      // Usando CPF.CNPJ API ou CNPJá conforme configurado
      toast.info('Buscando dados do CNPJ...');
      // Implementar chamada à API configurada
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
    }
  };

  const onSubmit = async (data: ClienteFormData) => {
    setIsSaving(true);
    try {
      // Montar payload com CPF ou CNPJ
      const payload = {
        ...data,
        cpf_cnpj: data.tipo === 'PF' ? data.cpf : data.cnpj,
      };

      if (isEditing) {
        await api.put(`/clientes/${id}`, payload);
        toast.success('Cliente atualizado com sucesso');
      } else {
        await api.post('/clientes', payload);
        toast.success('Cliente criado com sucesso');
      }
      navigate('/clientes');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar cliente');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'dados', label: 'Dados', icon: <Icons.user className="w-4 h-4" /> },
    { id: 'endereco', label: 'Endereço', icon: <Icons.mapPin className="w-4 h-4" /> },
    { id: 'comercial', label: 'Comercial', icon: <Icons.dollarSign className="w-4 h-4" /> },
    { id: 'observacoes', label: 'Observações', icon: <Icons.fileText className="w-4 h-4" /> },
  ];

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
            {isEditing ? 'Atualize os dados do cliente' : 'Preencha os dados do novo cliente'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab: Dados */}
        {activeTab === 'dados' && (
          <Card>
            <CardContent className="space-y-6">
              {/* Tipo */}
              <div className="w-48">
                <Select
                  label="Tipo de Cliente"
                  value={tipo}
                  onChange={(v) => setValue('tipo', v as 'PF' | 'PJ')}
                  options={tipoOptions}
                />
              </div>

              {/* Campos PJ */}
              {tipo === 'PJ' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="CNPJ"
                      {...register('cnpj')}
                      onBlur={(e) => buscarCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      error={errors.cnpj?.message}
                      rightIcon={
                        <button type="button" className="text-gray-400 hover:text-red-500">
                          <Icons.search className="w-4 h-4" />
                        </button>
                      }
                    />
                    <Input
                      label="Inscrição Estadual"
                      {...register('ie')}
                      placeholder="Inscrição Estadual"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Razão Social"
                      {...register('razao_social')}
                      placeholder="Razão Social da Empresa"
                      error={errors.razao_social?.message}
                      required
                    />
                    <Input
                      label="Nome Fantasia"
                      {...register('nome_fantasia')}
                      placeholder="Nome Fantasia"
                    />
                  </div>
                  <Input
                    label="Inscrição Municipal"
                    {...register('im')}
                    placeholder="Inscrição Municipal"
                    className="w-1/2"
                  />
                </>
              )}

              {/* Campos PF */}
              {tipo === 'PF' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="CPF"
                      {...register('cpf')}
                      placeholder="000.000.000-00"
                      error={errors.cpf?.message}
                    />
                    <Input
                      label="RG"
                      {...register('rg')}
                      placeholder="RG"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nome Completo"
                      {...register('nome')}
                      placeholder="Nome completo"
                      error={errors.nome?.message}
                      required
                    />
                    <Input
                      label="Data de Nascimento"
                      type="date"
                      {...register('data_nascimento')}
                    />
                  </div>
                </>
              )}

              {/* Contato */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="E-mail"
                    type="email"
                    {...register('email')}
                    placeholder="email@exemplo.com"
                    error={errors.email?.message}
                  />
                  <Input
                    label="Telefone"
                    {...register('telefone')}
                    placeholder="(00) 0000-0000"
                  />
                  <Input
                    label="Celular"
                    {...register('celular')}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Endereço */}
        {activeTab === 'endereco' && (
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="CEP"
                  {...register('cep')}
                  onBlur={(e) => buscarCep(e.target.value)}
                  placeholder="00000-000"
                  rightIcon={
                    <button type="button" className="text-gray-400 hover:text-red-500">
                      <Icons.search className="w-4 h-4" />
                    </button>
                  }
                />
                <div className="md:col-span-2">
                  <Input
                    label="Logradouro"
                    {...register('logradouro')}
                    placeholder="Rua, Avenida..."
                  />
                </div>
                <Input
                  label="Número"
                  {...register('numero')}
                  placeholder="Nº"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Complemento"
                  {...register('complemento')}
                  placeholder="Apto, Sala..."
                />
                <Input
                  label="Bairro"
                  {...register('bairro')}
                  placeholder="Bairro"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      label="Cidade"
                      {...register('cidade')}
                      placeholder="Cidade"
                    />
                  </div>
                  <Select
                    label="UF"
                    value={watch('uf') || ''}
                    onChange={(v) => setValue('uf', v)}
                    options={ufOptions}
                    placeholder="UF"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Comercial */}
        {activeTab === 'comercial' && (
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Vendedor Responsável"
                  value={watch('vendedor_id') || ''}
                  onChange={(v) => setValue('vendedor_id', v)}
                  options={vendedores}
                  placeholder="Selecione..."
                />
                <Select
                  label="Tabela de Preço"
                  value={watch('tabela_preco_id') || ''}
                  onChange={(v) => setValue('tabela_preco_id', v)}
                  options={tabelas}
                  placeholder="Selecione..."
                />
                <Select
                  label="Condição de Pagamento"
                  value={watch('condicao_pagamento_id') || ''}
                  onChange={(v) => setValue('condicao_pagamento_id', v)}
                  options={condicoes}
                  placeholder="Selecione..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Limite de Crédito"
                  type="number"
                  step="0.01"
                  {...register('limite_credito', { valueAsNumber: true })}
                  placeholder="0,00"
                  leftIcon={<span className="text-gray-400">R$</span>}
                />
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('ativo')}
                      className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Cliente Ativo</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Observações */}
        {activeTab === 'observacoes' && (
          <Card>
            <CardContent>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações Gerais
              </label>
              <textarea
                {...register('observacoes')}
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none"
                placeholder="Informações adicionais sobre o cliente..."
              />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/clientes')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ClienteFormPage;
