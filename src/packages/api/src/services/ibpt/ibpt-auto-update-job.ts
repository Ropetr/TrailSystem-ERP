// =============================================
// PLANAC ERP - IBPT Auto Update Job
// Atualização automática + Notificações
// =============================================

import type { Env } from '../../types/env';
import { createIBPTApiService } from '../ibpt/ibpt-api-service';

// ===== TIPOS =====

interface AtualizacaoResultado {
  sucesso: boolean;
  data_execucao: string;
  registros_atualizados: number;
  registros_erro: number;
  versao_anterior: string | null;
  versao_nova: string | null;
  tempo_ms: number;
  detalhes: string[];
}

interface NotificacaoAdmin {
  tipo: 'ibpt_atualizado' | 'ibpt_erro';
  titulo: string;
  mensagem: string;
  dados: Record<string, any>;
}

// ===== JOB PRINCIPAL =====

/**
 * Job de atualização automática da tabela IBPT
 * - Verifica registros próximos de expirar
 * - Atualiza via API
 * - Notifica administrador por email/WhatsApp
 */
export async function jobAtualizarTabelaIBPT(env: Env): Promise<AtualizacaoResultado> {
  const inicio = Date.now();
  const detalhes: string[] = [];
  let versaoAnterior: string | null = null;
  let versaoNova: string | null = null;

  try {
    // 1. Buscar configuração IBPT (token da empresa principal ou padrão)
    const config = await buscarConfigIBPT(env);
    
    if (!config) {
      throw new Error('Token IBPT não configurado');
    }

    detalhes.push(`Usando token da empresa: ${config.cnpj}`);

    // 2. Verificar versão atual
    const estatisticasAntes = await env.DB_IBPT
      .prepare('SELECT versao, COUNT(*) as total FROM ibpt_cache GROUP BY versao ORDER BY total DESC LIMIT 1')
      .first<{ versao: string; total: number }>();
    
    versaoAnterior = estatisticasAntes?.versao || null;
    detalhes.push(`Versão atual no cache: ${versaoAnterior || 'nenhuma'}`);

    // 3. Buscar registros que precisam atualização
    const registrosParaAtualizar = await env.DB_IBPT
      .prepare(`
        SELECT DISTINCT codigo, uf, ex, descricao 
        FROM ibpt_cache 
        WHERE vigencia_fim <= date('now', '+7 days')
           OR vigencia_fim < date('now')
        ORDER BY vigencia_fim ASC
        LIMIT 500
      `)
      .all<{ codigo: string; uf: string; ex: number; descricao: string }>();

    const total = registrosParaAtualizar.results?.length || 0;
    detalhes.push(`Registros para atualizar: ${total}`);

    if (total === 0) {
      detalhes.push('Nenhum registro precisa de atualização');
      
      return {
        sucesso: true,
        data_execucao: new Date().toISOString(),
        registros_atualizados: 0,
        registros_erro: 0,
        versao_anterior: versaoAnterior,
        versao_nova: versaoAnterior,
        tempo_ms: Date.now() - inicio,
        detalhes,
      };
    }

    // 4. Criar serviço IBPT
    const ibptService = createIBPTApiService(env.DB_IBPT, {
      token: config.token,
      cnpj: config.cnpj,
      uf: config.uf,
    });

    // 5. Atualizar registros
    const resultado = await ibptService.atualizarRegistrosExpirados();
    
    detalhes.push(`Atualizados: ${resultado.atualizados}, Erros: ${resultado.erros}`);

    // 6. Verificar nova versão
    const estatisticasDepois = await env.DB_IBPT
      .prepare('SELECT versao FROM ibpt_cache ORDER BY atualizado_em DESC LIMIT 1')
      .first<{ versao: string }>();
    
    versaoNova = estatisticasDepois?.versao || versaoAnterior;

    // 7. Registrar execução
    await env.DB
      .prepare(`
        INSERT INTO jobs_execucoes (job_name, executed_at, status, resultado)
        VALUES ('atualizar_ibpt', datetime('now'), 'sucesso', ?)
      `)
      .bind(JSON.stringify({
        atualizados: resultado.atualizados,
        erros: resultado.erros,
        versao_anterior: versaoAnterior,
        versao_nova: versaoNova,
      }))
      .run();

    // 8. Notificar administrador
    const notificacao: NotificacaoAdmin = {
      tipo: 'ibpt_atualizado',
      titulo: '✅ Tabela IBPT Atualizada',
      mensagem: gerarMensagemSucesso(resultado.atualizados, resultado.erros, versaoAnterior, versaoNova),
      dados: {
        atualizados: resultado.atualizados,
        erros: resultado.erros,
        versao_anterior: versaoAnterior,
        versao_nova: versaoNova,
      },
    };

    await notificarAdmin(env, notificacao);

    return {
      sucesso: true,
      data_execucao: new Date().toISOString(),
      registros_atualizados: resultado.atualizados,
      registros_erro: resultado.erros,
      versao_anterior: versaoAnterior,
      versao_nova: versaoNova,
      tempo_ms: Date.now() - inicio,
      detalhes,
    };

  } catch (error: any) {
    detalhes.push(`ERRO: ${error.message}`);

    // Registrar erro
    await env.DB
      .prepare(`
        INSERT INTO jobs_execucoes (job_name, executed_at, status, resultado, erro)
        VALUES ('atualizar_ibpt', datetime('now'), 'erro', ?, ?)
      `)
      .bind(JSON.stringify({ detalhes }), error.message)
      .run();

    // Notificar admin sobre erro
    await notificarAdmin(env, {
      tipo: 'ibpt_erro',
      titulo: '❌ Erro na Atualização IBPT',
      mensagem: `Falha ao atualizar tabela IBPT: ${error.message}`,
      dados: { erro: error.message, detalhes },
    });

    return {
      sucesso: false,
      data_execucao: new Date().toISOString(),
      registros_atualizados: 0,
      registros_erro: 0,
      versao_anterior: versaoAnterior,
      versao_nova: null,
      tempo_ms: Date.now() - inicio,
      detalhes,
    };
  }
}

