// =============================================
// PLANAC ERP - Base de Conhecimento
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Artigo {
  id: string;
  titulo: string;
  slug: string;
  conteudo: string;
  resumo: string;
  categoria_id: string;
  categoria_nome: string;
  tags: string[];
  status: 'rascunho' | 'publicado' | 'arquivado';
  autor_id: string;
  autor_nome: string;
  visualizacoes: number;
  avaliacoes_positivas: number;
  avaliacoes_negativas: number;
  data_criacao: string;
  data_atualizacao: string;
  relacionados?: string[];
}

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  icone?: string;
  artigos_count: number;
}

const statusConfig = {
  rascunho: { label: 'Rascunho', variant: 'warning' as const },
  publicado: { label: 'Publicado', variant: 'success' as const },
  arquivado: { label: 'Arquivado', variant: 'default' as const },
};

export function BaseConhecimentoPage() {
  const toast = useToast();
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'lista'>('cards');
  
  // Modal editor
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [artigoEdit, setArtigoEdit] = useState<Artigo | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    resumo: '',
    conteudo: '',
    categoria_id: '',
    tags: '',
    status: 'rascunho',
  });
  
  // Modal visualização
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [artigoVisualizar, setArtigoVisualizar] = useState<Artigo | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [artigosRes, categoriasRes] = await Promise.all([
        api.get<{ success: boolean; data: Artigo[] }>('/suporte/artigos'),
        api.get<{ success: boolean; data: Categoria[] }>('/suporte/artigos/categorias'),
      ]);
      
      if (artigosRes.success) setArtigos(artigosRes.data);
      if (categoriasRes.success) setCategorias(categoriasRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!formData.titulo || !formData.conteudo || !formData.categoria_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (artigoEdit) {
        await api.put(`/suporte/artigos/${artigoEdit.id}`, payload);
        toast.success('Artigo atualizado');
      } else {
        await api.post('/suporte/artigos', payload);
        toast.success('Artigo criado');
      }

      setShowEditorModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar artigo');
    }
  };

  const handleEditar = (artigo: Artigo) => {
    setArtigoEdit(artigo);
    setFormData({
      titulo: artigo.titulo,
      resumo: artigo.resumo,
      conteudo: artigo.conteudo,
      categoria_id: artigo.categoria_id,
      tags: artigo.tags.join(', '),
      status: artigo.status,
    });
    setShowEditorModal(true);
  };

  const handleVisualizar = async (artigo: Artigo) => {
    try {
      await api.post(`/suporte/artigos/${artigo.id}/visualizar`);
      setArtigoVisualizar(artigo);
      setShowVisualizarModal(true);
    } catch (error) {
      setArtigoVisualizar(artigo);
      setShowVisualizarModal(true);
    }
  };

  const handleAvaliar = async (artigoId: string, positivo: boolean) => {
    try {
      await api.post(`/suporte/artigos/${artigoId}/avaliar`, { positivo });
      toast.success('Obrigado pelo feedback!');
      loadData();
    } catch (error) {
      toast.error('Erro ao avaliar');
    }
  };

  const handleDuplicar = async (artigo: Artigo) => {
    setArtigoEdit(null);
    setFormData({
      titulo: `${artigo.titulo} (Cópia)`,
      resumo: artigo.resumo,
      conteudo: artigo.conteudo,
      categoria_id: artigo.categoria_id,
      tags: artigo.tags.join(', '),
      status: 'rascunho',
    });
    setShowEditorModal(true);
  };

  const resetForm = () => {
    setArtigoEdit(null);
    setFormData({ titulo: '', resumo: '', conteudo: '', categoria_id: '', tags: '', status: 'rascunho' });
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const filteredArtigos = artigos.filter((a) => {
    const matchSearch = a.titulo.toLowerCase().includes(search.toLowerCase()) ||
      a.resumo.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCategoria = !categoriaFilter || a.categoria_id === categoriaFilter;
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchCategoria && matchStatus;
  });

  // Stats
  const stats = {
    total: artigos.length,
    publicados: artigos.filter(a => a.status === 'publicado').length,
    visualizacoes: artigos.reduce((acc, a) => acc + a.visualizacoes, 0),
    aprovacao: artigos.length > 0 
      ? Math.round((artigos.reduce((acc, a) => acc + a.avaliacoes_positivas, 0) / 
                   (artigos.reduce((acc, a) => acc + a.avaliacoes_positivas + a.avaliacoes_negativas, 0) || 1)) * 100)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Base de Conhecimento</h1>
          <p className="text-gray-500">Artigos e documentação de suporte</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => { resetForm(); setShowEditorModal(true); }}>
          Novo Artigo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total de Artigos</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Publicados</p>
          <p className="text-2xl font-bold text-green-600">{stats.publicados}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Visualizações</p>
          <p className="text-2xl font-bold text-blue-600">{stats.visualizacoes}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Taxa de Aprovação</p>
          <p className="text-2xl font-bold text-planac-600">{stats.aprovacao}%</p>
        </Card>
      </div>

      {/* Categorias */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            className={`p-4 rounded-lg border text-center transition-colors ${
              categoriaFilter === cat.id ? 'border-planac-500 bg-planac-50' : 'hover:border-gray-300'
            }`}
            onClick={() => setCategoriaFilter(categoriaFilter === cat.id ? '' : cat.id)}
          >
            <span className="text-2xl block mb-2">{cat.icone || '📄'}</span>
            <p className="font-medium text-sm">{cat.nome}</p>
            <p className="text-xs text-gray-500">{cat.artigos_count} artigos</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar artigos..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: '', label: 'Todos Status' }, ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))]}
          />
          <div className="flex">
            <Button size="sm" variant={viewMode === 'cards' ? 'primary' : 'secondary'} className="rounded-r-none" onClick={() => setViewMode('cards')}>
              <Icons.grid className="w-4 h-4" />
            </Button>
            <Button size="sm" variant={viewMode === 'lista' ? 'primary' : 'secondary'} className="rounded-l-none" onClick={() => setViewMode('lista')}>
              <Icons.list className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Artigos */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArtigos.map((artigo) => (
            <Card key={artigo.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleVisualizar(artigo)}>
              <div className="flex justify-between items-start mb-2">
                <Badge variant={statusConfig[artigo.status].variant}>{statusConfig[artigo.status].label}</Badge>
                <span className="text-xs text-gray-500">{artigo.categoria_nome}</span>
              </div>
              <h3 className="font-bold mb-2">{artigo.titulo}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{artigo.resumo}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {artigo.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tag}</span>
                ))}
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t">
                <span>👁️ {artigo.visualizacoes}</span>
                <span>👍 {artigo.avaliacoes_positivas} 👎 {artigo.avaliacoes_negativas}</span>
                <span>{formatDate(artigo.data_atualizacao)}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card padding="none">
          <div className="divide-y">
            {filteredArtigos.map((artigo) => (
              <div key={artigo.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleVisualizar(artigo)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{artigo.titulo}</h3>
                      <Badge variant={statusConfig[artigo.status].variant} className="text-xs">{statusConfig[artigo.status].label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{artigo.resumo}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>👁️ {artigo.visualizacoes}</p>
                    <p>{formatDate(artigo.data_atualizacao)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {filteredArtigos.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Icons.document className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-700">Nenhum artigo encontrado</h3>
        </div>
      )}

      {/* Modal Editor */}
      <Modal isOpen={showEditorModal} onClose={() => setShowEditorModal(false)} title={artigoEdit ? 'Editar Artigo' : 'Novo Artigo'} size="xl">
        <div className="space-y-4">
          <Input label="Título *" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Categoria *" value={formData.categoria_id} onChange={(v) => setFormData({ ...formData, categoria_id: v })}
              options={[{ value: '', label: 'Selecione...' }, ...categorias.map(c => ({ value: c.id, label: c.nome }))]} />
            <Select label="Status" value={formData.status} onChange={(v) => setFormData({ ...formData, status: v })}
              options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))} />
          </div>
          <Input label="Resumo" value={formData.resumo} onChange={(e) => setFormData({ ...formData, resumo: e.target.value })} placeholder="Breve descrição do artigo..." />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
            <textarea
              className="w-full h-64 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-planac-500"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Conteúdo do artigo (suporta Markdown)..."
            />
          </div>
          <Input label="Tags" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="Separadas por vírgula..." />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEditorModal(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>{artigoEdit ? 'Atualizar' : 'Criar'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Visualizar */}
      <Modal isOpen={showVisualizarModal} onClose={() => setShowVisualizarModal(false)} title={artigoVisualizar?.titulo || ''} size="lg">
        {artigoVisualizar && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{artigoVisualizar.categoria_nome}</span>
              <span>•</span>
              <span>Atualizado em {formatDate(artigoVisualizar.data_atualizacao)}</span>
              <span>•</span>
              <span>👁️ {artigoVisualizar.visualizacoes}</span>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-600 italic mb-4">{artigoVisualizar.resumo}</p>
              <div className="whitespace-pre-wrap">{artigoVisualizar.conteudo}</div>
            </div>
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {artigoVisualizar.tags.map((tag, i) => (
                <span key={i} className="text-sm bg-gray-100 px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Este artigo foi útil?</span>
                <Button size="sm" variant="secondary" onClick={() => handleAvaliar(artigoVisualizar.id, true)}>👍 Sim</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAvaliar(artigoVisualizar.id, false)}>👎 Não</Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { handleDuplicar(artigoVisualizar); setShowVisualizarModal(false); }}>Duplicar</Button>
                <Button size="sm" variant="secondary" onClick={() => { handleEditar(artigoVisualizar); setShowVisualizarModal(false); }}>Editar</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BaseConhecimentoPage;
