// =============================================
// PLANAC ERP - Filiais Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import type { Filial, Empresa } from '@/types';

export function FiliaisPage() {
  const toast = useToast();
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [empresas, setEmpresas] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    empresa_id: '',
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [filiaisRes, empresasRes] = await Promise.all([
        api.get<{ success: boolean; data: Filial[] }>('/filiais'),
        api.get<{ success: boolean; data: Empresa[] }>('/empresas'),
      ]);

      if (filiaisRes.success) setFiliais(filiaisRes.data);
      if (empresasRes.success) {
        setEmpresas(empresasRes.data.map(e => ({ value: e.id, label: e.razao_social })));
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (filial?: Filial) => {
    if (filial) {
      setEditingFilial(filial);
      setFormData({
        nome: filial.nome,
        cnpj: filial.cnpj || '',
        empresa_id: filial.empresa_id,
        ativo: filial.ativo,
      });
    } else {
      setEditingFilial(null);
      setFormData({ nome: '', cnpj: '', empresa_id: '', ativo: true });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.empresa_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      if (editingFilial) {
        await api.put(`/filiais/${editingFilial.id}`, formData);
        toast.success('Filial atualizada com sucesso');
      } else {
        await api.post('/filiais', formData);
        toast.success('Filial criada com sucesso');
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar filial');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta filial?')) return;

    try {
      await api.delete(`/filiais/${id}`);
      toast.success('Filial excluída com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir filial');
    }
  };

  const filteredFiliais = filiais.filter(
    (f) => f.nome.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'nome', header: 'Nome', sortable: true },
    { key: 'cnpj', header: 'CNPJ', width: '150px' },
    {
      key: 'empresa_id',
      header: 'Empresa',
      render: (f: Filial) => {
        const empresa = empresas.find(e => e.value === f.empresa_id);
        return empresa?.label || '-';
      },
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      render: (f: Filial) => (
        <Badge variant={f.ativo ? 'success' : 'danger'}>
          {f.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (filial: Filial) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => openModal(filial),
    },
    { type: 'separator' as const },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(filial.id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filiais</h1>
          <p className="text-gray-500">Gerencie as filiais das empresas</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => openModal()}>
          Nova Filial
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
          data={filteredFiliais}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma filial encontrada"
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFilial ? 'Editar Filial' : 'Nova Filial'}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Nome da filial"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />

          <Input
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          />

          <Select
            label="Empresa"
            value={formData.empresa_id}
            onChange={(v) => setFormData({ ...formData, empresa_id: v })}
            options={empresas}
            placeholder="Selecione a empresa"
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="filial-ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="w-4 h-4 text-planac-500 border-gray-300 rounded"
            />
            <label htmlFor="filial-ativo" className="text-sm font-medium text-gray-700">
              Filial Ativa
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            {editingFilial ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default FiliaisPage;