// ===== BUSCAR CONFIGURAÇÃO =====

async function buscarConfigIBPT(env: Env): Promise<{ token: string; cnpj: string; uf: string } | null> {
  // Primeiro tenta variável de ambiente
  if (env.IBPT_TOKEN) {
    // Buscar CNPJ da empresa principal
    const empresa = await env.DB
      .prepare('SELECT cnpj, ibpt_uf FROM empresas_config WHERE ativo = 1 LIMIT 1')
      .first<{ cnpj: string; ibpt_uf: string }>();

    if (empresa) {
      return {
        token: env.IBPT_TOKEN,
        cnpj: empresa.cnpj,
        uf: empresa.ibpt_uf || 'PR',
      };
    }
  }

  // Senão, busca do cadastro de empresas
  const empresaComToken = await env.DB
    .prepare(`
      SELECT cnpj, ibpt_token, ibpt_uf 
      FROM empresas_config 
      WHERE ibpt_token IS NOT NULL AND ibpt_token != '' AND ativo = 1
      LIMIT 1
    `)
    .first<{ cnpj: string; ibpt_token: string; ibpt_uf: string }>();

  if (empresaComToken) {
    return {
      token: empresaComToken.ibpt_token,
      cnpj: empresaComToken.cnpj,
      uf: empresaComToken.ibpt_uf || 'PR',
    };
  }

  return null;
}

// ===== NOTIFICAÇÕES =====

async function notificarAdmin(env: Env, notificacao: NotificacaoAdmin): Promise<void> {
  // 1. Criar notificação no sistema
  await env.DB
    .prepare(`
      INSERT INTO notificacoes (
        tipo, titulo, mensagem, prioridade,
        dados_json, lida, created_at
      ) VALUES (?, ?, ?, 'media', ?, 0, datetime('now'))
    `)
    .bind(
      notificacao.tipo,
      notificacao.titulo,
      notificacao.mensagem,
      JSON.stringify(notificacao.dados)
    )
    .run();

  // 2. Buscar admins para notificar
  const admins = await env.DB
    .prepare(`
      SELECT email, telefone_whatsapp 
      FROM usuarios 
      WHERE is_admin = 1 AND ativo = 1
    `)
    .all<{ email: string; telefone_whatsapp: string }>();

  // 3. Enviar email
  if (env.EMAIL_API_KEY && admins.results) {
    for (const admin of admins.results) {
      if (admin.email) {
        await enviarEmailNotificacao(env, admin.email, notificacao);
      }
    }
  }

  // 4. Enviar WhatsApp (via API Brasil ou similar)
  if (env.WHATSAPP_API_KEY && admins.results) {
    for (const admin of admins.results) {
      if (admin.telefone_whatsapp) {
        await enviarWhatsAppNotificacao(env, admin.telefone_whatsapp, notificacao);
      }
    }
  }
}

async function enviarEmailNotificacao(
  env: Env,
  email: string,
  notificacao: NotificacaoAdmin
): Promise<void> {
  try {
    const isErro = notificacao.tipo === 'ibpt_erro';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${isErro ? '#dc3545' : '#28a745'}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${notificacao.titulo}</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <p>${notificacao.mensagem}</p>
          
          ${!isErro ? `
          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #666; padding: 5px 0;">Registros atualizados:</td>
                <td style="font-weight: bold;">${notificacao.dados.atualizados || 0}</td>
              </tr>
              <tr>
                <td style="color: #666; padding: 5px 0;">Erros:</td>
                <td style="font-weight: bold; color: ${notificacao.dados.erros > 0 ? '#dc3545' : '#28a745'};">${notificacao.dados.erros || 0}</td>
              </tr>
              <tr>
                <td style="color: #666; padding: 5px 0;">Versão anterior:</td>
                <td>${notificacao.dados.versao_anterior || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color: #666; padding: 5px 0;">Versão nova:</td>
                <td style="font-weight: bold; color: #28a745;">${notificacao.dados.versao_nova || 'N/A'}</td>
              </tr>
            </table>
          </div>
          ` : ''}
          
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
            Este é um email automático do PLANAC ERP.<br>
            Data: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'PLANAC ERP <noreply@planac.com.br>',
        to: [email],
        subject: `[PLANAC ERP] ${notificacao.titulo}`,
        html,
      }),
    });
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar notificação IBPT:', error);
  }
}

