/* ============================================================
   LI-RAT — Language Independent Remote Associate Task
   Performance-only version (no AHA! / suddenness ratings)
   Adapted from Becker & Cabeza (2023), Behav Res Methods 55:85-102
   ============================================================ */

// Lista de IDs de participantes permitidos
const ALLOWED_PARTICIPANTS = [
  "P843K",
  "P109Z",
  "P552A",
  "P931F",
  "P204M",
  "P678R",
  "P415X",
  "P092L",
  "P384Q",
  "P726T",
  "P810W",
  "P593E",
  "P247H",
  "P631N",
  "P905V",
  "P158C",
  "P472J",
  "P369Y",
  "P084D",
  "P751S",
  "P296B",
  "P835G",
  "P517P",
  "P640U",
  "P928I"
];

const CONFIG = {
  imageFolder: 'img/',
  numTrials: 12,        // number of test items presented per participant
  shuffleTrials: false,  // pares de imagens na mesma ordem para todos

  practice: {
    id: 'practice',
    visImg: 'demo/stone.jpg',
    conImg: 'demo/stethoscope.jpg',
    solutions: ['coração']
  },

  // `solutions`: accepted answers (case- & accent-insensitive). [] = manual scoring.
  trials: [
    // { id: 1, visImg: 'pipesystem.jpg', conImg: 'mouse.jpg', solutions: [] },
    { id: 2, visImg: 'bowlingball.jpg', conImg: 'palmtree.jpg', solutions: [] },
    { id: 3, visImg: 'handcuf.jpg', conImg: 'eye.jpg', solutions: [] },
    { id: 4, visImg: 'peacock.jpg', conImg: 'ventilator.jpg', solutions: [] },
    { id: 5, visImg: 'necklace.jpg', conImg: 'dog.jpg', solutions: [] },
    { id: 6, visImg: 'cauliflower.jpg', conImg: 'cinecamera.jpg', solutions: [] },
    // { id: 7, visImg: 'gasbottle.jpg', conImg: 'fire.jpg', solutions: [] },
    { id: 8, visImg: 'hose.jpg', conImg: 'poison.jpg', solutions: [] },
    { id: 9, visImg: 'bowtie.jpg', conImg: 'bug.jpg', solutions: [] },
    { id: 10, visImg: 'bridge.jpg', conImg: 'weather.jpg', solutions: [] },
    { id: 11, visImg: 'dragonfly.jpg', conImg: 'doll.jpg', solutions: [] },
    { id: 12, visImg: 'ruler.png', conImg: 'pool.jpg', solutions: [] },
    { id: 13, visImg: 'pear.jpg', conImg: 'candle.jpg', solutions: [] },
    { id: 14, visImg: 'tower.jpg', conImg: 'flashlight.jpg', solutions: [] },
    // { id: 15, visImg: 'penguin.jpg', conImg: 'cross.jpg', solutions: [] }
  ],

  timings: {
    fixation: 600, pretrialPause: 500, beginResponseTime: 1000,
    responseTimeout: 45000, posttrialPause: 500
  }
};

const state = {
  subject: { id: '' }, startedAt: null,
  trialList: [], isPractice: false, data: [],
  blockNum: 0, blockCode: '', trialNum: 0, current: null
};

