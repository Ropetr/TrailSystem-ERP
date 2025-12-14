import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renderiza com texto', () => {
    render(<Badge>Ativo</Badge>);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('aplica variante default', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('aplica variante success', () => {
    render(<Badge variant="success">Sucesso</Badge>);
    expect(screen.getByText('Sucesso')).toHaveClass('bg-green-100', 'text-green-700');
  });

  it('aplica variante danger', () => {
    render(<Badge variant="danger">Erro</Badge>);
    expect(screen.getByText('Erro')).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('aplica variante warning', () => {
    render(<Badge variant="warning">Alerta</Badge>);
    expect(screen.getByText('Alerta')).toHaveClass('bg-yellow-100', 'text-yellow-700');
  });

  it('aplica variante info', () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('aplica tamanho sm', () => {
    render(<Badge size="sm">Pequeno</Badge>);
    expect(screen.getByText('Pequeno')).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('aplica tamanho md', () => {
    render(<Badge size="md">Médio</Badge>);
    expect(screen.getByText('Médio')).toHaveClass('px-2.5', 'py-1', 'text-sm');
  });
});
