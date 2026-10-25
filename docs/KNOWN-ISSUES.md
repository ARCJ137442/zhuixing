# 已知问题与回归门禁

## 已修复：佨/抱递归匹配缺失

源码 0.3.1 基线缺少两条经过审阅的 IDS 定义，导致 `bao-person`、`bao-hand` 和整段输入门禁失败。本候选在数据表中单独补入 `佨 → ⿰亻包`、`抱 → ⿰扌包`，没有放宽导入过滤，也没有全局去除地区/字形标记。原始来源行与审阅边界见 `app/recursive-ids-provenance.json`。

- `⿰亻包` 匹配 `佨`。
- `⿰扌包` 匹配 `抱`。
- `⿰亻报⿰亻包⿰扌包抱` 执行 `fold-all` 得到 `⿰亻报佨抱抱`。
- 负向控制保持：字面 `⿰亻报` 仍为 unmapped，不得被修成 `保`、`抱` 或 `佨`。

另按固定 MIT IDS 来源单独审阅了 `衫 → ⿰衤彡`。一层拆字 `expand-one` 能唯一得到该 IDS；递归拆字 `expand-all` 因 `彡` 在数据中有多个展开定义而保留原字并返回 `needs-choice`，不会猜选其中一种。原始多形式记录与仅采纳第一形式基础结构的原因见 `app/recursive-ids-provenance.json`。

固定 expectation JSON 与 SHA 锁未改。原始失败结果保存在 `tests/known-regressions/reports/original-strict-pre-fix-known-regressions.json`；当前结果以 `tests/known-regressions/reports/known-regression-latest.json` 为准。十项窄门禁全部通过只说明这些锚点，不代替全量3500/CJK、真实 IME、字体质量和辅助技术验收。

## 仍待验收

- 常用3500字与 CJK 全量覆盖、跨字体字形质量。
- 真实浏览器、中文 IME、实体键盘、原生选区/剪贴板/下载、辅助技术与跨设备行为。
- 软件许可仍待维护者选择；GitHub 仓库为私有，0.4.0 不授予开源许可。

## 全量字符覆盖审计 · 2026-10-25

本轮按固定 Unicode 17.0.0 输入集实际枚举了 U+4E00..U+9FFF 的 20,992 个字符，并从 Unihan `kTGH` 抽取 TGH 一级 1–3,500 常用字。集合 fixture 与来源 SHA 固定在 `tests/full-coverage-tools/sets/source-manifest.json`；逐字结果位于 `tests/full-coverage-tools/reports/full-coverage-cases.jsonl`，汇总位于 `full-coverage-latest.json`。这证明测试输入集完整，不代表产品映射完整。

- 核心集：2,065 个严格唯一直接映射、60 个多 IDS 候选、18,867 个缺失或未解析。
- TGH 一级 3,500：412 个严格唯一直接映射、17 个多 IDS 候选、3,071 个缺失或未解析。
- 所有完整精确 IDS 形式（包括同一字的多个不同形式）都能按其直接唯一记录合字；唯一字可反向拆字，多形式汉字仍不自动选一种。未发现错误匹配、字体回退或唯一反拆结果。`衫 → ⿰衤彡` 的显示回退和一层拆字均通过。
- 当前 IDS 数据表 11,336 行、11,008 个不同汉字；HTML 内嵌表与源表一致。该数量与 20,992/3,500 测试范围不是同一概念。

因此之前若把“3500 常用字 + Unicode 核心字”说成产品已经具备的映射覆盖，结论是**不成立**；准确说法是测试目标范围确实定义过，但旧报告没有完整数据集或通过结果。本轮完整枚举后证明当前数据远未覆盖该范围。维护者指示 0.4.0 以 Logo/UI/快捷输入为发布范围；这不改变技术审计的 `dataCoverageComplete=false` 与 `releaseGate=blocked`，也不把全量字集列为 0.4.0 已通过能力。完整字体码位、逐字渲染、导出与跨浏览器全量矩阵仍未运行。
