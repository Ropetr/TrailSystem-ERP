# 📊 IBPT API - De Olho no Imposto

> Transparência Tributária conforme Lei 12.741/2012

## 📋 Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `documentacao-completa.md` | Documentação técnica completa |

## 🔗 Informações Gerais

- **Site:** https://deolhonoimposto.ibpt.org.br
- **Base URL:** `https://apidoni.ibpt.org.br/api/v1`
- **Método:** GET
- **Formatos:** JSON, XML

## 🎯 Endpoints

| Endpoint | Descrição |
|----------|-----------|
| `/produtos` | Consulta tributos por NCM |
| `/servicos` | Consulta tributos por NBS/LC116 |

## 📊 Campos de Resposta

| Campo | Descrição |
|-------|-----------|
| `Nacional` | % tributos federais (produto nacional) |
| `Estadual` | % ICMS |
| `Municipal` | % ISS |
| `Importado` | % tributos (produto importado) |

## ⚖️ Lei 12.741/2012

Obriga informar nos documentos fiscais o **valor aproximado dos tributos** incidentes sobre produtos e serviços.

---
*Documentação gerada em 08/12/2025*
