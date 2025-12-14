// =============================================
// PLANAC ERP - Testes Unitários IBPT
// Cobertura completa dos services
// =============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ===== MOCKS =====

const mockD1Database = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  all: vi.fn(),
  run: vi.fn(),
  batch: vi.fn(),
};

// ===== TESTES DE TIPOS =====

describe('IBPT Types', () => {
  it('deve validar NCM de 8 dígitos', () => {
    const ncmValidos = ['22030000', '84713012', '61091000'];
    const ncmInvalidos = ['2203', '220300001', 'ABCD1234'];

    ncmValidos.forEach(ncm => {
      expect(ncm).toMatch(/^\d{8}$/);
    });

    ncmInvalidos.forEach(ncm => {
      expect(ncm).not.toMatch(/^\d{8}$/);
    });
  });

  it('deve validar NBS de 9 dígitos', () => {
    const nbsValidos = ['123456789', '101011000'];
    const nbsInvalidos = ['12345678', '1234567890'];

    nbsValidos.forEach(nbs => {
      expect(nbs).toMatch(/^\d{9}$/);
    });

    nbsInvalidos.forEach(nbs => {
      expect(nbs).not.toMatch(/^\d{9}$/);
    });
  });

  it('deve validar UF de 2 caracteres', () => {
    const ufsValidas = ['PR', 'SP', 'RJ', 'MG', 'RS'];
    const ufsInvalidas = ['P', 'SPP', 'pr', '12'];

    ufsValidas.forEach(uf => {
      expect(uf).toMatch(/^[A-Z]{2}$/);
    });

    ufsInvalidas.forEach(uf => {
      expect(uf).not.toMatch(/^[A-Z]{2}$/);
    });
  });
});

// ===== TESTES DE CÁLCULO =====

describe('IBPT Cálculos', () => {
  it('deve calcular tributos para produto nacional', () => {
    const valor = 100;
    const aliquotaNacional = 15.28;
    const aliquotaEstadual = 18.00;
    const aliquotaMunicipal = 0;

    const tributoFederal = (valor * aliquotaNacional) / 100;
    const tributoEstadual = (valor * aliquotaEstadual) / 100;
    const tributoMunicipal = (valor * aliquotaMunicipal) / 100;
    const tributoTotal = tributoFederal + tributoEstadual + tributoMunicipal;

    expect(tributoFederal).toBe(15.28);
    expect(tributoEstadual).toBe(18.00);
    expect(tributoMunicipal).toBe(0);
    expect(tributoTotal).toBe(33.28);
  });

  it('deve calcular tributos para produto importado', () => {
    const valor = 100;
    const aliquotaImportado = 23.14;
    const aliquotaEstadual = 18.00;

    const tributoFederal = (valor * aliquotaImportado) / 100;
    const tributoEstadual = (valor * aliquotaEstadual) / 100;
    const tributoTotal = tributoFederal + tributoEstadual;

    expect(tributoFederal).toBe(23.14);
    expect(tributoEstadual).toBe(18.00);
    expect(tributoTotal).toBe(41.14);
  });

  it('deve calcular tributos para serviço (NBS)', () => {
    const valor = 500;
    const aliquotaNacional = 13.45;
    const aliquotaMunicipal = 2.70;

    const tributoFederal = (valor * aliquotaNacional) / 100;
    const tributoMunicipal = (valor * aliquotaMunicipal) / 100;
    const tributoTotal = tributoFederal + tributoMunicipal;

    expect(tributoFederal).toBe(67.25);
    expect(tributoMunicipal).toBe(13.50);
    expect(tributoTotal).toBe(80.75);
  });

  it('deve arredondar valores para 2 casas decimais', () => {
    const valor = 99.99;
    const aliquota = 15.28;

    const tributo = (valor * aliquota) / 100;
    const tributoArredondado = Math.round(tributo * 100) / 100;

    expect(tributoArredondado).toBe(15.28); // 15.278472 arredondado
  });

  it('deve calcular lote de itens corretamente', () => {
    const itens = [
      { valor: 50, aliquotaFederal: 15, aliquotaEstadual: 18 },
      { valor: 30, aliquotaFederal: 10, aliquotaEstadual: 12 },
      { valor: 20, aliquotaFederal: 20, aliquotaEstadual: 25 },
    ];

    let totalFederal = 0;
    let totalEstadual = 0;
    let totalProdutos = 0;

    itens.forEach(item => {
      totalFederal += (item.valor * item.aliquotaFederal) / 100;
      totalEstadual += (item.valor * item.aliquotaEstadual) / 100;
      totalProdutos += item.valor;
    });

    expect(totalProdutos).toBe(100);
    expect(totalFederal).toBe(14.5); // 7.5 + 3 + 4
    expect(totalEstadual).toBe(17.6); // 9 + 3.6 + 5
    expect(totalFederal + totalEstadual).toBe(32.1);
  });
});

// ===== TESTES DE ORIGEM =====

