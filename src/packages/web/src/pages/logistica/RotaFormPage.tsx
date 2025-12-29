import { useState, useRef, useEffect } from 'react';

const globalStyles = `input:focus, textarea:focus { outline: none !important; border-color: #ef4444 !important; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important; }`;

const Icons = {
  back: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  save: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  plus: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  route: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  mapPin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  grip: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>,
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

const statusOptions = [
  { value: 'PLANEJADA', label: 'Planejada' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const veiculoOptions = [
  { value: 'VAN_01', label: 'Van 01 - ABC-1234' },
  { value: 'CAMINHAO_01', label: 'Caminhão 01 - DEF-5678' },
];

const motoristaOptions = [
  { value: 'CARLOS', label: 'Carlos Silva' },
  { value: 'PEDRO', label: 'Pedro Santos' },
];

const paradasMock = [
  { id: 1, ordem: 1, entrega: 'ENT-001', cliente: 'Comercial RSZ LTDA', endereco: 'Av. Paraná, 556 - Centro, Londrina/PR', previsao: '08:30', status: 'PENDENTE' },
  { id: 2, ordem: 2, entrega: 'ENT-002', cliente: 'Construtora ABC', endereco: 'Rua Brasil, 1200 - Zona Norte, Londrina/PR', previsao: '09:15', status: 'PENDENTE' },
  { id: 3, ordem: 3, entrega: 'ENT-003', cliente: 'Distribuidora XYZ', endereco: 'Av. JK, 800 - Centro, Cambé/PR', previsao: '10:00', status: 'PENDENTE' },
];

export default function RotaFormPage() {
  const [rota, setRota] = useState({
    numero: '',
    data: new Date().toISOString().split('T')[0],
    horaSaida: '08:00',
    horaRetorno: '',
    veiculo: 'VAN_01',
    motorista: 'CARLOS',
    status: 'PLANEJADA',
    kmInicial: 0,
    kmFinal: 0,
    observacoes: '',
  });

  const [paradas, setParadas] = useState(paradasMock);

  const getStatusBadge = (status) => {
    const styles = {
      PLANEJADA: 'bg-blue-100 text-blue-700',
      EM_ANDAMENTO: 'bg-yellow-100 text-yellow-700',
      FINALIZADA: 'bg-green-100 text-green-700',
      CANCELADA: 'bg-red-100 text-red-700',
      PENDENTE: 'bg-gray-100 text-gray-700',
      ENTREGUE: 'bg-green-100 text-green-700',
    };
    return styles[status] || styles.PLANEJADA;
  };

  const removerParada = (id) => setParadas(paradas.filter(p => p.id !== id));
  
  const moverParada = (id, direcao) => {
    const index = paradas.findIndex(p => p.id === id);
    if ((direcao === -1 && index === 0) || (direcao === 1 && index === paradas.length - 1)) return;
    const novasParadas = [...paradas];
    const temp = novasParadas[index];
    novasParadas[index] = novasParadas[index + direcao];
    novasParadas[index + direcao] = temp;
    setParadas(novasParadas.map((p, i) => ({ ...p, ordem: i + 1 })));
  };

  const totalParadas = paradas.length;
  const paradasConcluidas = paradas.filter(p => p.status === 'ENTREGUE').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{globalStyles}</style>
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">{Icons.back}</button>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white">{Icons.route}</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{rota.numero ? `Rota #${rota.numero}` : 'Nova Rota'}</h1>
                <p className="text-sm text-gray-500">{totalParadas} paradas | {paradasConcluidas} concluídas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(rota.status)}`}>
                {statusOptions.find(s => s.value === rota.status)?.label}
              </span>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                {Icons.save}<span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Dados da Rota */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados da Rota</h2>
          
          <div className="grid grid-cols-6 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input type="text" value={rota.numero} readOnly placeholder="Automático" className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data</label>
              <input type="date" value={rota.data} onChange={(e) => setRota({...rota, data: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hora Saída</label>
              <input type="time" value={rota.horaSaida} onChange={(e) => setRota({...rota, horaSaida: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hora Retorno</label>
              <input type="time" value={rota.horaRetorno} onChange={(e) => setRota({...rota, horaRetorno: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">KM Inicial</label>
              <input type="number" value={rota.kmInicial} onChange={(e) => setRota({...rota, kmInicial: parseInt(e.target.value) || 0})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">KM Final</label>
              <input type="number" value={rota.kmFinal} onChange={(e) => setRota({...rota, kmFinal: parseInt(e.target.value) || 0})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Veículo</label>
              <SelectDropdown value={rota.veiculo} onChange={(val) => setRota({...rota, veiculo: val})} options={veiculoOptions} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Motorista</label>
              <SelectDropdown value={rota.motorista} onChange={(val) => setRota({...rota, motorista: val})} options={motoristaOptions} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <SelectDropdown value={rota.status} onChange={(val) => setRota({...rota, status: val})} options={statusOptions} />
            </div>
          </div>
        </div>

        {/* Paradas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Paradas da Rota</h2>
            <button className="flex items-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm hover:bg-indigo-200">
              {Icons.plus}<span>Adicionar Parada</span>
            </button>
          </div>

          <div className="space-y-3">
            {paradas.map((parada, index) => (
              <div key={parada.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moverParada(parada.id, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">▲</button>
                  <button onClick={() => moverParada(parada.id, 1)} disabled={index === paradas.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">▼</button>
                </div>
                
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {parada.ordem}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{parada.cliente}</span>
                    <span className="text-xs text-gray-400">({parada.entrega})</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    {Icons.mapPin}
                    <span>{parada.endereco}</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">Previsão</p>
                  <p className="text-sm font-medium text-gray-800">{parada.previsao}</p>
                </div>
                
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(parada.status)}`}>
                  {parada.status}
                </span>
                
                <button onClick={() => removerParada(parada.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">{Icons.trash}</button>
              </div>
            ))}
          </div>

          {paradas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma parada adicionada</p>
              <p className="text-sm">Adicione entregas para montar a rota</p>
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
          <textarea value={rota.observacoes} onChange={(e) => setRota({...rota, observacoes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Observações da rota..." />
        </div>
      </main>
    </div>
  );
}
