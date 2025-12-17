// =============================================
// PLANAC ERP - Conta a Receber Form Page
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

const parcelaSchema = z.object({
  numero: z.number(),
  vencimento: z.string(),
  valor: z.number().min(0.01),
  status: z.enum(['pendente', 'paga', 'vencida', 'cancelada']).default('pendente'),
});

const contaReceberSchema = z.object({
  cliente_id: z.string().min(1, 'Selecione o cliente'),
  venda_id: z.string().optional(),
  orcamento_id: z.string().optional(),
  categoria_id: z.string().optional(),
  numero_documento: z.string().optional(),
  tipo_documento: z.enum(['boleto', 'duplicata', 'nota_fiscal', 'recibo', 'outros']),
  descricao: z.string().min(3, 'Descrição é obrigatória'),
  valor_total: z.number().min(0.01, 'Valor deve ser maior que zero'),
  data_emissao: z.string(),
  data_vencimento: z.string(),
  forma_pagamento: z.enum(['boleto', 'pix', 'transferencia', 'dinheiro', 'cheque', 'cartao_credito', 'cartao_debito']),
  num_parcelas: z.number().min(1).max(48).default(1),
  parcelas: z.array(parcelaSchema).optional(),
  observacao: z.string().optional(),
  gerar_boleto: z.boolean().default(false),
});

type ContaReceberFormData = z.infer<typeof contaReceberSchema>;

const tipoDocumentoOptions = [
  { value: 'boleto', label: 'Boleto' },
  { value: 'duplicata', label: 'Duplicata' },
  { value: 'nota_fiscal', label: 'Nota Fiscal' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'outros', label: 'Outros' },
];