const $main = document.getElementById('main');
const $progress = document.getElementById('progress');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function nowISO() { return new Date().toISOString(); }
function nowDate() { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); }
function nowTime() { return new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Sao_Paulo' }); }
function normalize(str) { return String(str || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function isCorrectSolution(typed, accepted) {
  if (!accepted || accepted.length === 0) return null;
  const t = normalize(typed);
  if (!t) return false;
  return accepted.some(a => { const an = normalize(a); return t === an || t === an + 's' || an === t + 's'; });
}
function recordTrial(row) {
  state.data.push({
    date: nowDate(), time: nowTime(),
    subject: state.subject.id,
    blocknum: state.blockNum, blockcode: state.blockCode, trialnum: state.trialNum, ...row
  });
}
function render(html) { $main.innerHTML = html; }
function setProgress(text) { $progress.textContent = text || ''; }
function imgOrPlaceholder(filename) {
  const url = CONFIG.imageFolder + filename;
  return `<img src="${url}" alt="${filename}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
    <div class="placeholder" style="display:none">Image not found<code>${filename}</code></div>`;
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function buildTrialList() {
  const pool = CONFIG.shuffleTrials ? shuffle(CONFIG.trials) : [...CONFIG.trials];
  const n = Math.min(CONFIG.numTrials, pool.length);
  return pool.slice(0, n);
}

function screen_welcome() {
  setProgress('');
  const planned = Math.min(CONFIG.numTrials, CONFIG.trials.length);
  render(`
    <div class="screen">
      <h1>Tarefa de <span class="accent">Associação Remota</span> Independente de Linguagem</h1>
      <p class="muted" style="margin-bottom:24px">Uma avaliação de criatividade baseada em associações visual-conceituais</p>
      <div class="content center">
        <p>Você resolverá uma série de problemas de associação visual. Sua precisão e tempos de resposta serão registrados como medida de resolução criativa de problemas.</p>
        <p class="muted">O experimento deve levar cerca de 12 minutos.</p>
      </div>
      <div class="setup-form">
        <label for="subjId">ID do Participante</label>
        <input id="subjId" type="text" autocomplete="off" placeholder="ex: P001">
        <p id="subjError" style="color:#e05;margin:6px 0 0;font-size:14px;min-height:1em"></p>
      </div>
      <button class="btn btn-primary" id="startBtn">Começar</button>
      <p class="ref">
        Adapted from Becker, M., &amp; Cabeza, R. (2023). <em>Assessing creativity independently of language: A language-independent remote associate task (LI-RAT)</em>. Behavior Research Methods, 55, 85–102.
        <a href="https://doi.org/10.3758/s13428-021-01773-5" target="_blank">doi.org/10.3758/s13428-021-01773-5</a>
        </br>
      </p>
    </div>`);
  const $subjId = document.getElementById('subjId');
  $subjId.focus();
  $subjId.addEventListener('blur', () => { document.getElementById('subjError').textContent = ''; });
  $subjId.addEventListener('input', () => { document.getElementById('subjError').textContent = ''; });
  document.getElementById('startBtn').addEventListener('click', () => {
    const id = document.getElementById('subjId').value.trim().toUpperCase();

    const $err = document.getElementById('subjError');
    if (!id) {
      $err.textContent = 'Por favor, insira o ID do participante.';
      document.getElementById('subjId').focus();
      return;
    }
    if (!ALLOWED_PARTICIPANTS.includes(id)) {
      $err.textContent = 'ID de participante inválido. Verifique o ID fornecido e tente novamente.';
      document.getElementById('subjId').value = '';
      document.getElementById('subjId').focus();
      return;
    }
    $err.textContent = '';

    state.subject.id = id;
    state.startedAt = nowISO();
    state.trialList = buildTrialList();
    runIntro();
  });
}

async function runIntro() {
  const pages = [
    { title: 'Bem-vindo(a)', body: `
        <p>Nesta atividade, você verá dois objetos na tela ao mesmo tempo. Sua tarefa é encontrar um terceiro objeto que se conecte aos dois apresentados — mas de formas diferentes.</p>
        <p>Um dos objetos está relacionado à <strong>aparência</strong> do objeto que você deve encontrar: os dois compartilham algo visual, como formato, cor ou uma característica física específica.</p>
        <p>O outro objeto está relacionado ao <strong>significado</strong> do objeto que você deve encontrar: os dois pertencem à mesma categoria, têm a mesma função ou aparecem juntos em contextos similares.</p>` },
    { title: 'Exemplo 1', body: `
        <p>Veja as imagens de um <strong>espartilho</strong> e de um <strong>cronômetro</strong>:</p>
        <div style="display:flex;justify-content:center;align-items:center;gap:20px;margin:24px 0">
          <div style="text-align:center">
            <div style="width:180px;height:180px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;background:var(--input-bg)">
              <img src="img/demo/corset.jpg" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display='none';">
            </div>
            <p style="margin-top:8px;font-size:13px;color:var(--muted)">Espartilho</p>
          </div>
          <div style="text-align:center">
            <div style="width:180px;height:180px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;background:var(--input-bg)">
              <img src="img/demo/stopwatch.jpg" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display='none';">
            </div>
            <p style="margin-top:8px;font-size:13px;color:var(--muted)">Cronômetro</p>
          </div>
          <div style="font-size:32px;color:var(--accent);font-weight:300;margin:0 10px">→</div>
          <div style="text-align:center">
            <div style="width:180px;height:180px;border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;background:var(--input-bg)">
              <img src="img/demo/hourglass.png" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display='none';">
            </div>
            <p style="margin-top:8px;font-size:13px;color:var(--accent);font-weight:500">RESPOSTA: Ampulheta</p>
          </div>
        </div>
        <ul>
          <li><strong>O espartilho</strong> tem um formato afunilado no centro, com a parte superior e inferior mais largas — uma forma muito característica.</li>
          <li><strong>O cronômetro</strong> serve para medir o tempo — essa é sua função principal.</li>
        </ul>
        <p>O objeto que conecta os dois é a <span style="color:var(--accent);font-weight:500">ampulheta</span>: ela tem o mesmo formato afunilado do espartilho e, assim como o cronômetro, também mede o tempo.</p>` },
    { title: 'Exemplo 2', body: `
        <p>Veja as imagens de uma <strong>bala de projétil</strong> e de um <strong>satélite</strong>:</p>
        <div style="display:flex;justify-content:center;align-items:center;gap:20px;margin:24px 0">
          <div style="text-align:center">
            <div style="width:180px;height:180px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;background:var(--input-bg)">
              <img src="img/demo/bullet.jpg" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display='none';">
            </div>
            <p style="margin-top:8px;font-size:13px;color:var(--muted)">Bala de projétil</p>
          </div>
          <div style="text-align:center">
            <div style="width:180px;height:180px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;background:var(--input-bg)">
              <img src="img/demo/satellite.jpg" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display='none';">
            </div>
            <p style="margin-top:8px;font-size:13px;color:var(--muted)">Satélite</p>
          </div>
          <div style="font-size:32px;color:var(--accent);font-weight:300;margin:0 10px">→</div>
          <div style="text-align:center">
            <div style="width:180px;height:180px;border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;background:var(--input-bg)">
              <img src="img/demo/rocket.png" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display='none';">
            </div>
            <p style="margin-top:8px;font-size:13px;color:var(--accent);font-weight:500">RESPOSTA: Foguete</p>
          </div>
        </div>
        <ul>
          <li><strong>A bala de projétil</strong> tem um formato alongado, com a ponta afinada e o corpo cilíndrico — uma silhueta muito característica.</li>
          <li><strong>O satélite</strong> é um equipamento enviado ao espaço para orbitar a Terra — lançá-lo é sua razão de existir.</li>
        </ul>
        <p>O objeto que conecta os dois é o <span style="color:var(--accent);font-weight:500">foguete</span>: ele tem o mesmo formato afilado e alongado da bala de projétil e, assim como o satélite sugere, é o veículo usado para levar cargas ao espaço.</p>` },
    { title: 'Como Responder', body: `
        <p>Quando encontrar o objeto, pressione <kbd>Enter</kbd> e digite o nome dele no campo que aparecerá na tela.</p>
        <p>Você terá um tempo limitado (45 segundos) para cada par de imagens. Se não conseguir encontrar uma resposta, o próximo par será apresentado automaticamente.</p>
        <p>Não há problema em não encontrar todos os objetos — algumas combinações são intencionalmente mais difíceis do que outras.</p>
        <p style="margin-top:24px">Você verá dois exemplos práticos para se familiarizar com a tarefa. Eles não contam para o resultado.</p>` }
  ];
  let i = 0;
  while (i < pages.length) {
    setProgress(`Instruções  ${i + 1} / ${pages.length}`);
    const direction = await showInstruction(pages[i].title, pages[i].body, i > 0);
    if (direction === 'back' && i > 0) {
      i--;
    } else {
      i++;
    }
  }
  state.blockNum = 1; state.blockCode = 'practice'; state.isPractice = true; state.trialNum = 0;
  await runTrial(CONFIG.practice);
  await runPostIntro();
}

function showInstruction(title, bodyHTML, showBackButton = false) {
  return new Promise(resolve => {
    render(`<div class="screen">
      <h1 style="font-size:calc(clamp(28px,4vw,42px) * 0.9)">${title}</h1>
      <div class="content" style="text-align:justify;font-size:calc(clamp(15px,1.4vw,18px) * 0.9)">${bodyHTML}</div>
      <div style="display:flex;gap:16px;justify-content:center;margin-top:24px">
        ${showBackButton ? '<button class="btn" id="backBtn" style="font-size:calc(14px * 0.9);padding:calc(12px * 0.9) calc(32px * 0.9)">Voltar</button>' : ''}
        <button class="btn btn-primary" id="continueBtn" style="font-size:calc(14px * 0.9);padding:calc(12px * 0.9) calc(32px * 0.9)">Continuar</button>
      </div>
    </div>`);

    function cleanup() {
      document.removeEventListener('keydown', onKey);
      const backBtn = document.getElementById('backBtn');
      const continueBtn = document.getElementById('continueBtn');
      if (backBtn) backBtn.removeEventListener('click', onBack);
      if (continueBtn) continueBtn.removeEventListener('click', onContinue);
    }

    function onKey(e) {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        cleanup();
        resolve('forward');
      }
    }

    function onBack() {
      cleanup();
      resolve('back');
    }

    function onContinue() {
      cleanup();
      resolve('forward');
    }

    document.addEventListener('keydown', onKey);
    const backBtn = document.getElementById('backBtn');
    const continueBtn = document.getElementById('continueBtn');
    if (backBtn) backBtn.addEventListener('click', onBack);
    if (continueBtn) continueBtn.addEventListener('click', onContinue);
  });
}

async function runPostIntro() {
  const pages = [
    { title: 'Solução do Treino', body: `
        <p>A solução é <span style="color:var(--accent);font-weight:500">CORAÇÃO</span>: a pedra tem formato similar ao de um coração, e o estetoscópio é usado para examinar o coração.</p>
        <ul>
          <li>A <strong>pedra</strong> é visualmente similar mas conceitualmente não relacionada a <em>coração</em>.</li>
          <li>O <strong>estetoscópio</strong> é conceitualmente relacionado mas visualmente diferente de <em>coração</em>.</li>
        </ul>` },
    { title: 'Regra de Posicionamento', body: `
        <p style="text-align:center;font-size:20px;margin:32px 0">O objeto <span style="color:var(--accent)">visualmente</span> similar é sempre apresentado à <strong>ESQUERDA</strong>.</p>
        <p style="text-align:center;font-size:20px;margin:32px 0">O objeto <span style="color:var(--accent)">conceitualmente</span> relacionado é sempre apresentado à <strong>DIREITA</strong>.</p>` },

    { title: 'Notas Finais', body: `
        <p>A solução é sempre um <strong>substantivo concreto e comum</strong>.</p>
        <p>Verbos, adjetivos ou conceitos abstratos (ex: <em>caminhar</em>, <em>bonito</em>, <em>alegria</em>) não contam.</p>
        <p>O exercício contém <strong>${state.trialList.length} problemas</strong>.</p>
        <p style="margin-top:24px"><strong>Importante:</strong> Não recarregue a página após iniciar o teste. Caso isso aconteça, você perderá todo o progresso e terá que recomeçar.</p>
        <p style="margin-top:32px;text-align:center">Pronto?</p>` }
  ];
  let i = 0;
  while (i < pages.length) {
    setProgress(`Instruções  ${i + 1} / ${pages.length}`);
    const direction = await showInstruction(pages[i].title, pages[i].body, i > 0);
    if (direction === 'back' && i > 0) {
      i--;
    } else {
      i++;
    }
  }
  state.blockNum = 2; state.blockCode = 'testphase'; state.isPractice = false; state.trialNum = 0;
  for (const trial of state.trialList) { state.trialNum++; await runTrial(trial); }
  showEnd();
}

async function runTrial(trial) {
  state.current = trial;
  setProgress(state.isPractice ? 'Tentativa de treino' : `Tentativa  ${state.trialNum} / ${state.trialList.length}`);
  await delay(CONFIG.timings.pretrialPause);
  await fixation();
  const stimResult = await stimulus(trial);

  // Só registra dados se NÃO for treino
  if (!state.isPractice) {
    recordTrial({
      trialcode: 'stimulus_test',
      stimulusitem: `vis:${trial.visImg};con:${trial.conImg}`, stimulusnumber: trial.id,
      response: stimResult.responded ? 'Enter' : 'timeout', responded: stimResult.responded ? 1 : 0,
      rt_to_signal: Math.round(stimResult.latency), solution_typed: '', correct: '', rt_typing: ''
    });
  }

  if (stimResult.responded) {
    const sol = await solutionInput();
    const correct = isCorrectSolution(sol.text, trial.solutions);

    // Só registra dados se NÃO for treino
    if (!state.isPractice) {
      recordTrial({
        trialcode: 'solution_test',
        stimulusitem: trial.visImg + '+' + trial.conImg, stimulusnumber: trial.id,
        response: '', responded: 1, rt_to_signal: Math.round(stimResult.latency),
        solution_typed: sol.text, correct: correct === null ? '' : (correct ? 1 : 0), rt_typing: Math.round(sol.latency)
      });
    }
  }
  await delay(CONFIG.timings.posttrialPause);
}

function fixation() {
  return new Promise(resolve => { render(`<div class="stage"><div class="fixation">+</div></div>`); setTimeout(resolve, CONFIG.timings.fixation); });
}

function stimulus(trial) {
  return new Promise(resolve => {
    render(`<div class="stage">
        <div class="countdown" id="countdown">45</div>
        <div class="task-label">Qual objeto é:
          <p><span class="num">1)</span> visualmente similar ao objeto à esquerda, e </p>
          <p><span class="num">2)</span> conceitualmente relacionado ao objeto à direita?</div></p>
        <div class="pic-pair">
          <div class="pic-slot">${imgOrPlaceholder(trial.visImg)}<span class="pic-label">visual &mdash; esquerda</span></div>
          <div class="pic-slot">${imgOrPlaceholder(trial.conImg)}<span class="pic-label">conceitual &mdash; direita</span></div>
        </div>
        <div class="response-prompt">Pressione Enter quando tiver uma solução</div>
        <div class="abort-hint">Pressione Esc para cancelar</div>
      </div>`);
    const startTime = performance.now();
    const acceptStart = startTime + CONFIG.timings.beginResponseTime;
    const totalMs = CONFIG.timings.responseTimeout;
    let resolved = false, timeoutId, intervalId;
    const $cd = document.getElementById('countdown');
    function tick() {
      const remaining = Math.max(0, totalMs - (performance.now() - startTime));
      const s = Math.ceil(remaining / 1000);
      if ($cd) { $cd.textContent = s; if (s <= 10) $cd.classList.add('warn'); }
    }
    intervalId = setInterval(tick, 250);
    function finish(result) { if (resolved) return; resolved = true; clearTimeout(timeoutId); clearInterval(intervalId); document.removeEventListener('keydown', onKey); resolve(result); }
    function onKey(e) {
      if (e.code === 'Escape') {
        if (confirm('Tem certeza que deseja cancelar o experimento? Você será redirecionado para a página inicial e perderá todo o progresso.')) {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          document.removeEventListener('keydown', onKey);
          // Reiniciar estado
          state.subject = { id: '' };
          state.startedAt = null;
          state.trialList = [];
          state.isPractice = false;
          state.data = [];
          state.blockNum = 0;
          state.blockCode = '';
          state.trialNum = 0;
          state.current = null;
          // Voltar para a página inicial
          screen_welcome();
        }
        return;
      }
      if ((e.code === 'Enter' || e.code === 'NumpadEnter') && performance.now() >= acceptStart) finish({ responded: true, latency: performance.now() - startTime });
    }
    document.addEventListener('keydown', onKey);
    timeoutId = setTimeout(() => finish({ responded: false, latency: totalMs }), totalMs);
  });
}

function solutionInput() {
  return new Promise(resolve => {
    render(`<div class="screen solution-screen"><p class="prompt">Por favor, digite sua solução</p><input id="solInput" type="text" autocomplete="off" maxlength="40"><p class="hint">Pressione Enter para confirmar</p></div>`);
    const inp = document.getElementById('solInput'); inp.focus();
    const start = performance.now();
    function onKey(e) { if ((e.code === 'Enter' || e.code === 'NumpadEnter') && inp.value.trim()) { document.removeEventListener('keydown', onKey); resolve({ text: inp.value.trim(), latency: performance.now() - start }); } }
    document.addEventListener('keydown', onKey);
  });
}

async function showEnd() {
  setProgress('Completo');
  const stats = computeStats();
  const hasScoring = stats.scoredTrials > 0;

  // Preparar e enviar dados automaticamente
  const summary = {
    date: nowDate(),
    time: nowTime(),
    subject: state.subject.id,
    started_at: state.startedAt,
    finished_at: nowISO(),
    total_trials: stats.total,
    responded: stats.responded,
    timeouts: stats.timeouts,
    correct: stats.correct,
    scored_trials: stats.scoredTrials,
    accuracy_pct: stats.scoredTrials > 0 ? Math.round(100 * stats.correct / stats.scoredTrials) : '',
    mean_rt_all: stats.meanRtAll,
    sd_rt_all: stats.sdRtAll,
    mean_rt_correct: stats.meanRtCorrect,
    sd_rt_correct: stats.sdRtCorrect,
    acc_rt_quotient: stats.accRtQuotient,
    mean_typing_time: stats.meanTyping
  };

  await sendAllData(state.data, summary);

  render(`<div class="screen">
      <h1><span class="accent">Obrigado</span></h1>
      <p>Você completou a tarefa.</p>
      ${hasScoring ? '' : `<div class="scoring-banner"><strong>Nota:</strong> a pontuação automática não está configurada para estes itens (o campo <code>solutions</code> está vazio). A precisão precisará ser codificada manualmente a partir da coluna <code>solution_typed</code> dos dados exportados.</div>`}
      <div class="stat-grid">
        <div class="stat"><div class="label">Tentativas</div><div class="value">${stats.total}</div></div>
        <div class="stat"><div class="label">Respondidas</div><div class="value">${stats.responded}</div><div class="sub">${pct(stats.responded, stats.total)}</div></div>
        <div class="stat"><div class="label">Timeouts</div><div class="value">${stats.timeouts}</div><div class="sub">${pct(stats.timeouts, stats.total)}</div></div>
        ${hasScoring ? `<div class="stat"><div class="label">Precisão</div><div class="value">${pct(stats.correct, stats.scoredTrials)}</div><div class="sub">${stats.correct} / ${stats.scoredTrials}</div></div>` : ''}
        <div class="stat"><div class="label">TR médio (respondidas)</div><div class="value">${stats.meanRtAll}<span style="font-size:14px"> ms</span></div><div class="sub">DP ${stats.sdRtAll}</div></div>
        ${hasScoring ? `<div class="stat"><div class="label">TR médio (corretas)</div><div class="value">${stats.meanRtCorrect}<span style="font-size:14px"> ms</span></div><div class="sub">DP ${stats.sdRtCorrect}</div></div>
        <div class="stat"><div class="label">Quociente Prec / TR</div><div class="value">${stats.accRtQuotient}</div><div class="sub">×10⁻⁴ por ms</div></div>` : ''}

      </div>
      <div class="data-actions">
        <button class="btn btn-primary" id="dlCsv">Baixar CSV</button>
        <button class="btn" id="dlJson">Baixar JSON</button>
      </div>
      <p class="muted" style="margin-top:32px">Participante: ${state.subject.id}</p>
    </div>`);
  document.getElementById('dlCsv').addEventListener('click', downloadCSV);
  document.getElementById('dlJson').addEventListener('click', downloadJSON);
}

function pct(n, d) { if (!d) return '—'; return Math.round(100 * n / d) + '%'; }
function mean(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function sd(arr) { if (arr.length < 2) return 0; const m = mean(arr); return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1)); }

function computeStats() {
  const stim = state.data.filter(r => r.trialcode === 'stimulus_test');
  const sol = state.data.filter(r => r.trialcode === 'solution_test');
  const total = stim.length;
  const responded = stim.filter(r => r.responded === 1).length;
  const timeouts = total - responded;
  const rtAll = stim.filter(r => r.responded === 1).map(r => r.rt_to_signal);
  const correctSols = sol.filter(r => r.correct === 1);
  const rtCorrect = correctSols.map(r => r.rt_to_signal);
  const correct = correctSols.length;
  const scoredTrials = sol.filter(r => r.correct === 1 || r.correct === 0).length;
  const typingTimes = sol.map(r => r.rt_typing).filter(v => typeof v === 'number');
  const meanRtAll = Math.round(mean(rtAll));
  const meanRtCorrect = Math.round(mean(rtCorrect));
  const accRtQ = (scoredTrials > 0 && meanRtCorrect > 0) ? ((correct / scoredTrials) / meanRtCorrect * 10000).toFixed(2) : '—';
  return { total, responded, timeouts, correct, scoredTrials, meanRtAll, sdRtAll: Math.round(sd(rtAll)), meanRtCorrect, sdRtCorrect: Math.round(sd(rtCorrect)), accRtQuotient: accRtQ, meanTyping: Math.round(mean(typingTimes)) };
}

function downloadCSV() {
  const cols = ['date','time','subject','blocknum','blockcode','trialnum','trialcode','stimulusnumber','stimulusitem','response','responded','rt_to_signal','solution_typed','correct','rt_typing'];
  const header = cols.join(',');
  const rows = state.data.map(r => cols.map(c => { const v = r[c] === undefined ? '' : String(r[c]); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','));
  const csv = [header, ...rows].join('\n');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `LIRAT_${state.subject.id}_${Date.now()}.csv`);
}

function downloadJSON() {
  const payload = { experiment: 'LI-RAT (performance-only)', reference: 'Becker & Cabeza (2023), Behavior Research Methods 55, 85-102', subject: state.subject, startedAt: state.startedAt, finishedAt: nowISO(), config: { numTrials: CONFIG.numTrials, shuffleTrials: CONFIG.shuffleTrials, timings: CONFIG.timings, practice: CONFIG.practice, trials: CONFIG.trials }, summary: computeStats(), data: state.data };
  triggerDownload(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `LIRAT_${state.subject.id}_${Date.now()}.json`);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}

screen_welcome();
