// =============================================
// PLANAC ERP - Produto Form Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import api from '@/services/api';

const produtoSchema = z.object({
  codigo: z.string().min(1, 'Código obrigatório'),
  codigo_barras: z.string().optional(),
  descricao: z.string().min(3, 'Descrição obrigatória (mínimo 3 caracteres)'),
  descricao_completa: z.string().optional(),
  unidade: z.string().min(1, 'Unidade obrigatória'),
  categoria_id: z.string().optional(),
  marca: z.string().optional(),
  // Fiscal
  ncm: z.string().optional(),
  cest: z.string().optional(),
  origem: z.string().optional(),
  // Preços
  preco_custo: z.number().min(0).optional(),
  preco_venda: z.number().min(0, 'Preço de venda obrigatório'),
  margem: z.number().optional(),
  // Estoque
  estoque_atual: z.number().min(0).optional(),
  estoque_minimo: z.number().min(0).optional(),
  estoque_maximo: z.number().min(0).optional(),
  localizacao: z.string().optional(),
  // Peso/Dimensões
  peso_bruto: z.number().min(0).optional(),
  peso_liquido: z.number().min(0).optional(),
  largura: z.number().min(0).optional(),
  altura: z.number().min(0).optional(),
  profundidade: z.number().min(0).optional(),
  // Outros
  ativo: z.boolean().default(true),
  observacoes: z.string().optional(),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

const unidadeOptions = [
  { value: 'UN', label: 'UN - Unidade' },
  { value: 'PC', label: 'PC - Peça' },
  { value: 'CX', label: 'CX - Caixa' },
  { value: 'KG', label: 'KG - Quilograma' },
  { value: 'M', label: 'M - Metro' },
  { value: 'M2', label: 'M² - Metro Quadrado' },
  { value: 'M3', label: 'M³ - Metro Cúbico' },
  { value: 'L', label: 'L - Litro' },
  { value: 'PAR', label: 'PAR - Par' },
  { value: 'FD', label: 'FD - Fardo' },
];

const origemOptions = [
  { value: '0', label: '0 - Nacional' },
  { value: '1', label: '1 - Estrangeira (Import. Direta)' },
  { value: '2', label: '2 - Estrangeira (Mercado Interno)' },
  { value: '3', label: '3 - Nacional (Import. > 40%)' },
  { value: '4', label: '4 - Nacional (Processos Básicos)' },
  { value: '5', label: '5 - Nacional (Import. < 40%)' },
  { value: '6', label: '6 - Estrangeira (Import. Direta s/ Similar)' },
  { value: '7', label: '7 - Estrangeira (Mercado Int. s/ Similar)' },
  { value: '8', label: '8 - Nacional (Import. > 70%)' },
];

export function ProdutoFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditing = Boolean(id);
  const duplicarId = searchParams.get('duplicar');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'precos' | 'estoque' | 'fiscal' | 'dimensoes'>('geral');
  const [categorias, setCategorias] = useState<{ value: string; label: string }[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      unidade: 'UN',
      origem: '0',
      ativo: true,
      preco_custo: 0,
      preco_venda: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
    },
  });

  const precoCusto = watch('preco_custo') || 0;
  const precoVenda = watch('preco_venda') || 0;
  const margem = precoCusto > 0 ? ((precoVenda - precoCusto) / precoCusto) * 100 : 0;

  useEffect(() => {
    loadCategorias();
    if (isEditing) {
      loadProduto(id!);
    } else if (duplicarId) {
      loadProduto(duplicarId, true);
    }
  }, [id, duplicarId]);

  const loadCategorias = async () => {
    try {
      const response = await api.get('/categorias');
      if (response.success) {
        setCategorias(response.data.map((c: any) => ({ value: c.id, label: c.nome })));
      }
    } catch (error) {
      console.error('Erro ao carregar categorias');
    }
  };

  const loadProduto = async (produtoId: string, isDuplicating = false) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/produtos/${produtoId}`);
      if (response.success && response.data) {
        const data = response.data;
        if (isDuplicating) {
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

  const buscarCodigo = async (codigoBarras: string) => {
    if (!codigoBarras || codigoBarras.length < 8) return;

    try {
      toast.info('Buscando produto no Cosmos...');
      // Implementar busca no Bluesoft Cosmos
      // const response = await api.get(`/cosmos/gtin/${codigoBarras}`);
    } catch (error) {
      console.error('Erro ao buscar no Cosmos:', error);
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
        toast.success('Produto criado com sucesso');
      }
      navigate('/produtos');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar produto');
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
    { id: 'geral', label: 'Dados Gerais', icon: <Icons.package className="w-4 h-4" /> },
    { id: 'precos', label: 'Preços', icon: <Icons.dollarSign className="w-4 h-4" /> },
    { id: 'estoque', label: 'Estoque', icon: <Icons.archive className="w-4 h-4" /> },
    { id: 'fiscal', label: 'Fiscal', icon: <Icons.fileText className="w-4 h-4" /> },
    { id: 'dimensoes', label: 'Dimensões', icon: <Icons.box className="w-4 h-4" /> },
  ];

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
            {isEditing ? 'Atualize os dados do produto' : 'Preencha os dados do novo produto'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
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

        {/* Tab: Geral */}
        {activeTab === 'geral' && (
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Código"
                  {...register('codigo')}
                  placeholder="SKU do produto"
                  error={errors.codigo?.message}
                  required
                />
                <Input
                  label="Código de Barras (EAN/GTIN)"
                  {...register('codigo_barras')}
                  placeholder="7891234567890"
                  onBlur={(e) => buscarCodigo(e.target.value)}
                  rightIcon={
                    <button type="button" className="text-gray-400 hover:text-red-500">
                      <Icons.search className="w-4 h-4" />
                    </button>
                  }
                />
                <Select
                  label="Unidade"
                  value={watch('unidade')}
                  onChange={(v) => setValue('unidade', v)}
                  options={unidadeOptions}
                  error={errors.unidade?.message}
                />
              </div>

              <Input
                label="Descrição"
                {...register('descricao')}
                placeholder="Nome do produto"
                error={errors.descricao?.message}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Categoria"
                  value={watch('categoria_id') || ''}
                  onChange={(v) => setValue('categoria_id', v)}
                  options={categorias}
                  placeholder="Selecione..."
                />
                <Input
                  label="Marca"
                  {...register('marca')}
                  placeholder="Marca/Fabricante"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição Completa
                </label>
                <textarea
                  {...register('descricao_completa')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none"
                  placeholder="Descrição detalhada do produto..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('ativo')}
                  className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Produto Ativo</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Preços */}
        {activeTab === 'precos' && (
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Preço de Custo"
                  type="number"
                  step="0.01"
                  {...register('preco_custo', { valueAsNumber: true })}
                  placeholder="0,00"
                  leftIcon={<span className="text-gray-400">R$</span>}
                />
                <Input
                  label="Preço de Venda"
                  type="number"
                  step="0.01"
                  {...register('preco_venda', { valueAsNumber: true })}
                  placeholder="0,00"
                  leftIcon={<span className="text-gray-400">R$</span>}
                  error={errors.preco_venda?.message}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margem
                  </label>
                  <div className={`px-4 py-2 rounded-xl border ${
                    margem > 0 ? 'bg-green-50 border-green-200 text-green-700' : 
                    margem < 0 ? 'bg-red-50 border-red-200 text-red-700' : 
                    'bg-gray-50 border-gray-200 text-gray-700'
                  }`}>
                    <span className="text-lg font-bold">{margem.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <h4 className="font-medium text-blue-800 mb-2">Cálculo de Margem</h4>
                <p className="text-sm text-blue-600">
                  Custo: R$ {precoCusto.toFixed(2)} → Venda: R$ {precoVenda.toFixed(2)} = 
                  Lucro: R$ {(precoVenda - precoCusto).toFixed(2)} ({margem.toFixed(2)}%)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Estoque */}
        {activeTab === 'estoque' && (
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Estoque Atual"
                  type="number"
                  {...register('estoque_atual', { valueAsNumber: true })}
                  placeholder="0"
                />
                <Input
                  label="Estoque Mínimo"
                  type="number"
                  {...register('estoque_minimo', { valueAsNumber: true })}
                  placeholder="0"
                />
                <Input
                  label="Estoque Máximo"
                  type="number"
                  {...register('estoque_maximo', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
              <Input
                label="Localização"
                {...register('localizacao')}
                placeholder="Corredor A, Prateleira 3..."
                className="md:w-1/2"
              />
            </CardContent>
          </Card>
        )}

        {/* Tab: Fiscal */}
        {activeTab === 'fiscal' && (
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="NCM"
                  {...register('ncm')}
                  placeholder="0000.00.00"
                  maxLength={10}
                />
                <Input
                  label="CEST"
                  {...register('cest')}
                  placeholder="00.000.00"
                  maxLength={9}
                />
                <Select
                  label="Origem"
                  value={watch('origem') || '0'}
                  onChange={(v) => setValue('origem', v)}
                  options={origemOptions}
                />
              </div>

              <div className="p-4 bg-yellow-50 rounded-xl">
                <h4 className="font-medium text-yellow-800 mb-2">
                  <Icons.alertTriangle className="w-4 h-4 inline mr-2" />
                  Informações Fiscais
                </h4>
                <p className="text-sm text-yellow-700">
                  O NCM e CEST são obrigatórios para emissão de NF-e. 
                  Utilize a busca por código de barras para preencher automaticamente via Cosmos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Dimensões */}
        {activeTab === 'dimensoes' && (
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Peso Bruto (kg)"
                  type="number"
                  step="0.001"
                  {...register('peso_bruto', { valueAsNumber: true })}
                  placeholder="0,000"
                />
                <Input
                  label="Peso Líquido (kg)"
                  type="number"
                  step="0.001"
                  {...register('peso_liquido', { valueAsNumber: true })}
                  placeholder="0,000"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Largura (cm)"
                  type="number"
                  step="0.1"
                  {...register('largura', { valueAsNumber: true })}
                  placeholder="0,0"
                />
                <Input
                  label="Altura (cm)"
                  type="number"
                  step="0.1"
                  {...register('altura', { valueAsNumber: true })}
                  placeholder="0,0"
                />
                <Input
                  label="Profundidade (cm)"
                  type="number"
                  step="0.1"
                  {...register('profundidade', { valueAsNumber: true })}
                  placeholder="0,0"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/produtos')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ProdutoFormPage;
