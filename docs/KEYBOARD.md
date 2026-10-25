# 纯键盘路径

所有功能纯键盘可操作是产品原则；这不等于已完成真实浏览器、输入法和辅助技术验收。

- Tab / Shift+Tab 在编辑器与按钮之间移动；原生按钮用 Enter / Space 激活；弹窗/菜单退出遵循当前实现。
- 编辑器获得焦点时展示由同一命令注册表生成的按键提示，不显示全局常驻快捷键浮层。
- 左右箭头、Backspace、Delete 按当前操作单位工作。源码视图采用原字符簇；呈现视图可选原字符簇或完整呈现字。只读预览不发起编辑事务。
- 撤销正文：Ctrl/Cmd+Z；重做正文：Ctrl/Cmd+Shift+Z，另支持 Ctrl+Y。设置历史与正文历史分开。
- 复制：Ctrl/Cmd+C，输出真实源文本。
- 选区拆为 IDS / 合为 Unicode 的快捷键默认关闭，可选 Alt+Shift+D/J；更多菜单始终提供等价命令。Ctrl 组合留给界面级操作。
- 模式、操作单位、映射、动画、呈现偏好、项目存取与说明由可聚焦按钮及设置面板到达。具体候选矩阵见 app/editor-mode-spec/keyboard-paths.json。
- IME 组合期、AltGraph 和不适用上下文不得误触快捷命令。

## 本地候选：IDC 快速插入

普通输入时不常驻快捷键模式。编辑器聚焦且可编辑时按住 `Alt`，17 项 SVG 候选在光标旁即时出现；按住期间可直接按候选键插入，松开 `Alt`、Escape、失焦或切到只读视图即收起。插入仍是原文里的普通 IDC 字符事务，光标选区和撤销语义继续由现有编辑器管理。手机没有按住键盘路径时，插入面板里的图形按钮仍是直接入口。

方向键保留最容易读懂的分置关系：左右 `⿰`、右向三分 `⿲`、上/下分置 `⿱/⿳`。包围型把邻近空间作为记忆线索；叠加、反射、旋转和减笔画使用短助记键。候选 HUD 同时展示 SVG、中文名称和键帽，所以初次用户可以看图选，熟练用户再记组合。

| IDC | 意义 | Alt+键 |
|---|---|---|
| `⿰` | 左右分置 | `←` |
| `⿲` | 左中右分置 | `→` |
| `⿱` | 上下分置 | `↑` |
| `⿳` | 上中下分置 | `↓` |
| `⿴` | 全包围 | `O` |
| `⿵` | 上三包 | `T` |
| `⿶` | 下三包 | `B` |
| `⿷` | 左三包 | `L` |
| `⿼` | 右包围 | `R` |
| `⿸` | 左上包 | `Q` |
| `⿹` | 右上包 | `E` |
| `⿺` | 左下包 | `Z` |
| `⿽` | 右下包围 | `C` |
| `⿻` | 叠加 | `P` |
| `⿾` | 水平反射 | `M` |
| `⿿` | 旋转 | `G` |
| `㇯` | 减去笔画 | `−` |

设置可关闭这组快捷输入；17 个 SVG 按钮始终可用。Shift+方向键始终保留系统扩选，不要求用户切换编辑模式。受控代码过滤 IME、229、AltGraph、重复按键、额外修饰、只读视图和非编辑器焦点。浏览器/系统可能截走 Alt 组合，尤其 Alt+方向键可能用于页面导航；真人 IME、实体键盘、平台布局和冲突仍待实机验收。不要将受控事件测试视为真实按键通过。

字母键以物理 `code` 匹配；若浏览器提供 Keyboard Layout Map，HUD 键帽和快捷提示按当前布局显示，未提供时使用标准键位标签。W3C 区分随布局变化的 `key` 与表示物理位置的 `code`，MDN 说明 `code` 不能直接当作所有布局的可见键帽。[W3C UI Events](https://www.w3.org/TR/uievents/) [MDN KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) [Keyboard API](https://developer.mozilla.org/en-US/docs/Web/API/Keyboard_API)。Microsoft 的 Edge 快捷键表将 `Alt+←/→` 用作后退/前进，因此四个方向映射是待实机确认的候选，而非跨浏览器无冲突承诺。[Microsoft Edge shortcuts](https://support.microsoft.com/en-us/edge/keyboard-shortcuts-in-microsoft-edge)

## 本地候选：Shift 偏旁输入

第一项试验映射是纯 `Shift+F` → `扌`（提手旁）。只在编辑器聚焦、可编辑且没有 IME 组合时拦截；`Ctrl+Shift+F` 不会被拦截，Shift+方向仍扩选。该功能可在设置关闭，移动端继续使用常见偏旁按钮。它是应用自己的快捷键映射，不是小鹤码表的唯一输出。

对用户提供的 `flypy.txt` 只做了只读核对，没有修改文件或把码表整表复制进应用。文件的 `#5 符号`区中，`ob*` 有26个字母组、94条候选；`obf` 本身有五个候选，其中不止 `扌` 一个部件。`ofpp` 是41项部件候选，当前61项选择器已有24项重合、尚有17项未收录；`ofjg` 包含12个IDC，`ofjt` 包含14个箭头/方向符号。小鹤官方更新日志把“符号组之外的 o 符”作为可有重码的候选组维护，因此不能把每个 `obX` 默认压成一个唯一偏旁。[小鹤音形官方更新日志](https://flypy.cc/win_record.html)

本机 Rime 的 `default.custom.yaml` 将单独 `Shift_L` 设为 `noop`，用 `Ctrl+Shift+F` 切换简繁，另有 `Shift+Alt` 切换 ASCII；快捷键派发只接受纯 Shift+F，所以不占用本机的 Ctrl 组合。当前 Flypy schema 也把大写字母纳入输入码，因此应用在 IME composition/229 期间交还输入法，空闲编辑时才消费 Shift+F。Rime 官方允许按左/右 Shift 分别配置模式键，默认配置也可能以 Shift 切换临时西文；仍需在本机 Weasel 上分别测试左、右 Shift。[Rime Customization Guide](https://github.com/rime/home/wiki/CustomizationGuide) [Rime 默认配置](https://github.com/rime/rime-prelude/blob/master/default.yaml) [Rime ASCII composer](https://github.com/rime/librime/blob/master/src/rime/gear/ascii_composer.cc)

因此本轮只实现并试测一个精确映射 `Shift+F → 扌`。下一步应按实际使用频率逐项增加一对一映射；若某个 O 符编码对应多个部件，则保留候选选择，不静默替用户挑一个。真人中文 IME、不同键盘布局、左右 Shift 和物理按键仍待设备验收。

定义来源：`app/editor-commands.js` 与当前 `app/index.html`。IDC Alt HUD 的页面视觉已通过本地 HTTP 复核；按住期间的瞬时浮层截图、真人输入法和硬件键仍待验收。

## 0.3.0 递归与命令

更多菜单提供“查找命令…”，按名称、别名、分类或稳定ID过滤24项白名单命令；查询不执行，禁用项显示原因。面板内Tab和原生按钮操作，Escape回入口，不占全局快捷键。拆合分为“拆一层”“展开到底”“从叶端合一层”“递归合到底”，仅明确执行后写入正文，整事务可撤销；只显示匹配Unicode不改源文。
