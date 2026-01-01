// =============================================
// PLANAC ERP - ADRC-ST Service
// =============================================
// Arquivo: src/api/src/services/adrcst/adrcst-service.ts
// Servico principal para geracao do arquivo ADRC-ST

import {
  ApuracaoADRCST, ItemADRCST, DocumentoADRCST, GuiaRecolhimentoADRCST,
  ValidacaoADRCST, ConfiguracaoADRCST,
  Registro0000, Registro1000, Registro1010, Registro1100,
  Registro1110, Registro1115, Registro1120,
  Registro1200, Registro1210, Registro1220,
  Registro1300, Registro1310, Registro1320,
  Registro1400, Registro1410, Registro1420,
  Registro1500, Registro1510, Registro1520,
  Registro1999, Registro9000, Registro9999,
  RegistroADRCST, CriarApuracaoRequest, CalcularApuracaoRequest,
  StatusApuracao, OpcaoRecuperacao, TipoDocumento,
  VERSAO_LEIAUTE, ALIQUOTAS_ICMS_VALIDAS, ALIQUOTA_FECOP,
  CODIGOS_AJUSTE_EFD
} from './types';

import {
  gerarArquivoADRCST, calcularHashArquivo, gerarNomeArquivo,
  formatarData
} from './adrcst-writer';

// =============================================
// TIPOS AUXILIARES
// =============================================

interface EmpresaInfo {
  id: string;
  cnpj: string;
  inscricao_estadual: string;
  razao_social: string;
  regime_tributario: string;
}

interface FilialInfo {
  id: string;
  cnpj: string;
  inscricao_estadual: string;
  nome: string;
}

interface DocumentoEntrada {
  id: string;
  chave_acesso: string;
  numero: number;
  data_emissao: string;
  cnpj_emitente: string;
  uf_emitente: string;
  cnpj_destinatario: string;
  uf_destinatario: string;
}

interface ItemEntrada {
  id: string;
  documento_id: string;
  numero_item: number;
  codigo_produto: string;
  descricao: string;
  ncm: string;
  cest: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  icms_cst: string;
  icms_st_base_retencao: number;
  icms_st_valor_retido: number;
  icms_st_aliquota: number;
  icms_proprio_valor: number;
  icms_suportado_total: number;
  produto_id: string;
}

interface NotaFiscalSaida {
  id: string;
  chave_acesso: string;
  numero: number;
  data_emissao: string;
  cnpj_emitente: string;
  uf_emitente: string;
  cnpj_destinatario: string;
  uf_destinatario: string;
  tipo_operacao: string;
  finalidade: string;
}

interface ItemSaida {
  id: string;
  nota_fiscal_id: string;
  numero_item: number;
  codigo_produto: string;
  descricao: string;
  ncm: string;
  cest: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  icms_cst: string;
  icms_base_calculo: number;
  icms_aliquota: number;
  icms_valor: number;
  produto_id: string;
}

// =============================================
// CLASSE PRINCIPAL DO SERVICO
// =============================================

export class ADRCSTService {
  private db: D1Database;
  private r2: R2Bucket;

  constructor(db: D1Database, r2: R2Bucket) {
    this.db = db;
    this.r2 = r2;
  }

  // =============================================
  // CONFIGURACOES
  // =============================================

  /**
   * Obtem ou cria configuracoes ADRC-ST para a empresa
   */
  async obterConfiguracoes(empresaId: string): Promise<ConfiguracaoADRCST | null> {
    const result = await this.db.prepare(`
      SELECT * FROM adrcst_configuracoes WHERE empresa_id = ? AND ativo = 1
    `).bind(empresaId).first<ConfiguracaoADRCST>();
    
    return result || null;
  }

