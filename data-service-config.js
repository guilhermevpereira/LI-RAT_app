/* ============================================================
   LI-RAT — Configuração de Serviço de Dados

   Este arquivo centraliza as configurações para envio de dados
   para serviços externos (Sheet Monkey, Google Apps Script, etc.)
   ============================================================ */

const DATA_SERVICE_CONFIG = {
  // Ativar/desativar envio automático de dados
  enabled: false,  // Mude para true quando configurar as URLs

  // Tipo de serviço: 'sheetmonkey', 'google-apps-script', 'custom'
  serviceType: 'sheetmonkey',

  // Configurações específicas do Sheet Monkey
  sheetMonkey: {
    detailedDataURL: '',  // Cole aqui a URL da planilha de dados detalhados
    summaryDataURL: ''     // Cole aqui a URL da planilha de resumo
  },

  // Configurações para Google Apps Script (futuro)
  googleAppsScript: {
    detailedDataURL: '',
    summaryDataURL: ''
  },

  // Configurações customizadas (futuro)
  custom: {
    detailedDataURL: '',
    summaryDataURL: '',
    headers: {},
    method: 'POST'
  }
};

/* ============================================================
   Funções de Envio de Dados
   ============================================================ */

// Enviar dados detalhados (trial-a-trial)
async function sendDetailedData(data) {
  if (!DATA_SERVICE_CONFIG.enabled) {
    console.log('Envio de dados desabilitado');
    return;
  }

  const serviceType = DATA_SERVICE_CONFIG.serviceType;
  const config = DATA_SERVICE_CONFIG[serviceType];

  if (!config.detailedDataURL) {
    console.warn(`URL de dados detalhados não configurada para ${serviceType}`);
    return;
  }

  try {
    // Envia cada linha de dados como um registro separado
    for (const row of data) {
      await fetch(config.detailedDataURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(row)
      });
    }
    console.log(`✓ Dados detalhados enviados com sucesso para ${serviceType}`);
  } catch (error) {
    console.error(`✗ Erro ao enviar dados detalhados para ${serviceType}:`, error);
  }
}

// Enviar resumo/métricas
async function sendSummaryData(summary) {
  if (!DATA_SERVICE_CONFIG.enabled) {
    console.log('Envio de dados desabilitado');
    return;
  }

  const serviceType = DATA_SERVICE_CONFIG.serviceType;
  const config = DATA_SERVICE_CONFIG[serviceType];

  if (!config.summaryDataURL) {
    console.warn(`URL de resumo não configurada para ${serviceType}`);
    return;
  }

  try {
    await fetch(config.summaryDataURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(summary)
    });
    console.log(`✓ Resumo enviado com sucesso para ${serviceType}`);
  } catch (error) {
    console.error(`✗ Erro ao enviar resumo para ${serviceType}:`, error);
  }
}

// Enviar todos os dados (detalhados + resumo)
async function sendAllData(detailedData, summaryData) {
  if (!DATA_SERVICE_CONFIG.enabled) {
    console.log('Envio automático de dados está desabilitado');
    return;
  }

  await Promise.all([
    sendDetailedData(detailedData),
    sendSummaryData(summaryData)
  ]);
}
