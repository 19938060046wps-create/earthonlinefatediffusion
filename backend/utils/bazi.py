"""
八字计算工具模块
从前端 TypeScript 版本移植的 Python 实现
"""

from datetime import datetime
from typing import TypedDict, List, Optional

# 天干
HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
# 地支
EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

# 藏干
HIDDEN_STEMS = {
    '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'], '卯': ['乙'],
    '辰': ['戊', '乙', '癸'], '巳': ['丙', '戊', '庚'], '午': ['丁', '己'], '未': ['己', '丁', '乙'],
    '申': ['庚', '壬', '戊'], '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
}

# 纳音
NA_YIN_DATA = [
    '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
    '泉中水', '屋上土', '霹雳火', '松柏木', '长流水', '沙中金', '山下火', '平地木', '壁上土', '金箔金',
    '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水'
]

# 十二长生
GROWTH_PHASES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

# 地支本气
BRANCH_MAIN_QI = {
    '子': '癸', '丑': '己', '寅': '甲', '卯': '乙', '辰': '戊', '巳': '丙',
    '午': '丁', '未': '己', '申': '庚', '酉': '辛', '戌': '戊', '亥': '壬'
}

# 节气日期（简化版，用于判断月柱）
JIE_DAYS = [6, 4, 6, 5, 6, 6, 7, 8, 8, 8, 8, 7]


class PillarData(TypedDict):
    """柱数据结构"""
    gan: str
    zhi: str
    ganShen: str
    zhiShen: str
    hidden: List[str]
    hiddenShen: List[str]
    naYin: str
    xingYun: str


class BaZiChart(TypedDict):
    """八字命盘数据结构"""
    year: PillarData
    month: PillarData
    day: PillarData
    hour: PillarData


def get_element(char: str) -> Optional[str]:
    """
    获取天干或地支对应的五行
    """
    element_map = {
        '甲': 'wood', '乙': 'wood', '寅': 'wood', '卯': 'wood',
        '丙': 'fire', '丁': 'fire', '巳': 'fire', '午': 'fire',
        '戊': 'earth', '己': 'earth', '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
        '庚': 'metal', '辛': 'metal', '申': 'metal', '酉': 'metal',
        '壬': 'water', '癸': 'water', '亥': 'water', '子': 'water',
    }
    return element_map.get(char)


def get_stem_index(stem: str) -> int:
    """获取天干索引"""
    return HEAVENLY_STEMS.index(stem) if stem in HEAVENLY_STEMS else 0


def get_ten_god(day_stem_index: int, other_stem_index: int) -> str:
    """
    计算十神
    """
    day_elem = day_stem_index // 2
    other_elem = other_stem_index // 2
    day_pol = day_stem_index % 2
    other_pol = other_stem_index % 2
    same_pol = day_pol == other_pol
    dist = (other_elem - day_elem + 5) % 5

    if dist == 0:
        return '比肩' if same_pol else '劫财'
    if dist == 1:
        return '食神' if same_pol else '伤官'
    if dist == 2:
        return '偏财' if same_pol else '正财'
    if dist == 3:
        return '七杀' if same_pol else '正官'
    if dist == 4:
        return '偏印' if same_pol else '正印'
    return ''


