// =============================================
// PLANAC ERP - Scheduled Jobs v2
// Cron triggers para tarefas automáticas
// Inclui: Certificados, IBPT, Relatórios
// =============================================

import type { Env, ScheduledEvent, ExecutionContext } from '../types/env';
import { atualizarStatusCertificados } from '../services/empresas/certificado-service';
import { enviarNotificacoesCertificados } from '../services/notificacoes/certificado-notificacoes';
import { jobAtualizarTabelaIBPT, verificarNecessidadeAtualizacao } from '../services/ibpt/ibpt-auto-update-job';

/**
 * Handler principal para scheduled events (cron)
 */
export async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.log(`[CRON] Executando job: ${event.cron} às ${new Date(event.scheduledTime).toISOString()}`);

  try {
    switch (event.cron) {
      // Job diário às 06:00 UTC - Atualizar status dos certificados
      case '0 6 * * *':
        await jobAtualizarCertificados(env, ctx);
        break;

      // Job diário às 07:00 UTC - Atualizar tabela IBPT
      case '0 7 * * *':
        await jobAtualizarIBPT(env, ctx);
        break;

      // Job semanal às 08:00 UTC (segundas) - Relatório semanal
      case '0 8 * * 1':
        await jobRelatorioSemanal(env, ctx);
        break;

      // Job mensal às 09:00 UTC (dia 1) - Limpeza de dados antigos
      case '0 9 1 * *':
        await jobLimpezaMensal(env, ctx);
        break;

      default:
        console.warn(`[CRON] Job não reconhecido: ${event.cron}`);
    }
  } catch (error) {
    console.error(`[CRON] Erro no job ${event.cron}:`, error);
  }
}

// ===== JOB: CERTIFICADOS =====

async function jobAtualizarCertificados(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[JOB] Iniciando atualização de certificados...');

  // 1. Atualizar status no banco
  const resultado = await atualizarStatusCertificados(env.DB);
  console.log(`[JOB] Certificados: ${resultado.atualizados} atualizados, ${resultado.expirados} expirados`);

  // 2. Buscar certificados para notificar
  const certificadosParaNotificar = await env.DB
    .prepare(`
      SELECT 
        ec.id, ec.cnpj, ec.razao_social_certificado,
        ec.validade_fim, ec.dias_para_vencer, ec.tenant_id,
        emp.razao_social, emp.email_notificacao, emp.telefone_notificacao
      FROM empresas_certificados ec
      LEFT JOIN empresas emp ON ec.cnpj = emp.cnpj
      WHERE ec.status = 'ativo'
        AND ec.principal = 1
        AND ec.dias_para_vencer IN (30, 15, 7, 3, 1)
    `)
    .all<any>();

  // 3. Enviar notificações
  if (certificadosParaNotificar.results?.length) {
    ctx.waitUntil(
      enviarNotificacoesCertificados(env, certificadosParaNotificar.results)
    );
    console.log(`[JOB] ${certificadosParaNotificar.results.length} notificações de certificado agendadas`);
  }

  // 4. Registrar execução
  await env.DB
    .prepare(`
      INSERT INTO jobs_execucoes (job_name, executed_at, status, resultado)
      VALUES ('atualizar_certificados', datetime('now'), 'sucesso', ?)
    `)
    .bind(JSON.stringify(resultado))
    .run();

  console.log('[JOB] Atualização de certificados concluída');
}

// ===== JOB: IBPT =====

async function jobAtualizarIBPT(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[JOB] Verificando necessidade de atualização IBPT...');

  // 1. Verificar se precisa atualizar
  const status = await verificarNecessidadeAtualizacao(env);
  
  console.log(`[JOB] IBPT Status: ${status.motivo}`);
  console.log(`[JOB] - Expirando: ${status.registros_expirando}, Expirados: ${status.registros_expirados}`);

  if (!status.necessita_atualizacao) {
    console.log('[JOB] IBPT: Nenhuma atualização necessária');
    
    await env.DB
      .prepare(`
        INSERT INTO jobs_execucoes (job_name, executed_at, status, resultado)
        VALUES ('atualizar_ibpt', datetime('now'), 'sucesso', ?)
      `)
      .bind(JSON.stringify({ acao: 'nenhuma', motivo: status.motivo }))
      .run();
    
    return;
  }

  // 2. Executar atualização (já envia notificações internamente)
  console.log('[JOB] Iniciando atualização da tabela IBPT...');
  
  const resultado = await jobAtualizarTabelaIBPT(env);
  
  console.log(`[JOB] IBPT: ${resultado.registros_atualizados} atualizados, ${resultado.registros_erro} erros`);
  
  if (resultado.versao_nova && resultado.versao_anterior !== resultado.versao_nova) {
    console.log(`[JOB] IBPT: Nova versão ${resultado.versao_nova} (anterior: ${resultado.versao_anterior})`);
  }

  console.log('[JOB] Atualização IBPT concluída');
}

// ===== JOB: RELATÓRIO SEMANAL =====

