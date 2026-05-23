// Utility: Escape HTML special characters for safe rendering in code blocks
// Uses String.fromCharCode to avoid template literal and HTML entity collisions
function escapeHtml(str) {
	if (!str) return '';
	var out = '';
	for (var i = 0; i < str.length; i++) {
		var ch = str.charCodeAt(i);
		if (ch === 38) out += String.fromCharCode(38) + 'amp;';
		else if (ch === 60) out += String.fromCharCode(38) + 'lt;';
		else if (ch === 62) out += String.fromCharCode(38) + 'gt;';
		else if (ch === 34) out += String.fromCharCode(38) + 'quot;';
		else if (ch === 39) out += String.fromCharCode(38) + '#39;';
		else out += str.charAt(i);
	}
	return out;
}

// Let marked use its default renderer (no custom code override)
// Mermaid blocks are handled via DOM post-processing in renderPreview

// Configure marked for GFM features (task lists, strikethrough, tables)
marked.use({
	gfm: true,
	breaks: false
});

// Prevent highlight.js from auto-highlighting on load (we do it manually)
if (typeof hljs !== 'undefined') {
	hljs.configure({ ignoreUnescapedHTML: true });
}

// Grab UI Elements
var editorEl = document.getElementById('editor');
var previewEl = document.getElementById('preview');
var previewContainerEl = document.querySelector('.preview-container');
var docCounterEl = document.getElementById('doc-counter');
var tabBarEl = document.getElementById('tab-bar');
var workspaceEl = document.getElementById('workspace');

// ========== Menu Bar ==========
function toggleMenu(menuId) {
	var menuItem = document.getElementById(menuId);
	var isOpen = menuItem.classList.contains('open');
	closeMenus();
	if (!isOpen) {
		menuItem.classList.add('open');
		// Update check marks for View menu
		if (menuId === 'menu-view') updateViewMenuChecks();
	}
}

function closeMenus() {
	var items = document.querySelectorAll('.menu-item.open');
	for (var i = 0; i < items.length; i++) {
		items[i].classList.remove('open');
	}
}

// Close menus when clicking outside
document.addEventListener('mousedown', function(e) {
	if (!e.target.closest('.menu-item')) {
		closeMenus();
	}
});

// Update View menu check marks to reflect current state
function updateViewMenuChecks() {
	var checkVisual = document.getElementById('menu-check-visual');
	var checkRaw = document.getElementById('menu-check-raw');
	if (checkVisual) checkVisual.style.display = editorMode === 'wysiwyg' ? '' : 'none';
	if (checkRaw) checkRaw.style.display = editorMode === 'raw' ? '' : 'none';
}

// Export to PDF: show print tip first, then trigger export after user dismisses
function menuExportPdf() {
	var modal = document.getElementById('print-tip-modal');
	modal.classList.add('active');

	// Watch for the modal being dismissed (active class removed)
	var observer = new MutationObserver(function(mutations) {
		for (var i = 0; i < mutations.length; i++) {
			if (!modal.classList.contains('active')) {
				observer.disconnect();
				setTimeout(function() { exportToPdf(); }, 200);
				return;
			}
		}
	});
	observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
}

// Clear all cached data and reload
function clearAllCache() {
	try {
		localStorage.clear();
	} catch(e) {
		console.error('Failed to clear localStorage:', e);
	}
	window.location.reload();
}

// ========== Scroll Synchronisation ==========
var isEditorScrolling = false;

// ========== Spell Check Toggle ==========
function toggleSpellCheck() {
	var editor = document.getElementById('editor');
	var isEnabled = editor.getAttribute('spellcheck') === 'true';
	var newVal = !isEnabled;
	editor.setAttribute('spellcheck', newVal ? 'true' : 'false');

	// Also update WYSIWYG textareas if any are active
	var wysiwygTextareas = document.querySelectorAll('.wysiwyg-block textarea');
	for (var i = 0; i < wysiwygTextareas.length; i++) {
		wysiwygTextareas[i].setAttribute('spellcheck', newVal ? 'true' : 'false');
	}

	// Update check mark
	var check = document.getElementById('menu-check-spellcheck');
	if (check) check.style.display = newVal ? '' : 'none';

	// Persist preference
	try { localStorage.setItem('openmarkdown_spellcheck', newVal ? 'true' : 'false'); } catch(e) {}
}
var isPreviewScrolling = false;
var scrollTimeout = null;

editorEl.addEventListener('scroll', function() {
	if (isPreviewScrolling) return;
	isEditorScrolling = true;
	
	var percentage = editorEl.scrollTop / (editorEl.scrollHeight - editorEl.clientHeight);
	if (isNaN(percentage)) percentage = 0;
	
	previewContainerEl.scrollTop = percentage * (previewContainerEl.scrollHeight - previewContainerEl.clientHeight);
	
	clearTimeout(scrollTimeout);
	scrollTimeout = setTimeout(function() { isEditorScrolling = false; }, 50);
});

previewContainerEl.addEventListener('scroll', function() {
	if (isEditorScrolling) return;
	isPreviewScrolling = true;
	
	var percentage = previewContainerEl.scrollTop / (previewContainerEl.scrollHeight - previewContainerEl.clientHeight);
	if (isNaN(percentage)) percentage = 0;
	
	editorEl.scrollTop = percentage * (editorEl.scrollHeight - editorEl.clientHeight);
	
	clearTimeout(scrollTimeout);
	scrollTimeout = setTimeout(function() { isPreviewScrolling = false; }, 50);
});

// ========== Tab State Management ==========
var tabs = [];
var activeTabId = null;
var tabCounter = 0;
var MAX_TABS = 10;

function generateTabId() {
	tabCounter++;
	return 'tab-' + tabCounter + '-' + Date.now();
}

function createTab(name, content) {
	if (tabs.length >= MAX_TABS) {
		alert('Maximum of ' + MAX_TABS + ' tabs reached. Please close a tab first.');
		return null;
	}
	var tab = { id: generateTabId(), name: name || ('Untitled ' + tabCounter), content: content || '', scrollPos: 0 };
	tabs.push(tab);
	renderTabBar();
	switchTab(tab.id);
	return tab;
}

function switchTab(tabId) {
	// Save current tab state before switching
	if (activeTabId) {
		var current = getTab(activeTabId);
		if (current) {
			current.content = editorEl.value;
			current.scrollPos = editorEl.scrollTop;
		}
	}
	activeTabId = tabId;
	var tab = getTab(tabId);
	if (tab) {
		editorEl.value = tab.content;
		editorEl.scrollTop = tab.scrollPos;
		handleEditorInput();
	}
	renderTabBar();
	saveTabState();
	if (editorMode === 'wysiwyg') {
		renderWysiwygView();
	} else {
		editorEl.focus();
	}
}

function closeTab(tabId) {
	var tab = getTab(tabId);
	if (!tab) return;
	if (tabs.length <= 1) {
		// Cannot close last tab, just clear it
		tab.content = '';
		tab.name = 'Untitled 1';
		editorEl.value = '';
		handleEditorInput();
		renderTabBar();
		saveTabState();
		return;
	}
	if (tab.content.trim().length > 0) {
		if (!confirm('Close "' + tab.name + '"? Unsaved content will be lost.')) return;
	}
	var idx = tabs.indexOf(tab);
	tabs.splice(idx, 1);
	if (activeTabId === tabId) {
		var newIdx = Math.min(idx, tabs.length - 1);
		switchTab(tabs[newIdx].id);
	} else {
		renderTabBar();
		saveTabState();
	}
}

function renameTab(tabId) {
	var tabEl = document.querySelector('[data-tab-id="' + tabId + '"] .tab-name');
	if (!tabEl) return;
	var tab = getTab(tabId);
	if (!tab) return;
	var input = document.createElement('input');
	input.type = 'text';
	input.className = 'tab-rename-input';
	input.value = tab.name;
	input.addEventListener('blur', function() {
		var newName = input.value.trim() || tab.name;
		tab.name = newName;
		renderTabBar();
		saveTabState();
	});
	input.addEventListener('keydown', function(e) {
		if (e.key === 'Enter') input.blur();
		if (e.key === 'Escape') { input.value = tab.name; input.blur(); }
	});
	tabEl.innerHTML = '';
	tabEl.appendChild(input);
	input.focus();
	input.select();
}

function getTab(tabId) {
	for (var i = 0; i < tabs.length; i++) {
		if (tabs[i].id === tabId) return tabs[i];
	}
	return null;
}

function renderTabBar() {
	tabBarEl.innerHTML = '';
	for (var i = 0; i < tabs.length; i++) {
		(function(tab) {
			var btn = document.createElement('button');
			btn.className = 'tab' + (tab.id === activeTabId ? ' active' : '');
			btn.setAttribute('data-tab-id', tab.id);
			btn.addEventListener('click', function(e) {
				if (e.target.closest('.tab-close')) return;
				switchTab(tab.id);
			});
			btn.addEventListener('dblclick', function(e) {
				e.preventDefault();
				renameTab(tab.id);
			});
			btn.addEventListener('mousedown', function(e) {
				if (e.button === 1) { e.preventDefault(); closeTab(tab.id); }
			});

			var nameSpan = document.createElement('span');
			nameSpan.className = 'tab-name';
			nameSpan.textContent = tab.name;
			btn.appendChild(nameSpan);

			var closeBtn = document.createElement('button');
			closeBtn.className = 'tab-close';
			closeBtn.title = 'Close tab';
			closeBtn.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>';
			closeBtn.addEventListener('click', function(e) {
				e.stopPropagation();
				closeTab(tab.id);
			});
			btn.appendChild(closeBtn);

			tabBarEl.appendChild(btn);
		})(tabs[i]);
	}
	// Add "+" button
	var addBtn = document.createElement('button');
	addBtn.className = 'tab-add';
	addBtn.title = 'New tab';
	addBtn.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path></svg>';
	addBtn.addEventListener('click', function() { createTab(); });
	tabBarEl.appendChild(addBtn);
}

function saveTabState() {
	var current = getTab(activeTabId);
	if (current) {
		current.content = editorEl.value;
		current.scrollPos = editorEl.scrollTop;
	}
	var state = {
		tabs: tabs,
		activeTabId: activeTabId,
		tabCounter: tabCounter
	};
	try { localStorage.setItem('openmarkdown_tabs_state', JSON.stringify(state)); } catch(e) {}
}