const formaPagamentoOptions = [
  { value: 'boleto', label: 'Boleto' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cartao_credito', label: 'Cartão Crédito' },
  { value: 'cartao_debito', label: 'Cartão Débito' },
];

export function ContaReceberFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<ContaReceberFormData>({
    resolver: zodResolver(contaReceberSchema),
    defaultValues: {
      tipo_documento: 'boleto',
      forma_pagamento: 'boleto',
      num_parcelas: 1,
      data_emissao: new Date().toISOString().split('T')[0],
      gerar_boleto: false,
      parcelas: [],
    },
  });

  const { fields: parcelas, replace: setParcelas } = useFieldArray({ control, name: 'parcelas' });
  const valorTotal = watch('valor_total');
  const numParcelas = watch('num_parcelas');
  const dataVencimento = watch('data_vencimento');
  const formaPagamento = watch('forma_pagamento');
  const clienteId = watch('cliente_id');

  useEffect(() => { loadClientes(); loadCategorias(); if (id) loadConta(); }, [id]);
  useEffect(() => { if (clienteId) { const c = clientes.find((c) => c.id === clienteId); setClienteSelecionado(c); } }, [clienteId, clientes]);
  useEffect(() => { if (valorTotal && numParcelas && dataVencimento) gerarParcelas(); }, [valorTotal, numParcelas, dataVencimento]);

  const loadConta = async () => { setIsLoading(true); try { const r = await api.get(`/contas-receber/${id}`); Object.keys(r.data).forEach((k) => setValue(k as keyof ContaReceberFormData, r.data[k])); } catch { toast.error('Erro'); navigate('/financeiro/receber'); } finally { setIsLoading(false); } };
  const loadClientes = async () => { try { const r = await api.get('/clientes?ativo=true'); setClientes(r.data || []); } catch {} };
  const loadCategorias = async () => { try { const r = await api.get('/categorias?tipo=receita'); setCategorias(r.data || []); } catch {} };

  const gerarParcelas = () => {
    const v = valorTotal || 0, q = numParcelas || 1;
    const venc = dataVencimento ? new Date(dataVencimento) : new Date();
    const vp = Math.floor((v / q) * 100) / 100;
    const resto = Math.round((v - vp * q) * 100) / 100;
    setParcelas(Array.from({ length: q }, (_, i) => {
      const d = new Date(venc); d.setMonth(d.getMonth() + i);
      return { numero: i + 1, vencimento: d.toISOString().split('T')[0], valor: i === q - 1 ? vp + resto : vp, status: 'pendente' as const };
    }));
  };

  const onSubmit = async (data: ContaReceberFormData) => {
    setIsSaving(true);
    try {
      if (isEditing) { await api.put(`/contas-receber/${id}`, data); toast.success('Atualizada!'); }
      else { await api.post('/contas-receber', data); toast.success('Cadastrada!'); }
      navigate('/financeiro/receber');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro'); } finally { setIsSaving(false); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/financeiro/receber')} className="p-2 hover:bg-gray-100 rounded-lg"><Icons.arrowLeft className="w-5 h-5" /></button>
          <div><h1 className="text-2xl font-bold">{isEditing ? 'Editar' : 'Nova'} Conta a Receber</h1><p className="text-gray-500">{isEditing ? 'Atualize os dados' : 'Registre uma receita'}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/financeiro/receber')}>Cancelar</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSaving}><Icons.save className="w-4 h-4 mr-2" />{isEditing ? 'Atualizar' : 'Salvar'}</Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Select label="Cliente *" {...register('cliente_id')} error={errors.cliente_id?.message} options={[{ value: '', label: 'Selecione...' }, ...clientes.map(c => ({ value: c.id, label: c.nome_fantasia || c.razao_social || c.nome }))]} /></div>
            {clienteSelecionado && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600"><strong>CPF/CNPJ:</strong> {clienteSelecionado.cpf || clienteSelecionado.cnpj}</p>
                <p className="text-sm text-gray-600"><strong>Telefone:</strong> {clienteSelecionado.telefone || clienteSelecionado.celular || '-'}</p>
                <p className="text-sm text-gray-600"><strong>Email:</strong> {clienteSelecionado.email || '-'}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Dados da Conta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><Select label="Tipo Documento" {...register('tipo_documento')} options={tipoDocumentoOptions} /></div>
            <div><Input label="Nº Documento" {...register('numero_documento')} /></div>
            <div className="lg:col-span-2"><Input label="Descrição *" {...register('descricao')} error={errors.descricao?.message} /></div>
            <div><Select label="Categoria" {...register('categoria_id')} options={[{ value: '', label: 'Selecione...' }, ...categorias.map(c => ({ value: c.id, label: c.nome }))]} /></div>
            <div><Input label="Venda Relacionada" {...register('venda_id')} placeholder="ID da venda" /></div>
            <div><Input label="Orçamento Relacionado" {...register('orcamento_id')} placeholder="ID do orçamento" /></div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Valores e Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div><Input label="Valor Total *" type="number" step="0.01" {...register('valor_total', { valueAsNumber: true })} error={errors.valor_total?.message} /></div>
            <div><Input label="Data Emissão" type="date" {...register('data_emissao')} /></div>
            <div><Input label="Data Vencimento *" type="date" {...register('data_vencimento')} /></div>
            <div><Select label="Forma Pagamento" {...register('forma_pagamento')} options={formaPagamentoOptions} /></div>
            <div><Input label="Nº Parcelas" type="number" min={1} max={48} {...register('num_parcelas', { valueAsNumber: true })} /></div>
          </div>
          {formaPagamento === 'boleto' && (
            <div className="mt-4 pt-4 border-t"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" {...register('gerar_boleto')} className="rounded text-red-500" /><span className="text-sm font-medium">Gerar boleto automaticamente (via TecnoSpeed)</span></label></div>
          )}
        </Card>

        {parcelas.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Parcelas</h3>
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b"><th className="px-4 py-3 text-left text-xs font-semibold">Parcela</th><th className="px-4 py-3 text-left text-xs font-semibold">Vencimento</th><th className="px-4 py-3 text-right text-xs font-semibold">Valor</th><th className="px-4 py-3 text-center text-xs font-semibold">Status</th></tr></thead>
              <tbody className="divide-y">{parcelas.map((p, i) => (<tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm">{p.numero}/{parcelas.length}</td><td className="px-4 py-3"><Input type="date" {...register(`parcelas.${i}.vencimento`)} className="w-40" /></td><td className="px-4 py-3 text-right"><Input type="number" step="0.01" {...register(`parcelas.${i}.valor`, { valueAsNumber: true })} className="w-32 text-right" /></td><td className="px-4 py-3 text-center"><Badge variant="warning">Pendente</Badge></td></tr>))}</tbody>
              <tfoot><tr className="bg-gray-50 font-semibold"><td colSpan={2} className="px-4 py-3 text-right">Total:</td><td className="px-4 py-3 text-right text-green-600">{formatCurrency(parcelas.reduce((a, p) => a + (p.valor || 0), 0))}</td><td></td></tr></tfoot>
            </table>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          <textarea {...register('observacao')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Informações adicionais..." />
        </Card>
      </form>
    </div>
  );
}

export default ContaReceberFormPage;
