/**
 * 鲁锦数理生成引擎 (Lu Brocade Generative Matrix Engine)
 * 模拟多综多蹑织机逻辑、经线起花组织结构与非遗经典数理法则
 */

class LujinEngine {
  constructor(options = {}) {
    this.cols = options.cols || 128; // 经线总数
    this.rows = options.rows || 128; // 纬线总数
    this.patternType = options.patternType || 'da_he_dou';
    this.paletteId = options.paletteId || 'qilu';
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    this.floatLength = options.floatLength || 3; // 经浮长
    this.density = options.density || 1.0;
    this.warpPaletteStyle = options.warpPaletteStyle || 'symmetric_plaid';
    this.weftPaletteStyle = options.weftPaletteStyle || 'symmetric_plaid';

    this.data = null;
  }

  generate() {
    const rng = ColorEngine.createRng(this.seed);
    const palette = PALETTES[this.paletteId] || PALETTES.qilu;

    // 1. 生成经线与纬线的色彩排列
    const warpColors = ColorEngine.generateThreadColorSequence(
      palette, 
      this.cols, 
      this.warpPaletteStyle, 
      this.seed
    );
    const weftColors = ColorEngine.generateThreadColorSequence(
      palette, 
      this.rows, 
      this.weftPaletteStyle, 
      this.seed + 999
    );

    // 2. 初始化组织矩阵 (0 = 纬浮, 1 = 经浮, 2 = 花经全浮长高光点)
    const matrix = [];
    for (let y = 0; y < this.rows; y++) {
      matrix[y] = new Uint8Array(this.cols);
    }

    // 3. 根据所选纹样算法生成经纬提升逻辑
    let patternMeta = {};
    switch (this.patternType) {
      case 'da_he_dou':
        patternMeta = this.generateDaHeDou(matrix, rng);
        break;
      case 'yu_yan_chang_liu_shui':
        patternMeta = this.generateYuYanChangLiuShui(matrix, rng);
        break;
      case 'ba_leng_deng_long':
        patternMeta = this.generateBaLengDengLong(matrix, rng);
        break;
      case 'bai_zhe_wu_cai':
        patternMeta = this.generateBaiZheWuCai(matrix, rng);
        break;
      case 'zi_dong_ji_jin':
        patternMeta = this.generateCellularBrocade(matrix, rng);
        break;
      default:
        patternMeta = this.generateDaHeDou(matrix, rng);
    }

    // 4. 模拟传统织机的穿综图 (Threading) 与 踏板纹板图 (Treadling / Tie-up)
    const loomDraft = this.deriveLoomDraft(matrix);

    this.data = {
      cols: this.cols,
      rows: this.rows,
      matrix,
      warpColors,
      weftColors,
      palette,
      meta: patternMeta,
      seed: this.seed,
      loomDraft
    };

    return this.data;
  }

  /**
   * 纹样 1: 大合斗与阶梯犬牙 (Nested Dou & Houndstooth)
   * 鲁西南最神圣的粮食丰收图腾，层层回型方斗与犬牙交错
   */
  generateDaHeDou(matrix, rng) {
    const period = 32; // 单个单元尺寸
    const half = period / 2;

    for (let y = 0; y < this.rows; y++) {
      const py = y % period;
      const dy = Math.abs(py - half);

      for (let x = 0; x < this.cols; x++) {
        const px = x % period;
        const dx = Math.abs(px - half);

        // 曼哈顿菱形距离与切比雪夫方块距离交织
        const manhattan = dx + dy;
        const chebyshev = Math.max(dx, dy);

        let isOver = false;

        // 阶梯犬牙齿纹
        const houndstooth = ((px + py) % 4 < 2);

        // 大合斗同心方形与菱形环带
        const ring = chebyshev % 8;
        const diamondRing = manhattan % 8;

        if (chebyshev <= 3) {
          // 斗心：九眼透 / 十字核桃花
          isOver = (dx === 0 || dy === 0 || (dx === 2 && dy === 2));
        } else if (chebyshev <= 7) {
          // 内斗围框
          isOver = (ring === 0 || ring === 1 || houndstooth);
        } else if (chebyshev <= 12) {
          // 中斗层：斜向菱形交叠 (经线长浮起花)
          isOver = (diamondRing < 4) ^ houndstooth;
        } else {
          // 外斗缘与边饰
          isOver = (ring >= 4) ? ((x + y) % 2 === 0) : true;
        }

        // 经线起花长浮点强化
        if (isOver && (dx === 0 || dy === 0 || manhattan === 10)) {
          matrix[y][x] = 2; // 全浮长点
        } else {
          matrix[y][x] = isOver ? 1 : 0;
        }
      }
    }

    return {
      title: '大合斗与阶梯犬牙 (Nested Dou & Dogtooth)',
      heritageName: '大合斗·九眼透·狗牙边',
      meaning: '源自古代量具“斗”，寓意日进斗金、五谷丰登、天地人和之美。',
      techPoints: ['D4对称群', '曼哈顿嵌套矩阵', '经线全浮高光']
    };
  }

