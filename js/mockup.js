/**
 * 鲁锦当代非遗实物应用模拟 (Contemporary Product Mockup Engine)
 * 将生成的鲁锦纹样实时平铺并映射到真实中式文创、家居、卷轴与展品载体上
 */

class LujinMockup {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.type = 'pillow'; // 'pillow' | 'scroll' | 'tile' | 'runner'
    this.patternImage = null;
    this.patternCanvas = document.createElement('canvas');
  }

  setType(type) {
    this.type = type;
    this.render();
  }

  updatePattern(data) {
    if (!data) return;
    const { cols, rows, matrix, warpColors, weftColors } = data;
    const pCanvas = this.patternCanvas;
    const size = 4;
    pCanvas.width = cols * size;
    pCanvas.height = rows * size;
    const pCtx = pCanvas.getContext('2d');

    // 绘制离屏平铺图案
    for (let y = 0; y < rows; y++) {
      const weftCol = weftColors[y];
      const py = y * size;
      for (let x = 0; x < cols; x++) {
        const warpCol = warpColors[x];
        const px = x * size;
        const cell = matrix[y][x];

        if (cell === 0) {
          pCtx.fillStyle = weftCol;
          pCtx.fillRect(px, py, size, size);
        } else {
          pCtx.fillStyle = warpCol;
          pCtx.fillRect(px, py, size, size);
          if (cell === 2) {
            pCtx.fillStyle = 'rgba(255,255,255,0.3)';
            pCtx.fillRect(px + 1, py, size - 2, size);
          }
        }
      }
    }

    this.render();
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
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // 展厅环境背景 (温暖深灰空间微光)
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
    bgGrad.addColorStop(0, '#1c222d');
    bgGrad.addColorStop(1, '#0e1218');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    if (this.type === 'pillow') {
      this.renderPillow(ctx, w, h);
    } else if (this.type === 'scroll') {
      this.renderScroll(ctx, w, h);
    } else if (this.type === 'runner') {
      this.renderTeaRunner(ctx, w, h);
    } else {
      this.renderTile(ctx, w, h);
    }
  }

  /**
   * 文创 1: 东方新中式方枕 (Cushion Pillow)
   */
  renderPillow(ctx, w, h) {
    const size = Math.min(w * 0.72, h * 0.72, 380);
    const cx = w / 2;
    const cy = h / 2;
    const x = cx - size / 2;
    const y = cy - size / 2;
    const r = 36; // 蓬松圆角

    ctx.save();

    // 1. 抱枕立体投影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 22;

    // 2. 抱枕丰满轮廓路径 (微鼓弧度)
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.quadraticCurveTo(cx, y - 10, x + size - r, y);
    ctx.quadraticCurveTo(x + size + 10, cy, x + size, y + size - r);
    ctx.quadraticCurveTo(cx, y + size + 10, x + r, y + size);
    ctx.quadraticCurveTo(x - 10, cy, x, y + r);
    ctx.closePath();

    ctx.fillStyle = '#222';
    ctx.fill();

    // 3. 裁剪并平铺鲁锦图案
    ctx.clip();
    ctx.shadowColor = 'transparent';

    const pat = ctx.createPattern(this.patternCanvas, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(x - 50, y - 50, size + 100, size + 100);
    }

    // 4. 抱枕立体蓬松光影 (中心高光、边缘收拢阴影、四角褶皱)
    const pillowShade = ctx.createRadialGradient(cx, cy - 20, 20, cx, cy, size * 0.65);
    pillowShade.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    pillowShade.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    pillowShade.addColorStop(0.85, 'rgba(0, 0, 0, 0.45)');
    pillowShade.addColorStop(1, 'rgba(0, 0, 0, 0.75)');

    ctx.fillStyle = pillowShade;
    ctx.fillRect(x - 20, y - 20, size + 40, size + 40);

    // 5. 镶边滚绳 (Piping Edge)
    ctx.strokeStyle = 'rgba(230, 200, 160, 0.6)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 文创 2: 鲁锦传统挂轴布卷 (Museum Fabric Hanging Scroll)
   */
  renderScroll(ctx, w, h) {
    const sw = Math.min(w * 0.55, 340);
    const sh = Math.min(h * 0.85, 480);
    const sx = (w - sw) / 2;
    const sy = (h - sh) / 2;

    ctx.save();

    // 卷轴吊绳与挂钩
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, sy - 35);
    ctx.lineTo(sx + 20, sy);
    ctx.moveTo(w / 2, sy - 35);
    ctx.lineTo(sx + sw - 20, sy);
    ctx.stroke();

    // 阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 15;

    // 布面
    ctx.beginPath();
    ctx.rect(sx, sy, sw, sh);
    ctx.fillStyle = '#111';
    ctx.fill();

    ctx.clip();
    ctx.shadowColor = 'transparent';

    const pat = ctx.createPattern(this.patternCanvas, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(sx, sy, sw, sh);
    }

    // 布料垂坠竖向波浪起伏光影 (Drapery Folds)
    for (let i = 0; i < 4; i++) {
      const fx = sx + (sw / 4) * i;
      const foldGrad = ctx.createLinearGradient(fx, sy, fx + sw / 4, sy);
      foldGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
      foldGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
      foldGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = foldGrad;
      ctx.fillRect(fx, sy, sw / 4, sh);
    }

    ctx.restore();

    // 上下实木滚轴 (红木杆)
    this.renderWoodRod(ctx, sx - 16, sy - 6, sw + 32, 12);
    this.renderWoodRod(ctx, sx - 16, sy + sh - 6, sw + 32, 14);
  }

  renderWoodRod(ctx, x, y, rw, rh) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    const rodGrad = ctx.createLinearGradient(x, y, x, y + rh);
    rodGrad.addColorStop(0, '#5c2c16');
    rodGrad.addColorStop(0.35, '#8b4513');
    rodGrad.addColorStop(0.7, '#421a08');
    rodGrad.addColorStop(1, '#2b1004');

    ctx.fillStyle = rodGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, rw, rh, 5);
    } else {
      ctx.rect(x, y, rw, rh);
    }
    ctx.fill();

    // 黄铜套头
    ctx.fillStyle = '#e5b73b';
    ctx.fillRect(x, y, 6, rh);
    ctx.fillRect(x + rw - 6, y, 6, rh);
    ctx.restore();
  }

  /**
   * 文创 3: 茶席桌旗 (Tea Ceremony Runner)
   */
  renderTeaRunner(ctx, w, h) {
    const rw = Math.min(w * 0.45, 260);
    const rh = h * 0.92;
    const rx = (w - rw) / 2;
    const ry = (h - rh) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;

    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.fillStyle = '#222';
    ctx.fill();

    ctx.clip();
    ctx.shadowColor = 'transparent';

    const pat = ctx.createPattern(this.patternCanvas, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(rx, ry, rw, rh);
    }

    // 柔和桌面光
    const grad = ctx.createLinearGradient(rx, ry, rx + rw, ry);
    grad.addColorStop(0, 'rgba(0,0,0,0.3)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(rx, ry, rw, rh);

    ctx.restore();
  }

  /**
   * 文创 4: 空间四方连续平铺 (Continuous Wall Tiling)
   */
  renderTile(ctx, w, h) {
    ctx.save();
    const pat = ctx.createPattern(this.patternCanvas, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, w, h);
    }
    // 轻度暗角保护边缘
    const vGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

if (typeof module !== 'undefined') {
  module.exports = { LujinMockup };
}