function loadTabState() {
	var raw = null;
	try { raw = localStorage.getItem('openmarkdown_tabs_state'); } catch(e) {}
	if (raw) {
		try {
			var state = JSON.parse(raw);
			tabs = state.tabs || [];
			activeTabId = state.activeTabId;
			tabCounter = state.tabCounter || tabs.length;
			if (tabs.length > 0) {
				renderTabBar();
				var target = getTab(activeTabId) ? activeTabId : tabs[0].id;
				activeTabId = null; // Force full switch
				switchTab(target);
				return;
			}
		} catch(e) {}
	}
	// Migration: load old single-document localStorage
	var oldContent = null;
	try { oldContent = localStorage.getItem('openmarkdown_markdown_content'); } catch(e) {}
	if (oldContent) {
		createTab('Document 1', oldContent);
		try { localStorage.removeItem('openmarkdown_markdown_content'); } catch(e) {}
	} else {
		createTab('Untitled 1', '');
	}
}

// ========== Layout Mode Management ==========
var currentLayout = 'split';

function setLayoutMode(mode) {
	currentLayout = mode;
	workspaceEl.className = 'workspace' + (mode !== 'split' ? ' layout-' + mode : '');
	updateLayoutButtons(mode);
	try { localStorage.setItem('openmarkdown_layout_mode', mode); } catch(e) {}
	// Re-render preview when switching to preview-visible modes
	if (mode !== 'editor') handleEditorInput();
}

function updateLayoutButtons(mode) {
	var btns = document.querySelectorAll('.layout-btn');
	for (var i = 0; i < btns.length; i++) {
		btns[i].classList.remove('active');
	}
	var active = document.getElementById('layout-' + mode);
	if (active) active.classList.add('active');
}

// Mermaid render counter for unique IDs
var mermaidCounter = 0;

// Initialise Mermaid
function initMermaid() {
	var currentTheme = document.documentElement.getAttribute('data-theme');
	mermaid.initialize({
		startOnLoad: false,
		theme: currentTheme === 'dark' ? 'dark' : 'forest',
		securityLevel: 'loose',
		flowchart: { useMaxWidth: true, htmlLabels: true }
	});
}

// Update preview window content (handles both sync and async marked.parse)
var debounceTimer = null;
function handleEditorInput() {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(function() {
		var markdownText = editorEl.value;

		// Update Word and Character count
		var wordCount = markdownText.trim() ? markdownText.trim().split(/\s+/).length : 0;
		var readingMins = Math.ceil(wordCount / 228);
		var readingLabel = wordCount === 0 ? '0 min read' : readingMins + ' min read';
		docCounterEl.textContent = wordCount + ' Words / ' + markdownText.length + ' Characters / ' + readingLabel;

		// Auto-save to active tab
		saveTabState();

		// Parse Markdown (v12 can return string or Promise)
		var result = marked.parse(markdownText);
		if (result && typeof result.then === 'function') {
			result.then(function(html) { renderPreview(html); });
		} else {
			renderPreview(result);
		}
	}, 300);
}

function renderPreview(html) {
	// CRITICAL: Sanitise output before injecting into DOM
	var cleanHtml = DOMPurify.sanitize(html, {
		ADD_TAGS: ['iframe', 'input'],
		ADD_ATTR: ['allow', 'allowfullscreen', 'type', 'checked', 'disabled']
	});
	previewEl.innerHTML = cleanHtml;

	// Post-process: find mermaid code blocks rendered by marked as
	// <pre><code class="language-mermaid">...</code></pre>
	// and replace them with rendered SVG diagrams
	var codeBlocks = previewEl.querySelectorAll('code.language-mermaid');
	var diagramPromises = [];

	for (var i = 0; i < codeBlocks.length; i++) {
		(function(codeEl) {
			var preEl = codeEl.parentElement;
			var diagramSource = codeEl.textContent || '';
			mermaidCounter++;
			var diagramId = 'mermaid-diagram-' + mermaidCounter;

			// Create a container div for the rendered diagram
			var container = document.createElement('div');
			container.className = 'mermaid-container';

			diagramPromises.push(
				mermaid.render(diagramId, diagramSource).then(function(result) {
					container.innerHTML = result.svg;
					if (preEl && preEl.parentNode) {
						preEl.parentNode.replaceChild(container, preEl);
					}
				}).catch(function(err) {
					// Show a clean error box instead of raw text
					container.innerHTML = '<div class="mermaid-error-box">Diagram syntax error: ' + escapeHtml(String(err)) + '</div>';
					if (preEl && preEl.parentNode) {
						preEl.parentNode.replaceChild(container, preEl);
					}
				})
			);
		})(codeBlocks[i]);
	}

	// Post-process: convert Obsidian-style callout blockquotes into styled callout boxes
	// Matches: >[!type], >[!type] Title, >[!type]+, >[!type]-
	try {
	var blockquotes = previewEl.querySelectorAll('blockquote');
	for (var bq = 0; bq < blockquotes.length; bq++) {
		(function(bqEl) {
			var firstP = bqEl.querySelector('p');
			if (!firstP) return;
			var rawHtml = firstP.innerHTML;
			// Match [!type] or [!type]+ or [!type]- optionally followed by title text
			var match = rawHtml.match(/^\[!([a-zA-Z]+)\]([+\-])?\s*(.*)/);
			if (!match) return;

			var calloutType = match[1].toLowerCase();
			var foldModifier = match[2] || '';
			var titleRaw = match[3] || '';

			// Split remaining content after first line
			var parts = rawHtml.split(/\n|<br\s*\/?>/);
			parts.shift();
			var bodyContent = parts.join('<br>');

			// Collect remaining paragraphs inside the blockquote
			var extraChildren = bqEl.querySelectorAll(':scope > *');
			var extraHtml = '';
			for (var ec = 0; ec < extraChildren.length; ec++) {
				if (extraChildren[ec] !== firstP) {
					extraHtml += extraChildren[ec].outerHTML;
				}
			}
			if (extraHtml) bodyContent = bodyContent + extraHtml;

			var titleText = titleRaw || calloutType.charAt(0).toUpperCase() + calloutType.slice(1);

			// SVG icons keyed by callout type
			var svgE = '<' + '/svg>';
			var spnE = '<' + '/span>';
			var icons = {
				note: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>' + svgE,
				abstract: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>' + svgE,
				info: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>' + svgE,
				todo: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' + svgE,
				tip: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>' + svgE,
				success: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>' + svgE,
				question: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>' + svgE,
				warning: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>' + svgE,
				failure: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>' + svgE,
				danger: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>' + svgE,
				bug: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152-6.135c-.117-1.065-.908-1.93-1.93-2.166A48.662 48.662 0 0012 5.5a48.662 48.662 0 00-5.125.39c-1.022.236-1.813 1.1-1.93 2.165a23.91 23.91 0 01-1.152 6.135A23.863 23.863 0 0112 12.75zM9.75 8.625a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>' + svgE,
				example: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>' + svgE,
				quote: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>' + svgE
			};
			var icon = icons[calloutType] || icons.note;
			var foldArrow = '<svg class="callout-fold" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>' + svgE;

			var calloutDiv = document.createElement('div');
			calloutDiv.className = 'callout callout-' + calloutType;

			if (foldModifier) {
				// Foldable callout using details/summary
				var isOpen = foldModifier === '+';
				var details = document.createElement('details');
				if (isOpen) details.setAttribute('open', '');
				var summary = document.createElement('summary');
				summary.className = 'callout-header';
				summary.innerHTML = icon + '<span>' + titleText + spnE + foldArrow;
				details.appendChild(summary);
				if (bodyContent) {
					var bodyDiv = document.createElement('div');
					bodyDiv.className = 'callout-body';
					bodyDiv.innerHTML = bodyContent;
					details.appendChild(bodyDiv);
				}
				calloutDiv.appendChild(details);
			} else {
				// Static callout (non-foldable)
				var headerDiv = document.createElement('div');
				headerDiv.className = 'callout-header';
				headerDiv.innerHTML = icon + '<span>' + titleText + spnE;
				calloutDiv.appendChild(headerDiv);
				if (bodyContent) {
					var bodyDiv2 = document.createElement('div');
					bodyDiv2.className = 'callout-body';
					bodyDiv2.innerHTML = bodyContent;
					calloutDiv.appendChild(bodyDiv2);
				}
			}

			bqEl.parentNode.replaceChild(calloutDiv, bqEl);
		})(blockquotes[bq]);
	}
	} catch(calloutErr) { console.error('Callout processing error:', calloutErr); }

	// Post-process: apply syntax highlighting to code blocks (skip mermaid)
	if (typeof hljs !== 'undefined') {
		var codeEls = previewEl.querySelectorAll('pre code');
		for (var hli = 0; hli < codeEls.length; hli++) {
			if (!codeEls[hli].classList.contains('language-mermaid')) {
				hljs.highlightElement(codeEls[hli]);
			}
		}
	}
}

editorEl.addEventListener('input', handleEditorInput);

// Help modal toggle
function toggleHelp() {
	var modal = document.getElementById('help-modal');
	modal.classList.toggle('active');
}

function closeHelpOnBackdrop(e) {
	if (e.target.id === 'help-modal') {
		toggleHelp();
	}
}

// Global keyboard shortcut handler
document.addEventListener('keydown', function(e) {
	// Ctrl+F: Open Find bar
	if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
		e.preventDefault();
		openFindBar(false);
		return;
	}
	// Ctrl+H: Open Find & Replace bar
	if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
		e.preventDefault();
		openFindBar(true);
		return;
	}
	if (e.key === 'Escape') {
		// Close find bar if open
		var findBar = document.getElementById('find-bar');
		if (findBar && findBar.classList.contains('active')) {
			closeFindBar();
			return;
		}
		closeContextMenu();
		var helpModal = document.getElementById('help-modal');
		if (helpModal.classList.contains('active')) {
			toggleHelp();
		}
		var templateModal = document.getElementById('template-modal');
		if (templateModal.classList.contains('active')) {
			toggleTemplates();
		}
	}
});

// Template picker modal
var templatesLoaded = false;
function toggleTemplates() {
	var modal = document.getElementById('template-modal');
	var isOpening = !modal.classList.contains('active');
	modal.classList.toggle('active');

	// Fetch template list on first open
	if (isOpening && !templatesLoaded) {
		fetchTemplateList();
	}
}

function closeTemplatesOnBackdrop(e) {
	if (e.target.id === 'template-modal') {
		toggleTemplates();
	}
}

