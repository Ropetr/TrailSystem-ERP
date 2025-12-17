// =============================================
// PLANAC ERP - Cotação de Compra Form Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

const itemCotacaoSchema = z.object({
  produto_id: z.string().min(1, 'Selecione o produto'),
  produto_nome: z.string().optional(),
  quantidade: z.number().min(1),
  unidade: z.string().default('UN'),
  especificacao: z.string().optional(),
});

const fornecedorCotacaoSchema = z.object({
  fornecedor_id: z.string(),
  fornecedor_nome: z.string().optional(),
  status: z.enum(['pendente', 'respondido', 'vencedor', 'recusado']).default('pendente'),
});

const cotacaoSchema = z.object({
  titulo: z.string().min(3, 'Título é obrigatório'),
  descricao: z.string().optional(),
  data_emissao: z.string(),
  data_limite_resposta: z.string(),
  itens: z.array(itemCotacaoSchema).min(1, 'Adicione pelo menos um item'),
  fornecedores: z.array(fornecedorCotacaoSchema).min(1, 'Adicione pelo menos um fornecedor'),
  observacao: z.string().optional(),
  status: z.enum(['rascunho', 'enviada', 'em_analise', 'finalizada', 'cancelada']).default('rascunho'),
});

type CotacaoFormData = z.infer<typeof cotacaoSchema>;