  /**
   * Salva configuracoes ADRC-ST
   */
  async salvarConfiguracoes(config: Partial<ConfiguracaoADRCST> & { empresa_id: string }): Promise<ConfiguracaoADRCST> {
    const existente = await this.obterConfiguracoes(config.empresa_id);
    
    if (existente) {
      await this.db.prepare(`
        UPDATE adrcst_configuracoes SET
          opcao_padrao_r1200 = ?,
          opcao_padrao_r1300 = ?,
          opcao_padrao_r1400 = ?,
          opcao_padrao_r1500 = ?,
          cnpj_cd_padrao = ?,
          ie_cd_padrao = ?,
          n_reg_especial = ?,
          alertar_entradas_insuficientes = ?,
          alertar_unidade_divergente = ?,
          alertar_inventario_faltante = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        config.opcao_padrao_r1200 ?? existente.opcao_padrao_r1200,
        config.opcao_padrao_r1300 ?? existente.opcao_padrao_r1300,
        config.opcao_padrao_r1400 ?? existente.opcao_padrao_r1400,
        config.opcao_padrao_r1500 ?? existente.opcao_padrao_r1500,
        config.cnpj_cd_padrao ?? existente.cnpj_cd_padrao,
        config.ie_cd_padrao ?? existente.ie_cd_padrao,
        config.n_reg_especial ?? existente.n_reg_especial,
        config.alertar_entradas_insuficientes ?? existente.alertar_entradas_insuficientes,
        config.alertar_unidade_divergente ?? existente.alertar_unidade_divergente,
        config.alertar_inventario_faltante ?? existente.alertar_inventario_faltante,
        existente.id
      ).run();
      
      return { ...existente, ...config } as ConfiguracaoADRCST;
    } else {
      const id = crypto.randomUUID();
      await this.db.prepare(`
        INSERT INTO adrcst_configuracoes (
          id, empresa_id, opcao_padrao_r1200, opcao_padrao_r1300,
          opcao_padrao_r1400, opcao_padrao_r1500, cnpj_cd_padrao,
          ie_cd_padrao, n_reg_especial, alertar_entradas_insuficientes,
          alertar_unidade_divergente, alertar_inventario_faltante
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        config.empresa_id,
        config.opcao_padrao_r1200 ?? 0,
        config.opcao_padrao_r1300 ?? 0,
        config.opcao_padrao_r1400 ?? 0,
        config.opcao_padrao_r1500 ?? 0,
        config.cnpj_cd_padrao ?? null,
        config.ie_cd_padrao ?? null,
        config.n_reg_especial ?? null,
        config.alertar_entradas_insuficientes ?? 1,
        config.alertar_unidade_divergente ?? 1,
        config.alertar_inventario_faltante ?? 1
      ).run();
      
      return await this.obterConfiguracoes(config.empresa_id) as ConfiguracaoADRCST;
    }
  }

  // =============================================
  // APURACOES
  // =============================================

  /**
   * Lista apuracoes de uma empresa
   */
  async listarApuracoes(empresaId: string, filtros?: {
    filial_id?: string;
    ano?: number;
    status?: StatusApuracao;
    limit?: number;
    offset?: number;
  }): Promise<{ apuracoes: ApuracaoADRCST[]; total: number }> {
    let where = 'WHERE empresa_id = ?';
    const params: (string | number)[] = [empresaId];
    
    if (filtros?.filial_id) {
      where += ' AND filial_id = ?';
      params.push(filtros.filial_id);
    }
    if (filtros?.ano) {
      where += ' AND ano = ?';
      params.push(filtros.ano);
    }
    if (filtros?.status) {
      where += ' AND status = ?';
      params.push(filtros.status);
    }
    
    const countResult = await this.db.prepare(`
      SELECT COUNT(*) as total FROM adrcst_apuracoes ${where}
    `).bind(...params).first<{ total: number }>();
    
    const limit = filtros?.limit ?? 50;
    const offset = filtros?.offset ?? 0;
    
    const apuracoes = await this.db.prepare(`
      SELECT * FROM adrcst_apuracoes ${where}
      ORDER BY ano DESC, mes DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all<ApuracaoADRCST>();
    
    return {
      apuracoes: apuracoes.results,
      total: countResult?.total ?? 0
    };
  }

  /**
   * Obtem uma apuracao por ID
   */
  async obterApuracao(apuracaoId: string): Promise<ApuracaoADRCST | null> {
    return await this.db.prepare(`
      SELECT * FROM adrcst_apuracoes WHERE id = ?
    `).bind(apuracaoId).first<ApuracaoADRCST>();
  }

  /**
   * Cria uma nova apuracao
   */
  async criarApuracao(request: CriarApuracaoRequest): Promise<ApuracaoADRCST> {
    const mesAno = request.mes.toString().padStart(2, '0') + request.ano.toString();
    
    // Verifica se ja existe apuracao para o periodo
    const existente = await this.db.prepare(`
      SELECT id FROM adrcst_apuracoes 
      WHERE empresa_id = ? AND mes_ano = ? AND cd_fin = ?
      AND (filial_id = ? OR (filial_id IS NULL AND ? IS NULL))
    `).bind(
      request.empresa_id,
      mesAno,
      request.cd_fin ?? 0,
      request.filial_id ?? null,
      request.filial_id ?? null
    ).first();
    
    if (existente) {
      throw new Error(`Ja existe uma apuracao para o periodo ${mesAno}`);
    }
    
    // Obtem configuracoes padrao
    const config = await this.obterConfiguracoes(request.empresa_id);
    
    const id = crypto.randomUUID();
    await this.db.prepare(`
      INSERT INTO adrcst_apuracoes (
        id, empresa_id, filial_id, mes_ano, ano, mes, cod_versao, cd_fin,
        opcao_r1200, opcao_r1300, opcao_r1400, opcao_r1500,
        status, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      request.empresa_id,
      request.filial_id ?? null,
      mesAno,
      request.ano,
      request.mes,
      VERSAO_LEIAUTE,
      request.cd_fin ?? 0,
      request.opcao_r1200 ?? config?.opcao_padrao_r1200 ?? 0,
      request.opcao_r1300 ?? config?.opcao_padrao_r1300 ?? 0,
      request.opcao_r1400 ?? config?.opcao_padrao_r1400 ?? 0,
      request.opcao_r1500 ?? config?.opcao_padrao_r1500 ?? 0,
      'rascunho',
      request.observacoes ?? null
    ).run();
    
    // Registra log
    await this.registrarLog(request.empresa_id, id, 'criacao', 'Apuracao criada');
    
    return await this.obterApuracao(id) as ApuracaoADRCST;
  }

  /**
   * Exclui uma apuracao (apenas se estiver em rascunho)
   */
  async excluirApuracao(apuracaoId: string): Promise<void> {
    const apuracao = await this.obterApuracao(apuracaoId);
    if (!apuracao) {
      throw new Error('Apuracao nao encontrada');
    }
    
    if (apuracao.status !== 'rascunho') {
      throw new Error('Apenas apuracoes em rascunho podem ser excluidas');
    }
    
    await this.db.prepare(`DELETE FROM adrcst_apuracoes WHERE id = ?`).bind(apuracaoId).run();
    
    await this.registrarLog(apuracao.empresa_id, apuracaoId, 'exclusao', 'Apuracao excluida');
  }

  // =============================================
  // CALCULO DA APURACAO
  // =============================================

  /**
   * Calcula a apuracao coletando dados de entradas e saidas
   */
  async calcularApuracao(request: CalcularApuracaoRequest): Promise<ApuracaoADRCST> {
    const apuracao = await this.obterApuracao(request.apuracao_id);
    if (!apuracao) {
      throw new Error('Apuracao nao encontrada');
    }
    
    // Limpa itens e documentos anteriores
    await this.db.prepare(`DELETE FROM adrcst_itens WHERE apuracao_id = ?`).bind(apuracao.id).run();
    await this.db.prepare(`DELETE FROM adrcst_validacoes WHERE apuracao_id = ?`).bind(apuracao.id).run();
    
    // Obtem informacoes da empresa/filial
    const empresa = await this.obterEmpresa(apuracao.empresa_id);
    if (!empresa) {
      throw new Error('Empresa nao encontrada');
    }
    
    // Coleta entradas do periodo
    const entradas = await this.coletarEntradas(apuracao);
    
    // Coleta saidas do periodo
    const saidas = await this.coletarSaidas(apuracao);
    
    // Agrupa por produto
    const produtosMap = new Map<string, {
      entradas: ItemEntrada[];
      saidas: ItemSaida[];
      produto: { id: string; codigo: string; descricao: string; ncm: string; cest: string; unidade: string };
    }>();
    
    // Processa entradas
    for (const entrada of entradas) {
      const key = entrada.codigo_produto || entrada.produto_id;
      if (!produtosMap.has(key)) {
        produtosMap.set(key, {
          entradas: [],
          saidas: [],
          produto: {
            id: entrada.produto_id,
            codigo: entrada.codigo_produto,
            descricao: entrada.descricao,
            ncm: entrada.ncm,
            cest: entrada.cest,
            unidade: entrada.unidade
          }
        });
      }
      produtosMap.get(key)!.entradas.push(entrada);
    }
    
    // Processa saidas
    for (const saida of saidas) {
      const key = saida.codigo_produto || saida.produto_id;
      if (!produtosMap.has(key)) {
        produtosMap.set(key, {
          entradas: [],
          saidas: [],
          produto: {
            id: saida.produto_id,
            codigo: saida.codigo_produto,
            descricao: saida.descricao,
            ncm: saida.ncm,
            cest: saida.cest,
            unidade: saida.unidade
          }
        });
      }
      produtosMap.get(key)!.saidas.push(saida);
    }
    
    // Calcula valores por produto
    const totais = {
      x01: 0, x02: 0, x03: 0, x04: 0, x05: 0, x06: 0,
      x07: 0, x08: 0, x09: 0, x10: 0, x11: 0, x12: 0
    };
    
    for (const [codItem, dados] of produtosMap) {
      const item = await this.calcularItem(apuracao, codItem, dados);
      
      // Acumula totais
      totais.x01 += item.f08_vl_icmsst_ressarcir_r1200;
      totais.x02 += item.f08_vl_icmsst_ressarcir_r1200; // Recuperar = Ressarcir para conta grafica
      totais.x03 += item.f09_vl_icmsst_complementar_r1200;
      totais.x04 += item.h04_vl_icmsst_recuperar_r1300;
      totais.x05 += item.j04_vl_icmsst_recuperar_r1400;
      totais.x06 += item.l07_vl_icmsst_recuperar_r1500;
      totais.x07 += item.f10_vl_fecop_ressarcir_r1200;
      totais.x08 += item.f10_vl_fecop_ressarcir_r1200;
      totais.x09 += item.f11_vl_fecop_complementar_r1200;
      totais.x10 += item.h05_vl_fecop_recuperar_r1300;
      totais.x11 += item.j05_vl_fecop_recuperar_r1400;
      totais.x12 += item.l08_vl_fecop_recuperar_r1500;
    }
    
    // Atualiza apuracao com totais
    await this.db.prepare(`
      UPDATE adrcst_apuracoes SET
        x01_vl_icmsst_ressarcir_r1200 = ?,
        x02_vl_icmsst_recuperar_r1200 = ?,
        x03_vl_icmsst_complementar_r1200 = ?,
        x04_vl_icmsst_recuperar_r1300 = ?,
        x05_vl_icmsst_recuperar_r1400 = ?,
        x06_vl_icmsst_recuperar_r1500 = ?,
        x07_vl_fecop_ressarcir_r1200 = ?,
        x08_vl_fecop_recuperar_r1200 = ?,
        x09_vl_fecop_complementar_r1200 = ?,
        x10_vl_fecop_recuperar_r1300 = ?,
        x11_vl_fecop_recuperar_r1400 = ?,
        x12_vl_fecop_recuperar_r1500 = ?,
        status = 'calculado',
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      totais.x01, totais.x02, totais.x03, totais.x04, totais.x05, totais.x06,
      totais.x07, totais.x08, totais.x09, totais.x10, totais.x11, totais.x12,
      apuracao.id
    ).run();
    
    await this.registrarLog(apuracao.empresa_id, apuracao.id, 'calculo', 
      `Apuracao calculada: ${produtosMap.size} produtos processados`);
    
    return await this.obterApuracao(apuracao.id) as ApuracaoADRCST;
  }

  /**
   * Calcula valores de um item
   */
  private async calcularItem(
    apuracao: ApuracaoADRCST,
    codItem: string,
    dados: {
      entradas: ItemEntrada[];
      saidas: ItemSaida[];
      produto: { id: string; codigo: string; descricao: string; ncm: string; cest: string; unidade: string };
    }
  ): Promise<ItemADRCST> {
    const { entradas, saidas, produto } = dados;
    
    // Calcula totais de entrada
    let qtdTotEntrada = 0;
    let vlTotIcmsSuportEntr = 0;
    let menorVlUnitItem = Infinity;
    let vlBcIcmsStTotal = 0;
    
    for (const entrada of entradas) {
      qtdTotEntrada += entrada.quantidade;
      vlTotIcmsSuportEntr += entrada.icms_suportado_total || 0;
      vlBcIcmsStTotal += entrada.icms_st_base_retencao || 0;
      if (entrada.valor_unitario < menorVlUnitItem) {
        menorVlUnitItem = entrada.valor_unitario;
      }
    }
    
    if (menorVlUnitItem === Infinity) menorVlUnitItem = 0;
    
    const vlBcIcmsStUnitMed = qtdTotEntrada > 0 ? vlBcIcmsStTotal / qtdTotEntrada : 0;
    const vlUnitMedIcmsSuportEntr = qtdTotEntrada > 0 ? vlTotIcmsSuportEntr / qtdTotEntrada : 0;
    
    // Classifica saidas por cenario
    const saidasR1200: ItemSaida[] = []; // Consumidor final interno
    const saidasR1300: ItemSaida[] = []; // Interestadual
    const saidasR1400: ItemSaida[] = []; // Art. 119
    const saidasR1500: ItemSaida[] = []; // Simples Nacional
    
    for (const saida of saidas) {
      const cfop = saida.cfop;
      const ufDest = await this.obterUFDestinatario(saida.nota_fiscal_id);
      
      // Verifica se e interestadual (CFOP 6xxx)
      if (cfop.startsWith('6')) {
        saidasR1300.push(saida);
      }
      // Verifica se e para consumidor final interno
      else if (cfop.startsWith('5') && ufDest === 'PR') {
        // TODO: Verificar se destinatario e consumidor final ou Simples Nacional
        saidasR1200.push(saida);
      }
    }
    
    // Calcula R1200 - Saidas consumidor final
    let qtdSaidaR1200 = 0;
    let vlIcmsEfetivoR1200 = 0;
    for (const saida of saidasR1200) {
      qtdSaidaR1200 += saida.quantidade;
      vlIcmsEfetivoR1200 += saida.icms_valor || 0;
    }
    const vlUnitIcmsEfetivoR1200 = qtdSaidaR1200 > 0 ? vlIcmsEfetivoR1200 / qtdSaidaR1200 : 0;
    const vlConfrontoR1200 = qtdSaidaR1200 * vlUnitMedIcmsSuportEntr;
    const diferencaR1200 = vlConfrontoR1200 - vlIcmsEfetivoR1200;
    const vlRessarcirR1200 = diferencaR1200 > 0 ? diferencaR1200 : 0;
    const vlComplementarR1200 = diferencaR1200 < 0 ? Math.abs(diferencaR1200) : 0;
    
    // Calcula R1300 - Saidas interestaduais
    let qtdSaidaR1300 = 0;
    for (const saida of saidasR1300) {
      qtdSaidaR1300 += saida.quantidade;
    }
    const vlConfrontoR1300 = qtdSaidaR1300 * vlUnitMedIcmsSuportEntr;
    
    // Calcula R1400 - Saidas art. 119
    let qtdSaidaR1400 = 0;
    for (const saida of saidasR1400) {
      qtdSaidaR1400 += saida.quantidade;
    }
    const vlConfrontoR1400 = qtdSaidaR1400 * vlUnitMedIcmsSuportEntr;
    
    // Calcula R1500 - Saidas Simples Nacional
    let qtdSaidaR1500 = 0;
    let vlIcmsEfetivoR1500 = 0;
    for (const saida of saidasR1500) {
      qtdSaidaR1500 += saida.quantidade;
      vlIcmsEfetivoR1500 += saida.icms_valor || 0;
    }
    const vlUnitIcmsEfetivoR1500 = qtdSaidaR1500 > 0 ? vlIcmsEfetivoR1500 / qtdSaidaR1500 : 0;
    
    // Obtem aliquota ICMS do produto
    const aliqIcms = entradas[0]?.icms_st_aliquota || 18;
    const aliqFecop = 0; // TODO: Verificar se produto e sujeito ao FECOP
    const indFecop = aliqFecop > 0 ? 1 : 0;
    
    // Separa ICMS-ST e FECOP
    const proporcaoIcmsSt = aliqIcms / (aliqIcms + aliqFecop);
    const proporcaoFecop = aliqFecop / (aliqIcms + aliqFecop);
    
    const vlIcmsStRessarcirR1200 = vlRessarcirR1200 * proporcaoIcmsSt;
    const vlIcmsStComplementarR1200 = vlComplementarR1200 * proporcaoIcmsSt;
    const vlFecopRessarcirR1200 = vlRessarcirR1200 * proporcaoFecop;
    const vlFecopComplementarR1200 = vlComplementarR1200 * proporcaoFecop;
    
    const vlIcmsStRecuperarR1300 = vlConfrontoR1300 * proporcaoIcmsSt;
    const vlFecopRecuperarR1300 = vlConfrontoR1300 * proporcaoFecop;
    
    const vlIcmsStRecuperarR1400 = vlConfrontoR1400 * proporcaoIcmsSt;
    const vlFecopRecuperarR1400 = vlConfrontoR1400 * proporcaoFecop;
    
    // R1500 tem calculo diferente com MVA
    const mvaIcmsSt = await this.obterMVA(produto.cest, produto.ncm);
    const vlConfrontoR1500 = qtdSaidaR1500 * vlUnitMedIcmsSuportEntr * (1 - mvaIcmsSt / 100);
    const vlIcmsStRecuperarR1500 = Math.max(0, vlConfrontoR1500 - vlIcmsEfetivoR1500) * proporcaoIcmsSt;
    const vlFecopRecuperarR1500 = Math.max(0, vlConfrontoR1500 - vlIcmsEfetivoR1500) * proporcaoFecop;
    
    // Quantidade total de saida
    const qtdTotSaida = qtdSaidaR1200 + qtdSaidaR1300 + qtdSaidaR1400 + qtdSaidaR1500;
    
    // Insere item na base
    const itemId = crypto.randomUUID();
    await this.db.prepare(`
      INSERT INTO adrcst_itens (
        id, apuracao_id, produto_id, ind_fecop, cod_item, ncm, cest,
        descr_item, unid_item, aliq_icms_item, aliq_fecop,
        qtd_tot_entrada, qtd_tot_saida,
        d02_qtd_tot_entrada, d03_menor_vl_unit_item, d04_vl_bc_icmsst_unit_med,
        d05_vl_tot_icms_suport_entr, d06_vl_unit_med_icms_suport_entr,
        f02_qtd_saida_r1200, f03_vl_unit_icms_efetivo_r1200, f04_vl_icms_efetivo_r1200,
        f05_vl_confronto_r1200, f06_vl_ressarcir_r1200, f07_vl_complementar_r1200,
        f08_vl_icmsst_ressarcir_r1200, f09_vl_icmsst_complementar_r1200,
        f10_vl_fecop_ressarcir_r1200, f11_vl_fecop_complementar_r1200,
        h02_qtd_saida_r1300, h03_vl_confronto_r1300,
        h04_vl_icmsst_recuperar_r1300, h05_vl_fecop_recuperar_r1300,
        j02_qtd_saida_r1400, j03_vl_confronto_r1400,
        j04_vl_icmsst_recuperar_r1400, j05_vl_fecop_recuperar_r1400,
        l02_qtd_saida_r1500, l03_vl_unit_icms_efetivo_r1500, l04_vl_icms_efetivo_r1500,
        l05_mva_icmsst, l06_vl_confronto_r1500,
        l07_vl_icmsst_recuperar_r1500, l08_vl_fecop_recuperar_r1500
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      itemId, apuracao.id, produto.id, indFecop, produto.codigo, produto.ncm, produto.cest,
      produto.descricao, produto.unidade, aliqIcms, aliqFecop,
      qtdTotEntrada, qtdTotSaida,
      qtdTotEntrada, menorVlUnitItem, vlBcIcmsStUnitMed,
      vlTotIcmsSuportEntr, vlUnitMedIcmsSuportEntr,
      qtdSaidaR1200, vlUnitIcmsEfetivoR1200, vlIcmsEfetivoR1200,
      vlConfrontoR1200, vlRessarcirR1200, vlComplementarR1200,
      vlIcmsStRessarcirR1200, vlIcmsStComplementarR1200,
      vlFecopRessarcirR1200, vlFecopComplementarR1200,
      qtdSaidaR1300, vlConfrontoR1300,
      vlIcmsStRecuperarR1300, vlFecopRecuperarR1300,
      qtdSaidaR1400, vlConfrontoR1400,
      vlIcmsStRecuperarR1400, vlFecopRecuperarR1400,
      qtdSaidaR1500, vlUnitIcmsEfetivoR1500, vlIcmsEfetivoR1500,
      mvaIcmsSt, vlConfrontoR1500,
      vlIcmsStRecuperarR1500, vlFecopRecuperarR1500
    ).run();
    
    // Insere documentos de entrada
    for (const entrada of entradas) {
      await this.inserirDocumentoEntrada(itemId, entrada, apuracao);
    }
    
    // Insere documentos de saida
    for (const saida of saidasR1200) {
      await this.inserirDocumentoSaida(itemId, saida, '1210');
    }
    for (const saida of saidasR1300) {
      await this.inserirDocumentoSaida(itemId, saida, '1310');
    }
    for (const saida of saidasR1400) {
      await this.inserirDocumentoSaida(itemId, saida, '1410');
    }
    for (const saida of saidasR1500) {
      await this.inserirDocumentoSaida(itemId, saida, '1510');
    }
    
    return await this.db.prepare(`SELECT * FROM adrcst_itens WHERE id = ?`).bind(itemId).first<ItemADRCST>() as ItemADRCST;
  }

  // =============================================
  // GERACAO DO ARQUIVO
  // =============================================

  /**
   * Gera o arquivo ADRC-ST
   */
  async gerarArquivo(apuracaoId: string): Promise<{ nome: string; conteudo: string; hash: string; totalLinhas: number }> {
    const apuracao = await this.obterApuracao(apuracaoId);
    if (!apuracao) {
      throw new Error('Apuracao nao encontrada');
    }
    
    if (apuracao.status === 'rascunho') {
      throw new Error('Apuracao precisa ser calculada antes de gerar o arquivo');
    }
    
    const empresa = await this.obterEmpresa(apuracao.empresa_id);
    if (!empresa) {
      throw new Error('Empresa nao encontrada');
    }
    
    const registros: RegistroADRCST[] = [];
    let linhasBloco1 = 0;
    
    // Registro 0000 - Abertura
    const reg0000: Registro0000 = {
      REG: '0000',
      COD_VERSAO: apuracao.cod_versao,
      MES_ANO: apuracao.mes_ano,
      CNPJ: empresa.cnpj,
      IE: empresa.inscricao_estadual,
      NOME: empresa.razao_social,
      CD_FIN: apuracao.cd_fin as 0 | 1,
      N_REG_ESPECIAL: apuracao.n_reg_especial,
      CNPJ_CD: apuracao.cnpj_cd,
      IE_CD: apuracao.ie_cd,
      OPCAO_R1200: apuracao.opcao_r1200 as OpcaoRecuperacao,
      OPCAO_R1300: apuracao.opcao_r1300 as 0 | 1,
      OPCAO_R1400: apuracao.opcao_r1400 as 0 | 1,
      OPCAO_R1500: apuracao.opcao_r1500 as 0 | 1,
    };
    registros.push(reg0000);
    
    // Obtem itens da apuracao
    const itens = await this.db.prepare(`
      SELECT * FROM adrcst_itens WHERE apuracao_id = ? ORDER BY cod_item
    `).bind(apuracaoId).all<ItemADRCST>();
    
    // Para cada item, gera os registros
    for (const item of itens.results) {
      // Registro 1000 - Identificacao do item
      const reg1000: Registro1000 = {
        REG: '1000',
        IND_FECOP: item.ind_fecop as 0 | 1,
        COD_ITEM: item.cod_item,
        COD_BARRAS: item.cod_barras,
        COD_ANP: item.cod_anp,
        NCM: item.ncm,
        CEST: item.cest,
        DESCR_ITEM: item.descr_item,
        UNID_ITEM: item.unid_item,
        ALIQ_ICMS_ITEM: item.aliq_icms_item,
        ALIQ_FECOP: item.aliq_fecop,
        QTD_TOT_ENTRADA: item.qtd_tot_entrada,
        QTD_TOT_SAIDA: item.qtd_tot_saida,
      };
      registros.push(reg1000);
      linhasBloco1++;
      
      // Registro 1100 - Totalizador entradas
      if (item.d02_qtd_tot_entrada > 0) {
        const reg1100: Registro1100 = {
          REG: '1100',
          COD_ITEM: item.cod_item,
          QTD_TOT_ENTRADA: item.d02_qtd_tot_entrada,
          MENOR_VL_UNIT_ITEM: item.d03_menor_vl_unit_item,
          VL_BC_ICMSST_UNIT_MED: item.d04_vl_bc_icmsst_unit_med,
          VL_TOT_ICMS_SUPORT_ENTR: item.d05_vl_tot_icms_suport_entr,
          VL_UNIT_MED_ICMS_SUPORT_ENTR: item.d06_vl_unit_med_icms_suport_entr,
        };
        registros.push(reg1100);
        linhasBloco1++;
        
        // Registros 1110 - Documentos de entrada
        const docsEntrada = await this.db.prepare(`
          SELECT * FROM adrcst_documentos WHERE item_id = ? AND tipo_registro = '1110' ORDER BY dt_doc, n_nf
        `).bind(item.id).all<DocumentoADRCST>();
        
        for (const doc of docsEntrada.results) {
          const reg1110: Registro1110 = {
            REG: '1110',
            DT_DOC: doc.dt_doc,
            COD_RESP_RET: doc.cod_resp_ret as 1 | 2 | 3,
            CST_CSOSN: doc.cst_csosn || '',
            CHAVE: doc.chave,
            N_NF: doc.n_nf,
            CNPJ_EMIT: doc.cnpj_emit,
            UF_EMIT: doc.uf_emit,
            CNPJ_DEST: doc.cnpj_dest,
            UF_DEST: doc.uf_dest,
            CFOP: doc.cfop,
            N_ITEM: doc.n_item,
            COD_ITEM: item.cod_item,
            UNID_ITEM: doc.unid_item,
            QTD_ENTRADA: doc.qtd_entrada || 0,
            VL_UNIT_ITEM: doc.vl_unit_item || 0,
            VL_BC_ICMS_ST: doc.vl_bc_icms_st || 0,
            VL_ICMS_SUPORT_ENTR: doc.vl_icms_suport_entr || 0,
          };
          registros.push(reg1110);
          linhasBloco1++;
          
          // Registro 1115 - Guias de recolhimento (se houver)
          const guias = await this.db.prepare(`
            SELECT * FROM adrcst_guias_recolhimento WHERE documento_id = ?
          `).bind(doc.id).all<GuiaRecolhimentoADRCST>();
          
          for (const guia of guias.results) {
            const reg1115: Registro1115 = {
              REG: '1115',
              TP_GUIA: guia.tp_guia as 1 | 2,
              NUM_IDENT: guia.num_ident,
              DT_DOC: guia.dt_doc,
              DT_PAG: guia.dt_pag,
              COD_ARRECAD: guia.cod_arrecad,
              VL_RECOL: guia.vl_recol,
            };
            registros.push(reg1115);
            linhasBloco1++;
          }
        }
        
        // Registros 1120 - Devolucoes de entrada
        const docsDevEntrada = await this.db.prepare(`
          SELECT * FROM adrcst_documentos WHERE item_id = ? AND tipo_registro = '1120' ORDER BY dt_doc, n_nf
        `).bind(item.id).all<DocumentoADRCST>();
        
        for (const doc of docsDevEntrada.results) {
          const reg1120: Registro1120 = {
            REG: '1120',
            DT_DOC: doc.dt_doc,
            CST_CSOSN: doc.cst_csosn || '',
            CHAVE: doc.chave,
            N_NF: doc.n_nf,
            CNPJ_EMIT: doc.cnpj_emit,
            UF_EMIT: doc.uf_emit,
            CNPJ_DEST: doc.cnpj_dest,
            UF_DEST: doc.uf_dest,
            CFOP: doc.cfop,
            N_ITEM: doc.n_item,
            COD_ITEM: item.cod_item,
            UNID_ITEM: doc.unid_item,
            QTD_DEVOLVIDA: doc.qtd_devolvida_entrada || 0,
            VL_UNIT_ITEM: doc.vl_unit_item_dev_entrada || 0,
            VL_BC_ICMS_ST: doc.vl_bc_icms_st_dev_entrada || 0,
            VL_ICMS_SUPORT_DEV: doc.vl_icms_suport_dev_entrada || 0,
          };
          registros.push(reg1120);
          linhasBloco1++;
        }
      }
      
      // Registro 1200 - Saidas consumidor final
      if (item.f02_qtd_saida_r1200 > 0) {
        const reg1200: Registro1200 = {
          REG: '1200',
          COD_ITEM: item.cod_item,
          QTD_SAIDA: item.f02_qtd_saida_r1200,
          VL_UNIT_ICMS_EFETIVO: item.f03_vl_unit_icms_efetivo_r1200,
          VL_ICMS_EFETIVO: item.f04_vl_icms_efetivo_r1200,
          VL_CONFRONTO: item.f05_vl_confronto_r1200,
          VL_RESSARCIR: item.f06_vl_ressarcir_r1200,
          VL_COMPLEMENTAR: item.f07_vl_complementar_r1200,
          VL_ICMSST_RESSARCIR: item.f08_vl_icmsst_ressarcir_r1200,
          VL_ICMSST_COMPLEMENTAR: item.f09_vl_icmsst_complementar_r1200,
          VL_FECOP_RESSARCIR: item.f10_vl_fecop_ressarcir_r1200,
          VL_FECOP_COMPLEMENTAR: item.f11_vl_fecop_complementar_r1200,
        };
        registros.push(reg1200);
        linhasBloco1++;
        
        // Registros 1210 e 1220
        await this.adicionarDocumentosSaida(registros, item.id, '1210', '1220', item.cod_item);
        linhasBloco1 += await this.contarDocumentos(item.id, ['1210', '1220']);
      }
      
      // Registro 1300 - Saidas interestaduais
      if (item.h02_qtd_saida_r1300 > 0) {
        const reg1300: Registro1300 = {
          REG: '1300',
          COD_ITEM: item.cod_item,
          QTD_SAIDA: item.h02_qtd_saida_r1300,
          VL_CONFRONTO: item.h03_vl_confronto_r1300,
          VL_ICMSST_RECUPERAR: item.h04_vl_icmsst_recuperar_r1300,
          VL_FECOP_RECUPERAR: item.h05_vl_fecop_recuperar_r1300,
        };
        registros.push(reg1300);
        linhasBloco1++;
        
        // Registros 1310 e 1320
        await this.adicionarDocumentosSaidaSimples(registros, item.id, '1310', '1320', item.cod_item);
        linhasBloco1 += await this.contarDocumentos(item.id, ['1310', '1320']);
      }
      
      // Registro 1400 - Saidas art. 119
      if (item.j02_qtd_saida_r1400 > 0) {
        const reg1400: Registro1400 = {
          REG: '1400',
          COD_ITEM: item.cod_item,
          QTD_SAIDA: item.j02_qtd_saida_r1400,
          VL_CONFRONTO: item.j03_vl_confronto_r1400,
          VL_ICMSST_RECUPERAR: item.j04_vl_icmsst_recuperar_r1400,
          VL_FECOP_RECUPERAR: item.j05_vl_fecop_recuperar_r1400,
        };
        registros.push(reg1400);
        linhasBloco1++;
        
        // Registros 1410 e 1420
        await this.adicionarDocumentosSaidaSimples(registros, item.id, '1410', '1420', item.cod_item);
        linhasBloco1 += await this.contarDocumentos(item.id, ['1410', '1420']);
      }
      
      // Registro 1500 - Saidas Simples Nacional
      if (item.l02_qtd_saida_r1500 > 0) {
        const reg1500: Registro1500 = {
          REG: '1500',
          COD_ITEM: item.cod_item,
          QTD_SAIDA: item.l02_qtd_saida_r1500,
          VL_UNIT_ICMS_EFETIVO: item.l03_vl_unit_icms_efetivo_r1500,
          VL_ICMS_EFETIVO: item.l04_vl_icms_efetivo_r1500,
          MVA_ICMSST: item.l05_mva_icmsst,
          VL_CONFRONTO: item.l06_vl_confronto_r1500,
          VL_ICMSST_RECUPERAR: item.l07_vl_icmsst_recuperar_r1500,
          VL_FECOP_RECUPERAR: item.l08_vl_fecop_recuperar_r1500,
        };
        registros.push(reg1500);
        linhasBloco1++;
        
        // Registros 1510 e 1520
        await this.adicionarDocumentosSaida(registros, item.id, '1510', '1520', item.cod_item);
        linhasBloco1 += await this.contarDocumentos(item.id, ['1510', '1520']);
      }
    }
    
    // Registro 1999 - Encerramento bloco 1
    const reg1999: Registro1999 = {
      REG: '1999',
      QTD_LIN_1: linhasBloco1 + 1, // +1 para incluir o proprio 1999
    };
    registros.push(reg1999);
    
    // Registro 9000 - Apuracao total
    const reg9000: Registro9000 = {
      REG: '9000',
      VL_ICMSST_RESSARCIR_R1200: apuracao.x01_vl_icmsst_ressarcir_r1200 || 0,
      VL_ICMSST_RECUPERAR_R1200: apuracao.x02_vl_icmsst_recuperar_r1200 || 0,
      VL_ICMSST_COMPLEMENTAR_R1200: apuracao.x03_vl_icmsst_complementar_r1200 || 0,
      VL_ICMSST_RECUPERAR_R1300: apuracao.x04_vl_icmsst_recuperar_r1300 || 0,
      VL_ICMSST_RECUPERAR_R1400: apuracao.x05_vl_icmsst_recuperar_r1400 || 0,
      VL_ICMSST_RECUPERAR_R1500: apuracao.x06_vl_icmsst_recuperar_r1500 || 0,
      VL_FECOP_RESSARCIR_R1200: apuracao.x07_vl_fecop_ressarcir_r1200 || 0,
      VL_FECOP_RECUPERAR_R1200: apuracao.x08_vl_fecop_recuperar_r1200 || 0,
      VL_FECOP_COMPLEMENTAR_R1200: apuracao.x09_vl_fecop_complementar_r1200 || 0,
      VL_FECOP_RECUPERAR_R1300: apuracao.x10_vl_fecop_recuperar_r1300 || 0,
      VL_FECOP_RECUPERAR_R1400: apuracao.x11_vl_fecop_recuperar_r1400 || 0,
      VL_FECOP_RECUPERAR_R1500: apuracao.x12_vl_fecop_recuperar_r1500 || 0,
    };
    registros.push(reg9000);
    
    // Registro 9999 - Encerramento
    const totalLinhas = registros.length + 1; // +1 para o proprio 9999
    const reg9999: Registro9999 = {
      REG: '9999',
      QTD_LIN: totalLinhas,
    };
    registros.push(reg9999);
    
    // Gera o arquivo
    const conteudo = gerarArquivoADRCST(registros);
    const hash = await calcularHashArquivo(conteudo);
    const nome = gerarNomeArquivo(empresa.cnpj, apuracao.mes_ano);
    
    // Atualiza apuracao
    await this.db.prepare(`
      UPDATE adrcst_apuracoes SET
        status = 'gerado',
        total_registros = ?,
        total_linhas = ?,
        hash_arquivo = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(registros.length, totalLinhas, hash, apuracaoId).run();
    
    // Salva arquivo no R2
    const storageKey = `adrcst/${apuracao.empresa_id}/${apuracao.mes_ano}/${nome}`;
    await this.r2.put(storageKey, conteudo, {
      customMetadata: {
        hash,
        totalLinhas: totalLinhas.toString(),
        geradoEm: new Date().toISOString(),
      }
    });
    
    // Atualiza storage key
    await this.db.prepare(`
      UPDATE adrcst_apuracoes SET arquivo_txt_storage_key = ? WHERE id = ?
    `).bind(storageKey, apuracaoId).run();
    
    // Registra arquivo
    await this.db.prepare(`
      INSERT INTO adrcst_arquivos (id, apuracao_id, nome_arquivo, total_linhas, hash_sha256, storage_key)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), apuracaoId, nome, totalLinhas, hash, storageKey).run();
    
    await this.registrarLog(apuracao.empresa_id, apuracaoId, 'geracao', 
      `Arquivo gerado: ${nome} (${totalLinhas} linhas)`);
    
    return { nome, conteudo, hash, totalLinhas };
  }

  /**
   * Registra protocolo recebido do portal
   */
  async registrarProtocolo(apuracaoId: string, protocolo: string, dataProtocolo?: string): Promise<ApuracaoADRCST> {
    const apuracao = await this.obterApuracao(apuracaoId);
    if (!apuracao) {
      throw new Error('Apuracao nao encontrada');
    }
    
    await this.db.prepare(`
      UPDATE adrcst_apuracoes SET
        status = 'protocolado',
        protocolo_adrcst = ?,
        data_protocolo = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(protocolo, dataProtocolo || new Date().toISOString().split('T')[0], apuracaoId).run();
    
    await this.registrarLog(apuracao.empresa_id, apuracaoId, 'protocolo', 
      `Protocolo registrado: ${protocolo}`);
    
    return await this.obterApuracao(apuracaoId) as ApuracaoADRCST;
  }

  // =============================================
  // METODOS AUXILIARES
  // =============================================

  private async obterEmpresa(empresaId: string): Promise<EmpresaInfo | null> {
    return await this.db.prepare(`
      SELECT id, cnpj, inscricao_estadual, razao_social, regime_tributario
      FROM empresas WHERE id = ?
    `).bind(empresaId).first<EmpresaInfo>();
  }

  private async coletarEntradas(apuracao: ApuracaoADRCST): Promise<ItemEntrada[]> {
    const dataInicio = `${apuracao.ano}-${apuracao.mes.toString().padStart(2, '0')}-01`;
    const dataFim = new Date(apuracao.ano, apuracao.mes, 0).toISOString().split('T')[0];
    
    const result = await this.db.prepare(`
      SELECT 
        i.id, i.documento_id, i.numero_item, i.codigo_produto, i.descricao,
        i.ncm, i.cest, i.cfop, i.unidade, i.quantidade, i.valor_unitario,
        i.icms_cst, i.icms_st_base_retencao, i.icms_st_valor_retido,
        i.icms_st_aliquota, i.icms_proprio_valor, i.icms_suportado_total,
        i.produto_id
      FROM dfe_documentos_entrada_itens i
      JOIN dfe_documentos_entrada d ON d.id = i.documento_id
      WHERE d.empresa_id = ?
        AND d.data_emissao >= ? AND d.data_emissao <= ?
        AND d.status = 'confirmado'
        AND i.icms_st_valor_retido > 0
      ORDER BY d.data_emissao, d.numero
    `).bind(apuracao.empresa_id, dataInicio, dataFim).all<ItemEntrada>();
    
    return result.results;
  }

  private async coletarSaidas(apuracao: ApuracaoADRCST): Promise<ItemSaida[]> {
    const dataInicio = `${apuracao.ano}-${apuracao.mes.toString().padStart(2, '0')}-01`;
    const dataFim = new Date(apuracao.ano, apuracao.mes, 0).toISOString().split('T')[0];
    
    const result = await this.db.prepare(`
      SELECT 
        i.id, i.nota_fiscal_id, i.numero_item, i.codigo_produto, i.descricao,
        i.ncm, i.cest, i.cfop, i.unidade, i.quantidade, i.valor_unitario,
        i.icms_cst, i.icms_base_calculo, i.icms_aliquota, i.icms_valor,
        i.produto_id
      FROM nfe_itens i
      JOIN notas_fiscais n ON n.id = i.nota_fiscal_id
      WHERE n.empresa_id = ?
        AND n.data_emissao >= ? AND n.data_emissao <= ?
        AND n.status = 'autorizada'
      ORDER BY n.data_emissao, n.numero
    `).bind(apuracao.empresa_id, dataInicio, dataFim).all<ItemSaida>();
    
    return result.results;
  }

  private async obterUFDestinatario(notaFiscalId: string): Promise<string> {
    const result = await this.db.prepare(`
      SELECT uf_destinatario FROM notas_fiscais WHERE id = ?
    `).bind(notaFiscalId).first<{ uf_destinatario: string }>();
    return result?.uf_destinatario || 'PR';
  }

  private async obterMVA(cest: string, ncm: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT mva_original FROM mva_tabela 
      WHERE cest = ? AND ativo = 1
      AND (vigencia_fim IS NULL OR vigencia_fim >= date('now'))
      ORDER BY vigencia_inicio DESC
      LIMIT 1
    `).bind(cest).first<{ mva_original: number }>();
    return result?.mva_original || 0;
  }

  private async inserirDocumentoEntrada(itemId: string, entrada: ItemEntrada, apuracao: ApuracaoADRCST): Promise<void> {
    const doc = await this.db.prepare(`
      SELECT * FROM dfe_documentos_entrada WHERE id = ?
    `).bind(entrada.documento_id).first<DocumentoEntrada>();
    
    if (!doc) return;
    
    await this.db.prepare(`
      INSERT INTO adrcst_documentos (
        id, item_id, tipo_registro, dt_doc, cst_csosn, chave, n_nf,
        cnpj_emit, uf_emit, cnpj_dest, uf_dest, cfop, n_item, unid_item,
        cod_resp_ret, qtd_entrada, vl_unit_item, vl_bc_icms_st, vl_icms_suport_entr,
        dfe_documento_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), itemId, '1110',
      formatarData(doc.data_emissao),
      entrada.icms_cst,
      doc.chave_acesso,
      doc.numero,
      doc.cnpj_emitente,
      doc.uf_emitente,
      doc.cnpj_destinatario,
      doc.uf_destinatario,
      entrada.cfop,
      entrada.numero_item,
      entrada.unidade,
      1, // COD_RESP_RET: 1=Remetente direto
      entrada.quantidade,
      entrada.valor_unitario,
      entrada.icms_st_base_retencao,
      entrada.icms_suportado_total,
      entrada.documento_id
    ).run();
  }

  private async inserirDocumentoSaida(itemId: string, saida: ItemSaida, tipoRegistro: TipoDocumento): Promise<void> {
    const nf = await this.db.prepare(`
      SELECT * FROM notas_fiscais WHERE id = ?
    `).bind(saida.nota_fiscal_id).first<NotaFiscalSaida>();
    
    if (!nf) return;
    
    await this.db.prepare(`
      INSERT INTO adrcst_documentos (
        id, item_id, tipo_registro, dt_doc, cst_csosn, chave, n_nf,
        cnpj_emit, uf_emit, cnpj_dest, uf_dest, cfop, n_item, unid_item,
        qtd_saida, vl_unit_icms_efetivo, vl_icms_efetivo, nfe_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), itemId, tipoRegistro,
      formatarData(nf.data_emissao),
      saida.icms_cst,
      nf.chave_acesso,
      nf.numero,
      nf.cnpj_emitente,
      nf.uf_emitente,
      nf.cnpj_destinatario,
      nf.uf_destinatario,
      saida.cfop,
      saida.numero_item,
      saida.unidade,
      saida.quantidade,
      saida.quantidade > 0 ? saida.icms_valor / saida.quantidade : 0,
      saida.icms_valor,
      saida.nota_fiscal_id
    ).run();
  }

  private async adicionarDocumentosSaida(
    registros: RegistroADRCST[], 
    itemId: string, 
    tipoSaida: TipoDocumento, 
    tipoDevolucao: TipoDocumento,
    codItem: string
  ): Promise<void> {
    const docsSaida = await this.db.prepare(`
      SELECT * FROM adrcst_documentos WHERE item_id = ? AND tipo_registro = ? ORDER BY dt_doc, n_nf
    `).bind(itemId, tipoSaida).all<DocumentoADRCST>();
    
    for (const doc of docsSaida.results) {
      if (tipoSaida === '1210') {
        const reg: Registro1210 = {
          REG: '1210',
          DT_DOC: doc.dt_doc,
          CST_CSOSN: doc.cst_csosn || '',
          CHAVE: doc.chave,
          N_NF: doc.n_nf,
          CNPJ_EMIT: doc.cnpj_emit,
          UF_EMIT: doc.uf_emit,
          CNPJ_DEST: doc.cnpj_dest,
          UF_DEST: doc.uf_dest,
          CFOP: doc.cfop,
          N_ITEM: doc.n_item,
          COD_ITEM: codItem,
          UNID_ITEM: doc.unid_item,
          QTD_SAIDA: doc.qtd_saida || 0,
          VL_UNIT_ICMS_EFETIVO: doc.vl_unit_icms_efetivo || 0,
          VL_ICMS_EFETIVO: doc.vl_icms_efetivo || 0,
        };
        registros.push(reg);
      } else if (tipoSaida === '1510') {
        const reg: Registro1510 = {
          REG: '1510',
          DT_DOC: doc.dt_doc,
          CST_CSOSN: doc.cst_csosn || '',
          CHAVE: doc.chave,
          N_NF: doc.n_nf,
          CNPJ_EMIT: doc.cnpj_emit,
          UF_EMIT: doc.uf_emit,
          CNPJ_DEST: doc.cnpj_dest,
          UF_DEST: doc.uf_dest,
          CFOP: doc.cfop,
          N_ITEM: doc.n_item,
          COD_ITEM: codItem,
          UNID_ITEM: doc.unid_item,
          QTD_SAIDA: doc.qtd_saida || 0,
          VL_UNIT_ICMS_EFETIVO: doc.vl_unit_icms_efetivo || 0,
          VL_ICMS_EFETIVO: doc.vl_icms_efetivo || 0,
        };
        registros.push(reg);
      }
    }
    
    // Devolucoes
    const docsDev = await this.db.prepare(`
      SELECT * FROM adrcst_documentos WHERE item_id = ? AND tipo_registro = ? ORDER BY dt_doc, n_nf
    `).bind(itemId, tipoDevolucao).all<DocumentoADRCST>();
    
    for (const doc of docsDev.results) {
      if (tipoDevolucao === '1220') {
        const reg: Registro1220 = {
          REG: '1220',
          DT_DOC: doc.dt_doc,
          CST_CSOSN: doc.cst_csosn || '',
          CHAVE: doc.chave,
          N_NF: doc.n_nf,
          CNPJ_EMIT: doc.cnpj_emit,
          UF_EMIT: doc.uf_emit,
          CNPJ_DEST: doc.cnpj_dest,
          UF_DEST: doc.uf_dest,
          CFOP: doc.cfop,
          N_ITEM: doc.n_item,
          COD_ITEM: codItem,
          UNID_ITEM: doc.unid_item,
          QTD_DEVOLVIDA: doc.qtd_devolvida_saida || 0,
          VL_UNIT_ICMS_EFETIVO: doc.vl_unit_icms_efetivo_dev || 0,
          VL_ICMS_EFETIVO: doc.vl_icms_efetivo_dev || 0,
        };
        registros.push(reg);
      } else if (tipoDevolucao === '1520') {
        const reg: Registro1520 = {
          REG: '1520',
          DT_DOC: doc.dt_doc,
          CST_CSOSN: doc.cst_csosn || '',
          CHAVE: doc.chave,
          N_NF: doc.n_nf,
          CNPJ_EMIT: doc.cnpj_emit,
          UF_EMIT: doc.uf_emit,
          CNPJ_DEST: doc.cnpj_dest,
          UF_DEST: doc.uf_dest,
          CFOP: doc.cfop,
          N_ITEM: doc.n_item,
          COD_ITEM: codItem,
          UNID_ITEM: doc.unid_item,
          QTD_DEVOLVIDA: doc.qtd_devolvida_saida || 0,
          VL_UNIT_ICMS_EFETIVO: doc.vl_unit_icms_efetivo_dev || 0,
          VL_ICMS_EFETIVO: doc.vl_icms_efetivo_dev || 0,
        };
        registros.push(reg);
      }
    }
  }

  private async adicionarDocumentosSaidaSimples(
    registros: RegistroADRCST[], 
    itemId: string, 
    tipoSaida: TipoDocumento, 
    tipoDevolucao: TipoDocumento,
    codItem: string
  ): Promise<void> {
    const docsSaida = await this.db.prepare(`
      SELECT * FROM adrcst_documentos WHERE item_id = ? AND tipo_registro = ? ORDER BY dt_doc, n_nf
    `).bind(itemId, tipoSaida).all<DocumentoADRCST>();
    
    for (const doc of docsSaida.results) {
      if (tipoSaida === '1310') {
        const reg: Registro1310 = {
          REG: '1310',
          DT_DOC: doc.dt_doc,
          CST_CSOSN: doc.cst_csosn || '',
          CHAVE: doc.chave,
          N_NF: doc.n_nf,
          CNPJ_EMIT: doc.cnpj_emit,
          UF_EMIT: doc.uf_emit,
          CNPJ_DEST: doc.cnpj_dest,
          UF_DEST: doc.uf_dest,
          CFOP: doc.cfop,
          N_ITEM: doc.n_item,
          COD_ITEM: codItem,
          UNID_ITEM: doc.unid_item,
          QTD_SAIDA: doc.qtd_saida || 0,
        };
        registros.push(reg);
      } else if (tipoSaida === '1410') {
        const reg: Registro1410 = {
          REG: '1410',
          DT_DOC: doc.dt_doc,
          CST_CSOSN: doc.cst_csosn || '',
          CHAVE: doc.chave,
          N_NF: doc.n_nf,
          CNPJ_EMIT: doc.cnpj_emit,
          UF_EMIT: doc.uf_emit,
          CNPJ_DEST: doc.cnpj_dest,
          UF_DEST: doc.uf_dest,
          CFOP: doc.cfop,
          N_ITEM: doc.n_item,
          COD_ITEM: codItem,
          UNID_ITEM: doc.unid_item,
          QTD_SAIDA: doc.qtd_saida || 0,
        };
        registros.push(reg);
      }
    }
    
    // Devolucoes
    const docsDev = await this.db.prepare(`
      SELECT * FROM adrcst_documentos WHERE item_id = ? AND tipo_registro = ? ORDER BY dt_doc, n_nf
    `).bind(itemId, tipoDevolucao).all<DocumentoADRCST>();
    
    for (const doc of docsDev.results) {
      if (tipoDevolucao === '1320') {
        const reg: Registro1320 = {
          REG: '1320',
          DT_DOC: doc.dt_doc,
          CST_CSOSN: doc.cst_csosn || '',
          CHAVE: doc.chave,
          N_NF: doc.n_nf,
          CNPJ_EMIT: doc.cnpj_emit,
          UF_EMIT: doc.uf_emit,
          CNPJ_DEST: doc.cnpj_dest,
          UF_DEST: doc.uf_dest,
          CFOP: doc.cfop,
          N_ITEM: doc.n_item,
          COD_ITEM: codItem,
          UNID_ITEM: doc.unid_item,
          QTD_DEVOLVIDA: doc.qtd_devolvida_saida || 0,
        };
        registros.push(reg);
      } else if (tipoDevolucao === '1420') {
        const reg: Registro1420 = {
          REG: '1420',
          DT_DOC: doc.dt_doc,
          CST_CSOSN: doc.cst_csosn || '',
          CHAVE: doc.chave,
          N_NF: doc.n_nf,
          CNPJ_EMIT: doc.cnpj_emit,
          UF_EMIT: doc.uf_emit,
          CNPJ_DEST: doc.cnpj_dest,
          UF_DEST: doc.uf_dest,
          CFOP: doc.cfop,
          N_ITEM: doc.n_item,
          COD_ITEM: codItem,
          UNID_ITEM: doc.unid_item,
          QTD_DEVOLVIDA: doc.qtd_devolvida_saida || 0,
        };
        registros.push(reg);
      }
    }
  }

  private async contarDocumentos(itemId: string, tipos: string[]): Promise<number> {
    const placeholders = tipos.map(() => '?').join(',');
    const result = await this.db.prepare(`
      SELECT COUNT(*) as total FROM adrcst_documentos WHERE item_id = ? AND tipo_registro IN (${placeholders})
    `).bind(itemId, ...tipos).first<{ total: number }>();
    return result?.total || 0;
  }

  private async registrarLog(empresaId: string, apuracaoId: string | null, operacao: string, descricao: string): Promise<void> {
    await this.db.prepare(`
      INSERT INTO adrcst_logs (id, empresa_id, apuracao_id, operacao, descricao)
      VALUES (?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), empresaId, apuracaoId, operacao, descricao).run();
  }
}

// =============================================
// EXPORT
// =============================================

export function createADRCSTService(db: D1Database, r2: R2Bucket): ADRCSTService {
  return new ADRCSTService(db, r2);
}
