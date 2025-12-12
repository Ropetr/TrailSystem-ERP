# 📊 TECNOSPEED FISCAL - GUIA TRIBUTÁRIO DETALHADO

> **Data:** 12/12/2025  
> **Projeto:** PLANAC ERP Multi-tenant  
> **Complemento:** Detalhamento de Campos Tributários

---

## 📑 ÍNDICE

1. [CST/CSOSN - Tabelas Completas](#1-cstcsosn---tabelas-completas)
2. [ICMS por CST - Campos Obrigatórios](#2-icms-por-cst---campos-obrigatórios)
3. [ICMS-ST Substituição Tributária](#3-icms-st-substituição-tributária)
4. [PIS e COFINS](#4-pis-e-cofins)
5. [IPI](#5-ipi)
6. [Formas de Pagamento](#6-formas-de-pagamento)
7. [Transporte e Volumes](#7-transporte-e-volumes)
8. [Notas Referenciadas e Finalidades](#8-notas-referenciadas-e-finalidades)
9. [Exemplos JSON por Cenário](#9-exemplos-json-por-cenário)
10. [Tabelas de Apoio](#10-tabelas-de-apoio)

---

## 1. CST/CSOSN - TABELAS COMPLETAS

### 1.1 CST ICMS (Regime Normal - CRT 3)

| CST | Descrição | Uso Comum |
|-----|-----------|-----------|
| 00 | Tributada integralmente | Venda normal com ICMS cheio |
| 10 | Tributada com cobrança de ICMS por ST | Venda com ST (responsável) |
| 20 | Com redução de base de cálculo | Benefício fiscal estadual |
| 30 | Isenta/não tributada + cobrança ICMS ST | Isento próprio, cobra ST |
| 40 | Isenta | Operação isenta de ICMS |
| 41 | Não tributada | Fora do campo de incidência |
| 50 | Suspensão | Diferimento/suspensão |
| 51 | Diferimento | ICMS diferido |
| 60 | ICMS cobrado anteriormente por ST | Já pagou ST (revenda) |
| 70 | Redução BC + cobrança ICMS ST | Reduz BC própria + cobra ST |
| 90 | Outras | Situações especiais |

### 1.2 CSOSN (Simples Nacional - CRT 1 ou 2)

| CSOSN | Descrição | Equivalência CST |
|-------|-----------|------------------|
| 101 | Tributada com permissão de crédito | ~00 |
| 102 | Tributada sem permissão de crédito | ~00 |
| 103 | Isenção do ICMS para faixa de receita | ~40 |
| 201 | Tributada com permissão de crédito + ST | ~10 |
| 202 | Tributada sem permissão de crédito + ST | ~10 |
| 203 | Isenção do ICMS + cobrança ST | ~30 |
| 300 | Imune | ~41 |
| 400 | Não tributada pelo Simples Nacional | ~41 |
| 500 | ICMS cobrado anteriormente por ST | ~60 |
| 900 | Outros | ~90 |

### 1.3 Origem da Mercadoria

| Código | Descrição |
|--------|-----------|
| 0 | Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8 |
| 1 | Estrangeira - Importação direta |
| 2 | Estrangeira - Adquirida no mercado interno |
| 3 | Nacional, com conteúdo de importação > 40% e ≤ 70% |
| 4 | Nacional, produção conforme processo produtivo básico |
| 5 | Nacional, com conteúdo de importação ≤ 40% |
| 6 | Estrangeira - Importação direta, sem similar nacional CAMEX |
| 7 | Estrangeira - Adquirida mercado interno, sem similar CAMEX |
| 8 | Nacional, com conteúdo de importação > 70% |

---

## 2. ICMS POR CST - CAMPOS OBRIGATÓRIOS

### 2.1 CST 00 - Tributada Integralmente

```json
"icms": {
  "origem": "0",
  "cst": "00",
  "baseCalculo": {
    "modalidadeDeterminacao": 0,
    "valor": 1000.00
  },
  "aliquota": 18.00,
  "valor": 180.00,
  "fundoCombatePobreza": {
    "aliquota": 2.00,
    "valor": 20.00
  }
}
```

**Campos:**
- `origem`: Obrigatório (0-8)
- `cst`: "00"
- `baseCalculo.modalidadeDeterminacao`: 0=MVA, 1=Pauta, 2=Tabelado, 3=Op. valor
- `baseCalculo.valor`: Obrigatório
- `aliquota`: Obrigatório
- `valor`: Opcional (PlugNotas calcula se não informado)
- `fundoCombatePobreza`: Opcional (FCP se UF exigir)

### 2.2 CST 10 - Tributada + ST

```json
"icms": {
  "origem": "0",
  "cst": "10",
  "baseCalculo": {
    "modalidadeDeterminacao": 0,
    "valor": 1000.00
  },
  "aliquota": 18.00,
  "valor": 180.00,
  "st": {
    "baseCalculo": {
      "modalidadeDeterminacao": 4,
      "percentualMva": 50.00,
      "valor": 1500.00
    },
    "aliquota": 18.00,
    "valor": 90.00
  },
  "fundoCombatePobrezaSt": {
    "aliquota": 2.00,
    "baseCalculo": 1500.00,
    "valor": 30.00
  }
}
```

**Campos ST:**
- `st.baseCalculo.modalidadeDeterminacao`: 0=Preço tabelado, 1=Lista negativa, 2=Lista positiva, 3=Lista neutra, 4=MVA, 5=Pauta, 6=Op. valor
- `st.baseCalculo.percentualMva`: % MVA (quando modalidade = 4)
- `st.baseCalculo.valor`: BC do ST
- `st.aliquota`: Alíquota interna UF destino
- `st.valor`: Valor do ICMS-ST

### 2.3 CST 20 - Redução de Base de Cálculo

```json
"icms": {
  "origem": "0",
  "cst": "20",
  "baseCalculo": {
    "modalidadeDeterminacao": 0,
    "percentualReducao": 30.00,
    "valor": 700.00
  },
  "aliquota": 18.00,
  "valor": 126.00,
  "desoneracao": {
    "motivo": 9,
    "valor": 54.00
  }
}
```

**Campos Específicos:**
- `baseCalculo.percentualReducao`: % de redução da BC
- `desoneracao.motivo`: 1=Táxi, 3=Prod. agro, 4=Frotista, 5=Diplomático, 6=Militar, 7=SUFRAMA, 9=Outros, 10=Deficiente condutor, 11=Deficiente não condutor, 12=Órgão público, 16=Olimpíadas

### 2.4 CST 30 - Isenta + ST

```json
"icms": {
  "origem": "0",
  "cst": "30",
  "st": {
    "baseCalculo": {
      "modalidadeDeterminacao": 4,
      "percentualMva": 40.00,
      "valor": 1400.00
    },
    "aliquota": 18.00,
    "valor": 252.00
  },
  "desoneracao": {
    "motivo": 9,
    "valor": 180.00
  }
}
```

### 2.5 CST 40/41 - Isenta/Não Tributada

```json
"icms": {
  "origem": "0",
  "cst": "40",
  "desoneracao": {
    "motivo": 9,
    "valor": 180.00
  }
}
```

### 2.6 CST 51 - Diferimento

```json
"icms": {
  "origem": "0",
  "cst": "51",
  "baseCalculo": {
    "modalidadeDeterminacao": 0,
    "valor": 1000.00
  },
  "aliquota": 18.00,
  "diferimento": {
    "percentual": 33.33,
    "valor": 60.00
  },
  "valor": 120.00
}
```

### 2.7 CST 60 - ICMS ST Cobrado Anteriormente

```json
"icms": {
  "origem": "0",
  "cst": "60",
  "stRetido": {
    "baseCalculo": 1500.00,
    "aliquota": 18.00,
    "valor": 270.00
  },
  "baseCalculoEfetiva": 1200.00,
  "aliquotaEfetiva": 18.00,
  "valorEfetivo": 216.00
}
```

### 2.8 CST 70 - Redução BC + ST

```json
"icms": {
  "origem": "0",
  "cst": "70",
  "baseCalculo": {
    "modalidadeDeterminacao": 0,
    "percentualReducao": 20.00,
    "valor": 800.00
  },
  "aliquota": 18.00,
  "valor": 144.00,
  "st": {
    "baseCalculo": {
      "modalidadeDeterminacao": 4,
      "percentualMva": 40.00,
      "percentualReducao": 20.00,
      "valor": 1120.00
    },
    "aliquota": 18.00,
    "valor": 57.60
  }
}
```

### 2.9 CST 90 - Outras

```json
"icms": {
  "origem": "0",
  "cst": "90",
  "baseCalculo": {
    "modalidadeDeterminacao": 0,
    "valor": 1000.00
  },
  "aliquota": 18.00,
  "valor": 180.00
}
```

---

## 3. ICMS-ST SUBSTITUIÇÃO TRIBUTÁRIA

### 3.1 Cálculo da Base ICMS-ST com MVA

```
BC_ST = (Valor Produto + IPI + Frete + Seguro + Outras Despesas - Desconto) × (1 + MVA/100)
```

**Exemplo:**
```
Produto: R$ 1.000,00
IPI: R$ 100,00
Frete: R$ 50,00
MVA: 40%

BC_ST = (1000 + 100 + 50) × 1,40 = R$ 1.610,00
```

### 3.2 Cálculo do Valor ICMS-ST

```
ICMS_ST = (BC_ST × Alíquota_Interna) - ICMS_Próprio
```

**Exemplo:**
```
BC_ST: R$ 1.610,00
Alíquota Interna: 18%
ICMS Próprio: R$ 180,00

ICMS_ST = (1.610 × 0,18) - 180 = 289,80 - 180 = R$ 109,80
```

### 3.3 MVA Ajustada (Operações Interestaduais)

```
MVA_Ajustada = [(1 + MVA_Original) × (1 - ALQ_Inter) / (1 - ALQ_Intra) - 1] × 100
```

**Exemplo:**
```
MVA Original: 40%
Alíquota Interestadual: 12%
Alíquota Interna Destino: 18%

MVA_Ajustada = [(1 + 0,40) × (1 - 0,12) / (1 - 0,18) - 1] × 100
MVA_Ajustada = [1,40 × 0,88 / 0,82 - 1] × 100
MVA_Ajustada = [1,5024 - 1] × 100 = 50,24%
```

### 3.4 JSON ICMS-ST Completo

```json
"icms": {
  "origem": "0",
  "cst": "10",
  "baseCalculo": {
    "modalidadeDeterminacao": 0,
    "valor": 1150.00
  },
  "aliquota": 12.00,
  "valor": 138.00,
  "st": {
    "baseCalculo": {
      "modalidadeDeterminacao": 4,
      "percentualMva": 50.24,
      "percentualReducao": 0,
      "valor": 1727.76
    },
    "aliquota": 18.00,
    "valor": 173.00
  },
  "fundoCombatePobrezaSt": {
    "aliquota": 2.00,
    "baseCalculo": 1727.76,
    "valor": 34.56
  }
}
```

---

## 4. PIS E COFINS

### 4.1 CST PIS/COFINS - Regime Cumulativo/Não Cumulativo

| CST | Descrição |
|-----|-----------|
| 01 | Operação Tributável com Alíquota Básica |
| 02 | Operação Tributável com Alíquota Diferenciada |
| 03 | Operação Tributável com Alíquota por Unidade de Produto |
| 04 | Operação Tributável Monofásica - Revenda Alíquota Zero |
| 05 | Operação Tributável por Substituição Tributária |
| 06 | Operação Tributável a Alíquota Zero |
| 07 | Operação Isenta da Contribuição |
| 08 | Operação sem Incidência da Contribuição |
| 09 | Operação com Suspensão da Contribuição |
| 49 | Outras Operações de Saída |
| 50-56 | Créditos (Entrada) |
| 60-67 | Crédito Presumido |
| 70-75 | Créditos - Outras Operações |
| 98 | Outras Operações de Entrada |
| 99 | Outras Operações |

### 4.2 Alíquotas Padrão

| Tributo | Regime Cumulativo | Regime Não Cumulativo |
|---------|-------------------|----------------------|
| PIS | 0,65% | 1,65% |
| COFINS | 3,00% | 7,60% |

### 4.3 JSON PIS (CST 01 - Básico)

```json
"pis": {
  "cst": "01",
  "baseCalculo": 1000.00,
  "aliquota": 1.65,
  "valor": 16.50
}
```

### 4.4 JSON PIS (CST 03 - Por Quantidade)

```json
"pis": {
  "cst": "03",
  "quantidadeVendida": 100.00,
  "aliquotaReais": 0.0165,
  "valor": 1.65
}
```

### 4.5 JSON COFINS (CST 01 - Básico)

```json
"cofins": {
  "cst": "01",
  "baseCalculo": 1000.00,
  "aliquota": 7.60,
  "valor": 76.00
}
```

### 4.6 PIS/COFINS ST (Substituição)

```json
"pisSt": {
  "baseCalculo": 1500.00,
  "aliquota": 1.65,
  "valor": 24.75
},
"cofinsSt": {
  "baseCalculo": 1500.00,
  "aliquota": 7.60,
  "valor": 114.00
}
```

---

## 5. IPI

### 5.1 CST IPI

| CST | Descrição | Tipo |
|-----|-----------|------|
| 00 | Entrada com recuperação de crédito | Entrada |
| 01 | Entrada tributada com alíquota zero | Entrada |
| 02 | Entrada isenta | Entrada |
| 03 | Entrada não tributada | Entrada |
| 04 | Entrada imune | Entrada |
| 05 | Entrada com suspensão | Entrada |
| 49 | Outras entradas | Entrada |
| 50 | Saída tributada | Saída |
| 51 | Saída tributada com alíquota zero | Saída |
| 52 | Saída isenta | Saída |
| 53 | Saída não tributada | Saída |
| 54 | Saída imune | Saída |
| 55 | Saída com suspensão | Saída |
| 99 | Outras saídas | Saída |

### 5.2 JSON IPI (CST 50 - Tributado)

```json
"ipi": {
  "cst": "50",
  "codigoEnquadramento": "999",
  "baseCalculo": 1000.00,
  "aliquota": 10.00,
  "valor": 100.00
}
```

### 5.3 JSON IPI (CST 53 - Não Tributado)

```json
"ipi": {
  "cst": "53",
  "codigoEnquadramento": "999"
}
```

---

## 6. FORMAS DE PAGAMENTO

### 6.1 Tabela de Meios de Pagamento (Atualizada 07/2024)

| Código | Descrição |
|--------|-----------|
| 01 | Dinheiro |
| 02 | Cheque |
| 03 | Cartão de Crédito |
| 04 | Cartão de Débito |
| 05 | Cartão da Loja (Private Label) |
| 10 | Vale Alimentação |
| 11 | Vale Refeição |
| 12 | Vale Presente |
| 13 | Vale Combustível |
| 14 | Duplicata Mercantil |
| 15 | Boleto Bancário |
| 16 | Depósito Bancário |
| 17 | Pagamento Instantâneo (PIX) - Dinâmico |
| 18 | Transferência Bancária, Carteira Digital |
| 19 | Programa de Fidelidade, Cashback, Crédito Virtual |
| 20 | Pagamento Instantâneo (PIX) - Estático |
| 21 | Crédito em Loja |
| 22 | Pagamento Eletrônico não Informado |
| 23 | Crediário Digital |
| 24 | Outros Crediários |
| 90 | Sem Pagamento |
| 99 | Outros |

### 6.2 Bandeiras de Cartão

| Código | Bandeira |
|--------|----------|
| 01 | Visa |
| 02 | Mastercard |
| 03 | American Express |
| 04 | Sorocred |
| 05 | Diners Club |
| 06 | Elo |
| 07 | Hipercard |
| 08 | Aura |
| 09 | Cabal |
| 99 | Outros |

### 6.3 JSON Pagamento - Dinheiro

```json
"pagamentos": [{
  "aVista": true,
  "tipo": "DINHEIRO",
  "valor": 1000.00
}]
```

### 6.4 JSON Pagamento - PIX

```json
"pagamentos": [{
  "aVista": true,
  "tipo": "PIX",
  "valor": 1000.00
}]
```

### 6.5 JSON Pagamento - Cartão de Crédito

```json
"pagamentos": [{
  "aVista": false,
  "tipo": "CARTAO_CREDITO",
  "valor": 1000.00,
  "cartao": {
    "tipoIntegracao": "1",
    "cnpjCredenciadora": "01027058000191",
    "bandeira": "01",
    "codigoAutorizacao": "ABC123"
  }
}]
```

### 6.6 JSON Pagamento - Boleto com Parcelas

```json
"pagamentos": [{
  "aVista": false,
  "tipo": "BOLETO",
  "valor": 3000.00
}],
"cobranca": {
  "fatura": {
    "numero": "FAT001",
    "valorOriginal": 3000.00,
    "valorDesconto": 0,
    "valorLiquido": 3000.00
  },
  "duplicatas": [{
    "numero": "001",
    "vencimento": "2025-01-12",
    "valor": 1000.00
  }, {
    "numero": "002",
    "vencimento": "2025-02-12",
    "valor": 1000.00
  }, {
    "numero": "003",
    "vencimento": "2025-03-12",
    "valor": 1000.00
  }]
}
```

### 6.7 JSON Pagamento - Múltiplas Formas

```json
"pagamentos": [{
  "aVista": true,
  "tipo": "DINHEIRO",
  "valor": 500.00
}, {
  "aVista": true,
  "tipo": "PIX",
  "valor": 300.00
}, {
  "aVista": false,
  "tipo": "CARTAO_CREDITO",
  "valor": 200.00,
  "cartao": {
    "tipoIntegracao": "2",
    "bandeira": "02"
  }
}],
"troco": 50.00
```

---

## 7. TRANSPORTE E VOLUMES

### 7.1 Modalidade de Frete

| Código | Descrição |
|--------|-----------|
| 0 | Contratação do Frete por conta do Remetente (CIF) |
| 1 | Contratação do Frete por conta do Destinatário (FOB) |
| 2 | Contratação do Frete por conta de Terceiros |
| 3 | Transporte Próprio por conta do Remetente |
| 4 | Transporte Próprio por conta do Destinatário |
| 9 | Sem Ocorrência de Transporte |

### 7.2 JSON Transporte Completo

```json
"transporte": {
  "modalidade": "0",
  "transportadora": {
    "cpfCnpj": "00000000000000",
    "razaoSocial": "TRANSPORTADORA TESTE LTDA",
    "inscricaoEstadual": "ISENTO",
    "endereco": {
      "logradouro": "Rua do Transporte",
      "numero": "100",
      "bairro": "Industrial",
      "codigoCidade": "4115200",
      "descricaoCidade": "MARINGÁ",
      "estado": "PR"
    }
  },
  "veiculo": {
    "placa": "ABC1234",
    "estado": "PR",
    "rntc": "12345678"
  },
  "reboque": [{
    "placa": "DEF5678",
    "estado": "PR",
    "rntc": "87654321"
  }],
  "volumes": [{
    "quantidade": 10,
    "especie": "CAIXA",
    "marca": "PLANAC",
    "numeracao": "1-10",
    "pesoLiquido": 450.00,
    "pesoBruto": 500.00
  }],
  "valorFrete": 150.00,
  "valorSeguro": 50.00
}
```

### 7.3 JSON Transporte Simples (Sem Frete)

```json
"transporte": {
  "modalidade": "9"
}
```

---

## 8. NOTAS REFERENCIADAS E FINALIDADES

### 8.1 Finalidade da NF-e

| Código | Descrição | Uso |
|--------|-----------|-----|
| 1 | NF-e Normal | Venda, remessa, etc |
| 2 | NF-e Complementar | Complemento de valor/imposto |
| 3 | NF-e de Ajuste | Ajuste fiscal |
| 4 | Devolução de Mercadoria | Devolução |

### 8.2 JSON Nota de Devolução

```json
{
  "idIntegracao": "DEV-001",
  "finalidade": "4",
  "natureza": "DEVOLUÇÃO DE MERCADORIA",
  "notaReferenciada": {
    "nfe": [{
      "chave": "41251200000000000000550010000001001000000019"
    }]
  },
  "itens": [{
    "codigo": "PROD-001",
    "descricao": "PRODUTO DEVOLVIDO",
    "ncm": "94036000",
    "cfop": "5202",
    "quantidade": 5,
    "valorUnitario": 100.00
  }]
}
```

### 8.3 JSON Nota Complementar

```json
{
  "idIntegracao": "COMP-001",
  "finalidade": "2",
  "natureza": "NF COMPLEMENTAR DE ICMS",
  "informacoesComplementares": "NF complementar ref. NF 1001 de 01/12/2025",
  "notaReferenciada": {
    "nfe": [{
      "chave": "41251200000000000000550010000001001000000019"
    }]
  },
  "itens": [{
    "codigo": "COMPL",
    "descricao": "COMPLEMENTO DE ICMS",
    "ncm": "94036000",
    "cfop": "5949",
    "quantidade": 1,
    "valorUnitario": 0.00,
    "tributos": {
      "icms": {
        "origem": "0",
        "cst": "00",
        "baseCalculo": {
          "modalidadeDeterminacao": 0,
          "valor": 0
        },
        "aliquota": 0,
        "valor": 180.00
      }
    }
  }]
}
```

---

## 9. EXEMPLOS JSON POR CENÁRIO

### 9.1 Venda Simples Nacional (CSOSN 102)

```json
[{
  "idIntegracao": "SN-001",
  "presencial": true,
  "natureza": "VENDA",
  "finalidade": "NORMAL",
  "consumidorFinal": true,
  "emitente": {
    "cpfCnpj": "00000000000000"
  },
  "destinatario": {
    "cpfCnpj": "00000000000",
    "razaoSocial": "CONSUMIDOR FINAL"
  },
  "itens": [{
    "codigo": "001",
    "descricao": "PRODUTO TESTE",
    "ncm": "94036000",
    "cfop": "5102",
    "unidade": "UN",
    "quantidade": 1,
    "valorUnitario": 100.00,
    "tributos": {
      "icms": {
        "origem": "0",
        "cst": "102"
      },
      "pis": {
        "cst": "49"
      },
      "cofins": {
        "cst": "49"
      }
    }
  }],
  "pagamentos": [{
    "aVista": true,
    "tipo": "DINHEIRO",
    "valor": 100.00
  }]
}]
```

### 9.2 Venda Interestadual com DIFAL

```json
[{
  "idIntegracao": "INTER-001",
  "presencial": false,
  "natureza": "VENDA",
  "finalidade": "NORMAL",
  "consumidorFinal": true,
  "codigoIdentificacaoDestino": "2",
  "emitente": {
    "cpfCnpj": "00000000000000"
  },
  "destinatario": {
    "cpfCnpj": "11111111111111",
    "razaoSocial": "CLIENTE OUTRO ESTADO",
    "indicadorContribuinte": "9",
    "endereco": {
      "logradouro": "Rua Teste",
      "numero": "100",
      "bairro": "Centro",
      "codigoCidade": "3550308",
      "descricaoCidade": "SÃO PAULO",
      "estado": "SP",
      "cep": "01000000"
    }
  },
  "itens": [{
    "codigo": "001",
    "descricao": "PRODUTO INTERESTADUAL",
    "ncm": "94036000",
    "cfop": "6108",
    "unidade": "UN",
    "quantidade": 1,
    "valorUnitario": 1000.00,
    "tributos": {
      "icms": {
        "origem": "0",
        "cst": "00",
        "baseCalculo": {
          "modalidadeDeterminacao": 0,
          "valor": 1000.00
        },
        "aliquota": 12.00,
        "valor": 120.00
      },
      "icmsUfDestino": {
        "baseCalculo": 1000.00,
        "aliquotaInterestadual": 12.00,
        "aliquotaInterna": 18.00,
        "aliquotaFcp": 2.00,
        "percentualPartilha": 100.00,
        "valorFcp": 20.00,
        "valorUfDestino": 60.00,
        "valorUfOrigem": 0.00
      },
      "pis": {
        "cst": "01",
        "baseCalculo": 1000.00,
        "aliquota": 1.65,
        "valor": 16.50
      },
      "cofins": {
        "cst": "01",
        "baseCalculo": 1000.00,
        "aliquota": 7.60,
        "valor": 76.00
      }
    }
  }],
  "pagamentos": [{
    "aVista": true,
    "tipo": "PIX",
    "valor": 1000.00
  }]
}]
```

### 9.3 Venda com Substituição Tributária

```json
[{
  "idIntegracao": "ST-001",
  "natureza": "VENDA COM ST",
  "finalidade": "NORMAL",
  "emitente": {
    "cpfCnpj": "00000000000000"
  },
  "destinatario": {
    "cpfCnpj": "11111111111111",
    "razaoSocial": "REVENDEDOR",
    "indicadorContribuinte": "1",
    "inscricaoEstadual": "123456789"
  },
  "itens": [{
    "codigo": "001",
    "descricao": "PRODUTO COM ST",
    "ncm": "39269090",
    "cest": "1000100",
    "cfop": "5401",
    "unidade": "UN",
    "quantidade": 10,
    "valorUnitario": 100.00,
    "tributos": {
      "icms": {
        "origem": "0",
        "cst": "10",
        "baseCalculo": {
          "modalidadeDeterminacao": 0,
          "valor": 1000.00
        },
        "aliquota": 18.00,
        "valor": 180.00,
        "st": {
          "baseCalculo": {
            "modalidadeDeterminacao": 4,
            "percentualMva": 40.00,
            "valor": 1400.00
          },
          "aliquota": 18.00,
          "valor": 72.00
        }
      },
      "pis": {
        "cst": "01",
        "baseCalculo": 1000.00,
        "aliquota": 1.65
      },
      "cofins": {
        "cst": "01",
        "baseCalculo": 1000.00,
        "aliquota": 7.60
      }
    }
  }],
  "pagamentos": [{
    "aVista": false,
    "tipo": "BOLETO",
    "valor": 1252.00
  }],
  "cobranca": {
    "duplicatas": [{
      "numero": "001",
      "vencimento": "2025-01-12",
      "valor": 1252.00
    }]
  }
}]
```

---

## 10. TABELAS DE APOIO

### 10.1 CFOP - Códigos Mais Usados (Distribuidora)

| CFOP | Descrição | Uso |
|------|-----------|-----|
| **SAÍDAS INTERNAS** | | |
| 5101 | Venda de produção do estabelecimento | Indústria |
| 5102 | Venda de mercadoria adquirida | Revenda |
| 5401 | Venda com ST (responsável) | Com ST |
| 5403 | Venda com ST já retido | Revenda ST |
| 5405 | Venda a consumidor final com ST | Varejo ST |
| 5202 | Devolução de compra | Devolução |
| 5910 | Remessa bonificação/doação | Bonificação |
| 5911 | Remessa amostra grátis | Amostra |
| 5949 | Outra saída não especificada | Outros |
| **SAÍDAS INTERESTADUAIS** | | |
| 6101 | Venda de produção | Indústria |
| 6102 | Venda de mercadoria adquirida | Revenda |
| 6108 | Venda não contribuinte | E-commerce |
| 6401 | Venda com ST (responsável) | Com ST |
| 6403 | Venda com ST já retido | Revenda ST |
| 6202 | Devolução de compra | Devolução |
| **ENTRADAS INTERNAS** | | |
| 1102 | Compra para comercialização | Compra |
| 1403 | Compra com ST já retido | Compra ST |
| 1202 | Devolução de venda | Dev. venda |
| 1949 | Outra entrada não especificada | Outros |
| **ENTRADAS INTERESTADUAIS** | | |
| 2102 | Compra para comercialização | Compra |
| 2403 | Compra com ST já retido | Compra ST |
| 2202 | Devolução de venda | Dev. venda |

### 10.2 NCM - Materiais de Construção (Drywall)

| NCM | Descrição |
|-----|-----------|
| 68091100 | Placas de gesso revestidas de papel/cartão |
| 68091900 | Outras chapas de gesso |
| 68099000 | Outras obras de gesso |
| 72142000 | Barras de ferro/aço não ligado |
| 73089090 | Outras construções e partes de ferro/aço |
| 39269090 | Outras obras de plásticos |
| 39172900 | Tubos rígidos de outros plásticos |
| 44181000 | Janelas, portas e seus caixilhos de madeira |

### 10.3 Indicador de Contribuinte ICMS

| Código | Descrição |
|--------|-----------|
| 1 | Contribuinte ICMS |
| 2 | Contribuinte isento de IE |
| 9 | Não contribuinte |

### 10.4 Indicador de Presença

| Código | Descrição |
|--------|-----------|
| 0 | Não se aplica |
| 1 | Presencial |
| 2 | Internet |
| 3 | Teleatendimento |
| 4 | NFC-e entrega domicílio |
| 5 | Presencial fora do estabelecimento |
| 9 | Outros |

---

## 📌 CONCLUSÃO

Este documento complementa o FISCAL-DETALHADO.md com:

1. **Tabelas completas** de CST, CSOSN, CFOP
2. **Exemplos JSON** por tipo de tributação
3. **Cálculos detalhados** de ICMS-ST
4. **Cenários práticos** para distribuidora

### Próximos Passos:

1. ✅ Documentação tributária completa
2. ⏳ Implementar parser de XML de entrada
3. ⏳ Mapear produtos PLANAC → NCM → CST
4. ⏳ Configurar regras de ST por UF
5. ⏳ Testes com casos reais

---

**Documento gerado em:** 12/12/2025  
**Projeto:** PLANAC ERP Multi-tenant  
**Autor:** Claude (DEV.com Orquestrador)