function fetchTemplateList() {
	var listEl = document.getElementById('template-list');
	listEl.innerHTML = '<p style="color: var(--text-muted);">Loading templates...</p>';

	fetch('/api/templates')
		.then(function(res) { return res.json(); })
		.then(function(templates) {
			templatesLoaded = true;
			listEl.innerHTML = '';

			for (var i = 0; i < templates.length; i++) {
				(function(tmpl) {
					var card = document.createElement('div');
					card.className = 'template-card';
					card.innerHTML = '<h4>' + escapeHtml(tmpl.name) + '</h4><p>' + escapeHtml(tmpl.description) + '</p>';
					card.addEventListener('click', function() {
						loadTemplate(tmpl.id);
					});
					listEl.appendChild(card);
				})(templates[i]);
			}
		})
		.catch(function(err) {
			listEl.innerHTML = '<p style="color: var(--text-muted);">Failed to load templates. Please try again.</p>';
		});
}

var pendingTemplateId = null;
var pendingTemplateName = null;

function loadTemplate(templateId) {
	pendingTemplateId = templateId;
	// Find template name from the list
	var cards = document.querySelectorAll('.template-card h4');
	pendingTemplateName = 'Template';
	for (var c = 0; c < cards.length; c++) {
		var card = cards[c].closest('.template-card');
		if (card) {
			pendingTemplateName = cards[c].textContent;
			break;
		}
	}
	toggleTemplates();
	var modal = document.getElementById('load-mode-modal');
	modal.classList.add('active');
}

function closeLoadMode() {
	var modal = document.getElementById('load-mode-modal');
	modal.classList.remove('active');
	pendingTemplateId = null;
	pendingTemplateName = null;
}

function doLoadTemplate(mode) {
	if (!pendingTemplateId) return;
	var tid = pendingTemplateId;
	var tname = pendingTemplateName;
	closeLoadMode();

	fetch('/api/templates/' + tid)
		.then(function(res) { return res.json(); })
		.then(function(data) {
			if (mode === 'new') {
				createTab(tname || data.name || 'Template', data.content);
			} else {
				var tab = getTab(activeTabId);
				if (tab) tab.name = tname || data.name || tab.name;
				editorEl.value = data.content;
				handleEditorInput();
				renderTabBar();
			}
			if (editorMode === 'wysiwyg') {
				renderWysiwygView();
			} else {
				editorEl.focus();
			}
		})
		.catch(function(err) {
			alert('Failed to load template. Please try again.');
		});
}

// Tab key support: insert tab character instead of moving focus
editorEl.addEventListener('keydown', function(e) {
	if (e.key === 'Tab') {
		e.preventDefault();
		var start = editorEl.selectionStart;
		var end = editorEl.selectionEnd;
		var val = editorEl.value;
		editorEl.value = val.substring(0, start) + '\t' + val.substring(end);
		editorEl.selectionStart = editorEl.selectionEnd = start + 1;
		handleEditorInput();
	}
});

// Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (link), Ctrl+P (export)
document.addEventListener('keydown', function(e) {
	if (!e.ctrlKey && !e.metaKey) return;

	var key = e.key.toLowerCase();

	if (key === 'b') {
		e.preventDefault();
		wrapSelection('**', '**');
	} else if (key === 'i') {
		e.preventDefault();
		wrapSelection('*', '*');
	} else if (key === 'k') {
		e.preventDefault();
		insertLink();
	} else if (key === 'p') {
		e.preventDefault();
		exportToPdf();
	}
});

// Helper: wrap selected text with prefix/suffix markdown syntax
function wrapSelection(prefix, suffix) {
	var start = editorEl.selectionStart;
	var end = editorEl.selectionEnd;
	var val = editorEl.value;
	var selectedText = val.substring(start, end);

	// If already wrapped, unwrap
	var before = val.substring(start - prefix.length, start);
	var after = val.substring(end, end + suffix.length);
	if (before === prefix && after === suffix) {
		editorEl.value = val.substring(0, start - prefix.length) + selectedText + val.substring(end + suffix.length);
		editorEl.selectionStart = start - prefix.length;
		editorEl.selectionEnd = end - prefix.length;
	} else {
		editorEl.value = val.substring(0, start) + prefix + selectedText + suffix + val.substring(end);
		editorEl.selectionStart = start + prefix.length;
		editorEl.selectionEnd = end + prefix.length;
	}
	editorEl.focus();
	handleEditorInput();
}

// ========== File-to-Markdown Converter ==========
// Lazy-loads external libraries on first use to keep initial page load lightweight.
// Supports: HTML (.html/.htm), CSV (.csv), DOCX (.docx)

// Cache for lazy-loaded script Promises to prevent duplicate loading
var _scriptCache = {};

// Lazy-load an external script by URL. Returns a Promise that resolves when loaded.
function loadScript(url) {
	if (_scriptCache[url]) return _scriptCache[url];
	_scriptCache[url] = new Promise(function(resolve, reject) {
		var script = document.createElement('script');
		script.src = url;
		script.onload = resolve;
		script.onerror = function() {
			delete _scriptCache[url];
			reject(new Error('Failed to load library: ' + url));
		};
		document.head.appendChild(script);
	});
	return _scriptCache[url];
}

// Check whether a filename has a convertible extension
function isConvertibleFile(filename) {
	return /\.(html?|csv|docx)$/i.test(filename);
}

// Get a clean tab name from a convertible filename
function getConvertTabName(filename) {
	return filename.replace(/\.(html?|csv|docx)$/i, '') || filename;
}

// Show the conversion progress overlay
function showConversionProgress(filename) {
	var overlay = document.getElementById('convert-progress-modal');
	var nameEl = document.getElementById('convert-progress-filename');
	if (nameEl) nameEl.textContent = filename;
	if (overlay) overlay.classList.add('active');
}

// Hide the conversion progress overlay
function hideConversionProgress() {
	var overlay = document.getElementById('convert-progress-modal');
	if (overlay) overlay.classList.remove('active');
}

// Convert an HTML string to markdown using Turndown.js (lazy-loaded)
function convertHtmlToMarkdown(htmlString) {
	return loadScript('https://cdn.jsdelivr.net/npm/turndown@7.2.0/dist/turndown.js').then(function() {
		return loadScript('https://cdn.jsdelivr.net/npm/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js');
	}).then(function() {
		var turndownService = new TurndownService({
			headingStyle: 'atx',
			codeBlockStyle: 'fenced',
			bulletListMarker: '-'
		});
		// Enable GFM extensions (tables, strikethrough, task lists)
		if (typeof turndownPluginGfm !== 'undefined') {
			turndownService.use(turndownPluginGfm.gfm);
		}
		return turndownService.turndown(htmlString);
	});
}

// Convert a CSV string to a GFM markdown table (pure JS, no library needed)
function convertCsvToMarkdown(csvString) {
	// Parse CSV handling quoted fields (fields may contain commas and newlines)
	function parseCsv(text) {
		var rows = [];
		var row = [];
		var field = '';
		var inQuotes = false;
		for (var i = 0; i < text.length; i++) {
			var ch = text[i];
			var next = text[i + 1];
			if (inQuotes) {
				if (ch === '"' && next === '"') {
					field += '"';
					i++; // skip escaped quote
				} else if (ch === '"') {
					inQuotes = false;
				} else {
					field += ch;
				}
			} else {
				if (ch === '"') {
					inQuotes = true;
				} else if (ch === ',') {
					row.push(field.trim());
					field = '';
				} else if (ch === '\r' && next === '\n') {
					row.push(field.trim());
					field = '';
					if (row.length > 0) rows.push(row);
					row = [];
					i++; // skip \n
				} else if (ch === '\n') {
					row.push(field.trim());
					field = '';
					if (row.length > 0) rows.push(row);
					row = [];
				} else {
					field += ch;
				}
			}
		}
		// Push final field/row
		row.push(field.trim());
		if (row.length > 0 && !(row.length === 1 && row[0] === '')) rows.push(row);
		return rows;
	}

	var rows = parseCsv(csvString);
	if (rows.length === 0) return Promise.resolve('');

	// Normalise column count to the widest row
	var maxCols = 0;
	for (var r = 0; r < rows.length; r++) {
		if (rows[r].length > maxCols) maxCols = rows[r].length;
	}
	for (var r2 = 0; r2 < rows.length; r2++) {
		while (rows[r2].length < maxCols) rows[r2].push('');
	}

	// Escape pipe characters inside cell content
	function escapeCell(val) {
		return val.replace(/\|/g, '\\|');
	}

	var lines = [];
	// Header row
	lines.push('| ' + rows[0].map(escapeCell).join(' | ') + ' |');
	// Separator row
	var sep = [];
	for (var s = 0; s < maxCols; s++) sep.push('---');
	lines.push('| ' + sep.join(' | ') + ' |');
	// Data rows
	for (var d = 1; d < rows.length; d++) {
		lines.push('| ' + rows[d].map(escapeCell).join(' | ') + ' |');
	}

	return Promise.resolve(lines.join('\n'));
}

// Convert a DOCX ArrayBuffer to markdown via Mammoth.js -> Turndown.js pipeline
function convertDocxToMarkdown(arrayBuffer) {
	return loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js').then(function() {
		return mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
	}).then(function(result) {
		if (result.messages && result.messages.length > 0) {
			console.warn('Mammoth conversion warnings:', result.messages);
		}
		return convertHtmlToMarkdown(result.value);
	});
}

// Main dispatcher: detects file type and routes to appropriate converter
// Returns a Promise<string> with the markdown result
function convertFileToMarkdown(file) {
	var ext = file.name.split('.').pop().toLowerCase();

	if (ext === 'html' || ext === 'htm') {
		return new Promise(function(resolve, reject) {
			var reader = new FileReader();
			reader.onload = function(e) { resolve(e.target.result); };
			reader.onerror = function() { reject(new Error('Failed to read file')); };
			reader.readAsText(file);
		}).then(function(htmlString) {
			return convertHtmlToMarkdown(htmlString);
		});
	}

	if (ext === 'csv') {
		return new Promise(function(resolve, reject) {
			var reader = new FileReader();
			reader.onload = function(e) { resolve(e.target.result); };
			reader.onerror = function() { reject(new Error('Failed to read file')); };
			reader.readAsText(file);
		}).then(function(csvString) {
			return convertCsvToMarkdown(csvString);
		});
	}

	if (ext === 'docx') {
		return new Promise(function(resolve, reject) {
			var reader = new FileReader();
			reader.onload = function(e) { resolve(e.target.result); };
			reader.onerror = function() { reject(new Error('Failed to read file')); };
			reader.readAsArrayBuffer(file);
		}).then(function(arrayBuffer) {
			return convertDocxToMarkdown(arrayBuffer);
		});
	}

	return Promise.reject(new Error('Unsupported file type: .' + ext));
}

