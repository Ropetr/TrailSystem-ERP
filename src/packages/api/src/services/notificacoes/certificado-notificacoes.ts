// =============================================
// PLANAC ERP - Notificações de Certificados
// Email e Push Notifications
// =============================================

import type { Env } from '../../types/env';

// ===== TIPOS =====

export interface CertificadoParaNotificar {
  id: number;
  cnpj: string;
  razao_social_certificado: string;
  validade_fim: string;
  dias_para_vencer: number;
  tenant_id: string;
  razao_social?: string;
  email_notificacao?: string;
  telefone_notificacao?: string;
}

export interface NotificacaoEnviada {
  certificado_id: number;
  tipo: 'email' | 'push' | 'sms' | 'sistema';
  destinatario: string;
  sucesso: boolean;
  erro?: string;
}

// ===== TEMPLATES =====

const TEMPLATES = {
  email: {
    assunto: (dias: number) => {
      if (dias <= 1) return '🚨 URGENTE: Certificado Digital vence AMANHÃ!';
      if (dias <= 7) return `⚠️ ALERTA: Certificado Digital vence em ${dias} dias`;
      if (dias <= 15) return `📢 AVISO: Certificado Digital vence em ${dias} dias`;
      return `📋 Lembrete: Certificado Digital vence em ${dias} dias`;
    },
    
    corpo: (dados: CertificadoParaNotificar) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${dados.dias_para_vencer <= 7 ? '#dc3545' : dados.dias_para_vencer <= 15 ? '#ffc107' : '#17a2b8'}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">⚠️ Alerta de Vencimento</h1>
          <p style="margin: 10px 0 0;">Certificado Digital A1</p>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Olá!</h2>
          
          <p>O certificado digital da empresa abaixo está ${dados.dias_para_vencer <= 1 ? '<strong>vencendo amanhã</strong>' : `próximo do vencimento (<strong>${dados.dias_para_vencer} dias</strong>)`}:</p>
          
          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #666; padding: 5px 0;">Empresa:</td>
                <td style="font-weight: bold;">${dados.razao_social || dados.razao_social_certificado}</td>
              </tr>
              <tr>
                <td style="color: #666; padding: 5px 0;">CNPJ:</td>
                <td style="font-weight: bold;">${formatarCnpj(dados.cnpj)}</td>
              </tr>
              <tr>
                <td style="color: #666; padding: 5px 0;">Validade:</td>
                <td style="font-weight: bold; color: ${dados.dias_para_vencer <= 7 ? '#dc3545' : '#333'};">
                  ${formatarData(dados.validade_fim)}
                </td>
              </tr>
              <tr>
                <td style="color: #666; padding: 5px 0;">Dias restantes:</td>
                <td style="font-weight: bold; color: ${dados.dias_para_vencer <= 7 ? '#dc3545' : '#333'};">
                  ${dados.dias_para_vencer} ${dados.dias_para_vencer === 1 ? 'dia' : 'dias'}
                </td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <strong>⚡ Ação necessária:</strong>
            <p style="margin: 10px 0 0;">Para continuar emitindo NF-e, NFC-e e outros documentos fiscais, é necessário renovar o certificado digital antes do vencimento.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.planac.com.br/certificados" 
               style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Acessar Sistema
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            Este é um email automático do PLANAC ERP.<br>
            Em caso de dúvidas, entre em contato com o suporte.
          </p>
        </div>
      </div>
    `,
  },
  
  push: {
    titulo: (dias: number) => {
      if (dias <= 1) return '🚨 Certificado vence amanhã!';
      if (dias <= 7) return `⚠️ Certificado vence em ${dias} dias`;
      return `📋 Certificado vence em ${dias} dias`;
    },
    
    corpo: (dados: CertificadoParaNotificar) => 
      `${dados.razao_social || dados.razao_social_certificado} - Renove o certificado digital para continuar emitindo notas fiscais.`,
  },
  
  sistema: {
    titulo: (dias: number) => `Certificado digital vence em ${dias} dias`,
    mensagem: (dados: CertificadoParaNotificar) => 
      `O certificado digital da empresa ${dados.razao_social || dados.razao_social_certificado} (${formatarCnpj(dados.cnpj)}) vence em ${formatarData(dados.validade_fim)}. Renove para continuar emitindo documentos fiscais.`,
  },
};

// ===== FUNÇÃO PRINCIPAL =====

/**
 * Envia notificações para certificados próximos do vencimento
 */
export async function enviarNotificacoesCertificados(
  env: Env,
  certificados: CertificadoParaNotificar[]
): Promise<NotificacaoEnviada[]> {
  const resultados: NotificacaoEnviada[] = [];

  for (const cert of certificados) {
    // 1. Enviar email (se configurado)
    if (cert.email_notificacao && env.EMAIL_API_KEY) {
      const resultadoEmail = await enviarEmailVencimento(env, cert);
      resultados.push(resultadoEmail);
    }

    // 2. Criar notificação no sistema (sempre)
    const resultadoSistema = await criarNotificacaoSistema(env, cert);
    resultados.push(resultadoSistema);

    // 3. Enviar push notification (se configurado)
    if (env.FIREBASE_SERVER_KEY) {
      const resultadoPush = await enviarPushVencimento(env, cert);
      resultados.push(resultadoPush);
    }

    // 4. Registrar envio para evitar duplicatas
    await registrarNotificacaoEnviada(env, cert.id, cert.dias_para_vencer);
  }

  return resultados;
}

// ===== EMAIL =====

async function enviarEmailVencimento(
  env: Env,
  cert: CertificadoParaNotificar
): Promise<NotificacaoEnviada> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'PLANAC ERP <noreply@planac.com.br>',
        to: [cert.email_notificacao],
        subject: TEMPLATES.email.assunto(cert.dias_para_vencer),
        html: TEMPLATES.email.corpo(cert),
      }),
    });

    if (!response.ok) {
      const erro = await response.text();
      return {
        certificado_id: cert.id,
        tipo: 'email',
        destinatario: cert.email_notificacao!,
        sucesso: false,
        erro,
      };
    }

    return {
      certificado_id: cert.id,
      tipo: 'email',
      destinatario: cert.email_notificacao!,
      sucesso: true,
    };
  } catch (error: any) {
    return {
      certificado_id: cert.id,
      tipo: 'email',
      destinatario: cert.email_notificacao!,
      sucesso: false,
      erro: error.message,
    };
  }
}

// ===== PUSH NOTIFICATION =====

async function enviarPushVencimento(
  env: Env,
  cert: CertificadoParaNotificar
): Promise<NotificacaoEnviada> {
  try {
    // Buscar tokens de push dos usuários da empresa/tenant
    const tokens = await env.DB
      .prepare(`
        SELECT token FROM push_tokens 
        WHERE (cnpj = ? OR tenant_id = ?) AND ativo = 1
      `)
      .bind(cert.cnpj, cert.tenant_id)
      .all<{ token: string }>();

    if (!tokens.results || tokens.results.length === 0) {
      return {
        certificado_id: cert.id,
        tipo: 'push',
        destinatario: cert.cnpj,
        sucesso: false,
        erro: 'Nenhum token de push encontrado',
      };
    }

    // Enviar para Firebase Cloud Messaging
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${env.FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registration_ids: tokens.results.map(t => t.token),
        notification: {
          title: TEMPLATES.push.titulo(cert.dias_para_vencer),
          body: TEMPLATES.push.corpo(cert),
          icon: '/icon-192.png',
          badge: '/badge.png',
          click_action: 'https://app.planac.com.br/certificados',
        },
        data: {
          tipo: 'certificado_vencimento',
          cnpj: cert.cnpj,
          dias: cert.dias_para_vencer,
        },
      }),
    });

    if (!response.ok) {
      return {
        certificado_id: cert.id,
        tipo: 'push',
        destinatario: `${tokens.results.length} dispositivos`,
        sucesso: false,
        erro: await response.text(),
      };
    }

    return {
      certificado_id: cert.id,
      tipo: 'push',
      destinatario: `${tokens.results.length} dispositivos`,
      sucesso: true,
    };
  } catch (error: any) {
    return {
      certificado_id: cert.id,
      tipo: 'push',
      destinatario: cert.cnpj,
      sucesso: false,
      erro: error.message,
    };
  }
}

// ===== NOTIFICAÇÃO NO SISTEMA =====

async function criarNotificacaoSistema(
  env: Env,
  cert: CertificadoParaNotificar
): Promise<NotificacaoEnviada> {
  try {
    const prioridade = cert.dias_para_vencer <= 3 ? 'critica' :
                       cert.dias_para_vencer <= 7 ? 'alta' :
                       cert.dias_para_vencer <= 15 ? 'media' : 'baixa';

    await env.DB
      .prepare(`
        INSERT INTO notificacoes (
          tipo, titulo, mensagem, 
          prioridade, cnpj, tenant_id,
          link, icone, 
          lida, created_at
        ) VALUES (
          'certificado_vencimento', ?, ?,
          ?, ?, ?,
          '/certificados', 'certificate',
          0, datetime('now')
        )
      `)
      .bind(
        TEMPLATES.sistema.titulo(cert.dias_para_vencer),
        TEMPLATES.sistema.mensagem(cert),
        prioridade,
        cert.cnpj,
        cert.tenant_id
      )
      .run();

    return {
      certificado_id: cert.id,
      tipo: 'sistema',
      destinatario: cert.cnpj,
      sucesso: true,
    };
  } catch (error: any) {
    return {
      certificado_id: cert.id,
      tipo: 'sistema',
      destinatario: cert.cnpj,
      sucesso: false,
      erro: error.message,
    };
  }
}

// ===== CONTROLE DE DUPLICATAS =====

async function registrarNotificacaoEnviada(
  env: Env,
  certificadoId: number,
  diasParaVencer: number
): Promise<void> {
  await env.DB
    .prepare(`
      INSERT OR REPLACE INTO notificacoes_certificados (
        certificado_id, dias_restantes, enviada_em
      ) VALUES (?, ?, datetime('now'))
    `)
    .bind(certificadoId, diasParaVencer)
    .run();
}

/**
 * Verifica se notificação já foi enviada para evitar spam
 */
export async function jaNotificado(
  env: Env,
  certificadoId: number,
  diasParaVencer: number
): Promise<boolean> {
  const resultado = await env.DB
    .prepare(`
      SELECT 1 FROM notificacoes_certificados 
      WHERE certificado_id = ? AND dias_restantes = ?
    `)
    .bind(certificadoId, diasParaVencer)
    .first();

  return !!resultado;
}

// ===== HELPERS =====

function formatarCnpj(cnpj: string): string {
  const numeros = cnpj.replace(/\D/g, '');
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR');
}
