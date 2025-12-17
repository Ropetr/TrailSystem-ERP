// =============================================
// PLANAC ERP - Conta a Pagar Form Page
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

const contaPagarSchema = z.object({
  fornecedor_id: z.string().min(1, 'Fornecedor é obrigatório'),
  numero_documento: z.string().optional(),
  valor_original: z.number().min(0.01, 'Valor é obrigatório'),
  data_emissao: z.string().min(1, 'Data de emissão é obrigatória'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  data_competencia: z.string().optional(),
  origem: z.string().default('manual'),
  categoria: z.string().optional(),
  centro_custo: z.string().optional(),
  forma_pagamento_id: z.string().optional(),
  conta_bancaria_id: z.string().optional(),
  codigo_barras: z.string().optional(),
  linha_digitavel: z.string().optional(),
  pix_copia_cola: z.string().optional(),
  parcela_atual: z.number().default(1),
  parcelas_total: z.number().default(1),
  observacao: z.string().optional(),
});

type ContaPagarFormData = z.infer<typeof contaPagarSchema>;

const tabs = [
  { id: 'dados', label: 'Dados do Título', icon: Icons.fileText },
  { id: 'pagamento', label: 'Pagamento', icon: Icons.creditCard },
  { id: 'classificacao', label: 'Classificação', icon: Icons.tag },
];

const origemOptions = [
  { value: 'manual', label: 'Lançamento Manual' },
  { value: 'nfe', label: 'Nota Fiscal de Entrada' },
  { value: 'pedido_compra', label: 'Pedido de Compra' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'recorrente', label: 'Despesa Recorrente' },
];

export function ContaPagarFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditing = Boolean(id);

  const [activeTab, setActiveTab] = useState('dados');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fornecedores, setFornecedores] = useState<{ value: string; label: string }[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<{ value: string; label: string }[]>([]);
  const [contasBancarias, setContasBancarias] = useState<{ value: string; label: string }[]>([]);
  const [categorias, setCategorias] = useState<{ value: string; label: string }[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<{ value: string; label: string }[]>([]);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: {
      origem: 'manual',
      parcela_atual: 1,
      parcelas_total: 1,
      data_emissao: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    loadOptions();
    if (id) loadConta();
  }, [id]);

  const loadOptions = async () => {
    try {
      const [fornRes, formasRes, contasRes, catRes, ccRes] = await Promise.all([
        api.get('/fornecedores?ativo=true'),
        api.get('/formas-pagamento'),
        api.get('/contas-bancarias'),
        api.get('/categorias-financeiras?tipo=despesa'),
        api.get('/centros-custo'),
      ]);
      if (fornRes.success) setFornecedores(fornRes.data.map((f: any) => ({ value: f.id, label: f.razao_social })));
      if (formasRes.success) setFormasPagamento(formasRes.data.map((f: any) => ({ value: f.id, label: f.nome })));
      if (contasRes.success) setContasBancarias(contasRes.data.map((c: any) => ({ value: c.id, label: c.nome })));
      if (catRes.success) setCategorias(catRes.data.map((c: any) => ({ value: c.id, label: c.nome })));
      if (ccRes.success) setCentrosCusto(ccRes.data.map((c: any) => ({ value: c.id, label: c.nome })));
    } catch (error) { console.error('Erro ao carregar opções:', error); }
  };

  const loadConta = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/contas-pagar/${id}`);
      if (response.success) reset(response.data);
    } catch (error) {
      toast.error('Erro ao carregar conta');
      navigate('/financeiro/pagar');
    } finally { setIsLoading(false); }
  };

  const onSubmit = async (data: ContaPagarFormData) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        valor_aberto: data.valor_original,
        valor_pago: 0,
        status: 'aberto',
      };
      if (isEditing) {
        await api.put(`/contas-pagar/${id}`, payload);
        toast.success('Conta atualizada com sucesso');
      } else {
        await api.post('/contas-pagar', payload);
        toast.success('Conta cadastrada com sucesso');
      }
      navigate('/financeiro/pagar');
    } catch (error) {
      toast.error('Erro ao salvar conta');
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/financeiro/pagar')}>
          <Icons.arrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Atualize os dados do título' : 'Cadastre um novo título a pagar'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <Card className="p-6">
          {activeTab === 'dados' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Fornecedor *" options={fornecedores} {...register('fornecedor_id')} error={errors.fornecedor_id?.message} />
                <Select label="Origem" options={origemOptions} {...register('origem')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Nº Documento" placeholder="Número do documento" {...register('numero_documento')} />
                <Input label="Parcela" type="number" min="1" {...register('parcela_atual', { valueAsNumber: true })} />
                <Input label="Total Parcelas" type="number" min="1" {...register('parcelas_total', { valueAsNumber: true })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Valor *" type="number" step="0.01" min="0.01" {...register('valor_original', { valueAsNumber: true })} error={errors.valor_original?.message} />
                <Input label="Data Emissão *" type="date" {...register('data_emissao')} error={errors.data_emissao?.message} />
                <Input label="Data Vencimento *" type="date" {...register('data_vencimento')} error={errors.data_vencimento?.message} />
              </div>
              <Input label="Data Competência" type="date" {...register('data_competencia')} />
            </div>
          )}

          {activeTab === 'pagamento' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Forma de Pagamento" options={formasPagamento} {...register('forma_pagamento_id')} />
                <Select label="Conta Bancária" options={contasBancarias} {...register('conta_bancaria_id')} />
              </div>
              <Input label="Código de Barras" placeholder="Código de barras do boleto" {...register('codigo_barras')} />
              <Input label="Linha Digitável" placeholder="Linha digitável do boleto" {...register('linha_digitavel')} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIX Copia e Cola</label>
                <textarea rows={3} placeholder="Código PIX copia e cola..." {...register('pix_copia_cola')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" />
              </div>
            </div>
          )}

          {activeTab === 'classificacao' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Categoria" options={categorias} {...register('categoria')} />
                <Select label="Centro de Custo" options={centrosCusto} {...register('centro_custo')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea rows={4} placeholder="Observações..." {...register('observacao')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" />
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/financeiro/pagar')}>Cancelar</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (<><Icons.spinner className="w-4 h-4 animate-spin mr-2" />Salvando...</>) : (<><Icons.check className="w-4 h-4 mr-2" />{isEditing ? 'Atualizar' : 'Cadastrar'}</>)}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ContaPagarFormPage;
