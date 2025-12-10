// =============================================
// 🏢 PLANAC ERP - Exportação de Rotas
// v2.0 - Fase 2 API
// =============================================

// === CORE / AUTENTICAÇÃO ===
export { default as authRoutes } from './auth.routes';
export { default as usuariosRoutes } from './usuarios.routes';
export { default as perfisRoutes } from './perfis.routes';

// === ESTRUTURA EMPRESA ===
export { default as empresasRoutes } from './empresas.routes';
export { default as filiaisRoutes } from './filiais.routes';
export { default as configuracoesRoutes } from './configuracoes.routes';

// === CADASTROS BÁSICOS ===
export { default as clientesRoutes } from './clientes.routes';
export { default as fornecedoresRoutes } from './fornecedores.routes';
export { default as transportadorasRoutes } from './transportadoras.routes';
export { default as vendedoresRoutes } from './vendedores.routes';

// === PRODUTOS E CATEGORIAS ===
export { default as produtosRoutes } from './produtos.routes';
export { default as categoriasRoutes } from './categorias.routes';

// === ESTOQUE ===
export { default as estoqueRoutes } from './estoque.routes';
export { default as locaisEstoqueRoutes } from './locais-estoque.routes';

// === COMERCIAL ===
export { default as orcamentosRoutes } from './orcamentos.routes';
export { default as pedidosRoutes } from './pedidos.routes';
export { default as tabelasPrecoRoutes } from './tabelas-preco.routes';
export { default as condicoesPagamentoRoutes } from './condicoes-pagamento.routes';

// === LOGÍSTICA ===
export { default as entregasRoutes } from './entregas.routes';

// === FINANCEIRO ===
export { default as contasReceberRoutes } from './contas-receber.routes';
export { default as contasPagarRoutes } from './contas-pagar.routes';

// === FISCAL ===
export { default as notasFiscaisRoutes } from './notas-fiscais.routes';
