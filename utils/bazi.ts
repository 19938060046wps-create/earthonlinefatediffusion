
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 藏干 (Hidden Stems)
export const HIDDEN_STEMS: Record<string, string[]> = {
  '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'], '卯': ['乙'],
  '辰': ['戊', '乙', '癸'], '巳': ['丙', '戊', '庚'], '午': ['丁', '己'], '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'], '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
};

// 纳音 (Na Yin)
const NA_YIN_DATA = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水', '沙中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水'
];

const GROWTH_PHASES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

// Five Elements Helper
export const getElement = (char: string) => {
  const map: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '甲': 'wood', '乙': 'wood', '寅': 'wood', '卯': 'wood',
    '丙': 'fire', '丁': 'fire', '巳': 'fire', '午': 'fire',
    '戊': 'earth', '己': 'earth', '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
    '庚': 'metal', '辛': 'metal', '申': 'metal', '酉': 'metal',
    '壬': 'water', '癸': 'water', '亥': 'water', '子': 'water',
  };
  return map[char];
};

const GAN_HE_MAP: Record<string, string> = {
  '甲己': '合化土', '乙庚': '合化金', '丙辛': '合化水', '丁壬': '合化木', '戊癸': '合化火'
};

const ZHI_LIU_HE_MAP: Record<string, string> = {
  '子丑': '六合化土', '寅亥': '六合化木', '卯戌': '六合化火', '辰酉': '六合化金', '巳申': '六合化水', '午未': '六合化土'
};

const BRANCH_MAIN_QI: Record<string, string> = {
  '子': '癸', '丑': '己', '寅': '甲', '卯': '乙', '辰': '戊', '巳': '丙',
  '午': '丁', '未': '己', '申': '庚', '酉': '辛', '戌': '戊', '亥': '壬'
};

export interface BaZiChart {
  year: PillarData;
  month: PillarData;
  day: PillarData;
  hour: PillarData;
}

export interface PillarData {
  gan: string; zhi: string; ganShen: string; zhiShen: string;
  hidden: string[]; hiddenShen: string[]; naYin: string; xingYun: string;
}

const getTenGod = (dayStemIndex: number, otherStemIndex: number): string => {
  const dayElem = Math.floor(dayStemIndex / 2);
  const otherElem = Math.floor(otherStemIndex / 2);
  const dayPol = dayStemIndex % 2;
  const otherPol = otherStemIndex % 2;
  const samePol = dayPol === otherPol;
  const dist = (otherElem - dayElem + 5) % 5;

  if (dist === 0) return samePol ? '比肩' : '劫财';
  if (dist === 1) return samePol ? '食神' : '伤官';
  if (dist === 2) return samePol ? '偏财' : '正财';
  if (dist === 3) return samePol ? '七杀' : '正官';
  if (dist === 4) return samePol ? '偏印' : '正印';
  return '';
};

const getStemIndex = (stem: string) => HEAVENLY_STEMS.indexOf(stem);

export const calculateBaZi = (date: Date, hour: number | null = null, minute: number | null = null): BaZiChart => {
  const y = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const h = hour !== null ? hour : date.getHours();

  let baziYear = y;
  if (month < 1 || (month === 1 && day < 4)) baziYear = y - 1;
  const yearOffset = baziYear - 1984;
  const yearStemIdx = ((yearOffset % 10) + 10) % 10;
  const yearBranchIdx = ((yearOffset % 12) + 12) % 12;

  const JIE_DAYS = [6, 4, 6, 5, 6, 6, 7, 8, 8, 8, 8, 7];
  let potentialBranch = (month + 1) % 12;
  if (day < JIE_DAYS[month]) potentialBranch = (potentialBranch - 1 + 12) % 12;
  const monthBranchIdx = potentialBranch;
  const tigerStem = (yearStemIdx % 5) * 2 + 2;
  const monthStemIdx = (tigerStem + (monthBranchIdx - 2 + 12) % 12) % 10;

  const refDate = new Date(Date.UTC(2000, 0, 1));
  const targetDate = new Date(Date.UTC(y, month, day));
  const diffDays = Math.round((targetDate.getTime() - refDate.getTime()) / 86400000);
  const dayStemIdx = ((4 + diffDays) % 10 + 10) % 10;
  const dayBranchIdx = ((6 + diffDays) % 12 + 12) % 12;

  const createPillar = (sIdx: number, bIdx: number, isDay = false): PillarData => {
    const gan = HEAVENLY_STEMS[sIdx];
    const zhi = EARTHLY_BRANCHES[bIdx];
    let cycleIdx = 0;
    for (let i = 0; i < 60; i++) {
      if (i % 10 === sIdx && i % 12 === bIdx) { cycleIdx = i; break; }
    }
    const naYin = NA_YIN_DATA[Math.floor(cycleIdx / 2)] || '未知';
    const hStems = HIDDEN_STEMS[zhi];
    const hShen = hStems.map(s => getTenGod(dayStemIdx, getStemIndex(s)));
    const phaseIdx = (bIdx + (12 - dayStemIdx)) % 12;
    const xingYun = GROWTH_PHASES[phaseIdx] || '帝旺';

    return {
      gan, zhi,
      ganShen: isDay ? '日主' : getTenGod(dayStemIdx, sIdx),
      zhiShen: getTenGod(dayStemIdx, getStemIndex(BRANCH_MAIN_QI[zhi])),
      hidden: hStems,
      hiddenShen: hShen,
      naYin,
      xingYun
    };
  };

  // 处理未知时间
  let hourPillar: PillarData;
  if (hour === null) {
    hourPillar = {
      gan: '?', zhi: '?', ganShen: '未知', zhiShen: '未知',
      hidden: [], hiddenShen: [], naYin: '未知', xingYun: '未知'
    };
  } else {
    let hourBranchIdx = 0;
    if (h >= 23) hourBranchIdx = 0;
    else hourBranchIdx = Math.floor((h + 1) / 2) % 12;
    const hourStemStart = (dayStemIdx % 5) * 2;
    const hourStemIdx = (hourStemStart + hourBranchIdx) % 10;
    hourPillar = createPillar(hourStemIdx, hourBranchIdx);
  }

  return {
    year: createPillar(yearStemIdx, yearBranchIdx),
    month: createPillar(monthStemIdx, monthBranchIdx),
    day: createPillar(dayStemIdx, dayBranchIdx, true),
    hour: hourPillar
  };
};

