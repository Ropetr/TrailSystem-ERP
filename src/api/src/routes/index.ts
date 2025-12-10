// ============================================
// PLANAC ERP - Index de Rotas (Bloco 1 + Bloco 2)
// ============================================

// BLOCO 1 - Alta Prioridade (7 rotas)
export { default as vendedores } from './vendedores.routes';
export { default as categorias } from './categorias.routes';
export { default as locaisEstoque } from './locais-estoque.routes';
export { default as entregas } from './entregas.routes';
export { default as contasReceber } from './contas-receber.routes';
export { default as contasPagar } from './contas-pagar.routes';
export { default as notasFiscais } from './notas-fiscais.routes';

// BLOCO 2 - Média Prioridade (13 rotas)
export { default as marcas } from './marcas.routes';
export { default as unidades } from './unidades.routes';
export { default as inventarios } from './inventarios.routes';
export { default as transferencias } from './transferencias.routes';
export { default as motoristas } from './motoristas.routes';
export { default as veiculos } from './veiculos.routes';
export { default as compras } from './compras.routes';
export { default as bancos } from './bancos.routes';
export { default as caixas } from './caixas.routes';
export { default as devolucoes } from './devolucoes.routes';
export { default as crm } from './crm.routes';
export { default as notificacoes } from './notificacoes.routes';

// Utilitário de notificações
export { criarNotificacao } from './notificacoes.routes';