// Handle the "Convert to Markdown" file input change event
function convertFile(event) {
	var file = event.target.files[0];
	if (!file) return;
	event.target.value = ''; // Reset input so same file can be re-selected

	showConversionProgress(file.name);

	convertFileToMarkdown(file).then(function(markdown) {
		hideConversionProgress();
		var tabName = getConvertTabName(file.name);
		createTab(tabName, markdown);
		if (editorMode === 'wysiwyg') renderWysiwygView();
	}).catch(function(err) {
		hideConversionProgress();
		console.error('Conversion failed:', err);
		alert('Conversion failed: ' + (err.message || 'Unknown error'));
	});
}

// Helper: handle a dropped convertible file (used by both editor and WYSIWYG drop handlers)
function handleConvertibleDrop(file) {
	showConversionProgress(file.name);
	convertFileToMarkdown(file).then(function(markdown) {
		hideConversionProgress();
		var tabName = getConvertTabName(file.name);
		createTab(tabName, markdown);
		if (editorMode === 'wysiwyg') renderWysiwygView();
	}).catch(function(err) {
		hideConversionProgress();
		console.error('Conversion failed:', err);
		alert('Conversion failed: ' + (err.message || 'Unknown error'));
	});
}

// Import file: update active tab name to filename
function importFile(event) {
	var file = event.target.files[0];
	if (!file) return;
	var reader = new FileReader();
	reader.onload = function(e) {
		editorEl.value = e.target.result;
		var tab = getTab(activeTabId);
		if (tab) {
			tab.name = file.name.replace(/\.(md|markdown|txt|mmd)$/i, '') || file.name;
			renderTabBar();
		}
		handleEditorInput();
		if (editorMode === 'wysiwyg') renderWysiwygView();
	};
	reader.readAsText(file);
	event.target.value = '';
}

// Drag and drop support on editor textarea
editorEl.addEventListener('dragover', function(e) {
	e.preventDefault();
	editorEl.classList.add('drag-over');
});
editorEl.addEventListener('dragleave', function(e) {
	editorEl.classList.remove('drag-over');
});
editorEl.addEventListener('drop', function(e) {
	e.preventDefault();
	editorEl.classList.remove('drag-over');
	var files = e.dataTransfer.files;
	if (files.length > 0) {
		var file = files[0];
		
		// Handle images (Base64 conversion)
		if (file.type.startsWith('image/')) {
			var imgReader = new FileReader();
			imgReader.onload = function(event) {
				var base64 = event.target.result;
				var markdownImage = '![' + escapeHtml(file.name) + '](' + base64 + ')\n';
				var start = editorEl.selectionStart;
				var end = editorEl.selectionEnd;
				var val = editorEl.value;
				editorEl.value = val.substring(0, start) + markdownImage + val.substring(end);
				editorEl.selectionStart = editorEl.selectionEnd = start + markdownImage.length;
				handleEditorInput();
			};
			imgReader.readAsDataURL(file);
			return;
		}

		// Handle convertible files (HTML, CSV, DOCX) — auto-detect and convert
		if (isConvertibleFile(file.name)) {
			handleConvertibleDrop(file);
			return;
		}

		// Handle markdown/text files
		var reader = new FileReader();
		reader.onload = function(ev) {
			editorEl.value = ev.target.result;
			var tab = getTab(activeTabId);
			if (tab) {
				tab.name = file.name.replace(/\.(md|markdown|txt|mmd)$/i, '') || file.name;
				renderTabBar();
			}
			handleEditorInput();
		};
		reader.readAsText(file);
	}
});

// Clear document / New Document — clears active tab
function clearDocument() {
	if (editorEl.value.length > 0) {
		if (!confirm('Are you sure you want to clear the current document?')) return;
	}
	editorEl.value = '';
	var tab = getTab(activeTabId);
	if (tab) {
		tab.content = '';
	}
	handleEditorInput();
	if (editorMode === 'wysiwyg') {
		renderWysiwygView();
	} else {
		editorEl.focus();
	}
}

// Colour Theme toggle logic
function toggleTheme() {
	var currentTheme = document.documentElement.getAttribute('data-theme');
	var newTheme = currentTheme === 'dark' ? 'light' : 'dark';

	document.documentElement.setAttribute('data-theme', newTheme);
	try { localStorage.setItem('colour-scheme', newTheme); } catch(e) {}

	updateThemeButtons(newTheme);

	// Re-initialise mermaid configuration for the new theme
	initMermaid();

	// Re-render
	handleEditorInput();
}

function updateThemeButtons(theme) {
	// Update old top-bar icons (may not exist after menu migration)
	var lightIcon = document.getElementById('theme-icon-light');
	var darkIcon = document.getElementById('theme-icon-dark');
	var themeText = document.getElementById('theme-text');

	if (lightIcon && darkIcon && themeText) {
		if (theme === 'dark') {
			lightIcon.style.display = 'inline-block';
			darkIcon.style.display = 'none';
			themeText.textContent = 'Light Mode';
		} else {
			lightIcon.style.display = 'none';
			darkIcon.style.display = 'inline-block';
			themeText.textContent = 'Dark Mode';
		}
	}

	// Update menu bar theme icons
	var menuLightIcon = document.getElementById('menu-theme-icon-light');
	var menuDarkIcon = document.getElementById('menu-theme-icon-dark');
	var menuThemeText = document.getElementById('menu-theme-text');

	if (menuLightIcon && menuDarkIcon && menuThemeText) {
		if (theme === 'dark') {
			menuLightIcon.style.display = 'inline-block';
			menuDarkIcon.style.display = 'none';
			menuThemeText.textContent = 'Light Mode';
		} else {
			menuLightIcon.style.display = 'none';
			menuDarkIcon.style.display = 'inline-block';
			menuThemeText.textContent = 'Dark Mode';
		}
	}

	// Toggle highlight.js theme stylesheets to match app theme
	var hljsLight = document.getElementById('hljs-light');
	var hljsDark = document.getElementById('hljs-dark');
	if (hljsLight && hljsDark) {
		if (theme === 'dark') {
			hljsLight.setAttribute('media', 'not all');
			hljsDark.removeAttribute('media');
		} else {
			hljsDark.setAttribute('media', 'not all');
			hljsLight.removeAttribute('media');
		}
	}
}

// PDF Exporter: Re-render with forest theme mermaid and callout processing for print
function exportToPdf() {
	// Re-initialise mermaid with the forest theme for PDF clarity
	mermaid.initialize({
		startOnLoad: false,
		theme: 'forest',
		securityLevel: 'loose',
		flowchart: { useMaxWidth: true, htmlLabels: true }
	});

	// Ensure preview pane is visible for printing (even in WYSIWYG mode)
	var wasWysiwyg = (editorMode === 'wysiwyg');
	if (wasWysiwyg) {
		previewPaneEl.style.display = '';
		wysiwygPaneEl.style.display = 'none';
	}

	// Force highlight.js light theme for print
	var hljsLight = document.getElementById('hljs-light');
	var hljsDark = document.getElementById('hljs-dark');
	var savedHljsLightMedia = hljsLight ? hljsLight.getAttribute('media') : null;
	var savedHljsDarkMedia = hljsDark ? hljsDark.getAttribute('media') : null;
	if (hljsLight) hljsLight.removeAttribute('media');
	if (hljsDark) hljsDark.setAttribute('media', 'not all');

	// Re-render the current markdown to get fresh output
	var markdownText = editorEl.value;
	var result = marked.parse(markdownText);

	function doPrintRender(html) {
		previewEl.innerHTML = DOMPurify.sanitize(html, {
			ADD_TAGS: ['input'],
			ADD_ATTR: ['type', 'checked', 'disabled']
		});

		// Post-process Mermaid diagrams
		var codeBlocks = previewEl.querySelectorAll('code.language-mermaid');
		var printPromises = [];

		for (var i = 0; i < codeBlocks.length; i++) {
			(function(codeEl, idx) {
				var preEl = codeEl.parentElement;
				var diagramSource = codeEl.textContent || '';
				mermaidCounter++;
				var diagramId = 'mermaid-print-' + mermaidCounter;
				var container = document.createElement('div');
				container.className = 'mermaid-container';

				printPromises.push(
					mermaid.render(diagramId, diagramSource).then(function(result) {
						container.innerHTML = result.svg;
						if (preEl && preEl.parentNode) {
							preEl.parentNode.replaceChild(container, preEl);
						}
					}).catch(function(err) {
						container.innerHTML = '<div class="mermaid-error-box">Diagram error: ' + escapeHtml(String(err)) + '</div>';
						if (preEl && preEl.parentNode) {
							preEl.parentNode.replaceChild(container, preEl);
						}
					})
				);
			})(codeBlocks[i], i);
		}

		// Post-process callout blockquotes (same logic as renderPreview)
		try {
			var blockquotes = previewEl.querySelectorAll('blockquote');
			for (var bq = 0; bq < blockquotes.length; bq++) {
				(function(bqEl) {
					var firstP = bqEl.querySelector('p');
					if (!firstP) return;
					var rawHtml = firstP.innerHTML;
					var match = rawHtml.match(/^\[!([a-zA-Z]+)\]([+\-])?\s*(.*)/);
					if (!match) return;

					var calloutType = match[1].toLowerCase();
					var foldModifier = match[2] || '';
					var titleRaw = match[3] || '';
					var parts = rawHtml.split(/\n|<br\s*\/?>/);
					parts.shift();
					var bodyContent = parts.join('<br>');

					var extraChildren = bqEl.querySelectorAll(':scope > *');
					var extraHtml = '';
					for (var ec = 0; ec < extraChildren.length; ec++) {
						if (extraChildren[ec] !== firstP) extraHtml += extraChildren[ec].outerHTML;
					}
					if (extraHtml) bodyContent = bodyContent + extraHtml;

					var titleText = titleRaw || calloutType.charAt(0).toUpperCase() + calloutType.slice(1);

					var svgE = '<' + '/svg>';
					var spnE = '<' + '/span>';
					var icons = {
						note: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>' + svgE,
						info: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>' + svgE,
						tip: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>' + svgE,
						warning: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>' + svgE,
						success: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>' + svgE,
						danger: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>' + svgE,
						failure: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>' + svgE,
						question: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>' + svgE,
						bug: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75z"/>' + svgE,
						example: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12"/>' + svgE,
						abstract: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>' + svgE,
						todo: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' + svgE,
						quote: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>' + svgE
					};
					var icon = icons[calloutType] || icons.note;

					var calloutDiv = document.createElement('div');
					calloutDiv.className = 'callout callout-' + calloutType;

					// For PDF, always render callouts open/static (no folding)
					var headerDiv = document.createElement('div');
					headerDiv.className = 'callout-header';
					headerDiv.innerHTML = icon + '<span>' + titleText + spnE;
					calloutDiv.appendChild(headerDiv);
					if (bodyContent) {
						var bodyDiv = document.createElement('div');
						bodyDiv.className = 'callout-body';
						bodyDiv.innerHTML = bodyContent;
						calloutDiv.appendChild(bodyDiv);
					}

					bqEl.parentNode.replaceChild(calloutDiv, bqEl);
				})(blockquotes[bq]);
			}
		} catch(e) {}

		// Post-process: syntax highlighting for code blocks
		if (typeof hljs !== 'undefined') {
			var printCodeEls = previewEl.querySelectorAll('pre code');
			for (var hli = 0; hli < printCodeEls.length; hli++) {
				if (!printCodeEls[hli].classList.contains('language-mermaid')) {
					hljs.highlightElement(printCodeEls[hli]);
				}
			}
		}

		// Wait for all diagrams to render, then print, then restore
		Promise.all(printPromises).then(function() {
			setTimeout(function() {
				window.print();

				// Restore the original theme and re-render the preview
				initMermaid();
				handleEditorInput();

				// Restore WYSIWYG pane if it was the active mode
				if (wasWysiwyg) {
					previewPaneEl.style.display = 'none';
					wysiwygPaneEl.style.display = '';
				}

				// Restore highlight.js theme
				if (hljsLight && savedHljsLightMedia !== null) hljsLight.setAttribute('media', savedHljsLightMedia);
				else if (hljsLight && savedHljsLightMedia === null) hljsLight.removeAttribute('media');
				if (hljsDark && savedHljsDarkMedia !== null) hljsDark.setAttribute('media', savedHljsDarkMedia);
				else if (hljsDark && savedHljsDarkMedia === null) hljsDark.removeAttribute('media');
			}, 150);
		});
	}

	if (result && typeof result.then === 'function') {
		result.then(function(html) { doPrintRender(html); });
	} else {
		doPrintRender(result);
	}
}

