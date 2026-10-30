/**
 * 鲁锦生成艺术系统主控制器 (Lujin Generative Studio Main Controller)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化核心模块
  const mainCanvas = document.getElementById('mainCanvas');
  const mockupCanvas = document.getElementById('mockupCanvas');

  const engine = new LujinEngine({
    cols: 128,
    rows: 128,
    patternType: 'da_he_dou',
    paletteId: 'qilu'
  });

  const renderer = new LujinRenderer(mainCanvas);
  const mockup = new LujinMockup(mockupCanvas);
  const audio = new LoomAudio();

  let isWeavingAnim = false;
  let animFrameId = null;

  // 2. 界面元素缓存
  const elPatternSelect = document.getElementById('patternSelect');
  const elPaletteSelect = document.getElementById('paletteSelect');
  const elDensitySelect = document.getElementById('densitySelect');
  const elWarpStyleSelect = document.getElementById('warpStyleSelect');
  const elSeedInput = document.getElementById('seedInput');

  const btnGenerate = document.getElementById('btnGenerate');
  const btnMutate = document.getElementById('btnMutate');
  const btnAnimateWeave = document.getElementById('btnAnimateWeave');
  const btnShufflePalette = document.getElementById('btnShufflePalette');
  const btnAudioToggle = document.getElementById('btnAudioToggle');

  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnResetView = document.getElementById('btnResetView');

  const btnExportPNG = document.getElementById('btnExportPNG');
  const btnExportSVG = document.getElementById('btnExportSVG');
  const btnExportJSON = document.getElementById('btnExportJSON');

  const tabButtons = document.querySelectorAll('.view-tab-btn');
  const viewPanels = {
    fabric: document.getElementById('panelFabric'),
    draft: document.getElementById('panelFabric'), // 共用主画布，切换渲染器模式
    mockup: document.getElementById('panelMockup'),
    ref: document.getElementById('panelRef')
  };

  const mockupTypeButtons = document.querySelectorAll('.mockup-type-btn');

  // 信息面板元素
  const infoTitle = document.getElementById('infoTitle');
  const infoHeritageName = document.getElementById('infoHeritageName');
  const infoMeaning = document.getElementById('infoMeaning');
  const infoTech = document.getElementById('infoTech');
  const infoShafts = document.getElementById('infoShafts');
  const infoThreads = document.getElementById('infoThreads');
  const paletteSwatches = document.getElementById('paletteSwatches');

  // 3. 核心生成与刷新函数
  function updatePattern(keepSeed = false) {
    if (isWeavingAnim) {
      stopWeavingAnimation();
    }

    if (!keepSeed) {
      engine.seed = Math.floor(Math.random() * 9000000) + 1000000;
      elSeedInput.value = engine.seed;
    } else {
      engine.seed = parseInt(elSeedInput.value, 10) || 123456;
    }

    engine.patternType = elPatternSelect.value;
    engine.paletteId = elPaletteSelect.value;
    engine.cols = parseInt(elDensitySelect.value, 10) || 128;
    engine.rows = engine.cols;
    engine.warpPaletteStyle = elWarpStyleSelect.value;
    engine.weftPaletteStyle = elWarpStyleSelect.value;

    const data = engine.generate();
    renderer.setData(data);
    mockup.updatePattern(data);

    updateInfoPanel(data);
  }

  function updateInfoPanel(data) {
    const { meta, palette, loomDraft, cols, rows } = data;
    infoTitle.textContent = meta.title;
    infoHeritageName.textContent = meta.heritageName;
    infoMeaning.textContent = meta.meaning;
    
    // 技术标签
    infoTech.innerHTML = meta.techPoints.map(t => 
      `<span class="px-2 py-0.5 text-xs rounded bg-amber-950/40 text-amber-300 border border-amber-700/30">${t}</span>`
    ).join('');

    infoShafts.textContent = `${loomDraft.numShafts}综 多踏板木织机`;
    infoThreads.textContent = `经 ${cols} 根 × 纬 ${rows} 根 (${loomDraft.reedDensity})`;

    // 色谱色标展示
    paletteSwatches.innerHTML = palette.colors.map(c => 
      `<div class="w-6 h-6 rounded-md shadow-sm border border-white/20 transition-transform hover:scale-110" style="background-color: ${c}" title="${c}"></div>`
    ).join('');
  }

  // 4. 模拟飞梭织造动画 (Row by row simulation)
  function startWeavingAnimation() {
    if (isWeavingAnim) {
      stopWeavingAnimation();
      return;
    }

    isWeavingAnim = true;
    btnAnimateWeave.classList.add('bg-amber-600', 'text-white');
    btnAnimateWeave.innerHTML = `<span>⏸ 停止织造</span>`;

    // 确保切换到织物视图
    switchTab('fabric');

    let curRow = 0;
    const totalRows = engine.rows;
    renderer.animationRow = 0;

    function step() {
      if (!isWeavingAnim) return;

      curRow += 2; // 每次两梭（往返一穿）
      renderer.animationRow = curRow;
      renderer.render();

      if (curRow % 8 === 0) {
        audio.playShuttleBeat();
      }

      if (curRow < totalRows) {
        animFrameId = requestAnimationFrame(step);
      } else {
        stopWeavingAnimation();
      }
    }

    animFrameId = requestAnimationFrame(step);
  }

  function stopWeavingAnimation() {
    isWeavingAnim = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    renderer.animationRow = -1;
    renderer.render();
    btnAnimateWeave.classList.remove('bg-amber-600', 'text-white');
    btnAnimateWeave.innerHTML = `<span>🧵 模拟飞梭织造</span>`;
  }

  // 5. 视图标签页切换
  function switchTab(targetMode) {
    tabButtons.forEach(btn => {
      if (btn.dataset.mode === targetMode) {
        btn.classList.add('bg-amber-500/20', 'text-amber-300', 'border-amber-500/50');
        btn.classList.remove('text-neutral-400', 'border-transparent');
      } else {
        btn.classList.remove('bg-amber-500/20', 'text-amber-300', 'border-amber-500/50');
        btn.classList.add('text-neutral-400', 'border-transparent');
      }
    });

    // 隐藏所有面板
    Object.values(viewPanels).forEach(p => p && p.classList.add('hidden'));

    if (targetMode === 'fabric') {
      viewPanels.fabric.classList.remove('hidden');
      renderer.setMode('fabric');
      renderer.resize();
    } else if (targetMode === 'draft') {
      viewPanels.fabric.classList.remove('hidden');
      renderer.setMode('draft');
      renderer.resize();
    } else if (targetMode === 'mockup') {
      viewPanels.mockup.classList.remove('hidden');
      mockup.resize();
    } else if (targetMode === 'ref') {
      viewPanels.ref.classList.remove('hidden');
    }
  }

  // 6. 事件绑定
  elPatternSelect.addEventListener('change', () => updatePattern(false));
  elPaletteSelect.addEventListener('change', () => updatePattern(true));
  elDensitySelect.addEventListener('change', () => updatePattern(true));
  elWarpStyleSelect.addEventListener('change', () => updatePattern(true));

  elSeedInput.addEventListener('change', () => updatePattern(true));

  btnGenerate.addEventListener('click', () => updatePattern(false));

  btnMutate.addEventListener('click', () => {
    // 微调变异：轻微调整种子与经纬节律
    engine.seed = (engine.seed * 37 + 101) % 9999999;
    elSeedInput.value = engine.seed;
    updatePattern(true);
  });

  btnShufflePalette.addEventListener('click', () => {
    // 随机置换当前色板的颜色顺序
    const palette = PALETTES[engine.paletteId];
    if (palette) {
      palette.colors.sort(() => Math.random() - 0.5);
      updatePattern(true);
    }
  });

  btnAnimateWeave.addEventListener('click', startWeavingAnimation);

  btnAudioToggle.addEventListener('click', () => {
    const isMuted = !audio.toggle();
    btnAudioToggle.innerHTML = isMuted 
      ? `<span>🔇 织机音效: 关</span>` 
      : `<span class="text-amber-300">🔊 织机音效: 开</span>`;
  });

  // 缩放操作
  btnZoomIn.addEventListener('click', () => renderer.setZoom(renderer.zoom * 1.25));
  btnZoomOut.addEventListener('click', () => renderer.setZoom(renderer.zoom / 1.25));
  btnResetView.addEventListener('click', () => {
    renderer.resetViewport();
    renderer.render();
  });

  // 标签页切换事件
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.mode));
  });

  // 文创类型切换
  mockupTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      mockupTypeButtons.forEach(b => {
        b.classList.remove('bg-amber-600', 'text-white');
        b.classList.add('bg-neutral-800', 'text-neutral-300');
      });
      btn.classList.add('bg-amber-600', 'text-white');
      btn.classList.remove('bg-neutral-800', 'text-neutral-300');
      mockup.setType(btn.dataset.type);
    });
  });

  // 导出逻辑
  btnExportPNG.addEventListener('click', () => {
    const dataUrl = renderer.exportHiRes(2);
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `鲁锦纹样_${engine.patternType}_${engine.seed}.png`;
    a.click();
  });

  btnExportSVG.addEventListener('click', () => {
    const svgStr = renderer.exportSVG();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `鲁锦矢量图_${engine.patternType}_${engine.seed}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnExportJSON.addEventListener('click', () => {
    if (!engine.data) return;
    const exportData = {
      name: engine.data.meta.title,
      heritageName: engine.data.meta.heritageName,
      palette: engine.data.palette.name,
      seed: engine.seed,
      cols: engine.cols,
      rows: engine.rows,
      loomDraft: {
        numShafts: engine.data.loomDraft.numShafts,
        reedDensity: engine.data.loomDraft.reedDensity,
        weftDensity: engine.data.loomDraft.weftDensity
      },
      warpColors: engine.data.warpColors,
      weftColors: engine.data.weftColors,
      generatedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `鲁锦织机配方_${engine.patternType}_${engine.seed}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // 窗口大小变动
  window.addEventListener('resize', () => {
    renderer.resize();
    mockup.resize();
  });

  // 初始化第一次渲染
  setTimeout(() => {
    renderer.resize();
    mockup.resize();
    updatePattern(false);
  }, 100);
});
