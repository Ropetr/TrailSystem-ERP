// ============================================
// PLANAC ERP - Index de Rotas
// Fase 2 Completa: Blocos 1, 2 e 3
// Total: 58 rotas de API
// ============================================

// ============================================
// BLOCO 1 - Alta Prioridade (7 rotas)
// ============================================
export { default as vendedores } from './vendedores.routes';
export { default as categorias } from './categorias.routes';
export { default as locaisEstoque } from './locais-estoque.routes';
export { default as entregas } from './entregas.routes';
export { default as contasReceber } from './contas-receber.routes';
export { default as contasPagar } from './contas-pagar.routes';
export { default as notasFiscais } from './notas-fiscais.routes';

// ============================================
// BLOCO 2 - Média Prioridade (14 rotas)
// ============================================
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
export { default as tarefas } from './tarefas.routes';

// Utilitário de notificações
export { criarNotificacao } from './notificacoes.routes';

// ============================================
// BLOCO 3 - Complementares (23 rotas)
// ============================================

// Logística Avançada
export { default as rotas } from './rotas.routes';
export { default as rastreamento } from './rastreamento.routes';
export { default as ocorrencias } from './ocorrencias.routes';

// Pós-Venda
export { default as garantias } from './garantias.routes';
export { default as consignacoes } from './consignacoes.routes';
export { default as trocas } from './trocas.routes';
export { default as ordensServico } from './ordens-servico.routes';

// RH e Folha
export { default as rh } from './rh.routes';
export { default as folhaPagamento } from './folha-pagamento.routes';

// E-commerce
export { default as ecommerce } from './ecommerce.routes';

// Business Intelligence
export { default as bi } from './bi.routes';

// Contabilidade e Patrimônio
export { default as contabilidade } from './contabilidade.routes';
export { default as patrimonio } from './patrimonio.routes';

// Suporte e Atendimento
export { default as tickets } from './tickets.routes';

// Agenda e Calendário
export { default as agenda } from './agenda.routes';

// Automação
export { default as workflows } from './workflows.routes';

// Contratos
export { default as contratos } from './contratos.routes';

// Importação/Exportação
export { default as importExport } from './import-export.routes';

// Comissões
export { default as comissoes } from './comissoes.routes';

// Arquivos e Anexos
export { default as arquivos } from './arquivos.routes';

// Auditoria
export { default as auditoria } from './auditoria.routes';

// Configurações do Sistema
export { default as configuracoesSistema } from './configuracoes-sistema.routes';

// PDV
export { default as pdv } from './pdv.routes';

// Sistema de Tags
export { default as tags } from './tags.routes';

// ============================================
// INTEGRAÇÕES BANCÁRIAS
// ============================================

// Sisprime (Banco 084)
export { default as sisprime } from './sisprime.routes';

// ============================================
// FISCAL - ADRC-ST (Parana)
// ============================================
export { default as adrcst } from './adrcst.routes';

// ============================================
// RESUMO
// ============================================
// Bloco 1: 7 rotas  (Alta Prioridade)
// Bloco 2: 14 rotas (Média Prioridade)  
// Bloco 3: 23 rotas (Complementares)
// ---------------------------------
// TOTAL:   44 rotas novas
// + 14 rotas existentes (auth, usuarios, etc)
// = 58 rotas de API
// ============================================
