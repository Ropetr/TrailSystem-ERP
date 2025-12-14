// =============================================
// PLANAC ERP - Usuários Page (Listagem)
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DataTable, 
  Column, 
  Button, 
  Badge, 
  Icons, 
  DropdownMenuItem,
  useToast 
} from '@/components/ui';
import api from '@/services/api';
import type { Usuario, PaginatedResponse } from '@/types';

interface UsuarioRow extends Usuario {
  ultimo_acesso?: string;
  ativo: boolean;
}

export function UsuariosPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadUsuarios = async (searchQuery = '') => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<UsuarioRow>>(
        \`/usuarios?page=\${page}&limit=10&q=\${searchQuery}\`
      );
      setUsuarios(response.data);
      setTotal(response.total);
    } catch (err) {
      error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, [page]);

  const columns: Column<UsuarioRow>[] = [
    {
      key: 'avatar',
      header: '',
      width: '50px',
      render: (row) => {
        const initials = row.nome
          ?.split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'U';
        
        return row.avatar_url ? (
          <img src={row.avatar_url} alt={row.nome} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-medium">
            {initials}
          </div>
        );
      },
    },
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
    },
    {
      key: 'email',
      header: 'E-mail',
      sortable: true,
    },
    {
      key: 'perfis',
      header: 'Perfil',
      render: (row) => (
        <div className="flex gap-1">
          {row.perfis?.slice(0, 2).map((p) => (
            <Badge key={p.id} variant="info" size="sm">{p.nome}</Badge>
          ))}
          {row.perfis?.length > 2 && (
            <Badge variant="default" size="sm">+{row.perfis.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'ultimo_acesso',
      header: 'Último Acesso',
      render: (row) => row.ultimo_acesso ? formatDate(row.ultimo_acesso) : '-',
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      render: (row) => (
        <Badge variant={row.ativo ? 'success' : 'danger'}>
          {row.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const getActions = (row: UsuarioRow): DropdownMenuItem[] => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => navigate(\`/usuarios/\${row.id}\`),
    },
    {
      label: 'Resetar Senha',
      icon: <Icons.lock className="w-4 h-4" />,
      onClick: () => resetPassword(row),
    },
    { type: 'separator' },
    {
      label: row.ativo ? 'Inativar' : 'Ativar',
      icon: row.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      variant: row.ativo ? 'danger' : 'success',
      onClick: () => toggleStatus(row),
    },
  ];

  const toggleStatus = async (usuario: UsuarioRow) => {
    try {
      await api.put(\`/usuarios/\${usuario.id}\`, { ativo: !usuario.ativo });
      success(\`Usuário \${usuario.ativo ? 'inativado' : 'ativado'} com sucesso\`);
      loadUsuarios();
    } catch (err) {
      error('Erro ao alterar status');
    }
  };

  const resetPassword = async (usuario: UsuarioRow) => {
    try {
      await api.post(\`/usuarios/\${usuario.id}/reset-senha\`);
      success('E-mail de recuperação enviado');
    } catch (err) {
      error('Erro ao resetar senha');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <Button icon={<Icons.plus className="w-4 h-4" />} onClick={() => navigate('/usuarios/novo')}>
          Novo Usuário
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        data={usuarios}
        columns={columns}
        loading={loading}
        emptyMessage="Nenhum usuário encontrado"
        searchPlaceholder="Buscar por nome ou e-mail..."
        onSearch={loadUsuarios}
        actions={getActions}
        onRowClick={(row) => navigate(\`/usuarios/\${row.id}\`)}
        pagination={{
          page,
          totalPages: Math.ceil(total / 10),
          total,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}

// Helpers
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default UsuariosPage;