def calculate_bazi(date: datetime) -> BaZiChart:
    """
    计算八字命盘
    
    :param date: 出生日期时间
    :return: 八字命盘数据
    """
    year = date.year
    month = date.month - 1  # 0-indexed
    day = date.day
    hour = date.hour

    # 计算年柱
    bazi_year = year
    if month < 1 or (month == 1 and day < 4):
        bazi_year = year - 1
    
    year_offset = bazi_year - 1984
    year_stem_idx = (year_offset % 10 + 10) % 10
    year_branch_idx = (year_offset % 12 + 12) % 12

    # 计算月柱
    potential_branch = (month + 1) % 12
    if day < JIE_DAYS[month]:
        potential_branch = (potential_branch - 1 + 12) % 12
    month_branch_idx = potential_branch
    tiger_stem = (year_stem_idx % 5) * 2 + 2
    month_stem_idx = (tiger_stem + (month_branch_idx - 2 + 12) % 12) % 10

    # 计算日柱
    ref_date = datetime(2000, 1, 1)
    target_date = datetime(year, month + 1, day)
    diff_days = (target_date - ref_date).days
    day_stem_idx = ((4 + diff_days) % 10 + 10) % 10
    day_branch_idx = ((6 + diff_days) % 12 + 12) % 12

    # 计算时柱
    if hour >= 23:
        hour_branch_idx = 0
    else:
        hour_branch_idx = ((hour + 1) // 2) % 12
    hour_stem_start = (day_stem_idx % 5) * 2
    hour_stem_idx = (hour_stem_start + hour_branch_idx) % 10

    def create_pillar(s_idx: int, b_idx: int, is_day: bool = False) -> PillarData:
        gan = HEAVENLY_STEMS[s_idx]
        zhi = EARTHLY_BRANCHES[b_idx]
        
        # 计算纳音
        cycle_idx = 0
        for i in range(60):
            if i % 10 == s_idx and i % 12 == b_idx:
                cycle_idx = i
                break
        na_yin = NA_YIN_DATA[cycle_idx // 2] if cycle_idx // 2 < len(NA_YIN_DATA) else '未知'
        
        # 藏干
        h_stems = HIDDEN_STEMS.get(zhi, [])
        h_shen = [get_ten_god(day_stem_idx, get_stem_index(s)) for s in h_stems]
        
        # 十二长生
        phase_idx = (b_idx + (12 - day_stem_idx)) % 12
        xing_yun = GROWTH_PHASES[phase_idx] if phase_idx < len(GROWTH_PHASES) else '帝旺'

        return PillarData(
            gan=gan,
            zhi=zhi,
            ganShen='日主' if is_day else get_ten_god(day_stem_idx, s_idx),
            zhiShen=get_ten_god(day_stem_idx, get_stem_index(BRANCH_MAIN_QI.get(zhi, ''))),
            hidden=h_stems,
            hiddenShen=h_shen,
            naYin=na_yin,
            xingYun=xing_yun
        )

    return BaZiChart(
        year=create_pillar(year_stem_idx, year_branch_idx),
        month=create_pillar(month_stem_idx, month_branch_idx),
        day=create_pillar(day_stem_idx, day_branch_idx, True),
        hour=create_pillar(hour_stem_idx, hour_branch_idx)
    )


def get_dayun(year_gan: str, month_gan: str, month_zhi: str, 
              gender: str, birth_year: int) -> List[dict]:
    """
    计算大运
    
    :param year_gan: 年干
    :param month_gan: 月干
    :param month_zhi: 月支
    :param gender: 性别 ('male' 或 'female')
    :param birth_year: 出生年份
    :return: 大运列表
    """
    year_stem_idx = HEAVENLY_STEMS.index(year_gan)
    month_stem_idx = HEAVENLY_STEMS.index(month_gan)
    month_branch_idx = EARTHLY_BRANCHES.index(month_zhi)
    
    is_year_yang = (year_stem_idx % 2) == 0
    is_forward = is_year_yang if gender == 'male' else not is_year_yang

    qi_yun_age = 4
    yun = []

    # 小运
    yun.append({
        'gan': '小',
        'zhi': '运',
        'age': 1,
        'year': birth_year,
        'isXiaoYun': True
    })

    # 八步大运
    for i in range(1, 9):
        offset = i if is_forward else -i
        stem_idx = ((month_stem_idx + offset) % 10 + 10) % 10
        branch_idx = ((month_branch_idx + offset) % 12 + 12) % 12
        start_age = qi_yun_age + (i - 1) * 10
        
        yun.append({
            'gan': HEAVENLY_STEMS[stem_idx],
            'zhi': EARTHLY_BRANCHES[branch_idx],
            'age': start_age,
            'year': birth_year + start_age,
            'isXiaoYun': False
        })

    return yun