  /**
   * 纹样 2: 鱼眼长流水 (Fish Eye & Flowing Water)
   * 国家级非遗名录指定核心代表纹样，波浪水纹包裹晶莹鱼眼
   */
  generateYuYanChangLiuShui(matrix, rng) {
    const streamBand = 32; // 水流周期
    const wavelength = 24; // 波浪起伏波长

    for (let y = 0; y < this.rows; y++) {
      // 模拟传统“长流水”起伏正弦/阶梯波
      const waveShift = Math.round(Math.sin((y / wavelength) * Math.PI * 2) * 5);

      for (let x = 0; x < this.cols; x++) {
        const shiftedX = (x + waveShift + 1000) % streamBand;
        const distFromCenter = Math.abs(shiftedX - streamBand / 2);

        let val = 0;

        if (distFromCenter < 5) {
          // 鱼眼中心 (经典"地二花二，花经全浮")
          const eyeX = distFromCenter;
          const eyeY = y % 12;
          const eyeDist = Math.abs(eyeX) + Math.abs(eyeY - 6);
          if (eyeDist <= 3) {
            val = (eyeDist === 1 || eyeDist === 2) ? 2 : 0;
          } else {
            val = ((x + y) % 2 === 0) ? 1 : 0;
          }
        } else if (distFromCenter < 11) {
          // 水纹条带 (流线平滑阶梯)
          const ripple = (distFromCenter + Math.floor(y / 4)) % 3;
          val = (ripple === 0 || ripple === 1) ? 1 : 0;
        } else {
          // 两侧护水堤岸与细密席纹
          val = ((x % 4 < 2) && (y % 4 < 2)) ? 1 : 0;
        }

        matrix[y][x] = val;
      }
    }

    return {
      title: '鱼眼长流水 (Fish Eye & Flowing Waters)',
      heritageName: '鱼眼长流水·二花二浮',
      meaning: '寓意“年年有余”、“福寿长流”，鲁锦织造史上难度最高的经典经线提花之一。',
      techPoints: ['波动谐波算子', '地二花二复合组织', '水纹与鱼眼双轨交叠']
    };
  }

  /**
   * 纹样 3: 八棱灯笼花与十样锦 (Lantern Rosette & Jujube Blossom)
   * 传统八角星徽、四方连续交织出的华贵花团锦簇
   */
  generateBaLengDengLong(matrix, rng) {
    const cellSize = 36;
    const half = cellSize / 2;

    for (let y = 0; y < this.rows; y++) {
      const cy = y % cellSize;
      const dy = Math.abs(cy - half);

      for (let x = 0; x < this.cols; x++) {
        const cx = x % cellSize;
        const dx = Math.abs(cx - half);

        let val = 0;

        // 八角星形态与阶梯十字花 (八面玲珑灯笼花)
        const isCenterBloom = (dx <= 4 && dy <= 4) && (dx + dy <= 6);
        const isCrossArm = (dx <= 2 && dy <= 12) || (dy <= 2 && dx <= 12);
        const isDiagonalPetal = Math.abs(dx - dy) <= 2 && (dx <= 10 && dy <= 10);

        // 角隅四方连续互锁花纹 (枣花纹)
        const cornerDist = Math.min(
          dx + dy,
          Math.abs(cx) + Math.abs(cy),
          Math.abs(cx - cellSize) + Math.abs(cy - cellSize)
        );

        if (isCenterBloom) {
          // 灯笼花蕊：经线全浮
          val = 2;
        } else if (isCrossArm || isDiagonalPetal) {
          // 八棱花瓣主体
          const weaveMod = (x + y) % 3;
          val = (weaveMod === 0 || weaveMod === 1) ? 1 : 0;
        } else if (dx === 14 || dy === 14) {
          // 花朵边框 (枣花嵌边)
          val = ((x % 2) ^ (y % 2)) ? 1 : 0;
        } else if (cornerDist <= 4) {
          // 角落接榫花
          val = (cornerDist % 2 === 0) ? 2 : 1;
        } else {
          // 衬底斜纹
          val = ((x + 2 * y) % 4 < 2) ? 1 : 0;
        }

        matrix[y][x] = val;
      }
    }

    return {
      title: '八棱灯笼花与十样锦 (Eight-point Lantern & Cross Blossom)',
      heritageName: '八棱灯笼·万字十样锦',
      meaning: '灯笼象征红火圆满，八角向外发散如光芒万丈，鲁锦提花织锦的奢华极品。',
      techPoints: ['八向放射对称', '阶梯八棱轮廓', '连续咬合花角']
    };
  }

