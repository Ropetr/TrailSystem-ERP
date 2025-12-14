// =============================================
// PLANAC ERP - PDV / Emissão de NFC-e
// =============================================

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface ItemVenda {
  produto_id: string;
  codigo: string;
  nome: string;
  ncm: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

interface FormaPagamento {
  tipo: 'dinheiro' | 'credito' | 'debito' | 'pix' | 'outros';
  valor: number;
  bandeira?: string;
}

const formaPagamentoOptions = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'outros', label: 'Outros' },
];

export function NFCePage() {
  const toast = useToast();
  const codigoInputRef = useRef<HTMLInputElement>(null);
  
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [codigoBusca, setCodigoBusca] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Cliente (opcional para NFC-e)
  const [cpfCliente, setCpfCliente] = useState('');
  
  // Pagamento
  const [showPagamento, setShowPagamento] = useState(false);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [formaPagamentoAtual, setFormaPagamentoAtual] = useState<'dinheiro' | 'credito' | 'debito' | 'pix' | 'outros'>('dinheiro');
  const [valorPagamento, setValorPagamento] = useState('');
  
  // Resultado
  const [showResultado, setShowResultado] = useState(false);
  const [resultadoNFCe, setResultadoNFCe] = useState<any>(null);

  // Focus no input ao carregar
  useEffect(() => {
    codigoInputRef.current?.focus();
  }, []);

  const handleBuscarProduto = async () => {
    if (!codigoBusca) return;

    try {
      const response = await api.get<{ success: boolean; data: any }>(
        `/produtos/codigo/${codigoBusca}`
      );
      
      if (response.success && response.data) {
        const produto = response.data;
        
        // Verificar se já existe na lista
        const indexExistente = itens.findIndex(i => i.produto_id === produto.id);
        
        if (indexExistente >= 0) {
          // Incrementar quantidade
          const novosItens = [...itens];
          novosItens[indexExistente].quantidade += quantidade;
          novosItens[indexExistente].valor_total = 
            novosItens[indexExistente].quantidade * novosItens[indexExistente].valor_unitario;
          setItens(novosItens);
        } else {
          // Adicionar novo item
          const novoItem: ItemVenda = {
            produto_id: produto.id,
            codigo: produto.codigo,
            nome: produto.descricao,
            ncm: produto.ncm,
            unidade: produto.unidade || 'UN',
            quantidade: quantidade,
            valor_unitario: produto.preco_venda,
            valor_total: quantidade * produto.preco_venda,
          };
          setItens([...itens, novoItem]);
        }
        
        setCodigoBusca('');
        setQuantidade(1);
        codigoInputRef.current?.focus();
      } else {
        toast.error('Produto não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar produto');
    }
  };

  const handleRemoverItem = (index: number) => {
    const novosItens = itens.filter((_, i) => i !== index);
    setItens(novosItens);
  };

  const handleAlterarQuantidade = (index: number, novaQtd: number) => {
    if (novaQtd <= 0) {
      handleRemoverItem(index);
      return;
    }
    
    const novosItens = [...itens];
    novosItens[index].quantidade = novaQtd;
    novosItens[index].valor_total = novaQtd * novosItens[index].valor_unitario;
    setItens(novosItens);
  };

  const handleAdicionarPagamento = () => {
    const valor = parseFloat(valorPagamento);
    if (isNaN(valor) || valor <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setFormasPagamento([
      ...formasPagamento,
      { tipo: formaPagamentoAtual, valor },
    ]);
    setValorPagamento('');
  };

  const handleRemoverPagamento = (index: number) => {
    setFormasPagamento(formasPagamento.filter((_, i) => i !== index));
  };

  const handleFinalizarVenda = async () => {
    if (totalPago < totalVenda) {
      toast.error('Valor pago insuficiente');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post<{ success: boolean; data: any }>('/fiscal/nfce', {
        cpf_cliente: cpfCliente || null,
        itens: itens.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
        })),
        pagamentos: formasPagamento,
        troco: troco,
      });

      if (response.success) {
        setResultadoNFCe(response.data);
        setShowPagamento(false);
        setShowResultado(true);
        toast.success('NFC-e emitida com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao emitir NFC-e');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNovaVenda = () => {
    setItens([]);
    setFormasPagamento([]);
    setCpfCliente('');
    setShowResultado(false);
    setResultadoNFCe(null);
    codigoInputRef.current?.focus();
  };

  const handleImprimirCupom = () => {
    if (resultadoNFCe?.url_danfce) {
      window.open(resultadoNFCe.url_danfce, '_blank');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Cálculos
  const totalVenda = itens.reduce((acc, item) => acc + item.valor_total, 0);
  const totalPago = formasPagamento.reduce((acc, p) => acc + p.valor, 0);
  const troco = Math.max(0, totalPago - totalVenda);
  const faltaPagar = Math.max(0, totalVenda - totalPago);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 = Finalizar (ir para pagamento)
      if (e.key === 'F2' && itens.length > 0) {
        e.preventDefault();
        setShowPagamento(true);
      }
      // F4 = Cancelar item
      if (e.key === 'F4' && itens.length > 0) {
        e.preventDefault();
        handleRemoverItem(itens.length - 1);
      }
      // Enter no campo de código
      if (e.key === 'Enter' && document.activeElement === codigoInputRef.current) {
        e.preventDefault();
        handleBuscarProduto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itens]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-planac-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Icons.document className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">PDV - Emissão de NFC-e</h1>
              <p className="text-planac-200 text-sm">Cupom Fiscal Eletrônico</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{new Date().toLocaleTimeString('pt-BR')}</p>
            <p className="text-planac-200 text-sm">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Coluna Esquerda - Itens */}
        <div className="flex-1 flex flex-col">
          {/* Input de Busca */}
          <Card className="mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  ref={codigoInputRef}
                  placeholder="Código de barras ou SKU do produto"
                  value={codigoBusca}
                  onChange={(e) => setCodigoBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarProduto()}
                  leftIcon={<Icons.search className="w-5 h-5" />}
                  className="text-xl"
                />
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                  placeholder="Qtd"
                  className="text-center text-xl"
                />
              </div>
              <Button size="lg" onClick={handleBuscarProduto}>
                <Icons.plus className="w-6 h-6" />
              </Button>
            </div>
          </Card>

          {/* Lista de Itens */}
          <Card className="flex-1 overflow-auto" padding="none">
            {itens.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Icons.document className="w-16 h-16 mb-4" />
                <p className="text-lg">Nenhum item adicionado</p>
                <p className="text-sm">Leia o código de barras ou digite o SKU</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Produto</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Qtd</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Unit.</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Total</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {itens.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-xs text-gray-500">{item.codigo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleAlterarQuantidade(index, item.quantidade - 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Icons.x className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantidade}</span>
                          <button
                            onClick={() => handleAlterarQuantidade(index, item.quantidade + 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Icons.plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.valor_unitario)}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(item.valor_total)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoverItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Icons.x className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Coluna Direita - Total e Ações */}
        <div className="w-80 flex flex-col gap-4">
          {/* Total */}
          <Card className="text-center bg-gray-900 text-white">
            <p className="text-gray-400 mb-2">TOTAL</p>
            <p className="text-5xl font-bold text-green-400">
              {formatCurrency(totalVenda)}
            </p>
            <p className="text-gray-400 mt-2">{itens.length} item(ns)</p>
          </Card>

          {/* CPF na Nota */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF na Nota (opcional)
            </label>
            <Input
              placeholder="000.000.000-00"
              value={cpfCliente}
              onChange={(e) => setCpfCliente(e.target.value)}
            />
          </Card>

          {/* Ações */}
          <div className="flex-1" />
          
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={handleNovaVenda}
              disabled={itens.length === 0}
            >
              <Icons.x className="w-5 h-5 mr-2" />
              Cancelar Venda (F4)
            </Button>
            
            <Button
              className="w-full h-16 text-xl"
              size="lg"
              onClick={() => setShowPagamento(true)}
              disabled={itens.length === 0}
            >
              Finalizar Venda (F2)
            </Button>
          </div>

          {/* Atalhos */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p><kbd className="bg-gray-200 px-1 rounded">Enter</kbd> Adicionar produto</p>
            <p><kbd className="bg-gray-200 px-1 rounded">F2</kbd> Finalizar venda</p>
            <p><kbd className="bg-gray-200 px-1 rounded">F4</kbd> Remover último item</p>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      <Modal
        isOpen={showPagamento}
        onClose={() => setShowPagamento(false)}
        title="Pagamento"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500">Total da Venda</p>
              <p className="text-3xl font-bold">{formatCurrency(totalVenda)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Pago</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPago)}</p>
            </div>
          </div>
          
          {troco > 0 && (
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-green-600">Troco</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(troco)}</p>
            </div>
          )}
          
          {faltaPagar > 0 && (
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-red-600">Falta Pagar</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(faltaPagar)}</p>
            </div>
          )}

          {/* Adicionar Pagamento */}
          <div className="flex gap-2">
            <Select
              value={formaPagamentoAtual}
              onChange={(v) => setFormaPagamentoAtual(v as any)}
              options={formaPagamentoOptions}
              className="w-40"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={valorPagamento}
              onChange={(e) => setValorPagamento(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdicionarPagamento()}
            />
            <Button onClick={handleAdicionarPagamento}>Adicionar</Button>
          </div>

          {/* Lista de Pagamentos */}
          {formasPagamento.length > 0 && (
            <div className="border rounded-lg divide-y">
              {formasPagamento.map((p, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <span className="capitalize">{p.tipo}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formatCurrency(p.valor)}</span>
                    <button
                      onClick={() => handleRemoverPagamento(index)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <Icons.x className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowPagamento(false)} className="flex-1">
              Voltar
            </Button>
            <Button
              onClick={handleFinalizarVenda}
              disabled={totalPago < totalVenda || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Emitindo...' : 'Emitir NFC-e'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Resultado */}
      <Modal
        isOpen={showResultado}
        onClose={handleNovaVenda}
        title="NFC-e Emitida com Sucesso!"
        size="md"
      >
        {resultadoNFCe && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Icons.check className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <p className="text-gray-500">Número</p>
              <p className="text-2xl font-bold">{resultadoNFCe.numero}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Chave de Acesso</p>
              <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded">
                {resultadoNFCe.chave_acesso}
              </p>
            </div>
            
            {resultadoNFCe.url_qrcode && (
              <div>
                <img 
                  src={resultadoNFCe.url_qrcode} 
                  alt="QR Code" 
                  className="mx-auto w-32 h-32"
                />
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button variant="secondary" onClick={handleImprimirCupom} className="flex-1">
                <Icons.printer className="w-5 h-5 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleNovaVenda} className="flex-1">
                Nova Venda
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default NFCePage;
