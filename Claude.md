# 🎨 Claude.md - Padrões de Design TrailSystem ERP

**Versão:** 1.1  
**Última Atualização:** 27/12/2025  
**Autor:** DEV.com - 57 Especialistas IA

---

## 📋 Índice

1. [Acesso e Credenciais](#acesso-e-credenciais)
2. [Paleta de Cores](#paleta-de-cores)
3. [Ícones SVG Padronizados](#ícones-svg-padronizados)
4. [Componentes de Botões](#componentes-de-botões)
5. [Componentes de Formulário](#componentes-de-formulário)
6. [Cards e Widgets](#cards-e-widgets)
7. [Layout e Estrutura](#layout-e-estrutura)
8. [Tipografia](#tipografia)
9. [Padrões de Menu/Sidebar](#padrões-de-menusidebar)
10. [Estilos de Foco](#estilos-de-foco)

---

## 🔐 Acesso e Credenciais

### ⚠️ IMPORTANTE: Acesso via API REST

Quando utilizando o Claude para interagir com GitHub, Cloudflare ou outras integrações neste projeto, **o acesso deve ser feito via API REST** (não via MCP/conectores diretos para operações que exigem escrita).

```bash
# Exemplo de chamada API REST para GitHub
curl -H "Authorization: token {GITHUB_TOKEN}" \
  https://api.github.com/repos/Ropetr/TrailSystem-ERP/contents/

# Exemplo de chamada API REST para Cloudflare
curl -H "Authorization: Bearer {CLOUDFLARE_TOKEN}" \
  https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/
```

---

### 🔑 Credenciais (Armazenadas em `.env.local` - NÃO COMMITADO)

As credenciais abaixo devem ser mantidas em arquivo `.env.local` na raiz do projeto:

```env
# GitHub
GITHUB_TOKEN=seu_token_aqui

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=f14d821b52a4f6ecbad7fb0e0afba8e5
CLOUDFLARE_TOKEN=seu_token_aqui
CLOUDFLARE_ALLINONE_TOKEN_ID=897903319c79ccef1bf0e0c32153c1be

# Nuvem Fiscal
NUVEM_FISCAL_CLIENT_ID=seu_client_id_aqui
NUVEM_FISCAL_CLIENT_SECRET=seu_client_secret_aqui

# CPF.CNPJ
CPFCNPJ_ID=seu_id_aqui
CPFCNPJ_TOKEN=seu_token_aqui

# CNPJá
CNPJA_API_KEY=sua_chave_aqui

# APIs de IA
ANTHROPIC_API_KEY=sua_chave_aqui
OPENAI_API_KEY=sua_chave_aqui
```

---

### Cloudflare - Recursos

**Databases D1:**
- `Planac-erp-database` - Principal (211 tabelas)
- `planac-erp-ibpt` - Cache IBPT
- `orquestrador-database` - DEV.com Especialistas

**R2 Buckets:**
- `planac-erp-storage` - Arquivos gerais
- `planac-erp-certificados` - Certificados A1
- `planac-images` - Imagens de produtos
- `planac-cms-media` - Mídia e-commerce

**KV Namespaces:**
- `Planac-erp-cache` - Cache geral
- `Planac-erp-sessions` - Sessões
- `Planac-erp-rate-limit` - Rate limiting

---

### Links de Documentação das APIs

| Serviço | Documentação |
|---------|--------------|
| **Nuvem Fiscal** | https://doc.nuvemfiscal.com.br/ |
| **CPF.CNPJ** | https://www.cpfcnpj.com.br/dev/ |
| **CNPJá** | https://cnpja.com/docs |
| **Anthropic** | https://docs.anthropic.com/ |
| **OpenAI** | https://platform.openai.com/docs |
| **Cloudflare** | https://developers.cloudflare.com/ |

---

## 🎨 Paleta de Cores

### Cores Primárias (Tema Vermelho TrailSystem)
```css
/* Vermelho Principal */
--primary-500: #ef4444;      /* Cor principal */
--primary-600: #dc2626;      /* Hover */
--primary-700: #b91c1c;      /* Active/Pressed */
--primary-400: #f87171;      /* Light */
--primary-100: #fee2e2;      /* Background suave */
--primary-50:  #fef2f2;      /* Background muito suave */

/* Gradiente para ícones/avatares */
background: linear-gradient(to bottom-right, #f87171, #b91c1c);
/* Tailwind: bg-gradient-to-br from-red-400 to-red-600 */
/* Ou: bg-gradient-to-br from-red-500 to-red-700 */
```

### Cores Neutras
```css
--gray-50:  #f9fafb;   /* Background página */
--gray-100: #f3f4f6;   /* Background cards secundários */
--gray-200: #e5e7eb;   /* Bordas */
--gray-300: #d1d5db;   /* Bordas hover */
--gray-400: #9ca3af;   /* Texto placeholder, ícones inativos */
--gray-500: #6b7280;   /* Texto secundário */
--gray-600: #4b5563;   /* Texto normal */
--gray-700: #374151;   /* Texto enfatizado */
--gray-800: #1f2937;   /* Títulos */
```

### Cores Semânticas
```css
/* Sucesso */
--green-500: #22c55e;
--green-600: #16a34a;
--green-100: #dcfce7;
--green-50:  #f0fdf4;

/* Alerta/Atenção */
--yellow-500: #eab308;
--yellow-600: #ca8a04;
--yellow-100: #fef9c3;
--yellow-50:  #fefce8;

/* Erro/Perigo */
--red-500: #ef4444;
--red-600: #dc2626;
--red-100: #fee2e2;
--red-50:  #fef2f2;

/* Informação */
--blue-500: #3b82f6;
--blue-600: #2563eb;
--blue-100: #dbeafe;
--blue-50:  #eff6ff;
```

---

## 🔧 Ícones SVG Padronizados

### Estrutura Padrão
Todos os ícones seguem o padrão:
- **Tamanho:** `w-5 h-5` (20x20px) para ícones normais
- **Tamanho pequeno:** `w-4 h-4` (16px) para ícones em botões compactos
- **Tamanho grande:** `w-6 h-6` (24px) para ícones de destaque
- **Stroke:** `stroke="currentColor"` (herda cor do pai)
- **Fill:** `fill="none"` (apenas contorno)
- **StrokeWidth:** `strokeWidth={2}`
- **ViewBox:** `viewBox="0 0 24 24"`
- **LineCap/Join:** `strokeLinecap="round" strokeLinejoin="round"`

### Biblioteca de Ícones

```jsx
const Icons = {
  // === NAVEGAÇÃO ===
  back: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  chevronUp: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),

  // === AÇÕES ===
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  copy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  send: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),

  // === COMUNICAÇÃO ===
  printer: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  ),
  mail: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),

  // === DOCUMENTOS ===
  document: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),

  // === COMERCIAL ===
  cart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  scissors: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
  ),

  // === UI ===
  dots: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  ),
  filter: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  drag: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
    </svg>
  ),

  // === INDICADORES ===
  trendUp: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  trendDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  alert: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  sparkles: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),

  // === ENTIDADES ===
  user: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),

  // === OUTROS ===
  calendar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  tag: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  package: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  mapPin: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  dollarSign: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  receipt: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  ),
  chat: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};
```

---

## 🔘 Componentes de Botões

### Botão Primário (Vermelho)
```jsx
<button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
  Salvar
</button>
```

### Botão Secundário (Cinza)
```jsx
<button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
  Cancelar
</button>
```

### Botão Outline
```jsx
<button className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg font-medium transition-colors">
  Opção
</button>
```

### Botão Ghost/Transparente
```jsx
<button className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
  Link
</button>
```

### Botão de Ícone
```jsx
<button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
  {Icons.search}
</button>

{/* Com borda */}
<button className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
  {Icons.dots}
</button>
```

### Botão de Ação com Ícone
```jsx
<button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
  {Icons.settings}
  <span>Personalizar</span>
</button>
```

### Botão Danger (Excluir/Cancelar)
```jsx
<button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
  {Icons.trash}
</button>

{/* Texto */}
<button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
  Excluir
</button>
```

### Botão Success
```jsx
<button className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
  Aprovar
</button>
```

### Botão Disabled
```jsx
<button 
  disabled
  className="px-4 py-1.5 bg-gray-300 text-white rounded-lg cursor-not-allowed font-medium"
>
  Aguarde...
</button>
```

---

## 📝 Componentes de Formulário

### Estilos Globais de Foco (IMPORTANTE)
```jsx
const globalStyles = `
  input:focus, textarea:focus {
    outline: none !important;
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
  }
`;

// Aplicar no componente:
<style>{globalStyles}</style>
```

### Input Padrão
```jsx
<div>
  <label className="block text-xs text-gray-500 mb-1">Nome do Campo</label>
  <input 
    type="text"
    value={valor}
    onChange={(e) => setValor(e.target.value)}
    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
    placeholder="Digite aqui..."
  />
</div>
```

### Input Readonly
```jsx
<input 
  type="text" 
  value={valor}
  readOnly
  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
/>
```

### Input com Ícone (Busca)
```jsx
<div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
    {Icons.search}
  </span>
  <input
    type="text"
    placeholder="Buscar..."
    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64"
  />
</div>
```

### Input Numérico (centralizado)
```jsx
<input
  type="number"
  value={quantidade}
  onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
  className="w-20 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
/>
```

### Textarea
```jsx
<textarea
  value={observacoes}
  onChange={(e) => setObservacoes(e.target.value)}
  placeholder="Observações..."
  rows={6}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
/>
```

### SelectDropdown Customizado
```jsx
// Estilo do botão trigger:
className={`w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-left 
  flex items-center justify-between transition-colors
  ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:border-gray-300 cursor-pointer'}
  ${isOpen ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}

// Estilo do dropdown:
className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 
  rounded-xl shadow-lg py-1 z-50 max-h-60 overflow-auto"

// Estilo da opção:
className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between transition-colors
  ${selected ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
```

---

## 📦 Cards e Widgets

### Card Básico
```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
    Título do Card
  </h2>
  {/* Conteúdo */}
</div>
```

### Card com Hover
```jsx
<div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
  {/* Conteúdo */}
</div>
```

### Widget Card (com header e drag handle)
```jsx
<div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
  {/* Header */}
  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{Icons.trophy}</span>
      <h3 className="font-semibold text-gray-800">Título Widget</h3>
    </div>
    <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-gray-300 hover:text-gray-400">
      {Icons.drag}
    </div>
  </div>
  
  {/* Content */}
  <div className="p-5">
    {/* Conteúdo */}
  </div>
</div>
```

---

## 📐 Layout e Estrutura

### Container Principal
```jsx
<div className="max-w-7xl mx-auto px-4 py-6">
  {/* Conteúdo */}
</div>

{/* Para dashboards mais largos */}
<div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
  {/* Conteúdo */}
</div>
```

### Header Sticky
```jsx
<header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
  <div className="max-w-7xl mx-auto px-4 py-3">
    <div className="flex items-center justify-between">
      {/* Esquerda */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
          {Icons.back}
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white">
          {Icons.document}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Título da Página</h1>
          <p className="text-sm text-gray-500">Subtítulo opcional</p>
        </div>
      </div>
      
      {/* Direita */}
      <div className="flex items-center gap-3">
        {/* Botões de ação */}
      </div>
    </div>
  </div>
</header>
```

### Grid Responsivo
```jsx
{/* 4 colunas em telas grandes */}
<div className="grid grid-cols-4 gap-3">

{/* 2 colunas */}
<div className="grid grid-cols-2 gap-4">

{/* Auto-fit responsivo */}
<div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
```

### Divisória
```jsx
<div className="border-t border-gray-100 my-4"></div>
```

### Background da Página
```jsx
<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
{/* ou simplesmente */}
<div className="min-h-screen bg-gray-50">
```

---

## ✏️ Tipografia

### Títulos de Seção
```jsx
<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
  Título da Seção
</h2>
```

### Título de Página (Header)
```jsx
<h1 className="text-xl font-bold text-gray-800">Título Principal</h1>
<p className="text-sm text-gray-500">Subtítulo ou descrição</p>
```

### Labels de Formulário
```jsx
<label className="block text-xs text-gray-500 mb-1">Nome do Campo</label>
```

### Texto em Tabelas
```jsx
{/* Cabeçalho */}
<th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Coluna</th>

{/* Célula normal */}
<td className="px-3 py-2 text-sm text-gray-700">Conteúdo</td>

{/* Célula com destaque */}
<td className="px-3 py-2 text-sm font-medium text-gray-800">Valor</td>

{/* Célula secundária */}
<td className="px-3 py-2 text-xs text-gray-400 font-mono">Código</td>
```

### Badge/Tag
```jsx
<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
  Online
</span>
```

---

## 📁 Padrões de Menu/Sidebar

### Estrutura Hierárquica
```
Módulo > Categoria > Item
```
- Usar chevrons para expand/collapse
- Indentação com `ml-3` para hierarquia visual
- **SEM emojis** nos itens do menu

### Exemplo de Item de Menu
```jsx
<button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
  <span className="text-gray-400">{Icons.cart}</span>
  <span>Vendas</span>
  {hasChildren && Icons.chevronDown}
</button>

{/* Item com indentação */}
<button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 ml-3">
  <span>Orçamentos</span>
</button>
```

---

## 🎯 Estilos de Foco

### Input com Foco Vermelho
```css
input:focus, textarea:focus {
  outline: none !important;
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
}
```

### Select Dropdown com Foco
```jsx
className={`... ${isOpen ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
```

---

## 📋 Tabelas

### Estrutura Padrão
```jsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
          Coluna
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      <tr className="hover:bg-gray-50">
        <td className="px-3 py-2 text-sm text-gray-700">
          Conteúdo
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🔄 Transições e Animações

### Transições Padrão
```jsx
className="transition-colors"    // Mudança de cor
className="transition-shadow"    // Mudança de sombra
className="transition-opacity"   // Fade in/out
className="transition-all"       // Todas as propriedades
```

### Hover com Opacidade
```jsx
className="opacity-0 group-hover:opacity-100 transition-opacity"
```

---

## 📱 Responsividade

### Breakpoints Usados
- `sm:` - 640px (tablets pequenos)
- `md:` - 768px (tablets)
- `lg:` - 1024px (desktop)
- `xl:` - 1280px (desktop grande)

### Padrão de Esconder/Mostrar
```jsx
<span className="hidden sm:inline">Texto completo</span>
<span className="sm:hidden">Curto</span>
```

---

## 🎭 Avatares

### Avatar com Iniciais
```jsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-medium">
  {nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
</div>
```

### Avatar com Posição/Ranking
```jsx
<div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
  posicao === 1 ? 'bg-red-500' : 
  posicao === 2 ? 'bg-red-400' : 
  posicao === 3 ? 'bg-red-300' : 'bg-gray-300'
}`}>
  {iniciais}
</div>
```

---

## ✅ Checklist de Implementação

Ao criar novos componentes, verificar:

- [ ] Cores seguem a paleta definida (vermelho primário)
- [ ] Ícones usam o padrão SVG com `stroke="currentColor"`
- [ ] Inputs têm o estilo de foco vermelho
- [ ] Bordas usam `border-gray-200` (padrão) ou `border-gray-100` (suave)
- [ ] Rounded usa `rounded-lg` (padrão) ou `rounded-xl` (cards)
- [ ] Sombras usam `shadow-sm` (padrão) com `hover:shadow-md`
- [ ] Transições estão aplicadas (`transition-colors`, etc)
- [ ] Texto segue a hierarquia de cores (gray-800 para títulos, gray-600 para normal, gray-500 para secundário)
- [ ] Z-index adequado para modals/dropdowns (z-50, z-40, etc)

---

**Documento mantido por:** Claude AI / DEV.com  
**Repositórios:**
- https://github.com/Ropetr/TrailSystem-ERP
- https://github.com/Ropetr/TrailSystem-Site
