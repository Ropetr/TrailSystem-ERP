import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schemas de validação (reproduzidos para teste)
const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

const empresaSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ inválido'),
  razao_social: z.string().min(3, 'Mínimo 3 caracteres'),
  nome_fantasia: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
});

const usuarioSchema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Mínimo 8 caracteres'),
});

describe('Login Schema', () => {
  it('valida dados corretos', () => {
    const data = { email: 'user@test.com', senha: '123456' };
    expect(() => loginSchema.parse(data)).not.toThrow();
  });

  it('rejeita email inválido', () => {
    const data = { email: 'invalid', senha: '123456' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('E-mail inválido');
    }
  });

  it('rejeita senha vazia', () => {
    const data = { email: 'user@test.com', senha: '' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Senha obrigatória');
    }
  });
});

describe('Empresa Schema', () => {
  it('valida dados corretos', () => {
    const data = {
      cnpj: '12345678000190',
      razao_social: 'Empresa Teste Ltda',
      nome_fantasia: 'Empresa Teste',
      email: 'contato@empresa.com',
    };
    expect(() => empresaSchema.parse(data)).not.toThrow();
  });

  it('rejeita CNPJ curto', () => {
    const data = { cnpj: '123', razao_social: 'Teste' };
    const result = empresaSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejeita razão social curta', () => {
    const data = { cnpj: '12345678000190', razao_social: 'AB' };
    const result = empresaSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Mínimo 3 caracteres');
    }
  });

  it('aceita email vazio', () => {
    const data = { cnpj: '12345678000190', razao_social: 'Teste', email: '' };
    expect(() => empresaSchema.parse(data)).not.toThrow();
  });

  it('rejeita email inválido', () => {
    const data = { cnpj: '12345678000190', razao_social: 'Teste', email: 'invalid' };
    const result = empresaSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('Usuario Schema', () => {
  it('valida dados corretos', () => {
    const data = {
      nome: 'João Silva',
      email: 'joao@test.com',
      senha: '12345678',
    };
    expect(() => usuarioSchema.parse(data)).not.toThrow();
  });

  it('rejeita nome curto', () => {
    const data = { nome: 'Jo', email: 'joao@test.com', senha: '12345678' };
    const result = usuarioSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejeita email inválido', () => {
    const data = { nome: 'João', email: 'invalid', senha: '12345678' };
    const result = usuarioSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejeita senha curta', () => {
    const data = { nome: 'João Silva', email: 'joao@test.com', senha: '1234567' };
    const result = usuarioSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Mínimo 8 caracteres');
    }
  });
});