// Export markdown to local file
function exportMarkdown() {
	var content = editorEl.value;
	var tab = getTab(activeTabId);
	var filename = (tab && tab.name ? tab.name : 'document') + '.md';
	var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
	var url = URL.createObjectURL(blob);
	var link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

// ========== Context Menu Logic ==========
var ctxMenu = document.getElementById('context-menu');
var ctxSavedStart = 0;
var ctxSavedEnd = 0;

// Show custom context menu on right-click within the editor textarea
editorEl.addEventListener('contextmenu', function(e) {
	e.preventDefault();
	ctxSavedStart = editorEl.selectionStart;
	ctxSavedEnd = editorEl.selectionEnd;
	positionContextMenu(e.clientX, e.clientY);
	ctxMenu.classList.add('active');
});

// Position context menu with viewport bounds checking
function positionContextMenu(x, y) {
	ctxMenu.style.visibility = 'hidden';
	ctxMenu.classList.add('active');
	var menuW = ctxMenu.offsetWidth;
	var menuH = ctxMenu.offsetHeight;
	ctxMenu.classList.remove('active');
	ctxMenu.style.visibility = '';

	var winW = window.innerWidth;
	var winH = window.innerHeight;

	if (x + menuW > winW - 8) x = winW - menuW - 8;
	if (x < 8) x = 8;
	if (y + menuH > winH - 8) y = winH - menuH - 8;
	if (y < 8) y = 8;

	ctxMenu.style.left = x + 'px';
	ctxMenu.style.top = y + 'px';

	// Flip submenus to the left if near right edge
	var submenus = ctxMenu.querySelectorAll('.context-submenu');
	for (var si = 0; si < submenus.length; si++) {
		submenus[si].classList.remove('flip-left');
		if (x + menuW + 210 > winW) {
			submenus[si].classList.add('flip-left');
		}
	}
}

// Close context menu
function closeContextMenu() {
	ctxMenu.classList.remove('active');
}

// Close on any click outside the context menu
document.addEventListener('click', function(e) {
	if (!ctxMenu.contains(e.target)) {
		closeContextMenu();
	}
});

// Close on scroll anywhere
document.addEventListener('scroll', closeContextMenu, true);

// Restore editor selection from saved state before executing an action
function restoreEditorSelection() {
	editorEl.focus();
	editorEl.selectionStart = ctxSavedStart;
	editorEl.selectionEnd = ctxSavedEnd;
}

// Context menu: Cut selected text
function ctxCut() {
	closeContextMenu();
	restoreEditorSelection();
	var selected = editorEl.value.substring(ctxSavedStart, ctxSavedEnd);
	if (!selected) return;
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(selected).then(function() {
			var val = editorEl.value;
			editorEl.value = val.substring(0, ctxSavedStart) + val.substring(ctxSavedEnd);
			editorEl.selectionStart = editorEl.selectionEnd = ctxSavedStart;
			handleEditorInput();
		}).catch(function() {
			document.execCommand('cut');
			handleEditorInput();
		});
	} else {
		document.execCommand('cut');
		handleEditorInput();
	}
}

// Context menu: Copy selected text
function ctxCopy() {
	closeContextMenu();
	restoreEditorSelection();
	var selected = editorEl.value.substring(ctxSavedStart, ctxSavedEnd);
	if (!selected) return;
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(selected).catch(function() {
			document.execCommand('copy');
		});
	} else {
		document.execCommand('copy');
	}
}

// Context menu: Paste from clipboard
function ctxPaste() {
	closeContextMenu();
	restoreEditorSelection();
	if (navigator.clipboard && navigator.clipboard.readText) {
		navigator.clipboard.readText().then(function(text) {
			if (!text) return;
			var val = editorEl.value;
			editorEl.value = val.substring(0, ctxSavedStart) + text + val.substring(ctxSavedEnd);
			editorEl.selectionStart = editorEl.selectionEnd = ctxSavedStart + text.length;
			handleEditorInput();
		}).catch(function() {
			// Clipboard read permission denied
		});
	}
}

// Context menu: Insert markdown link
function ctxLink() {
	closeContextMenu();
	restoreEditorSelection();
	insertLink();
}

// Context menu: Bold formatting
function ctxBold() {
	closeContextMenu();
	restoreEditorSelection();
	wrapSelection('**', '**');
}

// Context menu: Italic formatting
function ctxItalic() {
	closeContextMenu();
	restoreEditorSelection();
	wrapSelection('*', '*');
}

// Context menu: Bullet list
function ctxBulletList() {
	closeContextMenu();
	restoreEditorSelection();
	insertListPrefix('- ');
}

// Context menu: Numbered list
function ctxNumberedList() {
	closeContextMenu();
	restoreEditorSelection();
	insertListPrefix('1. ');
}

// Context menu: Task list
function ctxTaskList() {
	closeContextMenu();
	restoreEditorSelection();
	insertListPrefix('- [ ] ');
}

// Insert a markdown link at the current selection (reusable for Ctrl+K and context menu)
function insertLink() {
	var start = editorEl.selectionStart;
	var end = editorEl.selectionEnd;
	var selectedText = editorEl.value.substring(start, end) || 'link text';
	var replacement = '[' + selectedText + '](url)';
	var val = editorEl.value;
	editorEl.value = val.substring(0, start) + replacement + val.substring(end);
	var urlPos = start + selectedText.length + 3;
	editorEl.selectionStart = urlPos;
	editorEl.selectionEnd = urlPos + 3;
	editorEl.focus();
	handleEditorInput();
}

// Prefix selected lines with a list marker (bullet, number, or task)
// Uses String.fromCharCode(10) for newline to avoid template literal escape collisions
function insertListPrefix(prefix) {
	var NL = String.fromCharCode(10);
	var start = editorEl.selectionStart;
	var end = editorEl.selectionEnd;
	var val = editorEl.value;

	// Expand selection to cover full lines
	var lineStart = val.lastIndexOf(NL, start - 1) + 1;
	var lineEnd = val.indexOf(NL, end);
	if (lineEnd === -1) lineEnd = val.length;

	var selectedBlock = val.substring(lineStart, lineEnd);
	var lines = selectedBlock.split(NL);
	var newLines = [];
	for (var li = 0; li < lines.length; li++) {
		var lp = prefix;
		if (prefix === '1. ') {
			lp = (li + 1) + '. ';
		}
		newLines.push(lp + lines[li]);
	}

	var joined = newLines.join(NL);
	editorEl.value = val.substring(0, lineStart) + joined + val.substring(lineEnd);
	editorEl.selectionStart = lineStart;
	editorEl.selectionEnd = lineStart + joined.length;
	editorEl.focus();
	handleEditorInput();
}

// Insert complex snippets (type can be 'table', 'callout', 'diagram', or 'custom')
// When type is 'custom', the second argument is the raw markdown to insert
function insertSnippet(type, customContent) {
	var NL = String.fromCharCode(10);
	var snippet = '';
	if (type === 'custom' && customContent) {
		snippet = NL + customContent + NL;
	} else if (type === 'table') {
		snippet = NL + '| Column 1 | Column 2 | Column 3 |' + NL + '|----------|----------|----------|' + NL + '| Data 1   | Data 2   | Data 3   |' + NL;
	} else if (type === 'callout') {
		snippet = NL + '>[!info] Information' + NL + '>Add your callout text here.' + NL;
	} else if (type === 'diagram') {
		snippet = NL + '```mermaid' + NL + 'graph TD' + NL + '  A[Start] --> B[End]' + NL + '```' + NL;
	}
	
	if (snippet) {
		var start = editorEl.selectionStart;
		var end = editorEl.selectionEnd;
		var val = editorEl.value;
		editorEl.value = val.substring(0, start) + snippet + val.substring(end);
		editorEl.selectionStart = editorEl.selectionEnd = start + snippet.length;
		editorEl.focus();
		handleEditorInput();
	}
}

// ========== Toolbar Picker Popovers ==========
var activePicker = null;

function closeActivePicker() {
	if (activePicker && activePicker.parentNode) {
		activePicker.parentNode.removeChild(activePicker);
	}
	activePicker = null;
}

// Close picker when clicking outside
document.addEventListener('mousedown', function(e) {
	if (activePicker && !activePicker.contains(e.target) && !e.target.closest('.toolbar-btn')) {
		closeActivePicker();
	}
});

