# 复杂字边界研究与测试夹具

2026-10-20。测试优先级：基本组合功能 > 字形呈现 >> 动效。此目录只记录来源、候选与预期，不代表用例已经在应用中执行通过。

## 用户输入保持原样

`𰻝（⿺辶⿳穴⿲月⿱svg𮘎⿰svg𲈤长刂心）`

其中表达式为19个Unicode标量、21个UTF-16代码单元。两处字面量 `svg` 是普通ASCII字符；其来源与含义尚未确认。它们不出现在下面的固定数据行中，可能是复制/渲染残留，但这仅是假设，不能自动删除、解释成资源引用或当成可执行SVG。严格基础IDS子集应在首个不支持字符给出诊断，而非假装成功组出目标字。文档允许普通文本，不等于结构表达式内部允许ASCII作部件。

## 固定数据与码点

[MIT 数据固定版本](https://github.com/yi-bai/ids/blob/267e3fb5d0a32de63128e67ef2f329277cc4013c/ids_lv0.txt)：

- 𰻝 U+30EDD：`⿺辶.⿳穴.d⿲月.⿱𮘎y⿰𲈤长.刂心`
- 𮘎 U+2E60E：`⿱亠J⿴𢆶J⿱二.口.(.);⿴𢆶.言.(y)`
- 𲈤 U+32224：`⿰长.马.`

这些扩展IDS带有变体标识。特别是目标字采用 `𮘎y`，而该码点的默认分解和 y 分解不同。没有证据允许把两者呈现为同一个确定字形。`.d`、`y`、`J` 不是应全局删除的噪声。

Unicode官方字符表可核码点/区块及提交来源：
- [Extension G 表](https://www.unicode.org/charts/PDF/U30000.pdf)：U+30EDD，UTC-01312。
- [Extension F 表](https://www.unicode.org/charts/PDF/U2CEB0.pdf)：U+2E60E，JMJ-058745（PDF零起始页76）。
- [Extension H 表](https://www.unicode.org/charts/PDF/U31350.pdf)：U+32224，GZA-112847（PDF零起始页48）。

这些是动态最新表链接，工具返回的F/H表自述版本18.0，G检索结果自述17.0；本研究只引用码点事实，不据此推断发布日期或当前最新规范。PDF提取文字里的替代字体字形不可当目标字。Unicode图表也明确参考字形并非字体必须遵循的唯一外形，并限制从图表提取字体数据；此处没有提取轮廓。

[zi.tools 𰻝](https://zi.tools/zi/𰻝)、[𮘎](https://zi.tools/zi/𮘎)、[𲈤](https://zi.tools/zi/𲈤) 的公开字页，本次web工具返回JS占位或不可访问，因此未把这些页面的内容当作已视觉确认。

## 候选与验收边界

夹具中的 `⿺辶⿳穴⿲月⿱𮘎⿰𲈤长刂心` 仅用于基础结构语法测试。它是显式标记的人工候选，不是用户已批准的修复，不宣称与数据原式的变体等价。结构为13节点、8叶、从根0计最大深度5，15个UTF-16代码单元。

字符已编码、语法可解析、存在匹配数据、当前字体有轮廓、轮廓变体正确，这五项必须独立验收。没有当前字体cmap/轮廓证据时，不得因码点存在便声称可显示。复杂结构不能通过替换成单一码点来绕过组合与缺件测试。

夹具包含10类边界：原串保留、扩展语法、候选完整树、非BMP标量、带补充区VS的合成字素测试、缺最后操作数、额外操作数、SVG标记转义、深度上限、长度上限。VS测试是合成编辑边界，不主张该字的变体序列已注册。资源上限采用实现公开配置做N与N+1测试，不能偷偷截断；动画可禁用或降级，不应影响文本事务或错误恢复。

数据沿用上层 IDS-DATA-LICENSE.txt；本文件与夹具不含全库拷贝或第三方轮廓。

## Unicode 身份回归

新增 unicode-identity-fixtures.json，固定 Unicode Character Database 17.0.0。来源为官方 [Blocks.txt](https://www.unicode.org/Public/17.0.0/ucd/Blocks.txt)、[UnicodeData.txt](https://www.unicode.org/Public/17.0.0/ucd/UnicodeData.txt)、[DerivedAge.txt](https://www.unicode.org/Public/17.0.0/ucd/DerivedAge.txt) 和 [PropList.txt](https://www.unicode.org/Public/17.0.0/ucd/PropList.txt)，含各文件SHA256及逐条相关原行。沿用随附 UNICODE-DATA-LICENSE.txt。

- 你 U+4F60：CJK Unified Ideographs（基本区），Age 1.1，已分配，General_Category=Lo。
- 𰻝 U+30EDD：Extension G，Age 13.0，已分配，Lo。
- 𮘎 U+2E60E：Extension F，Age 10.0，已分配，Lo。
- 𲈤 U+32224：Extension H，Age 15.0，已分配，Lo。

同表还提供仁、明、休、好、男身份，覆盖此前六条小型映射。UnicodeData 的 First/Last 是其正式范围压缩格式，已按匹配端点展开判断，不是凭区块成员身份推测。

反例 U+3134B 位于 Extension G 区块，但在17.0的UnicodeData未分配，也不在Unified_Ideograph属性或Age已分配范围。请用它防止将整个区块一律当作已编码字。

“非规范”不能从字体缺件或六条映射表未命中推导；表外未知码点保守标身份未核验。若未来完整识别，需内嵌经许可的已分配区间数据，不能只使用Blocks。Age不是字体支持版本，也不是用户输入或字形是否合规范的判据。
