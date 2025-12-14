// =============================================
// PLANAC ERP - Usuários Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import type { Usuario } from '@/types';

export function UsuariosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Usuario[] }>('/usuarios');
      if (response.success) {
        setUsuarios(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'avatar',
      header: '',
      width: '50px',
      render: (u: Usuario) => (
        <div className="w-8 h-8 bg-planac-100 rounded-full flex items-center justify-center">
          {u.avatar_url ? (
            <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <Icons.user className="w-4 h-4 text-planac-600" />
          )}
        </div>
      ),
    },
    { key: 'nome', header: 'Nome', sortable: true },
    { key: 'email', header: 'E-mail', sortable: true },
    {
      key: 'perfis',
      header: 'Perfis',
      render: (u: Usuario) => (
        <div className="flex gap-1">
          {u.perfis?.map((p) => (
            <Badge key={p.id} variant="info">{p.nome}</Badge>
          ))}
        </div>
      ),
    },
  ];

  const actions = (usuario: Usuario) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => navigate(\`/usuarios/\${usuario.id}\`),
    },
    {
      label: 'Resetar Senha',
      icon: <Icons.lock className="w-4 h-4" />,
      onClick: () => {/* reset senha */},
    },
    { type: 'separator' as const },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => {/* delete */},
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500">Gerencie os usuários do sistema</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => navigate('/usuarios/novo')}>
          Novo Usuário
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <Input
          placeholder="Buscar por nome ou e-mail..."
          leftIcon={<Icons.search className="w-5 h-5" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredUsuarios}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum usuário encontrado"
          onRowClick={(u) => navigate(\`/usuarios/\${u.id}\`)}
        />
      </Card>
    </div>
  );
}

export default UsuariosPage;
