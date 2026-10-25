# 缀形 0.4.0 本地 UI 候选审阅

日期：2026-10-25（Asia/Shanghai）

## 状态与边界

- 工作树：`H:/A137442/Develop/Han/zhuixing-ui-20261025`，分支 `feature/0.4.0-ui-20261025`，基线 HEAD `02cb9c0d46cdb8da294ffde3a2be2ebb1bb2baed`。
- 本地 `app/index.html` 是未提交、未发布候选，当前 1,429,832 bytes，SHA-256：`27f58179e0a93c4122fe22147dfa9d3fce3b456253ed4c35349688a7376ec1cb`。首轮截图与 HTTP 字节校验对应前一候选版本；最新 UI 增量尚未在浏览器截图。
- 已发布的 GitHub `v0.4.0` Release 资产与 tracked `app/releases/0.4.0/index.html` 保持一致，SHA-256 为 `30fc6a16c97aa0f8627b1be728fc4e20213901e96d2888b59b7833a99a9ef6f2`。本地候选不同，不代表 Release 资产，也未同步到 Release。
- GitHub Deployments API 检查为 0 条记录；这表示未查到站点部署记录，不改变 Release 已发布这一事实。
- Unicode 全量覆盖仍 `dataCoverageComplete=false`、`releaseGate=blocked`；这轮没有改数据、覆盖报告或门禁状态。

## 视觉方向与状态

采用“缀线字模台”：沿用已确认的棕红「纟」与苔绿「彡」Logo，以纸面、墨色标题和版面细线建立辨识；源 IDS 是主操作面，右侧是只读观察面。构件不使用推测性的义符/声符颜色。观察栏默认展开；窄屏改为纵向堆叠。预览框线收为外框加单一内线，英文小标签改为中文，移除重复的第二个观察收起按钮。

| 状态 | 浏览器观察 | 结果 |
|---|---|---|
| 空白 | 空编辑器与“等待源文”观察占位并列 | **PASS**；未显示虚构的左右结构示例 |
| 已知 IDS | 输入 `⿰亻木`，source 保留 IDS，身份为 U+4F11，观察区呈现“休” | **PASS**；原文与呈现分层 |
| 歧义/不确定 | 输入“侧”，身份显示已分配字符，保持原字；无稳定构形预览，拆字动作禁用 | **PASS**；没有猜选 IDS |
| 字体回退 | 输入 `⿰木尔`，呈现标记“字体回退 · 依赖本机字体” | **PASS**；source 保留 IDS |
| 源文选择与操作 | 选择“休”后拆字按钮可用；明确操作得到 `⿰亻木` 并提示可撤销 | **PASS**；操作前选择有效 |
| IDC 插入 | 插入面板含 17 个 IDC 按钮和 17 个 SVG；选择首项写入 `⿰` | **PASS** |
| IDC 快捷候选 | Alt 候选层显示 17 项；Alt+Q 写入 `⿸`，按键释放后浮层收起 | **PASS（浏览器合成）** |
| O 符候选 | Alt+Shift+F 打开 3 个可插入候选；Space 确认写入 `扌` | **PASS（浏览器合成）**；真人 IME 未测 |
| 偏旁快捷键 | Shift+F 写入 `扌`；Shift+← 选择最后一个字符 | **PASS（浏览器合成）** |
| 窄屏 | 390×844 视口下观察区堆叠；document scroll width 为 390 | **PASS**；无横向溢出 |

### 视觉复核

- 双色标轮廓保持原样；棕红/苔绿只用于品牌与焦点/交互状态，IDC 作为操作符类别保留蓝墨色。未给源字部件上语义色。
- 中文 micro-label 与源文列标识帮助区分任务区；没有外部字体、图像或网络请求。
- 原先三层预览框减少为外框和一条内框。按钮面板采用同一纸面网格和方角边界，避免每个 IDC 再套一枚圆角卡片。
- 空画布仍占较大面积，源结构长文本和较小桌面窗口需要主会话继续审阅；此稿只是候选，没有获得最终审美批准。

## 浏览器证据

