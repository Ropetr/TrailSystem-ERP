// =============================================
// PLANAC ERP - Formulário de NF-e
// =============================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface ItemNota {
  id?: string;
  produto_id: string;
  produto_codigo?: string;
  produto_nome?: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  icms_cst: string;
  icms_aliquota: number;
  icms_valor: number;
  ipi_cst?: string;
  ipi_aliquota?: number;
  ipi_valor?: number;
  pis_cst: string;
  pis_aliquota: number;
  pis_valor: number;
  cofins_cst: string;
  cofins_aliquota: number;
  cofins_valor: number;
}

interface NotaForm {
  natureza_operacao: string;
  tipo_operacao: '0' | '1'; // 0=Entrada, 1=Saída
  finalidade: '1' | '2' | '3' | '4'; // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  cliente_id: string;
  cliente_nome?: string;
  cliente_documento?: string;
  transportadora_id?: string;
  modalidade_frete: '0' | '1' | '2' | '9'; // 0=CIF, 1=FOB, 2=Terceiros, 9=Sem frete
  itens: ItemNota[];
  informacoes_complementares?: string;
}

const naturezaOptions = [
  { value: 'VENDA', label: 'Venda de Mercadoria' },
  { value: 'DEVOLUCAO', label: 'Devolução de Mercadoria' },
  { value: 'REMESSA', label: 'Remessa para Conserto' },
  { value: 'TRANSFERENCIA', label: 'Transferência de Estoque' },
  { value: 'BONIFICACAO', label: 'Bonificação/Doação' },
];

const finalidadeOptions = [
  { value: '1', label: 'NF-e Normal' },
  { value: '2', label: 'NF-e Complementar' },
  { value: '3', label: 'NF-e de Ajuste' },
  { value: '4', label: 'Devolução de Mercadoria' },
];

const modalidadeFreteOptions = [
  { value: '0', label: '0 - Por conta do Emitente (CIF)' },
  { value: '1', label: '1 - Por conta do Destinatário (FOB)' },
  { value: '2', label: '2 - Por conta de Terceiros' },
  { value: '9', label: '9 - Sem Frete' },
];

const cfopOptions = [
  { value: '5102', label: '5102 - Venda de mercadoria (dentro do estado)' },
  { value: '6102', label: '6102 - Venda de mercadoria (fora do estado)' },
  { value: '5405', label: '5405 - Venda de mercadoria adquirida de terceiros em operação com substituição tributária' },
  { value: '5403', label: '5403 - Venda de mercadoria com substituição tributária' },
  { value: '5949', label: '5949 - Outra saída de mercadoria não especificada' },
];

