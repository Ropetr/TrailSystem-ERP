// =============================================
// PLANAC ERP - Conta a Pagar Form Page
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

const parcelaSchema = z.object({
  numero: z.number(),
  vencimento: z.string(),
  valor: z.number().min(0.01),
  status: z.enum(['pendente', 'paga', 'vencida', 'cancelada']).default('pendente'),
});

const contaPagarSchema = z.object({
  fornecedor_id: z.string().min(1, 'Selecione o fornecedor'),
  categoria_id: z.string().optional(),
  centro_custo_id: z.string().optional(),
  numero_documento: z.string().optional(),
  tipo_documento: z.enum(['boleto', 'fatura', 'nota_fiscal', 'recibo', 'outros']),
  descricao: z.string().min(3, 'Descrição é obrigatória'),
  valor_total: z.number().min(0.01, 'Valor deve ser maior que zero'),
  data_emissao: z.string(),
  data_vencimento: z.string(),
  forma_pagamento: z.enum(['boleto', 'pix', 'transferencia', 'dinheiro', 'cheque', 'cartao']),
  num_parcelas: z.number().min(1).max(48).default(1),
  parcelas: z.array(parcelaSchema).optional(),
  observacao: z.string().optional(),
  recorrente: z.boolean().default(false),
  frequencia_recorrencia: z.enum(['mensal', 'bimestral', 'trimestral', 'semestral', 'anual']).optional(),
});

type ContaPagarFormData = z.infer<typeof contaPagarSchema>;

const tipoDocumentoOptions = [
  { value: 'boleto', label: 'Boleto' },
  { value: 'fatura', label: 'Fatura' },
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
  { value: 'cartao', label: 'Cartão' },
];

const frequenciaOptions = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

export function ContaPagarFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: {
      tipo_documento: 'boleto',
      forma_pagamento: 'boleto',
      num_parcelas: 1,
      data_emissao: new Date().toISOString().split('T')[0],
      recorrente: false,
      parcelas: [],
    },
  });

  const { fields: parcelas, replace: setParcelas } = useFieldArray({ control, name: 'parcelas' });
  const valorTotal = watch('valor_total');
  const numParcelas = watch('num_parcelas');
  const dataVencimento = watch('data_vencimento');
  const isRecorrente = watch('recorrente');

  useEffect(() => { loadFornecedores(); loadCategorias(); loadCentrosCusto(); if (id) loadConta(); }, [id]);
  useEffect(() => { if (valorTotal && numParcelas && dataVencimento) gerarParcelas(); }, [valorTotal, numParcelas, dataVencimento]);

  const loadConta = async () => { setIsLoading(true); try { const r = await api.get(`/contas-pagar/${id}`); Object.keys(r.data).forEach((k) => setValue(k as keyof ContaPagarFormData, r.data[k])); } catch { toast.error('Erro'); navigate('/financeiro/pagar'); } finally { setIsLoading(false); } };
  const loadFornecedores = async () => { try { const r = await api.get('/fornecedores?status=ativo'); setFornecedores(r.data || []); } catch {} };
  const loadCategorias = async () => { try { const r = await api.get('/categorias?tipo=despesa'); setCategorias(r.data || []); } catch {} };
  const loadCentrosCusto = async () => { try { const r = await api.get('/centros-custo'); setCentrosCusto(r.data || []); } catch {} };

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

  const onSubmit = async (data: ContaPagarFormData) => {
    setIsSaving(true);
    try {
      if (isEditing) { await api.put(`/contas-pagar/${id}`, data); toast.success('Atualizada!'); }
      else { await api.post('/contas-pagar', data); toast.success('Cadastrada!'); }
      navigate('/financeiro/pagar');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro'); } finally { setIsSaving(false); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/financeiro/pagar')} className="p-2 hover:bg-gray-100 rounded-lg"><Icons.arrowLeft className="w-5 h-5" /></button>
          <div><h1 className="text-2xl font-bold">{isEditing ? 'Editar' : 'Nova'} Conta a Pagar</h1><p className="text-gray-500">{isEditing ? 'Atualize os dados' : 'Registre uma despesa'}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/financeiro/pagar')}>Cancelar</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSaving}><Icons.save className="w-4 h-4 mr-2" />{isEditing ? 'Atualizar' : 'Salvar'}</Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Dados da Conta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2"><Select label="Fornecedor *" {...register('fornecedor_id')} error={errors.fornecedor_id?.message} options={[{ value: '', label: 'Selecione...' }, ...fornecedores.map(f => ({ value: f.id, label: f.nome_fantasia || f.razao_social }))]} /></div>
            <div><Select label="Tipo Documento" {...register('tipo_documento')} options={tipoDocumentoOptions} /></div>
            <div><Input label="Nº Documento" {...register('numero_documento')} /></div>
            <div className="lg:col-span-2"><Input label="Descrição *" {...register('descricao')} error={errors.descricao?.message} /></div>
            <div><Select label="Categoria" {...register('categoria_id')} options={[{ value: '', label: 'Selecione...' }, ...categorias.map(c => ({ value: c.id, label: c.nome }))]} /></div>
            <div><Select label="Centro de Custo" {...register('centro_custo_id')} options={[{ value: '', label: 'Selecione...' }, ...centrosCusto.map(c => ({ value: c.id, label: c.nome }))]} /></div>
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
          <div className="mt-4 pt-4 border-t">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" {...register('recorrente')} className="rounded text-red-500" /><span className="text-sm font-medium">Conta recorrente</span></label>
            {isRecorrente && <div className="mt-3 w-48"><Select label="Frequência" {...register('frequencia_recorrencia')} options={frequenciaOptions} /></div>}
          </div>
        </Card>

        {parcelas.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Parcelas</h3>
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b"><th className="px-4 py-3 text-left text-xs font-semibold">Parcela</th><th className="px-4 py-3 text-left text-xs font-semibold">Vencimento</th><th className="px-4 py-3 text-right text-xs font-semibold">Valor</th><th className="px-4 py-3 text-center text-xs font-semibold">Status</th></tr></thead>
              <tbody className="divide-y">{parcelas.map((p, i) => (<tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm">{p.numero}/{parcelas.length}</td><td className="px-4 py-3"><Input type="date" {...register(`parcelas.${i}.vencimento`)} className="w-40" /></td><td className="px-4 py-3 text-right"><Input type="number" step="0.01" {...register(`parcelas.${i}.valor`, { valueAsNumber: true })} className="w-32 text-right" /></td><td className="px-4 py-3 text-center"><span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendente</span></td></tr>))}</tbody>
              <tfoot><tr className="bg-gray-50 font-semibold"><td colSpan={2} className="px-4 py-3 text-right">Total:</td><td className="px-4 py-3 text-right">{formatCurrency(parcelas.reduce((a, p) => a + (p.valor || 0), 0))}</td><td></td></tr></tfoot>
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

export default ContaPagarFormPage;
