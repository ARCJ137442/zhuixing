'''构建有限部件轮廓与 IDC 字体子集。
- 🎯仅从已安装的 OFL Noto 字体提取，不访问网络或下载数据。
- 📌生成脚本供自己与协作者使用；桌面 CPython 3.11+、fontTools 4.61。
- 🤖【2026-10-20】Agent 实现，尚未经人类逐行审核。
'''
from __future__ import annotations

import base64  # 内嵌字体资源
import hashlib  # 固定构建来源
import io  # 内存字体输出
import json  # 数据及来源清单
import re  # 替换明确的生成区域
from pathlib import Path

from fontTools import subset
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTCollection, TTFont

ROOT: Path = Path(__file__).resolve().parents[1]
'''📜不依赖调用时工作目录的项目根目录。'''
FONT: Path = Path('/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc')
'''📜当前离线构建使用的字体集合。'''
FONT_SHA256: str = '5d9c31a059600193c9d7968a998bde886ccdc77e934006ad243b41794c496a7d'
'''📌不静默接受字库版本变化；升级字库须同步来源记录与回归。'''
CHARS: str = '呆亻氵青心忄言讠手扌足辶艹竹纟糸金钅石玉王田目耳力刀刂贝貝页頁鸟鳥马馬鱼魚虫雨衣衤食饣米禾门門阝又子了也白百千万上下来去天中不几九八七六三四五广厂尸户夕寸士止正可古立生牛羊犬犭攵攴欠殳舟车車辛酉见見爪爫瓜甘矢牙羽走里自至穴巾弓戈巴干用甫豆及冫疒疋皮皿网罒耂老申由甲电黾龙龍龟龜龠黑音骨高香黄黃麦麥麻鹿鼎鼠鼻齿齒'
'''📌有限部件目录的唯一编辑源；不包括必须保持不变的17个旧简笔部件。'''
IDC_POINTS: list[int] = list(range(0x2ff0, 0x3000)) + [0x31ef]
'''📌尝试提取17个已解析IDC；实际支持范围写入来源清单。'''


def __number(value: float) -> str:
    '''将轮廓坐标确定性量化到千分之一，避免无意义的小数尾数。'''
    return f'{value:.3f}'.rstrip('0').rstrip('.')


def build_assets() -> None:
    '''验证字库来源、生成轮廓及WOFF，并同步单HTML的生成资产。
    - 📌所有输入验证和序列化先完成，再写文件；运行时不依赖构建工具。
    - ⚠️多个文件不是跨文件原子事务，失败时保留异常堆栈以定位后重建。
    '''
    digest = hashlib.sha256(FONT.read_bytes()).hexdigest()
    if digest != FONT_SHA256:
        raise ValueError(f'字库来源发生变化：{FONT}，SHA256={digest}')
    collection = TTCollection(FONT)
    font = next(f for f in collection.fonts if f['name'].getDebugName(6) == 'NotoSerifCJKsc-Regular')
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    assert cmap is not None
    scale = 100 / font['head'].unitsPerEm
    outlines: dict[str, list[str]] = {}
    for char in dict.fromkeys(CHARS):
        pen = SVGPathPen(glyphs, ntos=__number)
        # 📌保留统一em方框位置，不逐部件拉满边界；y轴转为SVG向下。
        glyphs[cmap[ord(char)]].draw(TransformPen(pen, (scale, 0, 0, -scale, 0, 88)))
        outlines[char] = [pen.getCommands()]
    serialized = json.dumps(outlines, ensure_ascii=False, separators=(',', ':'))
    metadata = {
        'family': font['name'].getDebugName(1),
        'version': font['name'].getDebugName(5),
        'postscriptName': font['name'].getDebugName(6),
        'source': 'https://github.com/notofonts/noto-cjk',
        'fontSha256': digest,
        'license': 'SIL Open Font License 1.1',
        'characters': ''.join(outlines),
        'count': len(outlines),
        'idcSubset': ''.join(chr(point) for point in IDC_POINTS if point in cmap),
        'transform': 'em square x=0.1*x, y=88-0.1*y; fixed placement, 0.001 rounding',
        'quality': 'Original glyph outlines; synthesized layout is schematic, not normative.',
    }
    # 📌WOFF采用标准zlib，无需额外brotli依赖；只保留真实存在的IDC字形。
    idc_font = TTFont(FONT, fontNumber=collection.fonts.index(font))
    options = subset.Options()
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=IDC_POINTS)
    subsetter.subset(idc_font)
    idc_font.flavor = 'woff'
    idc_font.recalcTimestamp = False  # 📌固定来源时间，重复构建逐字节一致。
    output = io.BytesIO()
    idc_font.save(output)
    font_bytes = output.getvalue()
    encoded = base64.b64encode(font_bytes).decode('ascii')
    html_path = ROOT / 'index.html'
    html = html_path.read_text(encoding='utf-8')
    html, paths_replaced = re.subn(r'const OUTLINES = .*?;\n', f'const OUTLINES = {serialized};\n', html, count=1)
    html, font_replaced = re.subn(r'url\(data:font/woff;base64,[^)]+\)', f'url(data:font/woff;base64,{encoded})', html, count=1)
    if paths_replaced != 1 or font_replaced != 1:
        raise ValueError('index.html生成区域缺失；未写入任何构建结果。')
    (ROOT / 'components.generated.json').write_text(serialized, encoding='utf-8')
    (ROOT / 'components-provenance.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    (ROOT / 'idc-subset.woff').write_bytes(font_bytes)
    html_path.write_text(html, encoding='utf-8')
    print(f'✅{len(outlines)}个部件；IDC子集：{metadata["idcSubset"]}')


if __name__ == '__main__':
    build_assets()
