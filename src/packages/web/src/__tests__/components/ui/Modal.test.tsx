import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  it('não renderiza quando isOpen é false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Conteúdo</p>
      </Modal>
    );
    expect(screen.queryByText('Conteúdo')).not.toBeInTheDocument();
  });

  it('renderiza quando isOpen é true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Conteúdo do Modal</p>
      </Modal>
    );
    expect(screen.getByText('Conteúdo do Modal')).toBeInTheDocument();
  });

  it('renderiza título quando fornecido', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Título do Modal">
        <p>Conteúdo</p>
      </Modal>
    );
    expect(screen.getByText('Título do Modal')).toBeInTheDocument();
  });

  it('chama onClose ao clicar no backdrop', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Conteúdo</p>
      </Modal>
    );
    // Backdrop é o primeiro elemento com bg-black/50
    const backdrop = document.querySelector('.bg-black\\/50');
    fireEvent.click(backdrop!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('chama onClose ao clicar no botão X', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Teste" showCloseButton>
        <p>Conteúdo</p>
      </Modal>
    );
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('chama onClose ao pressionar ESC', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Conteúdo</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('aplica tamanho corretamente', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} size="xl">
        <p>Conteúdo</p>
      </Modal>
    );
    const modal = document.querySelector('.max-w-4xl');
    expect(modal).toBeInTheDocument();
  });
});
