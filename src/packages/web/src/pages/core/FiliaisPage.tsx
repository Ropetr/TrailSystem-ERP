// =============================================
// PLANAC ERP - Filiais Page
// =============================================

import React, { useState, useEffect } from 'react';
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

interface Filial {
  id: string;
  empresa_id: string;
  empresa_nome?: string;
  nome: string;
  cnpj?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  ativo: boolean;
}

interface Empresa {
  id: string;
  nome_fantasia: string;
}

export function FiliaisPage() {
  const toast = useToast();
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const [formData, setFormData] = useState({
    empresa_id: '',
    nome: '',
    cnpj: '',
    cep: '',
    cidade: '',
    uf: '',
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
      if (empresasRes.success) setEmpresas(empresasRes.data);
    } catch {
      // Mock data
      setFiliais([
        { id: '1', empresa_id: '1', empresa_nome: 'PLANAC', nome: 'Matriz', cidade: 'Londrina', uf: 'PR', ativo: true },
        { id: '2', empresa_id: '1', empresa_nome: 'PLANAC', nome: 'Filial Centro', cidade: 'Londrina', uf: 'PR', ativo: true },
      ]);
      setEmpresas([
        { id: '1', nome_fantasia: 'PLANAC Distribuidora' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (filial?: Filial) => {
    if (filial) {
      setEditingFilial(filial);
      setFormData({
        empresa_id: filial.empresa_id,
        nome: filial.nome,
        cnpj: filial.cnpj || '',
        cep: filial.cep || '',
        cidade: filial.cidade || '',
        uf: filial.uf || '',
        ativo: filial.ativo,
      });
    } else {
      setEditingFilial(null);
      setFormData({
        empresa_id: empresas[0]?.id || '',
        nome: '',
        cnpj: '',
        cep: '',
        cidade: '',
        uf: '',
        ativo: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.empresa_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      if (editingFilial) {
        await api.put(`/filiais/${editingFilial.id}`, formData);
        toast.success('Filial atualizada!');
      } else {
        await api.post('/filiais', formData);
        toast.success('Filial cadastrada!');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      toast.error('Erro ao salvar filial');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta filial?')) return;
    try {
      await api.delete(`/filiais/${id}`);
      toast.success('Filial excluída!');
      loadData();
    } catch {
      toast.error('Erro ao excluir filial');
    }
  };

  const filteredFiliais = filiais.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.cidade?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'nome', header: 'Nome', sortable: true },
    { key: 'empresa_nome', header: 'Empresa', sortable: true },
    {
      key: 'cidade',
      header: 'Cidade/UF',
      render: (f: Filial) => f.cidade ? `${f.cidade}/${f.uf}` : '-',
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      render: (f: Filial) => (
        <Badge variant={f.ativo ? 'success' : 'danger'}>
          {f.ativo ? 'Ativa' : 'Inativa'}
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

  const empresaOptions = empresas.map(e => ({ value: e.id, label: e.nome_fantasia }));
  const ufOptions = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
    'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ].map(uf => ({ value: uf, label: uf }));

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
          placeholder="Buscar por nome ou cidade..."
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFilial ? 'Editar Filial' : 'Nova Filial'}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Empresa"
            value={formData.empresa_id}
            onChange={(v) => setFormData({ ...formData, empresa_id: v })}
            options={empresaOptions}
          />
          
          <Input
            label="Nome da Filial"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />

          <Input
            label="CNPJ (opcional)"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="CEP"
              value={formData.cep}
              onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
            />
            <Input
              label="Cidade"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
            />
            <Select
              label="UF"
              value={formData.uf}
              onChange={(v) => setFormData({ ...formData, uf: v })}
              options={ufOptions}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="w-4 h-4 text-planac-500 rounded"
            />
            <span className="text-sm text-gray-700">Filial Ativa</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} leftIcon={<Icons.check className="w-4 h-4" />}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default FiliaisPage;
