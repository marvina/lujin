/**
 * 鲁锦高保真织物渲染引擎 (High-Fidelity Textile Canvas Renderer)
 * 具备经纬物理圆柱光影、纤维毛羽微噪、立体浮长高光及组织图多视口切换
 */

class LujinRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = 'fabric'; // 'fabric' (布料实景) | 'draft' (组织图)

    // 视口与交互
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // 织造动画进度 (-1 表示完整渲染, 0..rows 表示正在织造)
    this.animationRow = -1;

    this.data = null;
    this.bindEvents();
  }

  setData(data) {
    this.data = data;
    this.resetViewport();
    this.render();
  }

  setMode(mode) {
    this.mode = mode;
    this.render();
  }

  setZoom(zoom) {
    this.zoom = Math.max(0.4, Math.min(6.0, zoom));
    this.render();
  }

  resetViewport() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
  }

  bindEvents() {
    const el = this.canvas;

    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
      el.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.dragStartX;
      this.panY = e.clientY - this.dragStartY;
      this.render();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      el.style.cursor = 'grab';
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.4, Math.min(6.0, this.zoom * zoomFactor));

      // 以鼠标为中心缩放
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
      this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;

      this.render();
    }, { passive: false });

    // 移动端 Touch 支持
    let touchDist = 0;
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.dragStartX = e.touches[0].clientX - this.panX;
        this.dragStartY = e.touches[0].clientY - this.panY;
      } else if (e.touches.length === 2) {
        touchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        this.panX = e.touches[0].clientX - this.dragStartX;
        this.panY = e.touches[0].clientY - this.dragStartY;
        this.render();
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchDist;
        this.zoom = Math.max(0.4, Math.min(6.0, this.zoom * factor));
        touchDist = dist;
        this.render();
      }
    });

    el.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // 双击重置
    el.addEventListener('dblclick', () => {
      this.resetViewport();
      this.render();
    });
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  render() {
    if (!this.data) return;

    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // 背景底色
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(0, 0, w, h);

    // 变换视口
    ctx.translate(w / 2 + this.panX, h / 2 + this.panY);
    ctx.scale(this.zoom, this.zoom);

    if (this.mode === 'fabric') {
      this.renderFabricView(ctx);
    } else {
      this.renderDraftView(ctx);
    }

    ctx.restore();
  }

  /**
   * 渲染真实织物视角 (物理光影与棉线交织)
   */
  renderFabricView(ctx) {
    const { cols, rows, matrix, warpColors, weftColors } = this.data;
    
    // 计算单元格物理尺寸
    const baseSize = 6.5; // 每根纱线的像素基准宽度
    const totalW = cols * baseSize;
    const totalH = rows * baseSize;
    const startX = -totalW / 2;
    const startY = -totalH / 2;

    const maxRow = this.animationRow >= 0 ? this.animationRow : rows;

    // 1. 织物背景暗影与边缘须边效果
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(startX - 8, startY - 8, totalW + 16, totalH + 16);

    // 2. 逐行逐列渲染经纬交错
    // 为了极致性能与光影真实感，采用分段笔刷法
    for (let y = 0; y < maxRow; y++) {
      const weftCol = weftColors[y];
      const posY = startY + y * baseSize;

      for (let x = 0; x < cols; x++) {
        const warpCol = warpColors[x];
        const posX = startX + x * baseSize;
        const cellType = matrix[y][x]; // 0=纬浮, 1=经浮, 2=经浮高光

        if (cellType === 0) {
          // 纬线在上 (横向连续圆弧)
          ctx.fillStyle = weftCol;
          ctx.fillRect(posX - 0.5, posY, baseSize + 1, baseSize);

          // 纬线横向圆柱高光与凹槽阴影
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(posX, posY + baseSize * 0.25, baseSize, baseSize * 0.4);

          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(posX, posY + baseSize * 0.85, baseSize, baseSize * 0.15);
          ctx.fillRect(posX, posY, baseSize, baseSize * 0.12);

          // 两侧下压经线的落差阴影
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(posX, posY, 1.2, baseSize);
          ctx.fillRect(posX + baseSize - 1.2, posY, 1.2, baseSize);
        } else {
          // 经线在上 (纵向连续圆弧)
          ctx.fillStyle = warpCol;
          ctx.fillRect(posX, posY - 0.5, baseSize, baseSize + 1);

          // 经线起花与立体圆柱高光
          const isHighFloat = (cellType === 2);
          const highlightAlpha = isHighFloat ? 0.38 : 0.22;

          ctx.fillStyle = `rgba(255,255,255,${highlightAlpha})`;
          ctx.fillRect(posX + baseSize * 0.25, posY, baseSize * 0.4, baseSize);

          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(posX + baseSize * 0.85, posY, baseSize * 0.15, baseSize);
          ctx.fillRect(posX, posY, baseSize * 0.12, baseSize);

          // 浮长立体压纹投射阴影
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.fillRect(posX, posY, baseSize, 1.2);
          ctx.fillRect(posX, posY + baseSize - 1.2, baseSize, 1.2);
        }
      }
    }

    // 3. 正在织造时的飞梭指示线
    if (this.animationRow >= 0 && this.animationRow < rows) {
      const activeY = startY + this.animationRow * baseSize;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX - 20, activeY);
      ctx.lineTo(startX + totalW + 20, activeY);
      ctx.stroke();

      // 梭子小图标
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath();
      ctx.ellipse(startX + totalW + 25, activeY, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. 外围棉布须边 (Fringes / 流苏肌理)
    this.renderFabricFringe(ctx, startX, startY, totalW, totalH, baseSize, warpColors, weftColors);
  }

  /**
   * 绘制传统织锦自然的须边 (Fringes)
   */
  renderFabricFringe(ctx, x, y, w, h, base, warpCols, weftCols) {
    ctx.lineWidth = 1.2;
    // 上下经线流苏
    for (let c = 0; c < warpCols.length; c += 2) {
      const px = x + c * base + base / 2;
      ctx.strokeStyle = warpCols[c];

      // 顶部
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px + (Math.sin(c) * 4), y - 14 - (c % 4) * 2);
      ctx.stroke();

      // 底部
      ctx.beginPath();
      ctx.moveTo(px, y + h);
      ctx.lineTo(px + (Math.cos(c) * 4), y + h + 14 + (c % 4) * 2);
      ctx.stroke();
    }
  }

  /**
   * 渲染织造组织与综蹑图模式 (Loom Draft Blueprint)
   * 展示严谨的非遗二进制组织图
   */
  renderDraftView(ctx) {
    const { cols, rows, matrix } = this.data;
    const cellSize = 6;
    const totalW = cols * cellSize;
    const totalH = rows * cellSize;
    const startX = -totalW / 2;
    const startY = -totalH / 2;

    // 背景网格底板
    ctx.fillStyle = '#161d27';
    ctx.fillRect(startX, startY, totalW, totalH);

    // 绘制组织黑白/红白交织点
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const val = matrix[y][x];
        const px = startX + x * cellSize;
        const py = startY + y * cellSize;

        if (val === 2) {
          // 花经全浮 (鲜亮红点)
          ctx.fillStyle = '#ff4d4f';
          ctx.fillRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
        } else if (val === 1) {
          // 经组织点 (象牙白点)
          ctx.fillStyle = '#f0f2f5';
          ctx.fillRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
        } else {
          // 纬组织点 (青黑底)
          ctx.fillStyle = '#222c3a';
          ctx.fillRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
        }
      }
    }

    // 八格主网格线 (标示综片循环)
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x += 8) {
      const px = startX + x * cellSize;
      ctx.beginPath();
      ctx.moveTo(px, startY);
      ctx.lineTo(px, startY + totalH);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y += 8) {
      const py = startY + y * cellSize;
      ctx.beginPath();
      ctx.moveTo(startX, py);
      ctx.lineTo(startX + totalW, py);
      ctx.stroke();
    }
  }

  /**
   * 导出超高清大图 (4K/2K 无水印高保真)
   */
  exportHiRes(scale = 2) {
    if (!this.data) return null;

    const { cols, rows, matrix, warpColors, weftColors } = this.data;
    const baseSize = 8 * scale;
    const totalW = cols * baseSize;
    const totalH = rows * baseSize;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = totalW;
    offCanvas.height = totalH;
    const offCtx = offCanvas.getContext('2d');

    // 渲染真实纯棉布料
    for (let y = 0; y < rows; y++) {
      const weftCol = weftColors[y];
      const posY = y * baseSize;

      for (let x = 0; x < cols; x++) {
        const warpCol = warpColors[x];
        const posX = x * baseSize;
        const cellType = matrix[y][x];

        if (cellType === 0) {
          offCtx.fillStyle = weftCol;
          offCtx.fillRect(posX, posY, baseSize, baseSize);

          offCtx.fillStyle = 'rgba(255,255,255,0.2)';
          offCtx.fillRect(posX, posY + baseSize * 0.25, baseSize, baseSize * 0.4);

          offCtx.fillStyle = 'rgba(0,0,0,0.35)';
          offCtx.fillRect(posX, posY + baseSize * 0.85, baseSize, baseSize * 0.15);
          offCtx.fillRect(posX, posY, baseSize, baseSize * 0.12);
        } else {
          offCtx.fillStyle = warpCol;
          offCtx.fillRect(posX, posY, baseSize, baseSize);

          const alpha = (cellType === 2) ? 0.38 : 0.22;
          offCtx.fillStyle = `rgba(255,255,255,${alpha})`;
          offCtx.fillRect(posX + baseSize * 0.25, posY, baseSize * 0.4, baseSize);

          offCtx.fillStyle = 'rgba(0,0,0,0.35)';
          offCtx.fillRect(posX + baseSize * 0.85, posY, baseSize * 0.15, baseSize);
          offCtx.fillRect(posX, posY, baseSize * 0.12, baseSize);
        }
      }
    }

    return offCanvas.toDataURL('image/png');
  }

  /**
   * 导出无缝平铺可缩放矢量 SVG 代码
   */
  exportSVG() {
    if (!this.data) return '';
    const { cols, rows, matrix, warpColors, weftColors } = this.data;
    const unit = 10;
    const w = cols * unit;
    const h = rows * unit;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n`;
    svg += `  <style>\n`;
    svg += `    .weft { stroke-width: ${unit}; stroke-linecap: butt; }\n`;
    svg += `    .warp { stroke-width: ${unit}; stroke-linecap: butt; }\n`;
    svg += `  </style>\n`;
    svg += `  <rect width="${w}" height="${h}" fill="#111" />\n`;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isWarp = matrix[y][x] > 0;
        const color = isWarp ? warpColors[x] : weftColors[y];
        const px = x * unit;
        const py = y * unit;

        svg += `  <rect x="${px}" y="${py}" width="${unit}" height="${unit}" fill="${color}" />\n`;
        if (matrix[y][x] === 2) {
          svg += `  <rect x="${px + 2}" y="${py}" width="${unit - 4}" height="${unit}" fill="white" opacity="0.3" />\n`;
        }
      }
    }

    svg += `</svg>`;
    return svg;
  }
}

if (typeof module !== 'undefined') {
  module.exports = { LujinRenderer };
}