  /**
   * 纹样 4: 百折五彩锦与席纹挑花 (Polychrome Huckaback & Plaids)
   * 参考原图 images (2).jpeg 和 images (7).jpeg 中的密实多色织造
   */
  generateBaiZheWuCai(matrix, rng) {
    const blockGrid = 16;

    for (let y = 0; y < this.rows; y++) {
      const by = Math.floor(y / blockGrid);
      const iy = y % blockGrid;

      for (let x = 0; x < this.cols; x++) {
        const bx = Math.floor(x / blockGrid);
        const ix = x % blockGrid;

        const isAltBlock = (bx + by) % 2 === 0;

        let val = 0;
        if (isAltBlock) {
          // 席纹 (Basketweave / Huckaback float)
          const sub = (Math.floor(ix / 2) + Math.floor(iy / 2)) % 2;
          val = sub === 0 ? 1 : 0;
          if (ix % 4 === 1 && iy % 4 === 1) val = 2; // 挑花高亮点
        } else {
          // 经线提条与细密经面斜纹 (Warp-faced Twill)
          const twill = (ix + 2 * iy) % 4;
          val = (twill < 3) ? 1 : 0;
        }

        // 强条界线 (柳条格界边)
        if (ix === 0 || iy === 0) {
          val = ((x + y) % 2 === 0) ? 2 : 0;
        }

        matrix[y][x] = val;
      }
    }

    return {
      title: '百折五彩锦与席纹挑花 (Polychrome Huckaback & Plaids)',
      heritageName: '百折五彩锦·席纹挑花',
      meaning: '取材民间传统织锦经典“百折彩布”，经纬错落、混色生辉，质地厚密挺括。',
      techPoints: ['双向席纹组织', '经向浮凸提花', '光学混色网格']
    };
  }

  /**
   * 纹样 5: 自涌现细胞织锦 (Wolfram Cellular Brocade)
   * 计算机生成艺术与非遗织锦的创新交汇：以元胞自动机推导千变万化的民间对称织锦
   */
  generateCellularBrocade(matrix, rng) {
    const unitSize = 32;
    const half = unitSize / 2;
    
    // 生成一个 1D 元胞自动机基础行 (Rule 90 / 150 产生天然谢尔宾斯基三角与对称提花分形)
    const rule = [90, 150, 105, 110][Math.floor(rng() * 4)];
    const ruleBits = [];
    for (let b = 0; b < 8; b++) ruleBits[b] = (rule >> b) & 1;

    let rowState = new Uint8Array(half);
    rowState[0] = 1; // 种子
    rowState[Math.floor(half / 2)] = 1;

    const quadMatrix = [];
    quadMatrix[0] = rowState.slice();

    for (let r = 1; r < half; r++) {
      const nextRow = new Uint8Array(half);
      for (let c = 0; c < half; c++) {
        const left = c > 0 ? rowState[c - 1] : rowState[half - 1];
        const mid = rowState[c];
        const right = c < half - 1 ? rowState[c + 1] : rowState[0];
        const idx = (left << 2) | (mid << 1) | right;
        nextRow[c] = ruleBits[idx];
      }
      quadMatrix[r] = nextRow;
      rowState = nextRow;
    }

    // 将四分之一象限沿水平、垂直双轴镜像平铺
    for (let y = 0; y < this.rows; y++) {
      const uy = y % unitSize;
      const my = uy < half ? uy : (unitSize - 1 - uy);

      for (let x = 0; x < this.cols; x++) {
        const ux = x % unitSize;
        const mx = ux < half ? ux : (unitSize - 1 - ux);

        const bit = quadMatrix[my][mx];
        if (bit === 1) {
          matrix[y][x] = ((x + y) % 3 === 0) ? 2 : 1;
        } else {
          matrix[y][x] = ((x + y) % 2 === 0) ? 0 : 1;
        }
      }
    }

    return {
      title: `自涌现分形锦 (Cellular Brocade Rule-${rule})`,
      heritageName: `自涌现·数理乾坤锦 (${rule}号织律)`,
      meaning: '利用离散自动机算子模拟非遗手艺人代代口传心授的织造心诀，呈现数学自相似性。',
      techPoints: ['离散自动机动力学', 'D4克莱因四元镜像', '分形提花肌理']
    };
  }

  /**
   * 推导织机穿综与踏板图 (Loom Drafting Specification)
   * 还原传统木织机“几综几蹑”的技术工程参数
   */
  deriveLoomDraft(matrix) {
    const numShafts = 8;
    const threading = new Uint8Array(this.cols);
    const treadling = new Uint8Array(this.rows);

    for (let x = 0; x < this.cols; x++) {
      threading[x] = (x % numShafts);
    }

    for (let y = 0; y < this.rows; y++) {
      treadling[y] = (y % numShafts);
    }

    return {
      numShafts,
      threading,
      treadling,
      reedDensity: '320根/10厘米',
      weftDensity: '280根/10厘米',
      warpTotal: this.cols,
      weftTotal: this.rows
    };
  }
}

if (typeof module !== 'undefined') {
  module.exports = { LujinEngine };
}
