import React, { useState, useRef, useEffect } from 'react';

const globalStyles = `
  input:focus, textarea:focus, select:focus {
    outline: none !important;
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
  }
`;

const Icons = {
  back: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  save: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  user: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  briefcase: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  creditCard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  phone: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  mapPin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

function SelectDropdown({ value, onChange, options = [], placeholder = 'Selecione...', disabled = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { setIsOpen(false); }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled}
        className={`w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between transition-colors ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:border-gray-300 cursor-pointer'} ${isOpen ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}>
        <span className={selectedOption ? 'text-gray-800' : 'text-gray-400'}>{selectedOption?.label || placeholder}</span>
        {isOpen ? Icons.chevronUp : Icons.chevronDown}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-60 overflow-auto">
          {options.map((option) => (
            <button key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between transition-colors ${option.value === value ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
              <span>{option.label}</span>
              {option.value === value && Icons.check}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { setIsOpen(false); } }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const getItemClasses = (variant) => {
    const base = 'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors';
    switch (variant) { case 'success': return `${base} text-green-600 hover:bg-green-50`; case 'danger': return `${base} text-red-600 hover:bg-red-50`; default: return `${base} text-gray-700 hover:bg-gray-50`; }
  };
  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">{Icons.dots}</button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-48 z-50">
          {items.map((item, index) => {
            if (item.type === 'separator') return <div key={index} className="border-t border-gray-100 my-2" />;
            return (<button key={index} onClick={() => { item.onClick?.(); setIsOpen(false); }} className={getItemClasses(item.variant)}>{item.icon && <span className="w-5 h-5">{item.icon}</span>}<span>{item.label}</span></button>);
          })}
        </div>
      )}
    </div>
  );
}

const sexoOptions = [{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' }, { value: 'O', label: 'Outro' }];
const estadoCivilOptions = [{ value: 'SOLTEIRO', label: 'Solteiro(a)' }, { value: 'CASADO', label: 'Casado(a)' }, { value: 'DIVORCIADO', label: 'Divorciado(a)' }, { value: 'VIUVO', label: 'Viúvo(a)' }, { value: 'UNIAO_ESTAVEL', label: 'União Estável' }];
const tipoContratoOptions = [{ value: 'CLT', label: 'CLT' }, { value: 'PJ', label: 'Pessoa Jurídica' }, { value: 'ESTAGIARIO', label: 'Estagiário' }, { value: 'TEMPORARIO', label: 'Temporário' }, { value: 'AUTONOMO', label: 'Autônomo' }];
const departamentoOptions = [{ value: 'ADMINISTRATIVO', label: 'Administrativo' }, { value: 'COMERCIAL', label: 'Comercial' }, { value: 'FINANCEIRO', label: 'Financeiro' }, { value: 'OPERACIONAL', label: 'Operacional' }, { value: 'RH', label: 'Recursos Humanos' }, { value: 'TI', label: 'Tecnologia' }];
const cargoOptions = [{ value: 'GERENTE', label: 'Gerente' }, { value: 'SUPERVISOR', label: 'Supervisor' }, { value: 'ANALISTA', label: 'Analista' }, { value: 'ASSISTENTE', label: 'Assistente' }, { value: 'VENDEDOR', label: 'Vendedor' }, { value: 'OPERADOR', label: 'Operador' }];
const bancoOptions = [{ value: '001', label: '001 - Banco do Brasil' }, { value: '104', label: '104 - Caixa Econômica' }, { value: '237', label: '237 - Bradesco' }, { value: '341', label: '341 - Itaú' }, { value: '033', label: '033 - Santander' }, { value: '756', label: '756 - Sicoob' }];
const tipoContaOptions = [{ value: 'CORRENTE', label: 'Conta Corrente' }, { value: 'POUPANCA', label: 'Poupança' }, { value: 'SALARIO', label: 'Conta Salário' }];
const ufOptions = [{ value: 'AC', label: 'AC' },{ value: 'AL', label: 'AL' },{ value: 'AM', label: 'AM' },{ value: 'AP', label: 'AP' },{ value: 'BA', label: 'BA' },{ value: 'CE', label: 'CE' },{ value: 'DF', label: 'DF' },{ value: 'ES', label: 'ES' },{ value: 'GO', label: 'GO' },{ value: 'MA', label: 'MA' },{ value: 'MG', label: 'MG' },{ value: 'MS', label: 'MS' },{ value: 'MT', label: 'MT' },{ value: 'PA', label: 'PA' },{ value: 'PB', label: 'PB' },{ value: 'PE', label: 'PE' },{ value: 'PI', label: 'PI' },{ value: 'PR', label: 'PR' },{ value: 'RJ', label: 'RJ' },{ value: 'RN', label: 'RN' },{ value: 'RO', label: 'RO' },{ value: 'RR', label: 'RR' },{ value: 'RS', label: 'RS' },{ value: 'SC', label: 'SC' },{ value: 'SE', label: 'SE' },{ value: 'SP', label: 'SP' },{ value: 'TO', label: 'TO' }];

export default function ColaboradorFormPage() {
  const [colaborador, setColaborador] = useState({
    id: '', matricula: '', nome: '', cpf: '', rg: '', orgaoEmissor: '', dataNascimento: '', sexo: 'M', estadoCivil: 'SOLTEIRO',
    email: '', telefone: '', celular: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: 'PR',
    tipoContrato: 'CLT', departamento: 'COMERCIAL', cargo: 'VENDEDOR', dataAdmissao: new Date().toISOString().split('T')[0], dataDemissao: '',
    salario: 0, pis: '', ctps: '', ctpsSerie: '', banco: '', tipoConta: 'CORRENTE', agencia: '', conta: '', digito: '',
    observacoes: '', ativo: true,
  });

  const formatCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
  const formatCEP = (v) => v.replace(/\D/g, '').replace(/(\d{5})(\d{3}).*/, '$1-$2');
  const formatTelefone = (v) => { const n = v.replace(/\D/g, ''); return n.length <= 10 ? n.replace(/(\d{2})(\d{4})(\d{4}).*/, '($1) $2-$3') : n.replace(/(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3'); };
  const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const buscarCEP = async () => {
    const cep = colaborador.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) { setColaborador(prev => ({ ...prev, logradouro: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', uf: data.uf || 'PR' })); }
    } catch (e) { console.error('Erro CEP:', e); }
  };

  const menuItems = [{ icon: Icons.save, label: 'Salvar', variant: 'success' }, { type: 'separator' }, { icon: Icons.trash, label: 'Desativar', variant: 'danger' }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{globalStyles}</style>
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">{Icons.back}</button>
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center text-white">{Icons.user}</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{colaborador.id ? `Colaborador #${colaborador.matricula}` : 'Novo Colaborador'}</h1>
                <p className="text-sm text-gray-500">Cadastro de funcionário</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${colaborador.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{colaborador.ativo ? 'Ativo' : 'Inativo'}</span>
              <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">{Icons.save}<span>Salvar</span></button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Dados Pessoais */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados Pessoais</h2>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div><label className="block text-xs text-gray-500 mb-1">Matrícula</label><input type="text" value={colaborador.matricula} readOnly placeholder="Automático" className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Nome Completo *</label><input type="text" value={colaborador.nome} onChange={(e) => setColaborador({...colaborador, nome: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Nome completo" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">CPF *</label><input type="text" value={colaborador.cpf} onChange={(e) => setColaborador({...colaborador, cpf: formatCPF(e.target.value)})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono" placeholder="000.000.000-00" maxLength={14} /></div>
          </div>
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div><label className="block text-xs text-gray-500 mb-1">RG</label><input type="text" value={colaborador.rg} onChange={(e) => setColaborador({...colaborador, rg: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Órgão Emissor</label><input type="text" value={colaborador.orgaoEmissor} onChange={(e) => setColaborador({...colaborador, orgaoEmissor: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="SSP/PR" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Data Nascimento *</label><input type="date" value={colaborador.dataNascimento} onChange={(e) => setColaborador({...colaborador, dataNascimento: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Sexo</label><SelectDropdown value={colaborador.sexo} onChange={(v) => setColaborador({...colaborador, sexo: v})} options={sexoOptions} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Estado Civil</label><SelectDropdown value={colaborador.estadoCivil} onChange={(v) => setColaborador({...colaborador, estadoCivil: v})} options={estadoCivilOptions} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">E-mail</label><input type="email" value={colaborador.email} onChange={(e) => setColaborador({...colaborador, email: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="email@empresa.com" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Telefone</label><input type="text" value={colaborador.telefone} onChange={(e) => setColaborador({...colaborador, telefone: formatTelefone(e.target.value)})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="(00) 0000-0000" maxLength={15} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Celular *</label><input type="text" value={colaborador.celular} onChange={(e) => setColaborador({...colaborador, celular: formatTelefone(e.target.value)})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="(00) 00000-0000" maxLength={15} /></div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">{Icons.mapPin}<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Endereço</h2></div>
          <div className="grid grid-cols-6 gap-3 mb-3">
            <div><label className="block text-xs text-gray-500 mb-1">CEP</label><div className="relative"><input type="text" value={colaborador.cep} onChange={(e) => setColaborador({...colaborador, cep: formatCEP(e.target.value)})} onBlur={buscarCEP} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm pr-10" placeholder="00000-000" maxLength={9} /><button onClick={buscarCEP} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-500">{Icons.search}</button></div></div>
            <div className="col-span-3"><label className="block text-xs text-gray-500 mb-1">Logradouro</label><input type="text" value={colaborador.logradouro} onChange={(e) => setColaborador({...colaborador, logradouro: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Número</label><input type="text" value={colaborador.numero} onChange={(e) => setColaborador({...colaborador, numero: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Complemento</label><input type="text" value={colaborador.complemento} onChange={(e) => setColaborador({...colaborador, complemento: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Bairro</label><input type="text" value={colaborador.bairro} onChange={(e) => setColaborador({...colaborador, bairro: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Cidade</label><input type="text" value={colaborador.cidade} onChange={(e) => setColaborador({...colaborador, cidade: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">UF</label><SelectDropdown value={colaborador.uf} onChange={(v) => setColaborador({...colaborador, uf: v})} options={ufOptions} /></div>
          </div>
        </div>

        {/* Dados Profissionais */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">{Icons.briefcase}<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dados Profissionais</h2></div>
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div><label className="block text-xs text-gray-500 mb-1">Tipo Contrato *</label><SelectDropdown value={colaborador.tipoContrato} onChange={(v) => setColaborador({...colaborador, tipoContrato: v})} options={tipoContratoOptions} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Departamento *</label><SelectDropdown value={colaborador.departamento} onChange={(v) => setColaborador({...colaborador, departamento: v})} options={departamentoOptions} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Cargo *</label><SelectDropdown value={colaborador.cargo} onChange={(v) => setColaborador({...colaborador, cargo: v})} options={cargoOptions} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Data Admissão *</label><input type="date" value={colaborador.dataAdmissao} onChange={(e) => setColaborador({...colaborador, dataAdmissao: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Salário</label><input type="text" value={formatMoney(colaborador.salario)} onChange={(e) => setColaborador({...colaborador, salario: parseFloat(e.target.value.replace(/\D/g, '')) / 100 || 0})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right" /></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">PIS/PASEP</label><input type="text" value={colaborador.pis} onChange={(e) => setColaborador({...colaborador, pis: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">CTPS</label><input type="text" value={colaborador.ctps} onChange={(e) => setColaborador({...colaborador, ctps: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Série CTPS</label><input type="text" value={colaborador.ctpsSerie} onChange={(e) => setColaborador({...colaborador, ctpsSerie: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Status</label><div className="flex items-center gap-2 h-[34px]"><button onClick={() => setColaborador({...colaborador, ativo: !colaborador.ativo})} className={`relative w-12 h-6 rounded-full transition-colors ${colaborador.ativo ? 'bg-green-500' : 'bg-gray-300'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${colaborador.ativo ? 'left-7' : 'left-1'}`} /></button><span className="text-sm text-gray-600">{colaborador.ativo ? 'Ativo' : 'Inativo'}</span></div></div>
          </div>
        </div>

        {/* Dados Bancários */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">{Icons.creditCard}<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dados Bancários</h2></div>
          <div className="grid grid-cols-5 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Banco</label><SelectDropdown value={colaborador.banco} onChange={(v) => setColaborador({...colaborador, banco: v})} options={bancoOptions} placeholder="Selecione..." /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Tipo de Conta</label><SelectDropdown value={colaborador.tipoConta} onChange={(v) => setColaborador({...colaborador, tipoConta: v})} options={tipoContaOptions} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Agência</label><input type="text" value={colaborador.agencia} onChange={(e) => setColaborador({...colaborador, agencia: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="0000" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Conta</label><input type="text" value={colaborador.conta} onChange={(e) => setColaborador({...colaborador, conta: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="00000" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Dígito</label><input type="text" value={colaborador.digito} onChange={(e) => setColaborador({...colaborador, digito: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="0" maxLength={2} /></div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
          <textarea value={colaborador.observacoes} onChange={(e) => setColaborador({...colaborador, observacoes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Observações adicionais..." />
        </div>
      </main>
    </div>
  );
}
