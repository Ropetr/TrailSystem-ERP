import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { Select } from '../Select';

const options = [
  { value: '1', label: 'Opção 1' },
  { value: '2', label: 'Opção 2' },
  { value: '3', label: 'Opção 3' },
];

describe('Select', () => {
  it('renders with placeholder', () => {
    render(<Select value="" onChange={() => {}} options={options} placeholder="Selecione..." />);
    expect(screen.getByText('Selecione...')).toBeInTheDocument();
  });

  it('shows selected option label', () => {
    render(<Select value="2" onChange={() => {}} options={options} />);
    expect(screen.getByText('Opção 2')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<Select value="" onChange={() => {}} options={options} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Opção 1')).toBeInTheDocument();
    expect(screen.getByText('Opção 2')).toBeInTheDocument();
    expect(screen.getByText('Opção 3')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const handleChange = vi.fn();
    render(<Select value="" onChange={handleChange} options={options} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Opção 2'));
    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('renders with label', () => {
    render(<Select label="Categoria" value="" onChange={() => {}} options={options} />);
    expect(screen.getByText('Categoria')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Select value="" onChange={() => {}} options={options} error="Selecione uma opção" />);
    expect(screen.getByText('Selecione uma opção')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select value="" onChange={() => {}} options={options} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
