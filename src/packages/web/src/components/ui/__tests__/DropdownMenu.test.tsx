import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { DropdownMenu } from '../DropdownMenu';

const items = [
  { label: 'Editar', onClick: vi.fn() },
  { label: 'Excluir', onClick: vi.fn(), variant: 'danger' as const },
];

describe('DropdownMenu', () => {
  it('renders trigger button', () => {
    render(<DropdownMenu items={items} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens menu on click', () => {
    render(<DropdownMenu items={items} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Excluir')).toBeInTheDocument();
  });

  it('calls onClick handler when item is clicked', () => {
    render(<DropdownMenu items={items} />);
    
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Editar'));
    
    expect(items[0].onClick).toHaveBeenCalled();
  });

  it('closes menu after item click', () => {
    render(<DropdownMenu items={items} />);
    
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Editar'));
    
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
  });

  it('applies danger variant styles', () => {
    render(<DropdownMenu items={items} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    const excluirButton = screen.getByText('Excluir').closest('button');
    expect(excluirButton).toHaveClass('text-red-600');
  });

  it('renders separator', () => {
    const itemsWithSeparator = [
      { label: 'Item 1', onClick: vi.fn() },
      { type: 'separator' as const, label: '' },
      { label: 'Item 2', onClick: vi.fn() },
    ];
    
    render(<DropdownMenu items={itemsWithSeparator} />);
    fireEvent.click(screen.getByRole('button'));
    
    expect(document.querySelector('.border-t')).toBeInTheDocument();
  });
});
