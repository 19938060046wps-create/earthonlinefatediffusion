
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
  shenSha: string[]; // New field for Shen Sha
}

// Shen Sha Helpers
const getShenSha = (pillarBranch: string, dayGan: string, yearBranch: string, monthBranch: string, dayBranch: string): string[] => {
  const stars: string[] = [];
  const stemIdx = HEAVENLY_STEMS.indexOf(dayGan);

  // 1. Tian Yi Gui Ren (Nobleman) - Based on Day Gan
  const tianYiMap: Record<string, string[]> = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '壬': ['巳', '卯'], '癸': ['巳', '卯'],
    '辛': ['午', '寅']
  };
  if (tianYiMap[dayGan]?.includes(pillarBranch)) stars.push('天乙');

  // 2. Wen Chang (Academic) - Based on Day Gan
  const wenChangMap: Record<string, string> = {
    '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
    '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'
  };
  if (wenChangMap[dayGan] === pillarBranch) stars.push('文昌');

  // 3. Yang Ren (Goat Blade) - Based on Day Gan
  const yangRenMap: Record<string, string> = {
    '甲': '卯', '乙': '辰', '丙': '午', '丁': '未', '戊': '午',
    '己': '未', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑'
  };
  if (yangRenMap[dayGan] === pillarBranch) stars.push('羊刃');

  // 4. Lu Shen (Thriving) - Based on Day Gan
  const luShenMap: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
    '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
  };
  if (luShenMap[dayGan] === pillarBranch) stars.push('禄神');

  // San He Lookup for Yi Ma, Tao Hua, Hua Gai
  const getSanHeGroup = (zhi: string) => {
    if (['申', '子', '辰'].includes(zhi)) return 'Water';
    if (['寅', '午', '戌'].includes(zhi)) return 'Fire';
    if (['亥', '卯', '未'].includes(zhi)) return 'Wood';
    if (['巳', '酉', '丑'].includes(zhi)) return 'Metal';
    return '';
  };

  // Check against Year Branch AND Day Branch
  [yearBranch, dayBranch].forEach(refBranch => {
    const group = getSanHeGroup(refBranch);

    // 5. Yi Ma (Traveling Horse)
    // Water->Yin, Fire->Shen, Wood->Si, Metal->Hai
    if (group === 'Water' && pillarBranch === '寅') stars.push('驿马');
    if (group === 'Fire' && pillarBranch === '申') stars.push('驿马');
    if (group === 'Wood' && pillarBranch === '巳') stars.push('驿马');
    if (group === 'Metal' && pillarBranch === '亥') stars.push('驿马');

    // 6. Tao Hua (Peach Blossom)
    // Water->You, Fire->Mao, Wood->Zi, Metal->Wu
    if (group === 'Water' && pillarBranch === '酉') stars.push('桃花');
    if (group === 'Fire' && pillarBranch === '卯') stars.push('桃花');
    if (group === 'Wood' && pillarBranch === '子') stars.push('桃花');
    if (group === 'Metal' && pillarBranch === '午') stars.push('桃花');

    // 7. Hua Gai (Talent/Art)
    // Water->Chen, Fire->Xu, Wood->Wei, Metal->Chou (ends of logic)
    if (group === 'Water' && pillarBranch === '辰') stars.push('华盖');
    if (group === 'Fire' && pillarBranch === '戌') stars.push('华盖');
    if (group === 'Wood' && pillarBranch === '未') stars.push('华盖');
    if (group === 'Metal' && pillarBranch === '丑') stars.push('华盖');
  });

  // 8. Tai Ji Gui Ren - Based on Day Gan
  const taiJiMap: Record<string, string[]> = {
    '甲': ['子', '午'], '乙': ['子', '午'],
    '丙': ['卯', '酉'], '丁': ['卯', '酉'],
    '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
    '庚': ['寅', '亥'], '辛': ['寅', '亥'],
    '壬': ['巳', '申'], '癸': ['巳', '申']
  };
  if (taiJiMap[dayGan]?.includes(pillarBranch)) stars.push('太极');

  // --- NEW ENHANCED SHEN SHA ---

  // 9. Kong Wang (Empty/Death) - Cyclic Emptiness
  // Based on Day Pillar (Day Gan + Day Zhi) => Xun Kong
  // logic: 10 Stems, 12 Branches. The 2 branches not paired in the 10-day cycle.
  const dayStemIdx2 = HEAVENLY_STEMS.indexOf(dayGan);
  const dayBranchIdx2 = EARTHLY_BRANCHES.indexOf(dayBranch);
  const xunShouIdx = (dayBranchIdx2 - dayStemIdx2 + 12) % 12; // Index of the branch starting the Xun?? No.
  // Method: (BranchIdx - StemIdx). 
  // If (B - S) < 0, add 12.
  // 0 -> Xu Hai, 2 -> Zi Chou, 4 -> Yin Mao, 6 -> Chen Si, 8 -> Wu Wei, 10 -> Shen You.
  // Wait, standard calculation:
  // (Branch - Stem) = diff. 
  // diff = 10 -> Xu(10), Hai(11)
  // diff = 0 -> Xu(10), Hai(11) wait...
  // Let's use standard table lookup for reliability.
  const kongWangMap: Record<number, string[]> = {
    0: ['戌', '亥'], // Jia Zi ... Gui You (Xu Hai empty)
    10: ['申', '酉'], // Jia Xu ... Gui Wei (Shen You empty)
    8: ['午', '未'], // Jia Shen ... Gui Si (Wu Wei empty)
    6: ['辰', '巳'], // Jia Wu ... Gui Mao (Chen Si empty)
    4: ['寅', '卯'], // Jia Chen ... Gui Chou (Yin Mao empty)
    2: ['子', '丑'], // Jia Yin ... Gui Hai (Zi Chou empty)
  };
  // Calculate index difference correctly.
  // (BranchIdx - StemIdx + 12) % 12 is NOT the Xun identifier directly in that map steps of 2.
  // Actually simpler: 
  // Stem=0(Jia), Branch=0(Zi) -> Diff=0. -> Xu/Hai empty.
  // Stem=0(Jia), Branch=10(Xu) -> Diff=10. -> Shen/You empty.
  const diff = (dayBranchIdx2 - dayStemIdx2 + 12) % 12;
  const kw = kongWangMap[diff];
  if (kw && kw.includes(pillarBranch)) stars.push('空亡');

  // 10. Jiang Xing (General Star) - San He's Center
  // Zi/Chen/Shen -> Zi
  // Wu/Xu/Yin -> Wu
  // Mao/Wei/Hai -> Mao
  // You/Chou/Si -> You
  // Check against Year and Day Branch
  [yearBranch, dayBranch].forEach(ref => {
    const group = getSanHeGroup(ref);
    if (group === 'Water' && pillarBranch === '子') stars.push('将星');
    if (group === 'Fire' && pillarBranch === '午') stars.push('将星');
    if (group === 'Wood' && pillarBranch === '卯') stars.push('将星');
    if (group === 'Metal' && pillarBranch === '酉') stars.push('将星');

    // 11. Jie Sha (Robbery Star) - The one AFTER the San He group??
    // Shen-Zi-Chen (Water) -> Si (Robbery)
    // Yin-Wu-Xu (Fire) -> Hai (Robbery)
    // Hai-Mao-Wei (Wood) -> Shen (Robbery)
    // Si-You-Chou (Metal) -> Yin (Robbery)
    if (group === 'Water' && pillarBranch === '巳') stars.push('劫煞');
    if (group === 'Fire' && pillarBranch === '亥') stars.push('劫煞');
    if (group === 'Wood' && pillarBranch === '申') stars.push('劫煞');
    if (group === 'Metal' && pillarBranch === '寅') stars.push('劫煞');
  });

  // 12. Yuan Chen (Original Spirit) - Antagonist
  // Yang Nan (Male) / Yin Nv (Female) rules often apply, but simplistic rule based on Year Branch:
  // Zi -> Wei, Chou -> Wu, Yin -> You, Mao -> Shen, Chen -> Hai, Si -> Xu
  // Wu -> Chou, Wei -> Zi, Shen -> Mao, You -> Yin, Xu -> Si, Hai -> Chen
  // (Simple opposition + 1 step?) - Stick to standard map for Year Branch
  const yuanChenMap: Record<string, string> = {
    '子': '未', '丑': '午', '寅': '酉', '卯': '申', '辰': '亥', '巳': '戌',
    '午': '丑', '未': '子', '申': '卯', '酉': '寅', '戌': '巳', '亥': '辰'
  };
  if (yuanChenMap[yearBranch] === pillarBranch) stars.push('元辰');

  // 13. Gu Chen (Lonely) / Gua Su (Widow)
  // Hai/Zi/Chou (Winter) -> Gu: Yin, Gua: Xu
  // Yin/Mao/Chen (Spring) -> Gu: Si, Gua: Chou
  // Si/Wu/Wei (Summer) -> Gu: Shen, Gua: Chen
  // Shen/You/Xu (Autumn) -> Gu: Hai, Gua: Wei
  const season = ['亥', '子', '丑'].includes(yearBranch) ? 'Winter' :
    ['寅', '卯', '辰'].includes(yearBranch) ? 'Spring' :
      ['巳', '午', '未'].includes(yearBranch) ? 'Summer' : 'Autumn';

  if (season === 'Winter' && pillarBranch === '寅') stars.push('孤辰');
  if (season === 'Winter' && pillarBranch === '戌') stars.push('寡宿');
  if (season === 'Spring' && pillarBranch === '巳') stars.push('孤辰');
  if (season === 'Spring' && pillarBranch === '丑') stars.push('寡宿');
  if (season === 'Summer' && pillarBranch === '申') stars.push('孤辰');
  if (season === 'Summer' && pillarBranch === '辰') stars.push('寡宿');
  if (season === 'Autumn' && pillarBranch === '亥') stars.push('孤辰');
  if (season === 'Autumn' && pillarBranch === '未') stars.push('寡宿');

  // 14. Hong Yan (Red Beauty) - Based on Day Gan
  // Jia-Wu, Yi-Shen, Bing-Yin, Ding-Wei, Wu-Chen, Ji-Chen, Geng-Xu, Xin-You, Ren-Zi, Gui-Shen
  const hongYanMap: Record<string, string> = {
    '甲': '午', '乙': '申', '丙': '寅', '丁': '未', '戊': '辰',
    '己': '辰', '庚': '戌', '辛': '酉', '壬': '子', '癸': '申'
  };
  if (hongYanMap[dayGan] === pillarBranch) stars.push('红艳');

  // 15. Jin Shen (Gold Spirit) - Applies to Hour Pillar usually, but we check if this pillar matches
  // Yi Chou, Ji Si, Gui You
  if ((['乙丑', '己巳', '癸酉'].includes(dayGan + pillarBranch)) ||
    (['乙丑', '己巳', '癸酉'].includes(HEAVENLY_STEMS[stemIdx] + pillarBranch))) {
    // Logic for Jin Shen usually for Hour Pillar. 
    // If this function is called for Hour Pillar, and it is Jin Shen.
    // We don't have pillar stem here passed explicitly except derived stemIdx for Day. 
    // Let's rely on "Day Stem + Pillar Branch" checking?? No, Jin Shen is specific Stem+Branch combo.
    // But we only have pillarBranch here. We need Pillar Stem to be precise.
    // However, the function signature is `getShenSha(pillarBranch, dayGan...)`. 
    // We can't strictly calculate Jin Shen without Pillar Stem.
    // OMIT for now or simplify.
  }

  // 16. Tian De (Heavenly Virtue) - Based on Month Branch
  // Zheng (1) -> Si, Er (2) -> Shen, San (3) -> Ding (Stem)...
  // Complex mapping requiring Stem awareness effectively, but simplified branch mapping exists?
  // Standard: 
  // Zi Month -> Si, Chou Month -> Geng (Stem), Yin Month -> Ding (Stem), Mao Month -> Shen...
  // Since we only check Branch matches here (pillarBranch), we can only detect Branch-based Tian De.
  // If Tian De is a Stem (e.g. Ding), we can't check it against pillarBranch (which is Earthly Branch).
  // Shen Sha usually appears on the Branch OR Stem. 
  // Current PillarData structure stores Gan (Stem) and Zhi (Branch).
  // This function `getShenSha` currently only checking `pillarBranch`. 
  // To be perfect, we needs to check Pillar Stem too.
  // Update: We will skip strict Stem-based Tian De for this iteration to avoid over-complexity, 
  // but we can check the ones that map to Branches:
  // Zi(11) -> Si, Wu(5) -> Hai, Mao(2) -> Shen, You(8) -> Yin. (Yi/Xin/Bing/Ren are stems).
  // Let's implement Branch-based matches.
  if (monthBranch === '子' && pillarBranch === '巳') stars.push('天德');
  if (monthBranch === '午' && pillarBranch === '亥') stars.push('天德');
  if (monthBranch === '卯' && pillarBranch === '申') stars.push('天德');
  if (monthBranch === '酉' && pillarBranch === '寅') stars.push('天德');

  // 17. Yue De (Monthly Virtue) - Based on Month Branch
  // Yin/Wu/Xu (Fire) -> Bing (Stem)
  // Shen/Zi/Chen (Water) -> Ren (Stem)
  // Hai/Mao/Wei (Wood) -> Jia (Stem)
  // Si/You/Chou (Metal) -> Geng (Stem)
  // All Yue De are Stems! We cannot calculate Yue De based on pillarBranch alone. 
  // We need to know the Pillar Stem. 
  // Since we are inside `createPillar`, we know the stem index `sIdx`.
  // Refactoring to pass `pillarStem` would be best, but out of scope for "quick fix".
  // Will omit Yue De for now as it requires Stem checking.

  // De-duplicate stars
  return Array.from(new Set(stars));
};

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


