# 架构与维护入口

source 是唯一权威编辑文本。展示已有 Unicode、几何字形和动画不会自行改写 source；明确的拆合命令是独立编辑事务。

- app/index.html：离线单 HTML 应用和内嵌产品文档，直接打开即可使用。
- Core / InlineModel：解析、结构与源范围、历史及投影基础。
- editor-boundary.js / editor-commands.js：编辑单位边界、上下文守卫与提示同源命令。
- settings-module.js：独立设置事务与历史；不混入正文历史。
- glyph-renderer.js / optical-browser.js：渲染路由与离线光学候选引擎。
- optical-engine-source/：可复建的引擎、适配器、授权字体资产与来源。
- CompositionMotion：呈现动效，取消和降级不影响稳定结果与编辑真相。
- glyph-identity.js：Unicode 身份分类，不把区块归属或形近视为合法等价映射。

修改产品文档后须同步内嵌文档。app/integrate-docs.cjs 使用 markdown-it；该维护依赖不是运行应用或执行测试所必需。更改字体资产前核对构建脚本声明的字体版本和 OFL 来源。

光学引擎仍为 experimental。左右结构采用已记录的同字体占框护栏，避免窄部件字面退化；这不是全面正确性或审美证明。专业排版、复杂字支持和实际浏览器表现仍需独立验收。

## 0.3.0 新边界

command-system.js 保存稳定ID、白名单执行器和上下文资格，按钮、按键桥接与搜索面板共享dispatch。recursive-engine/ 对固定来源严格行做有界展开与候选并集；歧义、循环和预算失败保留原文。recursive-ids-provenance.json 给出数据来源和处理限制；不将数据集内等价泛化为语言学或字形绝对等价。
