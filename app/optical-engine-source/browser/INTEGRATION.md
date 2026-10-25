# 0.2.0 浏览器集成契约

新增目录独立于活跃 demo；未修改 `structure-glyph-demo/index.html`。原 Node 引擎及 HTTP 接口不变。此浏览器适配由宿主决定后续 Core/FontFallback，不自行接管输入、选区、IME、只读、动效偏好或设置持久化。

## 构建与加载

`node browser/build-browser.cjs` 从已审查的本地引擎、OFL资产、六条MIT映射生成 `browser/optical-browser.js`。可内联到单HTML或用本地script加载；不依赖Node运行时、不加载字体/资产URL、不安装包。必须保留字体/IDS许可证与来源。浏览器需支持 `structuredClone`。

加载一次定义只读全局 `OpticalGlyph`，并构造单例引擎一次。资产在初始化时快照、校验、冻结一次，不能在每个atom或每帧重复加载bundle。无需先调用构造器。

## 外部唯一Store

`render.opticalEnabled` 默认true，由宿主唯一Store持有。调用：

```js
const rendered = OpticalGlyph.render(sourceIDS, {
  enabled: settings['render.opticalEnabled'],
  unicodeMatch: false
});
```

六条已有Unicode识别仍由宿主外层选择。默认不进行额外匹配；宿主确知六条之一时，可显式 `unicodeMatch:true` 获取对应完整Noto轮廓，仍保留sourceIDS。不猜测未知匹配。

## 结果分类与回退

- `ready`：使用返回的SVG作稳定预览、导出；`layoutMode`为optical/equal-box/matched-outline，`portableOutlines:true`。
- `not-applicable`：仅说明光学能力不适用，`reason/reasons`为disabled、optical-capacity、unsupported-layout、missing-outlines，及最终投影过小的geometry-limit。SVG为null，保留源串、缺件和不支持IDC列表。宿主先确认自己的Core结构合法，再统一选择现有几何纯轮廓或FontFallback。其输出必须分别标几何/字体依赖，不得冒充光学或可移植纯轮廓。
- `rejected`：非法参数/源串或预期外引擎错误，禁止盲目再试宽松回退。保留源串和原因，宿主保留可编辑原文并显示诊断。

`eligibility(sourceIDS, options)`仅做有界预检，返回eligible/not-applicable/rejected。不持有或调用Core。

预检遵守原宿主4000 UTF-16单位、32层、4000节点的边界。合法但超过光学1024单位/16层/255节点的输入在送入光学前返回not-applicable，避免较小光学能力限制削弱旧功能；超原宿主边界或语法非法则rejected。附着变体/修饰符、未完成输入仍由宿主更高层策略保留原文，不能截断源串骗过预检。

## 唯一视觉产物与动效

`rendered.svg`是预览和SVG导出的同一字符串。`viewBox=[0,0,100,100]`，不可再把光学结果强制裁成旧版的7..93视口。墨迹边缘来自近似掩膜且描边有少量外扩，额外裁剪会引入截笔风险。

`leaves` 按源叶顺序，全部源偏移相对当前IDS根（UTF-16，不是文档绝对位置）：

- `sourceStart/sourceEnd/char`：宿主加上根的起始偏移后即可定位源文字。
- `transform=[sx,sy,tx,ty]`：最终SVG的缩放和平移，画布单位为0..100。
- `box=[tx,ty,100*sx,100*sy]`：部件原em方框在最终画布的位置，不是精确painted bbox。
- `bbox/bboxType`：采样格中心的补偿前墨迹边界，不承诺精确轮廓碰撞证明。
- `paint`：当前叶的本地路径片段（无外层g），从最终SVG逐叶提取，不使用第二套部件或布局。
- `paintGroup`：最终SVG中的完整g片段，可用来逐字节核对目标形态。

若将paint放入单独SVG并按box投影，使用本地 `viewBox="0 0 100 100" preserveAspectRatio="none"`，不要让默认等比fit改变最终非等比布局。可让部件层溢出可见，最终画布仍遵循返回viewBox。合成层每帧只更新DOM transform，不再调用render。

完整Unicode命中把整个IDS映射到一项叶，`motionPolicy='static-match'`；不要把完整字轮廓伪装成多个源部件的真实笔画变形。

## 性能边界

适配器与引擎均为每实例有限128项缓存；键包含版本、完整规范参数和源串，私有冻结资产由单例隔离。返回深拷贝，外部更改不会污染缓存。`clearCache()`显式清空两层缓存；`cacheInfo()`供测试观察调用数。

宿主仍须避免每次keyup重算整文：保持未变化atom结果引用或命中缓存；大粘贴可由宿主按需绘制/明确几何回退，不得阻塞或延迟源事务。引擎不设键入定时器，也不决定IME或只读行为。热缓存快不等于新布局快，不能据此宣传全流程性能领先。

## 验证

`node browser/browser-tests.cjs` 31项：纯浏览器上下文无Node；校验一次；合法深结构容量回退；注入拒绝；本地源范围；SVG/paint/transform同源；默认与显式匹配；缓存完整性/容量/防突变；浏览器SVG逐字等于Node引擎。另须宿主独立验证真实DOM、Range、IME、只读和各种动效降级，本适配测试不等于浏览器交互验收。