截图由本机 Playwright Chromium 通过 `http://127.0.0.1:8777/app/index.html` 生成；浏览器输入用自动化按键事件，不是真人键盘。截图保存在：

`C:/Users/56506/Documents/Codex/2026-10-25/zhuixing-ui-review-20261025/outputs/`

- `zhuixing-desktop-empty.png`
- `zhuixing-desktop-ids.png`
- `zhuixing-desktop-ambiguous.png`
- `zhuixing-desktop-fallback.png`
- `zhuixing-desktop-source-selection.png`
- `zhuixing-desktop-split.png`
- `zhuixing-desktop-idc-menu.png`
- `zhuixing-desktop-idc-inserted.png`
- `zhuixing-desktop-shortcut-hud.png`
- `zhuixing-desktop-o-symbol-map.png`
- `zhuixing-desktop-o-symbol-choices.png`
- `zhuixing-mobile-ids.png`

浏览器自动化记录：页面错误 0、外部请求 0、17/17 IDC SVG。390px 宽窄屏无横向溢出。

## 快捷键 / 运行验证

快捷键冲突、替代路径及每项 PASS/NOT_RUN 状态见 [键盘验收矩阵](KEYBOARD-ACCEPTANCE-20261025.md)。本轮定向测试：

- `node app/editor-commands-tests.cjs`：10 项 PASS。
- `node app/keyboard-host-tests.cjs`：16 项 PASS。
- `node app/input-flow-host-tests.cjs`：56 项维护中的输入/设置受控宿主检查 PASS。
- `node app/branding-tests.cjs`：PASS。
- `git diff --check`：PASS。
- 真人 Windows IME、实体键盘、Edge Alt 方向键、其他浏览器、读屏：**NOT_RUN**。合成事件不能证明操作系统会把按键交给页面。

没有运行或改写全量 Unicode 覆盖报告；没有修改 Release 文件，也没有提交、推送、打标签、改 Release 或部署。

## 追加交互：歧义预览、滚动与动效默认 · 2026-10-25

- 选中有多种 IDS 形式的 Unicode 字符时，提示区只读地显示“拆一层候选”；候选按 IDS 字符串排序，默认展示第 1 项。原选区中的歧义字符在提示预览中用点下划线标记，并读出候选数量。source、selection 和 history 不变；歧义拆字仍需明确且无歧义的变更契约，不会因预览自动写入。
- 全页可滚动区域隐藏滚动条占位，但保留滚轮、触控、键盘及程序化滚动。O 符多候选从竖向列表改为横向轨道；键盘移动高亮时调用 scrollIntoView 使当前候选进入可视区。
- 完整构形动效现在默认优先于系统的减少动态效果建议，符合维护者明确提出的默认体验。设置里的“关闭构型动效”仍可手动保持静态；页面隐藏、缺少 WAAPI、超预算、API 失败等安全降级继续生效。诊断会说明系统偏好与应用当前选择。
- 新增/更新验证：selection command 23 项 PASS；motion suite 16 项 PASS；motion host 5 项 PASS；输入/设置受控宿主 56 项 PASS，其中包括歧义候选只读预览、横向候选滚动、高亮项自动进入视口、系统 reduce 下默认仍有动画，以及应用内关闭开关。
- **NOT_RUN · 最终屏幕画面/真人动效观感**：in-app browser 当前只开放 file:// 页面，而此会话的浏览器策略拒绝读取该协议；没有绕过限制。上述最终增量没有新的视觉截图；前一节截图不包含这些追加改动。真人 IME/实体键同样未测。

## 追加缺陷修复：IDC 叠层与后续文字选区

用户报告连同 IDC 操作符选择后续文字时，操作符 SVG 叠层似乎盖住后面的字。IDC SVG 改为绝对定位视觉层，不再参与源文本的行内排版；隐藏的真实 Unicode 字符仍留在可编辑文本流中。受控输入宿主增加跨过 IDS 结构并选中尾随文字的回归，source 和范围保持完整。该修复没有最终浏览器画面证据，视觉复核 **NOT_RUN**。
