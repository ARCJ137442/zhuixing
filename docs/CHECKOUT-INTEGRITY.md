# 跨平台换行与指纹

## 契约

`.gitattributes` 将 Git 判断为文本的文件统一按 LF 检出，并明确保留字体、图片、压缩包等二进制文件。这样同一提交在 `core.autocrlf=true` 的环境下也应保持字节一致；无需修改开发者的全局 Git 设置。

`node scripts/check-checkout.cjs` 只读比较当前工作区中每个追踪文件与 HEAD 的 Git blob 字节身份，不改文件、不更新锁。请在干净 checkout 中运行；有意的未提交源码修改也会被它拒绝，这是预期行为，不能替代对修改内容的审查。它不验证运行功能。

## 为什么需要这项保障

对基线 `6d059e9690f72f1bb6a251bd247e796afb943b1e` 的独立核查中，170 个追踪文件与交付 source ZIP 全部逐字节一致。Linux / Node v24.19.0 下，原 LF checkout 三条测试退出码为 0 / 0 / 1；仅启用 Git CRLF checkout 即变为 1 / 2 / 1：

1. `app/branding-tests.cjs:12` 比较 HTML 内嵌 JSON 解码后的 LF 文档与独立 CRLF Markdown，严格字符串断言失败。
2. `tests/engine/run.cjs` 的 10 个文件指纹发生变化；仅将 CRLF 归一为 LF 后，全部恢复原锁值。
3. `tests/known-regressions/tools/known_gate.cjs` 在期望 JSON 完整性检查处停止，尚未执行语义用例。原 LF 期望哈希为 `c22684a232de889faa369a7cfa51d6d64d58536f10971ec21744ba4c463a9321`。

这证明行尾转换可以造成这些错误，不意味着已核实每位开发者的实际环境原因。本修复不改变任何语义断言、期望文件或目标锁。

## 验证方式与边界

在独立新目录，使用 `git clone --config core.autocrlf=true --branch <待验证分支> <仓库地址> <新目录>` 获取干净 checkout，再运行：

```sh
node scripts/check-checkout.cjs
node scripts/test.mjs
node tests/engine/run.cjs
node tests/known-regressions/tools/known_gate.cjs
```

CI 对 Ubuntu 与 Windows 使用相同命令和 Node 22，任一检查失败都会阻止该环境后续步骤，未使用 `continue-on-error`。矩阵不提前取消另一个系统，以便保留两边真实结果。修改工作流不等于两种系统均已实际执行通过；以对应提交的 CI 结果为准。

当前已知门禁仍必须实际执行 10 项，保留 7 通过、3 失败的阻断状态，直至引擎或数据修复；不能把“指纹检查提前失败”误称为预期语义失败。历史引擎 49 通过、3 跳过不表示全 CJK / 常用3500字、真实浏览器或 IME 已通过。

若已有工作区行尾不符，先保存自己的修改，再从全新目录验证；不要为方便核验而强制重置已有工作树或批量重录指纹。

## 此修复的本地复核

2026-10-20，在 Linux / Node v24.19.0 中使用 `core.autocrlf=true` 全新克隆修复分支：173 个追踪文件全部与 HEAD 字节相同；基础测试退出 0；历史引擎退出 0（49 通过、3 跳过）；已知门禁退出 1（实际执行 10 项，7 通过、3 失败，目标未改变、依赖指纹无不匹配）。另在独立副本中只给 `app/document.md` 增加一个换行，字节检查准确报告唯一差异并退出 1，未改任何期望。

这是对 Git CRLF 配置的受控复现，不是原生 Windows 实机或远端 Actions 已通过的声明。真实 Windows、Node 22 矩阵与浏览器验收仍待对应环境执行。
