# 缀形

《缀形成象——品六书之精髓，析汉字之形趣》

## 当前是有已知阻断的建仓接续包

0.3.1-branding 是未发布候选，仅更新品牌命名；不是正式 release。已上线的 0.3.0 同样存在明确的“佨/抱”匹配回归。新门禁10项中7通过、3失败，CI因此应为红色。旧基础套件通过不能覆盖这些失败，也不表示全库或真实浏览器已验收。

- ⿰亻包 应匹配佨，目前失败。
- ⿰扌包 应匹配抱，目前失败。
- 混排 ⿰亻报⿰亻包⿰扌包抱 应合为 ⿰亻报佨抱抱，目前失败；字面“报”不得被猜改。

详见 [已知问题](docs/KNOWN-ISSUES.md)。完整修复、常用3500字/CJK全量、跨浏览器、IME及视觉验收均未完成。

## 启动

直接打开 app/index.html，无需构建或联网。IDS是权威源文本；Unicode呈现不自动改源文，明确拆合命令才创建可撤销事务。所有功能纯键盘可达是产品原则，动效不得成为基本功能前提。

## 测试

    node scripts/test.mjs
    node tests/engine/run.cjs
    node tests/known-regressions/tools/known_gate.cjs

前两项是基础/历史兼容测试。第三项是新的当前应用回归门禁，预期退出码1并报告blocked，不能删除失败样例、降低期望或设置continue-on-error来“修绿”。CI已加入该门禁。

## 建仓接续

建议仓库名 zhuixing，仅供参考，名称由你决定。包内Git bundle保留0.1.6、0.2.0、0.2.1、0.3.0及独立feature/0.3.1-branding历史。没有GitHub远端，也未代建仓库或推送。

- app/：离线应用、数据、许可、当前测试。
- docs/：[文档索引](docs/README.md)、版本来源和已知问题。
- tests/：分层回归与当前失败门禁。
- private-reference/、release/：本地忽略目录，不属于Git源码。

软件LICENSE仍待决定，不宣称MIT开源软件。第三方MIT数据、OFL字体及Unicode数据许可分别保留，见 [许可待决](LICENSE-DECISION.md)。不包含用户截图、私有技能或其他项目。