// Generate markdown table with given dimensions
function generateTableMarkdown(cols, rows) {
	var NL = String.fromCharCode(10);
	var headerCells = [];
	var separatorCells = [];
	for (var c = 0; c < cols; c++) {
		headerCells.push(' Column ' + (c + 1) + ' ');
		separatorCells.push('----------');
	}
	var lines = ['| ' + headerCells.join('| ') + '|'];
	lines.push('|' + separatorCells.join('|') + '|');
	for (var r = 0; r < rows; r++) {
		var dataCells = [];
		for (var c2 = 0; c2 < cols; c2++) {
			dataCells.push('          ');
		}
		lines.push('|' + dataCells.join('|') + '|');
	}
	return lines.join(NL);
}

// Show the table grid picker (Word-style hover grid)
function showTablePicker(buttonEl, mode) {
	closeActivePicker();

	var GRID_COLS = 6;
	var GRID_ROWS = 6;
	var picker = document.createElement('div');
	picker.className = 'toolbar-picker';

	var grid = document.createElement('div');
	grid.className = 'table-grid';

	var label = document.createElement('div');
	label.className = 'table-grid-label';
	label.textContent = 'Select size';

	var hoverCol = 0;
	var hoverRow = 0;

	function updateHighlight(col, row) {
		var cells = grid.querySelectorAll('.table-grid-cell');
		for (var ci = 0; ci < cells.length; ci++) {
			var cellCol = parseInt(cells[ci].getAttribute('data-col'));
			var cellRow = parseInt(cells[ci].getAttribute('data-row'));
			cells[ci].classList.remove('highlight', 'highlight-full');
			if (cellCol <= col && cellRow <= row) {
				cells[ci].classList.add('highlight');
			}
		}
		label.textContent = (col + 1) + ' x ' + (row + 1);
	}

	for (var r = 0; r < GRID_ROWS; r++) {
		for (var c = 0; c < GRID_COLS; c++) {
			(function(col, row) {
				var cell = document.createElement('div');
				cell.className = 'table-grid-cell';
				cell.setAttribute('data-col', col);
				cell.setAttribute('data-row', row);
				cell.addEventListener('mouseenter', function() {
					hoverCol = col;
					hoverRow = row;
					updateHighlight(col, row);
				});
				cell.addEventListener('click', function(e) {
					e.preventDefault();
					e.stopPropagation();
					var tableMd = generateTableMarkdown(col + 1, row + 1);
					closeActivePicker();
					if (mode === 'wysiwyg') {
						wysiwygInsertBlock(tableMd);
					} else {
						insertSnippet('custom', tableMd);
					}
				});
				grid.appendChild(cell);
			})(c, r);
		}
	}

	picker.appendChild(grid);
	picker.appendChild(label);

	// Position the picker below the button
	var rect = buttonEl.getBoundingClientRect();
	picker.style.left = rect.left + 'px';
	picker.style.top = (rect.bottom + 4) + 'px';
	document.body.appendChild(picker);

	// Keep within viewport
	var pickerRect = picker.getBoundingClientRect();
	if (pickerRect.right > window.innerWidth - 8) {
		picker.style.left = (window.innerWidth - pickerRect.width - 8) + 'px';
	}

	activePicker = picker;
}

// Callout type definitions
var calloutTypes = [
	{ type: 'note', label: 'Note', colour: '#448aff' },
	{ type: 'info', label: 'Info', colour: '#2196f3' },
	{ type: 'tip', label: 'Tip', colour: '#00bfa5' },
	{ type: 'success', label: 'Success', colour: '#4caf50' },
	{ type: 'warning', label: 'Warning', colour: '#ff9100' },
	{ type: 'danger', label: 'Danger', colour: '#f44336' },
	{ type: 'bug', label: 'Bug', colour: '#f44336' },
	{ type: 'example', label: 'Example', colour: '#7c4dff' },
	{ type: 'question', label: 'Question', colour: '#ff9800' },
	{ type: 'abstract', label: 'Abstract', colour: '#00bcd4' },
	{ type: 'todo', label: 'To Do', colour: '#2196f3' },
	{ type: 'quote', label: 'Quote', colour: '#9e9e9e' }
];

// Show the callout type picker
function showCalloutPicker(buttonEl, mode) {
	closeActivePicker();

	var picker = document.createElement('div');
	picker.className = 'toolbar-picker';
	picker.style.minWidth = '160px';
	picker.style.padding = '6px';

	var list = document.createElement('div');
	list.className = 'callout-picker-list';

	for (var i = 0; i < calloutTypes.length; i++) {
		(function(ct) {
			var item = document.createElement('div');
			item.className = 'callout-picker-item';

			var dot = document.createElement('span');
			dot.className = 'callout-picker-dot';
			dot.style.backgroundColor = ct.colour;

			var labelSpan = document.createElement('span');
			labelSpan.textContent = ct.label;

			item.appendChild(dot);
			item.appendChild(labelSpan);

			item.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				var title = ct.type.charAt(0).toUpperCase() + ct.type.slice(1);
				var calloutMd = '> [!' + ct.type + '] ' + title + '\n> Your text here.';
				closeActivePicker();
				if (mode === 'wysiwyg') {
					wysiwygInsertBlock(calloutMd);
				} else {
					insertSnippet('custom', calloutMd);
				}
			});

			list.appendChild(item);
		})(calloutTypes[i]);
	}

	picker.appendChild(list);

	// Position below the button
	var rect = buttonEl.getBoundingClientRect();
	picker.style.left = rect.left + 'px';
	picker.style.top = (rect.bottom + 4) + 'px';
	document.body.appendChild(picker);

	// Keep within viewport
	var pickerRect = picker.getBoundingClientRect();
	if (pickerRect.right > window.innerWidth - 8) {
		picker.style.left = (window.innerWidth - pickerRect.width - 8) + 'px';
	}
	if (pickerRect.bottom > window.innerHeight - 8) {
		picker.style.top = (rect.top - pickerRect.height - 4) + 'px';
	}

	activePicker = picker;
}

// ========== WYSIWYG Mode ==========
var editorMode = 'wysiwyg'; // 'wysiwyg' or 'raw'
var wysiwygBlocks = [];
var activeBlockIndex = -1;
var wysiwygBodyEl = document.getElementById('wysiwyg-body');
var wysiwygContainerEl = document.getElementById('wysiwyg-container');
var wysiwygPaneEl = document.getElementById('wysiwyg-pane');
var editorPaneEl = document.getElementById('editor-pane');
var previewPaneEl = document.getElementById('preview-pane');
var wysiwygDocCounterEl = document.getElementById('wysiwyg-doc-counter');

