# Portable 0.2.0 final verification

当前入口：node tests/engine/run.cjs。最新本地portable-final-seed-*报告覆盖最终 aae434 运行时代码等价的脱敏fixture：三个seed均52项/49pass/3skip。此前c1b17及pre-quality-guard报告是历史证据，不代表最新版本。路径、脱敏和锁文件迁移详见 PORTABLE-MIGRATION.md。下面原研究记录中的工作区路径只用于解释历史，不是当前命令。

# 组字引擎可持续测试体系

这是可执行的分层测试起点，不是“专业级已经验收”的证明。使用成熟的 Node 原生 node:test / assert，无需安装任何测试依赖。没有改动活跃应用。代码和夹具可以纳入Git；不要把外部参考SVG、截图或未知许可字体加入仓库。

## 快速运行

从仓库/工作区根目录：

    node tests/engine/run.cjs
    GLYPH_SEED=1 node tests/engine/run.cjs
    GLYPH_SEED=4294967295 GLYPH_ITERATIONS=64 node tests/engine/run.cjs

运行器核对 target-lock.json 后执行测试；目标在测试前或过程中变化会阻断或使本次结果无效。受测目标包括独立光学引擎及资产、纯设置/编辑边界/Unicode身份模块、自有冻结0.1.4基线和0.1.6依赖。绝不从正在变化的 index.html 自动抽取并冻结。最终0.2.0由作者宣布冻结后，逐字节核对其给定SHA c1b17ae549656fe6edccc9e797913dd2e936fbca478b42c131c3c4be9a7543ab，再保存fixtures/host-v020.html，另加5项完整同版本纯模块联动检查。

EditBoundary 的夹具是“当前纯模块 + 冻结0.1.6 Core/InlineModel/UnicodeMatches”，用于函数级合约验证，不能当0.2完整宿主验收。随后新增的final-host.test.cjs确实使用最终0.2.0同版本内联模块，但仍没有加载DOM/app事件或真实浏览器。真实UI设置、DOM事件、输入法、复制粘贴、下载仍要在最终应用独立验收。

若目标改变，先检查改动、许可证、契约和旧回归，再明确记录：

    node tests/engine/run.cjs --record-target='Reviewed change description with version and reason'

这个操作只记录身份，不代表批准或测试成功。旧锁文件自动保留。CI不能通过自动重录指纹来绕过回归。

## 本次实际执行

- 最终独立引擎：0.2.0，engineName optical-experimental；乃部件已经加入授权资产。
- 3个固定seed：20261020、1、4294967295；每次52个Node测试，49通过、0失败、3显式跳过，约1.2秒完成。
- 默认每条生成性质64个输入；渲染性质最多24个；设置模型序列最多40步；缓存案例129个；失败缩减最多80次；整次执行硬超时120秒。不得把它改成公网压力测试。
- 实际跑了两个独立结构（人中、乃至）的PNG描述性差异；没有读取对应第三方SVG。
- 三项跳过不是通过：乃至实际行内视觉、真实浏览器IME/光标/撤销、真实下载/减少动态效果。

最新JSON：reports/latest.json；原始TAP：reports/latest.tap；各seed结果单列保存。环境记录Node/V8/ICU/Unicode版本。性质测试中的断言次数不能冒充独立用例数。

## 分层矩阵

详见机器可读 matrix.json：

1. unit：操作符元数、严格AST、缺/多操作数、注入、非字符串不强转、源串保留、255节点/16深度/1024 UTF16以及参数上下界。
2. property/metamorphic：固定seed树生成；AST序列化往返；尾随/缺项不得静默消失；有限几何；同输入确定；大小只改输出尺寸；颜色只改paint；缓存清理/结果修改不污染；设置事务与独立布尔历史模型一致。
3. corpus：原始用户串中的字面svg、数据扩展修饰、仅用于审查的简化候选、9个已分配码点与U+3134B未分配、非BMP/合成IVS、乃至历史回归。注册IVS、字体覆盖、异体等价没有由这些测试证明。
4. visual：两种结构的跨字体PNG指标只是描述。需要真实字形专家评审、painted轮廓碰撞和笔画/部件关系；像素更接近不等于正确或更美。
5. host-module：设置原子更新、撤销/重做、禁止source混入设置、编辑边界不劈开代理对/IVS、源码视图优先、只读预览无编辑事务、SVG与部件paintGroup同源。
6. realbrowser：未执行；需要最终冻结应用，多浏览器、OS、IME、DPR/缩放、字库失效、触屏/键盘/读屏、复制粘贴、undo/redo、导出下载及reduced-motion矩阵。

## 边界语义与诚实解释

长度1023/1024的“木重复串”会因严格单树语法失败，而不是因为长度限制；1025先命中长度限制。255节点限制可能先于长度达到，因此不能假装1024单位的有效树能通过所有其他限制。树深度从根0计。宿主32深度与光学16深度分别测试，超出光学容量不自动等于宿主非法。

Unicode区块成员不等于已分配；已编码不等于当前字体有轮廓；有轮廓不等于变体正确；可导出SVG不等于规范字形。每一项需独立证据。

乃至最初作为缺件案例时，资产尚未补乃；首轮锁定运行发现已经ready，导致两条旧期望失败。原TAP/JSON和旧回归说明全部保留，新迁移记录解释改期望原因，missing路径改用确实无素材的PUA。乃至浏览器小字面问题仍为open，没有用“ready”掩盖它。用户图是“你好”后偏小乃至，不是字统图。

## 失败缩减与追加回归

自制生成器是有界确定性的xorshift，不声称具有fast-check全部能力。失败时保存seed、iteration、original、minimal、错误签名、缩减预算到reports/failures/。删除式缩减只保留相同错误签名，避免把语义失败缩成无关语法错误；最多80次，未保证全局最小。

- 不删除失败报告，不通过修改输入/自动修复svg字面量让用例消失。
- 复现并审查后，把最小和原始输入一起追加到regressions/，说明用户意图、期望、目标指纹及问题根因。
- corpus-baseline.json保护既有语料，删除或改写会失败；需要纠错时保留旧文件并新建版本+迁移理由。新增回归应在review后增补保护清单，不能偷偷改旧hash。
- 用例修正必须区别“引擎缺陷”“过时期望”“测试工具缺陷”。原报告始终可追溯。

## 两个外部结构的描述性复现

    node tests/engine/visual-descriptive.cjs
    python glyph-benchmark/metrics.py raster glyph-engine-test-system/reports/visual-descriptive

之后显式使用metrics.py compare接收获准本地参考PNG；来源/哈希见reports/visual-descriptive/reference-provenance.json。目录内只有我们生成的SVG/PNG和差异数值，不含外部参考像素。未对外站批量调用或压测；未把形近结果当已编码匹配。

## 后续成熟工具链

fast-check可替换/增强自制生成器和缩减；Playwright可承接最终浏览器交互矩阵。两者本任务均未安装、未执行，不暗示已具备相关验证。优先用现有node:test把契约和历史失败固定下来，再按明确浏览器覆盖计划引入工具。

专业研究者可用性还要求：原始IDS和扩展标记保真、Unicode/字形/异体分层、来源许可证追踪、可解释错误与不丢源、专家审查、复杂嵌套/包围/缺件质量、可复现导出、真实输入法/可访问性和版本迁移测试。这些不能用测试总数代替。

最终0.2.0还验证了已核Unicode输出title/warnings不再误称编码未确认或轮廓压缩；自定义组合则保留“映射未确认”，不说“未编码”。文案合约变更曾被目标hash锁实际阻断，阻断报告也已保留。
