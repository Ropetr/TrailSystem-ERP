// =============================================
// PLANAC ERP - Conta a Receber Form Page
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
import { ClienteSelect } from '@/components/ui/ClienteSelect';
import api from '@/services/api';

const contaReceberSchema = z.object({
  cliente_id: z.string().min(1, 'Selecione o cliente'),
  numero_documento: z.string().optional(),
  origem: z.string().default('manual'),
  valor_original: z.number().min(0.01, 'Valor deve ser maior que zero'),
  valor_juros: z.number().optional(),
  valor_multa: z.number().optional(),
  valor_desconto: z.number().optional(),
  valor_acrescimo: z.number().optional(),
  data_emissao: z.string().min(1, 'Data de emissão é obrigatória'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  forma_pagamento_id: z.string().optional(),
  conta_bancaria_id: z.string().optional(),
  parcela_atual: z.number().default(1),
  parcelas_total: z.number().default(1),
  nosso_numero: z.string().optional(),
  codigo_barras: z.string().optional(),
  pix_copia_cola: z.string().optional(),
  observacao: z.string().optional(),
});

type ContaReceberFormData = z.infer<typeof contaReceberSchema>;

const formasPagamentoOptions = [
  { value: 'boleto', label: 'Boleto' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
];

export function ContaReceberFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [contasBancarias, setContasBancarias] = useState<any[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<ContaReceberFormData>({
    resolver: zodResolver(contaReceberSchema),
    defaultValues: {
      origem: 'manual',
      valor_original: 0,
      valor_juros: 0,
      valor_multa: 0,
      valor_desconto: 0,
      valor_acrescimo: 0,
      parcela_atual: 1,
      parcelas_total: 1,
      data_emissao: new Date().toISOString().split('T')[0],
    },
  });

  const valorOriginal = watch('valor_original') || 0;
  const valorJuros = watch('valor_juros') || 0;
  const valorMulta = watch('valor_multa') || 0;
  const valorDesconto = watch('valor_desconto') || 0;
  const valorAcrescimo = watch('valor_acrescimo') || 0;
  const valorTotal = valorOriginal + valorJuros + valorMulta + valorAcrescimo - valorDesconto;

  useEffect(() => {
    loadContasBancarias();
    if (id) loadConta();
  }, [id]);

  const loadContasBancarias = async () => {
    try {
      const response = await api.get('/contas-bancarias?ativo=true');
      setContasBancarias(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    }
  };

  const loadConta = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/contas-receber/${id}`);
      reset(response.data);
    } catch (error) {
      toast({ title: 'Erro ao carregar conta', variant: 'destructive' });
      navigate('/financeiro/receber');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ContaReceberFormData) => {
    try {
      const payload = { ...data, valor_aberto: valorTotal };
      if (isEditing) {
        await api.put(`/contas-receber/${id}`, payload);
        toast({ title: 'Conta atualizada com sucesso!' });
      } else {
        await api.post('/contas-receber', payload);
        toast({ title: 'Conta cadastrada com sucesso!' });
      }
      navigate('/financeiro/receber');
    } catch (error: any) {
      toast({ title: 'Erro ao salvar conta', description: error.response?.data?.message || 'Tente novamente', variant: 'destructive' });
    }
  };

  const formatMoney = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Icons.spinner className="w-8 h-8 animate-spin text-red-500" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/financeiro/receber')}><Icons.arrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}</h1>
          <p className="text-sm text-gray-500">{isEditing ? 'Atualize os dados' : 'Preencha os dados da nova conta'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cliente</h2>
          <ClienteSelect value={watch('cliente_id') || ''} onChange={(id) => setValue('cliente_id', id)} label="Cliente *" placeholder="Busque o cliente..." error={errors.cliente_id?.message} showDetailsOnSelect />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados da Conta</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nº Documento</label><Input {...register('numero_documento')} placeholder="Nº da NF, Pedido..." /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Data Emissão *</label><Input {...register('data_emissao')} type="date" error={errors.data_emissao?.message} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento *</label><Input {...register('data_vencimento')} type="date" error={errors.data_vencimento?.message} /></div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Original *</label><Input {...register('valor_original', { valueAsNumber: true })} type="number" step="0.01" error={errors.valor_original?.message} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Juros</label><Input {...register('valor_juros', { valueAsNumber: true })} type="number" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Multa</label><Input {...register('valor_multa', { valueAsNumber: true })} type="number" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Acréscimo</label><Input {...register('valor_acrescimo', { valueAsNumber: true })} type="number" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Desconto</label><Input {...register('valor_desconto', { valueAsNumber: true })} type="number" step="0.01" /></div>
          </div>
          <div className="mt-4 p-4 bg-green-50 rounded-lg flex justify-between items-center">
            <span className="text-lg font-medium text-gray-700">Total a Receber:</span>
            <span className="text-2xl font-bold text-green-600">{formatMoney(valorTotal)}</span>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Parcelamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Parcela Atual</label><Input {...register('parcela_atual', { valueAsNumber: true })} type="number" min="1" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Total de Parcelas</label><Input {...register('parcelas_total', { valueAsNumber: true })} type="number" min="1" /></div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cobrança</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label><Select {...register('forma_pagamento_id')} options={formasPagamentoOptions} placeholder="Selecione..." /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Conta Bancária</label><Select {...register('conta_bancaria_id')} options={contasBancarias.map(c => ({ value: c.id, label: `${c.banco} - ${c.agencia}/${c.conta}` }))} placeholder="Selecione..." /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nosso Número</label><Input {...register('nosso_numero')} placeholder="Nosso número do boleto" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label><Input {...register('codigo_barras')} placeholder="Código de barras" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">PIX Copia e Cola</label><Input {...register('pix_copia_cola')} placeholder="Chave PIX" /></div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Observações</h2>
          <textarea {...register('observacao')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Observações..." />
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/financeiro/receber')}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Icons.spinner className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><Icons.check className="w-4 h-4 mr-2" />{isEditing ? 'Atualizar' : 'Cadastrar'}</>}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ContaReceberFormPage;
