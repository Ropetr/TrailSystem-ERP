import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';

describe('Card', () => {
  it('renders with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies correct padding classes', () => {
    const { container, rerender } = render(<Card padding="sm">Content</Card>);
    expect(container.firstChild).toHaveClass('p-4');

    rerender(<Card padding="md">Content</Card>);
    expect(container.firstChild).toHaveClass('p-6');

    rerender(<Card padding="lg">Content</Card>);
    expect(container.firstChild).toHaveClass('p-8');

    rerender(<Card padding="none">Content</Card>);
    expect(container.firstChild).not.toHaveClass('p-4', 'p-6', 'p-8');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('CardHeader', () => {
  it('renders with children', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders with children', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('renders with children', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