export const getDaYun = (yearGan: string, monthGan: string, monthZhi: string, gender: 'male' | 'female', birthYear: number) => {
  const yearStemIdx = HEAVENLY_STEMS.indexOf(yearGan);
  const monthStemIdx = HEAVENLY_STEMS.indexOf(monthGan);
  const monthBranchIdx = EARTHLY_BRANCHES.indexOf(monthZhi);
  const isYearYang = (yearStemIdx % 2) === 0;
  let isForward = gender === 'male' ? isYearYang : !isYearYang;

  const qiYunAge = 4;
  const yun = [];

  yun.push({ gan: '小', zhi: '运', age: 1, year: birthYear, isXiaoYun: true });
  for (let i = 1; i <= 8; i++) {
    const offset = isForward ? i : -i;
    const stemIdx = ((monthStemIdx + offset) % 10 + 10) % 10;
    const branchIdx = ((monthBranchIdx + offset) % 12 + 12) % 12;
    const startAge = qiYunAge + (i - 1) * 10;
    yun.push({
      gan: HEAVENLY_STEMS[stemIdx],
      zhi: EARTHLY_BRANCHES[branchIdx],
      age: startAge,
      year: birthYear + startAge,
      isXiaoYun: false
    });
  }
  return yun;
};

export interface Relationships {
  stems: string[];
  branches: string[];
}

export const analyzeRelationships = (chart: BaZiChart, dyGan?: string, dyZhi?: string, lnGan?: string, lnZhi?: string): Relationships => {
  const resStems: string[] = [];
  const resBranches: string[] = [];

  const chartStems = [chart.year.gan, chart.month.gan, chart.day.gan, chart.hour.gan];
  const chartBranches = [chart.year.zhi, chart.month.zhi, chart.day.zhi, chart.hour.zhi];

  const addStem = (s: string) => !resStems.includes(s) && resStems.push(s);
  const addBranch = (b: string) => !resBranches.includes(b) && resBranches.push(b);

  const checkStems = (stems: string[], suffix: string = '') => {
    // Heavenly Combos
    for (let i = 0; i < stems.length; i++) {
      for (let j = i + 1; j < stems.length; j++) {
        const pair = [stems[i], stems[j]].sort().join('');
        if (GAN_HE_MAP[pair]) addStem(`${stems[i]}${stems[j]}${GAN_HE_MAP[pair]}${suffix}`);
      }
    }
  };

  const checkBranches = (branches: string[], suffix: string = '') => {
    // Earthly Combos
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        const pair = [branches[i], branches[j]].sort().join(''); // Sort to match map keys? Map keys need to be checked bidirectional or standardized.
        // Standardizing: 
        const b1 = branches[i];
        const b2 = branches[j];
        const key1 = b1 + b2;
        const key2 = b2 + b1;

        if (ZHI_LIU_HE_MAP[key1]) addBranch(`${b1}${b2}${ZHI_LIU_HE_MAP[key1]}${suffix}`);
        else if (ZHI_LIU_HE_MAP[key2]) addBranch(`${b2}${b1}${ZHI_LIU_HE_MAP[key2]}${suffix}`);

        // Simple clashes (subsets)
        if (['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'].includes(key1) || ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'].includes(key2)) {
          addBranch(`${b1}${b2}相冲${suffix}`);
        }
      }
    }
    // Three Harmonies (San He) - Simplified check
    const bStr = branches.join('');
    if ((bStr.includes('申') && bStr.includes('子') && bStr.includes('辰'))) addBranch('申子辰三合水局' + suffix);
    if ((bStr.includes('寅') && bStr.includes('午') && bStr.includes('戌'))) addBranch('寅午戌三合火局' + suffix);
    if ((bStr.includes('亥') && bStr.includes('卯') && bStr.includes('未'))) addBranch('亥卯未三合木局' + suffix);
    if ((bStr.includes('巳') && bStr.includes('酉') && bStr.includes('丑'))) addBranch('巳酉丑三合金局' + suffix);
  };

  checkStems(chartStems, '(原局)');
  checkBranches(chartBranches, '(原局)');

  if (dyGan || lnGan) {
    const dynamicStems = [...chartStems];
    if (dyGan) dynamicStems.push(dyGan);
    if (lnGan) dynamicStems.push(lnGan);
    checkStems(dynamicStems, '(岁运)');
  }

  if (dyZhi || lnZhi) {
    const dynamicBranches = [...chartBranches];
    if (dyZhi) dynamicBranches.push(dyZhi);
    if (lnZhi) dynamicBranches.push(lnZhi);
    checkBranches(dynamicBranches, '(岁运)');
  }

  return {
    stems: Array.from(new Set(resStems)),
    branches: Array.from(new Set(resBranches))
  };
};
