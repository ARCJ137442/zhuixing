# 缀形 · 0.4.0

《缀形成象——品六书之精髓，析汉字之形趣》

在线体验：[缀形 · 汉字构形编辑器](https://arcj137442.github.io/zhuixing/)（GitHub 源码仓库保持私有）。

0.4.0 是私有 GitHub 仓库中的离线 UI/输入功能版本，源码基于 0.3.1 并吸收已审阅的 Logo、IDC SVG、Alt/Shift 输入与一等拆字/合字功能。冻结 HTML `0.4.0-rc.9` 是另一份构建产物，不是本版本源码快照。

功能清单、验证结果与保留限制见 [0.4.0 Release Notes](docs/RELEASE-0.4.0.md)。

本版本发布范围经过明确限定：Unicode 17 核心区与 TGH 一级常用字的输入集已完整枚举，但当前数据并未覆盖全集。0.4.0 不宣称完成 20,992 核心字或 3,500 常用字覆盖，也不宣称全字体、跨浏览器或真人输入法验收。逐字结果见[全量覆盖报告](tests/full-coverage-tools/reports/full-coverage-latest.json)和[已知边界](docs/KNOWN-ISSUES.md)。

## 本地运行

直接打开 `app/index.html`，无需构建或联网。IDS 是权威源文本；显示匹配不自动改写原文，拆字/合字等明确事务可撤销。

## 验证

```sh
node scripts/test.mjs
node tests/engine/run.cjs
node tests/known-regressions/tools/known_gate.cjs
node tests/full-coverage-tools/tools/audit-current.cjs
```

已知回归门禁为 10/10 PASS。全量审计准确枚举核心集 20,992 字与 TGH 一级 3,500 字；严格唯一 IDS 分别为 2,065 和 412，另外有歧义字及大量缺失候选，因此审计以“覆盖不完整”退出，不是全量通过。浏览器代表性 UI 验收记录见 `tests/full-coverage-tools/reports/browser-review-latest.json`；实体键盘、IME、字体码位、全量渲染/导出和跨浏览器矩阵仍未验收。

本版本由维护者明确选择按 UI/输入功能范围发布；全量覆盖门禁仍保持 blocked，不修改期望、不降低门槛，也不把该门禁描述为通过。

## 仓库与许可

- `app/`：单文件离线应用、IDS 数据、来源及许可。
- `docs/`：架构、键盘、产品约定和验收边界。
- `tests/`：应用、引擎、已知回归和全量覆盖审计。

GitHub 仓库为私有。软件许可证仍待维护者决定；此私有版本没有授予开源许可。第三方 IDS、Unicode 数据和字体许可证分别保留，见 [LICENSE-DECISION.md](LICENSE-DECISION.md)。
