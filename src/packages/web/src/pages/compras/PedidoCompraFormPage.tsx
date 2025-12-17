// =============================================
// PLANAC ERP - Pedido de Compra Form Page
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
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

const itemSchema = z.object({
  produto_id: z.string().min(1, 'Selecione o produto'),
  produto_nome: z.string().optional(),
  quantidade: z.number().min(1, 'Quantidade mínima é 1'),
  unidade: z.string().default('UN'),
  valor_unitario: z.number().min(0.01),
  desconto_percentual: z.number().min(0).max(100).default(0),
  valor_total: z.number(),
});

const pedidoCompraSchema = z.object({
  fornecedor_id: z.string().min(1, 'Selecione o fornecedor'),
  cotacao_id: z.string().optional(),
  condicao_pagamento_id: z.string().optional(),
  data_emissao: z.string(),
  data_entrega_prevista: z.string().optional(),
  frete_tipo: z.enum(['cif', 'fob']).default('cif'),
  frete_valor: z.number().default(0),
  desconto_total: z.number().default(0),
  itens: z.array(itemSchema).min(1, 'Adicione pelo menos um item'),
  observacao: z.string().optional(),
  observacao_interna: z.string().optional(),
  status: z.enum(['rascunho', 'enviado', 'confirmado', 'recebido_parcial', 'recebido', 'cancelado']).default('rascunho'),
});

type PedidoCompraFormData = z.infer<typeof pedidoCompraSchema>;

const freteOptions = [
  { value: 'cif', label: 'CIF - Frete por conta do Fornecedor' },
  { value: 'fob', label: 'FOB - Frete por conta do Comprador' },
];

