# 建仓接续的已知问题

## 阻断：10项已知回归门禁有3项失败

0.3.1仅品牌变更，没有修复0.3.0引擎/数据问题。当前应用adapter直接加载app/recursive-engine/engine.cjs与app/recursive-ids.rows.json，不用替代引擎掩盖问题。

1. bao-person：⿰亻包必须匹配佨。
2. bao-hand：⿰扌包必须匹配抱。
3. user-full-bao-string：⿰亻报⿰亻包⿰扌包抱执行fold-all必须得到⿰亻报佨抱抱。

当前三项失败，其他七项通过。⿰亻报仍必须字面保留，不得误修为保、抱或佨。所期待的来源行、严格比对与禁止变通项保存在tests/known-regressions/regressions/expected-known.json，SHA锁禁止静默弱化期望。

运行node tests/known-regressions/tools/known_gate.cjs应返回1。reports/original-strict-pre-fix-known-regressions.json保留原始发现；reports/known-regression-latest.json是在本仓库当前应用重跑的结果。前者路径与锁为原快照来源证据，不是当前路径；当前依赖身份见current-target.json。

基础18套330项属于更早版本门禁，品牌另11项，只能证明各自覆盖的行为，不取消新失败。完整修复需沿既有反例扩大验证，不能只让这10项通过就宣称完成。

## 未完成

常用3500字与CJK完整覆盖、全量SVG/跨字体质量、真实浏览器/中文IME/原生选区/剪贴板/下载、辅助技术和跨设备行为。没有把未测、缺数据、缺字体、超时或缺参考算通过。

软件许可仍待维护者选择。仓库当前仅供接续开发，不是正式发布包。
