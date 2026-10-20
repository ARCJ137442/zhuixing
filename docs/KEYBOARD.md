# 纯键盘路径

所有功能纯键盘可操作是产品原则；这不等于已完成真实浏览器、输入法和辅助技术验收。

- Tab / Shift+Tab 在编辑器与按钮之间移动；原生按钮用 Enter / Space 激活；弹窗/菜单退出遵循当前实现。
- 编辑器获得焦点时展示由同一命令注册表生成的按键提示，不显示全局常驻快捷键浮层。
- 左右箭头、Backspace、Delete 按当前操作单位工作。源码视图采用原字符簇；呈现视图可选原字符簇或完整呈现字。只读预览不发起编辑事务。
- 撤销正文：Ctrl/Cmd+Z；重做正文：Ctrl/Cmd+Shift+Z，另支持 Ctrl+Y。设置历史与正文历史分开。
- 复制：Ctrl/Cmd+C，输出真实源文本。
- 选区拆为 IDS / 合为 Unicode 的快捷键默认关闭，可选 Alt+Shift+D/J 或 Ctrl+Alt+D/J；更多菜单始终提供等价命令。
- 模式、操作单位、映射、动画、呈现偏好、项目存取与说明由可聚焦按钮及设置面板到达。具体候选矩阵见 app/editor-mode-spec/keyboard-paths.json。
- IME 组合期、AltGraph 和不适用上下文不得误触快捷命令。

定义来源：app/editor-commands.js 与当前 app/index.html。必须进一步实测焦点返回、Esc 退出、系统保留键冲突、原生文件选择器、读屏名称和中文 IME；本页不把受控宿主检查等同实机通过。
