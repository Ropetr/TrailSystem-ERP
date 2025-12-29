import { useState, useRef, useEffect } from 'react';

const globalStyles = `input:focus, textarea:focus, select:focus { outline: none !important; border-color: #ef4444 !important; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important; }`;

const Icons = {
  back: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  save: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  cube: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  camera: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  trending: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
  wrench: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  qrcode: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>,
};

function SelectDropdown({ value, onChange, options = [], placeholder = 'Selecione...', disabled = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const sel = options.find(o => o.value === value);
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className={`w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between transition-colors ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:border-gray-300 cursor-pointer'} ${isOpen ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}>
        <span className={sel ? 'text-gray-800' : 'text-gray-400'}>{sel?.label || placeholder}</span>
        {isOpen ? Icons.chevronUp : Icons.chevronDown}
      </button>
      {isOpen && (<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-60 overflow-auto">
        {options.map((o) => (<button key={o.value} onClick={() => { onChange(o.value); setIsOpen(false); }} className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between transition-colors ${o.value === value ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}><span>{o.label}</span>{o.value === value && Icons.check}</button>))}
      </div>)}
    </div>
  );
}

function DropdownMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const cls = (v) => { const b = 'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors'; return v === 'success' ? `${b} text-green-600 hover:bg-green-50` : v === 'danger' ? `${b} text-red-600 hover:bg-red-50` : `${b} text-gray-700 hover:bg-gray-50`; };
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">{Icons.dots}</button>
      {isOpen && (<div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-48 z-50">
        {items.map((i, idx) => i.type === 'separator' ? <div key={idx} className="border-t border-gray-100 my-2" /> : <button key={idx} onClick={() => { i.onClick?.(); setIsOpen(false); }} className={cls(i.variant)}>{i.icon && <span className="w-5 h-5">{i.icon}</span>}<span>{i.label}</span></button>)}
      </div>)}
    </div>
  );
}

const statusOptions = [{ value: 'ATIVO', label: 'Ativo' }, { value: 'MANUTENCAO', label: 'Em Manutenção' }, { value: 'BAIXADO', label: 'Baixado' }, { value: 'VENDIDO', label: 'Vendido' }];
const categoriaOptions = [{ value: 'MOVEIS', label: 'Móveis e Utensílios' }, { value: 'EQUIPAMENTOS', label: 'Equipamentos' }, { value: 'VEICULOS', label: 'Veículos' }, { value: 'INFORMATICA', label: 'Informática' }, { value: 'MAQUINAS', label: 'Máquinas' }, { value: 'IMOVEIS', label: 'Imóveis' }];
const localizacaoOptions = [{ value: 'MATRIZ', label: 'Matriz' }, { value: 'FILIAL1', label: 'Filial 01' }, { value: 'FILIAL2', label: 'Filial 02' }, { value: 'DEPOSITO', label: 'Depósito' }];
const responsavelOptions = [{ value: 'ADMIN', label: 'Administrativo' }, { value: 'COMERCIAL', label: 'Comercial' }, { value: 'OPERACIONAL', label: 'Operacional' }];
const metodoOptions = [{ value: 'LINEAR', label: 'Linear' }, { value: 'SOMA_DIGITOS', label: 'Soma dos Dígitos' }, { value: 'SALDO_DECRESCENTE', label: 'Saldo Decrescente' }];

export default function AtivoFormPage() {
  const [ativo, setAtivo] = useState({
    id: '', codigo: '', plaqueta: '', descricao: '', categoria: 'EQUIPAMENTOS', status: 'ATIVO',
    marca: '', modelo: '', numeroSerie: '', fornecedor: '', notaFiscal: '',
    dataAquisicao: new Date().toISOString().split('T')[0], valorAquisicao: 0, valorAtual: 0, valorResidual: 0,
    vidaUtil: 60, metodoDepreciacao: 'LINEAR', taxaDepreciacao: 20, depreciacaoAcumulada: 0,
    localizacao: 'MATRIZ', responsavel: 'ADMIN', observacoes: '',
  });

  const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const parseMoney = (v) => parseFloat(v.replace(/\D/g, '')) / 100 || 0;

  // Cálculo da depreciação mensal
  const depreciacaoMensal = ativo.metodoDepreciacao === 'LINEAR' 
    ? (ativo.valorAquisicao - ativo.valorResidual) / ativo.vidaUtil 
    : 0;

  const getStatusBadge = (s) => ({ ATIVO: 'bg-green-100 text-green-700', MANUTENCAO: 'bg-yellow-100 text-yellow-700', BAIXADO: 'bg-gray-100 text-gray-700', VENDIDO: 'bg-blue-100 text-blue-700' }[s] || 'bg-gray-100 text-gray-700');

  const menuItems = [{ icon: Icons.save, label: 'Salvar', variant: 'success' }, { icon: Icons.qrcode, label: 'Gerar Etiqueta' }, { icon: Icons.wrench, label: 'Registrar Manutenção' }, { type: 'separator' }, { icon: Icons.trending, label: 'Baixar Ativo', variant: 'danger' }, { icon: Icons.trash, label: 'Excluir', variant: 'danger' }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{globalStyles}</style>
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">{Icons.back}</button>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl flex items-center justify-center text-white">{Icons.cube}</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{ativo.codigo ? `Ativo #${ativo.codigo}` : 'Novo Ativo'}</h1>
                <p className="text-sm text-gray-500">{ativo.descricao || 'Cadastro de bem patrimonial'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(ativo.status)}`}>{statusOptions.find(s => s.value === ativo.status)?.label}</span>
              <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2">{Icons.save}<span>Salvar</span></button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Identificação */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Identificação</h2>
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div><label className="block text-xs text-gray-500 mb-1">Código</label><input type="text" value={ativo.codigo} readOnly placeholder="Automático" className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Plaqueta</label><input type="text" value={ativo.plaqueta} onChange={(e) => setAtivo({...ativo, plaqueta: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono" placeholder="PAT-00001" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Categoria *</label><SelectDropdown value={ativo.categoria} onChange={(v) => setAtivo({...ativo, categoria: v})} options={categoriaOptions} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Localização</label><SelectDropdown value={ativo.localizacao} onChange={(v) => setAtivo({...ativo, localizacao: v})} options={localizacaoOptions} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Status</label><SelectDropdown value={ativo.status} onChange={(v) => setAtivo({...ativo, status: v})} options={statusOptions} /></div>
          </div>
          <div className="mb-4"><label className="block text-xs text-gray-500 mb-1">Descrição *</label><input type="text" value={ativo.descricao} onChange={(e) => setAtivo({...ativo, descricao: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Descrição completa do bem" /></div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Marca</label><input type="text" value={ativo.marca} onChange={(e) => setAtivo({...ativo, marca: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Modelo</label><input type="text" value={ativo.modelo} onChange={(e) => setAtivo({...ativo, modelo: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Nº Série</label><input type="text" value={ativo.numeroSerie} onChange={(e) => setAtivo({...ativo, numeroSerie: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Responsável</label><SelectDropdown value={ativo.responsavel} onChange={(v) => setAtivo({...ativo, responsavel: v})} options={responsavelOptions} /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Aquisição */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados de Aquisição</h2>
            <div className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Data de Aquisição *</label><input type="date" value={ativo.dataAquisicao} onChange={(e) => setAtivo({...ativo, dataAquisicao: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Valor de Aquisição *</label><input type="text" value={formatMoney(ativo.valorAquisicao)} onChange={(e) => setAtivo({...ativo, valorAquisicao: parseMoney(e.target.value)})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right font-medium" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Fornecedor</label><input type="text" value={ativo.fornecedor} onChange={(e) => setAtivo({...ativo, fornecedor: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Nota Fiscal</label><input type="text" value={ativo.notaFiscal} onChange={(e) => setAtivo({...ativo, notaFiscal: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            </div>
          </div>

          {/* Depreciação */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">{Icons.trending}<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Depreciação</h2></div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Método</label><SelectDropdown value={ativo.metodoDepreciacao} onChange={(v) => setAtivo({...ativo, metodoDepreciacao: v})} options={metodoOptions} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Taxa Anual (%)</label><input type="number" value={ativo.taxaDepreciacao} onChange={(e) => setAtivo({...ativo, taxaDepreciacao: parseFloat(e.target.value) || 0})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Vida Útil (meses)</label><input type="number" value={ativo.vidaUtil} onChange={(e) => setAtivo({...ativo, vidaUtil: parseInt(e.target.value) || 0})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Valor Residual</label><input type="text" value={formatMoney(ativo.valorResidual)} onChange={(e) => setAtivo({...ativo, valorResidual: parseMoney(e.target.value)})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right" /></div>
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Depreciação Mensal:</span><span className="font-medium text-gray-800">{formatMoney(depreciacaoMensal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Depreciação Acumulada:</span><span className="font-medium text-red-600">{formatMoney(ativo.depreciacaoAcumulada)}</span></div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100"><span className="text-gray-700 font-medium">Valor Contábil Atual:</span><span className="font-bold text-cyan-600">{formatMoney(ativo.valorAquisicao - ativo.depreciacaoAcumulada)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Foto e Observações */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">{Icons.camera}<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Foto do Bem</h2></div>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-2">{Icons.camera}</div>
              <p className="text-sm text-gray-500 mb-2">Arraste uma imagem ou</p>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Selecionar Arquivo</button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
            <textarea value={ativo.observacoes} onChange={(e) => setAtivo({...ativo, observacoes: e.target.value})} rows={6} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Observações sobre o bem..." />
          </div>
        </div>
      </main>
    </div>
  );
}
