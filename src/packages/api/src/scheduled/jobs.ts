// =============================================
// PLANAC ERP - Scheduled Jobs
// Cron triggers para tarefas automáticas
// =============================================

import type { Env, ScheduledEvent, ExecutionContext } from './types/env';
import { atualizarStatusCertificados } from './services/empresas/certificado-service';
import { enviarNotificacoesCertificados } from './services/notificacoes/certificado-notificacoes';

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

      // Job semanal às 07:00 UTC (segundas) - Relatório semanal
      case '0 7 * * 1':
        await jobRelatorioSemanal(env, ctx);
        break;

      default:
        console.warn(`[CRON] Job não reconhecido: ${event.cron}`);
    }
  } catch (error) {
    console.error(`[CRON] Erro no job ${event.cron}:`, error);
    // Em produção, enviar alerta para monitoramento
  }
}

// ===== JOBS =====

/**
 * Job: Atualizar status dos certificados digitais
 * - Recalcula dias_para_vencer
 * - Marca certificados expirados
 * - Envia notificações de vencimento
 */
async function jobAtualizarCertificados(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[JOB] Iniciando atualização de certificados...');

  // 1. Atualizar status no banco
  const resultado = await atualizarStatusCertificados(env.DB);
  console.log(`[JOB] Certificados atualizados: ${resultado.atualizados}, expirados: ${resultado.expirados}`);

  // 2. Buscar certificados que precisam de notificação
  const certificadosParaNotificar = await env.DB
    .prepare(`
      SELECT 
        ec.id,
        ec.cnpj,
        ec.razao_social_certificado,
        ec.validade_fim,
        ec.dias_para_vencer,
        ec.tenant_id,
        emp.razao_social,
        emp.email_notificacao,
        emp.telefone_notificacao
      FROM empresas_certificados ec
      LEFT JOIN empresas emp ON ec.cnpj = emp.cnpj
      WHERE ec.status = 'ativo'
        AND ec.principal = 1
        AND ec.dias_para_vencer IN (30, 15, 7, 3, 1)
    `)
    .all<{
      id: number;
      cnpj: string;
      razao_social_certificado: string;
      validade_fim: string;
      dias_para_vencer: number;
      tenant_id: string;
      razao_social: string;
      email_notificacao: string;
      telefone_notificacao: string;
    }>();

  // 3. Enviar notificações (waitUntil para não bloquear)
  if (certificadosParaNotificar.results && certificadosParaNotificar.results.length > 0) {
    ctx.waitUntil(
      enviarNotificacoesCertificados(env, certificadosParaNotificar.results)
    );
    console.log(`[JOB] ${certificadosParaNotificar.results.length} notificações agendadas`);
  }

  // 4. Registrar execução do job
  await env.DB
    .prepare(`
      INSERT INTO jobs_execucoes (job_name, executed_at, status, resultado)
      VALUES ('atualizar_certificados', datetime('now'), 'sucesso', ?)
    `)
    .bind(JSON.stringify(resultado))
    .run();

  console.log('[JOB] Atualização de certificados concluída');
}

/**
 * Job: Relatório semanal
 * - Resumo de certificados por status
 * - Alertas pendentes
 * - Métricas de uso
 */
async function jobRelatorioSemanal(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[JOB] Gerando relatório semanal...');

  // 1. Estatísticas de certificados
  const estatisticas = await env.DB
    .prepare(`
      SELECT 
        status,
        COUNT(*) as total,
        COUNT(DISTINCT tenant_id) as tenants
      FROM empresas_certificados
      GROUP BY status
    `)
    .all<{ status: string; total: number; tenants: number }>();

  // 2. Certificados vencendo nos próximos 30 dias
  const vencendo = await env.DB
    .prepare(`
      SELECT COUNT(*) as total
      FROM empresas_certificados
      WHERE status = 'ativo' AND dias_para_vencer <= 30 AND dias_para_vencer > 0
    `)
    .first<{ total: number }>();

  // 3. Empresas sem certificado configurado
  const semCertificado = await env.DB
    .prepare(`
      SELECT COUNT(*) as total
      FROM empresas_config ec
      WHERE NOT EXISTS (
        SELECT 1 FROM empresas_certificados cert 
        WHERE cert.cnpj = ec.cnpj AND cert.status = 'ativo'
      )
    `)
    .first<{ total: number }>();

  const relatorio = {
    data: new Date().toISOString(),
    certificados: estatisticas.results || [],
    vencendo_30_dias: vencendo?.total || 0,
    empresas_sem_certificado: semCertificado?.total || 0,
  };

  // 4. Enviar relatório por email para admins
  if (env.EMAIL_API_KEY) {
    ctx.waitUntil(
      enviarRelatorioAdmin(env, relatorio)
    );
  }

  // 5. Registrar execução
  await env.DB
    .prepare(`
      INSERT INTO jobs_execucoes (job_name, executed_at, status, resultado)
      VALUES ('relatorio_semanal', datetime('now'), 'sucesso', ?)
    `)
    .bind(JSON.stringify(relatorio))
    .run();

  console.log('[JOB] Relatório semanal concluído');
}

/**
 * Envia relatório para administradores
 */
async function enviarRelatorioAdmin(env: Env, relatorio: any): Promise<void> {
  // Implementação depende do provedor de email
  // Exemplo com Resend:
  if (!env.EMAIL_API_KEY) return;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'noreply@planac.com.br',
        to: ['admin@planac.com.br'], // Configurar lista de admins
        subject: `[PLANAC ERP] Relatório Semanal - ${new Date().toLocaleDateString('pt-BR')}`,
        html: gerarHtmlRelatorio(relatorio),
      }),
    });

    if (!response.ok) {
      console.error('[EMAIL] Erro ao enviar relatório:', await response.text());
    }
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar relatório:', error);
  }
}

function gerarHtmlRelatorio(relatorio: any): string {
  return `
    <h2>Relatório Semanal - PLANAC ERP</h2>
    <p><strong>Data:</strong> ${new Date(relatorio.data).toLocaleDateString('pt-BR')}</p>
    
    <h3>Certificados Digitais</h3>
    <table border="1" cellpadding="8">
      <tr><th>Status</th><th>Total</th><th>Tenants</th></tr>
      ${relatorio.certificados.map((c: any) => `
        <tr><td>${c.status}</td><td>${c.total}</td><td>${c.tenants}</td></tr>
      `).join('')}
    </table>
    
    <h3>Alertas</h3>
    <ul>
      <li><strong>Certificados vencendo em 30 dias:</strong> ${relatorio.vencendo_30_dias}</li>
      <li><strong>Empresas sem certificado:</strong> ${relatorio.empresas_sem_certificado}</li>
    </ul>
    
    <p><em>Este é um email automático do PLANAC ERP.</em></p>
  `;
}

export { jobAtualizarCertificados, jobRelatorioSemanal };