async function jobRelatorioSemanal(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[JOB] Gerando relatório semanal...');

  // 1. Estatísticas de certificados
  const certStats = await env.DB
    .prepare(`
      SELECT 
        status,
        COUNT(*) as total,
        COUNT(DISTINCT tenant_id) as tenants
      FROM empresas_certificados
      GROUP BY status
    `)
    .all<{ status: string; total: number; tenants: number }>();

  // 2. Estatísticas IBPT
  const ibptStats = await env.DB_IBPT
    .prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN vigencia_fim >= date('now') THEN 1 ELSE 0 END) as validos,
        SUM(CASE WHEN vigencia_fim < date('now') THEN 1 ELSE 0 END) as expirados,
        MAX(atualizado_em) as ultima_atualizacao
      FROM ibpt_cache
    `)
    .first<any>();

  // 3. Certificados vencendo
  const certVencendo = await env.DB
    .prepare(`
      SELECT COUNT(*) as total
      FROM empresas_certificados
      WHERE status = 'ativo' AND dias_para_vencer <= 30 AND dias_para_vencer > 0
    `)
    .first<{ total: number }>();

  const relatorio = {
    data: new Date().toISOString(),
    certificados: {
      por_status: certStats.results || [],
      vencendo_30_dias: certVencendo?.total || 0,
    },
    ibpt: {
      total_cache: ibptStats?.total || 0,
      registros_validos: ibptStats?.validos || 0,
      registros_expirados: ibptStats?.expirados || 0,
      ultima_atualizacao: ibptStats?.ultima_atualizacao,
    },
  };

  // 4. Registrar execução
  await env.DB
    .prepare(`
      INSERT INTO jobs_execucoes (job_name, executed_at, status, resultado)
      VALUES ('relatorio_semanal', datetime('now'), 'sucesso', ?)
    `)
    .bind(JSON.stringify(relatorio))
    .run();

  // 5. Enviar relatório por email (se configurado)
  if (env.EMAIL_API_KEY) {
    ctx.waitUntil(enviarRelatorioSemanal(env, relatorio));
  }

  console.log('[JOB] Relatório semanal concluído');
}

// ===== JOB: LIMPEZA MENSAL =====

async function jobLimpezaMensal(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[JOB] Iniciando limpeza mensal...');

  // 1. Limpar cache IBPT antigo (mais de 180 dias expirado)
  const ibptRemovidos = await env.DB_IBPT
    .prepare(`
      DELETE FROM ibpt_cache 
      WHERE vigencia_fim < date('now', '-180 days')
    `)
    .run();

  // 2. Limpar logs de jobs antigos (mais de 90 dias)
  const logsRemovidos = await env.DB
    .prepare(`
      DELETE FROM jobs_execucoes 
      WHERE executed_at < datetime('now', '-90 days')
    `)
    .run();

  // 3. Limpar notificações lidas antigas (mais de 60 dias)
  const notifRemovidas = await env.DB
    .prepare(`
      DELETE FROM notificacoes 
      WHERE lida = 1 AND created_at < datetime('now', '-60 days')
    `)
    .run();

  const resultado = {
    ibpt_cache_removidos: ibptRemovidos.meta?.changes || 0,
    logs_jobs_removidos: logsRemovidos.meta?.changes || 0,
    notificacoes_removidas: notifRemovidas.meta?.changes || 0,
  };

  await env.DB
    .prepare(`
      INSERT INTO jobs_execucoes (job_name, executed_at, status, resultado)
      VALUES ('limpeza_mensal', datetime('now'), 'sucesso', ?)
    `)
    .bind(JSON.stringify(resultado))
    .run();

  console.log('[JOB] Limpeza mensal concluída:', resultado);
}

// ===== ENVIO DE RELATÓRIO =====

async function enviarRelatorioSemanal(env: Env, relatorio: any): Promise<void> {
  try {
    const html = `
      <h2>Relatório Semanal - PLANAC ERP</h2>
      <p><strong>Data:</strong> ${new Date(relatorio.data).toLocaleDateString('pt-BR')}</p>
      
      <h3>📜 Certificados Digitais</h3>
      <table border="1" cellpadding="8">
        <tr><th>Status</th><th>Total</th><th>Tenants</th></tr>
        ${relatorio.certificados.por_status.map((c: any) => `
          <tr><td>${c.status}</td><td>${c.total}</td><td>${c.tenants}</td></tr>
        `).join('')}
      </table>
      <p>⚠️ <strong>Vencendo em 30 dias:</strong> ${relatorio.certificados.vencendo_30_dias}</p>
      
      <h3>📊 Tabela IBPT</h3>
      <ul>
        <li><strong>Total no cache:</strong> ${relatorio.ibpt.total_cache}</li>
        <li><strong>Registros válidos:</strong> ${relatorio.ibpt.registros_validos}</li>
        <li><strong>Registros expirados:</strong> ${relatorio.ibpt.registros_expirados}</li>
        <li><strong>Última atualização:</strong> ${relatorio.ibpt.ultima_atualizacao || 'N/A'}</li>
      </ul>
      
      <p><em>Este é um email automático do PLANAC ERP.</em></p>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'PLANAC ERP <noreply@planac.com.br>',
        to: ['admin@planac.com.br'],
        subject: `[PLANAC ERP] Relatório Semanal - ${new Date().toLocaleDateString('pt-BR')}`,
        html,
      }),
    });
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar relatório semanal:', error);
  }
}

export { jobAtualizarCertificados, jobAtualizarIBPT, jobRelatorioSemanal, jobLimpezaMensal };
