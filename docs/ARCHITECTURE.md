# 架构与维护入口

source 是唯一权威编辑文本。展示已有 Unicode、几何字形和动画不会自行改写 source；明确的拆合命令是独立编辑事务。

- app/index.html：离线单 HTML 应用和内嵌产品文档，直接打开即可使用。
- UI 本地候选：工作台左侧编辑真实 source，右侧只读观察区从已渲染 atom 生成副本；观察区不参与编辑、历史或持久化。正式品牌标志的权威资产为 app/branding/zhuixing-logo.svg（“纟＋彡”双色原图轮廓）；app/index.html 内嵌同一组 SVG 路径，保持离线单文件使用。
- Core / InlineModel：解析、结构与源范围、历史及投影基础。
- editor-boundary.js / editor-commands.js：编辑单位边界、上下文守卫与提示同源命令。
- IDC 快速插入：`editor-commands.js` 与单文件内嵌副本共用全部17项 Alt 快捷候选映射；编辑器聚焦时按住 Alt 显示贴近光标的 SVG 候选层，按映射插入，keyup/失焦/Escape 后关闭。Shift 选区语义不变；手机与快捷键关闭时仍可从17个 SVG 按钮插入。插入仍调用原 `insert()` 文本事务，不改变源字符语义。
- 偏旁快捷插入：独立设置与命令注册表提供实验性纯 `Shift+F` → `扌` 映射，仅在可编辑器焦点、无 IME 组合且无其他修饰时触发。`Ctrl+Shift+F` 和 Shift+方向键保持宿主职责；其它一对多 O 符家族不静默映射。
- 渐进披露：构形观察默认折叠，用户明确展开后桌面并列/窄屏堆叠；IDC 插入面板、偏旁筛选、快捷提示和许可详情按需显示。
- settings-module.js：独立设置事务与历史；不混入正文历史。
- glyph-renderer.js / optical-browser.js：渲染路由与离线光学候选引擎。
- optical-engine-source/：可复建的引擎、适配器、授权字体资产与来源。
- CompositionMotion：呈现动效，取消和降级不影响稳定结果与编辑真相。
- glyph-identity.js：Unicode 身份分类，不把区块归属或形近视为合法等价映射。

修改产品文档后须同步内嵌文档。app/integrate-docs.cjs 使用 markdown-it；该维护依赖不是运行应用或执行测试所必需。更改字体资产前核对构建脚本声明的字体版本和 OFL 来源。

光学引擎仍为 experimental。左右结构采用已记录的同字体占框护栏，避免窄部件字面退化；这不是全面正确性或审美证明。专业排版、复杂字支持和实际浏览器表现仍需独立验收。

## 0.3.0 新边界

command-system.js 保存稳定ID、白名单执行器和上下文资格，按钮、按键桥接与搜索面板共享dispatch。recursive-engine/ 对固定来源严格行做有界展开与候选并集；歧义、循环和预算失败保留原文。recursive-ids-provenance.json 给出数据来源和处理限制；不将数据集内等价泛化为语言学或字形绝对等价。
