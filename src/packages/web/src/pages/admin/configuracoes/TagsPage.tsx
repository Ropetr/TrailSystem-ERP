// =============================================
// PLANAC ERP - Tags Page
// Gerenciamento de tags e categorias do sistema
// =============================================

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface TagCategoria {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  ordem: number;
  ativo: boolean;
  filhos?: TagCategoria[];
}

interface Tag {
  id: string;
  categoria_id?: string;
  categoria_nome?: string;
  nome: string;
  slug: string;
  cor_hex: string;
  icone?: string;
  descricao?: string;
  ativo: boolean;
}

const coresPreDefinidas = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#6B7280', // gray
];

export function TagsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'tags' | 'categorias'>('tags');
  
  // Tags state
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [searchTags, setSearchTags] = useState('');
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isSavingTag, setIsSavingTag] = useState(false);
  const [tagForm, setTagForm] = useState({
    nome: '',
    categoria_id: '',
    cor_hex: '#6B7280',
    descricao: '',
  });

  // Categorias state
  const [categorias, setCategorias] = useState<TagCategoria[]>([]);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(true);
  const [searchCategorias, setSearchCategorias] = useState('');
  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<TagCategoria | null>(null);
  const [isSavingCategoria, setIsSavingCategoria] = useState(false);
  const [categoriaForm, setCategoriaForm] = useState({
    nome: '',
    parent_id: '',
    descricao: '',
    ordem: 0,
  });

  useEffect(() => {
    loadTags();
    loadCategorias();
  }, []);

  const loadTags = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Tag[] }>('/tags');
      if (response.success) {
        setTags(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar tags');
    } finally {
      setIsLoadingTags(false);
    }
  };

  const loadCategorias = async () => {
    try {
      const response = await api.get<{ success: boolean; data: TagCategoria[] }>('/tags/categorias');
      if (response.success) {
        setCategorias(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    } finally {
      setIsLoadingCategorias(false);
    }
  };

  // Tags handlers
  const openTagModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setTagForm({
        nome: tag.nome,
        categoria_id: tag.categoria_id || '',
        cor_hex: tag.cor_hex,
        descricao: tag.descricao || '',
      });
    } else {
      setEditingTag(null);
      setTagForm({
        nome: '',
        categoria_id: '',
        cor_hex: '#6B7280',
        descricao: '',
      });
    }
    setTagModalOpen(true);
  };

  const handleSaveTag = async () => {
    if (!tagForm.nome) {
      toast.error('Preencha o nome da tag');
      return;
    }

    setIsSavingTag(true);
    try {
      const payload = {
        nome: tagForm.nome,
        categoria_id: tagForm.categoria_id || undefined,
        cor_hex: tagForm.cor_hex,
        descricao: tagForm.descricao || undefined,
      };

      if (editingTag) {
        await api.put(`/tags/${editingTag.id}`, payload);
        toast.success('Tag atualizada com sucesso');
      } else {
        await api.post('/tags', payload);
        toast.success('Tag criada com sucesso');
      }
      setTagModalOpen(false);
      loadTags();
    } catch (error) {
      toast.error('Erro ao salvar tag');
    } finally {
      setIsSavingTag(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta tag?')) return;

    try {
      await api.delete(`/tags/${id}`);
      toast.success('Tag excluida com sucesso');
      loadTags();
    } catch (error) {
      toast.error('Erro ao excluir tag');
    }
  };

  const handleToggleTagAtivo = async (tag: Tag) => {
    try {
      await api.put(`/tags/${tag.id}`, { ativo: !tag.ativo });
      toast.success(tag.ativo ? 'Tag desativada' : 'Tag ativada');
      loadTags();
    } catch (error) {
      toast.error('Erro ao atualizar tag');
    }
  };

  // Categorias handlers
  const openCategoriaModal = (categoria?: TagCategoria) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setCategoriaForm({
        nome: categoria.nome,
        parent_id: '',
        descricao: categoria.descricao || '',
        ordem: categoria.ordem,
      });
    } else {
      setEditingCategoria(null);
      setCategoriaForm({
        nome: '',
        parent_id: '',
        descricao: '',
        ordem: 0,
      });
    }
    setCategoriaModalOpen(true);
  };

  const handleSaveCategoria = async () => {
    if (!categoriaForm.nome) {
      toast.error('Preencha o nome da categoria');
      return;
    }

    setIsSavingCategoria(true);
    try {
      const payload = {
        nome: categoriaForm.nome,
        parent_id: categoriaForm.parent_id || undefined,
        descricao: categoriaForm.descricao || undefined,
        ordem: categoriaForm.ordem,
      };

      if (editingCategoria) {
        await api.put(`/tags/categorias/${editingCategoria.id}`, payload);
        toast.success('Categoria atualizada com sucesso');
      } else {
        await api.post('/tags/categorias', payload);
        toast.success('Categoria criada com sucesso');
      }
      setCategoriaModalOpen(false);
      loadCategorias();
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    } finally {
      setIsSavingCategoria(false);
    }
  };

  const handleDeleteCategoria = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;

    try {
      await api.delete(`/tags/categorias/${id}`);
      toast.success('Categoria excluida com sucesso');
      loadCategorias();
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  // Flatten categorias for select
  const flattenCategorias = (cats: TagCategoria[], prefix = ''): { id: string; nome: string }[] => {
    return cats.flatMap(cat => [
      { id: cat.id, nome: prefix + cat.nome },
      ...(cat.filhos ? flattenCategorias(cat.filhos, prefix + '  ') : [])
    ]);
  };

  const filteredTags = tags.filter(
    (t) => t.nome.toLowerCase().includes(searchTags.toLowerCase()) ||
           (t.categoria_nome && t.categoria_nome.toLowerCase().includes(searchTags.toLowerCase()))
  );

  const filteredCategorias = categorias.filter(
    (c) => c.nome.toLowerCase().includes(searchCategorias.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Tags</h1>
          <p className="text-gray-500">Gerencie tags e categorias para organizar dados do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tags')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tags'
                ? 'border-planac-500 text-planac-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tags
          </button>
          <button
            onClick={() => setActiveTab('categorias')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categorias'
                ? 'border-planac-500 text-planac-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Categorias
          </button>
        </nav>
      </div>

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Input
              placeholder="Buscar tags..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={searchTags}
              onChange={(e) => setSearchTags(e.target.value)}
              className="max-w-md"
            />
            <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => openTagModal()}>
              Nova Tag
            </Button>
          </div>

          <Card padding="none">
            {isLoadingTags ? (
              <div className="p-8 text-center text-gray-500">Carregando...</div>
            ) : filteredTags.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhuma tag encontrada</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.cor_hex }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{tag.nome}</span>
                          {!tag.ativo && (
                            <Badge variant="warning" size="sm">Inativa</Badge>
                          )}
                        </div>
                        {tag.categoria_nome && (
                          <span className="text-sm text-gray-500">{tag.categoria_nome}</span>
                        )}
                        {tag.descricao && (
                          <p className="text-sm text-gray-400 mt-1">{tag.descricao}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleTagAtivo(tag)}
                        title={tag.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {tag.ativo ? (
                          <Icons.eyeOff className="w-4 h-4" />
                        ) : (
                          <Icons.eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTagModal(tag)}
                      >
                        <Icons.edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Icons.trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Categorias Tab */}
      {activeTab === 'categorias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Input
              placeholder="Buscar categorias..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={searchCategorias}
              onChange={(e) => setSearchCategorias(e.target.value)}
              className="max-w-md"
            />
            <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => openCategoriaModal()}>
              Nova Categoria
            </Button>
          </div>

          <Card padding="none">
            {isLoadingCategorias ? (
              <div className="p-8 text-center text-gray-500">Carregando...</div>
            ) : filteredCategorias.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhuma categoria encontrada</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCategorias.map((categoria) => (
                  <div key={categoria.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{categoria.nome}</span>
                        {!categoria.ativo && (
                          <Badge variant="warning" size="sm">Inativa</Badge>
                        )}
                      </div>
                      {categoria.descricao && (
                        <p className="text-sm text-gray-500 mt-1">{categoria.descricao}</p>
                      )}
                      {categoria.filhos && categoria.filhos.length > 0 && (
                        <p className="text-sm text-gray-400 mt-1">
                          {categoria.filhos.length} subcategoria(s)
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCategoriaModal(categoria)}
                      >
                        <Icons.edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategoria(categoria.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Icons.trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tag Modal */}
      <Modal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        title={editingTag ? 'Editar Tag' : 'Nova Tag'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Nome da tag"
            value={tagForm.nome}
            onChange={(e) => setTagForm({ ...tagForm, nome: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria (opcional)
            </label>
            <select
              value={tagForm.categoria_id}
              onChange={(e) => setTagForm({ ...tagForm, categoria_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-planac-500 focus:border-planac-500"
            >
              <option value="">Sem categoria</option>
              {flattenCategorias(categorias).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {coresPreDefinidas.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setTagForm({ ...tagForm, cor_hex: cor })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    tagForm.cor_hex === cor
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={tagForm.cor_hex}
                onChange={(e) => setTagForm({ ...tagForm, cor_hex: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <Input
                value={tagForm.cor_hex}
                onChange={(e) => setTagForm({ ...tagForm, cor_hex: e.target.value })}
                className="w-28"
                placeholder="#000000"
              />
            </div>
          </div>

          <Input
            label="Descricao (opcional)"
            placeholder="Descricao da tag"
            value={tagForm.descricao}
            onChange={(e) => setTagForm({ ...tagForm, descricao: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => setTagModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveTag} isLoading={isSavingTag}>
            {editingTag ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </Modal>

      {/* Categoria Modal */}
      <Modal
        isOpen={categoriaModalOpen}
        onClose={() => setCategoriaModalOpen(false)}
        title={editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Nome da categoria"
            value={categoriaForm.nome}
            onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria Pai (opcional)
            </label>
            <select
              value={categoriaForm.parent_id}
              onChange={(e) => setCategoriaForm({ ...categoriaForm, parent_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-planac-500 focus:border-planac-500"
            >
              <option value="">Nenhuma (categoria raiz)</option>
              {flattenCategorias(categorias.filter(c => c.id !== editingCategoria?.id)).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          <Input
            label="Descricao (opcional)"
            placeholder="Descricao da categoria"
            value={categoriaForm.descricao}
            onChange={(e) => setCategoriaForm({ ...categoriaForm, descricao: e.target.value })}
          />

          <Input
            label="Ordem"
            type="number"
            placeholder="0"
            value={categoriaForm.ordem.toString()}
            onChange={(e) => setCategoriaForm({ ...categoriaForm, ordem: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => setCategoriaModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveCategoria} isLoading={isSavingCategoria}>
            {editingCategoria ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default TagsPage;
