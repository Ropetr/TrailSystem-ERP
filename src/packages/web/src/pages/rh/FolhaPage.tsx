// =============================================
// PLANAC ERP - Folha de Pagamento
// =============================================

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface ContraCheque {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  funcionario_matricula: string;
  cargo: string;
  departamento: string;
  competencia: string;
  salario_base: number;
  proventos: {
    codigo: string;
    descricao: string;
    referencia?: number;
    valor: number;
  }[];
  descontos: {
    codigo: string;
    descricao: string;
    referencia?: number;
    valor: number;
  }[];
  total_proventos: number;
  total_descontos: number;
  salario_liquido: number;
  status: 'calculando' | 'calculado' | 'aprovado' | 'pago';
  data_pagamento?: string;
}

interface ResumoFolha {
  competencia: string;
  total_funcionarios: number;
  total_proventos: number;
  total_descontos: number;
  total_liquido: number;
  inss_empresa: number;
  fgts: number;
  status: 'aberta' | 'calculada' | 'fechada' | 'paga';
}

const statusConfig = {
  calculando: { label: 'Calculando', variant: 'warning' as const },
  calculado: { label: 'Calculado', variant: 'info' as const },
  aprovado: { label: 'Aprovado', variant: 'success' as const },
  pago: { label: 'Pago', variant: 'default' as const },
};

const statusFolhaConfig = {
  aberta: { label: 'Aberta', variant: 'warning' as const },
  calculada: { label: 'Calculada', variant: 'info' as const },
  fechada: { label: 'Fechada', variant: 'success' as const },
  paga: { label: 'Paga', variant: 'default' as const },
};

