import { useState, useRef, useEffect } from 'react';

const globalStyles = `input:focus, textarea:focus, select:focus { outline: none !important; border-color: #ef4444 !important; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important; }`;

const Icons = {
  back: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  save: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  shield: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  chevronRight: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  copy: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  eye: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
};

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

// Estrutura de módulos e permissões do sistema
const modulosPermissoes = [
  {
    modulo: 'Comercial',
    itens: [
      { id: 'clientes', nome: 'Clientes', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { id: 'produtos', nome: 'Produtos', permissoes: ['visualizar', 'criar', 'editar', 'excluir', 'alterar_preco'] },
      { id: 'orcamentos', nome: 'Orçamentos', permissoes: ['visualizar', 'criar', 'editar', 'excluir', 'aprovar'] },
      { id: 'vendas', nome: 'Vendas', permissoes: ['visualizar', 'criar', 'editar', 'cancelar', 'aplicar_desconto'] },
    ]
  },
  {
    modulo: 'Estoque',
    itens: [
      { id: 'saldos', nome: 'Saldos', permissoes: ['visualizar'] },
      { id: 'movimentacoes', nome: 'Movimentações', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { id: 'transferencias', nome: 'Transferências', permissoes: ['visualizar', 'criar', 'aprovar'] },
      { id: 'inventario', nome: 'Inventário', permissoes: ['visualizar', 'criar', 'ajustar'] },
    ]
  },
  {
    modulo: 'Fiscal',
    itens: [
      { id: 'nfe', nome: 'NF-e', permissoes: ['visualizar', 'emitir', 'cancelar', 'inutilizar'] },
      { id: 'nfce', nome: 'NFC-e (PDV)', permissoes: ['visualizar', 'emitir', 'cancelar'] },
      { id: 'nfse', nome: 'NFS-e', permissoes: ['visualizar', 'emitir', 'cancelar'] },
      { id: 'sped', nome: 'SPED', permissoes: ['visualizar', 'gerar'] },
    ]
  },
  {
    modulo: 'Financeiro',
    itens: [
      { id: 'contas_receber', nome: 'Contas a Receber', permissoes: ['visualizar', 'criar', 'editar', 'baixar', 'estornar'] },
      { id: 'contas_pagar', nome: 'Contas a Pagar', permissoes: ['visualizar', 'criar', 'editar', 'baixar', 'estornar'] },
      { id: 'boletos', nome: 'Boletos', permissoes: ['visualizar', 'gerar', 'cancelar'] },
      { id: 'fluxo_caixa', nome: 'Fluxo de Caixa', permissoes: ['visualizar'] },
    ]
  },
  {
    modulo: 'Configurações',
    itens: [
      { id: 'usuarios', nome: 'Usuários', permissoes: ['visualizar', 'criar', 'editar', 'excluir', 'resetar_senha'] },
      { id: 'perfis', nome: 'Perfis', permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { id: 'empresas', nome: 'Empresas', permissoes: ['visualizar', 'editar'] },
      { id: 'integracoes', nome: 'Integrações', permissoes: ['visualizar', 'configurar'] },
    ]
  },
];

const permissaoLabels = {
  visualizar: 'Visualizar',
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
  aprovar: 'Aprovar',
  cancelar: 'Cancelar',
  baixar: 'Baixar',
  estornar: 'Estornar',
  emitir: 'Emitir',
  inutilizar: 'Inutilizar',
  gerar: 'Gerar',
  ajustar: 'Ajustar',
  alterar_preco: 'Alterar Preço',
  aplicar_desconto: 'Aplicar Desconto',
  resetar_senha: 'Resetar Senha',
  configurar: 'Configurar',
};

export default function PerfilFormPage() {
  const [perfil, setPerfil] = useState({
    id: '',
    nome: '',
    descricao: '',
    ativo: true,
    padrao: false,
  });

  const [permissoes, setPermissoes] = useState({});
  const [modulosExpandidos, setModulosExpandidos] = useState(['Comercial']);

  // Toggle de módulo expandido
  const toggleModulo = (modulo) => {
    setModulosExpandidos(prev => 
      prev.includes(modulo) ? prev.filter(m => m !== modulo) : [...prev, modulo]
    );
  };

  // Toggle de permissão individual
  const togglePermissao = (itemId, permissao) => {
    setPermissoes(prev => {
      const itemPerms = prev[itemId] || [];
      if (itemPerms.includes(permissao)) {
        return { ...prev, [itemId]: itemPerms.filter(p => p !== permissao) };
      } else {
        return { ...prev, [itemId]: [...itemPerms, permissao] };
      }
    });
  };

  // Marcar todas permissões de um item
  const toggleTodasPermissoesItem = (item) => {
    const itemPerms = permissoes[item.id] || [];
    const todasMarcadas = item.permissoes.every(p => itemPerms.includes(p));
    
    if (todasMarcadas) {
      setPermissoes(prev => ({ ...prev, [item.id]: [] }));
    } else {
      setPermissoes(prev => ({ ...prev, [item.id]: [...item.permissoes] }));
    }
  };

  // Marcar todas permissões de um módulo
  const toggleTodasPermissoesModulo = (modulo) => {
    const itens = modulosPermissoes.find(m => m.modulo === modulo)?.itens || [];
    const todosMarcados = itens.every(item => {
      const itemPerms = permissoes[item.id] || [];
      return item.permissoes.every(p => itemPerms.includes(p));
    });

    if (todosMarcados) {
      const novasPermissoes = { ...permissoes };
      itens.forEach(item => { novasPermissoes[item.id] = []; });
      setPermissoes(novasPermissoes);
    } else {
      const novasPermissoes = { ...permissoes };
      itens.forEach(item => { novasPermissoes[item.id] = [...item.permissoes]; });
      setPermissoes(novasPermissoes);
    }
  };

  // Verifica se item tem todas permissões
  const itemTemTodas = (item) => {
    const itemPerms = permissoes[item.id] || [];
    return item.permissoes.every(p => itemPerms.includes(p));
  };

  // Verifica se módulo tem todas permissões
  const moduloTemTodas = (modulo) => {
    const itens = modulosPermissoes.find(m => m.modulo === modulo)?.itens || [];
    return itens.every(item => itemTemTodas(item));
  };

  // Conta permissões do módulo
  const contarPermissoesModulo = (modulo) => {
    const itens = modulosPermissoes.find(m => m.modulo === modulo)?.itens || [];
    let total = 0, marcadas = 0;
    itens.forEach(item => {
      total += item.permissoes.length;
      marcadas += (permissoes[item.id] || []).length;
    });
    return { total, marcadas };
  };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { icon: Icons.copy, label: 'Duplicar' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Excluir', variant: 'danger' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{globalStyles}</style>
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">{Icons.back}</button>
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center text-white">{Icons.shield}</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{perfil.id ? `Perfil: ${perfil.nome}` : 'Novo Perfil de Acesso'}</h1>
                <p className="text-sm text-gray-500">Configurar permissões do sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${perfil.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{perfil.ativo ? 'Ativo' : 'Inativo'}</span>
              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2">{Icons.save}<span>Salvar</span></button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Dados do Perfil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados do Perfil</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome do Perfil *</label>
              <input 
                type="text" 
                value={perfil.nome}
                onChange={(e) => setPerfil({...perfil, nome: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Ex: Vendedor, Gerente, Administrador"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descrição</label>
              <input 
                type="text" 
                value={perfil.descricao}
                onChange={(e) => setPerfil({...perfil, descricao: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Descrição das responsabilidades"
              />
            </div>
            <div className="flex items-end gap-6">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPerfil({...perfil, ativo: !perfil.ativo})}
                  className={`relative w-12 h-6 rounded-full transition-colors ${perfil.ativo ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${perfil.ativo ? 'left-7' : 'left-1'}`} />
                </button>
                <span className="text-sm text-gray-600">Ativo</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="padrao" 
                  checked={perfil.padrao}
                  onChange={(e) => setPerfil({...perfil, padrao: e.target.checked})}
                  className="w-4 h-4 text-violet-600 rounded"
                />
                <label htmlFor="padrao" className="text-sm text-gray-600">Perfil padrão para novos usuários</label>
              </div>
            </div>
          </div>
        </div>

        {/* Permissões */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Permissões por Módulo</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const todas = {};
                  modulosPermissoes.forEach(mod => {
                    mod.itens.forEach(item => { todas[item.id] = [...item.permissoes]; });
                  });
                  setPermissoes(todas);
                }}
                className="px-3 py-1.5 text-xs bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200"
              >
                Marcar Todas
              </button>
              <button 
                onClick={() => setPermissoes({})}
                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                Desmarcar Todas
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {modulosPermissoes.map((mod) => {
              const expandido = modulosExpandidos.includes(mod.modulo);
              const { total, marcadas } = contarPermissoesModulo(mod.modulo);
              const todasMarcadas = moduloTemTodas(mod.modulo);

              return (
                <div key={mod.modulo} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Header do Módulo */}
                  <div 
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleModulo(mod.modulo)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`transition-transform ${expandido ? 'rotate-90' : ''}`}>
                        {Icons.chevronRight}
                      </span>
                      <span className="font-medium text-gray-800">{mod.modulo}</span>
                      <span className="text-xs text-gray-500">({marcadas}/{total} permissões)</span>
                    </div>
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleTodasPermissoesModulo(mod.modulo)}
                        className={`px-2 py-1 text-xs rounded ${
                          todasMarcadas 
                            ? 'bg-violet-100 text-violet-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {todasMarcadas ? 'Desmarcar Módulo' : 'Marcar Módulo'}
                      </button>
                    </div>
                  </div>

                  {/* Itens do Módulo */}
                  {expandido && (
                    <div className="divide-y divide-gray-100">
                      {mod.itens.map((item) => {
                        const itemPerms = permissoes[item.id] || [];
                        const todasItemMarcadas = itemTemTodas(item);

                        return (
                          <div key={item.id} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={todasItemMarcadas}
                                  onChange={() => toggleTodasPermissoesItem(item)}
                                  className="w-4 h-4 text-violet-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">{item.nome}</span>
                              </div>
                              <span className="text-xs text-gray-400">{itemPerms.length}/{item.permissoes.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 ml-6">
                              {item.permissoes.map((perm) => {
                                const ativa = itemPerms.includes(perm);
                                return (
                                  <button
                                    key={perm}
                                    onClick={() => togglePermissao(item.id, perm)}
                                    className={`px-2 py-1 text-xs rounded-lg flex items-center gap-1 transition-colors ${
                                      ativa
                                        ? 'bg-violet-100 text-violet-700 border border-violet-200'
                                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                  >
                                    {perm === 'visualizar' && Icons.eye}
                                    {perm === 'editar' && Icons.edit}
                                    {perm === 'criar' && Icons.plus}
                                    {perm === 'excluir' && Icons.x}
                                    <span>{permissaoLabels[perm] || perm}</span>
                                    {ativa && <span className="ml-1">{Icons.check}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-violet-50 rounded-xl border border-violet-200 p-5">
          <h2 className="text-sm font-semibold text-violet-700 uppercase tracking-wide mb-3">Resumo das Permissões</h2>
          <div className="grid grid-cols-5 gap-4">
            {modulosPermissoes.map((mod) => {
              const { total, marcadas } = contarPermissoesModulo(mod.modulo);
              const percent = total > 0 ? Math.round((marcadas / total) * 100) : 0;
              return (
                <div key={mod.modulo} className="text-center">
                  <div className="text-2xl font-bold text-violet-700">{percent}%</div>
                  <div className="text-xs text-violet-600">{mod.modulo}</div>
                  <div className="text-xs text-gray-500">{marcadas}/{total}</div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