const statusOptions = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export function CotacaoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'itens' | 'fornecedores'>('itens');
  const [fornecedoresDisponiveis, setFornecedoresDisponiveis] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [searchProduto, setSearchProduto] = useState('');
  const [searchFornecedor, setSearchFornecedor] = useState('');

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<CotacaoFormData>({
    resolver: zodResolver(cotacaoSchema),
    defaultValues: {
      data_emissao: new Date().toISOString().split('T')[0],
      data_limite_resposta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'rascunho',
      itens: [],
      fornecedores: [],
    },
  });

  const { fields: itens, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'itens' });
  const { fields: fornecedores, append: appendFornecedor, remove: removeFornecedor } = useFieldArray({ control, name: 'fornecedores' });

  useEffect(() => { loadFornecedores(); loadProdutos(); if (id) loadCotacao(); }, [id]);

  const loadCotacao = async () => { setIsLoading(true); try { const r = await api.get(`/cotacoes/${id}`); Object.keys(r.data).forEach((k) => setValue(k as keyof CotacaoFormData, r.data[k])); } catch { toast.error('Erro'); navigate('/compras/cotacoes'); } finally { setIsLoading(false); } };
  const loadFornecedores = async () => { try { const r = await api.get('/fornecedores?status=ativo'); setFornecedoresDisponiveis(r.data || []); } catch {} };
  const loadProdutos = async () => { try { const r = await api.get('/produtos?ativo=true'); setProdutos(r.data || []); } catch {} };

  const adicionarItem = (produto: any) => {
    if (itens.some((i) => i.produto_id === produto.id)) { toast.info('Produto já adicionado'); return; }
    appendItem({ produto_id: produto.id, produto_nome: produto.descricao || produto.nome, quantidade: 1, unidade: produto.unidade || 'UN', especificacao: '' });
    setSearchProduto('');
  };

  const adicionarFornecedor = (fornecedor: any) => {
    if (fornecedores.some((f) => f.fornecedor_id === fornecedor.id)) { toast.info('Fornecedor já adicionado'); return; }
    appendFornecedor({ fornecedor_id: fornecedor.id, fornecedor_nome: fornecedor.nome_fantasia || fornecedor.razao_social, status: 'pendente' });
    setSearchFornecedor('');
  };

  const onSubmit = async (data: CotacaoFormData) => {
    setIsSaving(true);
    try {
      if (isEditing) { await api.put(`/cotacoes/${id}`, data); toast.success('Atualizada!'); }
      else { await api.post('/cotacoes', data); toast.success('Cadastrada!'); }
      navigate('/compras/cotacoes');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro'); } finally { setIsSaving(false); }
  };

  const enviarCotacao = async () => {
    if (itens.length === 0) { toast.error('Adicione pelo menos um item'); return; }
    if (fornecedores.length === 0) { toast.error('Adicione pelo menos um fornecedor'); return; }
    setValue('status', 'enviada');
    handleSubmit(onSubmit)();
  };

  const produtosFiltrados = produtos.filter((p) => p.descricao?.toLowerCase().includes(searchProduto.toLowerCase()) || p.codigo?.toLowerCase().includes(searchProduto.toLowerCase())).slice(0, 10);
  const fornecedoresFiltrados = fornecedoresDisponiveis.filter((f) => f.razao_social?.toLowerCase().includes(searchFornecedor.toLowerCase()) || f.nome_fantasia?.toLowerCase().includes(searchFornecedor.toLowerCase())).slice(0, 10);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/compras/cotacoes')} className="p-2 hover:bg-gray-100 rounded-lg"><Icons.arrowLeft className="w-5 h-5" /></button>
          <div><h1 className="text-2xl font-bold">{isEditing ? 'Editar' : 'Nova'} Cotação de Compra</h1><p className="text-gray-500">{isEditing ? 'Atualize os dados' : 'Solicite preços de fornecedores'}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/compras/cotacoes')}>Cancelar</Button>
          {watch('status') === 'rascunho' && <Button variant="outline" onClick={enviarCotacao}><Icons.send className="w-4 h-4 mr-2" />Enviar aos Fornecedores</Button>}
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSaving}><Icons.save className="w-4 h-4 mr-2" />{isEditing ? 'Atualizar' : 'Salvar'}</Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Dados da Cotação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2"><Input label="Título *" {...register('titulo')} error={errors.titulo?.message} placeholder="Ex: Cotação de materiais Drywall" /></div>
            <div><Input label="Data Emissão" type="date" {...register('data_emissao')} /></div>
            <div><Input label="Limite para Resposta *" type="date" {...register('data_limite_resposta')} /></div>
            <div className="lg:col-span-3"><Input label="Descrição" {...register('descricao')} placeholder="Detalhes adicionais" /></div>
            <div><Select label="Status" {...register('status')} options={statusOptions} /></div>
          </div>
        </Card>

        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button type="button" onClick={() => setActiveTab('itens')} className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'itens' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icons.package className="w-4 h-4" />Itens ({itens.length})
            </button>
            <button type="button" onClick={() => setActiveTab('fornecedores')} className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'fornecedores' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icons.building className="w-4 h-4" />Fornecedores ({fornecedores.length})
            </button>
          </nav>
        </div>

        {activeTab === 'itens' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Itens para Cotação</h3>
              <div className="relative w-80">
                <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchProduto} onChange={(e) => setSearchProduto(e.target.value)} placeholder="Buscar produto..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                {searchProduto.length >= 2 && produtosFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                    {produtosFiltrados.map((p) => (<button key={p.id} type="button" onClick={() => adicionarItem(p)} className="w-full px-4 py-2 text-left hover:bg-gray-50"><p className="text-sm font-medium">{p.descricao || p.nome}</p><p className="text-xs text-gray-500">{p.codigo} | {p.unidade}</p></button>))}
                  </div>
                )}
              </div>
            </div>
            {errors.itens && <p className="text-red-500 text-sm mb-4">{errors.itens.message}</p>}
            {itens.length > 0 ? (
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b"><th className="px-4 py-3 text-left text-xs font-semibold">Produto</th><th className="px-4 py-3 text-center text-xs font-semibold w-24">Qtde</th><th className="px-4 py-3 text-center text-xs font-semibold w-20">Un</th><th className="px-4 py-3 text-left text-xs font-semibold">Especificação</th><th className="px-4 py-3 text-center text-xs font-semibold w-16">Ação</th></tr></thead>
                <tbody className="divide-y">{itens.map((item, i) => (<tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3"><p className="text-sm font-medium">{item.produto_nome}</p></td><td className="px-4 py-3"><Input type="number" min={1} {...register(`itens.${i}.quantidade`, { valueAsNumber: true })} className="w-20 text-center" /></td><td className="px-4 py-3 text-center text-sm">{item.unidade}</td><td className="px-4 py-3"><Input {...register(`itens.${i}.especificacao`)} placeholder="Detalhes, marca, etc." className="w-full" /></td><td className="px-4 py-3 text-center"><button type="button" onClick={() => removeItem(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Icons.trash className="w-4 h-4" /></button></td></tr>))}</tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500"><Icons.package className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>Nenhum item adicionado</p></div>
            )}
          </Card>
        )}

        {activeTab === 'fornecedores' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Fornecedores para Cotação</h3>
              <div className="relative w-80">
                <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchFornecedor} onChange={(e) => setSearchFornecedor(e.target.value)} placeholder="Buscar fornecedor..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                {searchFornecedor.length >= 2 && fornecedoresFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                    {fornecedoresFiltrados.map((f) => (<button key={f.id} type="button" onClick={() => adicionarFornecedor(f)} className="w-full px-4 py-2 text-left hover:bg-gray-50"><p className="text-sm font-medium">{f.nome_fantasia || f.razao_social}</p><p className="text-xs text-gray-500">{f.cnpj}</p></button>))}
                  </div>
                )}
              </div>
            </div>
            {errors.fornecedores && <p className="text-red-500 text-sm mb-4">{errors.fornecedores.message}</p>}
            {fornecedores.length > 0 ? (
              <div className="grid gap-4">
                {fornecedores.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"><Icons.building className="w-5 h-5 text-gray-500" /></div>
                      <div><p className="font-medium">{f.fornecedor_nome}</p><Badge variant={f.status === 'vencedor' ? 'success' : f.status === 'respondido' ? 'info' : f.status === 'recusado' ? 'danger' : 'default'}>{f.status === 'pendente' ? 'Aguardando' : f.status === 'respondido' ? 'Respondido' : f.status === 'vencedor' ? 'Vencedor' : 'Recusado'}</Badge></div>
                    </div>
                    <button type="button" onClick={() => removeFornecedor(i)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Icons.trash className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500"><Icons.building className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>Nenhum fornecedor adicionado</p></div>
            )}
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          <textarea {...register('observacao')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Condições especiais, requisitos de entrega..." />
        </Card>
      </form>
    </div>
  );
}

export default CotacaoFormPage;