export function FolhaPage() {
  const toast = useToast();
  const [contraCheques, setContraCheques] = useState<ContraCheque[]>([]);
  const [resumo, setResumo] = useState<ResumoFolha | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState('');
  
  // Modal de detalhes
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [contraChequeDetalhes, setContraChequeDetalhes] = useState<ContraCheque | null>(null);
  
  // Modal de lançamento
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [lancamentoForm, setLancamentoForm] = useState({
    funcionario_id: '',
    tipo: 'provento',
    codigo: '',
    descricao: '',
    valor: '',
  });

  useEffect(() => {
    loadFolha();
  }, [competencia]);

  const loadFolha = async () => {
    try {
      const response = await api.get<{ success: boolean; data: ContraCheque[]; resumo: ResumoFolha }>(
        `/rh/folha?competencia=${competencia}`
      );
      if (response.success) {
        setContraCheques(response.data);
        setResumo(response.resumo);
      }
    } catch (error) {
      toast.error('Erro ao carregar folha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalcularFolha = async () => {
    try {
      await api.post(`/rh/folha/calcular?competencia=${competencia}`);
      toast.success('Folha calculada');
      loadFolha();
    } catch (error) {
      toast.error('Erro ao calcular folha');
    }
  };

  const handleFecharFolha = async () => {
    if (!confirm('Deseja realmente fechar a folha? Esta ação não pode ser desfeita.')) return;

    try {
      await api.post(`/rh/folha/fechar?competencia=${competencia}`);
      toast.success('Folha fechada');
      loadFolha();
    } catch (error) {
      toast.error('Erro ao fechar folha');
    }
  };

  const handleGerarBoletos = async () => {
    try {
      await api.post(`/rh/folha/gerar-pagamentos?competencia=${competencia}`);
      toast.success('Pagamentos gerados');
    } catch (error) {
      toast.error('Erro ao gerar pagamentos');
    }
  };

  const handleSalvarLancamento = async () => {
    if (!lancamentoForm.funcionario_id || !lancamentoForm.valor) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      await api.post('/rh/folha/lancamento', {
        ...lancamentoForm,
        competencia,
        valor: parseFloat(lancamentoForm.valor),
      });
      toast.success('Lançamento registrado');
      setShowLancamentoModal(false);
      setLancamentoForm({ funcionario_id: '', tipo: 'provento', codigo: '', descricao: '', valor: '' });
      loadFolha();
    } catch (error) {
      toast.error('Erro ao registrar lançamento');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredContraCheques = contraCheques.filter((cc) => {
    return cc.funcionario_nome.toLowerCase().includes(search.toLowerCase()) ||
           cc.funcionario_matricula.includes(search);
  });

  const columns = [
    {
      key: 'funcionario',
      header: 'Funcionário',
      render: (cc: ContraCheque) => (
        <div>
          <p className="font-medium">{cc.funcionario_nome}</p>
          <p className="text-sm text-gray-500">{cc.funcionario_matricula} - {cc.cargo}</p>
        </div>
      ),
    },
    {
      key: 'salario_base',
      header: 'Salário Base',
      width: '120px',
      render: (cc: ContraCheque) => formatCurrency(cc.salario_base),
    },
    {
      key: 'proventos',
      header: 'Proventos',
      width: '120px',
      render: (cc: ContraCheque) => (
        <span className="text-green-600 font-medium">{formatCurrency(cc.total_proventos)}</span>
      ),
    },
    {
      key: 'descontos',
      header: 'Descontos',
      width: '120px',
      render: (cc: ContraCheque) => (
        <span className="text-red-600 font-medium">{formatCurrency(cc.total_descontos)}</span>
      ),
    },
    {
      key: 'liquido',
      header: 'Líquido',
      width: '130px',
      render: (cc: ContraCheque) => (
        <span className="text-planac-600 font-bold text-lg">{formatCurrency(cc.salario_liquido)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (cc: ContraCheque) => {
        const config = statusConfig[cc.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (cc: ContraCheque) => [
    {
      label: 'Ver Detalhes',
      icon: <Icons.eye className="w-4 h-4" />,
      onClick: () => {
        setContraChequeDetalhes(cc);
        setShowDetalhesModal(true);
      },
    },
    {
      label: 'Imprimir',
      icon: <Icons.printer className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      label: 'Enviar por E-mail',
      icon: <Icons.email className="w-4 h-4" />,
      onClick: () => {},
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Folha de Pagamento</h1>
          <p className="text-gray-500">Gestão da folha de pagamento mensal</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Resumo */}
      {resumo && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold">Resumo da Folha</h3>
              <Badge variant={statusFolhaConfig[resumo.status].variant}>
                {statusFolhaConfig[resumo.status].label}
              </Badge>
            </div>
            <div className="flex gap-2">
              {resumo.status === 'aberta' && (
                <>
                  <Button variant="secondary" onClick={() => setShowLancamentoModal(true)}>
                    Lançamento Avulso
                  </Button>
                  <Button onClick={handleCalcularFolha}>
                    Calcular Folha
                  </Button>
                </>
              )}
              {resumo.status === 'calculada' && (
                <>
                  <Button variant="secondary" onClick={handleCalcularFolha}>
                    Recalcular
                  </Button>
                  <Button onClick={handleFecharFolha}>
                    Fechar Folha
                  </Button>
                </>
              )}
              {resumo.status === 'fechada' && (
                <Button onClick={handleGerarBoletos}>
                  Gerar Pagamentos
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <p className="text-sm text-gray-500">Funcionários</p>
              <p className="text-xl font-bold">{resumo.total_funcionarios}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Proventos</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(resumo.total_proventos)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Descontos</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(resumo.total_descontos)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Líquido</p>
              <p className="text-xl font-bold text-planac-600">{formatCurrency(resumo.total_liquido)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">INSS Empresa</p>
              <p className="text-xl font-bold">{formatCurrency(resumo.inss_empresa)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">FGTS</p>
              <p className="text-xl font-bold">{formatCurrency(resumo.fgts)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nome ou matrícula..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="secondary" leftIcon={<Icons.printer className="w-5 h-5" />}>
            Exportar Relatório
          </Button>
        </div>
      </Card>

      {/* Tabela */}
      <Card padding="none">
        <DataTable
          data={filteredContraCheques}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum contra-cheque encontrado"
        />
      </Card>

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetalhesModal}
        onClose={() => setShowDetalhesModal(false)}
        title={`Contra-Cheque - ${contraChequeDetalhes?.funcionario_nome}`}
        size="lg"
      >
        {contraChequeDetalhes && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Matrícula</p>
                <p className="font-medium">{contraChequeDetalhes.funcionario_matricula}</p>
              </div>
              <div>
                <p className="text-gray-500">Cargo</p>
                <p className="font-medium">{contraChequeDetalhes.cargo}</p>
              </div>
              <div>
                <p className="text-gray-500">Departamento</p>
                <p className="font-medium">{contraChequeDetalhes.departamento}</p>
              </div>
            </div>
            
            {/* Proventos */}
            <div>
              <p className="font-medium text-green-700 mb-2">PROVENTOS</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="text-left p-2">Código</th>
                      <th className="text-left p-2">Descrição</th>
                      <th className="text-right p-2">Ref.</th>
                      <th className="text-right p-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {contraChequeDetalhes.proventos.map((p, i) => (
                      <tr key={i}>
                        <td className="p-2">{p.codigo}</td>
                        <td className="p-2">{p.descricao}</td>
                        <td className="p-2 text-right">{p.referencia || '-'}</td>
                        <td className="p-2 text-right font-medium text-green-600">{formatCurrency(p.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-green-50">
                    <tr>
                      <td colSpan={3} className="p-2 font-medium">Total Proventos</td>
                      <td className="p-2 text-right font-bold text-green-600">{formatCurrency(contraChequeDetalhes.total_proventos)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {/* Descontos */}
            <div>
              <p className="font-medium text-red-700 mb-2">DESCONTOS</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="text-left p-2">Código</th>
                      <th className="text-left p-2">Descrição</th>
                      <th className="text-right p-2">Ref.</th>
                      <th className="text-right p-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {contraChequeDetalhes.descontos.map((d, i) => (
                      <tr key={i}>
                        <td className="p-2">{d.codigo}</td>
                        <td className="p-2">{d.descricao}</td>
                        <td className="p-2 text-right">{d.referencia || '-'}</td>
                        <td className="p-2 text-right font-medium text-red-600">{formatCurrency(d.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-red-50">
                    <tr>
                      <td colSpan={3} className="p-2 font-medium">Total Descontos</td>
                      <td className="p-2 text-right font-bold text-red-600">{formatCurrency(contraChequeDetalhes.total_descontos)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {/* Total */}
            <div className="bg-planac-50 p-4 rounded-lg flex justify-between items-center">
              <span className="font-bold text-lg">SALÁRIO LÍQUIDO</span>
              <span className="font-bold text-2xl text-planac-600">{formatCurrency(contraChequeDetalhes.salario_liquido)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Lançamento */}
      <Modal
        isOpen={showLancamentoModal}
        onClose={() => setShowLancamentoModal(false)}
        title="Lançamento Avulso"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Funcionário *"
            value={lancamentoForm.funcionario_id}
            onChange={(v) => setLancamentoForm({ ...lancamentoForm, funcionario_id: v })}
            options={[
              { value: '', label: 'Selecione...' },
              ...contraCheques.map(cc => ({ value: cc.funcionario_id, label: cc.funcionario_nome })),
            ]}
          />
          <Select
            label="Tipo"
            value={lancamentoForm.tipo}
            onChange={(v) => setLancamentoForm({ ...lancamentoForm, tipo: v })}
            options={[
              { value: 'provento', label: 'Provento (Crédito)' },
              { value: 'desconto', label: 'Desconto (Débito)' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código"
              value={lancamentoForm.codigo}
              onChange={(e) => setLancamentoForm({ ...lancamentoForm, codigo: e.target.value })}
            />
            <Input
              label="Valor *"
              type="number"
              value={lancamentoForm.valor}
              onChange={(e) => setLancamentoForm({ ...lancamentoForm, valor: e.target.value })}
            />
          </div>
          <Input
            label="Descrição"
            value={lancamentoForm.descricao}
            onChange={(e) => setLancamentoForm({ ...lancamentoForm, descricao: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowLancamentoModal(false)}>Cancelar</Button>
            <Button onClick={handleSalvarLancamento}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default FolhaPage;
