// =============================================
// PLANAC ERP - Formulário de Movimentação
// =============================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Produto {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  estoque_atual: number;
  preco_custo: number;
  localizacao?: string;
}

interface ItemMovimentacao {
  id: string;
  produto_id: string;
  produto: Produto;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
  lote?: string;
  validade?: string;
  localizacao?: string;
}

const tipoOptions = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
  { value: 'ajuste', label: 'Ajuste de Inventário' },
];

const motivoEntradaOptions = [
  { value: 'compra', label: 'Compra' },
  { value: 'devolucao_cliente', label: 'Devolução de Cliente' },
  { value: 'producao', label: 'Produção' },
  { value: 'bonificacao', label: 'Bonificação' },
  { value: 'outros', label: 'Outros' },
];

const motivoSaidaOptions = [
  { value: 'venda', label: 'Venda' },
  { value: 'devolucao_fornecedor', label: 'Devolução ao Fornecedor' },
  { value: 'consumo_interno', label: 'Consumo Interno' },
  { value: 'perda', label: 'Perda/Avaria' },
  { value: 'brinde', label: 'Brinde' },
  { value: 'outros', label: 'Outros' },
];

const motivoAjusteOptions = [
  { value: 'inventario', label: 'Acerto de Inventário' },
  { value: 'erro_sistema', label: 'Correção de Erro' },
  { value: 'outros', label: 'Outros' },
];