// Parse raw markdown source into an array of block objects
// Each block: { startLine, endLine, raw, type }
function parseMarkdownBlocks(source) {
	if (!source || source.trim() === '') return [];
	var lines = source.split('\n');
	var blocks = [];
	var i = 0;

	while (i < lines.length) {
		// Skip blank lines — attach them to the next block
		if (lines[i].trim() === '') {
			i++;
			continue;
		}

		var startLine = i;

		// Code fence (``` or ~~~)
		if (/^(`{3,}|~{3,})/.test(lines[i].trim())) {
			var fence = lines[i].trim().match(/^(`{3,}|~{3,})/)[1];
			var fenceChar = fence.charAt(0);
			var fenceLen = fence.length;
			i++;
			while (i < lines.length) {
				var trimmed = lines[i].trim();
				if (trimmed.length >= fenceLen && trimmed === fenceChar.repeat(trimmed.length) && trimmed.charAt(0) === fenceChar) {
					i++;
					break;
				}
				i++;
			}
			blocks.push({ startLine: startLine, endLine: i - 1, raw: lines.slice(startLine, i).join('\n'), type: 'code' });
			continue;
		}

		// Heading
		if (/^#{1,6}\s/.test(lines[i])) {
			blocks.push({ startLine: i, endLine: i, raw: lines[i], type: 'heading' });
			i++;
			continue;
		}

		// Horizontal rule
		if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])) {
			blocks.push({ startLine: i, endLine: i, raw: lines[i], type: 'hr' });
			i++;
			continue;
		}

		// Table (contiguous pipe lines)
		if (lines[i].trim().charAt(0) === '|') {
			while (i < lines.length && lines[i].trim().charAt(0) === '|') { i++; }
			blocks.push({ startLine: startLine, endLine: i - 1, raw: lines.slice(startLine, i).join('\n'), type: 'table' });
			continue;
		}

		// Blockquote (contiguous > lines)
		if (lines[i].trim().charAt(0) === '>') {
			while (i < lines.length && lines[i].trim().charAt(0) === '>') { i++; }
			blocks.push({ startLine: startLine, endLine: i - 1, raw: lines.slice(startLine, i).join('\n'), type: 'blockquote' });
			continue;
		}

		// List (contiguous list-like lines)
		if (/^(\s*[-*+]\s|\s*\d+\.\s)/.test(lines[i])) {
			while (i < lines.length && lines[i].trim() !== '' && (
				/^(\s*[-*+]\s|\s*\d+\.\s)/.test(lines[i]) ||
				/^\s{2,}/.test(lines[i])
			)) { i++; }
			blocks.push({ startLine: startLine, endLine: i - 1, raw: lines.slice(startLine, i).join('\n'), type: 'list' });
			continue;
		}

		// Paragraph (everything else until a blank line or a new block type)
		while (i < lines.length && lines[i].trim() !== '' &&
			!/^(`{3,}|~{3,})/.test(lines[i].trim()) &&
			!/^#{1,6}\s/.test(lines[i]) &&
			!/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i]) &&
			lines[i].trim().charAt(0) !== '|' &&
			lines[i].trim().charAt(0) !== '>' &&
			!/^(\s*[-*+]\s|\s*\d+\.\s)/.test(lines[i])) {
			i++;
		}
		blocks.push({ startLine: startLine, endLine: i - 1, raw: lines.slice(startLine, i).join('\n'), type: 'paragraph' });
	}

	return blocks;
}

// Reconstruct the full markdown from blocks
function reconstructSource() {
	return wysiwygBlocks.map(function(b) { return b.raw; }).join('\n\n');
}

// Render the full WYSIWYG view from the current editor content
function renderWysiwygView() {
	var source = editorEl.value;
	wysiwygBlocks = parseMarkdownBlocks(source);

	// Update word/character count
	var wordCount = source.trim() ? source.trim().split(/\s+/).length : 0;
	var readingMins = Math.ceil(wordCount / 228);
	var readingLabel = wordCount === 0 ? '0 min read' : readingMins + ' min read';
	wysiwygDocCounterEl.textContent = wordCount + ' Words / ' + source.length + ' Characters / ' + readingLabel;

	// Show placeholder if no content
	if (wysiwygBlocks.length === 0) {
		wysiwygBodyEl.innerHTML = '';
		var placeholder = document.createElement('div');
		placeholder.className = 'wysiwyg-placeholder';
		placeholder.onclick = startNewBlock;
		placeholder.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.4;"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path></svg>'
			+ '<p>Click here to start writing, or drag and drop a .md file</p>'
			+ '<p style="font-size: 12px; opacity: 0.6; margin-top: 4px;">You can also paste markdown or use the toolbar above</p>';
		wysiwygBodyEl.appendChild(placeholder);
		return;
	}

	// Render each block as a clickable div
	var fragment = document.createDocumentFragment();
	for (var bi = 0; bi < wysiwygBlocks.length; bi++) {
		(function(block, idx) {
			var wrapper = document.createElement('div');
			wrapper.className = 'wysiwyg-block';
			wrapper.setAttribute('data-block-index', idx);

			// Render block markdown to HTML
			var result = marked.parse(block.raw);
			if (result && typeof result.then === 'function') {
				result.then(function(html) {
					wrapper.innerHTML = DOMPurify.sanitize(html);
					postProcessBlock(wrapper);
				});
			} else {
				wrapper.innerHTML = DOMPurify.sanitize(result);
				postProcessBlock(wrapper);
			}

			wrapper.addEventListener('click', function(e) {
				// Do not enter edit mode if clicking inside an already-editing block
				if (wrapper.classList.contains('editing')) return;
				e.stopPropagation();
				startBlockEdit(idx);
			});

			fragment.appendChild(wrapper);
		})(wysiwygBlocks[bi], bi);
	}

	wysiwygBodyEl.innerHTML = '';
	wysiwygBodyEl.appendChild(fragment);
}

// Post-process a single block wrapper (mermaid + callouts) — reuses existing logic
function postProcessBlock(wrapper) {
	// Mermaid diagrams
	var codeBlocks = wrapper.querySelectorAll('code.language-mermaid');
	for (var mi = 0; mi < codeBlocks.length; mi++) {
		(function(codeEl) {
			var preEl = codeEl.parentElement;
			var diagramSource = codeEl.textContent || '';
			mermaidCounter++;
			var diagramId = 'mermaid-wysiwyg-' + mermaidCounter;
			var container = document.createElement('div');
			container.className = 'mermaid-container';
			mermaid.render(diagramId, diagramSource).then(function(result) {
				container.innerHTML = result.svg;
				if (preEl && preEl.parentNode) preEl.parentNode.replaceChild(container, preEl);
			}).catch(function(err) {
				container.innerHTML = '<div class="mermaid-error-box">Diagram syntax error: ' + escapeHtml(String(err)) + '</div>';
				if (preEl && preEl.parentNode) preEl.parentNode.replaceChild(container, preEl);
			});
		})(codeBlocks[mi]);
	}

	// Callouts (reuse the same callout post-processing from renderPreview)
	try {
		var blockquotes = wrapper.querySelectorAll('blockquote');
		for (var bq = 0; bq < blockquotes.length; bq++) {
			(function(bqEl) {
				var firstP = bqEl.querySelector('p');
				if (!firstP) return;
				var rawHtml = firstP.innerHTML;
				var match = rawHtml.match(/^\[!([a-zA-Z]+)\]([+\-])?\s*(.*)/);
				if (!match) return;

				var calloutType = match[1].toLowerCase();
				var foldModifier = match[2] || '';
				var titleRaw = match[3] || '';

				var parts = rawHtml.split(/\n|<br\s*\/?>/);
				parts.shift();
				var bodyContent = parts.join('<br>');

				var extraChildren = bqEl.querySelectorAll(':scope > *');
				var extraHtml = '';
				for (var ec = 0; ec < extraChildren.length; ec++) {
					if (extraChildren[ec] !== firstP) extraHtml += extraChildren[ec].outerHTML;
				}
				if (extraHtml) bodyContent = bodyContent + extraHtml;

				var titleText = titleRaw || calloutType.charAt(0).toUpperCase() + calloutType.slice(1);

				var svgE = '<' + '/svg>';
				var spnE = '<' + '/span>';
				var icons = {
					note: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>' + svgE,
					info: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>' + svgE,
					tip: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>' + svgE,
					warning: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>' + svgE,
					success: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>' + svgE,
					danger: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>' + svgE,
					failure: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>' + svgE,
					question: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>' + svgE,
					bug: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75z"/>' + svgE,
					example: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12"/>' + svgE,
					abstract: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>' + svgE,
					todo: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' + svgE,
					quote: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>' + svgE
				};
				var icon = icons[calloutType] || icons.note;

				var calloutDiv = document.createElement('div');
				calloutDiv.className = 'callout callout-' + calloutType;

				if (foldModifier) {
					var isOpen = foldModifier === '+';
					var details = document.createElement('details');
					if (isOpen) details.setAttribute('open', '');
					var summary = document.createElement('summary');
					summary.className = 'callout-header';
					summary.innerHTML = icon + '<span>' + titleText + spnE;
					details.appendChild(summary);
					if (bodyContent) {
						var bodyDiv = document.createElement('div');
						bodyDiv.className = 'callout-body';
						bodyDiv.innerHTML = bodyContent;
						details.appendChild(bodyDiv);
					}
					calloutDiv.appendChild(details);
				} else {
					var headerDiv = document.createElement('div');
					headerDiv.className = 'callout-header';
					headerDiv.innerHTML = icon + '<span>' + titleText + spnE;
					calloutDiv.appendChild(headerDiv);
					if (bodyContent) {
						var bodyDiv2 = document.createElement('div');
						bodyDiv2.className = 'callout-body';
						bodyDiv2.innerHTML = bodyContent;
						calloutDiv.appendChild(bodyDiv2);
					}
				}
				bqEl.parentNode.replaceChild(calloutDiv, bqEl);
			})(blockquotes[bq]);
		}
	} catch(e) {}
}

// Start editing a block: replace rendered HTML with a textarea
function startBlockEdit(blockIndex) {
	// Finish any currently editing block first
	if (activeBlockIndex >= 0 && activeBlockIndex !== blockIndex) {
		finishBlockEdit(activeBlockIndex);
	}

	var block = wysiwygBlocks[blockIndex];
	if (!block) return;

	var blockEl = wysiwygBodyEl.querySelector('[data-block-index="' + blockIndex + '"]');
	if (!blockEl) return;

	activeBlockIndex = blockIndex;
	blockEl.classList.add('editing');

	var textarea = document.createElement('textarea');
	textarea.value = block.raw;
	textarea.setAttribute('spellcheck', 'false');
	blockEl.innerHTML = '';
	blockEl.appendChild(textarea);

	// Auto-size textarea
	function autoSize() {
		textarea.style.height = 'auto';
		textarea.style.height = (textarea.scrollHeight + 2) + 'px';
	}
	autoSize();
	textarea.addEventListener('input', autoSize);

	textarea.focus();

	// Finish editing on blur (with a small delay so click on another block works)
	textarea.addEventListener('blur', function() {
		setTimeout(function() { finishBlockEdit(blockIndex); }, 150);
	});

	// Finish editing on Escape
	textarea.addEventListener('keydown', function(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			textarea.blur();
		}
		// Tab support
		if (e.key === 'Tab') {
			e.preventDefault();
			var start = textarea.selectionStart;
			var end = textarea.selectionEnd;
			var val = textarea.value;
			textarea.value = val.substring(0, start) + '\t' + val.substring(end);
			textarea.selectionStart = textarea.selectionEnd = start + 1;
			autoSize();
		}
	});
}

// Finish editing a block: update source and do a full re-render
// A full re-render is necessary because editing a block may change the total number
// of blocks (e.g. typing a table + paragraph creates two blocks from one).
function finishBlockEdit(blockIndex) {
	if (activeBlockIndex !== blockIndex) return;

	var blockEl = wysiwygBodyEl.querySelector('[data-block-index="' + blockIndex + '"]');
	if (!blockEl || !blockEl.classList.contains('editing')) {
		activeBlockIndex = -1;
		return;
	}

	var textarea = blockEl.querySelector('textarea');
	if (!textarea) {
		activeBlockIndex = -1;
		return;
	}

	var newRaw = textarea.value;
	var block = wysiwygBlocks[blockIndex];

	// Update the block raw source
	block.raw = newRaw;

	// Reconstruct full source and sync to hidden editor
	editorEl.value = reconstructSource();
	saveTabState();

	// Reset active state and do a full re-render to keep DOM in sync
	activeBlockIndex = -1;
	renderWysiwygView();

	// Also update the raw editor counter
	docCounterEl.textContent = wysiwygDocCounterEl.textContent;

	// Also update preview if in raw mode
	if (editorMode === 'raw') handleEditorInput();
}

// Start a new block when clicking the empty placeholder
function startNewBlock() {
	editorEl.value = '# ';
	saveTabState();
	renderWysiwygView();
	// Immediately open the first block for editing
	setTimeout(function() { startBlockEdit(0); }, 50);
}

// Toggle between WYSIWYG and Raw editing modes
function toggleEditorMode() {
	if (editorMode === 'wysiwyg') {
		// Finish any active block edit first
		if (activeBlockIndex >= 0) finishBlockEdit(activeBlockIndex);

		editorMode = 'raw';
		wysiwygPaneEl.style.display = 'none';
		editorPaneEl.style.display = '';
		previewPaneEl.style.display = '';

		// Sync content to raw editor and re-render preview
		handleEditorInput();
	} else {
		editorMode = 'wysiwyg';
		wysiwygPaneEl.style.display = '';
		editorPaneEl.style.display = 'none';
		previewPaneEl.style.display = 'none';

		// Sync content and render WYSIWYG view
		renderWysiwygView();
	}

	try { localStorage.setItem('openmarkdown_editor_mode', editorMode); } catch(e) {}
}

// WYSIWYG toolbar helpers: wrap text in active block textarea
function wysiwygWrap(prefix, suffix) {
	var textarea = wysiwygBodyEl.querySelector('.wysiwyg-block.editing textarea');
	if (!textarea) return;
	var start = textarea.selectionStart;
	var end = textarea.selectionEnd;
	var val = textarea.value;
	var selected = val.substring(start, end);
	textarea.value = val.substring(0, start) + prefix + selected + suffix + val.substring(end);
	textarea.selectionStart = start + prefix.length;
	textarea.selectionEnd = end + prefix.length;
	textarea.focus();
	textarea.dispatchEvent(new Event('input'));
}

function wysiwygInsertLink() {
	var textarea = wysiwygBodyEl.querySelector('.wysiwyg-block.editing textarea');
	if (!textarea) return;
	var start = textarea.selectionStart;
	var end = textarea.selectionEnd;
	var val = textarea.value;
	var selected = val.substring(start, end) || 'link text';
	var replacement = '[' + selected + '](url)';
	textarea.value = val.substring(0, start) + replacement + val.substring(end);
	textarea.focus();
	textarea.dispatchEvent(new Event('input'));
}

// Insert a new block at the end of the document
function wysiwygInsertBlock(rawContent) {
	// Finish any active edit first
	if (activeBlockIndex >= 0) finishBlockEdit(activeBlockIndex);

	var current = editorEl.value;
	if (current.trim().length > 0) {
		editorEl.value = current.trimEnd() + '\n\n' + rawContent;
	} else {
		editorEl.value = rawContent;
	}
	saveTabState();
	renderWysiwygView();

	// Open the last block for editing
	var lastIdx = wysiwygBlocks.length - 1;
	if (lastIdx >= 0) {
		setTimeout(function() {
			startBlockEdit(lastIdx);
			// Scroll to the new block
			var blockEl = wysiwygBodyEl.querySelector('[data-block-index="' + lastIdx + '"]');
			if (blockEl) blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 100);
	}
}

// WYSIWYG drag-and-drop support
wysiwygContainerEl.addEventListener('dragover', function(e) {
	e.preventDefault();
	wysiwygContainerEl.classList.add('drag-over');
});
wysiwygContainerEl.addEventListener('dragleave', function() {
	wysiwygContainerEl.classList.remove('drag-over');
});
wysiwygContainerEl.addEventListener('drop', function(e) {
	e.preventDefault();
	wysiwygContainerEl.classList.remove('drag-over');
	var files = e.dataTransfer.files;
	if (files.length > 0) {
		var file = files[0];
		if (file.type.startsWith('image/')) {
			var imgReader = new FileReader();
			imgReader.onload = function(event) {
				var base64 = event.target.result;
				var markdownImage = '![' + escapeHtml(file.name) + '](' + base64 + ')';
				var current = editorEl.value;
				editorEl.value = current.trim().length > 0 ? current.trimEnd() + '\n\n' + markdownImage : markdownImage;
				saveTabState();
				renderWysiwygView();
			};
			imgReader.readAsDataURL(file);
		} else if (isConvertibleFile(file.name)) {
			// Handle convertible files (HTML, CSV, DOCX) — auto-detect and convert
			handleConvertibleDrop(file);
		} else {
			var reader = new FileReader();
			reader.onload = function(ev) {
				editorEl.value = ev.target.result;
				var tab = getTab(activeTabId);
				if (tab) {
					tab.name = file.name.replace(/\.(md|markdown|txt|mmd)$/i, '') || file.name;
					renderTabBar();
				}
				saveTabState();
				renderWysiwygView();
			};
			reader.readAsText(file);
		}
	}
});

// WYSIWYG paste support (when not editing a block)
wysiwygBodyEl.addEventListener('paste', function(e) {
	// Only handle paste if no block is currently being edited
	if (activeBlockIndex >= 0) return;
	e.preventDefault();
	var pastedText = (e.clipboardData || window.clipboardData).getData('text');
	if (!pastedText) return;
	var current = editorEl.value;
	editorEl.value = current.trim().length > 0 ? current.trimEnd() + '\n\n' + pastedText : pastedText;
	saveTabState();
	renderWysiwygView();
});

// Click outside any block to finish editing
wysiwygContainerEl.addEventListener('click', function(e) {
	if (activeBlockIndex >= 0 && !e.target.closest('.wysiwyg-block')) {
		finishBlockEdit(activeBlockIndex);
	}
});

// ========== Find & Replace ==========
var findMatches = [];
var findCurrentIndex = -1;
var findCaseSensitive = false;

function openFindBar(showReplace) {
	var bar = document.getElementById('find-bar');
	bar.classList.add('active');
	var findInput = document.getElementById('find-input');
	findInput.focus();

	// Pre-fill with selected text if any
	var sel = '';
	if (editorMode === 'raw') {
		sel = editorEl.value.substring(editorEl.selectionStart, editorEl.selectionEnd);
	}
	if (sel) {
		findInput.value = sel;
		runFind();
	}

	if (showReplace) {
		document.getElementById('find-replace-row').style.display = '';
		document.getElementById('find-replace-toggle').classList.add('active');
	}
}

function closeFindBar() {
	var bar = document.getElementById('find-bar');
	bar.classList.remove('active');
	findMatches = [];
	findCurrentIndex = -1;
	document.getElementById('find-count').textContent = '0 / 0';
	document.getElementById('find-replace-row').style.display = 'none';
	document.getElementById('find-replace-toggle').classList.remove('active');

	// Return focus to editor
	if (editorMode === 'raw') editorEl.focus();
}

function toggleReplaceRow() {
	var row = document.getElementById('find-replace-row');
	var btn = document.getElementById('find-replace-toggle');
	if (row.style.display === 'none') {
		row.style.display = '';
		btn.classList.add('active');
		document.getElementById('replace-input').focus();
	} else {
		row.style.display = 'none';
		btn.classList.remove('active');
	}
}

function toggleFindCase() {
	findCaseSensitive = !findCaseSensitive;
	var btn = document.getElementById('find-case-btn');
	if (findCaseSensitive) btn.classList.add('active');
	else btn.classList.remove('active');
	runFind();
}

function runFind() {
	var query = document.getElementById('find-input').value;
	findMatches = [];
	findCurrentIndex = -1;

	if (!query) {
		document.getElementById('find-count').textContent = '0 / 0';
		return;
	}

	var text = editorEl.value;
	var searchText = findCaseSensitive ? text : text.toLowerCase();
	var searchQuery = findCaseSensitive ? query : query.toLowerCase();
	var startPos = 0;

	while (startPos < searchText.length) {
		var idx = searchText.indexOf(searchQuery, startPos);
		if (idx === -1) break;
		findMatches.push({ start: idx, end: idx + query.length });
		startPos = idx + 1;
	}

	if (findMatches.length > 0) {
		findCurrentIndex = 0;
		highlightFindMatch(true);
	}

	updateFindCount();
}

function updateFindCount() {
	var countEl = document.getElementById('find-count');
	if (findMatches.length === 0) {
		countEl.textContent = '0 / 0';
	} else {
		countEl.textContent = (findCurrentIndex + 1) + ' / ' + findMatches.length;
	}
}

function highlightFindMatch(skipFocus) {
	if (findCurrentIndex < 0 || findCurrentIndex >= findMatches.length) return;
	var match = findMatches[findCurrentIndex];

	// Switch to raw mode if in WYSIWYG (find operates on raw text)
	if (editorMode === 'wysiwyg') {
		toggleEditorMode();
	}

	if (!skipFocus) {
		editorEl.focus();
	}
	editorEl.setSelectionRange(match.start, match.end);

	// Scroll the match into view
	var lineHeight = parseInt(getComputedStyle(editorEl).lineHeight) || 20;
	var textBefore = editorEl.value.substring(0, match.start);
	var lineNumber = textBefore.split('\n').length;
	var scrollTo = (lineNumber - 3) * lineHeight;
	editorEl.scrollTop = Math.max(0, scrollTo);
}

function findNext() {
	if (findMatches.length === 0) return;
	findCurrentIndex = (findCurrentIndex + 1) % findMatches.length;
	highlightFindMatch();
	updateFindCount();
}

function findPrev() {
	if (findMatches.length === 0) return;
	findCurrentIndex = (findCurrentIndex - 1 + findMatches.length) % findMatches.length;
	highlightFindMatch();
	updateFindCount();
}

function replaceOne() {
	if (findMatches.length === 0 || findCurrentIndex < 0) return;
	var replaceVal = document.getElementById('replace-input').value;
	var match = findMatches[findCurrentIndex];

	var before = editorEl.value.substring(0, match.start);
	var after = editorEl.value.substring(match.end);
	editorEl.value = before + replaceVal + after;

	handleEditorInput();
	saveTabState();

	// Re-run find to update matches
	runFind();
}

function replaceAll() {
	var query = document.getElementById('find-input').value;
	var replaceVal = document.getElementById('replace-input').value;
	if (!query) return;

	if (findCaseSensitive) {
		editorEl.value = editorEl.value.split(query).join(replaceVal);
	} else {
		// Case-insensitive replace all
		var regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
		editorEl.value = editorEl.value.replace(regex, replaceVal);
	}

	handleEditorInput();
	saveTabState();
	runFind();
}

// Keyboard event handler for find bar
document.getElementById('find-input').addEventListener('input', function() {
	runFind();
});

document.getElementById('find-input').addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		e.preventDefault();
		if (e.shiftKey) findPrev();
		else findNext();
	}
	if (e.key === 'Escape') {
		e.preventDefault();
		closeFindBar();
	}
});

document.getElementById('replace-input').addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		e.preventDefault();
		replaceOne();
	}
	if (e.key === 'Escape') {
		e.preventDefault();
		closeFindBar();
	}
});

// Initial Startup Configuration
window.addEventListener('DOMContentLoaded', function() {
	var activeTheme = document.documentElement.getAttribute('data-theme');
	updateThemeButtons(activeTheme);
	initMermaid();

	// Restore layout mode
	var savedLayout = null;
	try { savedLayout = localStorage.getItem('openmarkdown_layout_mode'); } catch(e) {}
	if (savedLayout && (savedLayout === 'split' || savedLayout === 'editor' || savedLayout === 'preview')) {
		setLayoutMode(savedLayout);
	}

	// Fetch config (no longer displayed but keeps API warm)
	fetch('/api/config').catch(function() {});

	// Load tab state (handles migration from old single-document localStorage)
	loadTabState();

	// Restore editor mode preference (default to WYSIWYG)
	var savedMode = null;
	try { savedMode = localStorage.getItem('openmarkdown_editor_mode'); } catch(e) {}
	if (savedMode === 'raw') {
		editorMode = 'wysiwyg'; // Set to opposite so toggle switches correctly
		toggleEditorMode();
	} else {
		// Default: WYSIWYG mode — render the visual view
		renderWysiwygView();
	}

	// Restore spell check preference
	var savedSpellCheck = null;
	try { savedSpellCheck = localStorage.getItem('openmarkdown_spellcheck'); } catch(e) {}
	if (savedSpellCheck === 'true') {
		toggleSpellCheck();
	}
});