const statusOptions = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado ao Fornecedor' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'recebido_parcial', label: 'Recebido Parcial' },
  { value: 'recebido', label: 'Recebido' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function PedidoCompraFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [condicoesPagamento, setCondicoesPagamento] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [searchProduto, setSearchProduto] = useState('');

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<PedidoCompraFormData>({
    resolver: zodResolver(pedidoCompraSchema),
    defaultValues: {
      data_emissao: new Date().toISOString().split('T')[0],
      frete_tipo: 'cif',
      frete_valor: 0,
      desconto_total: 0,
      status: 'rascunho',
      itens: [],
    },
  });

  const { fields: itens, append, remove, update } = useFieldArray({ control, name: 'itens' });
  const fornecedorId = watch('fornecedor_id');
  const freteValor = watch('frete_valor') || 0;
  const descontoTotal = watch('desconto_total') || 0;

  const subtotal = itens.reduce((acc, item) => acc + (item.valor_total || 0), 0);
  const total = subtotal + freteValor - descontoTotal;

  useEffect(() => { loadFornecedores(); loadCondicoesPagamento(); loadProdutos(); if (id) loadPedido(); }, [id]);

  useEffect(() => {
    if (fornecedorId) {
      const f = fornecedores.find((f) => f.id === fornecedorId);
      if (f?.condicao_pagamento_padrao) setValue('condicao_pagamento_id', f.condicao_pagamento_padrao);
    }
  }, [fornecedorId, fornecedores]);

  const loadPedido = async () => { setIsLoading(true); try { const r = await api.get(`/pedidos-compra/${id}`); Object.keys(r.data).forEach((k) => setValue(k as keyof PedidoCompraFormData, r.data[k])); } catch { toast.error('Erro'); navigate('/compras/pedidos'); } finally { setIsLoading(false); } };
  const loadFornecedores = async () => { try { const r = await api.get('/fornecedores?status=ativo'); setFornecedores(r.data || []); } catch {} };
  const loadCondicoesPagamento = async () => { try { const r = await api.get('/condicoes-pagamento'); setCondicoesPagamento(r.data || []); } catch {} };
  const loadProdutos = async () => { try { const r = await api.get('/produtos?ativo=true'); setProdutos(r.data || []); } catch {} };

  const adicionarItem = (produto: any) => {
    const idx = itens.findIndex((i) => i.produto_id === produto.id);
    if (idx >= 0) {
      const item = itens[idx];
      const novaQtd = item.quantidade + 1;
      update(idx, { ...item, quantidade: novaQtd, valor_total: novaQtd * item.valor_unitario * (1 - item.desconto_percentual / 100) });
    } else {
      append({
        produto_id: produto.id,
        produto_nome: produto.descricao || produto.nome,
        quantidade: 1,
        unidade: produto.unidade || 'UN',
        valor_unitario: produto.preco_custo || produto.preco || 0,
        desconto_percentual: 0,
        valor_total: produto.preco_custo || produto.preco || 0,
      });
    }
    setSearchProduto('');
  };

  const atualizarItem = (index: number, campo: string, valor: any) => {
    const item = itens[index];
    const novoItem = { ...item, [campo]: valor };
    const subtotalItem = novoItem.quantidade * novoItem.valor_unitario;
    novoItem.valor_total = subtotalItem * (1 - novoItem.desconto_percentual / 100);
    update(index, novoItem);
  };

  const onSubmit = async (data: PedidoCompraFormData) => {
    setIsSaving(true);
    try {
      const payload = { ...data, subtotal, total };
      if (isEditing) { await api.put(`/pedidos-compra/${id}`, payload); toast.success('Atualizado!'); }
      else { await api.post('/pedidos-compra', payload); toast.success('Cadastrado!'); }
      navigate('/compras/pedidos');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro'); } finally { setIsSaving(false); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const produtosFiltrados = produtos.filter((p) => p.descricao?.toLowerCase().includes(searchProduto.toLowerCase()) || p.codigo?.toLowerCase().includes(searchProduto.toLowerCase())).slice(0, 10);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/compras/pedidos')} className="p-2 hover:bg-gray-100 rounded-lg"><Icons.arrowLeft className="w-5 h-5" /></button>
          <div><h1 className="text-2xl font-bold">{isEditing ? 'Editar' : 'Novo'} Pedido de Compra</h1><p className="text-gray-500">{isEditing ? 'Atualize os dados' : 'Registre um pedido ao fornecedor'}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/compras/pedidos')}>Cancelar</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSaving}><Icons.save className="w-4 h-4 mr-2" />{isEditing ? 'Atualizar' : 'Salvar'}</Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Dados do Pedido</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2"><Select label="Fornecedor *" {...register('fornecedor_id')} error={errors.fornecedor_id?.message} options={[{ value: '', label: 'Selecione...' }, ...fornecedores.map(f => ({ value: f.id, label: f.nome_fantasia || f.razao_social }))]} /></div>
            <div><Input label="Data Emissão" type="date" {...register('data_emissao')} /></div>
            <div><Input label="Previsão Entrega" type="date" {...register('data_entrega_prevista')} /></div>
            <div><Select label="Condição de Pagamento" {...register('condicao_pagamento_id')} options={[{ value: '', label: 'Selecione...' }, ...condicoesPagamento.map(c => ({ value: c.id, label: c.nome }))]} /></div>
            <div><Select label="Tipo de Frete" {...register('frete_tipo')} options={freteOptions} /></div>
            <div><Input label="Valor do Frete" type="number" step="0.01" {...register('frete_valor', { valueAsNumber: true })} /></div>
            <div><Select label="Status" {...register('status')} options={statusOptions} /></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Itens do Pedido</h3>
            <div className="relative w-80">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchProduto} onChange={(e) => setSearchProduto(e.target.value)} placeholder="Buscar produto..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
              {searchProduto.length >= 2 && produtosFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                  {produtosFiltrados.map((produto) => (
                    <button key={produto.id} type="button" onClick={() => adicionarItem(produto)} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between">
                      <div><p className="text-sm font-medium">{produto.descricao || produto.nome}</p><p className="text-xs text-gray-500">{produto.codigo}</p></div>
                      <span className="text-sm text-gray-600">{formatCurrency(produto.preco_custo || produto.preco || 0)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {errors.itens && <p className="text-red-500 text-sm mb-4">{errors.itens.message}</p>}

          {itens.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b"><th className="px-4 py-3 text-left text-xs font-semibold">Produto</th><th className="px-4 py-3 text-center text-xs font-semibold w-24">Qtde</th><th className="px-4 py-3 text-center text-xs font-semibold w-20">Un</th><th className="px-4 py-3 text-right text-xs font-semibold w-32">Vlr Unit</th><th className="px-4 py-3 text-center text-xs font-semibold w-24">Desc %</th><th className="px-4 py-3 text-right text-xs font-semibold w-32">Total</th><th className="px-4 py-3 text-center text-xs font-semibold w-16">Ação</th></tr></thead>
                <tbody className="divide-y">{itens.map((item, i) => (<tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3"><p className="text-sm font-medium">{item.produto_nome}</p></td><td className="px-4 py-3"><Input type="number" min={1} value={item.quantidade} onChange={(e) => atualizarItem(i, 'quantidade', parseInt(e.target.value) || 1)} className="w-20 text-center" /></td><td className="px-4 py-3 text-center text-sm">{item.unidade}</td><td className="px-4 py-3"><Input type="number" step="0.01" value={item.valor_unitario} onChange={(e) => atualizarItem(i, 'valor_unitario', parseFloat(e.target.value) || 0)} className="w-28 text-right" /></td><td className="px-4 py-3"><Input type="number" min={0} max={100} value={item.desconto_percentual} onChange={(e) => atualizarItem(i, 'desconto_percentual', parseFloat(e.target.value) || 0)} className="w-20 text-center" /></td><td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(item.valor_total)}</td><td className="px-4 py-3 text-center"><button type="button" onClick={() => remove(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Icons.trash className="w-4 h-4" /></button></td></tr>))}</tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Icons.package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum item adicionado</p><p className="text-sm">Use a busca acima para adicionar produtos</p>
            </div>
          )}

          {itens.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Frete:</span><span>{formatCurrency(freteValor)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Desconto:</span><span className="text-red-500">- {formatCurrency(descontoTotal)}</span></div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total:</span><span className="text-green-600">{formatCurrency(total)}</span></div>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Observações para o Fornecedor</h3>
            <textarea {...register('observacao')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Informações para o fornecedor..." />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Observações Internas</h3>
            <textarea {...register('observacao_interna')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Notas internas..." />
          </Card>
        </div>
      </form>
    </div>
  );
}

export default PedidoCompraFormPage;