export function MovimentacaoFormPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const isEditing = !!id;

  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [motivo, setMotivo] = useState('');
  const [documentoTipo, setDocumentoTipo] = useState('');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [filialId, setFilialId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState<ItemMovimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de adicionar produto
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchProduto, setSearchProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidadeAdd, setQuantidadeAdd] = useState(1);
  const [custoAdd, setCustoAdd] = useState(0);
  const [loteAdd, setLoteAdd] = useState('');
  const [validadeAdd, setValidadeAdd] = useState('');

  // Filiais
  const [filiais, setFiliais] = useState<Array<{ id: string; nome: string }>>([]);

  useEffect(() => {
    loadFiliais();
    if (isEditing) {
      loadMovimentacao();
    }
  }, [id]);

  const loadFiliais = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Array<{ id: string; nome: string }> }>('/filiais');
      if (response.success) {
        setFiliais(response.data);
        if (response.data.length > 0 && !filialId) {
          setFilialId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar filiais', error);
    }
  };

  const loadMovimentacao = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: any }>(`/estoque/movimentacoes/${id}`);
      if (response.success) {
        const mov = response.data;
        setTipo(mov.tipo);
        setMotivo(mov.motivo);
        setDocumentoTipo(mov.documento_tipo);
        setDocumentoNumero(mov.documento_numero);
        setFilialId(mov.filial_id);
        setObservacao(mov.observacao);
        setItens(mov.itens);
      }
    } catch (error) {
      toast.error('Erro ao carregar movimentação');
      navigate('/estoque/movimentacoes');
    } finally {
      setIsLoading(false);
    }
  };

  const searchProdutos = async () => {
    if (searchProduto.length < 2) return;
    try {
      const response = await api.get<{ success: boolean; data: Produto[] }>(
        `/produtos?search=${encodeURIComponent(searchProduto)}&limit=20`
      );
      if (response.success) {
        setProdutos(response.data);
      }
    } catch (error) {
      toast.error('Erro ao buscar produtos');
    }
  };

  const handleAddProduto = () => {
    if (!produtoSelecionado) return;
    
    // Verificar se já existe
    const existente = itens.find(i => i.produto_id === produtoSelecionado.id);
    if (existente) {
      toast.error('Produto já adicionado. Edite a quantidade na lista.');
      return;
    }

    const novoItem: ItemMovimentacao = {
      id: `temp-${Date.now()}`,
      produto_id: produtoSelecionado.id,
      produto: produtoSelecionado,
      quantidade: quantidadeAdd,
      custo_unitario: custoAdd || produtoSelecionado.preco_custo,
      custo_total: quantidadeAdd * (custoAdd || produtoSelecionado.preco_custo),
      lote: loteAdd || undefined,
      validade: validadeAdd || undefined,
      localizacao: produtoSelecionado.localizacao,
    };

    setItens([...itens, novoItem]);
    
    // Reset
    setProdutoSelecionado(null);
    setQuantidadeAdd(1);
    setCustoAdd(0);
    setLoteAdd('');
    setValidadeAdd('');
    setShowProdutoModal(false);
    toast.success('Produto adicionado');
  };

  const handleRemoveItem = (itemId: string) => {
    setItens(itens.filter(i => i.id !== itemId));
  };

  const handleUpdateQuantidade = (itemId: string, quantidade: number) => {
    setItens(itens.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantidade,
          custo_total: quantidade * item.custo_unitario,
        };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    // Validações
    if (!tipo) {
      toast.error('Selecione o tipo de movimentação');
      return;
    }
    if (!motivo) {
      toast.error('Selecione o motivo');
      return;
    }
    if (!filialId) {
      toast.error('Selecione a filial');
      return;
    }
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um produto');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        tipo,
        motivo,
        documento_tipo: documentoTipo,
        documento_numero: documentoNumero,
        filial_id: filialId,
        observacao,
        itens: itens.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          custo_unitario: item.custo_unitario,
          lote: item.lote,
          validade: item.validade,
          localizacao: item.localizacao,
        })),
      };

      if (isEditing) {
        await api.put(`/estoque/movimentacoes/${id}`, payload);
        toast.success('Movimentação atualizada!');
      } else {
        await api.post('/estoque/movimentacoes', payload);
        toast.success('Movimentação registrada!');
      }

      navigate('/estoque/movimentacoes');
    } catch (error) {
      toast.error('Erro ao salvar movimentação');
    } finally {
      setIsSaving(false);
    }
  };

  const getMotivoOptions = () => {
    switch (tipo) {
      case 'entrada': return motivoEntradaOptions;
      case 'saida': return motivoSaidaOptions;
      case 'ajuste': return motivoAjusteOptions;
      default: return [];
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Totais
  const totalItens = itens.reduce((sum, i) => sum + i.quantidade, 0);
  const totalCusto = itens.reduce((sum, i) => sum + i.custo_total, 0);

  const itemColumns = [
    {
      key: 'produto',
      header: 'Produto',
      render: (item: ItemMovimentacao) => (
        <div>
          <p className="font-medium">{item.produto.descricao}</p>
          <p className="text-sm text-gray-500">{item.produto.codigo}</p>
        </div>
      ),
    },
    {
      key: 'estoque_atual',
      header: 'Estoque Atual',
      width: '100px',
      render: (item: ItemMovimentacao) => (
        <span className="text-gray-600">{item.produto.estoque_atual} {item.produto.unidade}</span>
      ),
    },
    {
      key: 'quantidade',
      header: 'Quantidade',
      width: '120px',
      render: (item: ItemMovimentacao) => (
        <Input
          type="number"
          min={1}
          value={item.quantidade}
          onChange={(e) => handleUpdateQuantidade(item.id, parseInt(e.target.value) || 0)}
          className="w-20"
        />
      ),
    },
    {
      key: 'custo_unitario',
      header: 'Custo Unit.',
      width: '100px',
      render: (item: ItemMovimentacao) => formatCurrency(item.custo_unitario),
    },
    {
      key: 'custo_total',
      header: 'Custo Total',
      width: '100px',
      render: (item: ItemMovimentacao) => (
        <span className="font-medium">{formatCurrency(item.custo_total)}</span>
      ),
    },
    {
      key: 'lote',
      header: 'Lote',
      width: '100px',
      render: (item: ItemMovimentacao) => item.lote || '-',
    },
  ];

  const itemActions = (item: ItemMovimentacao) => [
    {
      label: 'Remover',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleRemoveItem(item.id),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="w-8 h-8 animate-spin text-planac-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/estoque/movimentacoes')}>
          <Icons.back className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Movimentação' : 'Nova Movimentação'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Altere os dados da movimentação' : 'Registre entradas, saídas ou ajustes de estoque'}
          </p>
        </div>
      </div>

      {/* Dados da Movimentação */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Dados da Movimentação</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo de Movimentação *"
            value={tipo}
            onChange={(value) => {
              setTipo(value as typeof tipo);
              setMotivo(''); // Reset motivo ao mudar tipo
            }}
            options={tipoOptions}
          />

          <Select
            label="Motivo *"
            value={motivo}
            onChange={setMotivo}
            options={getMotivoOptions()}
            placeholder="Selecione o motivo"
          />

          <Select
            label="Filial *"
            value={filialId}
            onChange={setFilialId}
            options={filiais.map(f => ({ value: f.id, label: f.nome }))}
            placeholder="Selecione a filial"
          />

          <Input
            label="Tipo de Documento"
            value={documentoTipo}
            onChange={(e) => setDocumentoTipo(e.target.value)}
            placeholder="Ex: NF-e, Pedido, Ordem"
          />

          <Input
            label="Número do Documento"
            value={documentoNumero}
            onChange={(e) => setDocumentoNumero(e.target.value)}
            placeholder="Ex: 12345"
          />
        </div>
      </Card>

      {/* Itens */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Produtos</h2>
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => setShowProdutoModal(true)}
          >
            Adicionar Produto
          </Button>
        </div>

        {itens.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icons.document className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum produto adicionado</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setShowProdutoModal(true)}
            >
              Adicionar Produto
            </Button>
          </div>
        ) : (
          <>
            <DataTable
              data={itens}
              columns={itemColumns}
              actions={itemActions}
            />
            
            {/* Totais */}
            <div className="mt-4 pt-4 border-t flex justify-end gap-8">
              <div>
                <span className="text-gray-500">Total de Itens:</span>
                <span className="ml-2 font-bold text-lg">{totalItens}</span>
              </div>
              <div>
                <span className="text-gray-500">Custo Total:</span>
                <span className="ml-2 font-bold text-lg text-planac-600">
                  {formatCurrency(totalCusto)}
                </span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Observações */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Observações</h2>
        <textarea
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-planac-500 focus:ring-2 focus:ring-planac-500/20 outline-none resize-none"
          rows={3}
          placeholder="Observações adicionais..."
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate('/estoque/movimentacoes')}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Icons.check className="w-5 h-5" />}
        >
          {isEditing ? 'Atualizar' : 'Registrar Movimentação'}
        </Button>
      </div>

      {/* Modal de Adicionar Produto */}
      <Modal
        isOpen={showProdutoModal}
        onClose={() => {
          setShowProdutoModal(false);
          setProdutoSelecionado(null);
          setProdutos([]);
          setSearchProduto('');
        }}
        title="Adicionar Produto"
        size="lg"
      >
        <div className="space-y-4">
          {!produtoSelecionado ? (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por código ou descrição..."
                  value={searchProduto}
                  onChange={(e) => setSearchProduto(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchProdutos()}
                  leftIcon={<Icons.search className="w-5 h-5" />}
                />
                <Button onClick={searchProdutos}>Buscar</Button>
              </div>

              {produtos.length > 0 && (
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {produtos.map((produto) => (
                    <div
                      key={produto.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                      onClick={() => {
                        setProdutoSelecionado(produto);
                        setCustoAdd(produto.preco_custo);
                      }}
                    >
                      <div>
                        <p className="font-medium">{produto.descricao}</p>
                        <p className="text-sm text-gray-500">{produto.codigo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Estoque: {produto.estoque_atual}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(produto.preco_custo)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{produtoSelecionado.descricao}</p>
                <p className="text-sm text-gray-500">{produtoSelecionado.codigo}</p>
                <p className="text-sm mt-1">Estoque atual: {produtoSelecionado.estoque_atual} {produtoSelecionado.unidade}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantidade *"
                  type="number"
                  min={1}
                  value={quantidadeAdd}
                  onChange={(e) => setQuantidadeAdd(parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Custo Unitário"
                  type="number"
                  step="0.01"
                  value={custoAdd}
                  onChange={(e) => setCustoAdd(parseFloat(e.target.value) || 0)}
                />
                <Input
                  label="Lote"
                  value={loteAdd}
                  onChange={(e) => setLoteAdd(e.target.value)}
                  placeholder="Opcional"
                />
                <Input
                  label="Validade"
                  type="date"
                  value={validadeAdd}
                  onChange={(e) => setValidadeAdd(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={() => setProdutoSelecionado(null)}>
                  <Icons.back className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={handleAddProduto}>
                  Adicionar Produto
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default MovimentacaoFormPage;