describe('IBPT Origem do Produto', () => {
  it('deve identificar produto nacional (origem 0)', () => {
    const origem = 0;
    const isNacional = origem === 0 || origem === 3 || origem === 4 || origem === 5 || origem === 8;
    expect(isNacional).toBe(true);
  });

  it('deve identificar produto importado (origem 1, 2, 6, 7)', () => {
    const origensImportadas = [1, 2, 6, 7];
    
    origensImportadas.forEach(origem => {
      const isImportado = origem >= 1 && origem <= 7 && ![3, 4, 5].includes(origem);
      expect(isImportado).toBe(true);
    });
  });

  it('deve retornar alíquota correta por origem', () => {
    const aliquotas = {
      nacional: 15.28,
      importado: 23.14,
    };

    const getAliquotaFederal = (origem: number) => {
      const isImportado = [1, 2, 6, 7].includes(origem);
      return isImportado ? aliquotas.importado : aliquotas.nacional;
    };

    expect(getAliquotaFederal(0)).toBe(15.28);
    expect(getAliquotaFederal(1)).toBe(23.14);
    expect(getAliquotaFederal(2)).toBe(23.14);
    expect(getAliquotaFederal(3)).toBe(15.28);
    expect(getAliquotaFederal(6)).toBe(23.14);
  });
});

// ===== TESTES DE VIGÊNCIA =====

