import React from 'react';
import { useState, useRef, useEffect } from 'react';

const globalStyles = `input:focus, textarea:focus { outline: none !important; border-color: #ef4444 !important; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important; }`;

const Icons = {
  back: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  save: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  target: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  plus: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
};

function SelectDropdown({ value, onChange, options = [], placeholder = 'Selecione...', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const selectedOption = options.find(opt => opt.value === value);
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between ${isOpen ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}>
        <span className={selectedOption ? 'text-gray-800' : 'text-gray-400'}>{selectedOption?.label || placeholder}</span>
        {isOpen ? Icons.chevronUp : Icons.chevronDown}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-60 overflow-auto">
          {options.map((option) => (
            <button key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full px-4 py-2 text-sm text-left ${option.value === value ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const etapaOptions = [
  { value: 'PROSPECAO', label: 'Prospecção' },
  { value: 'QUALIFICACAO', label: 'Qualificação' },
  { value: 'PROPOSTA', label: 'Proposta' },
  { value: 'NEGOCIACAO', label: 'Negociação' },
  { value: 'FECHAMENTO', label: 'Fechamento' },
  { value: 'GANHO', label: 'Ganho' },
  { value: 'PERDIDO', label: 'Perdido' },
];

const probabilidadeOptions = [
  { value: '10', label: '10%' },
  { value: '25', label: '25%' },
  { value: '50', label: '50%' },
  { value: '75', label: '75%' },
  { value: '90', label: '90%' },
  { value: '100', label: '100%' },
];

const responsavelOptions = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MARIA', label: 'Maria' },
  { value: 'CARLOS', label: 'Carlos' },
];

export default function OportunidadeFormPage() {
  const [oportunidade, setOportunidade] = useState({
    id: '',
    titulo: '',
    cliente: '',
    clienteNome: '',
    contato: '',
    etapa: 'PROSPECAO',
    probabilidade: '25',
    valor: 0,
    valorPonderado: 0,
    responsavel: 'JUNIOR',
    dataAbertura: new Date().toISOString().split('T')[0],
    previsaoFechamento: '',
    motivoPerda: '',
    concorrente: '',
    observacoes: '',
  });

  const [produtos, setProdutos] = useState([
    { id: 1, descricao: 'Placas de Gesso Standard', quantidade: 500, valorUnit: 28.50 },
    { id: 2, descricao: 'Perfis Montante', quantidade: 200, valorUnit: 15.90 },
  ]);

  const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  
  const totalProdutos = produtos.reduce((acc, p) => acc + (p.quantidade * p.valorUnit), 0);
  const valorPonderado = totalProdutos * (parseInt(oportunidade.probabilidade) / 100);

  const removerProduto = (id) => setProdutos(produtos.filter(p => p.id !== id));

  const getEtapaBadge = (etapa) => {
    const styles = {
      PROSPECAO: 'bg-gray-100 text-gray-700',
      QUALIFICACAO: 'bg-blue-100 text-blue-700',
      PROPOSTA: 'bg-yellow-100 text-yellow-700',
      NEGOCIACAO: 'bg-orange-100 text-orange-700',
      FECHAMENTO: 'bg-purple-100 text-purple-700',
      GANHO: 'bg-green-100 text-green-700',
      PERDIDO: 'bg-red-100 text-red-700',
    };
    return styles[etapa] || styles.PROSPECAO;
  };

  // Pipeline visual
  const etapas = ['PROSPECAO', 'QUALIFICACAO', 'PROPOSTA', 'NEGOCIACAO', 'FECHAMENTO'];
  const etapaAtualIndex = etapas.indexOf(oportunidade.etapa);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{globalStyles}</style>
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">{Icons.back}</button>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-white">{Icons.target}</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{oportunidade.id ? `Oportunidade #${oportunidade.id}` : 'Nova Oportunidade'}</h1>
                <p className="text-sm text-gray-500">{oportunidade.titulo || 'Pipeline de vendas'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEtapaBadge(oportunidade.etapa)}`}>
                {etapaOptions.find(e => e.value === oportunidade.etapa)?.label}
              </span>
              <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2">
                {Icons.save}<span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Pipeline Visual */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            {etapas.map((etapa, index) => (
              <React.Fragment key={etapa}>
                <button
                  onClick={() => setOportunidade({...oportunidade, etapa})}
                  className={`flex-1 py-2 px-4 text-center text-sm font-medium rounded-lg transition-colors ${
                    index <= etapaAtualIndex
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {etapaOptions.find(e => e.value === etapa)?.label}
                </button>
                {index < etapas.length - 1 && (
                  <div className={`w-8 h-1 ${index < etapaAtualIndex ? 'bg-amber-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Dados Principais */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados da Oportunidade</h2>
              
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Título *</label>
                <input type="text" value={oportunidade.titulo} onChange={(e) => setOportunidade({...oportunidade, titulo: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Ex: Projeto Drywall - Construtora ABC" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cliente</label>
                  <input type="text" value={oportunidade.clienteNome} onChange={(e) => setOportunidade({...oportunidade, clienteNome: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Nome do cliente" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Contato</label>
                  <input type="text" value={oportunidade.contato} onChange={(e) => setOportunidade({...oportunidade, contato: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Pessoa de contato" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Etapa</label>
                  <SelectDropdown value={oportunidade.etapa} onChange={(val) => setOportunidade({...oportunidade, etapa: val})} options={etapaOptions} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Probabilidade</label>
                  <SelectDropdown value={oportunidade.probabilidade} onChange={(val) => setOportunidade({...oportunidade, probabilidade: val})} options={probabilidadeOptions} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Responsável</label>
                  <SelectDropdown value={oportunidade.responsavel} onChange={(val) => setOportunidade({...oportunidade, responsavel: val})} options={responsavelOptions} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Previsão Fechamento</label>
                  <input type="date" value={oportunidade.previsaoFechamento} onChange={(e) => setOportunidade({...oportunidade, previsaoFechamento: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Produtos/Serviços</h2>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-600 rounded-lg text-sm hover:bg-amber-200">
                  {Icons.plus}<span>Adicionar</span>
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Descrição</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-24">Qtde</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase w-28">Vlr Unit</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase w-28">Total</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {produtos.map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-800">{produto.descricao}</td>
                      <td className="px-3 py-2 text-sm text-center text-gray-600">{produto.quantidade}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-600">{formatMoney(produto.valorUnit)}</td>
                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-800">{formatMoney(produto.quantidade * produto.valorUnit)}</td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => removerProduto(produto.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">{Icons.trash}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Observações */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
              <textarea value={oportunidade.observacoes} onChange={(e) => setOportunidade({...oportunidade, observacoes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Detalhes da negociação..." />
            </div>
          </div>

          {/* Sidebar - Valores */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Resumo de Valores</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-800">{formatMoney(totalProdutos)}</p>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Probabilidade</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${oportunidade.probabilidade}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{oportunidade.probabilidade}%</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Valor Ponderado</p>
                  <p className="text-xl font-bold text-amber-600">{formatMoney(valorPonderado)}</p>
                </div>
              </div>
            </div>

            {oportunidade.etapa === 'PERDIDO' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Motivo da Perda</h2>
                <textarea value={oportunidade.motivoPerda} onChange={(e) => setOportunidade({...oportunidade, motivoPerda: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Por que perdemos?" />
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">Concorrente</label>
                  <input type="text" value={oportunidade.concorrente} onChange={(e) => setOportunidade({...oportunidade, concorrente: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Quem ganhou?" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
