// =============================================
// PLANAC ERP - Pedido de Compra Form Page
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

const pedidoCompraSchema = z.object({
  fornecedor_id: z.string().min(1, 'Selecione o fornecedor'),
  data_emissao: z.string().min(1, 'Data de emissão é obrigatória'),
  data_previsao_entrega: z.string().optional(),
  condicao_pagamento: z.string().optional(),
  valor_frete: z.number().optional(),
  valor_outras_despesas: z.number().optional(),
  observacao: z.string().optional(),
});

type PedidoCompraFormData = z.infer<typeof pedidoCompraSchema>;

interface ItemPedido {
  id: string;
  produto_id: string;
  produto_codigo: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
}

export function PedidoCompraFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<any>(null);
  
  const [modalProduto, setModalProduto] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtosFiltrados, setProdutosFiltrados] = useState<any[]>([]);
  const [quantidadeAdd, setQuantidadeAdd] = useState(1);
  const [precoAdd, setPrecoAdd] = useState(0);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<PedidoCompraFormData>({
    resolver: zodResolver(pedidoCompraSchema),
    defaultValues: { data_emissao: new Date().toISOString().split('T')[0], valor_frete: 0, valor_outras_despesas: 0 },
  });

  const valorFrete = watch('valor_frete') || 0;
  const valorOutras = watch('valor_outras_despesas') || 0;
  const subtotal = itens.reduce((acc, item) => acc + item.valor_total, 0);
  const valorTotal = subtotal + valorFrete + valorOutras;

  useEffect(() => { loadFornecedores(); loadProdutos(); if (id) loadPedido(); }, [id]);

  useEffect(() => {
    if (buscaProduto.length >= 2) {
      setProdutosFiltrados(produtos.filter(p => p.nome?.toLowerCase().includes(buscaProduto.toLowerCase()) || p.codigo?.toLowerCase().includes(buscaProduto.toLowerCase())).slice(0, 10));
    } else { setProdutosFiltrados([]); }
  }, [buscaProduto, produtos]);

  const loadFornecedores = async () => { try { const r = await api.get('/fornecedores?ativo=true&limit=1000'); setFornecedores(r.data.data || []); } catch (e) { console.error(e); } };
  const loadProdutos = async () => { try { const r = await api.get('/produtos?ativo=true&limit=5000'); setProdutos(r.data.data || []); } catch (e) { console.error(e); } };
  const loadPedido = async () => {
    try { setLoading(true); const r = await api.get(`/pedidos-compra/${id}`); reset(r.data); setItens(r.data.itens || []); }
    catch (e) { toast({ title: 'Erro ao carregar', variant: 'destructive' }); navigate('/compras/pedidos'); }
    finally { setLoading(false); }
  };

  const handleFornecedorChange = (fid: string) => {
    setValue('fornecedor_id', fid);
    const f = fornecedores.find(x => x.id === fid);
    setFornecedorSelecionado(f);
    if (f?.condicao_pagamento) setValue('condicao_pagamento', f.condicao_pagamento);
  };

  const adicionarItem = () => {
    if (!produtoSelecionado || quantidadeAdd <= 0 || precoAdd <= 0) { toast({ title: 'Preencha todos os campos', variant: 'destructive' }); return; }
    setItens([...itens, { id: `t-${Date.now()}`, produto_id: produtoSelecionado.id, produto_codigo: produtoSelecionado.codigo || '', produto_nome: produtoSelecionado.nome, quantidade: quantidadeAdd, preco_unitario: precoAdd, valor_total: quantidadeAdd * precoAdd }]);
    setModalProduto(false); setBuscaProduto(''); setProdutoSelecionado(null); setQuantidadeAdd(1); setPrecoAdd(0);
  };

  const removerItem = (itemId: string) => setItens(itens.filter(i => i.id !== itemId));

  const onSubmit = async (data: PedidoCompraFormData) => {
    if (itens.length === 0) { toast({ title: 'Adicione itens', variant: 'destructive' }); return; }
    try {
      const f = fornecedores.find(x => x.id === data.fornecedor_id);
      const payload = { ...data, fornecedor_nome: f?.razao_social || '', fornecedor_cnpj: f?.cpf_cnpj || '', subtotal, valor_total: valorTotal, itens: itens.map(i => ({ produto_id: i.produto_id, produto_codigo: i.produto_codigo, produto_nome: i.produto_nome, quantidade: i.quantidade, preco_unitario: i.preco_unitario, valor_total: i.valor_total })) };
      if (isEditing) { await api.put(`/pedidos-compra/${id}`, payload); toast({ title: 'Atualizado!' }); }
      else { await api.post('/pedidos-compra', payload); toast({ title: 'Cadastrado!' }); }
      navigate('/compras/pedidos');
    } catch (e: any) { toast({ title: 'Erro', description: e.response?.data?.message || 'Tente novamente', variant: 'destructive' }); }
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Icons.spinner className="w-8 h-8 animate-spin text-red-500" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/compras/pedidos')}><Icons.arrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
        <div><h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar Pedido' : 'Novo Pedido de Compra'}</h1><p className="text-sm text-gray-500">{isEditing ? 'Atualize' : 'Preencha os dados'}</p></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fornecedor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor *</label>
              <Select {...register('fornecedor_id')} options={fornecedores.map(f => ({ value: f.id, label: `${f.razao_social} - ${f.cpf_cnpj}` }))} placeholder="Selecione..." error={errors.fornecedor_id?.message} onChange={(e) => handleFornecedorChange(e.target.value)} />
            </div>
            {fornecedorSelecionado && <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg text-sm"><p><strong>Email:</strong> {fornecedorSelecionado.email || '-'}</p><p><strong>Prazo:</strong> {fornecedorSelecionado.prazo_entrega_dias || 0} dias</p></div>}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados do Pedido</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Data Emissão *</label><Input {...register('data_emissao')} type="date" error={errors.data_emissao?.message} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Previsão Entrega</label><Input {...register('data_previsao_entrega')} type="date" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Condição Pagto</label><Input {...register('condicao_pagamento')} placeholder="30/60/90" /></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Itens</h2>
            <Button type="button" onClick={() => setModalProduto(true)}><Icons.plus className="w-4 h-4 mr-2" />Adicionar</Button>
          </div>
          {itens.length === 0 ? <div className="text-center py-8 text-gray-500"><Icons.package className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhum item</p></div> : (
            <table className="w-full"><thead><tr className="bg-gray-50 border-b"><th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Código</th><th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Produto</th><th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Qtde</th><th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Preço</th><th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Total</th><th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Ação</th></tr></thead>
            <tbody className="divide-y">{itens.map(i => <tr key={i.id} className="hover:bg-gray-50"><td className="px-4 py-2 text-sm font-mono">{i.produto_codigo}</td><td className="px-4 py-2 text-sm">{i.produto_nome}</td><td className="px-4 py-2 text-sm text-right">{i.quantidade}</td><td className="px-4 py-2 text-sm text-right">{formatMoney(i.preco_unitario)}</td><td className="px-4 py-2 text-sm text-right font-medium">{formatMoney(i.valor_total)}</td><td className="px-4 py-2 text-center"><Button type="button" variant="ghost" size="sm" onClick={() => removerItem(i.id)}><Icons.trash className="w-4 h-4 text-red-500" /></Button></td></tr>)}</tbody></table>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Totais</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label><div className="px-3 py-2 bg-gray-100 rounded-lg font-medium">{formatMoney(subtotal)}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Frete</label><Input {...register('valor_frete', { valueAsNumber: true })} type="number" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Outras Despesas</label><Input {...register('valor_outras_despesas', { valueAsNumber: true })} type="number" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Total</label><div className="px-3 py-2 bg-red-50 rounded-lg font-bold text-red-600 text-lg">{formatMoney(valorTotal)}</div></div>
          </div>
        </Card>

        <Card className="p-6"><h2 className="text-lg font-semibold text-gray-900 mb-4">Observações</h2><textarea {...register('observacao')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Observações..." /></Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/compras/pedidos')}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Icons.spinner className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><Icons.check className="w-4 h-4 mr-2" />{isEditing ? 'Atualizar' : 'Cadastrar'}</>}</Button>
        </div>
      </form>

      {modalProduto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Adicionar Produto</h3><Button type="button" variant="ghost" size="sm" onClick={() => setModalProduto(false)}><Icons.x className="w-5 h-5" /></Button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Buscar Produto</label><Input value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} placeholder="Nome ou código..." />
                {produtosFiltrados.length > 0 && <div className="mt-2 border rounded-lg max-h-40 overflow-auto">{produtosFiltrados.map(p => <button key={p.id} type="button" onClick={() => { setProdutoSelecionado(p); setPrecoAdd(p.preco_custo || p.preco_venda || 0); setBuscaProduto(p.nome); setProdutosFiltrados([]); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b last:border-b-0"><span className="font-mono text-gray-500">{p.codigo}</span> - {p.nome}</button>)}</div>}
              </div>
              {produtoSelecionado && (<><div className="p-3 bg-gray-50 rounded-lg text-sm"><p><strong>Produto:</strong> {produtoSelecionado.nome}</p><p><strong>Código:</strong> {produtoSelecionado.codigo}</p></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label><Input type="number" min="1" value={quantidadeAdd} onChange={(e) => setQuantidadeAdd(Number(e.target.value))} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Preço Unit.</label><Input type="number" step="0.01" value={precoAdd} onChange={(e) => setPrecoAdd(Number(e.target.value))} /></div></div><div className="p-3 bg-red-50 rounded-lg flex justify-between"><span>Total:</span><span className="font-bold text-red-600">{formatMoney(quantidadeAdd * precoAdd)}</span></div></>)}
            </div>
            <div className="flex justify-end gap-2 mt-6"><Button type="button" variant="outline" onClick={() => setModalProduto(false)}>Cancelar</Button><Button type="button" onClick={adicionarItem} disabled={!produtoSelecionado}>Adicionar</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PedidoCompraFormPage;
