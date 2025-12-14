// =============================================
// PLANAC ERP - Produto Form Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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

const produtoSchema = z.object({
  codigo: z.string().min(1, 'Código obrigatório'),
  codigo_barras: z.string().optional(),
  descricao: z.string().min(3, 'Mínimo 3 caracteres'),
  descricao_complementar: z.string().optional(),
  unidade: z.string().min(1, 'Unidade obrigatória'),
  categoria_id: z.string().optional(),
  marca: z.string().optional(),
  ncm: z.string().optional(),
  cest: z.string().optional(),
  origem: z.string().optional(),
  preco_custo: z.number().min(0),
  preco_venda: z.number().min(0),
  margem: z.number().optional(),
  estoque_minimo: z.number().min(0),
  estoque_maximo: z.number().optional(),
  localizacao: z.string().optional(),
  peso_bruto: z.number().optional(),
  peso_liquido: z.number().optional(),
  ativo: z.boolean().default(true),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

const tabs = [
  { id: 'dados', label: 'Dados Gerais', icon: Icons.package },
  { id: 'fiscal', label: 'Fiscal', icon: Icons.fileText },
  { id: 'precos', label: 'Preços', icon: Icons.dollarSign },
  { id: 'estoque', label: 'Estoque', icon: Icons.archive },
];

const unidadeOptions = [
  { value: 'UN', label: 'UN - Unidade' },
  { value: 'CX', label: 'CX - Caixa' },
  { value: 'PC', label: 'PC - Peça' },
  { value: 'M', label: 'M - Metro' },
  { value: 'M2', label: 'M² - Metro Quadrado' },
  { value: 'M3', label: 'M³ - Metro Cúbico' },
  { value: 'KG', label: 'KG - Quilograma' },
  { value: 'L', label: 'L - Litro' },
  { value: 'FD', label: 'FD - Fardo' },
  { value: 'SC', label: 'SC - Saco' },
];

const origemOptions = [
  { value: '0', label: '0 - Nacional' },
  { value: '1', label: '1 - Estrangeira - Importação direta' },
  { value: '2', label: '2 - Estrangeira - Adquirida no mercado interno' },
  { value: '3', label: '3 - Nacional - Conteúdo de importação > 40%' },
  { value: '4', label: '4 - Nacional - Processos básicos' },
  { value: '5', label: '5 - Nacional - Conteúdo de importação <= 40%' },
  { value: '6', label: '6 - Estrangeira - Importação direta, sem similar' },
  { value: '7', label: '7 - Estrangeira - Adquirida, sem similar nacional' },
  { value: '8', label: '8 - Nacional - Conteúdo de importação > 70%' },
];

export function ProdutoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const duplicarId = searchParams.get('duplicar');
  const toast = useToast();
  const isEditing = Boolean(id);

  const [activeTab, setActiveTab] = useState('dados');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categorias, setCategorias] = useState<{ value: string; label: string }[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      unidade: 'UN',
      origem: '0',
      preco_custo: 0,
      preco_venda: 0,
      estoque_minimo: 0,
      ativo: true,
    },
  });

  const precoCusto = watch('preco_custo');
  const precoVenda = watch('preco_venda');

  useEffect(() => {
    loadCategorias();
    if (id) {
      loadProduto(id);
    } else if (duplicarId) {
      loadProduto(duplicarId, true);
    }
  }, [id, duplicarId]);

  // Calcular margem automaticamente
  useEffect(() => {
    if (precoCusto && precoVenda && precoCusto > 0) {
      const margem = ((precoVenda - precoCusto) / precoCusto) * 100;
      setValue('margem', Number(margem.toFixed(2)));
    }
  }, [precoCusto, precoVenda]);

  const loadCategorias = async () => {
    try {
      const response = await api.get('/categorias');
      if (response.success) {
        setCategorias(response.data.map((c: any) => ({ value: c.id, label: c.nome })));
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadProduto = async (produtoId: string, isDuplicar = false) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/produtos/${produtoId}`);
      if (response.success) {
        const data = response.data;
        if (isDuplicar) {
          // Limpar campos únicos ao duplicar
          delete data.id;
          data.codigo = '';
          data.codigo_barras = '';
        }
        reset(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar produto');
      navigate('/produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const buscarCosmos = async (codigoBarras: string) => {
    if (!codigoBarras || codigoBarras.length < 8) return;

    try {
      toast.info('Buscando produto no Cosmos...');
      const response = await api.get(`/integracoes/cosmos/gtin/${codigoBarras}`);
      
      if (response.success && response.data) {
        const { description, ncm, cest, brand, gross_weight, net_weight } = response.data;
        
        if (description) setValue('descricao', description);
        if (ncm?.code) setValue('ncm', ncm.code);
        if (cest?.code) setValue('cest', cest.code);
        if (brand?.name) setValue('marca', brand.name);
        if (gross_weight) setValue('peso_bruto', gross_weight);
        if (net_weight) setValue('peso_liquido', net_weight);
        
        toast.success('Dados importados do Cosmos!');
      }
    } catch (error) {
      console.error('Erro ao buscar Cosmos:', error);
    }
  };

  const onSubmit = async (data: ProdutoFormData) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/produtos/${id}`, data);
        toast.success('Produto atualizado com sucesso');
      } else {
        await api.post('/produtos', data);
        toast.success('Produto cadastrado com sucesso');
      }
      navigate('/produtos');
    } catch (error) {
      toast.error('Erro ao salvar produto');
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
        <Button variant="ghost" onClick={() => navigate('/produtos')}>
          <Icons.arrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Produto' : duplicarId ? 'Duplicar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Atualize os dados do produto' : 'Cadastre um novo produto'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
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

        <Card>
          {/* Dados Gerais */}
          {activeTab === 'dados' && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Código"
                  {...register('codigo')}
                  error={errors.codigo?.message}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Código de Barras (EAN/GTIN)"
                  {...register('codigo_barras')}
                  error={errors.codigo_barras?.message}
                  onBlur={(e) => buscarCosmos(e.target.value)}
                  rightIcon={
                    <button
                      type="button"
                      className="text-gray-400 hover:text-planac-500"
                      title="Buscar no Cosmos"
                    >
                      <Icons.search className="w-4 h-4" />
                    </button>
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Select
                  label="Unidade"
                  value={watch('unidade')}
                  onChange={(v) => setValue('unidade', v)}
                  options={unidadeOptions}
                  error={errors.unidade?.message}
                  required
                />
              </div>
              <div className="md:col-span-6">
                <Input
                  label="Descrição"
                  {...register('descricao')}
                  error={errors.descricao?.message}
                  required
                />
              </div>
              <div className="md:col-span-6">
                <Input
                  label="Descrição Complementar"
                  {...register('descricao_complementar')}
                  error={errors.descricao_complementar?.message}
                />
              </div>
              <div className="md:col-span-3">
                <Select
                  label="Categoria"
                  value={watch('categoria_id') || ''}
                  onChange={(v) => setValue('categoria_id', v)}
                  options={categorias}
                  placeholder="Selecione..."
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Marca"
                  {...register('marca')}
                  error={errors.marca?.message}
                />
              </div>
              <div className="md:col-span-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('ativo')}
                    className="w-5 h-5 rounded border-gray-300 text-planac-500 focus:ring-planac-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Produto ativo</span>
                </label>
              </div>
            </div>
          )}

          {/* Fiscal */}
          {activeTab === 'fiscal' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="NCM"
                {...register('ncm')}
                error={errors.ncm?.message}
                placeholder="00000000"
                maxLength={8}
              />
              <Input
                label="CEST"
                {...register('cest')}
                error={errors.cest?.message}
                placeholder="0000000"
                maxLength={7}
              />
              <Select
                label="Origem"
                value={watch('origem') || '0'}
                onChange={(v) => setValue('origem', v)}
                options={origemOptions}
              />
              <Input
                label="Peso Bruto (kg)"
                type="number"
                step="0.001"
                {...register('peso_bruto', { valueAsNumber: true })}
                error={errors.peso_bruto?.message}
              />
              <Input
                label="Peso Líquido (kg)"
                type="number"
                step="0.001"
                {...register('peso_liquido', { valueAsNumber: true })}
                error={errors.peso_liquido?.message}
              />
            </div>
          )}

          {/* Preços */}
          {activeTab === 'precos' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Preço de Custo"
                type="number"
                step="0.01"
                {...register('preco_custo', { valueAsNumber: true })}
                error={errors.preco_custo?.message}
                leftIcon={<span className="text-gray-400 text-sm">R$</span>}
              />
              <Input
                label="Preço de Venda"
                type="number"
                step="0.01"
                {...register('preco_venda', { valueAsNumber: true })}
                error={errors.preco_venda?.message}
                leftIcon={<span className="text-gray-400 text-sm">R$</span>}
              />
              <Input
                label="Margem (%)"
                type="number"
                step="0.01"
                {...register('margem', { valueAsNumber: true })}
                error={errors.margem?.message}
                disabled
                rightIcon={<span className="text-gray-400 text-sm">%</span>}
              />

              {/* Info de margem */}
              {precoCusto > 0 && precoVenda > 0 && (
                <div className="md:col-span-3 bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Lucro por unidade:</span>{' '}
                    <span className="text-green-600 font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoVenda - precoCusto)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Estoque */}
          {activeTab === 'estoque' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Estoque Mínimo"
                type="number"
                {...register('estoque_minimo', { valueAsNumber: true })}
                error={errors.estoque_minimo?.message}
              />
              <Input
                label="Estoque Máximo"
                type="number"
                {...register('estoque_maximo', { valueAsNumber: true })}
                error={errors.estoque_maximo?.message}
              />
              <Input
                label="Localização"
                {...register('localizacao')}
                error={errors.localizacao?.message}
                placeholder="Ex: A-01-02"
              />
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => navigate('/produtos')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ProdutoFormPage;