export function NotaFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'itens' | 'transporte' | 'totais'>('dados');
  
  const [form, setForm] = useState<NotaForm>({
    natureza_operacao: 'VENDA',
    tipo_operacao: '1',
    finalidade: '1',
    cliente_id: '',
    modalidade_frete: '9',
    itens: [],
  });
  
  // Item sendo editado
  const [itemForm, setItemForm] = useState<Partial<ItemNota>>({
    quantidade: 1,
    valor_unitario: 0,
    icms_cst: '00',
    icms_aliquota: 18,
    pis_cst: '01',
    pis_aliquota: 1.65,
    cofins_cst: '01',
    cofins_aliquota: 7.6,
  });
  const [showItemForm, setShowItemForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadNota();
    }
  }, [id]);

  const loadNota = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: NotaForm }>(`/fiscal/notas/${id}`);
      if (response.success) {
        setForm(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar nota fiscal');
      navigate('/fiscal/notas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!form.cliente_id) {
      toast.error('Selecione um cliente');
      return;
    }
    if (form.itens.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    setIsSaving(true);
    try {
      if (id) {
        await api.put(`/fiscal/notas/${id}`, form);
        toast.success('Nota atualizada com sucesso');
      } else {
        await api.post('/fiscal/notas', form);
        toast.success('Nota criada com sucesso');
      }
      navigate('/fiscal/notas');
    } catch (error) {
      toast.error('Erro ao salvar nota fiscal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmitir = async () => {
    if (!form.cliente_id || form.itens.length === 0) {
      toast.error('Preencha todos os dados obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      // Salvar primeiro
      const saveResponse = await (id 
        ? api.put(`/fiscal/notas/${id}`, form)
        : api.post('/fiscal/notas', form)
      );
      
      // Depois emitir
      await api.post(`/fiscal/notas/${saveResponse.data.id}/emitir`);
      toast.success('Nota enviada para autorização na SEFAZ');
      navigate('/fiscal/notas');
    } catch (error) {
      toast.error('Erro ao emitir nota fiscal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBuscarCliente = async (documento: string) => {
    try {
      const response = await api.get<{ success: boolean; data: any }>(`/clientes/documento/${documento}`);
      if (response.success && response.data) {
        setForm({
          ...form,
          cliente_id: response.data.id,
          cliente_nome: response.data.nome || response.data.razao_social,
          cliente_documento: documento,
        });
      } else {
        toast.error('Cliente não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar cliente');
    }
  };

  const handleAdicionarItem = () => {
    if (!itemForm.produto_id || !itemForm.ncm || !itemForm.cfop) {
      toast.error('Preencha os campos obrigatórios do item');
      return;
    }

    const valorTotal = (itemForm.quantidade || 0) * (itemForm.valor_unitario || 0);
    const icmsValor = valorTotal * ((itemForm.icms_aliquota || 0) / 100);
    const pisValor = valorTotal * ((itemForm.pis_aliquota || 0) / 100);
    const cofinsValor = valorTotal * ((itemForm.cofins_aliquota || 0) / 100);

    const novoItem: ItemNota = {
      produto_id: itemForm.produto_id!,
      produto_codigo: itemForm.produto_codigo,
      produto_nome: itemForm.produto_nome,
      ncm: itemForm.ncm!,
      cfop: itemForm.cfop!,
      unidade: itemForm.unidade || 'UN',
      quantidade: itemForm.quantidade || 1,
      valor_unitario: itemForm.valor_unitario || 0,
      valor_total: valorTotal,
      icms_cst: itemForm.icms_cst || '00',
      icms_aliquota: itemForm.icms_aliquota || 0,
      icms_valor: icmsValor,
      pis_cst: itemForm.pis_cst || '01',
      pis_aliquota: itemForm.pis_aliquota || 0,
      pis_valor: pisValor,
      cofins_cst: itemForm.cofins_cst || '01',
      cofins_aliquota: itemForm.cofins_aliquota || 0,
      cofins_valor: cofinsValor,
    };

    setForm({ ...form, itens: [...form.itens, novoItem] });
    setItemForm({
      quantidade: 1,
      valor_unitario: 0,
      icms_cst: '00',
      icms_aliquota: 18,
      pis_cst: '01',
      pis_aliquota: 1.65,
      cofins_cst: '01',
      cofins_aliquota: 7.6,
    });
    setShowItemForm(false);
    toast.success('Item adicionado');
  };

  const handleRemoverItem = (index: number) => {
    const novosItens = form.itens.filter((_, i) => i !== index);
    setForm({ ...form, itens: novosItens });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Cálculos dos totais
  const totais = {
    valorProdutos: form.itens.reduce((acc, i) => acc + i.valor_total, 0),
    valorICMS: form.itens.reduce((acc, i) => acc + i.icms_valor, 0),
    valorPIS: form.itens.reduce((acc, i) => acc + i.pis_valor, 0),
    valorCOFINS: form.itens.reduce((acc, i) => acc + i.cofins_valor, 0),
    valorTotal: form.itens.reduce((acc, i) => acc + i.valor_total, 0),
  };

  const tabs = [
    { id: 'dados' as const, label: 'Dados da Nota', icon: Icons.document },
    { id: 'itens' as const, label: 'Itens', icon: Icons.document },
    { id: 'transporte' as const, label: 'Transporte', icon: Icons.building },
    { id: 'totais' as const, label: 'Totais', icon: Icons.document },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-planac-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/fiscal/notas')}>
            <Icons.chevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Editar NF-e' : 'Nova NF-e'}
            </h1>
            <p className="text-gray-500">Preencha os dados da nota fiscal</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSalvar} disabled={isSaving}>
            Salvar Rascunho
          </Button>
          <Button onClick={handleEmitir} disabled={isSaving}>
            {isSaving ? 'Processando...' : 'Emitir NF-e'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-planac-500 text-planac-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.id === 'itens' && form.itens.length > 0 && (
                <span className="bg-planac-100 text-planac-600 text-xs px-2 py-0.5 rounded-full">
                  {form.itens.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Aba Dados */}
      {activeTab === 'dados' && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Natureza da Operação"
              value={form.natureza_operacao}
              onChange={(v) => setForm({ ...form, natureza_operacao: v })}
              options={naturezaOptions}
            />
            
            <Select
              label="Finalidade"
              value={form.finalidade}
              onChange={(v) => setForm({ ...form, finalidade: v as any })}
              options={finalidadeOptions}
            />
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente/Destinatário
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="CPF ou CNPJ do cliente"
                  value={form.cliente_documento || ''}
                  onChange={(e) => setForm({ ...form, cliente_documento: e.target.value })}
                  onBlur={(e) => e.target.value && handleBuscarCliente(e.target.value)}
                />
                <Button variant="secondary" onClick={() => form.cliente_documento && handleBuscarCliente(form.cliente_documento)}>
                  <Icons.search className="w-5 h-5" />
                </Button>
              </div>
              {form.cliente_nome && (
                <p className="mt-2 text-sm text-green-600">
                  Cliente: <strong>{form.cliente_nome}</strong>
                </p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Informações Complementares
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20"
                rows={3}
                value={form.informacoes_complementares || ''}
                onChange={(e) => setForm({ ...form, informacoes_complementares: e.target.value })}
                placeholder="Informações adicionais que aparecerão na nota..."
              />
            </div>
          </div>
        </Card>
      )}

      {/* Aba Itens */}
      {activeTab === 'itens' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Itens da Nota</h3>
            <Button
              leftIcon={<Icons.plus className="w-5 h-5" />}
              onClick={() => setShowItemForm(true)}
            >
              Adicionar Item
            </Button>
          </div>

          {/* Lista de Itens */}
          {form.itens.length === 0 ? (
            <Card className="text-center py-12">
              <Icons.document className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum item adicionado</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setShowItemForm(true)}
              >
                Adicionar Primeiro Item
              </Button>
            </Card>
          ) : (
            <Card padding="none">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">NCM</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">CFOP</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qtd</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {form.itens.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.produto_nome || item.produto_codigo}</p>
                        <p className="text-xs text-gray-500">ICMS: {item.icms_aliquota}% | PIS: {item.pis_aliquota}% | COFINS: {item.cofins_aliquota}%</p>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-sm">{item.ncm}</td>
                      <td className="px-4 py-3 text-center font-mono text-sm">{item.cfop}</td>
                      <td className="px-4 py-3 text-center">{item.quantidade}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.valor_unitario)}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(item.valor_total)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoverItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Icons.x className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Formulário de Novo Item (inline) */}
          {showItemForm && (
            <Card className="border-2 border-planac-500">
              <h4 className="font-medium mb-4">Novo Item</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Código do Produto"
                    placeholder="Buscar produto..."
                    value={itemForm.produto_codigo || ''}
                    onChange={(e) => setItemForm({ ...itemForm, produto_codigo: e.target.value, produto_id: e.target.value })}
                  />
                </div>
                <Input
                  label="NCM"
                  placeholder="00000000"
                  maxLength={8}
                  value={itemForm.ncm || ''}
                  onChange={(e) => setItemForm({ ...itemForm, ncm: e.target.value })}
                />
                <Select
                  label="CFOP"
                  value={itemForm.cfop || ''}
                  onChange={(v) => setItemForm({ ...itemForm, cfop: v })}
                  options={[{ value: '', label: 'Selecione...' }, ...cfopOptions]}
                />
                <Input
                  label="Quantidade"
                  type="number"
                  min={1}
                  value={itemForm.quantidade || ''}
                  onChange={(e) => setItemForm({ ...itemForm, quantidade: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Valor Unitário"
                  type="number"
                  step="0.01"
                  value={itemForm.valor_unitario || ''}
                  onChange={(e) => setItemForm({ ...itemForm, valor_unitario: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="ICMS %"
                  type="number"
                  value={itemForm.icms_aliquota || ''}
                  onChange={(e) => setItemForm({ ...itemForm, icms_aliquota: parseFloat(e.target.value) || 0 })}
                />
                <div className="flex items-end gap-2">
                  <Button variant="secondary" onClick={() => setShowItemForm(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAdicionarItem}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Aba Transporte */}
      {activeTab === 'transporte' && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Modalidade do Frete"
              value={form.modalidade_frete}
              onChange={(v) => setForm({ ...form, modalidade_frete: v as any })}
              options={modalidadeFreteOptions}
            />
            
            <Input
              label="Transportadora (opcional)"
              placeholder="Buscar transportadora..."
              value={form.transportadora_id || ''}
              onChange={(e) => setForm({ ...form, transportadora_id: e.target.value })}
            />
          </div>
        </Card>
      )}

      {/* Aba Totais */}
      {activeTab === 'totais' && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Resumo dos Valores</h3>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Valor dos Produtos</span>
                <span className="font-medium">{formatCurrency(totais.valorProdutos)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Base de Cálculo ICMS</span>
                <span className="font-medium">{formatCurrency(totais.valorProdutos)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Valor do ICMS</span>
                <span className="font-medium">{formatCurrency(totais.valorICMS)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Valor do PIS</span>
                <span className="font-medium">{formatCurrency(totais.valorPIS)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Valor da COFINS</span>
                <span className="font-medium">{formatCurrency(totais.valorCOFINS)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center p-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500 mb-2">Valor Total da Nota</p>
                <p className="text-4xl font-bold text-planac-600">
                  {formatCurrency(totais.valorTotal)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default NotaFormPage;
