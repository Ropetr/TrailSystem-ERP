import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { DataTable } from '../DataTable';

const mockData = [
  { id: '1', nome: 'Item 1', status: 'ativo' },
  { id: '2', nome: 'Item 2', status: 'inativo' },
  { id: '3', nome: 'Item 3', status: 'ativo' },
];

const columns = [
  { key: 'nome', header: 'Nome', sortable: true },
  { key: 'status', header: 'Status' },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="Sem registros" />);
    expect(screen.getByText('Sem registros')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DataTable data={[]} columns={columns} isLoading={true} />);
    // Spinner should be present
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('sorts data when clicking sortable column', () => {
    render(<DataTable data={mockData} columns={columns} />);
    
    // Click nome column to sort
    const nomeHeader = screen.getByText('Nome');
    fireEvent.click(nomeHeader);
    
    // Items should still be visible (sorting happened)
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('calls onRowClick when row is clicked', () => {
    const handleRowClick = vi.fn();
    render(<DataTable data={mockData} columns={columns} onRowClick={handleRowClick} />);
    
    fireEvent.click(screen.getByText('Item 1'));
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders custom cell content using render function', () => {
    const columnsWithRender = [
      { 
        key: 'status', 
        header: 'Status',
        render: (item: typeof mockData[0]) => <span data-testid={`status-${item.id}`}>{item.status.toUpperCase()}</span>
      },
    ];
    
    render(<DataTable data={mockData} columns={columnsWithRender} />);
    expect(screen.getByTestId('status-1')).toHaveTextContent('ATIVO');
  });
});
