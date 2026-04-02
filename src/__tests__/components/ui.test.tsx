import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, Toggle, Button, Input, Select, Badge, ProgressRing } from '../../components/ui';

describe('UI Components', () => {
  describe('Card', () => {
    it('should render children correctly', () => {
      render(<Card>Test Content</Card>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      const card = screen.getByText('Content');
      expect(card.parentElement).toHaveClass('custom-class');
    });

    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      fireEvent.click(screen.getByText('Clickable Card'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should apply glow effect when glow prop is true', () => {
      render(<Card glow>Content</Card>);
      const card = screen.getByText('Content').parentElement;
      expect(card).toHaveClass('shadow-[var(--color-accent-primary)]/20');
    });
  });

  describe('CardHeader', () => {
    it('should render title and subtitle', () => {
      render(<CardHeader title="Test Title" subtitle="Test Subtitle" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      render(<CardHeader title="Title" icon={<span data-testid="icon">🔔</span>} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render action when provided', () => {
      render(<CardHeader title="Title" action={<button>Action</button>} />);
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Toggle', () => {
    it('should render with correct initial state', () => {
      render(<Toggle checked={true} onChange={() => {}} />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should call onChange when clicked', () => {
      const handleChange = vi.fn();
      render(<Toggle checked={false} onChange={handleChange} />);
      fireEvent.click(screen.getByRole('switch'));
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Toggle checked={false} onChange={() => {}} disabled />);
      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('should render label when provided', () => {
      render(<Toggle checked={false} onChange={() => {}} label="Test Label" />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });
  });

  describe('Button', () => {
    it('should render children correctly', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should apply correct variant classes', () => {
      const { rerender } = render(<Button variant="primary">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-[var(--color-accent-primary)]');

      rerender(<Button variant="danger">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-[var(--color-accent-danger)]');

      rerender(<Button variant="secondary">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-[var(--color-bg-secondary)]');

      rerender(<Button variant="ghost">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-transparent');
    });

    it('should apply size classes', () => {
      const { rerender } = render(<Button size="sm">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

      rerender(<Button size="md">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2');

      rerender(<Button size="lg">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-base');
    });

    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Button</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Button</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Input', () => {
    it('should render input with label', () => {
      render(<Input label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(<Input error="Error message" />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should accept custom placeholder', () => {
      render(<Input placeholder="Enter text..." />);
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    });

    it('should call onChange when changed', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Select', () => {
    it('should render with options', () => {
      const options = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
      ];
      render(<Select options={options} label="Select Label" />);
      expect(screen.getByLabelText('Select Label')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should call onChange when changed', () => {
      const handleChange = vi.fn();
      const options = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
      ];
      render(<Select options={options} onChange={handleChange} />);
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'opt2' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Badge', () => {
    it('should render children correctly', () => {
      render(<Badge>Badge Text</Badge>);
      expect(screen.getByText('Badge Text')).toBeInTheDocument();
    });

    it('should apply correct variant classes', () => {
      const { rerender } = render(<Badge variant="default">Badge</Badge>);
      expect(screen.getByText('Badge').parentElement).toHaveClass('bg-[var(--color-bg-secondary)]');

      rerender(<Badge variant="success">Badge</Badge>);
      expect(screen.getByText('Badge').parentElement).toHaveClass('bg-[var(--color-accent-success)]/20');

      rerender(<Badge variant="warning">Badge</Badge>);
      expect(screen.getByText('Badge').parentElement).toHaveClass('bg-[var(--color-accent-warning)]/20');

      rerender(<Badge variant="danger">Badge</Badge>);
      expect(screen.getByText('Badge').parentElement).toHaveClass('bg-[var(--color-accent-danger)]/20');
    });
  });

  describe('ProgressRing', () => {
    it('should render with correct progress', () => {
      render(<ProgressRing progress={50} />);
      const text = screen.getByText('50%');
      expect(text).toBeInTheDocument();
    });

    it('should calculate offset correctly', () => {
      render(<ProgressRing progress={75} />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom size', () => {
      render(<ProgressRing progress={50} size={100} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '100');
      expect(svg).toHaveAttribute('height', '100');
    });
  });
});
