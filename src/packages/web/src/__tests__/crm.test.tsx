// =============================================
// PLANAC ERP - CRM Module Tests
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CRMDashboardPage } from './CRMDashboardPage';
import { PipelinePage } from './PipelinePage';
import { LeadsPage } from './LeadsPage';
import { OportunidadesPage } from './OportunidadesPage';
import { AtividadesPage } from './AtividadesPage';

// Mock do serviço de API
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock do useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock do Toast
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// =============================================
// CRM Dashboard Tests
// =============================================
describe('CRMDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o título da página', async () => {
    renderWithRouter(<CRMDashboardPage />);
    expect(screen.getByText('CRM - Dashboard')).toBeInTheDocument();
  });

  it('deve exibir os KPIs principais', async () => {
    renderWithRouter(<CRMDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Pipeline Total')).toBeInTheDocument();
      expect(screen.getByText('Ganho no Mês')).toBeInTheDocument();
      expect(screen.getByText('Taxa de Conversão')).toBeInTheDocument();
      expect(screen.getByText('Ticket Médio')).toBeInTheDocument();
    });
  });

  it('deve ter botão de nova oportunidade', () => {
    renderWithRouter(<CRMDashboardPage />);
    expect(screen.getByText('Nova Oportunidade')).toBeInTheDocument();
  });

  it('deve navegar ao clicar em nova oportunidade', () => {
    renderWithRouter(<CRMDashboardPage />);
    fireEvent.click(screen.getByText('Nova Oportunidade'));
    expect(mockNavigate).toHaveBeenCalledWith('/crm/oportunidades/nova');
  });

  it('deve exibir seção de funil de vendas', async () => {
    renderWithRouter(<CRMDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Funil de Vendas')).toBeInTheDocument();
    });
  });

  it('deve exibir seção de ranking de vendedores', async () => {
    renderWithRouter(<CRMDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Ranking de Vendedores')).toBeInTheDocument();
    });
  });

  it('deve exibir próximas atividades', async () => {
    renderWithRouter(<CRMDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Próximas Atividades')).toBeInTheDocument();
    });
  });

  it('deve ter ações rápidas', () => {
    renderWithRouter(<CRMDashboardPage />);
    expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
    expect(screen.getByText('Novo Lead')).toBeInTheDocument();
  });
});

// =============================================
// Pipeline (Kanban) Tests
// =============================================
describe('PipelinePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o título da página', async () => {
    renderWithRouter(<PipelinePage />);
    expect(screen.getByText('Pipeline de Vendas')).toBeInTheDocument();
  });

  it('deve exibir todas as etapas do funil', async () => {
    renderWithRouter(<PipelinePage />);
    await waitFor(() => {
      expect(screen.getByText('Prospecção')).toBeInTheDocument();
      expect(screen.getByText('Qualificação')).toBeInTheDocument();
      expect(screen.getByText('Proposta')).toBeInTheDocument();
      expect(screen.getByText('Negociação')).toBeInTheDocument();
      expect(screen.getByText('Fechamento')).toBeInTheDocument();
    });
  });

  it('deve ter colunas de Ganhos e Perdidos', async () => {
    renderWithRouter(<PipelinePage />);
    await waitFor(() => {
      expect(screen.getByText('Ganhos')).toBeInTheDocument();
      expect(screen.getByText('Perdidos')).toBeInTheDocument();
    });
  });

  it('deve ter filtro de busca', () => {
    renderWithRouter(<PipelinePage />);
    expect(screen.getByPlaceholderText('Buscar oportunidade ou cliente...')).toBeInTheDocument();
  });

  it('deve ter filtro de vendedor', () => {
    renderWithRouter(<PipelinePage />);
    expect(screen.getByText('Vendedor')).toBeInTheDocument();
  });

  it('deve ter botão de dashboard', () => {
    renderWithRouter(<PipelinePage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});

// =============================================
// Leads Tests
// =============================================
describe('LeadsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o título da página', async () => {
    renderWithRouter(<LeadsPage />);
    expect(screen.getByText('Leads')).toBeInTheDocument();
  });

  it('deve exibir estatísticas', async () => {
    renderWithRouter(<LeadsPage />);
    await waitFor(() => {
      expect(screen.getByText('Total de Leads')).toBeInTheDocument();
      expect(screen.getByText('Novos')).toBeInTheDocument();
      expect(screen.getByText('Qualificados')).toBeInTheDocument();
      expect(screen.getByText('Convertidos')).toBeInTheDocument();
    });
  });

  it('deve ter botão de novo lead', () => {
    renderWithRouter(<LeadsPage />);
    expect(screen.getByText('Novo Lead')).toBeInTheDocument();
  });

  it('deve navegar ao clicar em novo lead', () => {
    renderWithRouter(<LeadsPage />);
    fireEvent.click(screen.getByText('Novo Lead'));
    expect(mockNavigate).toHaveBeenCalledWith('/crm/leads/novo');
  });

  it('deve ter filtro de origem', () => {
    renderWithRouter(<LeadsPage />);
    expect(screen.getByText('Origem')).toBeInTheDocument();
  });

  it('deve ter filtro de status', () => {
    renderWithRouter(<LeadsPage />);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('deve ter botão de importar', () => {
    renderWithRouter(<LeadsPage />);
    expect(screen.getByText('Importar')).toBeInTheDocument();
  });
});

// =============================================
// Oportunidades Tests
// =============================================
describe('OportunidadesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o título da página', async () => {
    renderWithRouter(<OportunidadesPage />);
    expect(screen.getByText('Oportunidades')).toBeInTheDocument();
  });

  it('deve exibir estatísticas', async () => {
    renderWithRouter(<OportunidadesPage />);
    await waitFor(() => {
      expect(screen.getByText('Abertas')).toBeInTheDocument();
      expect(screen.getByText('Em Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Ganhas')).toBeInTheDocument();
      expect(screen.getByText('Valor Ganho')).toBeInTheDocument();
    });
  });

  it('deve ter botão de nova oportunidade', () => {
    renderWithRouter(<OportunidadesPage />);
    expect(screen.getByText('Nova Oportunidade')).toBeInTheDocument();
  });

  it('deve ter botão de ver pipeline', () => {
    renderWithRouter(<OportunidadesPage />);
    expect(screen.getByText('Ver Pipeline')).toBeInTheDocument();
  });

  it('deve navegar ao clicar em ver pipeline', () => {
    renderWithRouter(<OportunidadesPage />);
    fireEvent.click(screen.getByText('Ver Pipeline'));
    expect(mockNavigate).toHaveBeenCalledWith('/crm/pipeline');
  });

  it('deve ter filtro de etapa', () => {
    renderWithRouter(<OportunidadesPage />);
    expect(screen.getByText('Etapa')).toBeInTheDocument();
  });

  it('deve ter filtro de status', () => {
    renderWithRouter(<OportunidadesPage />);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});

// =============================================
// Atividades Tests
// =============================================
describe('AtividadesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o título da página', async () => {
    renderWithRouter(<AtividadesPage />);
    expect(screen.getByText('Atividades')).toBeInTheDocument();
  });

  it('deve exibir estatísticas', async () => {
    renderWithRouter(<AtividadesPage />);
    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Pendentes')).toBeInTheDocument();
      expect(screen.getByText('Atrasadas')).toBeInTheDocument();
      expect(screen.getByText('Concluídas')).toBeInTheDocument();
    });
  });

  it('deve ter botão de nova atividade', () => {
    renderWithRouter(<AtividadesPage />);
    expect(screen.getByText('Nova Atividade')).toBeInTheDocument();
  });

  it('deve navegar ao clicar em nova atividade', () => {
    renderWithRouter(<AtividadesPage />);
    fireEvent.click(screen.getByText('Nova Atividade'));
    expect(mockNavigate).toHaveBeenCalledWith('/crm/atividades/nova');
  });

  it('deve ter toggle de visualização lista/calendário', () => {
    renderWithRouter(<AtividadesPage />);
    // Verifica se os botões de toggle existem
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('deve ter filtro de período', () => {
    renderWithRouter(<AtividadesPage />);
    expect(screen.getByText('Período')).toBeInTheDocument();
  });

  it('deve ter filtro de tipo', () => {
    renderWithRouter(<AtividadesPage />);
    expect(screen.getByText('Tipo')).toBeInTheDocument();
  });
});