async function enviarWhatsAppNotificacao(
  env: Env,
  telefone: string,
  notificacao: NotificacaoAdmin
): Promise<void> {
  try {
    // Formatar telefone (remover caracteres especiais, adicionar código país)
    let telefoneLimpo = telefone.replace(/\D/g, '');
    if (!telefoneLimpo.startsWith('55')) {
      telefoneLimpo = '55' + telefoneLimpo;
    }

    // Montar mensagem
    const isErro = notificacao.tipo === 'ibpt_erro';
    let mensagem = `*${notificacao.titulo}*\n\n${notificacao.mensagem}`;
    
    if (!isErro && notificacao.dados) {
      mensagem += `\n\n📊 *Detalhes:*`;
      mensagem += `\n• Atualizados: ${notificacao.dados.atualizados || 0}`;
      mensagem += `\n• Erros: ${notificacao.dados.erros || 0}`;
      if (notificacao.dados.versao_nova) {
        mensagem += `\n• Versão: ${notificacao.dados.versao_nova}`;
      }
    }
    
    mensagem += `\n\n_PLANAC ERP - ${new Date().toLocaleString('pt-BR')}_`;

    // Enviar via API Brasil (ou outro provedor)
    // Nota: Ajustar endpoint conforme provedor usado
    const response = await fetch('https://gateway.apibrasil.io/api/v2/whatsapp/sendText', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: telefoneLimpo,
        text: mensagem,
      }),
    });

    if (!response.ok) {
      console.error('[WHATSAPP] Erro ao enviar:', await response.text());
    }
  } catch (error) {
    console.error('[WHATSAPP] Erro ao enviar notificação IBPT:', error);
  }
}

// ===== HELPERS =====

function gerarMensagemSucesso(
  atualizados: number,
  erros: number,
  versaoAnterior: string | null,
  versaoNova: string | null
): string {
  let msg = `A tabela IBPT foi atualizada automaticamente.\n\n`;
  msg += `📊 Resumo:\n`;
  msg += `• ${atualizados} registros atualizados\n`;
  
  if (erros > 0) {
    msg += `• ${erros} registros com erro\n`;
  }
  
  if (versaoAnterior && versaoNova && versaoAnterior !== versaoNova) {
    msg += `\n🔄 Atualização de versão:\n`;
    msg += `• Anterior: ${versaoAnterior}\n`;
    msg += `• Nova: ${versaoNova}\n`;
  }
  
  msg += `\nOs cálculos de tributos da Lei da Transparência Fiscal estão atualizados.`;
  
  return msg;
}

// ===== VERIFICAÇÃO DE NECESSIDADE =====

/**
 * Verifica se é necessário atualizar a tabela IBPT
 */
export async function verificarNecessidadeAtualizacao(env: Env): Promise<{
  necessita_atualizacao: boolean;
  motivo: string;
  registros_expirando: number;
  registros_expirados: number;
  ultima_atualizacao: string | null;
}> {
  const [expirando, expirados, ultima] = await Promise.all([
    env.DB_IBPT.prepare(`
      SELECT COUNT(*) as count FROM ibpt_cache 
      WHERE vigencia_fim BETWEEN date('now') AND date('now', '+7 days')
    `).first<{ count: number }>(),
    
    env.DB_IBPT.prepare(`
      SELECT COUNT(*) as count FROM ibpt_cache 
      WHERE vigencia_fim < date('now')
    `).first<{ count: number }>(),
    
    env.DB_IBPT.prepare(`
      SELECT MAX(atualizado_em) as data FROM ibpt_cache
    `).first<{ data: string }>(),
  ]);

  const registrosExpirando = expirando?.count || 0;
  const registrosExpirados = expirados?.count || 0;
  const necessitaAtualizacao = registrosExpirando > 0 || registrosExpirados > 0;

  let motivo = 'Tabela IBPT está atualizada';
  if (registrosExpirados > 0) {
    motivo = `${registrosExpirados} registros expirados`;
  } else if (registrosExpirando > 0) {
    motivo = `${registrosExpirando} registros expirando em 7 dias`;
  }

  return {
    necessita_atualizacao: necessitaAtualizacao,
    motivo,
    registros_expirando: registrosExpirando,
    registros_expirados: registrosExpirados,
    ultima_atualizacao: ultima?.data || null,
  };
}

export type { AtualizacaoResultado };
