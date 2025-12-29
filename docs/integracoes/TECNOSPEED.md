# 📊 RELATÓRIO COMPLETO - ECOSSISTEMA TECNOSPEED

> **Data:** 12/12/2025  
> **Projeto:** PLANAC ERP Multi-tenant  
> **Objetivo:** Mapear todas as soluções TecnoSpeed para integração fiscal e financeira

---

## 📋 ÍNDICE

1. [Visão Geral TecnoSpeed](#1-visão-geral-tecnospeed)
2. [PlugDFe Suite - Documentos Fiscais](#2-plugdfe-suite---documentos-fiscais)
3. [PlugNotas - API REST para Emissão](#3-plugnotas---api-rest-para-emissão)
4. [PlugStorage - Armazenamento e Captação](#4-plugstorage---armazenamento-e-captação)
5. [PlugBank - Soluções Financeiras](#5-plugbank---soluções-financeiras)
6. [SPED e Obrigações Acessórias](#6-sped-e-obrigações-acessórias)
7. [Plug4Market - Hub de Marketplaces](#7-plug4market---hub-de-marketplaces)
8. [Outras Soluções](#8-outras-soluções)
9. [Recomendação para PLANAC](#9-recomendação-para-planac)
10. [Endpoints e URLs](#10-endpoints-e-urls)

---

## 1. VISÃO GERAL TECNOSPEED

### Informações Gerais

| Item | Valor |
|------|-------|
| **Empresa** | TecnoSpeed (Grupo TecnoSpeed) |
| **Sede** | Brasil |
| **Foco** | Soluções fiscais e financeiras para Software Houses |
| **Market Share** | ~25-30% das Software Houses brasileiras |
| **Modelo** | API REST + DLL/Componente |

### Principais Linhas de Produto

| Linha | Produtos | Função |
|-------|----------|--------|
| **PlugDFe** | NFe, NFCe, NFSe, CTe, CTe-OS, MDFe, SAT, MFe, NFCom | Emissão de documentos fiscais via DLL |
| **PlugNotas** | NFe, NFCe, NFSe, MDFe, CFe | Emissão via API REST (cloud) |
| **PlugStorage** | Armazenamento, DFe, Manifestação | Guarda de XML + captação de notas |
| **PlugBank** | Boleto, Pix, DDA, Pagamentos, Extratos | Soluções financeiras |
| **PlugSPED** | eSocial, EFD-Reinf, EFD-ICMS/IPI | Obrigações acessórias |
| **Plug4Market** | Hub Marketplaces | Integração omnichannel |
| **PlugMessage** | WhatsApp API | Comunicação |
| **PlugSign** | Assinatura Digital | Certificados e assinaturas |
| **SpeedChat** | Atendimento | Chat integrado |

---

## 2. PLUGDFE SUITE - DOCUMENTOS FISCAIS

### 2.1 Visão Geral

O PlugDFe é a suíte completa para emissão de documentos fiscais eletrônicos, disponível em duas modalidades:

- **Via DLL/Componente** - Biblioteca para integração local
- **Via API REST** - Integração cloud (PlugNotas)

### 2.2 Documentos Suportados

| Documento | Modelo | Descrição | Uso Principal |
|-----------|--------|-----------|---------------|
| **NF-e** | 55 | Nota Fiscal Eletrônica | Vendas B2B e B2C (não presencial) |
| **NFC-e** | 65 | Nota Fiscal do Consumidor | PDV / Varejo presencial |
| **NFS-e** | - | Nota Fiscal de Serviço | Prestação de serviços |
| **NFS-e Nacional** | - | Padrão ABRASF | Serviços (padrão unificado) |
| **CT-e** | 57 | Conhecimento de Transporte | Transporte de cargas |
| **CT-e OS** | 67 | CT-e Outros Serviços | Transporte (outros) |
| **MDF-e** | 58 | Manifesto de Documentos | Expedição / Transporte |
| **SAT** | 59 | CF-e via SAT | Cupom Fiscal (SP) |
| **MF-e** | 59 | Módulo Fiscal Eletrônico | Cupom Fiscal (CE/outros) |
| **NFCom** | - | NF Comunicação | Telecomunicações |
| **GNRe** | - | Guia Nacional Recolhimento | ICMS Interestadual |

### 2.3 Funcionalidades Comuns

- ✅ Geração automática de XML
- ✅ Assinatura digital (A1 e A3)
- ✅ Transmissão para SEFAZ
- ✅ Gestão de contingência
- ✅ Carta de Correção Eletrônica (CC-e)
- ✅ Cancelamento
- ✅ Inutilização de numeração
- ✅ Geração de DANFE/DACTE/DANFSE
- ✅ Envio automático por e-mail
- ✅ Webhook para notificações
- ✅ Armazenamento por 5+ anos

---

## 3. PLUGNOTAS - API REST PARA EMISSÃO

### 3.1 Visão Geral

| Item | Valor |
|------|-------|
| **Tipo** | API REST |
| **Formato** | JSON |
| **Protocolo** | HTTPS |
| **Autenticação** | Token Bearer |
| **Documentação** | https://docs.plugnotas.com.br |
| **Interface Web** | https://app.plugnotas.com.br |

### 3.2 Documentos Disponíveis

| Documento | Rota Base | Cidades/Estados |
|-----------|-----------|-----------------|
| **NF-e** | `/nfe` | Todos os estados |
| **NFC-e** | `/nfce` | Todos os estados |
| **NFS-e** | `/nfse` | +2.000 cidades homologadas |
| **NFS-e Nacional** | `/nfse` | Padrão unificado |
| **MDF-e** | `/mdfe` | Todos os estados |
| **CF-e (SAT)** | `/cfe` | São Paulo |

### 3.3 Endpoints Principais

#### Autenticação e Configuração
```
POST   /empresa                    # Cadastrar empresa emissora
PUT    /empresa/{cpfCnpj}          # Atualizar empresa
GET    /empresa/{cpfCnpj}          # Consultar empresa
POST   /certificado                # Cadastrar certificado A1
DELETE /certificado/{cpfCnpj}      # Remover certificado
```

#### NF-e (Nota Fiscal Eletrônica)
```
POST   /nfe                        # Emitir NF-e
GET    /nfe/{id}                   # Consultar NF-e
GET    /nfe/{id}/pdf               # Baixar DANFE (PDF)
GET    /nfe/{id}/xml               # Baixar XML
POST   /nfe/{id}/cancelar          # Cancelar NF-e
POST   /nfe/{id}/cce               # Carta de Correção
POST   /nfe/inutilizar             # Inutilizar numeração
GET    /nfe/status/{uf}            # Status SEFAZ
GET    /nfe/consultar-destinadas   # Notas destinadas ao CNPJ
```

#### NFC-e (Nota Fiscal do Consumidor)
```
POST   /nfce                       # Emitir NFC-e
GET    /nfce/{id}                  # Consultar NFC-e
GET    /nfce/{id}/pdf              # Baixar DANFCE
GET    /nfce/{id}/xml              # Baixar XML
POST   /nfce/{id}/cancelar         # Cancelar NFC-e
POST   /nfce/inutilizar            # Inutilizar numeração
```

#### NFS-e (Nota Fiscal de Serviço)
```
POST   /nfse                       # Emitir NFS-e
GET    /nfse/{id}                  # Consultar NFS-e
GET    /nfse/{id}/pdf              # Baixar PDF
GET    /nfse/{id}/xml              # Baixar XML
POST   /nfse/{id}/cancelar         # Cancelar NFS-e
GET    /nfse/cidades               # Listar cidades homologadas
```

#### MDF-e (Manifesto de Documentos)
```
POST   /mdfe                       # Emitir MDF-e
GET    /mdfe/{id}                  # Consultar MDF-e
GET    /mdfe/{id}/pdf              # Baixar DAMDFE
GET    /mdfe/{id}/xml              # Baixar XML
POST   /mdfe/{id}/encerrar         # Encerrar MDF-e
POST   /mdfe/{id}/cancelar         # Cancelar MDF-e
```

#### Webhook
```
POST   /webhook                    # Cadastrar webhook
GET    /webhook                    # Listar webhooks
DELETE /webhook/{id}               # Remover webhook
```

### 3.4 Exemplo de Envio NF-e (JSON)

```json
[{
  "idIntegracao": "NOTA-001",
  "presencial": true,
  "natureza": "VENDA",
  "finalidade": "NORMAL",
  "consumidorFinal": false,
  "emitente": {
    "cpfCnpj": "00000000000000"
  },
  "destinatario": {
    "cpfCnpj": "11111111111111",
    "razaoSocial": "CLIENTE TESTE",
    "endereco": {
      "logradouro": "Rua Teste",
      "numero": "100",
      "bairro": "Centro",
      "codigoCidade": "4115200",
      "cidade": "MARINGÁ",
      "uf": "PR",
      "cep": "87000000"
    }
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
        "cst": "00",
        "aliquota": 18,
        "baseCalculo": 100.00
      },
      "pis": {
        "cst": "01",
        "aliquota": 1.65,
        "baseCalculo": 100.00
      },
      "cofins": {
        "cst": "01",
        "aliquota": 7.60,
        "baseCalculo": 100.00
      }
    }
  }],
  "pagamentos": [{
    "tipo": "DINHEIRO",
    "valor": 100.00
  }]
}]
```

### 3.5 Ambientes

| Ambiente | Base URL | Token |
|----------|----------|-------|
| **Sandbox (Mock)** | `https://api.sandbox.plugnotas.com.br` | `2da392a6-79d2-4304-a8b7-959572c7e44d` |
| **Produção** | `https://api.plugnotas.com.br` | Token gerado na interface |

### 3.6 Recursos Especiais

- **Webhook**: Notificações automáticas de status
- **Cálculo automático**: Fornece alíquota, PlugNotas calcula tributos
- **Numeração automática**: Controle sequencial
- **Contingência**: Tratamento automático
- **White Label**: Personalização de marca
- **Envio em lote**: Alto desempenho
- **Fura-fila**: Priorização de emissão

---

## 4. PLUGSTORAGE - ARMAZENAMENTO E CAPTAÇÃO

### 4.1 Visão Geral

O PlugStorage é a solução para **armazenamento de XML** e **captação de notas de entrada** (notas destinadas ao CNPJ).

| Item | Valor |
|------|-------|
| **URL Base API** | `https://app.plugstorage.com.br/api` |
| **Interface Web** | Portal de gestão de documentos |
| **Autenticação** | Basic Auth (login/senha) |

### 4.2 Funcionalidades Principais

#### Armazenamento
- ✅ Guarda XML por 5 anos (conforme legislação)
- ✅ Integração nativa com PlugNotas e PlugDFe
- ✅ Sincronizador desktop (monitora pastas)
- ✅ Upload via API
- ✅ Recebimento por e-mail

#### Notas Destinadas (Captação)
- ✅ Consulta automática de NF-e emitidas contra o CNPJ
- ✅ Manifesto do Destinatário automático
- ✅ Download do XML completo
- ✅ Consulta de CT-e destinados

#### Distribuição
- ✅ Envio automático para destinatário
- ✅ Envio para contador (integração Domínio)
- ✅ Envio para transportador

### 4.3 Endpoints Principais

#### Consulta de Notas
```
GET  /invoices/keys                    # Listar chaves de notas
GET  /v2/invoices/keys                 # Listar chaves (v2 com filtros)
GET  /invoices/xml/{chave}             # Baixar XML
GET  /invoices/pdf/{chave}             # Baixar PDF/DANFE
```

#### Parâmetros Consulta v2
```
GET /v2/invoices/keys?token={token}
    &cpf_cnpj={cnpj}
    &date_ini={AAAA-MM-DD}
    &date_end={AAAA-MM-DD}
    &mod={NFE|CCE|NFCE|CTE|CCECTE|SAT|CTEOS}
    &transaction={received|sent|other|all}
    &limit={numero}
    &environment={1|2}
    &manifests={1}
    &resume={true|false}
```

#### Upload de XML
```
POST /invoices?token={token}
     Body: xml={xml_completo}
```

### 4.4 Manifestação do Destinatário

Tipos de manifestação disponíveis:
- `CIENCIA` - Ciência da Operação (libera XML completo)
- `CONFIRMAR` - Confirmação da Operação (definitivo)
- `DESCONHECIMENTO` - Desconhecimento da Operação
- `NAO_REALIZADA` - Operação não Realizada
- `DESACORDO` - Desacordo (para CT-e)

### 4.5 Fluxo de Captação de Notas de Entrada

```
1. Configurar certificado digital A1 no PlugStorage
2. Sistema consulta SEFAZ automaticamente (NSU)
3. Notas resumidas são armazenadas
4. Manifesto "Ciência da Operação" é enviado
5. XML completo fica disponível para download
6. ERP importa XML com dados fiscais completos
```

### 4.6 Integração com Domínio (Thomson Reuters)

- Envio automático de XMLs para o sistema Domínio
- Facilita trabalho do contador
- Arquivos SPED disponíveis para download

---

## 5. PLUGBANK - SOLUÇÕES FINANCEIRAS

### 5.1 Visão Geral

O PlugBank é a suíte financeira da TecnoSpeed para integração bancária.

| Produto | Função |
|---------|--------|
| **PlugBoleto** | Emissão e gestão de boletos |
| **API Pix** | Geração e recebimento via Pix |
| **API DDA** | Busca de boletos (Débito Direto Autorizado) |
| **API Contas a Pagar** | Agendamento de pagamentos |
| **API Extratos** | Consulta de extratos bancários |
| **Consulta de Crédito** | Análise de crédito (Serasa) |

### 5.2 PlugBoleto - API de Boletos

#### Endpoints Base
```
POST   /boleto                     # Registrar boleto
GET    /boleto/{id}                # Consultar boleto
GET    /boleto/{id}/pdf            # Baixar PDF
POST   /boleto/{id}/baixa          # Dar baixa
POST   /boleto/{id}/cancelar       # Cancelar
```

#### Recursos
- ✅ +40 bancos homologados
- ✅ Boleto híbrido (QR Code Pix)
- ✅ Boleto recorrente (assinaturas)
- ✅ Registro instantâneo via WebService
- ✅ Webhook para notificações
- ✅ Disparo de e-mail automático
- ✅ Layout único para todos os bancos

#### Bancos Homologados (principais)
- Banco do Brasil
- Bradesco
- Itaú
- Santander
- Caixa Econômica
- Sicoob
- Sicredi
- Banrisul
- Inter
- PagSeguro
- E +30 outros

### 5.3 API Pix

#### Endpoints
```
POST   /pix/cobranca               # Criar cobrança Pix
GET    /pix/cobranca/{txid}        # Consultar cobrança
GET    /pix/cobranca/{txid}/qrcode # Obter QR Code
POST   /pix/webhook                # Cadastrar webhook
```

#### Funcionalidades
- ✅ QR Code dinâmico
- ✅ Pix Cobrança
- ✅ Boleto híbrido (Pix + Boleto)
- ✅ Conciliação automática
- ✅ Webhook para confirmação
- ✅ Integração com principais bancos

### 5.4 API DDA (Débito Direto Autorizado)

"Buscador de Boletos" - consulta boletos registrados contra o CNPJ.

```
GET /dda/boletos?cnpj={cnpj}&dataInicio={data}&dataFim={data}
```

#### Benefícios
- Reduz tempo em tarefas manuais
- Maior controle financeiro
- Segurança contra boletos falsos
- Elimina necessidade de boletos impressos

### 5.5 API Contas a Pagar

Agendamento de pagamentos diretamente pelo ERP.

```
POST /pagamento                    # Agendar pagamento
GET  /pagamento/{id}               # Consultar status
POST /pagamento/{id}/cancelar      # Cancelar agendamento
```

### 5.6 API Extratos

Consulta de extratos bancários centralizada.

```
GET /extrato?cnpj={cnpj}&dataInicio={data}&dataFim={data}&banco={codigo}
```

**Novidade: Open Finance**
- Integração via Open Finance em desenvolvimento
- Acesso a extratos de múltiplos bancos com consentimento

### 5.7 Consulta de Crédito (Serasa)

```
GET /credito/consulta?documento={cpf_cnpj}
```

- Análise de risco
- Score de crédito
- Pendências financeiras

---

## 6. SPED E OBRIGAÇÕES ACESSÓRIAS

### 6.1 eSocial

Sistema de Escrituração Digital das Obrigações Fiscais, Previdenciárias e Trabalhistas.

| Item | Valor |
|------|-------|
| **Eventos** | 48 tipos |
| **Integração** | DLL ou API |
| **Assinatura** | A1 ou A3 |

#### Processo
1. Gerar XML do evento
2. Assinar digitalmente
3. Enviar lote
4. Consultar protocolo/resultado

### 6.2 EFD-Reinf

Escrituração Fiscal Digital de Retenções e Outras Informações Fiscais.

| Item | Valor |
|------|-------|
| **Eventos** | 23 tipos (leiaute 2.1.2) |
| **Prazo** | Dia 15 do mês seguinte |
| **Complemento** | eSocial |

#### Eventos Principais
- R-1000: Informações do Contribuinte
- R-2010: Retenção Contribuição Previdenciária
- R-4010: Pagamentos Diversos (PF)
- R-4020: Pagamentos Diversos (PJ)
- R-4099: Fechamento/Reabertura

### 6.3 EFD-ICMS/IPI (SPED Fiscal)

Escrituração Fiscal Digital de ICMS e IPI.

- 10 blocos de informações
- Bloco C: Documentos Fiscais de Mercadorias
- Bloco D: Documentos Fiscais de Transporte
- Bloco E: Apuração de ICMS e IPI

### 6.4 GNRe (Guia Nacional de Recolhimento)

Geração de guias para recolhimento de ICMS em operações interestaduais.

---

## 7. PLUG4MARKET - HUB DE MARKETPLACES

### 7.1 Visão Geral

Hub de integração para vendas em múltiplos marketplaces e e-commerces.

| Item | Valor |
|------|-------|
| **Canais** | +80 marketplaces e e-commerces |
| **API** | REST |
| **White Label** | Sim |

### 7.2 Marketplaces Integrados

- Mercado Livre
- Amazon
- Shopee
- Magazine Luiza
- Americanas (B2W)
- Netshoes
- Dafiti
- Via Varejo (Casas Bahia, Ponto)
- Carrefour
- E muitos outros

### 7.3 E-commerces Integrados

- Tray
- Nuvemshop
- WooCommerce
- Magento
- VTEX
- Loja Integrada
- Climba
- E outros

### 7.4 Funcionalidades

- ✅ Gestão centralizada de produtos
- ✅ Sincronização de estoque em tempo real
- ✅ Processamento de pedidos
- ✅ Envio de NF-e para marketplaces
- ✅ Rastreamento de envios
- ✅ Relatórios unificados

### 7.5 Endpoints Principais

```
GET    /produtos                   # Listar produtos
POST   /produtos                   # Cadastrar produto
PUT    /produtos/{id}              # Atualizar produto
GET    /pedidos                    # Listar pedidos
POST   /pedidos/{id}/confirmar     # Confirmar integração
POST   /pedidos/{id}/nfe           # Enviar NF-e
```

---

## 8. OUTRAS SOLUÇÕES

### 8.1 PlugMessage - WhatsApp API

Integração com WhatsApp Business para comunicação automatizada.

- Envio de mensagens
- Templates
- Chatbots
- Webhooks

### 8.2 PlugSign - Assinatura Digital

- Assinatura eletrônica de documentos
- Certificados digitais
- Validação jurídica

### 8.3 SpeedChat - Atendimento

- Chat integrado ao sistema
- Gestão de atendimentos
- Múltiplos operadores

### 8.4 PlugDash - Visualização de Dados

- Dashboards customizados
- Relatórios visuais
- Business Intelligence

### 8.5 TecnoSign para ERP

- Gestão de certificados digitais
- Renovação automática
- Alertas de vencimento

---

## 9. RECOMENDAÇÃO PARA PLANAC

### 9.1 Produtos Essenciais (Prioridade Alta)

| Produto | Uso no PLANAC | Justificativa |
|---------|---------------|---------------|
| **PlugNotas** | Emissão NF-e, NFC-e, NFS-e | API REST simples, ideal para cloud |
| **PlugStorage** | Captação notas entrada | Notas de compra de fornecedores |
| **PlugBoleto** | Contas a receber | Cobrança de clientes |
| **API Pix** | Pagamentos | Recebimento instantâneo |

### 9.2 Produtos Complementares (Prioridade Média)

| Produto | Uso no PLANAC | Justificativa |
|---------|---------------|---------------|
| **Plug4Market** | E-commerce | Vendas online (se aplicável) |
| **API DDA** | Contas a pagar | Busca automática de boletos |
| **API Extratos** | Conciliação | Reconciliação bancária |

### 9.3 Produtos Opcionais (Prioridade Baixa)

| Produto | Uso no PLANAC | Justificativa |
|---------|---------------|---------------|
| **eSocial** | RH/DP | Se tiver módulo de folha |
| **EFD-Reinf** | Fiscal | Retenções de terceiros |
| **PlugMessage** | Comunicação | WhatsApp com clientes |

### 9.4 Fluxo Recomendado para PLANAC

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLANAC ERP                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EMISSÃO (PlugNotas)                CAPTAÇÃO (PlugStorage)      │
│  ├── NF-e (vendas B2B)              ├── NF-e de fornecedores    │
│  ├── NFC-e (PDV)                    ├── CT-e de fretes          │
│  ├── NFS-e (serviços)               └── Manifestação automática │
│  └── MDF-e (expedição)                                          │
│                                                                  │
│  FINANCEIRO (PlugBank)                                          │
│  ├── Boleto + Pix (receber)                                     │
│  ├── DDA (buscar boletos)                                       │
│  └── Pagamentos (pagar)                                         │
│                                                                  │
│  E-COMMERCE (Plug4Market)  - Opcional                           │
│  └── Mercado Livre, Shopee, Amazon                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. ENDPOINTS E URLS

### 10.1 URLs de Produção

| Serviço | URL |
|---------|-----|
| PlugNotas API | `https://api.plugnotas.com.br` |
| PlugNotas Interface | `https://app.plugnotas.com.br` |
| PlugStorage API | `https://app.plugstorage.com.br/api` |
| PlugBoleto API | `https://api.plugboleto.com.br` |
| Pagamentos API | `https://api.pagamentobancario.com.br` |
| Plug4Market API | `https://api.plug4market.com.br` |
| Documentação PlugNotas | `https://docs.plugnotas.com.br` |
| Documentação Pagamentos | `https://docs.pagamentobancario.com.br` |
| Central de Atendimento | `https://atendimento.tecnospeed.com.br` |
| TecnoAccount | `https://conta.tecnospeed.com.br` |

### 10.2 URLs de Sandbox/Teste

| Serviço | URL |
|---------|-----|
| PlugNotas Sandbox | `https://api.sandbox.plugnotas.com.br` |
| Token Sandbox | `2da392a6-79d2-4304-a8b7-959572c7e44d` |

### 10.3 Postman Collections

| Collection | URL |
|------------|-----|
| PlugNotas | `https://documenter.getpostman.com/view/3720339/2sB3WpSh1R` |
| PlugNotas (antigo) | `https://documenter.getpostman.com/view/439038/SWTBeHoY` |

### 10.4 GitHub TecnoSpeed

- https://github.com/tecnospeed
- Repositórios com exemplos em várias linguagens

---

## 📌 PRÓXIMOS PASSOS

1. **Contatar TecnoSpeed** para negociação comercial
2. **Obter credenciais** de sandbox para testes
3. **Implementar PlugNotas** para emissão (NF-e, NFC-e, NFS-e)
4. **Implementar PlugStorage** para captação de notas de entrada
5. **Implementar PlugBoleto/Pix** para financeiro
6. **Criar tabelas no D1** para armazenar tokens e configurações
7. **Desenvolver services** de integração no Worker

---

**Documento gerado em:** 12/12/2025  
**Projeto:** PLANAC ERP Multi-tenant  
**Autor:** Claude (DEV.com Orquestrador)
