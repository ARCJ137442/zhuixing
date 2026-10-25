# 0.4.0 验证记录

## 已通过

- `node scripts/test.mjs`：规范 LF 验证工作树中 19 个应用套件及 browser adapter suite 全部通过。首轮 Linux CI 曾暴露嵌入 Markdown 的换行差异；生成器与断言现统一规范为 LF，PR 修复后的远端 CI 复跑待定。
- `node tests/engine/run.cjs`：49 PASS、3 SKIP、0 FAIL。运行于规范 LF 验证工作树；因设置模块身份变化，已审阅并更新 target fingerprint，旧指纹归档。此引擎套件不代表全量字符覆盖。
- 已有 `known_gate` 最新报告：10/10 PASS；expectation JSON 与 SHA 锁未修改。本轮未重复执行这项已通过自动化。
- 定向测试：IDC/选区、Alt 方括号、Alt+Shift O 符、Shift+F、设置迁移、文档嵌入同步。
- 本地 HTTP 页面与当前 `app/index.html` 字节一致：1,412,210 bytes，SHA-256 `30fc6a16c97aa0f8627b1be728fc4e20213901e96d2888b59b7833a99a9ef6f2`。桌面 1280px、手机 390px 均无横向溢出；菜单 17 个 IDC 各有 SVG，编辑区 SVG、5 项布局限制标记、空提示隐藏，控制台错误 0。
- 代表性浏览器交互（`衫`拆合与撤销、罕见叶精确合字、多形式不猜、O 符确认）已记录在 [浏览器审阅报告](../tests/full-coverage-tools/reports/browser-review-latest.json)；本轮版本/静态文档同步后复核了完整当前页面的桌面与手机呈现。
- `git diff --check` 通过。
- `git diff --check` 通过。

## 保留的限制

全量 Unicode 17 输入集合已执行，但数据覆盖不足：URO 20,992 字中 2,065 个唯一、60 个多形式、18,867 个缺失或未解析；TGH 一级 3,500 字中 412 个唯一、17 个多形式、3,071 个缺失或未解析。因此全量数据覆盖 audit 仍以覆盖不完整退出（状态码 2），并保持 `dataCoverageComplete=false`、`releaseGate=blocked`。0.4.0 按维护者指令限定为 Logo/UI/快捷输入功能发布，不声称全量字表覆盖。

全量字体 cmap、逐字字体回退与轮廓导出、跨浏览器全量渲染、真人 IME/实体键盘、系统快捷键冲突、读屏和下载尚未完成。浏览器按键验收使用自动化合成输入，不代替操作系统级输入法测试。

软件许可证仍待维护者决定；GitHub 仓库为私有，0.4.0 不增加开源许可。第三方数据、Unicode 数据及 OFL 字体许可按原文件保留。
