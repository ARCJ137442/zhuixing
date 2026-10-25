# 缀形

《缀形成象——品六书之精髓，析汉字之形趣》

## 当前候选状态

`0.3.1-branding` 是未发布的源码基线；当前隔离工作树包含尚未提交的本地 UI 与数据迭代，不是正式 release，也不是冻结交付 HTML `0.4.0-rc.9` 的精确源码构建。原有 `佨/抱` 三项回归锚点现为 10/10 PASS，expectation 与哈希锁未放宽。

全量覆盖审计已按 Unicode 17.0.0 固定集实际枚举 20,992 个基本多文种平面汉字及 TGH 一级 3,500 常用字，但这表示**审计范围已跑完**，不表示产品覆盖已完成：当前严格唯一 IDS 为核心集 2,065/20,992、常用集 412/3,500；另有 60 个核心字、17 个常用字多解，其余 18,867 个核心字与 3,071 个常用字没有唯一可用候选。覆盖与字体/导出/全量浏览器阶段仍阻断发布，见 [覆盖审计报告](tests/full-coverage-tools/README.md) 和 [已知问题](docs/KNOWN-ISSUES.md)。

## 启动

直接打开 app/index.html，无需构建或联网。IDS是权威源文本；Unicode呈现不自动改源文，明确拆合命令才创建可撤销事务。所有功能纯键盘可达是产品原则，动效不得成为基本功能前提。

当前隔离分支在 0.3.1 源码基线上探索本地 UI 候选：工作台呈现与 17 种 IDC 快速插入有改动，核心身份与数据版本仍标记为 0.3.1。此候选不是 0.4.0-rc.9 的源码快照，也不代表发布或许可决策。

缀形正式品牌标志已获批准：权威双色 SVG 位于 app/branding/zhuixing-logo.svg，本地单文件界面嵌入相同路径。标志获批不改变当前版本、发布状态或其余 UI 候选的验收状态。

## 测试

    node scripts/test.mjs
    node tests/engine/run.cjs
    node tests/known-regressions/tools/known_gate.cjs
    node tests/full-coverage-tools/tools/audit-current.cjs

前两项是基础/历史兼容测试；known-gate 的 10 个固定锚点当前全部通过，但不代表全量覆盖。最后一项完整枚举固定 Unicode 17 核心集与 TGH 一级常用集，缺候选、多解及未运行的字体/导出/浏览器阶段都继续阻断完整覆盖结论；不能通过删除样例、降低期望或放宽锁来“修绿”。

## 建仓接续

建议仓库名 zhuixing，仅供参考，名称由你决定。包内Git bundle保留0.1.6、0.2.0、0.2.1、0.3.0及独立feature/0.3.1-branding历史。没有GitHub远端，也未代建仓库或推送。

- app/：离线应用、数据、许可、当前测试。
- docs/：[文档索引](docs/README.md)、版本来源和已知问题。
- tests/：分层回归与当前失败门禁。
- private-reference/、release/：本地忽略目录，不属于Git源码。

软件LICENSE仍待决定，不宣称MIT开源软件。第三方MIT数据、OFL字体及Unicode数据许可分别保留，见 [许可待决](LICENSE-DECISION.md)。不包含用户截图、私有技能或其他项目。
