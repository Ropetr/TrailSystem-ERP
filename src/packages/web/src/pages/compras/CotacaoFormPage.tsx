// =============================================
// PLANAC ERP - Cotação de Compra Form Page
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

const cotacaoSchema = z.object({
  descricao: z.string().min(3, 'Descrição é obrigatória'),
  data_abertura: z.string().min(1, 'Data de abertura é obrigatória'),
  data_limite_resposta: z.string().optional(),
  comprador_id: z.string().optional(),
  observacao: z.string().optional(),
});

type CotacaoFormData = z.infer<typeof cotacaoSchema>;

interface ItemCotacao { id: string; produto_id: string; produto_codigo: string; produto_nome: string; quantidade: number; unidade: string; }
interface FornecedorCotacao { id: string; fornecedor_id: string; fornecedor_nome: string; status: string; }

export function CotacaoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [compradores, setCompradores] = useState<any[]>([]);
  const [itens, setItens] = useState<ItemCotacao[]>([]);
  const [fornecedoresCotacao, setFornecedoresCotacao] = useState<FornecedorCotacao[]>([]);
  
  const [modalProduto, setModalProduto] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtosFiltrados, setProdutosFiltrados] = useState<any[]>([]);
  const [quantidadeAdd, setQuantidadeAdd] = useState(1);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [modalFornecedor, setModalFornecedor] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CotacaoFormData>({
    resolver: zodResolver(cotacaoSchema),
    defaultValues: { data_abertura: new Date().toISOString().split('T')[0] },
  });

  useEffect(() => { loadFornecedores(); loadProdutos(); loadCompradores(); if (id) loadCotacao(); }, [id]);

  useEffect(() => {
    if (buscaProduto.length >= 2) {
      setProdutosFiltrados(produtos.filter(p => p.nome?.toLowerCase().includes(buscaProduto.toLowerCase()) || p.codigo?.toLowerCase().includes(buscaProduto.toLowerCase())).slice(0, 10));
    } else { setProdutosFiltrados([]); }
  }, [buscaProduto, produtos]);

  const loadFornecedores = async () => { try { const r = await api.get('/fornecedores?ativo=true&limit=1000'); setFornecedores(r.data.data || []); } catch (e) { console.error(e); } };
  const loadProdutos = async () => { try { const r = await api.get('/produtos?ativo=true&limit=5000'); setProdutos(r.data.data || []); } catch (e) { console.error(e); } };
  const loadCompradores = async () => { try { const r = await api.get('/usuarios?ativo=true'); setCompradores(r.data.data || []); } catch (e) { console.error(e); } };
  const loadCotacao = async () => { try { setLoading(true); const r = await api.get(`/cotacoes/${id}`); reset(r.data); setItens(r.data.itens || []); setFornecedoresCotacao(r.data.fornecedores || []); } catch (e) { toast({ title: 'Erro', variant: 'destructive' }); navigate('/compras/cotacoes'); } finally { setLoading(false); } };

  const adicionarItem = () => {
    if (!produtoSelecionado || quantidadeAdd <= 0) { toast({ title: 'Selecione produto e quantidade', variant: 'destructive' }); return; }
    setItens([...itens, { id: `t-${Date.now()}`, produto_id: produtoSelecionado.id, produto_codigo: produtoSelecionado.codigo || '', produto_nome: produtoSelecionado.nome, quantidade: quantidadeAdd, unidade: produtoSelecionado.unidade || 'UN' }]);
    setModalProduto(false); setBuscaProduto(''); setProdutoSelecionado(null); setQuantidadeAdd(1);
  };

  const removerItem = (itemId: string) => setItens(itens.filter(i => i.id !== itemId));

  const adicionarFornecedor = (fid: string) => {
    const f = fornecedores.find(x => x.id === fid);
    if (!f) return;
    if (fornecedoresCotacao.some(x => x.fornecedor_id === fid)) { toast({ title: 'Já adicionado', variant: 'destructive' }); return; }
    setFornecedoresCotacao([...fornecedoresCotacao, { id: `t-${Date.now()}`, fornecedor_id: fid, fornecedor_nome: f.razao_social, status: 'pendente' }]);
    setModalFornecedor(false);
  };

  const removerFornecedor = (id: string) => setFornecedoresCotacao(fornecedoresCotacao.filter(f => f.id !== id));

  const onSubmit = async (data: CotacaoFormData) => {
    if (itens.length === 0) { toast({ title: 'Adicione itens', variant: 'destructive' }); return; }
    if (fornecedoresCotacao.length === 0) { toast({ title: 'Adicione fornecedores', variant: 'destructive' }); return; }
    try {
      const payload = { ...data, itens: itens.map(i => ({ produto_id: i.produto_id, produto_codigo: i.produto_codigo, produto_nome: i.produto_nome, quantidade: i.quantidade, unidade: i.unidade })), fornecedores: fornecedoresCotacao.map(f => ({ fornecedor_id: f.fornecedor_id, fornecedor_nome: f.fornecedor_nome })) };
      if (isEditing) { await api.put(`/cotacoes/${id}`, payload); toast({ title: 'Atualizada!' }); }
      else { await api.post('/cotacoes', payload); toast({ title: 'Cadastrada!' }); }
      navigate('/compras/cotacoes');
    } catch (e: any) { toast({ title: 'Erro', description: e.response?.data?.message || 'Tente novamente', variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Icons.spinner className="w-8 h-8 animate-spin text-red-500" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/compras/cotacoes')}><Icons.arrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
        <div><h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar Cotação' : 'Nova Cotação'}</h1><p className="text-sm text-gray-500">{isEditing ? 'Atualize' : 'Preencha os dados'}</p></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados da Cotação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label><Input {...register('descricao')} placeholder="Ex: Cotação materiais obra X" error={errors.descricao?.message} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Data Abertura *</label><Input {...register('data_abertura')} type="date" error={errors.data_abertura?.message} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Limite Resposta</label><Input {...register('data_limite_resposta')} type="date" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Comprador</label><Select {...register('comprador_id')} options={compradores.map(c => ({ value: c.id, label: c.nome }))} placeholder="Selecione..." /></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-gray-900">Itens</h2><Button type="button" onClick={() => setModalProduto(true)}><Icons.plus className="w-4 h-4 mr-2" />Adicionar</Button></div>
          {itens.length === 0 ? <div className="text-center py-8 text-gray-500"><Icons.package className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhum item</p></div> : (
            <table className="w-full"><thead><tr className="bg-gray-50 border-b"><th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Código</th><th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Produto</th><th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Qtde</th><th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Un</th><th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Ação</th></tr></thead>
            <tbody className="divide-y">{itens.map(i => <tr key={i.id} className="hover:bg-gray-50"><td className="px-4 py-2 text-sm font-mono">{i.produto_codigo}</td><td className="px-4 py-2 text-sm">{i.produto_nome}</td><td className="px-4 py-2 text-sm text-right">{i.quantidade}</td><td className="px-4 py-2 text-sm text-center">{i.unidade}</td><td className="px-4 py-2 text-center"><Button type="button" variant="ghost" size="sm" onClick={() => removerItem(i.id)}><Icons.trash className="w-4 h-4 text-red-500" /></Button></td></tr>)}</tbody></table>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-gray-900">Fornecedores</h2><Button type="button" onClick={() => setModalFornecedor(true)}><Icons.plus className="w-4 h-4 mr-2" />Adicionar</Button></div>
          {fornecedoresCotacao.length === 0 ? <div className="text-center py-8 text-gray-500"><Icons.building className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhum fornecedor</p></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{fornecedoresCotacao.map(f => <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="font-medium text-sm">{f.fornecedor_nome}</p><span className={`text-xs px-2 py-0.5 rounded ${f.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{f.status}</span></div><Button type="button" variant="ghost" size="sm" onClick={() => removerFornecedor(f.id)}><Icons.x className="w-4 h-4 text-gray-500" /></Button></div>)}</div>
          )}
        </Card>

        <Card className="p-6"><h2 className="text-lg font-semibold text-gray-900 mb-4">Observações</h2><textarea {...register('observacao')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Observações..." /></Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/compras/cotacoes')}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Icons.spinner className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><Icons.check className="w-4 h-4 mr-2" />{isEditing ? 'Atualizar' : 'Criar'}</>}</Button>
        </div>
      </form>

      {modalProduto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Adicionar Item</h3><Button type="button" variant="ghost" size="sm" onClick={() => setModalProduto(false)}><Icons.x className="w-5 h-5" /></Button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Buscar Produto</label><Input value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} placeholder="Nome ou código..." />
                {produtosFiltrados.length > 0 && <div className="mt-2 border rounded-lg max-h-40 overflow-auto">{produtosFiltrados.map(p => <button key={p.id} type="button" onClick={() => { setProdutoSelecionado(p); setBuscaProduto(p.nome); setProdutosFiltrados([]); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b last:border-b-0"><span className="font-mono text-gray-500">{p.codigo}</span> - {p.nome}</button>)}</div>}
              </div>
              {produtoSelecionado && (<><div className="p-3 bg-gray-50 rounded-lg text-sm"><p><strong>Produto:</strong> {produtoSelecionado.nome}</p><p><strong>Un:</strong> {produtoSelecionado.unidade || 'UN'}</p></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label><Input type="number" min="1" value={quantidadeAdd} onChange={(e) => setQuantidadeAdd(Number(e.target.value))} /></div></>)}
            </div>
            <div className="flex justify-end gap-2 mt-6"><Button type="button" variant="outline" onClick={() => setModalProduto(false)}>Cancelar</Button><Button type="button" onClick={adicionarItem} disabled={!produtoSelecionado}>Adicionar</Button></div>
          </div>
        </div>
      )}

      {modalFornecedor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Adicionar Fornecedor</h3><Button type="button" variant="ghost" size="sm" onClick={() => setModalFornecedor(false)}><Icons.x className="w-5 h-5" /></Button></div>
            <div className="max-h-96 overflow-auto space-y-2">{fornecedores.filter(f => !fornecedoresCotacao.some(fc => fc.fornecedor_id === f.id)).map(f => <button key={f.id} type="button" onClick={() => adicionarFornecedor(f.id)} className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg border"><p className="font-medium">{f.razao_social}</p><p className="text-sm text-gray-500">{f.cpf_cnpj}</p></button>)}</div>
            <div className="flex justify-end mt-6"><Button type="button" variant="outline" onClick={() => setModalFornecedor(false)}>Fechar</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CotacaoFormPage;