// True Solar Time Calculation
export const getTrueSolarTime = (date: Date, longitude?: number): Date => {
  if (longitude === undefined) return date;

  // 1. Longitude Correction
  // Beijing Time is UTC+8 (120°E).
  // 4 minutes per degree. East of 120 gets later, West gets earlier.
  // Formula: (LocalLong - 120) * 4 minutes
  const longOffsetMinutes = (longitude - 120) * 4;

  // 2. Equation of Time (EoT) calculation
  // Approximation formula based on day of year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  const eotMinutes = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

  // Total offset in milliseconds
  const totalOffsetMs = (longOffsetMinutes + eotMinutes) * 60 * 1000;

  return new Date(date.getTime() + totalOffsetMs);
};

export const calculateBaZi = (date: Date, hour: number | null = null, minute: number | null = null, longitude?: number): BaZiChart => {
  // Use provided hour/minute or fallback to date's
  let baseDate = new Date(date);
  if (hour !== null) baseDate.setHours(hour);
  if (minute !== null) baseDate.setMinutes(minute);
  else baseDate.setMinutes(0); // Default to 0 minutes if not provided

  // Adjust for True Solar Time logic if longitude is provided
  // Note: calculateBaZi uses the 'adjusted' time for determining Pillars.
  // The 'Year' and 'Month' boundaries (Jie Qi) are technically solar-term based, which are absolute moments in time.
  // Standard Bazi practice often adjusts clock time to Local True Solar Time before checking Hour Pillar.
  // Some schools also use it for Day/Month boundaries. We will apply it to the `date` object used for calculation.

  const finalDate = getTrueSolarTime(baseDate, longitude);

  const y = finalDate.getFullYear();
  const month = finalDate.getMonth();
  const day = finalDate.getDate();
  const h = finalDate.getHours();
  // Minute needed for strict Solar Time boundaries if we were precise, but Hour Pillar is 2-hour blocks.

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
      xingYun,
      shenSha: getShenSha(zhi, HEAVENLY_STEMS[dayStemIdx], EARTHLY_BRANCHES[yearBranchIdx], EARTHLY_BRANCHES[monthBranchIdx], EARTHLY_BRANCHES[dayBranchIdx])
    };
  };

  // 处理未知时间
  let hourPillar: PillarData;
  if (hour === null) {
    hourPillar = {
      gan: '?', zhi: '?', ganShen: '未知', zhiShen: '未知',
      hidden: [], hiddenShen: [], naYin: '未知', xingYun: '未知', shenSha: []
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