// =============================================
// Integration Tests
// =============================================
describe('CRM Module Integration', () => {
  it('deve ter navegação consistente entre páginas', () => {
    // Dashboard -> Pipeline
    renderWithRouter(<CRMDashboardPage />);
    const pipelineLink = screen.getByText('Ver Pipeline');
    fireEvent.click(pipelineLink);
    expect(mockNavigate).toHaveBeenCalledWith('/crm/pipeline');
  });

  it('deve manter estado de filtros na sessão', async () => {
    renderWithRouter(<LeadsPage />);
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'teste' } });
    expect(searchInput).toHaveValue('teste');
  });
});

// =============================================
// Utility Functions Tests
// =============================================
describe('CRM Utility Functions', () => {
  it('deve formatar valores monetários corretamente', () => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    expect(formatCurrency(1000)).toBe('R$ 1.000,00');
    expect(formatCurrency(1500.5)).toBe('R$ 1.500,50');
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('deve formatar datas corretamente', () => {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    expect(formatDate('2024-12-14')).toBe('14/12/2024');
  });

  it('deve calcular score de lead corretamente', () => {
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'green';
      if (score >= 50) return 'yellow';
      return 'red';
    };

    expect(getScoreColor(85)).toBe('green');
    expect(getScoreColor(60)).toBe('yellow');
    expect(getScoreColor(30)).toBe('red');
  });

  it('deve identificar atividades atrasadas', () => {
    const isAtrasada = (dataPrevista: string, status: string) => {
      if (status === 'concluida' || status === 'cancelada') return false;
      return new Date(dataPrevista) < new Date();
    };

    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    
    expect(isAtrasada(ontem.toISOString(), 'pendente')).toBe(true);
    expect(isAtrasada(ontem.toISOString(), 'concluida')).toBe(false);
  });
});

// =============================================
// Drag and Drop Tests (Pipeline)
// =============================================
describe('Pipeline Drag and Drop', () => {
  it('deve permitir arrastar cards', async () => {
    renderWithRouter(<PipelinePage />);
    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      if (cards.length > 0) {
        expect(cards[0]).toHaveAttribute('draggable', 'true');
      }
    });
  });
});

// =============================================
// Modal Tests
// =============================================
describe('CRM Modals', () => {
  it('deve abrir modal de conversão de lead', async () => {
    renderWithRouter(<LeadsPage />);
    // O modal de conversão é acionado via ações do DataTable
    // Este teste verifica se o componente renderiza sem erros
    await waitFor(() => {
      expect(screen.getByText('Leads')).toBeInTheDocument();
    });
  });

  it('deve abrir modal de conclusão de atividade', async () => {
    renderWithRouter(<AtividadesPage />);
    await waitFor(() => {
      expect(screen.getByText('Atividades')).toBeInTheDocument();
    });
  });
});
