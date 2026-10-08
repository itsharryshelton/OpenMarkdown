// OpenMarkdown i18n — English / Simplified Chinese, default Chinese.
// Flat dictionary + t()/tf() lookups. Persists choice in localStorage('openmarkdown_lang').

var I18N_LANGS = [
	{ code: 'zh', label: '中文' },
	{ code: 'en', label: 'English' }
];

var I18N_DEFAULT = 'zh';

var I18N_DICT = {
	en: {
		// <html> / document title
		html_lang: 'en',
		doc_title: 'OpenMarkdown - Markdown and Mermaid Visualiser',

		// Top-level menu triggers
		menu_file: 'File',
		menu_view: 'View',
		menu_help: 'Help',

		// File menu
		file_clear: 'Clear File',
		file_import_template: 'Import Template',
		file_upload: 'Upload File',
		file_convert: 'Convert to Markdown',
		file_download: 'Download File',
		file_export_pdf: 'Export to PDF',
		file_save: 'Save',
		file_clear_cache: 'Clear Cache',

		// View menu
		view_visual_editor: 'Visual Editor',
		view_raw_markdown: 'Raw Markdown',
		view_raw_layout: 'Raw Layout',
		view_side_by_side: 'Side by Side',
		view_editor_only: 'Editor Only',
		view_preview_only: 'Preview Only',
		view_dark_mode: 'Dark Mode',
		view_light_mode: 'Light Mode',
		view_spell_check: 'Spell Check',
		view_language: 'Language',

		// Pane headers
		visual_editor: 'Visual Editor',
		visual_editor_hint: 'Click any block to edit',
		markdown_editor: 'Markdown Editor',
		editor_shortcut_hint: 'Ctrl+B Bold / Ctrl+I Italic / Ctrl+K Link',
		markdown_visualise: 'Markdown Visualise',

		// WYSIWYG placeholder
		placeholder_click: 'Click here to start writing, or drag and drop a file',
		placeholder_formats: 'Supports .md, .txt, .html, .csv, and .docx files',
		placeholder_switch: 'Switch between RAW and Visual Editor at the top',
		placeholder_paste: 'You can also paste markdown or use the toolbar above',

		// Raw editor placeholder
		editor_placeholder: 'Write your markdown document here... (or drag and drop a .md file)',

		// Toolbar button titles
		tt_h1: 'Heading 1',
		tt_h2: 'Heading 2',
		tt_h3: 'Heading 3',
		tt_bold: 'Bold',
		tt_italic: 'Italic',
		tt_strikethrough: 'Strikethrough',
		tt_link: 'Link',
		tt_image: 'Insert Image',
		tt_line_break: 'Line Break / Page Break',
		tt_blockquote: 'Blockquote',
		tt_code: 'Code Block',
		tt_task: 'Task List / Checkbox',
		tt_bullet: 'Bullet List',
		tt_numbered: 'Numbered List',
		tt_table: 'Insert Table',
		tt_callout: 'Insert Callout',
		tt_diagram: 'Insert Diagram',

		// Help modal
		help_title: 'How to Use This Tool',
		help_what: 'What is this tool?',
		help_what_body: 'This is a document editor that lets you write in <strong>Markdown</strong> (a simple text formatting language) and instantly see a clean, formatted preview. You can also draw diagrams using <strong>Mermaid</strong> syntax. When you are finished, export your document as a professional PDF to share with colleagues or stakeholders.',
		help_started: 'Getting Started',
		help_started_body: 'Type in the left-hand panel (the Editor). The right-hand panel (the Visualiser) updates automatically to show you what your finished document looks like. Your work is automatically saved in your browser.',
		help_basic: 'Basic Formatting',
		help_basic_intro: 'Markdown uses simple symbols to format text. Here are the most common ones:',
		help_col_type: 'What You Type',
		help_col_produces: 'What It Produces',
		help_tables: 'Tables',
		help_tables_body: 'Create tables using pipes (<code>|</code>) and hyphens (<code>-</code>):',
		help_diagrams: 'Diagrams (Mermaid)',
		help_diagrams_body: 'You can add flowcharts, sequence diagrams, and more using Mermaid syntax. Wrap your diagram code in a fenced code block with the language set to <code>mermaid</code>:',
		help_callouts: 'Admonitions / Callouts',
		help_callouts_body: 'Callouts are highlighted boxes used to draw attention to important information. They use a blockquote with a special type marker on the first line.',
		help_callout_note_desc: 'A blue "Note" callout box with an icon',
		help_callout_warning_desc: 'An orange "Warning" callout box',
		help_callout_custom_desc: 'A callout with a custom heading instead of the default type name',
		help_callout_expand_desc: 'A foldable callout that starts <strong>expanded</strong> (user can collapse it)',
		help_callout_collapse_desc: 'A foldable callout that starts <strong>collapsed</strong> (user can expand it)',
		help_callout_types: 'Available callout types:',
		help_col_type_short: 'Type',
		help_col_colour: 'Colour',
		help_shortcuts: 'Keyboard Shortcuts',
		help_col_shortcut: 'Shortcut',
		help_col_action: 'Action',
		help_shortcut_bold: 'Make selected text <strong>bold</strong>',
		help_shortcut_italic: 'Make selected text <em>italic</em>',
		help_shortcut_link: 'Insert a link around selected text',
		help_shortcut_pdf: 'Export to PDF',
		help_shortcut_tab: 'Insert indentation (useful for lists and diagrams)',
		help_toolbar_buttons: 'Toolbar Buttons',
		help_col_button: 'Button',
		help_col_does: 'What It Does',
		help_tb_new_doc: 'Clears the active tab\'s editor content',
		help_tb_import: 'Load an existing <code>.md</code> or text file into the active tab',
		help_tb_layout: 'Switch between side-by-side, editor-only, or preview-only views',
		help_tb_theme: 'Switches between a light and dark colour scheme',
		help_tb_pdf: 'Opens your browser\'s print dialogue so you can save or print the document as a PDF',
		help_tabs: 'Tabs',
		help_col_how: 'How',
		help_tab_new: 'Click the <code>+</code> button in the tab bar',
		help_tab_switch: 'Click on any tab',
		help_tab_rename: 'Double-click on a tab name',
		help_tab_close: 'Click the <code>x</code> on a tab (hover to reveal)',
		help_tab_new_short: 'New tab',
		help_tab_switch_short: 'Switch tab',
		help_tab_rename_short: 'Rename tab',
		help_tab_close_short: 'Close tab',
		help_tabs_note: 'All tabs are saved automatically in your browser. You can have up to 10 tabs open at once.',
		help_tips: 'Tips',
		help_tips_body: 'You can also drag and drop a <code>.md</code> file directly onto the editor area to import it. When loading a template, you can choose to open it in a new tab or replace the active tab\'s content.',

		// Help table — formatting examples
		help_heading_large: 'A large heading',
		help_heading_medium: 'A medium heading',
		help_heading_small: 'A small heading',
		help_clickable_link: 'A clickable link',
		help_bullet_list: 'A bullet point list',
		help_numbered_list: 'A numbered list',
		help_block_quote: 'A block quote',
		help_horizontal_line: 'A horizontal line divider',

		// Help table — diagram examples
		help_flowchart_desc: 'A flowchart with boxes and arrows',
		help_sequence_desc: 'A sequence diagram showing interactions',

		// Help table — callout colours
		help_colour_blue: 'Blue',
		help_colour_cyan: 'Cyan',
		help_colour_teal: 'Teal',
		help_colour_green: 'Green',
		help_colour_amber: 'Amber',
		help_colour_orange: 'Orange',
		help_colour_red: 'Red',
		help_colour_purple: 'Purple',
		help_colour_grey: 'Grey',

		// Template modal
		template_title: 'Choose a Template',
		template_intro: 'Select a template below to load it into the editor. This will replace your current document.',
		template_loading: 'Loading templates...',
		template_load_failed: 'Failed to load templates. Please try again.',

		// Load mode modal
		load_title: 'Load Template',
		load_desc: 'How would you like to load this template?',
		load_new_tab: 'Open in New Tab',
		load_replace: 'Replace Current',
		btn_cancel: 'Cancel',

		// Print tip modal
		print_tip_title: 'PDF Export Tip',
		print_tip_body: 'For the cleanest, most professional PDF exports (especially in Firefox), please expand <strong>More Settings</strong> in the print dialogue and <strong>uncheck "Print Headers and Footers"</strong>.',
		btn_got_it: 'Got it!',

		// Save info modal
		save_title: 'How Saving Works',
		save_body_1: '<strong>Your data is private.</strong> Nothing you type here is ever sent to or stored on our servers.',
		save_body_2: 'Instead, your documents are automatically saved directly into your browser\'s local cache (localStorage). This means if you accidentally close the tab or refresh the page, your work will still be here when you return.',
		save_body_3: '<strong>However, to permanently save or share a document</strong>, you must export it. You can either export the raw `.md` text file or export it as a formatted PDF using the buttons in the top right.',
		btn_understood: 'Understood',

		// Clear cache modal
		clear_title: 'Clear All Saved Data',
		clear_body_1: 'This will <strong>permanently delete</strong> all your saved documents, tabs, theme preferences, and editor settings from this browser.',
		clear_body_2: 'After clearing, the application will reload as if you are visiting for the first time. <strong>This cannot be undone.</strong>',
		clear_body_3: 'If you have unsaved work, please download your files first using <strong>File &gt; Download File</strong> or <strong>Export to PDF</strong> before proceeding.',
		btn_clear_everything: 'Clear Everything',

		// Conversion progress
		converting: 'Converting to Markdown',

		// Find & replace bar
		find_placeholder: 'Find...',
		replace_placeholder: 'Replace with...',
		find_count_zero: '0 / 0',
		find_prev_title: 'Previous (Shift+Enter)',
		find_next_title: 'Next (Enter)',
		find_match_case: 'Match Case',
		find_toggle_replace: 'Toggle Replace',
		find_close_title: 'Close (Escape)',
		find_replace_title: 'Replace',
		find_all_title: 'All',

		// Context menu
		ctx_cut: 'Cut',
		ctx_copy: 'Copy',
		ctx_paste: 'Paste',
		ctx_create_link: 'Create Link',
		ctx_format: 'Format',
		ctx_paragraph: 'Paragraph',
		ctx_task_list: 'Task List',

		// Code block
		code_copy: 'Copy',
		code_copied: 'Copied!',

		// app.js dynamic strings
		tab_untitled: 'Untitled {n}',
		tab_document: 'Document {n}',
		tab_max_reached: 'Maximum of {n} tabs reached. Please close a tab first.',
		tab_close_confirm: 'Close "{name}"? Unsaved content will be lost.',
		tab_close_title: 'Close tab',
		tab_new_title: 'New tab',
		template_load_failed_alert: 'Failed to load template. Please try again.',
		template_default_name: 'Template',
		conversion_failed: 'Conversion failed: {err}',
		conversion_unknown_error: 'Unknown error',
		clear_doc_confirm: 'Are you sure you want to clear the current document?',
		reading_failed_read: 'Failed to read file',
		unsupported_file: 'Unsupported file type: .{ext}',
		library_load_failed: 'Failed to load library: {url}',
		diagram_syntax_error: 'Diagram syntax error: {err}',
		diagram_error: 'Diagram error: {err}',

		// Counters
		doc_counter: '{w} Words / {c} Characters / {r}',
		read_time: '{m} min read',
		read_time_zero: '0 min read',

		// Table picker
		table_select_size: 'Select size',
		table_size: '{c} x {r}',

		// Inserted snippet scaffolding (table cell text)
		table_column: 'Column {n}',
		table_data: 'Data {n}',

		// Callout snippet scaffolding
		callout_snippet_title: 'Information',
		callout_snippet_body: 'Add your callout text here.',
		callout_insert_body: 'Your text here.',

		// Default link text
		link_text: 'link text',

		// Callout type labels
		'callout.note': 'Note',
		'callout.info': 'Info',
		'callout.tip': 'Tip',
		'callout.success': 'Success',
		'callout.warning': 'Warning',
		'callout.danger': 'Danger',
		'callout.bug': 'Bug',
		'callout.example': 'Example',
		'callout.question': 'Question',
		'callout.abstract': 'Abstract',
		'callout.todo': 'To Do',
		'callout.quote': 'Quote'
	},

	zh: {
		html_lang: 'zh',
		doc_title: 'OpenMarkdown - Markdown 与 Mermaid 可视化工具',

		menu_file: '文件',
		menu_view: '视图',
		menu_help: '帮助',

		file_clear: '清空文件',
		file_import_template: '导入模板',
		file_upload: '上传文件',
		file_convert: '转换为 Markdown',
		file_download: '下载文件',
		file_export_pdf: '导出为 PDF',
		file_save: '保存',
		file_clear_cache: '清除缓存',

		view_visual_editor: '可视化编辑器',
		view_raw_markdown: '原始 Markdown',
		view_raw_layout: '原始布局',
		view_side_by_side: '并排显示',
		view_editor_only: '仅编辑器',
		view_preview_only: '仅预览',
		view_dark_mode: '深色模式',
		view_light_mode: '浅色模式',
		view_spell_check: '拼写检查',
		view_language: '语言',

		visual_editor: '可视化编辑器',
		visual_editor_hint: '点击任意区块进行编辑',
		markdown_editor: 'Markdown 编辑器',
		editor_shortcut_hint: 'Ctrl+B 加粗 / Ctrl+I 斜体 / Ctrl+K 链接',
		markdown_visualise: 'Markdown 可视化',

		placeholder_click: '点击此处开始编写,或拖入文件',
		placeholder_formats: '支持 .md、.txt、.html、.csv、.docx 文件',
		placeholder_switch: '可在顶部切换原始与可视化编辑器',
		placeholder_paste: '也可以粘贴 Markdown,或使用上方工具栏',

		editor_placeholder: '在此编写 Markdown 文档...(或拖入 .md 文件)',

		tt_h1: '一级标题',
		tt_h2: '二级标题',
		tt_h3: '三级标题',
		tt_bold: '加粗',
		tt_italic: '斜体',
		tt_strikethrough: '删除线',
		tt_link: '链接',
		tt_image: '插入图片',
		tt_line_break: '换行 / 分页符',
		tt_blockquote: '引用',
		tt_code: '代码块',
		tt_task: '任务列表 / 复选框',
		tt_bullet: '无序列表',
		tt_numbered: '有序列表',
		tt_table: '插入表格',
		tt_callout: '插入标注',
		tt_diagram: '插入图表',

		help_title: '使用说明',
		help_what: '这是什么工具?',
		help_what_body: '这是一个文档编辑器,让你用 <strong>Markdown</strong>(一种简单的文本格式语言)编写,并即时看到整洁的排版预览。你还可以用 <strong>Mermaid</strong> 语法绘制图表。完成后,可将文档导出为专业的 PDF,分享给同事或相关方。',
		help_started: '快速上手',
		help_started_body: '在左侧面板(编辑器)中输入内容。右侧面板(可视化器)会自动更新,展示最终文档的效果。你的内容会自动保存在浏览器中。',
		help_basic: '基础格式',
		help_basic_intro: 'Markdown 使用简单符号来排版文本。以下是最常用的几种:',
		help_col_type: '你输入的内容',
		help_col_produces: '显示效果',
		help_tables: '表格',
		help_tables_body: '使用竖线(<code>|</code>)和连字符(<code>-</code>)创建表格:',
		help_diagrams: '图表(Mermaid)',
		help_diagrams_body: '你可以用 Mermaid 语法添加流程图、时序图等。将图表代码放在以 <code>mermaid</code> 为语言标记的代码块中:',
		help_callouts: '提示框 / 标注',
		help_callouts_body: '标注用于突出重要信息的高亮区块。它以引用块形式编写,首行带特殊类型标记。',
		help_callout_note_desc: '带图标的蓝色"Note"标注框',
		help_callout_warning_desc: '橙色的"Warning"标注框',
		help_callout_custom_desc: '使用自定义标题而非默认类型名的标注',
		help_callout_expand_desc: '默认<strong>展开</strong>的可折叠标注(用户可收起)',
		help_callout_collapse_desc: '默认<strong>收起</strong>的可折叠标注(用户可展开)',
		help_callout_types: '可用的标注类型:',
		help_col_type_short: '类型',
		help_col_colour: '颜色',
		help_shortcuts: '快捷键',
		help_col_shortcut: '快捷键',
		help_col_action: '操作',
		help_shortcut_bold: '将选中文字<strong>加粗</strong>',
		help_shortcut_italic: '将选中文字变为<em>斜体</em>',
		help_shortcut_link: '在选中文字上插入链接',
		help_shortcut_pdf: '导出为 PDF',
		help_shortcut_tab: '插入缩进(适用于列表和图表)',
		help_toolbar_buttons: '工具栏按钮',
		help_col_button: '按钮',
		help_col_does: '功能说明',
		help_tb_new_doc: '清空当前标签页的编辑器内容',
		help_tb_import: '将已有的 <code>.md</code> 或文本文件加载到当前标签页',
		help_tb_layout: '在并排、仅编辑器、仅预览视图间切换',
		help_tb_theme: '在浅色与深色配色之间切换',
		help_tb_pdf: '打开浏览器的打印对话框,将文档保存或打印为 PDF',
		help_tabs: '标签页',
		help_col_how: '操作方式',
		help_tab_new: '点击标签栏的 <code>+</code> 按钮',
		help_tab_switch: '点击任意标签页',
		help_tab_rename: '双击标签页名称',
		help_tab_close: '点击标签页上的 <code>x</code>(悬停时显示)',
		help_tab_new_short: '新建标签页',
		help_tab_switch_short: '切换标签页',
		help_tab_rename_short: '重命名标签页',
		help_tab_close_short: '关闭标签页',
		help_tabs_note: '所有标签页都会自动保存在浏览器中。最多可同时打开 10 个标签页。',
		help_tips: '小贴士',
		help_tips_body: '你也可以将 <code>.md</code> 文件直接拖到编辑区域来导入。加载模板时,可选择在新标签页打开或替换当前标签页内容。',

		// Help table — formatting examples
		help_heading_large: '大号标题',
		help_heading_medium: '中号标题',
		help_heading_small: '小号标题',
		help_clickable_link: '可点击的链接',
		help_bullet_list: '无序列表',
		help_numbered_list: '有序列表',
		help_block_quote: '引用块',
		help_horizontal_line: '水平分割线',

		// Help table — diagram examples
		help_flowchart_desc: '带方框和箭头的流程图',
		help_sequence_desc: '展示交互的时序图',

		// Help table — callout colours
		help_colour_blue: '蓝色',
		help_colour_cyan: '青色',
		help_colour_teal: '蓝绿色',
		help_colour_green: '绿色',
		help_colour_amber: '琥珀色',
		help_colour_orange: '橙色',
		help_colour_red: '红色',
		help_colour_purple: '紫色',
		help_colour_grey: '灰色',

		template_title: '选择模板',
		template_intro: '在下方选择一个模板加载到编辑器。这将替换当前文档。',
		template_loading: '正在加载模板...',
		template_load_failed: '模板加载失败,请重试。',

		load_title: '加载模板',
		load_desc: '你想如何加载该模板?',
		load_new_tab: '在新标签页打开',
		load_replace: '替换当前内容',
		btn_cancel: '取消',

		print_tip_title: 'PDF 导出提示',
		print_tip_body: '为获得最干净、专业的 PDF 导出效果(尤其在 Firefox 中),请在打印对话框中展开<strong>更多设置</strong>,并<strong>取消勾选"打印页眉和页脚"</strong>。',
		btn_got_it: '知道了',

		save_title: '关于保存',
		save_body_1: '<strong>你的数据是私密的。</strong>你在此输入的任何内容都不会发送到或存储在我们的服务器上。',
		save_body_2: '你的文档会自动保存到浏览器的本地缓存(localStorage)中。这意味着即使你意外关闭标签页或刷新页面,再次返回时内容依然存在。',
		save_body_3: '<strong>但若要永久保存或分享文档</strong>,你必须导出它。可以使用右上角的按钮导出原始 <code>.md</code> 文本文件,或导出为排好版的 PDF。',
		btn_understood: '我明白了',

		clear_title: '清除所有保存的数据',
		clear_body_1: '这将<strong>永久删除</strong>此浏览器中所有已保存的文档、标签页、主题偏好和编辑器设置。',
		clear_body_2: '清除后,应用将重新加载,如同首次访问。<strong>此操作不可撤销。</strong>',
		clear_body_3: '若有未保存的内容,请先通过<strong>文件 &gt; 下载文件</strong>或<strong>导出为 PDF</strong>下载你的文件,再继续操作。',
		btn_clear_everything: '全部清除',

		converting: '正在转换为 Markdown',

		find_placeholder: '查找...',
		replace_placeholder: '替换为...',
		find_count_zero: '0 / 0',
		find_prev_title: '上一个 (Shift+Enter)',
		find_next_title: '下一个 (Enter)',
		find_match_case: '区分大小写',
		find_toggle_replace: '切换替换',
		find_close_title: '关闭 (Esc)',
		find_replace_title: '替换',
		find_all_title: '全部',

		ctx_cut: '剪切',
		ctx_copy: '复制',
		ctx_paste: '粘贴',
		ctx_create_link: '创建链接',
		ctx_format: '格式',
		ctx_paragraph: '段落',
		ctx_task_list: '任务列表',

		// Code block
		code_copy: '复制',
		code_copied: '已复制!',

		tab_untitled: '未命名 {n}',
		tab_document: '文档 {n}',
		tab_max_reached: '已达到最多 {n} 个标签页的上限,请先关闭一个标签页。',
		tab_close_confirm: '关闭"{name}"?未保存的内容将丢失。',
		tab_close_title: '关闭标签页',
		tab_new_title: '新建标签页',
		template_load_failed_alert: '模板加载失败,请重试。',
		template_default_name: '模板',
		conversion_failed: '转换失败:{err}',
		conversion_unknown_error: '未知错误',
		clear_doc_confirm: '确定要清空当前文档吗?',
		reading_failed_read: '读取文件失败',
		unsupported_file: '不支持的文件类型:.{ext}',
		library_load_failed: '加载库失败:{url}',
		diagram_syntax_error: '图表语法错误:{err}',
		diagram_error: '图表错误:{err}',

		doc_counter: '{w} 词 / {c} 字符 / {r}',
		read_time: '{m} 分钟阅读',
		read_time_zero: '0 分钟阅读',

		table_select_size: '选择尺寸',
		table_size: '{c} x {r}',

		table_column: '列 {n}',
		table_data: '数据 {n}',

		callout_snippet_title: '信息',
		callout_snippet_body: '在此添加标注内容。',
		callout_insert_body: '在此输入内容。',

		link_text: '链接文字',

		'callout.note': '笔记',
		'callout.info': '信息',
		'callout.tip': '提示',
		'callout.success': '成功',
		'callout.warning': '警告',
		'callout.danger': '危险',
		'callout.bug': '缺陷',
		'callout.example': '示例',
		'callout.question': '疑问',
		'callout.abstract': '摘要',
		'callout.todo': '待办',
		'callout.quote': '引用'
	}
};

