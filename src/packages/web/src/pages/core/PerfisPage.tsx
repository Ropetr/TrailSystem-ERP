// =============================================
// PLANAC ERP - Perfis de Acesso Page
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Permissao {
  modulo: string;
  ver: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  aprovar: boolean;
}

interface Perfil {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  permissoes: Permissao[];
}

const modulosDisponiveis = [
  'Empresas', 'Filiais', 'Usuários', 'Clientes', 'Produtos',
  'Orçamentos', 'Vendas', 'Compras', 'Estoque', 'Financeiro',
  'Fiscal', 'Relatórios', 'Configurações',
];

export function PerfisPage() {
  const toast = useToast();
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true,
  });
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);

  useEffect(() => {
    loadPerfis();
  }, []);

  const loadPerfis = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Perfil[] }>('/perfis');
      if (response.success) setPerfis(response.data);
    } catch {
      // Mock data
      setPerfis([
        {
          id: '1',
          nome: 'Administrador',
          descricao: 'Acesso total ao sistema',
          ativo: true,
          permissoes: modulosDisponiveis.map(m => ({
            modulo: m, ver: true, criar: true, editar: true, excluir: true, aprovar: true
          })),
        },
        {
          id: '2',
          nome: 'Vendedor',
          descricao: 'Acesso ao módulo comercial',
          ativo: true,
          permissoes: modulosDisponiveis.map(m => ({
            modulo: m,
            ver: ['Clientes', 'Produtos', 'Orçamentos', 'Vendas'].includes(m),
            criar: ['Orçamentos', 'Vendas'].includes(m),
            editar: ['Orçamentos'].includes(m),
            excluir: false,
            aprovar: false,
          })),
        },
      ]);
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
        ativo: perfil.ativo,
      });
      setPermissoes(perfil.permissoes);
    } else {
      setEditingPerfil(null);
      setFormData({ nome: '', descricao: '', ativo: true });
      setPermissoes(modulosDisponiveis.map(m => ({
        modulo: m, ver: false, criar: false, editar: false, excluir: false, aprovar: false
      })));
    }
    setIsModalOpen(true);
  };

  const togglePermissao = (modulo: string, tipo: keyof Omit<Permissao, 'modulo'>) => {
    setPermissoes(prev => prev.map(p => {
      if (p.modulo === modulo) {
        return { ...p, [tipo]: !p[tipo] };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast.error('Informe o nome do perfil');
      return;
    }

    try {
      const payload = { ...formData, permissoes };
      if (editingPerfil) {
        await api.put(`/perfis/${editingPerfil.id}`, payload);
        toast.success('Perfil atualizado!');
      } else {
        await api.post('/perfis', payload);
        toast.success('Perfil cadastrado!');
      }
      setIsModalOpen(false);
      loadPerfis();
    } catch {
      toast.error('Erro ao salvar perfil');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfis de Acesso</h1>
          <p className="text-gray-500">Gerencie perfis e permissões do sistema</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => openModal()}>
          Novo Perfil
        </Button>
      </div>

      {/* Perfis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Icons.spinner className="w-8 h-8 text-planac-500 animate-spin" />
          </div>
        ) : (
          perfis.map((perfil) => (
            <Card key={perfil.id} className="hover:border-planac-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{perfil.nome}</h3>
                  <p className="text-sm text-gray-500">{perfil.descricao}</p>
                </div>
                <Badge variant={perfil.ativo ? 'success' : 'danger'}>
                  {perfil.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {perfil.permissoes.filter(p => p.ver).slice(0, 4).map((p) => (
                  <span key={p.modulo} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {p.modulo}
                  </span>
                ))}
                {perfil.permissoes.filter(p => p.ver).length > 4 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    +{perfil.permissoes.filter(p => p.ver).length - 4}
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => openModal(perfil)}
                leftIcon={<Icons.edit className="w-4 h-4" />}
              >
                Editar Permissões
              </Button>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPerfil ? 'Editar Perfil' : 'Novo Perfil'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Dados básicos */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome do Perfil"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
            <Input
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>

          {/* Matriz de Permissões */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Permissões por Módulo</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Módulo</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Ver</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Criar</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Editar</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Excluir</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Aprovar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {permissoes.map((perm) => (
                    <tr key={perm.modulo} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-700">{perm.modulo}</td>
                      {(['ver', 'criar', 'editar', 'excluir', 'aprovar'] as const).map((tipo) => (
                        <td key={tipo} className="text-center py-2 px-3">
                          <input
                            type="checkbox"
                            checked={perm[tipo]}
                            onChange={() => togglePermissao(perm.modulo, tipo)}
                            className="w-4 h-4 text-planac-500 rounded border-gray-300 focus:ring-planac-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} leftIcon={<Icons.check className="w-4 h-4" />}>
              Salvar Perfil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PerfisPage;
