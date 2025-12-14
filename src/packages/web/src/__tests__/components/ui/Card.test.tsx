import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

describe('Card', () => {
  it('renderiza children', () => {
    render(<Card>Conteúdo do Card</Card>);
    expect(screen.getByText('Conteúdo do Card')).toBeInTheDocument();
  });

  it('aplica classes base', () => {
    render(<Card>Teste</Card>);
    const card = screen.getByText('Teste').parentElement;
    expect(card).toHaveClass('bg-white', 'border', 'rounded-xl', 'shadow-sm');
  });

  it('aplica padding md por padrão', () => {
    render(<Card>Teste</Card>);
    const card = screen.getByText('Teste').parentElement;
    expect(card).toHaveClass('p-6');
  });

  it('aplica padding none', () => {
    render(<Card padding="none">Teste</Card>);
    const card = screen.getByText('Teste').parentElement;
    expect(card).not.toHaveClass('p-6');
  });

  it('aplica padding sm', () => {
    render(<Card padding="sm">Teste</Card>);
    const card = screen.getByText('Teste').parentElement;
    expect(card).toHaveClass('p-4');
  });

  it('aceita className adicional', () => {
    render(<Card className="custom-class">Teste</Card>);
    const card = screen.getByText('Teste').parentElement;
    expect(card).toHaveClass('custom-class');
  });
});

describe('CardHeader', () => {
  it('renderiza children', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renderiza como h3', () => {
    render(<CardTitle>Título</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Título');
  });
});

describe('CardContent', () => {
  it('renderiza children', () => {
    render(<CardContent>Conteúdo</CardContent>);
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });
});