// Resolve a key for the current (or given) locale, with English fallback then the key itself.
function t(key, locale) {
	var loc = locale || currentLang();
	var dict = I18N_DICT[loc] || {};
	if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
	var enDict = I18N_DICT.en || {};
	if (Object.prototype.hasOwnProperty.call(enDict, key)) return enDict[key];
	return key;
}

// Resolve a key and substitute {placeholder} tokens from `params`.
function tf(key, params, locale) {
	var str = t(key, locale);
	if (!params) return str;
	for (var k in params) {
		if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
		str = str.split('{' + k + '}').join(String(params[k]));
	}
	return str;
}

// Callout type -> localised label (used by pickers and rendered callout headers).
function calloutLabel(type) {
	var key = 'callout.' + type;
	var val = t(key);
	return val === key ? type.charAt(0).toUpperCase() + type.slice(1) : val;
}

function currentLang() {
	try {
		var saved = localStorage.getItem('openmarkdown_lang');
		if (saved && I18N_DICT[saved]) return saved;
	} catch (e) {}
	return I18N_DEFAULT;
}

function setLang(code) {
	if (!I18N_DICT[code]) code = I18N_DEFAULT;
	try { localStorage.setItem('openmarkdown_lang', code); } catch (e) {}
	applyTranslations(code);
}

