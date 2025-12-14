import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schemas usados no projeto
const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

const empresaSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ inválido'),
  razao_social: z.string().min(3, 'Mínimo 3 caracteres'),
  nome_fantasia: z.string().optional(),
  regime_tributario: z.string(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
});

const usuarioSchema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  confirmar_senha: z.string().optional().or(z.literal('')),
  perfil_id: z.string().min(1, 'Selecione um perfil'),
  empresa_id: z.string().min(1, 'Selecione uma empresa'),
}).refine((data) => {
  if (data.senha && data.senha !== data.confirmar_senha) {
    return false;
  }
  return true;
}, {
  message: 'As senhas não conferem',
  path: ['confirmar_senha'],
});

describe('Login Schema', () => {
  it('validates correct login data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      senha: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      senha: '123456',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('E-mail inválido');
    }
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      senha: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('Empresa Schema', () => {
  it('validates correct empresa data', () => {
    const result = empresaSchema.safeParse({
      cnpj: '12345678901234',
      razao_social: 'Empresa Teste LTDA',
      regime_tributario: '1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short CNPJ', () => {
    const result = empresaSchema.safeParse({
      cnpj: '123',
      razao_social: 'Empresa Teste',
      regime_tributario: '1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('CNPJ inválido');
    }
  });

  it('rejects short razao_social', () => {
    const result = empresaSchema.safeParse({
      cnpj: '12345678901234',
      razao_social: 'AB',
      regime_tributario: '1',
    });
    expect(result.success).toBe(false);
  });

  it('allows empty nome_fantasia', () => {
    const result = empresaSchema.safeParse({
      cnpj: '12345678901234',
      razao_social: 'Empresa Teste',
      regime_tributario: '1',
      nome_fantasia: '',
    });
    expect(result.success).toBe(true);
  });

  it('validates email format when provided', () => {
    const result = empresaSchema.safeParse({
      cnpj: '12345678901234',
      razao_social: 'Empresa Teste',
      regime_tributario: '1',
      email: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('allows empty email', () => {
    const result = empresaSchema.safeParse({
      cnpj: '12345678901234',
      razao_social: 'Empresa Teste',
      regime_tributario: '1',
      email: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('Usuario Schema', () => {
  const validUser = {
    nome: 'João Silva',
    email: 'joao@example.com',
    senha: '12345678',
    confirmar_senha: '12345678',
    perfil_id: 'perfil-1',
    empresa_id: 'empresa-1',
  };

  it('validates correct usuario data', () => {
    const result = usuarioSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = usuarioSchema.safeParse({
      ...validUser,
      senha: '12345678',
      confirmar_senha: 'different',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('As senhas não conferem');
    }
  });

  it('rejects short password', () => {
    const result = usuarioSchema.safeParse({
      ...validUser,
      senha: '123',
      confirmar_senha: '123',
    });
    expect(result.success).toBe(false);
  });

  it('allows empty password for edit', () => {
    const result = usuarioSchema.safeParse({
      ...validUser,
      senha: '',
      confirmar_senha: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty perfil_id', () => {
    const result = usuarioSchema.safeParse({
      ...validUser,
      perfil_id: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty empresa_id', () => {
    const result = usuarioSchema.safeParse({
      ...validUser,
      empresa_id: '',
    });
    expect(result.success).toBe(false);
  });
});