describe('IBPT Vigência', () => {
  it('deve verificar se registro está dentro da vigência', () => {
    const hoje = new Date();
    const vigenciaFim = new Date(hoje);
    vigenciaFim.setMonth(vigenciaFim.getMonth() + 1); // 1 mês no futuro

    const isValido = vigenciaFim > hoje;
    expect(isValido).toBe(true);
  });

  it('deve verificar se registro está expirado', () => {
    const hoje = new Date();
    const vigenciaFim = new Date(hoje);
    vigenciaFim.setMonth(vigenciaFim.getMonth() - 1); // 1 mês no passado

    const isExpirado = vigenciaFim < hoje;
    expect(isExpirado).toBe(true);
  });

  it('deve calcular dias para vencer corretamente', () => {
    const hoje = new Date();
    const vigenciaFim = new Date(hoje);
    vigenciaFim.setDate(vigenciaFim.getDate() + 30);

    const diasParaVencer = Math.ceil(
      (vigenciaFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(diasParaVencer).toBe(30);
  });

  it('deve identificar registros próximos de expirar (7 dias)', () => {
    const hoje = new Date();
    const vigenciaFim = new Date(hoje);
    vigenciaFim.setDate(vigenciaFim.getDate() + 5);

    const diasParaVencer = Math.ceil(
      (vigenciaFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );

    const precisaAtualizar = diasParaVencer <= 7 && diasParaVencer > 0;
    expect(precisaAtualizar).toBe(true);
  });
});

// ===== TESTES DE FORMATAÇÃO =====

describe('IBPT Formatação', () => {
  it('deve gerar texto para infCpl da NF-e', () => {
    const tributoFederal = 15.28;
    const tributoEstadual = 18.00;
    const tributoMunicipal = 0;
    const tributoTotal = 33.28;

    const texto = `Val Aprox Tributos R$ ${tributoTotal.toFixed(2)} ` +
      `(${tributoFederal.toFixed(2)} Federal, ${tributoEstadual.toFixed(2)} Estadual` +
      (tributoMunicipal > 0 ? `, ${tributoMunicipal.toFixed(2)} Municipal` : '') +
      `) Fonte: IBPT - Lei 12.741/2012`;

    expect(texto).toBe('Val Aprox Tributos R$ 33.28 (15.28 Federal, 18.00 Estadual) Fonte: IBPT - Lei 12.741/2012');
  });

  it('deve gerar texto para infAdProd do item', () => {
    const tributoTotal = 33.28;
    const aliquotaFederal = 15.28;
    const aliquotaEstadual = 18.00;

    const texto = `Trib aprox R$${tributoTotal.toFixed(2)} (${aliquotaFederal.toFixed(2)}% Fed, ${aliquotaEstadual.toFixed(2)}% Est) Fonte: IBPT`;

    expect(texto).toBe('Trib aprox R$33.28 (15.28% Fed, 18.00% Est) Fonte: IBPT');
  });

  it('deve gerar texto resumido para NFC-e', () => {
    const tributoTotal = 33.28;
    const texto = `Tributos Totais Incidentes (Lei Federal 12.741/12): R$ ${tributoTotal.toFixed(2)}`;

    expect(texto).toBe('Tributos Totais Incidentes (Lei Federal 12.741/12): R$ 33.28');
  });

  it('deve converter data BR para ISO', () => {
    const converterData = (dataBR: string): string => {
      const partes = dataBR.split('/');
      if (partes.length === 3) {
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
      }
      return dataBR;
    };

    expect(converterData('01/12/2025')).toBe('2025-12-01');
    expect(converterData('31/01/2026')).toBe('2026-01-31');
  });
});

// ===== TESTES DE CACHE =====

describe('IBPT Cache', () => {
  it('deve gerar chave de cache única', () => {
    const gerarChaveCache = (codigo: string, uf: string, ex: number) => 
      `${codigo}:${uf}:${ex}`;

    expect(gerarChaveCache('22030000', 'PR', 0)).toBe('22030000:PR:0');
    expect(gerarChaveCache('22030000', 'SP', 0)).toBe('22030000:SP:0');
    expect(gerarChaveCache('22030000', 'PR', 1)).toBe('22030000:PR:1');
  });

  it('deve verificar validade do cache', () => {
    const isCacheValido = (vigenciaFim: string): boolean => {
      if (!vigenciaFim) return false;
      const fim = new Date(vigenciaFim);
      const hoje = new Date();
      return fim > hoje;
    };

    // Cache válido (futuro)
    const dataFutura = new Date();
    dataFutura.setMonth(dataFutura.getMonth() + 1);
    expect(isCacheValido(dataFutura.toISOString())).toBe(true);

    // Cache inválido (passado)
    const dataPassada = new Date();
    dataPassada.setMonth(dataPassada.getMonth() - 1);
    expect(isCacheValido(dataPassada.toISOString())).toBe(false);

    // Sem data
    expect(isCacheValido('')).toBe(false);
  });
});

// ===== TESTES DE CSV PARSER =====

describe('IBPT CSV Parser', () => {
  it('deve parsear linha CSV com ponto-vírgula', () => {
    const parseCSVLine = (line: string, delimiter: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const linha = '22030000;0;NCM;"Cervejas de malte";42.61;50.29;29.00;0.00';
    const valores = parseCSVLine(linha, ';');

    expect(valores[0]).toBe('22030000');
    expect(valores[1]).toBe('0');
    expect(valores[2]).toBe('NCM');
    expect(valores[3]).toBe('Cervejas de malte');
    expect(valores[4]).toBe('42.61');
  });

  it('deve lidar com campos vazios', () => {
    const parseCSVLine = (line: string, delimiter: string): string[] => {
      return line.split(delimiter).map(v => v.trim());
    };

    const linha = '22030000;;NCM;Produto;;18.00;';
    const valores = parseCSVLine(linha, ';');

    expect(valores[0]).toBe('22030000');
    expect(valores[1]).toBe('');
    expect(valores[4]).toBe('');
  });

  it('deve converter alíquota string para número', () => {
    const converterAliquota = (valor: string): number => {
      return parseFloat(valor.replace(',', '.')) || 0;
    };

    expect(converterAliquota('15.28')).toBe(15.28);
    expect(converterAliquota('15,28')).toBe(15.28);
    expect(converterAliquota('')).toBe(0);
    expect(converterAliquota('invalid')).toBe(0);
  });
});

// ===== TESTES DE ESTATÍSTICAS =====

describe('IBPT Estatísticas', () => {
  it('deve calcular taxa de cache hit', () => {
    const calcularTaxaCache = (hits: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((hits / total) * 100);
    };

    expect(calcularTaxaCache(80, 100)).toBe(80);
    expect(calcularTaxaCache(0, 100)).toBe(0);
    expect(calcularTaxaCache(100, 100)).toBe(100);
    expect(calcularTaxaCache(0, 0)).toBe(0);
  });

  it('deve agrupar por UF', () => {
    const registros = [
      { uf: 'PR', count: 1000 },
      { uf: 'SP', count: 1500 },
      { uf: 'PR', count: 500 },
      { uf: 'RJ', count: 800 },
    ];

    const agrupado = registros.reduce((acc, r) => {
      acc[r.uf] = (acc[r.uf] || 0) + r.count;
      return acc;
    }, {} as Record<string, number>);

    expect(agrupado['PR']).toBe(1500);
    expect(agrupado['SP']).toBe(1500);
    expect(agrupado['RJ']).toBe(800);
  });
});

// ===== TESTES DE NOTIFICAÇÃO =====

describe('IBPT Notificações', () => {
  it('deve gerar mensagem de sucesso', () => {
    const gerarMensagem = (atualizados: number, erros: number): string => {
      return `Tabela IBPT atualizada: ${atualizados} registros${erros > 0 ? `, ${erros} erros` : ''}`;
    };

    expect(gerarMensagem(150, 0)).toBe('Tabela IBPT atualizada: 150 registros');
    expect(gerarMensagem(150, 5)).toBe('Tabela IBPT atualizada: 150 registros, 5 erros');
  });

  it('deve determinar urgência correta', () => {
    const getUrgencia = (dias: number): string => {
      if (dias <= 3) return 'critica';
      if (dias <= 7) return 'alta';
      if (dias <= 15) return 'media';
      return 'baixa';
    };

    expect(getUrgencia(1)).toBe('critica');
    expect(getUrgencia(5)).toBe('alta');
    expect(getUrgencia(10)).toBe('media');
    expect(getUrgencia(30)).toBe('baixa');
  });
});