// Switch language at runtime (menu entry point): persist, refresh static text, and re-render dynamic views.
function switchLanguage(code) {
	setLang(code);
	// Re-render dynamic content so counters / placeholders / callout titles follow the new language.
	if (typeof handleEditorInput === 'function') handleEditorInput();
	if (typeof renderWysiwygView === 'function' && typeof editorMode !== 'undefined' && editorMode === 'wysiwyg') renderWysiwygView();
	if (typeof updateViewMenuChecks === 'function') updateViewMenuChecks();
}

// Apply the dictionary to every [data-i18n*] element in the document.
function applyTranslations(code) {
	var loc = code || currentLang();
	document.documentElement.lang = t('html_lang', loc);
	document.title = t('doc_title', loc);

	var nodes = document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-html]');
	for (var i = 0; i < nodes.length; i++) {
		var el = nodes[i];
		var textKey = el.getAttribute('data-i18n');
		if (textKey) el.textContent = t(textKey, loc);
		var phKey = el.getAttribute('data-i18n-placeholder');
		if (phKey) el.setAttribute('placeholder', t(phKey, loc));
		var titleKey = el.getAttribute('data-i18n-title');
		if (titleKey) el.setAttribute('title', t(titleKey, loc));
		var htmlKey = el.getAttribute('data-i18n-html');
		if (htmlKey) el.innerHTML = t(htmlKey, loc);
	}

	// Refresh the language sub-menu check marks.
	var langMenu = document.getElementById('menu-language');
	if (langMenu) {
		var opts = langMenu.querySelectorAll('.menu-lang-opt');
		for (var j = 0; j < opts.length; j++) {
			var chk = opts[j].querySelector('.menu-check');
			if (chk) chk.style.display = (opts[j].getAttribute('data-lang') === loc) ? '' : 'none';
		}
	}

	// Refresh the theme toggle label in the View menu (it depends on current theme, not language,
	// but re-applying keeps it consistent after a language switch).
	if (typeof updateThemeButtons === 'function') {
		var theme = document.documentElement.getAttribute('data-theme');
		updateThemeButtons(theme);
	}
}
