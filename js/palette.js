/**
 * 鲁锦色彩体系 (Lu Brocade Color System)
 * 提取自传统草木染、矿物颜料及实物田野调研
 */

const PALETTES = {
  qilu: {
    id: 'qilu',
    name: '齐鲁华彩 (经典朱红与金黄)',
    desc: '鲁西南婚嫁与节庆经典用色，热烈红金配以墨黑素白，稳重而热烈',
    colors: ['#A91D22', '#D32F2F', '#E65100', '#F9A825', '#212121', '#FBF9F5'],
    weights: [0.3, 0.25, 0.15, 0.15, 0.08, 0.07]
  },
  qinghua: {
    id: 'qinghua',
    name: '青花素韵 (蓝染与原棉本白)',
    desc: '民间最经典的蓝白提花土布，纯净素雅，经纬沉浮间显现素锦纹样',
    colors: ['#0D2538', '#1B4965', '#3E83A8', '#8EAFCE', '#DDE7F0', '#FCFCFA'],
    weights: [0.35, 0.25, 0.15, 0.1, 0.05, 0.1]
  },
  wucai: {
    id: 'wucai',
    name: '五彩祥锦 (孔雀蓝与丹砂七彩)',
    desc: '高饱和度民间撞色，孔雀蓝、朱砂红、石绿与鸡油黄交织出的民间交响',
    colors: ['#00838F', '#C62828', '#2E7D32', '#F57F17', '#6A1B9A', '#FFFDE7'],
    weights: [0.25, 0.25, 0.18, 0.18, 0.07, 0.07]
  },
  caomu: {
    id: 'caomu',
    name: '草木山石 (熟褐、赭石与秋葵)',
    desc: '天然草木染质感，取材苏木、栀子、核桃皮、茶汁，古雅温润',
    colors: ['#4E342E', '#6D4C41', '#8D6E63', '#A1887F', '#556B2F', '#EFEBE9'],
    weights: [0.25, 0.25, 0.2, 0.15, 0.08, 0.07]
  },
  xiandai: {
    id: 'xiandai',
    name: '新中式新风 (霁蓝、石青与珊瑚)',
    desc: '面向当代文创与服装设计的低饱和优雅色调，兼具传统肌理与现代极简',
    colors: ['#2B4162', '#385F71', '#D7B49E', '#E07A5F', '#81B29A', '#F4F1DE'],
    weights: [0.25, 0.2, 0.2, 0.15, 0.1, 0.1]
  },
  dianlan: {
    id: 'dianlan',
    name: '深蓝靛影 (多重阶梯靛青)',
    desc: '蓝靛多次复染呈现的墨蓝、藏青、月白层级，尽显鲁锦经线浮雕感',
    colors: ['#0A192F', '#172A45', '#303C6C', '#5C6B73', '#9DBEBB', '#F4EAE6'],
    weights: [0.3, 0.25, 0.2, 0.12, 0.08, 0.05]
  }
};

/**
 * 色彩处理工具函数
 */
class ColorEngine {
  static hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    if (clean.length === 3) {
      const r = (num >> 8) & 0xf;
      const g = (num >> 4) & 0xf;
      const b = num & 0xf;
      return { r: (r << 4) | r, g: (g << 4) | g, b: (b << 4) | b };
    }
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  static rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * 模拟手工纯棉纱线的细微色调浮动 (有机手工感)
   */
  static applyYarnJitter(hex, jitterAmount = 0.06) {
    const rgb = this.hexToRgb(hex);
    const factor = 1 + (Math.random() * 2 - 1) * jitterAmount;
    return {
      r: Math.max(0, Math.min(255, rgb.r * factor)),
      g: Math.max(0, Math.min(255, rgb.g * factor)),
      b: Math.max(0, Math.min(255, rgb.b * factor))
    };
  }

  /**
   * 生成符合鲁锦“经纬条律”的纱线色彩序列 (1D Array)
   * 支持对称回文、大合斗主干格、跳格条纹
   */
  static generateThreadColorSequence(palette, length, style = 'symmetric_plaid', seed = 42) {
    const colors = palette.colors;
    const seq = new Array(length);
    let rng = this.createRng(seed);

    if (style === 'solid') {
      // 纯色基底
      for (let i = 0; i < length; i++) seq[i] = colors[0];
      return seq;
    }

    if (style === 'bicolor_check') {
      // 蓝白相间 / 简素两色条
      const c1 = colors[0];
      const c2 = colors[colors.length - 1];
      const band = 8 + Math.floor(rng() * 12);
      for (let i = 0; i < length; i++) {
        seq[i] = Math.floor(i / band) % 2 === 0 ? c1 : c2;
      }
      return seq;
    }

    // 默认：鲁锦经典多层级韵律条纹 (Macro-bands, Pinstripes, Borders)
    // 构造一个对称单元
    const unitSize = Math.max(16, Math.floor(length / (2 + Math.floor(rng() * 3))));
    const halfUnit = Math.floor(unitSize / 2);
    const unit = new Array(unitSize);

    // 决定主色与强调色
    const mainColor = colors[0];
    const secondaryColor = colors[1 % colors.length];
    const accent1 = colors[2 % colors.length];
    const accent2 = colors[3 % colors.length];
    const lightBorder = colors[colors.length - 1];

    let cursor = 0;
    while (cursor < halfUnit) {
      const stepType = rng();
      let span = 1;
      let col = mainColor;

      if (stepType < 0.35) {
        // 主色块
        span = 4 + Math.floor(rng() * 8);
        col = mainColor;
      } else if (stepType < 0.65) {
        // 次主色块
        span = 3 + Math.floor(rng() * 6);
        col = secondaryColor;
      } else if (stepType < 0.85) {
        // 鲜亮跳色/经线起花亮带
        span = 2 + Math.floor(rng() * 4);
        col = rng() > 0.5 ? accent1 : accent2;
      } else {
        // 纤细分割线 (1-2 根线)
        span = 1 + (rng() > 0.5 ? 1 : 0);
        col = lightBorder;
      }

      for (let k = 0; k < span && cursor < halfUnit; k++) {
        unit[cursor] = col;
        unit[unitSize - 1 - cursor] = col; // 镜像对称
        cursor++;
      }
    }

    // 平铺至整个纱线长度
    for (let i = 0; i < length; i++) {
      seq[i] = unit[i % unitSize] || mainColor;
    }

    return seq;
  }

  static createRng(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function() {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
}

if (typeof module !== 'undefined') {
  module.exports = { PALETTES, ColorEngine };
}
