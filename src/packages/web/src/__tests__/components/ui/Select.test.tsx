import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '@/components/ui/Select';

const options = [
  { value: '1', label: 'Opção 1' },
  { value: '2', label: 'Opção 2' },
  { value: '3', label: 'Opção 3' },
];

describe('Select', () => {
  it('renderiza com placeholder', () => {
    render(<Select value="" onChange={() => {}} options={options} placeholder="Selecione..." />);
    expect(screen.getByText('Selecione...')).toBeInTheDocument();
  });

  it('renderiza com label', () => {
    render(<Select value="" onChange={() => {}} options={options} label="Categoria" />);
    expect(screen.getByText('Categoria')).toBeInTheDocument();
  });

  it('mostra valor selecionado', () => {
    render(<Select value="2" onChange={() => {}} options={options} />);
    expect(screen.getByText('Opção 2')).toBeInTheDocument();
  });

  it('abre dropdown ao clicar', () => {
    render(<Select value="" onChange={() => {}} options={options} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Opção 1')).toBeInTheDocument();
    expect(screen.getByText('Opção 2')).toBeInTheDocument();
    expect(screen.getByText('Opção 3')).toBeInTheDocument();
  });

  it('chama onChange ao selecionar opção', () => {
    const handleChange = vi.fn();
    render(<Select value="" onChange={handleChange} options={options} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Opção 2'));
    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('mostra erro quando fornecido', () => {
    render(<Select value="" onChange={() => {}} options={options} error="Selecione uma opção" />);
    expect(screen.getByText('Selecione uma opção')).toBeInTheDocument();
  });

  it('fica desabilitado quando disabled', () => {
    render(<Select value="" onChange={() => {}} options={options} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
