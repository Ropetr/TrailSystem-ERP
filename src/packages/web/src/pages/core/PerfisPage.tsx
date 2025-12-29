// =============================================
// PLANAC ERP - Perfis Page
// =============================================

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import type { Perfil } from '@/types';

interface Permissao {
  id: string;
  modulo: string;
  acao: string;
  descricao: string;
}

const modulosPermissoes = [
  { modulo: 'empresas', label: 'Empresas', acoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { modulo: 'filiais', label: 'Filiais', acoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { modulo: 'usuarios', label: 'Usuários', acoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { modulo: 'perfis', label: 'Perfis', acoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { modulo: 'clientes', label: 'Clientes', acoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { modulo: 'produtos', label: 'Produtos', acoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  { modulo: 'orcamentos', label: 'Orçamentos', acoes: ['visualizar', 'criar', 'editar', 'excluir', 'aprovar'] },
  { modulo: 'vendas', label: 'Vendas', acoes: ['visualizar', 'criar', 'editar', 'excluir', 'faturar'] },
  { modulo: 'financeiro', label: 'Financeiro', acoes: ['visualizar', 'criar', 'editar', 'excluir', 'baixar'] },
  { modulo: 'relatorios', label: 'Relatórios', acoes: ['visualizar', 'exportar'] },
];

export function PerfisPage() {
  const toast = useToast();
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  });
  const [permissoes, setPermissoes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadPerfis();
  }, []);

  const loadPerfis = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Perfil[] }>('/perfis');
      if (response.success) {
        setPerfis(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar perfis');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (perfil?: Perfil) => {
    if (perfil) {
      setEditingPerfil(perfil);
      setFormData({
        nome: perfil.nome,
        descricao: perfil.descricao || '',
      });
      // TODO: Carregar permissões do perfil
      setPermissoes({});
    } else {
      setEditingPerfil(null);
      setFormData({ nome: '', descricao: '' });
      setPermissoes({});
    }
    setModalOpen(true);
  };

  const togglePermissao = (modulo: string, acao: string) => {
    setPermissoes(prev => {
      const moduloPerms = prev[modulo] || [];
      if (moduloPerms.includes(acao)) {
        return { ...prev, [modulo]: moduloPerms.filter(a => a !== acao) };
      } else {
        return { ...prev, [modulo]: [...moduloPerms, acao] };
      }
    });
  };

  const toggleAllModulo = (modulo: string, acoes: string[]) => {
    setPermissoes(prev => {
      const moduloPerms = prev[modulo] || [];
      if (moduloPerms.length === acoes.length) {
        return { ...prev, [modulo]: [] };
      } else {
        return { ...prev, [modulo]: [...acoes] };
      }
    });
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast.error('Preencha o nome do perfil');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        permissoes: Object.entries(permissoes).flatMap(([modulo, acoes]) =>
          acoes.map(acao => ({ modulo, acao }))
        ),
      };

      if (editingPerfil) {
        await api.put(`/perfis/${editingPerfil.id}`, payload);
        toast.success('Perfil atualizado com sucesso');
      } else {
        await api.post('/perfis', payload);
        toast.success('Perfil criado com sucesso');
      }
      setModalOpen(false);
      loadPerfis();
    } catch (error) {
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este perfil?')) return;

    try {
      await api.delete(`/perfis/${id}`);
      toast.success('Perfil excluído com sucesso');
      loadPerfis();
    } catch (error) {
      toast.error('Erro ao excluir perfil');
    }
  };

  const filteredPerfis = perfis.filter(
    (p) => p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'nome', header: 'Nome', sortable: true },
    { key: 'descricao', header: 'Descrição' },
    {
      key: 'usuarios',
      header: 'Usuários',
      width: '100px',
      render: () => <Badge variant="info">0</Badge>,
    },
  ];

  const actions = (perfil: Perfil) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => openModal(perfil),
    },
    {
      label: 'Duplicar',
      icon: <Icons.copy className="w-4 h-4" />,
      onClick: () => {
        setEditingPerfil(null);
        setFormData({ nome: `${perfil.nome} (cópia)`, descricao: perfil.descricao || '' });
        setModalOpen(true);
      },
    },
    { type: 'separator' as const },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(perfil.id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfis de Acesso</h1>
          <p className="text-gray-500">Gerencie os perfis e permissões do sistema</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => openModal()}>
          Novo Perfil
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <Input
          placeholder="Buscar por nome..."
          leftIcon={<Icons.search className="w-5 h-5" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredPerfis}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum perfil encontrado"
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPerfil ? 'Editar Perfil' : 'Novo Perfil'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Dados do Perfil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              placeholder="Nome do perfil"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
            <Input
              label="Descrição"
              placeholder="Descrição do perfil"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>

          {/* Matriz de Permissões */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Permissões</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Módulo</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-600">Ver</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-600">Criar</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-600">Editar</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-600">Excluir</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-600">Especial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {modulosPermissoes.map((mod) => (
                    <tr key={mod.modulo} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleAllModulo(mod.modulo, mod.acoes)}
                          className="font-medium text-gray-800 hover:text-planac-600"
                        >
                          {mod.label}
                        </button>
                      </td>
                      {['visualizar', 'criar', 'editar', 'excluir'].map((acao) => (
                        <td key={acao} className="px-3 py-3 text-center">
                          {mod.acoes.includes(acao) ? (
                            <input
                              type="checkbox"
                              checked={(permissoes[mod.modulo] || []).includes(acao)}
                              onChange={() => togglePermissao(mod.modulo, acao)}
                              className="w-4 h-4 text-planac-500 border-gray-300 rounded"
                            />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center">
                        {mod.acoes.filter(a => !['visualizar', 'criar', 'editar', 'excluir'].includes(a)).map(acao => (
                          <label key={acao} className="inline-flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={(permissoes[mod.modulo] || []).includes(acao)}
                              onChange={() => togglePermissao(mod.modulo, acao)}
                              className="w-3 h-3 text-planac-500 border-gray-300 rounded"
                            />
                            {acao}
                          </label>
                        ))}
                        {mod.acoes.filter(a => !['visualizar', 'criar', 'editar', 'excluir'].includes(a)).length === 0 && (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            {editingPerfil ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default PerfisPage;
