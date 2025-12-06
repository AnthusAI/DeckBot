document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatHistory = document.getElementById('chat-history');
    const messageInput = document.getElementById('message-input');
    const btnSend = document.getElementById('btn-send');
    const btnUploadImage = document.getElementById('btn-upload-image');
    const imageUploadInput = document.getElementById('image-upload-input');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreviews = document.getElementById('image-previews');
    const thinkingIndicator = document.getElementById('thinking-indicator');
    const welcomeScreen = document.getElementById('welcome-screen');
    const presentationCreate = document.getElementById('presentation-create');
    const btnCancelCreate = document.getElementById('btn-cancel-create');
    const viewToggleSelector = document.querySelector('.view-toggle-selector');
    
    // Menu items
    const menuNew = document.getElementById('menu-new');
    const menuOpen = document.getElementById('menu-open');
    const menuClose = document.getElementById('menu-close');
    const menuExport = document.getElementById('menu-export');
    const menuPresSettings = document.getElementById('menu-pres-settings');
    const menuSaveAs = document.getElementById('menu-save-as');
    const menuViewPreview = document.getElementById('menu-view-preview');
    const menuViewLayouts = document.getElementById('menu-view-layouts');
    const menuViewCode = document.getElementById('menu-view-code');
    
    // Sidebar elements
    const viewPreview = document.getElementById('view-preview');
    const previewFrame = document.getElementById('preview-frame');
    
    // Code view elements
    const viewCode = document.getElementById('view-code');
    const fileTree = document.getElementById('file-tree');
    const codeDisplay = document.getElementById('code-display');
    const currentFileName = document.getElementById('current-file-name');
    const saveFileBtn = document.getElementById('save-file-btn');
    const monacoContainer = document.getElementById('monaco-editor-container');
    
    // Monaco editor instance
    let monacoEditor = null;
    let currentFilePath = null;
    let currentFileType = null;
    let hasUnsavedChanges = false;
    const toggleBtnPreview = document.getElementById('toggle-btn-preview');
    const toggleBtnLayouts = document.getElementById('toggle-btn-layouts');
    const toggleBtnCode = document.getElementById('toggle-btn-code');
    const toggleBtnStyle = document.getElementById('toggle-btn-style');

    // Style view elements
    const viewStyle = document.getElementById('view-style');
    const menuViewStyle = document.getElementById('menu-view-style');
    const styleInstructions = document.getElementById('style-instructions');
    const styleImagePrompt = document.getElementById('style-image-prompt');
    const styleRefUpload = document.getElementById('style-ref-upload');
    const styleRefImagePreview = document.getElementById('style-ref-image-preview');
    const styleRefImg = document.getElementById('style-ref-img');
    const btnRemoveRefImage = document.getElementById('btn-remove-ref-image');
    const btnSaveStyle = document.getElementById('btn-save-style');
    
    // Style view tabs
    const styleTabs = document.querySelectorAll('.style-tab');
    const styleTabContents = document.querySelectorAll('.style-tab-content');
    const stylePresTitle = document.getElementById('style-pres-title');
    const stylePresDescription = document.getElementById('style-pres-description');
    const stylePresAspectRatio = document.getElementById('style-pres-aspect-ratio');
    const styleColorPrimary = document.getElementById('style-color-primary');
    const styleColorSecondary = document.getElementById('style-color-secondary');
    const styleColorAccent = document.getElementById('style-color-accent');
    const styleColorDanger = document.getElementById('style-color-danger');
    const styleColorMuted = document.getElementById('style-color-muted');
    const styleColorForeground = document.getElementById('style-color-foreground');
    const styleColorBackground = document.getElementById('style-color-background');
    const styleFontPrimary = document.getElementById('style-font-primary');
    const styleFontSecondary = document.getElementById('style-font-secondary');
    const fontPrimaryPreview = document.getElementById('font-primary-preview');
    const fontSecondaryPreview = document.getElementById('font-secondary-preview');
    const googleFontsList = document.getElementById('google-fonts-list');
    const btnSavePresentationSettings = document.getElementById('btn-save-presentation-settings');
    const presentationAgentPrompts = document.getElementById('presentation-agent-prompts');
    const imageAgentPrompts = document.getElementById('image-agent-prompts');
    
    // Preferences elements
    const preferencesModal = document.getElementById('preferences-modal');
    const prefTheme = document.getElementById('pref-theme');
    const btnSavePreferences = document.getElementById('btn-save-preferences');
    const btnCancelPreferences = document.getElementById('btn-cancel-preferences');
    const menuPreferences = document.getElementById('menu-preferences');
    const menuAbout = document.getElementById('menu-about');
    
    // Presentation Settings elements
    const presSettingsModal = document.getElementById('presentation-settings-modal');
    const presTitle = document.getElementById('pres-title');
    const presDescription = document.getElementById('pres-description');
    const presAspectRatio = document.getElementById('pres-aspect-ratio');
    const btnSavePresSettings = document.getElementById('btn-save-pres-settings');
    const btnCancelPresSettings = document.getElementById('btn-cancel-pres-settings');

    // Save As elements
    const saveAsModal = document.getElementById('save-as-modal');
    const saveAsForm = document.getElementById('save-as-form');
    const btnCancelSaveAs = document.getElementById('btn-cancel-save-as');
    
    // Theme buttons
    const themeBtns = document.querySelectorAll('.theme-btn');
    
    // Color theme options
    const colorThemeOptions = document.querySelectorAll('.color-theme-option');
    
    let currentPresName = "";
    let currentPresDescription = ""; // Track current presentation description
    let currentColorTheme = "miami"; // Default
    let selectedImageIndex = null; // Track which image candidate is selected
    let currentBatchSlug = null; // Track current image generation batch
    let uploadedImages = []; // Track uploaded images for messages

    // ===== State Management (localStorage) =====
    const AppState = {
        get presentation() {
            const value = localStorage.getItem('deckbot_current_presentation');
            console.log('[APPSTATE] GET presentation:', value);
            return value;
        },
        set presentation(name) {
            console.log('[APPSTATE] SET presentation:', name);
            if (name) {
                try {
                    localStorage.setItem('deckbot_current_presentation', name);
                    console.log('[APPSTATE] ✓ Saved presentation to localStorage');
                } catch (e) {
                    if (e.name === 'QuotaExceededError') {
                        console.error('localStorage full. Please clear browser data.');
                        alert('Storage full. Please clear browser data and reload.');
                    }
                    throw e;
                }
            } else {
                localStorage.removeItem('deckbot_current_presentation');
                console.log('[APPSTATE] ✓ Cleared presentation from localStorage');
            }
        },
        get slide() {
            const value = parseInt(localStorage.getItem('deckbot_current_slide') || '1');
            console.log('[APPSTATE] GET slide:', value);
            return value;
        },
        set slide(number) {
            console.log('[APPSTATE] SET slide:', number);
            try {
                localStorage.setItem('deckbot_current_slide', String(number));
                console.log('[APPSTATE] ✓ Saved slide to localStorage');
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    console.error('localStorage full. Please clear browser data.');
                    alert('Storage full. Please clear browser data and reload.');
                }
                throw e;
            }
        },
        clear() {
            console.log('[APPSTATE] CLEAR all localStorage');
            localStorage.removeItem('deckbot_current_presentation');
            localStorage.removeItem('deckbot_current_slide');
            console.log('[APPSTATE] ✓ Cleared all from localStorage');
        }
    };

    // ===== Theme Management =====
    function setTheme(theme, saveToBackend = true) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update button states
        themeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        
        // Update preferences dropdown if it exists
        if (prefTheme) {
            prefTheme.value = theme;
        }
        
        // Save to backend
        if (saveToBackend) {
            fetch('/api/preferences/theme', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({value: theme})
            }).catch(err => console.error('Error saving theme preference:', err));
        }
    }
    
    // ===== Color Theme Management =====
    function setColorTheme(colorTheme, saveToBackend = true) {
        currentColorTheme = colorTheme;
        document.documentElement.setAttribute('data-color-theme', colorTheme);
        
        // Update active state
        colorThemeOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === colorTheme);
        });
        
        // Save to backend
        if (saveToBackend) {
            fetch('/api/preferences/color_theme', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({value: colorTheme})
            }).catch(err => console.error('Error saving color theme preference:', err));
        }
    }
    
    // Load saved theme from backend
    function loadThemePreference() {
        fetch('/api/preferences/theme')
            .then(r => r.json())
            .then(data => {
                if (data.value) {
                    setTheme(data.value, false);
                } else {
                    // Default to system theme if no preference saved
                    setTheme('system', false);
                }
            })
            .catch(() => {
                // Fallback to system if backend fails
                setTheme('system', false);
            });
    }
    
    function loadColorThemePreference() {
        fetch('/api/preferences/color_theme')
            .then(r => r.json())
            .then(data => {
                if (data.value) {
                    setColorTheme(data.value, false);
                } else {
                    // Default to Miami theme if no preference saved
                    setColorTheme('miami', false);
                }
            })
            .catch(() => {
                // Fallback to Miami if backend fails
                setColorTheme('miami', false);
            });
    }
    
    loadThemePreference();
    loadColorThemePreference();
    
    // Theme button handlers
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setTheme(btn.dataset.theme);
        });
    });
    
    // Preferences theme selector
    if (prefTheme) {
        prefTheme.addEventListener('change', () => {
            setTheme(prefTheme.value, false); // Don't save yet, wait for Save button
        });
    }
    
    // Color theme option handlers
    colorThemeOptions.forEach(option => {
        option.addEventListener('click', () => {
            setColorTheme(option.dataset.theme, false); // Don't save yet, wait for Save button
        });
    });
    
    // Open preferences dialog
    function openPreferences() {
        // Load current preferences
        fetch('/api/preferences')
            .then(r => r.json())
            .then(prefs => {
                if (prefs.theme && prefTheme) {
                    prefTheme.value = prefs.theme;
                }
                if (preferencesModal) {
                    preferencesModal.classList.remove('hidden');
                    refreshIcons();
                }
            })
            .catch(err => {
                console.error('Error loading preferences:', err);
                // Show dialog anyway
                if (preferencesModal) {
                    preferencesModal.classList.remove('hidden');
                    refreshIcons();
                }
            });
    }
    
    // Helper to refresh Lucide icons
    function refreshIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // ===== Resizable Sidebar (Improved) =====
    const resizer = document.querySelector('.resizer');
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.container');
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    
    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startWidth = sidebar.offsetWidth;
        
        // Add visual feedback
        resizer.classList.add('resizing');
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        
        // Prevent text selection and iframe interaction during resize
        const iframe = document.getElementById('preview-frame');
        if (iframe) {
            iframe.style.pointerEvents = 'none';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        e.preventDefault();
        
        // Calculate new width based on mouse movement
        const dx = startX - e.clientX;
        const newWidth = startWidth + dx;
        
        // Apply constraints
        const minWidth = 300;
        const maxWidth = 1200;
        const containerWidth = container.offsetWidth;
        const maxAllowed = Math.min(maxWidth, containerWidth - 400); // Ensure chat has at least 400px
        
        if (newWidth >= minWidth && newWidth <= maxAllowed) {
            sidebar.style.width = newWidth + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // Re-enable iframe interaction
            const iframe = document.getElementById('preview-frame');
            if (iframe) {
                iframe.style.pointerEvents = '';
            }
        }
    });
    
    // Handle mouse leaving window during resize
    document.addEventListener('mouseleave', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            const iframe = document.getElementById('preview-frame');
            if (iframe) {
                iframe.style.pointerEvents = '';
            }
        }
    });
    
    // ===== Code View Sidebar Resizer =====
    const codeResizer = document.querySelector('.code-resizer');
    const codeSidebar = document.querySelector('.code-sidebar');
    const codeViewContainer = document.querySelector('.code-view-container');
    let isCodeResizing = false;
    let codeStartX = 0;
    let codeStartWidth = 0;
    
    if (codeResizer && codeSidebar && codeViewContainer) {
        codeResizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isCodeResizing = true;
            codeStartX = e.clientX;
            codeStartWidth = codeSidebar.offsetWidth;
            
            // Add visual feedback
            codeResizer.classList.add('resizing');
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isCodeResizing) return;
            
            e.preventDefault();
            
            // Calculate new width based on mouse movement
            // Dragging right (increasing clientX) should make sidebar wider
            const dx = e.clientX - codeStartX;
            const newWidth = codeStartWidth + dx;
            
            // Apply constraints
            const minWidth = 200;
            const maxWidth = 600;
            const containerWidth = codeViewContainer.offsetWidth;
            const maxAllowed = Math.min(maxWidth, containerWidth - 300); // Ensure content has at least 300px
            
            if (newWidth >= minWidth && newWidth <= maxAllowed) {
                codeSidebar.style.width = newWidth + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isCodeResizing) {
                isCodeResizing = false;
                codeResizer.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
        
        // Handle mouse leaving window during resize
        document.addEventListener('mouseleave', () => {
            if (isCodeResizing) {
                isCodeResizing = false;
                codeResizer.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    // ===== Welcome Screen Functions =====
    function showWelcomeScreen() {
        welcomeScreen.classList.remove('hidden');
        // Hide view toggle selector when no presentation is loaded
        if (viewToggleSelector) {
            viewToggleSelector.classList.remove('visible');
        }
        loadPresentationsGrid();
        loadTemplatesGrid();
        refreshIcons();
    }
    
    function hideWelcomeScreen() {
        welcomeScreen.classList.add('hidden');
        // Show view toggle selector when presentation is loaded
        if (viewToggleSelector) {
            viewToggleSelector.classList.add('visible');
        }
    }
    
    function loadPresentationsGrid() {
        const grid = document.getElementById('presentations-grid');
        grid.innerHTML = '<div class="slides-preview-loading"><div class="spinner"></div> Loading presentations...</div>';
        
        fetch('/api/presentations')
            .then(r => r.json())
            .then(presentations => {
                grid.innerHTML = '';
                
                // Add "Create New" card first
                const createCard = document.createElement('div');
                createCard.className = 'item-card create-new-card';
                createCard.innerHTML = `
                    <i data-lucide="plus-circle"></i>
                    <span>Create New Presentation</span>
                `;
                createCard.onclick = () => {
                    // Reset to show template selection dropdown
                    document.getElementById('new-pres-template').style.display = '';
                    document.getElementById('template-display').classList.add('hidden');
                    document.getElementById('new-pres-template').value = '';
                    presentationCreate.classList.remove('hidden');
                    loadTemplates();
                };
                grid.appendChild(createCard);
                
                // Add presentation cards
                presentations.forEach(pres => {
                    const card = createPresentationCard(pres);
                    grid.appendChild(card);
                });
                
                refreshIcons();
            })
            .catch(err => {
                console.error('Error loading presentations:', err);
                grid.innerHTML = '<p style="color: hsl(var(--muted-foreground));">Error loading presentations</p>';
            });
    }
    
    function loadTemplatesGrid() {
        const grid = document.getElementById('templates-grid');
        grid.innerHTML = '<div class="slides-preview-loading"><div class="spinner"></div> Loading templates...</div>';
        
        fetch('/api/templates')
            .then(r => r.json())
            .then(templates => {
                grid.innerHTML = '';
                
                if (templates.length === 0) {
                    grid.innerHTML = '<p style="color: hsl(var(--muted-foreground));">No templates available</p>';
                    return;
                }
                
                templates.forEach(template => {
                    const card = createTemplateCard(template);
                    grid.appendChild(card);
                });
                
                refreshIcons();
            })
            .catch(err => {
                console.error('Error loading templates:', err);
                grid.innerHTML = '<p style="color: hsl(var(--muted-foreground));">Error loading templates</p>';
            });
    }
    
    function createPresentationCard(pres) {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        // Format date
        let dateStr = 'Recently';
        if (pres.last_modified) {
            const date = new Date(pres.last_modified);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) dateStr = 'Today';
            else if (diffDays === 1) dateStr = 'Yesterday';
            else if (diffDays < 7) dateStr = `${diffDays} days ago`;
            else dateStr = date.toLocaleDateString();
        }
        
        card.innerHTML = `
            <div class="slides-preview">
                <div class="slides-scroll" data-name="${escapeHtml(pres.name)}">
                    <div class="slides-preview-loading">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
            <div class="item-info">
                <h3>${escapeHtml(pres.name)}</h3>
                <p class="item-description">${escapeHtml(pres.description || 'No description')}</p>
                <div class="item-meta">
                    <span><i data-lucide="file-text" style="width: 12px; height: 12px;"></i> ${pres.slide_count || 0} slides</span>
                    <span><i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${dateStr}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-delete">Delete</button>
                <button class="btn-open">Open</button>
            </div>
        `;
        
        // Load preview slides
        const scrollContainer = card.querySelector('.slides-scroll');
        loadSlidePreviewsForPresentation(pres.name, scrollContainer);
        
        // Open button
        card.querySelector('.btn-open').onclick = (e) => {
            e.stopPropagation();
            loadPresentation(pres.name);
        };
        
        // Delete button
        card.querySelector('.btn-delete').onclick = (e) => {
            e.stopPropagation();
            deletePresentation(pres.name);
        };
        
        // Click card to open
        card.onclick = () => {
            loadPresentation(pres.name);
        };
        
        return card;
    }
    
    function createTemplateCard(template) {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        card.innerHTML = `
            <div class="slides-preview">
                <div class="slides-scroll" data-name="${escapeHtml(template.name)}">
                    <div class="slides-preview-loading">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
            <div class="item-info">
                <h3>${escapeHtml(template.name)}</h3>
                <p class="item-description">${escapeHtml(template.description || 'No description')}</p>
                <div class="item-meta">
                    <span><i data-lucide="file-text" style="width: 12px; height: 12px;"></i> ${template.slide_count || 0} slides</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-delete">Delete</button>
                <button class="btn-open">Use</button>
            </div>
        `;
        
        // Load preview slides
        const scrollContainer = card.querySelector('.slides-scroll');
        loadSlidePreviewsForTemplate(template.name, scrollContainer);
        
        // Use template button
        card.querySelector('.btn-open').onclick = (e) => {
            e.stopPropagation();
            // Pre-fill template in create modal and show template display
            document.getElementById('new-pres-template').value = template.name;
            document.getElementById('new-pres-template-value').value = template.name; // Store in hidden input
            document.getElementById('selected-template-name').textContent = template.name;
            document.getElementById('new-pres-template').style.display = 'none';
            document.getElementById('template-display').classList.remove('hidden');
            presentationCreate.classList.remove('hidden');
            loadTemplates();
        };

        // Delete button logic
        card.querySelector('.btn-delete').onclick = (e) => {
            e.stopPropagation();
            deleteTemplate(template.name);
        };
        
        // Click card to use template
        card.onclick = () => {
            document.getElementById('new-pres-template').value = template.name;
            document.getElementById('new-pres-template-value').value = template.name; // Store in hidden input
            document.getElementById('selected-template-name').textContent = template.name;
            document.getElementById('new-pres-template').style.display = 'none';
            document.getElementById('template-display').classList.remove('hidden');
            presentationCreate.classList.remove('hidden');
            loadTemplates();
        };
        
        return card;
    }
    
    function loadSlidePreviewsForPresentation(name, container) {
        fetch(`/api/presentations/${encodeURIComponent(name)}/preview-slides`)
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    container.innerHTML = '<div class="slides-preview-loading">No preview available</div>';
                    return;
                }
                
                container.innerHTML = '';
                if (data.previews && data.previews.length > 0) {
                    data.previews.forEach(url => {
                        const img = document.createElement('img');
                        img.src = url;
                        img.alt = 'Slide preview';
                        container.appendChild(img);
                    });
                } else {
                    container.innerHTML = '<div class="slides-preview-loading">No slides</div>';
                }
            })
            .catch(err => {
                console.error('Error loading preview slides:', err);
                container.innerHTML = '<div class="slides-preview-loading">Preview unavailable</div>';
            });
    }
    
    function loadSlidePreviewsForTemplate(name, container) {
        console.log('loadSlidePreviewsForTemplate: Loading previews for template:', name);
        fetch(`/api/templates/${encodeURIComponent(name)}/preview-slides`)
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    container.innerHTML = '<div class="slides-preview-loading">No preview available</div>';
                    return;
                }
                
                console.log('loadSlidePreviewsForTemplate: Received previews:', data.previews);
                container.innerHTML = '';
                if (data.previews && data.previews.length > 0) {
                    // Append first slide
                    const firstImg = document.createElement('img');
                    firstImg.src = data.previews[0];
                    firstImg.alt = 'Slide preview';
                    container.appendChild(firstImg);
                    console.log('loadSlidePreviewsForTemplate: Appended first slide');
                    
                    // Check for style.png and insert it as second image
                    const styleImgUrl = `/api/templates/${encodeURIComponent(name)}/images/style.png`;
                    console.log('loadSlidePreviewsForTemplate: Checking for style.png at:', styleImgUrl);
                    
                    const styleImg = document.createElement('img');
                    styleImg.src = styleImgUrl;
                    styleImg.alt = 'Style reference';
                    styleImg.style.border = '2px solid hsl(var(--primary))';
                    styleImg.style.borderRadius = '4px';
                    styleImg.onerror = (e) => {
                        console.error('loadSlidePreviewsForTemplate: Failed to load style.png:', e);
                    };
                    
                    const testImg = new Image();
                    testImg.onload = () => {
                        console.log('loadSlidePreviewsForTemplate: style.png exists, inserting as second image');
                        // Insert style.png right after the first slide
                        container.appendChild(styleImg);
                        // Then append remaining slides
                        for (let i = 1; i < data.previews.length; i++) {
                            const img = document.createElement('img');
                            img.src = data.previews[i];
                            img.alt = 'Slide preview';
                            container.appendChild(img);
                        }
                    };
                    testImg.onerror = (e) => {
                        console.log('loadSlidePreviewsForTemplate: style.png does not exist or failed to load:', e);
                        // style.png doesn't exist, just append remaining slides
                        for (let i = 1; i < data.previews.length; i++) {
                            const img = document.createElement('img');
                            img.src = data.previews[i];
                            img.alt = 'Slide preview';
                            container.appendChild(img);
                        }
                    };
                    testImg.src = styleImgUrl;
                } else {
                    container.innerHTML = '<div class="slides-preview-loading">No slides</div>';
                }
            })
            .catch(err => {
                console.error('Error loading preview slides:', err);
                container.innerHTML = '<div class="slides-preview-loading">Preview unavailable</div>';
            });
    }
    
    // Welcome screen tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Update button states
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update content visibility
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector(`.tab-content[data-tab="${tab}"]`).classList.add('active');
            
            refreshIcons();
        });
    });

    // ===== Menu Handlers =====
    menuNew.addEventListener('click', () => {
        // Reset to show template selection dropdown
        document.getElementById('new-pres-template').style.display = '';
        document.getElementById('template-display').classList.add('hidden');
        document.getElementById('new-pres-template').value = '';
        presentationCreate.classList.remove('hidden');
        loadTemplates();
    });
    
    menuOpen.addEventListener('click', () => {
        showWelcomeScreen();
    });

    if (menuClose) {
        menuClose.addEventListener('click', () => {
            if (!confirm('Are you sure you want to close the current presentation?')) {
                return;
            }

            // Clear frontend state
            AppState.clear();

            // Reset UI state
            currentPresName = "";
            chatHistory.innerHTML = '';
            previewFrame.src = '';
            showWelcomeScreen();
        });
    }
    
    if (menuAbout) {
        menuAbout.addEventListener('click', () => {
            alert('DeckBot v1.0\n\nAn AI-powered presentation creation tool.\n\nBuilt with Marp, Google Gemini, and Nano Banana.');
        });
    }
    
    if (menuPreferences) {
        menuPreferences.addEventListener('click', () => {
            openPreferences();
        });
    }

    // Presentation Settings Handlers
    if (menuPresSettings) {
        menuPresSettings.addEventListener('click', () => {
            if (!currentPresName) {
                alert('Please open a presentation first.');
                return;
            }
            // Load current settings
            fetch('/api/presentation/settings')
                .then(r => r.json())
                .then(data => {
                    if (data.aspect_ratio) {
                        presAspectRatio.value = data.aspect_ratio;
                    }
                    presSettingsModal.classList.remove('hidden');
                });
        });
    }

    if (btnSavePresSettings) {
        btnSavePresSettings.addEventListener('click', () => {
            const title = presTitle.value;
            const description = presDescription.value;
            const aspectRatio = presAspectRatio.value;
            
            // Show loading state
            appendSystemMessage('Updating presentation settings and recompiling...');
            
            fetch('/api/presentation/settings', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    title: title,
                    description: description,
                    aspect_ratio: aspectRatio
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    alert('Error saving settings: ' + data.error);
                    appendSystemMessage('Failed to update settings.');
                } else {
                    presSettingsModal.classList.add('hidden');
                    appendSystemMessage('Settings updated. Reloading preview...');
                    // Force reload preview after a brief delay to ensure compilation finished
                    setTimeout(() => {
                        reloadPreview();
                    }, 500);
                }
            })
            .catch(err => {
                alert('Error: ' + err);
                appendSystemMessage('Error updating settings.');
            });
        });
    }

    if (btnCancelPresSettings) {
        btnCancelPresSettings.addEventListener('click', () => {
            presSettingsModal.classList.add('hidden');
        });
    }

    // Save As Handlers
    if (menuSaveAs) {
        menuSaveAs.addEventListener('click', () => {
            if (!currentPresName) {
                alert('Please open a presentation first.');
                return;
            }
            document.getElementById('save-as-name').value = currentPresName + " Copy";
            document.getElementById('save-as-description').value = currentPresDescription || "";
            saveAsModal.classList.remove('hidden');
        });
    }

    if (saveAsForm) {
        saveAsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = document.getElementById('save-as-name').value;
            const newDescription = document.getElementById('save-as-description').value;
            const copyImages = document.getElementById('save-as-copy-images').checked;
            
            fetch('/api/presentation/save-as', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: newName, description: newDescription, copy_images: copyImages})
            })
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                } else {
                    // Success - load the new presentation using folder_name (which may be auto-incremented)
                    saveAsModal.classList.add('hidden');
                    loadPresentation(data.folder_name || data.name);
                }
            })
            .catch(err => {
                alert('Error: ' + err);
            });
        });
    }

    if (btnCancelSaveAs) {
        btnCancelSaveAs.addEventListener('click', () => {
            saveAsModal.classList.add('hidden');
        });
    }
    
    // ===== View Menu Handlers =====
    
    function switchView(viewName) {
        const allViews = document.querySelectorAll('.sidebar-view');
        const allViewMenuItems = document.querySelectorAll('.dropdown-item.checkable');
        
        // Hide all views
        allViews.forEach(view => view.classList.remove('active'));
        
        // Uncheck all view menu items
        allViewMenuItems.forEach(item => item.classList.remove('active'));
        
        // Show the selected view
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        // Check the selected menu item
        const targetMenuItem = document.getElementById(`menu-view-${viewName}`);
        if (targetMenuItem) {
            targetMenuItem.classList.add('active');
        }
        
        // Update view toggle buttons in menu bar
        const allToggleBtns = document.querySelectorAll('.view-toggle-btn');
        allToggleBtns.forEach(btn => btn.classList.remove('active'));
        
        if (viewName === 'preview' && toggleBtnPreview) {
            toggleBtnPreview.classList.add('active');
        } else if (viewName === 'layouts' && toggleBtnLayouts) {
            toggleBtnLayouts.classList.add('active');
        } else if (viewName === 'code' && toggleBtnCode) {
            toggleBtnCode.classList.add('active');
        } else if (viewName === 'style' && toggleBtnStyle) {
            toggleBtnStyle.classList.add('active');
        }
        
        // Save preference
        fetch('/api/preferences/current_view', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({value: viewName})
        }).catch(err => console.error('Error saving view preference:', err));
        
        // If switching to layouts view, load layouts
        if (viewName === 'layouts') {
            loadLayoutsView();
        }
        
        // If switching to code view, load file tree
        if (viewName === 'code') {
            loadCodeView();
        }
        
        // If switching to preview view, reload the preview to show latest changes
        if (viewName === 'preview') {
            reloadPreview();
        }

        // If switching to style view, load style info
        if (viewName === 'style') {
            loadStyleView();
        }
    }
    
    function createSlideWithLayout(layoutName) {
        // Send message to agent to create a slide with the selected layout
        const message = `Create a new slide using the "${layoutName}" layout.`;
        messageInput.value = message;
        sendMessage();
        
        // Switch to preview view to see the result
        // (The preview will update when presentation_updated event is received)
        switchView('preview');
    }
    
    function loadLayoutsView() {
        fetch('/api/layouts')
            .then(r => r.json())
            .then(data => {
                const accordion = document.getElementById('layouts-accordion');
                if (!accordion) return;
                
                accordion.innerHTML = '';
                
                if (!data.layouts || data.layouts.length === 0) {
                    accordion.innerHTML = '<p>No layouts available</p>';
                    return;
                }
                
                data.layouts.forEach(layout => {
                    const layoutDiv = document.createElement('div');
                    layoutDiv.className = 'layout-item';
                    
                    let badges = '';
                    if (layout.image_friendly) {
                        badges += '<span class="layout-badge image-badge">✓ Image-friendly</span>';
                        if (layout.recommended_aspect_ratio) {
                            badges += `<span class="layout-badge aspect-badge">${escapeHtml(layout.recommended_aspect_ratio)}</span>`;
                        }
                    }
                    
                    layoutDiv.innerHTML = `
                        <h4>${layout.name}</h4>
                        ${layout.description ? `<p class="layout-description">${escapeHtml(layout.description)}</p>` : ''}
                        ${badges}
                        <img class="layout-preview-image" 
                             src="/api/layouts/${encodeURIComponent(layout.name)}/preview" 
                             alt="${escapeHtml(layout.name)} preview"
                             onerror="this.style.display='none'">
                        <div class="layout-actions">
                            <button class="btn-new-slide" data-layout="${escapeHtml(layout.name)}">
                                New Slide
                            </button>
                        </div>
                        <details>
                            <summary>View Code</summary>
                            <pre>${escapeHtml(layout.content)}</pre>
                        </details>
                    `;
                    
                    // Add click handler for New Slide button
                    const newSlideBtn = layoutDiv.querySelector('.btn-new-slide');
                    newSlideBtn.addEventListener('click', () => {
                        createSlideWithLayout(layout.name);
                    });
                    
                    accordion.appendChild(layoutDiv);
                });
            })
            .catch(err => console.error('Error loading layouts:', err));
    }
    
    // ===== Code View Functions =====
    
    function loadCodeView() {
        fetch('/api/presentation/files')
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    console.error('Error loading files:', data.error);
                    return;
                }
                renderFileTree(data.files);
                
                // Auto-open deck.marp.md if nothing is open
                const codeDisplay = document.getElementById('code-display');
                if (codeDisplay && (codeDisplay.innerHTML.trim() === '' || codeDisplay.querySelector('.code-empty-state'))) {
                    function findFileInTree(files, name) {
                        for (const file of files) {
                            if (file.name === name) return file;
                            if (file.children) {
                                const found = findFileInTree(file.children, name);
                                if (found) return found;
                            }
                        }
                        return null;
                    }
                    const mainDeckFile = findFileInTree(data.files, 'deck.marp.md');
                    if (mainDeckFile) {
                        loadFileContent(mainDeckFile.path, mainDeckFile.name, mainDeckFile.type);
                        // Also mark it active in the tree
                        setTimeout(() => {
                            const item = document.querySelector(`.tree-item[data-path="${mainDeckFile.path}"]`);
                            if (item) item.classList.add('active');
                        }, 100);
                    }
                }
            })
            .catch(err => console.error('Error loading file tree:', err));
    }
    
    // ===== Style View Functions =====
    function loadStyleView() {
        if (!currentPresName) {
            console.log('loadStyleView: No currentPresName, skipping');
            return;
        }
        
        console.log('loadStyleView: Loading style info for', currentPresName);
        
        // Load style info
        fetch(`/api/presentation/style`)
            .then(res => {
                if (!res.ok) {
                    console.error('loadStyleView: API response not OK:', res.status, res.statusText);
                    return res.json().then(data => {
                        throw new Error(data.error || `HTTP ${res.status}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('loadStyleView: Received data:', data);
                
                if (data.error) {
                    console.error('Error loading style info:', data.error);
                    return;
                }
                
                if (styleInstructions) {
                    styleInstructions.value = data.instructions || '';
                    console.log('loadStyleView: Set instructions to:', data.instructions || '(empty)');
                } else {
                    console.warn('loadStyleView: styleInstructions element not found');
                }
                
                if (styleImagePrompt) {
                    styleImagePrompt.value = (data.image_style && data.image_style.prompt) || '';
                    console.log('loadStyleView: Set image prompt to:', (data.image_style && data.image_style.prompt) || '(empty)');
                } else {
                    console.warn('loadStyleView: styleImagePrompt element not found');
                }
                
                // Handle reference image - use convention-based style.png
                if (styleRefImagePreview && styleRefImg) {
                    // Check if style.png exists (convention-based)
                    const styleImagePath = 'images/style.png';
                    const styleImageUrl = `/api/presentation/file-serve?path=${styleImagePath}`;
                    
                    // Try to load the image to see if it exists
                    const testImg = new Image();
                    testImg.onload = () => {
                        console.log('loadStyleView: style.png exists, displaying it');
                        styleRefImg.src = styleImageUrl;
                        styleRefImagePreview.style.display = 'block';
                    };
                    testImg.onerror = () => {
                        console.log('loadStyleView: style.png does not exist');
                        styleRefImagePreview.style.display = 'none';
                        styleRefImg.src = '';
                    };
                    testImg.src = styleImageUrl;
                } else {
                    console.warn('loadStyleView: styleRefImagePreview or styleRefImg elements not found');
                }
            })
            .catch(err => {
                console.error('Failed to load style info:', err);
            });
        
        // Load presentation settings
        fetch('/api/presentation/settings')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error('Error loading settings:', data.error);
                    return;
                }
                
                if (stylePresTitle) stylePresTitle.value = data.title || '';
                if (stylePresDescription) stylePresDescription.value = data.description || '';
                if (stylePresAspectRatio) stylePresAspectRatio.value = data.aspect_ratio || '4:3';
                
                // Load color settings
                const colors = data.color_settings || {};
                if (styleColorPrimary) styleColorPrimary.value = colors.primary || '#3B82F6';
                if (styleColorSecondary) styleColorSecondary.value = colors.secondary || '#8B5CF6';
                if (styleColorAccent) styleColorAccent.value = colors.accent || '#60A5FA';
                if (styleColorDanger) styleColorDanger.value = colors.danger || '#EF4444';
                if (styleColorMuted) styleColorMuted.value = colors.muted || '#9CA3AF';
                if (styleColorForeground) styleColorForeground.value = colors.foreground || '#2C4074';
                if (styleColorBackground) styleColorBackground.value = colors.background || '#EEE5D3';
                
                // Load font settings
                const fonts = data.font_settings || {};
                if (styleFontPrimary) {
                    styleFontPrimary.value = fonts.primary || 'Inter';
                    updateFontPreview('primary', styleFontPrimary.value);
                }
                if (styleFontSecondary) {
                    styleFontSecondary.value = fonts.secondary || 'Source Serif Pro';
                    updateFontPreview('secondary', styleFontSecondary.value);
                }
            })
            .catch(err => {
                console.error('Failed to load settings:', err);
            });
    }

    function saveStyleSettings() {
        if (!currentPresName) return;
        
        // Save style settings
        const formData = new FormData();
        if (styleInstructions) formData.append('instructions', styleInstructions.value);
        if (styleImagePrompt) formData.append('image_style.prompt', styleImagePrompt.value);
        
        if (styleRefUpload && styleRefUpload.files.length > 0) {
            formData.append('file', styleRefUpload.files[0]);
        }
        
        // Save presentation settings
        const settingsData = {
            title: stylePresTitle ? stylePresTitle.value : null,
            description: stylePresDescription ? stylePresDescription.value : null,
            aspect_ratio: stylePresAspectRatio ? stylePresAspectRatio.value : null,
            color_settings: {
                primary: styleColorPrimary ? styleColorPrimary.value : null,
                secondary: styleColorSecondary ? styleColorSecondary.value : null,
                accent: styleColorAccent ? styleColorAccent.value : null,
                danger: styleColorDanger ? styleColorDanger.value : null,
                muted: styleColorMuted ? styleColorMuted.value : null,
                foreground: styleColorForeground ? styleColorForeground.value : null,
                background: styleColorBackground ? styleColorBackground.value : null
            },
            font_settings: {
                primary: styleFontPrimary ? styleFontPrimary.value : null,
                secondary: styleFontSecondary ? styleFontSecondary.value : null
            }
        };
        
        // Disable button while saving
        if (btnSaveStyle) {
            btnSaveStyle.disabled = true;
            btnSaveStyle.textContent = 'Saving...';
        }
        
        // Save both style and settings
        Promise.all([
            fetch('/api/presentation/style', {
                method: 'POST',
                body: formData
            }),
            fetch('/api/presentation/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsData)
            })
        ])
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(results => {
            if (btnSaveStyle) {
                btnSaveStyle.disabled = false;
                btnSaveStyle.textContent = 'Save Changes';
            }
            
            const [styleResult, settingsResult] = results;
            
            if (styleResult.error) {
                alert('Error saving style: ' + styleResult.error);
                return;
            }
            
            if (settingsResult.error) {
                alert('Error saving settings: ' + settingsResult.error);
                return;
            }
            
            // Refresh view (especially for image preview)
            loadStyleView();
            
            // Reset file input
            if (styleRefUpload) styleRefUpload.value = '';
            
            console.log('Style and settings saved');
        })
        .catch(err => {
            if (btnSaveStyle) {
                btnSaveStyle.disabled = false;
                btnSaveStyle.textContent = 'Save Changes';
            }
            alert('Failed to save settings: ' + err);
        });
    }
    
    // Style tab switching
    if (styleTabs.length > 0) {
        styleTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update active tab
                styleTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                styleTabContents.forEach(content => {
                    content.classList.remove('active');
                    content.style.display = 'none';
                });
                
                const targetContent = document.getElementById(`style-tab-${tabName}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                    targetContent.style.display = 'block';
                    
                    // Load prompts when switching to agent tabs
                    if (tabName === 'presentation-agent') {
                        loadPresentationAgentPrompts();
                    } else if (tabName === 'image-agent') {
                        loadImageAgentPrompts();
                    }
                }
            });
        });
    }
    
    function loadPresentationAgentPrompts() {
        if (!currentPresName) return;
        
        // Fetch both prompts and current metadata for processing
        Promise.all([
            fetch('/api/presentation/prompts').then(r => r.json()),
            fetch('/api/presentation/settings').then(r => r.json()),
            fetch('/api/presentation/style').then(r => r.json())
        ])
        .then(([promptsData, settingsData, styleData]) => {
            if (promptsData.error) {
                presentationAgentPrompts.innerHTML = `<p style="color: hsl(var(--destructive));">Error: ${promptsData.error}</p>`;
                return;
            }
            
            const prompts = promptsData.presentation_agent;
            let html = `
                <div class="prompt-view-tabs" style="display: flex; border-bottom: 1px solid hsl(var(--border)); margin-bottom: 16px;">
                    <button class="prompt-view-tab active" data-view="structure">Structure</button>
                    <button class="prompt-view-tab" data-view="processed">Processed</button>
                </div>
                
                <div class="prompt-view-content">
                    <div class="prompt-view-structure active">
                        <div class="prompt-section">
                            <div class="prompt-section-title">System Prompt Structure</div>
                            <div class="prompt-section-desc">${prompts.description}</div>
            `;
            
            prompts.sections.forEach(section => {
                const isEditable = section.source.includes('metadata.json') || section.source.includes('dynamic');
                html += `
                    <div class="prompt-item">
                        <div class="prompt-item-label">${section.name}</div>
                        <div class="prompt-item-value readonly">${section.description}</div>
                        <div class="prompt-item-source">Source: ${section.source}</div>
                        ${isEditable ? '<button class="btn btn-sm btn-secondary edit-settings-btn">Edit Settings</button>' : ''}
                    </div>
                `;
            });
            
            html += `
                        <div class="prompt-item" style="margin-top: 16px;">
                            <div class="prompt-item-label">Note</div>
                            <div class="prompt-item-value readonly">${prompts.note}</div>
                        </div>
                    </div>
                </div>
                
                <div class="prompt-view-processed" style="display: none;">
                    <div class="prompt-section">
                        <div class="prompt-section-title">Full Processed Prompt</div>
                        <div class="prompt-section-desc">This is what gets sent to the model with current settings</div>
                        <div class="prompt-item">
                            <div class="prompt-item-label">System Prompt (Processed)</div>
                            <div class="prompt-item-value" style="max-height: 600px; overflow-y: auto; white-space: pre-wrap;">[Loading full prompt...]</div>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
            presentationAgentPrompts.innerHTML = html;
            
            // Add event handlers for edit buttons
            const editButtons = presentationAgentPrompts.querySelectorAll('.edit-settings-btn');
            editButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelector('.style-tab[data-tab="presentation"]').click();
                });
            });
            
            // Add tab switching for prompt views
            const promptViewTabs = presentationAgentPrompts.querySelectorAll('.prompt-view-tab');
            promptViewTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    promptViewTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    const view = tab.dataset.view;
                    const structureView = presentationAgentPrompts.querySelector('.prompt-view-structure');
                    const processedView = presentationAgentPrompts.querySelector('.prompt-view-processed');
                    
                    if (view === 'structure') {
                        structureView.style.display = 'block';
                        processedView.style.display = 'none';
                    } else {
                        structureView.style.display = 'none';
                        processedView.style.display = 'block';
                        // Load actual processed prompt
                        loadProcessedPresentationPrompt();
                    }
                });
            });
        })
        .catch(err => {
            presentationAgentPrompts.innerHTML = `<p style="color: hsl(var(--destructive));">Failed to load prompts: ${err}</p>`;
        });
    }
    
    function loadProcessedPresentationPrompt() {
        // Fetch the actual system prompt from the agent
        fetch('/api/presentation/agent-prompt')
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    return;
                }
                
                const promptValue = presentationAgentPrompts.querySelector('.prompt-view-processed .prompt-item-value');
                if (promptValue) {
                    promptValue.textContent = data.system_prompt || 'Not available';
                }
            })
            .catch(err => {
                console.error('Failed to load processed prompt:', err);
            });
    }
    
    function loadImageAgentPrompts() {
        if (!currentPresName) return;
        
        fetch('/api/presentation/prompts')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    imageAgentPrompts.innerHTML = `<p style="color: hsl(var(--destructive));">Error: ${data.error}</p>`;
                    return;
                }
                
                const prompts = data.image_agent;
                const scenarios = [
                    {key: 'generating', title: 'Fresh Image Generation', icon: 'image-plus'},
                    {key: 'remix_slide', title: 'Remix Slide', icon: 'layers'},
                    {key: 'remix_image', title: 'Remix Image', icon: 'refresh-cw'}
                ];
                
                let html = `
                    <div class="prompt-view-tabs" style="display: flex; border-bottom: 1px solid hsl(var(--border)); margin-bottom: 16px;">
                        <button class="prompt-view-tab active" data-view="code">Code</button>
                        <button class="prompt-view-tab" data-view="processed">Processed</button>
                    </div>
                    
                    <div class="prompt-view-content">
                        <div class="prompt-view-code active">
                `;
                
                // Code view: Show template structure with edit buttons
                scenarios.forEach(scenario => {
                    const promptData = prompts[scenario.key];
                    html += `
                        <div class="prompt-scenario">
                            <div class="prompt-scenario-title">
                                <i data-lucide="${scenario.icon}" style="width: 18px; height: 18px; margin-right: 8px;"></i>
                                ${scenario.title}
                            </div>
                            <div class="prompt-scenario-desc">${promptData.description}</div>
                            
                            <div class="prompt-section" style="margin-bottom: 16px;">
                                <div class="prompt-section-title">System Instructions</div>
                                <div class="prompt-section-desc">Template strings from PROMPT_TEMPLATES (nano_banana.py)</div>
                    `;
                    
                    Object.keys(promptData.system_instructions).forEach(key => {
                        const value = promptData.system_instructions[key];
                        if (value) {
                            const isDynamic = value.startsWith('{');
                            const isEditable = value.includes('metadata.json') || key.includes('style') || key.includes('opinion');
                            html += `
                                <div class="prompt-item">
                                    <div class="prompt-item-label">${key.replace(/_/g, ' ')}</div>
                                    <div class="prompt-item-value ${!isDynamic ? 'readonly' : ''}">${escapeHtml(value)}</div>
                                    ${isDynamic ? `<div class="prompt-item-source">Dynamic: ${value}</div>` : ''}
                                    ${isEditable ? '<button class="btn btn-sm btn-secondary edit-style-btn">Edit Style</button>' : ''}
                                </div>
                            `;
                        }
                    });
                    
                    html += `</div>
                            
                            <div class="prompt-section" style="margin-bottom: 16px;">
                                <div class="prompt-section-title">User Message</div>
                                <div class="prompt-section-desc">Built from user input + context</div>
                    `;
                    
                    Object.keys(promptData.user_message).forEach(key => {
                        const value = promptData.user_message[key];
                        if (value) {
                            const isDynamic = value.startsWith('{');
                            const isEditable = value.includes('metadata.json') || key.includes('style');
                            html += `
                                <div class="prompt-item">
                                    <div class="prompt-item-label">${key.replace(/_/g, ' ')}</div>
                                    <div class="prompt-item-value ${!isDynamic ? 'readonly' : ''}">${escapeHtml(value)}</div>
                                    ${isDynamic ? `<div class="prompt-item-source">Dynamic: ${value}</div>` : ''}
                                    ${isEditable ? '<button class="btn btn-sm btn-secondary edit-style-btn">Edit Style</button>' : ''}
                                </div>
                            `;
                        }
                    });
                    
                    html += `</div>
                            
                            <div class="prompt-section">
                                <div class="prompt-section-title">Contents Array Order</div>
                                <div class="prompt-section-desc">Order of items sent to the Gemini API</div>
                    `;
                    
                    promptData.contents_order.forEach((item, index) => {
                        html += `
                            <div class="prompt-item">
                                <div class="prompt-item-label">${index + 1}</div>
                                <div class="prompt-item-value readonly">${escapeHtml(item)}</div>
                            </div>
                        `;
                    });
                    
                    html += `</div></div>`;
                });
                
                html += `
                        </div>
                        
                        <div class="prompt-view-processed" style="display: none;">
                            <p style="font-size: 0.9em; opacity: 0.7; margin-bottom: 16px;">
                                The processed prompts show what would be sent to the model with your current settings.
                                Enter a test prompt to see how it would be constructed.
                            </p>
                            
                            <div class="form-group" style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: bold;">Test Prompt</label>
                                <input type="text" id="test-image-prompt" style="width: 100%; padding: 10px;" placeholder="E.g. a blue circle">
                            </div>
                            
                            <div id="processed-prompts-container">
                                <p style="opacity: 0.6;">Enter a test prompt above to see how it would be processed</p>
                            </div>
                        </div>
                    </div>
                `;
                
                imageAgentPrompts.innerHTML = html;
                refreshIcons();
                
                // Add event handlers for edit buttons
                const editStyleButtons = imageAgentPrompts.querySelectorAll('.edit-style-btn');
                editStyleButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelector('.style-tab[data-tab="style"]').click();
                    });
                });
                
                // Add event listener for test prompt
                const testPromptInput = document.getElementById('test-image-prompt');
                if (testPromptInput) {
                    testPromptInput.addEventListener('input', debounce(() => {
                        loadProcessedImagePrompts(testPromptInput.value);
                    }, 500));
                }
                
                // Add tab switching for prompt views
                const promptViewTabs = imageAgentPrompts.querySelectorAll('.prompt-view-tab');
                promptViewTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        promptViewTabs.forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        
                        const view = tab.dataset.view;
                        const codeView = imageAgentPrompts.querySelector('.prompt-view-code');
                        const processedView = imageAgentPrompts.querySelector('.prompt-view-processed');
                        
                        if (view === 'code') {
                            codeView.style.display = 'block';
                            processedView.style.display = 'none';
                        } else {
                            codeView.style.display = 'none';
                            processedView.style.display = 'block';
                        }
                    });
                });
            })
            .catch(err => {
                imageAgentPrompts.innerHTML = `<p style="color: hsl(var(--destructive));">Failed to load prompts: ${err}</p>`;
            });
    }
    
    function loadProcessedImagePrompts(testPrompt) {
        if (!testPrompt) {
            const container = document.getElementById('processed-prompts-container');
            if (container) {
                container.innerHTML = '<p style="opacity: 0.6;">Enter a test prompt above to see how it would be processed</p>';
            }
            return;
        }
        
        fetch(`/api/presentation/image-prompts?prompt=${encodeURIComponent(testPrompt)}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    return;
                }
                
                const container = document.getElementById('processed-prompts-container');
                if (!container) return;
                
                let html = '';
                Object.keys(data).forEach(scenarioKey => {
                    const scenario = data[scenarioKey];
                    html += `
                        <div class="prompt-scenario">
                            <div class="prompt-scenario-title">${scenarioKey === 'generating' ? 'Fresh Image Generation' : scenarioKey === 'remix_slide' ? 'Remix Slide' : 'Remix Image'}</div>
                            
                            <div class="prompt-section" style="margin-bottom: 16px;">
                                <div class="prompt-section-title">System Instructions (Processed)</div>
                                <div class="prompt-item">
                                    <div class="prompt-item-value" style="white-space: pre-wrap;">${escapeHtml(scenario.system_message)}</div>
                                </div>
                            </div>
                            
                            <div class="prompt-section">
                                <div class="prompt-section-title">User Message (Processed)</div>
                                <div class="prompt-item">
                                    <div class="prompt-item-value" style="white-space: pre-wrap;">${escapeHtml(scenario.user_message)}</div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                container.innerHTML = html;
            })
            .catch(err => {
                console.error('Failed to load processed prompts:', err);
            });
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Popular Google Fonts for autocomplete
    const popularGoogleFonts = [
        'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
        'Raleway', 'PT Sans', 'Merriweather', 'Ubuntu', 'Playfair Display', 'Nunito',
        'Roboto Condensed', 'Roboto Slab', 'Poppins', 'Noto Sans', 'Mukta', 'Rubik',
        'Work Sans', 'Fira Sans', 'Quicksand', 'Karla', 'Crimson Text', 'Libre Baskerville',
        'Source Serif Pro', 'Inconsolata', 'Archivo', 'Bebas Neue', 'Oxygen', 'PT Serif',
        'Heebo', 'Bitter', 'Cabin', 'Abril Fatface', 'Dancing Script', 'Pacifico',
        'Lobster', 'Righteous', 'Comfortaa', 'Permanent Marker', 'Anton', 'Fjalla One',
        'Shadows Into Light', 'Arvo', 'Josefin Sans', 'DM Sans', 'Barlow', 'Manrope',
        'Space Grotesk', 'Red Hat Display', 'Plus Jakarta Sans', 'Sora', 'Outfit'
    ];
    
    // Populate font datalist
    function populateFontList() {
        if (!googleFontsList) return;
        
        popularGoogleFonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            googleFontsList.appendChild(option);
        });
    }
    
    // Update font preview
    function updateFontPreview(type, fontName) {
        if (!fontName || fontName.trim() === '') {
            if (type === 'primary' && fontPrimaryPreview) {
                fontPrimaryPreview.style.display = 'none';
            } else if (type === 'secondary' && fontSecondaryPreview) {
                fontSecondaryPreview.style.display = 'none';
            }
            return;
        }
        
        const preview = type === 'primary' ? fontPrimaryPreview : fontSecondaryPreview;
        if (!preview) return;
        
        // Load the font from Google Fonts
        const fontFamily = fontName.trim();
        const linkId = `google-font-preview-${type}`;
        
        // Remove old link if exists
        const oldLink = document.getElementById(linkId);
        if (oldLink) {
            oldLink.remove();
        }
        
        // Add new font link
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`;
        document.head.appendChild(link);
        
        // Update preview
        preview.style.fontFamily = `'${fontFamily}', sans-serif`;
        preview.style.display = 'block';
    }
    
    // Initialize font list on load
    populateFontList();
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderFileTree(files) {
        if (!fileTree) return;
        
        fileTree.innerHTML = '';
        
        // Sort files by mtime if available (reverse chronological)
        function sortByMtime(items) {
            return items.sort((a, b) => {
                const aTime = (a.mtime ? new Date(a.mtime).getTime() : 0) || 0;
                const bTime = (b.mtime ? new Date(b.mtime).getTime() : 0) || 0;
                // If both have same time or both are 0, maintain original order
                if (aTime === bTime) return 0;
                return bTime - aTime; // Most recent first
            });
        }
        
        // Sort top-level files
        const sortedFiles = sortByMtime([...files]);
        
        sortedFiles.forEach(file => {
            const item = createFileTreeItem(file, 0);
            fileTree.appendChild(item);
        });
        
        // Re-initialize Lucide icons
        lucide.createIcons();
    }
    
    function createFileTreeItem(file, level = 0) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'tree-item-wrapper';
        
        if (file.type === 'folder') {
            // Folder item - shadcn style
            const folderItem = document.createElement('div');
            folderItem.className = 'tree-item folder-item';
            folderItem.dataset.path = file.path;
            folderItem.dataset.type = 'folder';
            
            // Sort children by mtime
            const sortedChildren = file.children ? file.children.sort((a, b) => {
                const aTime = (a.mtime ? new Date(a.mtime).getTime() : 0) || 0;
                const bTime = (b.mtime ? new Date(b.mtime).getTime() : 0) || 0;
                if (aTime === bTime) return 0;
                return bTime - aTime;
            }) : [];
            
            const hasChildren = sortedChildren.length > 0;
            
            folderItem.innerHTML = `
                <div class="tree-item-content">
                    <i class="tree-chevron" data-lucide="chevron-right"></i>
                    <i class="tree-icon" data-lucide="folder"></i>
                    <span class="tree-label">${escapeHtml(file.name)}</span>
                </div>
            `;
            
            itemDiv.appendChild(folderItem);
            
            // Children container
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'tree-children';
            childrenDiv.style.display = 'none';
            
            if (hasChildren) {
                sortedChildren.forEach(child => {
                    const childItem = createFileTreeItem(child, level + 1);
                    childrenDiv.appendChild(childItem);
                });
            }
            
            itemDiv.appendChild(childrenDiv);
            
            // Toggle expand/collapse
            folderItem.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = childrenDiv.style.display !== 'none';
                
                if (isExpanded) {
                    childrenDiv.style.display = 'none';
                    folderItem.classList.remove('expanded');
                    const chevron = folderItem.querySelector('.tree-chevron');
                    chevron.setAttribute('data-lucide', 'chevron-right');
                } else {
                    childrenDiv.style.display = 'block';
                    folderItem.classList.add('expanded');
                    const chevron = folderItem.querySelector('.tree-chevron');
                    chevron.setAttribute('data-lucide', 'chevron-down');
                }
                lucide.createIcons();
            });
        } else {
            // File item - shadcn style
            const fileItem = document.createElement('div');
            fileItem.className = 'tree-item file-item';
            fileItem.dataset.path = file.path;
            fileItem.dataset.type = file.type;
            
            // Choose icon based on file type
            let iconName = 'file';
            if (file.type === 'image') {
                iconName = 'image';
            } else if (file.type === 'markdown') {
                iconName = 'file-text';
            } else if (file.type === 'json') {
                iconName = 'braces';
            } else if (file.type === 'code') {
                iconName = 'file-code';
            }
            
            fileItem.innerHTML = `
                <div class="tree-item-content">
                    <i class="tree-icon" data-lucide="${iconName}"></i>
                    <span class="tree-label">${escapeHtml(file.name)}</span>
                </div>
            `;
            
            fileItem.addEventListener('click', (e) => {
                e.stopPropagation();
                loadFileContent(file.path, file.name, file.type);
                
                // Update active state
                document.querySelectorAll('.tree-item').forEach(item => {
                    item.classList.remove('active');
                });
                fileItem.classList.add('active');
            });
            
            itemDiv.appendChild(fileItem);
        }
        
        return itemDiv;
    }
    
    function loadFileContent(path, filename, fileType) {
        if (!currentFileName || !codeDisplay || !monacoContainer) return;
        
        // Check for unsaved changes
        if (hasUnsavedChanges && monacoEditor) {
            if (!confirm('You have unsaved changes. Are you sure you want to switch files?')) {
                return;
            }
        }
        
        currentFilePath = path;
        currentFileType = fileType;
        currentFileName.textContent = filename;
        codeDisplay.innerHTML = '<div class="code-empty-state">Loading...</div>';
        monacoContainer.style.display = 'none';
        if (saveFileBtn) saveFileBtn.style.display = 'none';
        
        // Dispose existing Monaco editor
        if (monacoEditor) {
            monacoEditor.dispose();
            monacoEditor = null;
        }
        
        fetch(`/api/presentation/file-content?path=${encodeURIComponent(path)}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    codeDisplay.innerHTML = `<div class="code-empty-state">Error: ${escapeHtml(data.error)}</div>`;
                    return;
                }
                
                if (data.type === 'image') {
                    // Display image
                    codeDisplay.style.display = 'block';
                    monacoContainer.style.display = 'none';
                    codeDisplay.innerHTML = `<img src="${data.url}" alt="${escapeHtml(filename)}" style="max-width: 100%; height: auto;" />`;
                    if (saveFileBtn) saveFileBtn.style.display = 'none';
                } else if (data.type === 'text') {
                    // Use Monaco editor for text files
                    codeDisplay.style.display = 'none';
                    monacoContainer.style.display = 'block';
                    if (saveFileBtn) saveFileBtn.style.display = 'flex';
                    
                    // Initialize Monaco editor
                    initializeMonacoEditor(data.content, data.language, path);
                } else if (data.type === 'binary') {
                    codeDisplay.style.display = 'block';
                    monacoContainer.style.display = 'none';
                    codeDisplay.innerHTML = `<div class="binary-message">${escapeHtml(data.message)}</div>`;
                    if (saveFileBtn) saveFileBtn.style.display = 'none';
                }
            })
            .catch(err => {
                console.error('Error loading file content:', err);
                codeDisplay.style.display = 'block';
                monacoContainer.style.display = 'none';
                codeDisplay.innerHTML = `<div class="code-empty-state">Error loading file</div>`;
                if (saveFileBtn) saveFileBtn.style.display = 'none';
            });
    }
    
    function initializeMonacoEditor(content, language, filePath) {
        // Check if Monaco is already loaded
        if (typeof monaco !== 'undefined' && monaco.editor) {
            createMonacoEditor(content, language, filePath);
            return;
        }
        
        // Load Monaco editor using the loader
        if (typeof require !== 'undefined') {
            require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
            require(['vs/editor/editor.main'], function () {
                createMonacoEditor(content, language, filePath);
            });
        } else {
            // Fallback: wait a bit for loader to initialize
            setTimeout(() => {
                if (typeof require !== 'undefined') {
                    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
                    require(['vs/editor/editor.main'], function () {
                        createMonacoEditor(content, language, filePath);
                    });
                } else {
                    codeDisplay.style.display = 'block';
                    monacoContainer.style.display = 'none';
                    codeDisplay.innerHTML = '<div class="code-empty-state">Error: Monaco editor failed to load</div>';
                }
            }, 100);
        }
    }
    
    function createMonacoEditor(content, language, filePath) {
        // Determine Monaco language from file extension
        const ext = filePath.split('.').pop().toLowerCase();
        let monacoLanguage = 'plaintext';
        const langMap = {
            'md': 'markdown',
            'markdown': 'markdown',
            'json': 'json',
            'html': 'html',
            'css': 'css',
            'js': 'javascript',
            'py': 'python',
            'yaml': 'yaml',
            'yml': 'yaml'
        };
        if (langMap[ext]) {
            monacoLanguage = langMap[ext];
        } else if (language && language !== 'text') {
            monacoLanguage = language;
        }
        
        // Determine theme based on current theme
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const theme = isDark ? 'vs-dark' : 'vs';
        
        // Create editor
        monacoEditor = monaco.editor.create(monacoContainer, {
            value: content,
            language: monacoLanguage,
            theme: theme,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontSize: 14,
            wordWrap: 'on'
        });
        
        hasUnsavedChanges = false;
        
        // Track changes
        monacoEditor.onDidChangeModelContent(() => {
            hasUnsavedChanges = true;
            if (saveFileBtn) {
                saveFileBtn.classList.add('has-changes');
            }
        });
    }
    
    function saveFile() {
        if (!monacoEditor || !currentFilePath) return;
        
        const content = monacoEditor.getValue();
        if (!saveFileBtn) return;
        
        // Disable save button and show loading
        saveFileBtn.disabled = true;
        const originalText = saveFileBtn.innerHTML;
        saveFileBtn.innerHTML = '<i data-lucide="loader-2" style="width: 16px; height: 16px;"></i> Saving...';
        lucide.createIcons();
        
        fetch('/api/presentation/file-save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: currentFilePath, content: content })
        })
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                alert(`Error saving file: ${data.error}`);
                saveFileBtn.disabled = false;
                saveFileBtn.innerHTML = originalText;
                lucide.createIcons();
                return;
            }
            
            hasUnsavedChanges = false;
            saveFileBtn.classList.remove('has-changes');
            
            // Show compile status
            if (data.compile) {
                if (data.compile.success) {
                    saveFileBtn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px;"></i> Saved & Compiled';
                    setTimeout(() => {
                        saveFileBtn.innerHTML = originalText;
                        lucide.createIcons();
                    }, 2000);
                } else {
                    alert(`File saved but compilation failed:\n${data.compile.message}`);
                    saveFileBtn.innerHTML = originalText;
                }
            } else {
                saveFileBtn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px;"></i> Saved';
                setTimeout(() => {
                    saveFileBtn.innerHTML = originalText;
                    lucide.createIcons();
                }, 2000);
            }
            
            saveFileBtn.disabled = false;
            lucide.createIcons();
        })
        .catch(err => {
            console.error('Error saving file:', err);
            alert(`Error saving file: ${err.message}`);
            saveFileBtn.disabled = false;
            saveFileBtn.innerHTML = originalText;
            lucide.createIcons();
        });
    }
    
    // Save button event listener
    if (saveFileBtn) {
        saveFileBtn.addEventListener('click', saveFile);
    }
    
    if (menuViewPreview) {
        menuViewPreview.addEventListener('click', () => switchView('preview'));
    }
    
    if (menuViewLayouts) {
        menuViewLayouts.addEventListener('click', () => switchView('layouts'));
    }
    
    if (menuViewCode) {
        menuViewCode.addEventListener('click', () => switchView('code'));
    }
    
    if (toggleBtnPreview) {
        toggleBtnPreview.addEventListener('click', () => switchView('preview'));
    }
    
    if (toggleBtnLayouts) {
        toggleBtnLayouts.addEventListener('click', () => switchView('layouts'));
    }
    
    if (toggleBtnCode) {
        toggleBtnCode.addEventListener('click', () => switchView('code'));
    }
    if (toggleBtnStyle) {
        toggleBtnStyle.addEventListener('click', () => switchView('style'));
    }
    if (menuViewStyle) {
        menuViewStyle.addEventListener('click', () => switchView('style'));
    }
    if (btnSaveStyle) {
        btnSaveStyle.addEventListener('click', saveStyleSettings);
    }
    
    if (btnSavePresentationSettings) {
        btnSavePresentationSettings.addEventListener('click', saveStyleSettings);
    }
    
    // Font preview handlers
    if (styleFontPrimary) {
        styleFontPrimary.addEventListener('input', debounce(() => {
            updateFontPreview('primary', styleFontPrimary.value);
        }, 300));
        
        styleFontPrimary.addEventListener('change', () => {
            updateFontPreview('primary', styleFontPrimary.value);
        });
    }
    
    if (styleFontSecondary) {
        styleFontSecondary.addEventListener('input', debounce(() => {
            updateFontPreview('secondary', styleFontSecondary.value);
        }, 300));
        
        styleFontSecondary.addEventListener('change', () => {
            updateFontPreview('secondary', styleFontSecondary.value);
        });
    }
    
    if (btnRemoveRefImage) {
        btnRemoveRefImage.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any form submit
            if (confirm('Remove style reference image?')) {
                fetch('/api/presentation/style', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ delete_reference: true, presentation_name: currentPresName })
                })
                .then(res => res.json())
                .then(data => {
                     loadStyleView();
                });
            }
        });
    }
    
    // Always default to preview view
    // (Saved preferences are not used - preview is the default for better UX)
    switchView('preview');
    
    if (btnSavePreferences) {
        btnSavePreferences.addEventListener('click', () => {
            // Save both theme and color theme
            const promises = [];
            
            if (prefTheme) {
                promises.push(
                    fetch('/api/preferences/theme', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({value: prefTheme.value})
                    })
                );
            }
            
            promises.push(
                fetch('/api/preferences/color_theme', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({value: currentColorTheme})
                })
            );
            
            Promise.all(promises)
                .then(() => {
                    preferencesModal.classList.add('hidden');
                })
                .catch(err => {
                    console.error('Error saving preferences:', err);
                    preferencesModal.classList.add('hidden');
                });
        });
    }
    
    if (btnCancelPreferences) {
        btnCancelPreferences.addEventListener('click', () => {
            // Reload preferences to undo any unsaved changes
            loadThemePreference();
            loadColorThemePreference();
            preferencesModal.classList.add('hidden');
        });
    }
    
    if (menuExport) {
        menuExport.addEventListener('click', () => {
            if (!currentPresName) {
                alert('Please open a presentation first.');
                return;
            }
            // Call export endpoint
            appendSystemMessage('Starting PDF export...');
            fetch('/api/presentation/export-pdf', {
                method: 'POST'
            })
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    alert('Error exporting: ' + data.error);
                    appendSystemMessage('Error exporting PDF.');
                } else {
                    alert(data.message);
                    appendSystemMessage('PDF export successful.');
                }
            })
            .catch(err => {
                alert('Error: ' + err);
            });
        });
    }
    
    // Mac-style keyboard shortcut: Cmd+,
    document.addEventListener('keydown', (e) => {
        // Preferences: Cmd/Ctrl + ,
        if ((e.metaKey || e.ctrlKey) && e.key === ',') {
            e.preventDefault();
            openPreferences();
        }
        
        // View shortcuts: Cmd/Ctrl + 1/2/3
        if ((e.metaKey || e.ctrlKey) && e.key === '1') {
            e.preventDefault();
            switchView('preview');
        }
        if ((e.metaKey || e.ctrlKey) && e.key === '2') {
            e.preventDefault();
            switchView('layouts');
        }
        if ((e.metaKey || e.ctrlKey) && e.key === '3') {
            e.preventDefault();
            switchView('code');
        }
    });
    
    if (btnCancelCreate) {
        btnCancelCreate.addEventListener('click', () => {
            presentationCreate.classList.add('hidden');
            // Only show welcome screen if no presentation is loaded
            if (!currentPresName) {
                showWelcomeScreen();
            }
        });
    }

    // Sidebar always shows preview now (no view switching needed)

    function reloadPreview(slideNumber) {
        console.log('[PREVIEW] reloadPreview called with slide:', slideNumber);
        let url = `/api/presentation/preview?t=${new Date().getTime()}`;
        if (slideNumber) {
            url += `#${slideNumber}`;
            AppState.slide = slideNumber; // Store in localStorage
            console.log('[PREVIEW] Updated AppState.slide to:', slideNumber);
        }
        previewFrame.src = url;
    }

    // Monitor iframe hash changes to track manual slide navigation
    function monitorIframeSlideChanges() {
        if (!previewFrame) return;

        // Listen to iframe load events
        previewFrame.addEventListener('load', () => {
            try {
                const iframeWindow = previewFrame.contentWindow;
                if (iframeWindow) {
                    // Monitor hash changes within the iframe
                    let lastHash = iframeWindow.location.hash;
                    const checkHash = () => {
                        try {
                            const currentHash = iframeWindow.location.hash;
                            if (currentHash !== lastHash && currentHash) {
                                lastHash = currentHash;
                                // Extract slide number from hash (e.g., "#5" -> 5)
                                const slideNum = parseInt(currentHash.substring(1));
                                if (!isNaN(slideNum)) {
                                    AppState.slide = slideNum;
                                }
                            }
                        } catch (e) {
                            // Cross-origin or access denied - expected in some cases
                        }
                        requestAnimationFrame(checkHash);
                    };
                    checkHash();
                }
            } catch (e) {
                // Cross-origin access denied - expected behavior
            }
        });
    }

    // Start monitoring iframe navigation
    monitorIframeSlideChanges();

    // ===== Template Loading =====
    function loadTemplates() {
        fetch('/api/templates')
            .then(r => r.json())
            .then(templates => {
                const select = document.getElementById('new-pres-template');
                select.innerHTML = '<option value="">No template</option>';
                templates.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.name;
                    option.textContent = t.name;
                    select.appendChild(option);
                });
            });
    }

    // ===== Presentation Delete =====

    function deletePresentation(name) {
        if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis cannot be undone.`)) {
            return;
        }

        fetch('/api/presentations/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name})
        })
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                // Reload the presentations grid
                loadPresentationsGrid();
            }
        })
        .catch(err => {
            alert('Error deleting presentation: ' + err);
        });
    }

    function deleteTemplate(name) {
        if (!confirm(`Are you sure you want to delete template "${name}"?\n\nThis cannot be undone.`)) {
            return;
        }

        fetch('/api/templates/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name})
        })
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                // Reload the templates grid
                loadTemplatesGrid();
            }
        })
        .catch(err => {
            alert('Error deleting template: ' + err);
        });
    }

    function handleRichMessage(msg) {
        /**
         * Handle rich message types from chat history.
         * These messages include additional metadata for UI reconstruction.
         */
        const messageType = msg.message_type;
        const data = msg.data;
        
        switch (messageType) {
            case 'image_request_details':
                // Create image request message with details
                const requestDiv = document.createElement('div');
                requestDiv.className = 'message system';
                requestDiv.dataset.batchSlug = data.batch_slug;
                
                const requestAvatar = document.createElement('div');
                requestAvatar.className = 'message-avatar';
                requestAvatar.innerHTML = '<i data-lucide="image" style="width: 16px; height: 16px;"></i>';
                
                const requestContent = document.createElement('div');
                requestContent.className = 'message-content';
                requestContent.innerHTML = `<p><strong>Image:</strong> ${escapeHtml(data.user_message)}</p>`;
                
                requestDiv.appendChild(requestAvatar);
                requestDiv.appendChild(requestContent);
                chatHistory.appendChild(requestDiv);
                
                // Add request details toggle
                addDetailsToggleToMessage(requestDiv, data, 'image');
                refreshIcons();
                break;
                
            case 'image_candidate':
                // Create image candidate message
                appendImageMessage(data.image_path, data.index, data.batch_slug);
                break;
                
            case 'image_selection':
                // Mark the selected image
                const images = chatHistory.querySelectorAll(
                    `.message[data-batch-slug="${data.batch_slug}"] .message-image[data-index="${data.index}"]`
                );
                images.forEach(img => {
                    img.classList.add('selected');
                });
                break;
                
            case 'agent_request_details':
                // Create user message with details attached
                const userMsg = appendMessage('user', data.user_message);
                // Find the just-created message and add details
                const messages = chatHistory.querySelectorAll('.message.user');
                if (messages.length > 0) {
                    const lastUserMessage = messages[messages.length - 1];
                    addDetailsToggleToMessage(lastUserMessage, data, 'agent');
                }
                break;
                
            case 'tool_image':
                // Display tool-generated image
                const toolImagePath = data.image_path;
                const toolImageUrl = `/api/presentation/file-serve?path=${encodeURIComponent(toolImagePath)}`;
                
                const toolImageMsgDiv = document.createElement('div');
                toolImageMsgDiv.className = 'message system tool-message';
                
                const toolImageAvatar = document.createElement('div');
                toolImageAvatar.className = 'message-avatar';
                toolImageAvatar.innerHTML = '<i data-lucide="eye" style="width: 16px; height: 16px;"></i>';
                
                const toolImageContent = document.createElement('div');
                toolImageContent.className = 'message-content';
                
                const toolImageName = data.tool || 'tool';
                const toolImageLabel = toolImageName === 'inspect_slide' ? `Inspected slide ${data.slide_number || ''}` : `Tool: ${toolImageName}`;
                
                toolImageContent.innerHTML = `<p><strong>${escapeHtml(toolImageLabel)}</strong></p>`;
                
                const toolImg = document.createElement('img');
                toolImg.src = toolImageUrl;
                toolImg.style.maxWidth = '100%';
                toolImg.style.height = 'auto';
                toolImg.style.borderRadius = '6px';
                toolImg.style.marginTop = '8px';
                toolImg.style.cursor = 'pointer';
                toolImg.onclick = () => {
                    window.open(toolImageUrl, '_blank');
                };
                toolImageContent.appendChild(toolImg);
                
                toolImageMsgDiv.appendChild(toolImageAvatar);
                toolImageMsgDiv.appendChild(toolImageContent);
                chatHistory.appendChild(toolImageMsgDiv);
                chatHistory.scrollTop = chatHistory.scrollHeight;
                refreshIcons();
                break;
                
            default:
                console.warn('Unknown message type:', messageType);
        }
    }

    function appendToolUsageMessage(toolName, args, result) {
        /**
         * Create a tool usage message with collapsible details for specific tools.
         * For replace_text, shows filename and collapsible old/new text diff.
         */
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system has-collapsible-content tool-message';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i data-lucide="wrench" style="width: 16px; height: 16px;"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Main message text
        const mainText = document.createElement('p');
        mainText.className = 'mb-2';
        mainText.textContent = `Used tool ${toolName}`;
        if (args && args.filename) {
            mainText.textContent += `: ${args.filename}`;
        }
        messageContent.appendChild(mainText);
        
        // Tool-specific formatting
        if (toolName === "replace_text" && args) {
            const detailsId = 'tool-details-' + Math.random().toString(36).substr(2, 9);
            
            // Create container for HR, toggle, and content (allows flexbox reordering)
            const toolContainer = document.createElement('div');
            toolContainer.className = 'tool-details-container';
            
            // Create HR (represents collapsed state)
            const hr = document.createElement('hr');
            hr.className = 'tool-details-hr';
            
            // Create toggle button (centered, just caret) - starts at top
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'tool-details-toggle';
            toggleBtn.innerHTML = '<i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>';
            
            // Create details section (content)
            const detailsSection = document.createElement('div');
            detailsSection.className = 'tool-details';
            detailsSection.id = detailsId;
            
            if (args.old_text !== undefined && args.new_text !== undefined) {
                // Old Text section
                const oldHeader = document.createElement('div');
                oldHeader.className = 'tool-detail-header';
                oldHeader.textContent = 'Old Text';
                detailsSection.appendChild(oldHeader);
                
                const oldTextDiv = document.createElement('div');
                oldTextDiv.className = 'tool-detail-content';
                oldTextDiv.textContent = args.old_text;
                detailsSection.appendChild(oldTextDiv);
                
                // New Text section
                const newHeader = document.createElement('div');
                newHeader.className = 'tool-detail-header';
                newHeader.textContent = 'New Text';
                detailsSection.appendChild(newHeader);
                
                const newTextDiv = document.createElement('div');
                newTextDiv.className = 'tool-detail-content';
                newTextDiv.textContent = args.new_text;
                detailsSection.appendChild(newTextDiv);
            }
            
            // Toggle functionality
            let isExpanded = false;
            toggleBtn.onclick = () => {
                isExpanded = !isExpanded;
                
                if (isExpanded) {
                    // Expand: hide HR, show content, move caret to bottom
                    hr.classList.add('hidden');
                    detailsSection.classList.add('expanded');
                    toggleBtn.classList.add('expanded');
                    // Update icon to chevron-up after animation completes
                    setTimeout(() => {
                        if (isExpanded) {
                            toggleBtn.innerHTML = `<i data-lucide="chevron-up" style="width: 14px; height: 14px;"></i>`;
                            refreshIcons();
                        }
                    }, 300); // Match animation duration
                } else {
                    // Collapse: show HR, hide content, move caret to top
                    detailsSection.classList.remove('expanded');
                    toggleBtn.classList.remove('expanded');
                    // Update icon to chevron-down after animation completes
                    setTimeout(() => {
                        if (!isExpanded) {
                            toggleBtn.innerHTML = `<i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>`;
                            refreshIcons();
                            hr.classList.remove('hidden');
                        }
                    }, 300); // Match animation duration
                }
            };
            
            // Initial state: HR visible, content hidden, caret at top
            toolContainer.appendChild(hr);
            toolContainer.appendChild(toggleBtn);
            toolContainer.appendChild(detailsSection);
            messageContent.appendChild(toolContainer);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        refreshIcons();
    }

    function loadPresentation(name, preserveSlide = false) {
        console.log('[LOAD] Starting loadPresentation for:', name, 'preserveSlide:', preserveSlide);
        // Store in frontend state
        AppState.presentation = name;
        if (!preserveSlide) {
            AppState.slide = 1; // Reset to slide 1 on load (unless preserving)
        }

        fetch('/api/load', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name})
        })
        .then(r => r.json())
        .then(data => {
            currentPresName = name;
            currentPresDescription = data.presentation?.description || "";
            hideWelcomeScreen();
            
            // Switch to preview view when loading a presentation
            switchView('preview');
            
            // Load preview
            reloadPreview();
            
            // Load chat history
            chatHistory.innerHTML = '';
            if (data.history) {
                data.history.forEach(msg => {
                    // Handle rich message types
                    if (msg.message_type) {
                        handleRichMessage(msg);
                    }
                    // Skip system messages without message_type (old format)
                    else if (msg.role === 'system') {
                        return;
                    }
                    // Handle different part types
                    else if (msg.parts && msg.parts.length > 0) {
                        const part = msg.parts[0];
                        
                        // Text part
                        if (part.text) {
                            appendMessage(msg.role, part.text);
                        }
                        // Function call (tool usage) - display with special formatting
                        else if (part.function_call) {
                            const toolName = part.function_call.name;
                            // Handle both dict objects and JSON strings
                            let args = part.function_call.args || {};
                            if (typeof args === 'string') {
                                try {
                                    args = JSON.parse(args);
                                } catch (e) {
                                    args = {};
                                }
                            }
                            
                            // Use special formatting for replace_text
                            if (toolName === "replace_text" && args && args.filename) {
                                appendToolUsageMessage(toolName, args, null);
                            } else {
                                // Fallback for other tools - format as code block with tool icon
                                const toolCallStr = Object.keys(args).length > 0 ? `${toolName}: ${JSON.stringify(args)}` : toolName;
                                // Create message with tool icon
                                const toolMsgDiv = document.createElement('div');
                                toolMsgDiv.className = 'message system tool-message';
                                
                                const toolAvatar = document.createElement('div');
                                toolAvatar.className = 'message-avatar';
                                toolAvatar.innerHTML = '<i data-lucide="wrench" style="width: 16px; height: 16px;"></i>';
                                
                                const toolContent = document.createElement('div');
                                toolContent.className = 'message-content';
                                toolContent.innerHTML = marked.parse(`Used tool: \`${toolCallStr}\``);
                                
                                toolMsgDiv.appendChild(toolAvatar);
                                toolMsgDiv.appendChild(toolContent);
                                chatHistory.appendChild(toolMsgDiv);
                                chatHistory.scrollTop = chatHistory.scrollHeight;
                                refreshIcons();
                            }
                        }
                        // Function response (tool result) - skip in UI for now
                        else if (part.function_response) {
                            // Skip tool responses in chat display
                        }
                        // Fallback for old format (plain string)
                        else if (typeof part === 'string') {
                            appendMessage(msg.role, part);
                        }
                    }
                    // Old format: content field
                    else if (msg.content) {
                        // Skip [SYSTEM] messages even in old format
                        if (msg.content.startsWith('[SYSTEM]')) {
                            return;
                        }
                        appendMessage(msg.role, msg.content);
                    }
                });
            }
        })
        .catch(err => {
            console.error('[LOAD] Error loading presentation:', err);
            alert(`Failed to load presentation "${name}": ${err.message}`);
            // Show welcome screen on error
            showWelcomeScreen();
        });
    }

    // ===== Create Presentation =====
    document.getElementById('create-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Disable submit button to prevent double-submission
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : 'Create';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
        }
        
        const name = document.getElementById('new-pres-name').value;
        const description = document.getElementById('new-pres-desc').value;
        const template = document.getElementById('new-pres-template-value').value || document.getElementById('new-pres-template').value;
        
        fetch('/api/presentations/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, description, template})
        })
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            } else {
                presentationCreate.classList.add('hidden');
                // Clear form
                document.getElementById('new-pres-name').value = '';
                document.getElementById('new-pres-desc').value = '';
                document.getElementById('new-pres-template').value = '';
                loadPresentation(name);
                
                // Re-enable button after success (ready for next use)
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        })
        .catch(err => {
            console.error('Create presentation error:', err);
            alert('Error creating presentation. See console for details.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    });

    // ===== Chat Functions =====
    function appendMessage(role, content) {
        // Create message container
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        // Create avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        // Set avatar content
        if (role === 'user') {
            avatar.innerHTML = '<i data-lucide="user" style="width: 16px; height: 16px;"></i>';
        } else if (role === 'model') {
            avatar.innerHTML = '<i data-lucide="bot" style="width: 16px; height: 16px;"></i>';
        } else if (role === 'system') {
            avatar.innerHTML = '<i data-lucide="terminal" style="width: 16px; height: 16px;"></i>';
        }
        
        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = marked.parse(content);
        
        // Append avatar and content
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        refreshIcons();
        
        return messageDiv;
    }
    
    function appendSystemMessage(title, content = null, isHtml = false, useToolIcon = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        
        // Add class for tool messages to use normal font
        if (useToolIcon) {
            messageDiv.classList.add('tool-message');
        }
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (useToolIcon) {
            avatar.innerHTML = '<i data-lucide="wrench" style="width: 16px; height: 16px;"></i>';
        } else {
            avatar.innerHTML = '<i data-lucide="terminal" style="width: 16px; height: 16px;"></i>';
        }
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (content === null) {
            // Legacy usage: title is the content
            messageContent.textContent = title;
        } else {
            // New usage: title + content
            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-medium mb-1';
            titleDiv.textContent = title;
            messageContent.appendChild(titleDiv);
            
            const contentDiv = document.createElement('div');
            if (isHtml) {
                contentDiv.innerHTML = content;
            } else {
                contentDiv.textContent = content;
            }
            messageContent.appendChild(contentDiv);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        refreshIcons();
    }

    function appendImageMessage(imagePath, index, batchSlug) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.dataset.imageIndex = index;
        messageDiv.dataset.batchSlug = batchSlug;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i data-lucide="image" style="width: 16px; height: 16px;"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'message-image';
        imageWrapper.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = `/api/serve-image?path=${encodeURIComponent(imagePath)}`;
        img.alt = `Candidate ${index + 1}`;
        
        imageWrapper.appendChild(img);
        imageWrapper.onclick = () => selectImageCandidate(index, imageWrapper);
        
        messageContent.appendChild(imageWrapper);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        refreshIcons();
    }

    function selectImageCandidate(index, imageElement) {
        // Mark this image as selected visually
        document.querySelectorAll('.message-image').forEach(img => {
            img.classList.remove('selected');
        });
        imageElement.classList.add('selected');
        selectedImageIndex = index;
        
        // Send selection to backend
        fetch('/api/images/select', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({index})
        })
        .then(r => r.json())
        .then(data => {
            console.log('Image selected:', data);
        });
    }

    function createRequestDetailsSection(details, requestType) {
        const detailsDiv = document.createElement('div');
        // Use same class structure as tool details for consistent styling
        detailsDiv.className = 'request-details tool-details-content';
        
        if (requestType === 'image') {
            // Don't show user prompt in details since it's already visible in the message
            detailsDiv.innerHTML = `
                <div class="detail-section">
                    <div class="detail-label">System Instructions</div>
                    <div class="detail-content">${escapeHtml(details.system_message)}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-meta">
                        <div class="detail-meta-item">
                            <i data-lucide="maximize" style="width: 14px; height: 14px;"></i>
                            <span>${details.aspect_ratio}</span>
                        </div>
                        <div class="detail-meta-item">
                            <i data-lucide="monitor" style="width: 14px; height: 14px;"></i>
                            <span>${details.resolution}</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (requestType === 'agent') {
            let metaHtml = '';
            if (details.model) {
                metaHtml = `
                    <div class="detail-section">
                        <div class="detail-meta">
                            <div class="detail-meta-item">
                                <i data-lucide="cpu" style="width: 14px; height: 14px;"></i>
                                <span>${escapeHtml(details.model)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            detailsDiv.innerHTML = `
                <div class="detail-section">
                    <div class="detail-label">User Message</div>
                    <div class="detail-content">${escapeHtml(details.user_message)}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-label">System Prompt</div>
                    <div class="detail-content">${escapeHtml(details.system_prompt)}</div>
                </div>
                ${metaHtml}
            `;
        }
        
        refreshIcons();
        return detailsDiv;
    }

    function addDetailsToggleToMessage(messageDiv, details, requestType) {
        // Find message content
        let messageContent = messageDiv.querySelector('.message-content');
        if (!messageContent) return;
        
        // Add class to mark this message as having collapsible content
        messageDiv.classList.add('has-collapsible-content');
        
        // Create container for HR, toggle, and details (same pattern as tool messages)
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'tool-details-container';
        
        // Create HR (represents collapsed state)
        const hr = document.createElement('hr');
        hr.className = 'tool-details-hr';
        
        // Create toggle button (centered, just caret) - starts at top
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'tool-details-toggle';
        toggleBtn.innerHTML = '<i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>';
        
        // Create details section (content)
        const detailsSection = createRequestDetailsSection(details, requestType);
        // Add tool-details class for collapsible behavior, keep request-details for styling
        detailsSection.classList.add('tool-details');
        
        // Toggle functionality
        let isExpanded = false;
        toggleBtn.onclick = () => {
            isExpanded = !isExpanded;
            
            // Update icon by completely replacing innerHTML
            const newIconName = isExpanded ? 'chevron-up' : 'chevron-down';
            toggleBtn.innerHTML = `<i data-lucide="${newIconName}" style="width: 14px; height: 14px;"></i>`;
            refreshIcons();
            
            if (isExpanded) {
                // Expand: hide HR, show content, move caret to bottom
                hr.classList.add('hidden');
                detailsSection.classList.add('expanded');
                toggleBtn.classList.add('expanded');
                // Update icon after animation
                setTimeout(() => {
                    if (isExpanded) {
                        toggleBtn.innerHTML = `<i data-lucide="chevron-up" style="width: 14px; height: 14px;"></i>`;
                        refreshIcons();
                    }
                }, 300);
            } else {
                // Collapse: show HR, hide content, move caret to top
                detailsSection.classList.remove('expanded');
                toggleBtn.classList.remove('expanded');
                // Update icon after animation
                setTimeout(() => {
                    if (!isExpanded) {
                        toggleBtn.innerHTML = `<i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>`;
                        refreshIcons();
                        hr.classList.remove('hidden');
                    }
                }, 300);
            }
        };
        
        // Initial state: HR visible, content hidden, caret at top
        detailsContainer.appendChild(hr);
        detailsContainer.appendChild(toggleBtn);
        detailsContainer.appendChild(detailsSection);
        messageContent.appendChild(detailsContainer);
        refreshIcons();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function sendMessage() {
        console.log('[SEND] sendMessage called');
        const text = messageInput.value.trim();
        if (!text && uploadedImages.length === 0) {
            console.log('[SEND] Empty message, returning');
            return;
        }

        console.log('[SEND] Message text:', text);

        // Check if SSE connection is definitely closed (not just connecting)
        if (!evtSource || evtSource.readyState === EventSource.CLOSED) {
            console.error('[SEND] Cannot send message: SSE connection closed. ReadyState:', evtSource?.readyState);
            appendSystemMessage('⚠️ Cannot send message - connection lost. Please wait for reconnection...');
            return;
        }

        // Warn if still connecting but allow message to go through
        if (evtSource.readyState === EventSource.CONNECTING) {
            console.warn('[SEND] Sending message while connection is still establishing (readyState: 0)');
        }

        // Get current state
        const presentationName = AppState.presentation;
        const currentSlide = AppState.slide;

        console.log('[SEND] Presentation:', presentationName, 'Slide:', currentSlide);

        if (!presentationName) {
            console.error('[SEND] No presentation loaded!');
            alert('No presentation loaded');
            return;
        }

        // Upload images first if any
        if (uploadedImages.length > 0) {
            console.log('[SEND] Sending with images...');
            const formData = new FormData();
            formData.append('message', text || '');
            formData.append('presentation_name', presentationName);
            formData.append('current_slide', String(currentSlide));
            uploadedImages.forEach((file, index) => {
                formData.append(`image_${index}`, file);
            });

            console.log('[SEND] Fetching /api/chat with form data...');
            fetch('/api/chat', {
                method: 'POST',
                body: formData
            })
            .then(r => {
                console.log('[SEND] Response status:', r.status);
                return r.json();
            })
            .then(data => {
                console.log('[SEND] Response data:', data);
                if (data.response) {
                    // Response will come via SSE
                }
                // Clear uploaded images
                uploadedImages = [];
                updateImagePreviews();
            })
            .catch(err => {
                console.error('[SEND] Error sending message with images:', err);
                alert('Error sending message. Please try again.');
            });
        } else {
            console.log('[SEND] Fetching /api/chat with JSON...');
            fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    message: text,
                    presentation_name: presentationName,
                    current_slide: currentSlide
                })
            })
            .then(r => {
                console.log('[SEND] Response status:', r.status);
                return r.json();
            })
            .then(data => {
                console.log('[SEND] Response data:', data);
                if (data.response) {
                    // Response will come via SSE
                }
            })
            .catch(err => {
                console.error('[SEND] Error:', err);
                alert('Error sending message. Please try again.');
            });
        }

        // Clear input
        messageInput.value = '';
    }
    
    function updateImagePreviews() {
        imagePreviews.innerHTML = '';
        if (uploadedImages.length === 0) {
            imagePreviewContainer.style.display = 'none';
            return;
        }
        
        imagePreviewContainer.style.display = 'block';
        uploadedImages.forEach((file, index) => {
            const previewDiv = document.createElement('div');
            previewDiv.style.position = 'relative';
            previewDiv.style.width = '80px';
            previewDiv.style.height = '80px';
            previewDiv.style.borderRadius = '6px';
            previewDiv.style.overflow = 'hidden';
            previewDiv.style.border = '1px solid hsl(var(--border))';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '×';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '4px';
            removeBtn.style.right = '4px';
            removeBtn.style.width = '20px';
            removeBtn.style.height = '20px';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.background = 'hsl(var(--destructive))';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.fontSize = '14px';
            removeBtn.style.display = 'flex';
            removeBtn.style.alignItems = 'center';
            removeBtn.style.justifyContent = 'center';
            removeBtn.onclick = () => {
                uploadedImages.splice(index, 1);
                updateImagePreviews();
            };
            
            previewDiv.appendChild(img);
            previewDiv.appendChild(removeBtn);
            imagePreviews.appendChild(previewDiv);
        });
    }
    
    // Image upload handling
    if (btnUploadImage) {
        btnUploadImage.addEventListener('click', () => {
            imageUploadInput.click();
        });
    }
    
    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            uploadedImages.push(...files);
            updateImagePreviews();
            imageUploadInput.value = ''; // Reset input
        });
    }

    btnSend.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });


    // ===== Server-Sent Events with Reconnection =====
    let evtSource = null;
    let reconnectAttempts = 0;
    let reconnectDelay = 5000; // Always 5 seconds
    let reconnectTimeout = null;
    let countdownInterval = null;
    let reconnectionMessageDiv = null;
    let isReconnecting = false;
    let connectionTimeout = null;

    function connectSSE() {
        console.log(`[SSE] connectSSE called (attempt ${reconnectAttempts + 1})`);

        // Clear any existing timeout and countdown
        if (reconnectTimeout) {
            console.log('[SSE] Clearing existing reconnect timeout');
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        if (countdownInterval) {
            console.log('[SSE] Clearing existing countdown interval');
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (connectionTimeout) {
            console.log('[SSE] Clearing existing connection timeout');
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
        }

        // Close existing connection if any
        if (evtSource) {
            console.log('[SSE] Closing existing EventSource, readyState:', evtSource.readyState);
            try {
                evtSource.close();
            } catch (e) {
                console.error('[SSE] Error closing EventSource:', e);
            }
            evtSource = null;
        }

        console.log('[SSE] Creating new EventSource to /events');

        try {
            evtSource = new EventSource('/events');
            console.log('[SSE] EventSource created, initial readyState:', evtSource.readyState);

            // Set a timeout to detect stuck connections
            connectionTimeout = setTimeout(() => {
                if (evtSource && evtSource.readyState === EventSource.CONNECTING) {
                    console.error('[SSE] Connection timeout - still in CONNECTING state after 10s');
                    console.error('[SSE] Forcing reconnection...');
                    evtSource.close();

                    // Trigger reconnection logic
                    if (!reconnectTimeout) {
                        scheduleReconnect();
                    }
                }
            }, 10000); // 10 second timeout

            evtSource.onopen = (event) => {
                console.log('[SSE] onopen fired! ReadyState:', evtSource.readyState);

                // Clear connection timeout since we successfully connected
                if (connectionTimeout) {
                    clearTimeout(connectionTimeout);
                    connectionTimeout = null;
                }

                reconnectAttempts = 0;
                isReconnecting = false;

                // Show success message if we were reconnecting
                if (reconnectionMessageDiv) {
                    console.log('[SSE] Showing reconnection success message');
                    showReconnectionSuccess();
                } else {
                    console.log('[SSE] Initial connection established');
                }
            };

            evtSource.onerror = (error) => {
                console.error('[SSE] onerror fired. ReadyState:', evtSource.readyState);
                console.error('[SSE] Error event:', error);
                console.error('[SSE] reconnectTimeout exists?', !!reconnectTimeout);
                console.error('[SSE] isReconnecting?', isReconnecting);

                // Clear connection timeout since we got an error
                if (connectionTimeout) {
                    clearTimeout(connectionTimeout);
                    connectionTimeout = null;
                }

                // Only schedule reconnection if we haven't already
                if (reconnectTimeout) {
                    console.log('[SSE] Reconnection already scheduled, ignoring this error event');
                    return;
                }

                if (evtSource && evtSource.readyState !== EventSource.CONNECTING) {
                    console.log('[SSE] Closing failed EventSource');
                    try {
                        evtSource.close();
                    } catch (e) {
                        console.error('[SSE] Error closing EventSource:', e);
                    }
                }

                // Schedule reconnection
                scheduleReconnect();
            };

            // Register all event listeners
            registerSSEListeners(evtSource);
            console.log('[SSE] Event listeners registered');

        } catch (err) {
            console.error('[SSE] Exception creating EventSource:', err);
            scheduleReconnect();
        }
    }

    function scheduleReconnect() {
        // Only schedule if not already scheduled
        if (reconnectTimeout) {
            console.log('[SSE] scheduleReconnect: Already scheduled, skipping');
            return;
        }

        // Mark that we're reconnecting
        isReconnecting = true;
        reconnectAttempts++;

        // Always use fixed 5 second delay
        const delay = reconnectDelay;

        console.log(`[SSE] Scheduling reconnection in ${delay}ms (attempt ${reconnectAttempts})`);

        // Show reconnection message in chat
        let remainingSeconds = Math.ceil(delay / 1000);
        showReconnectionMessage(remainingSeconds);

        // Update countdown every second
        countdownInterval = setInterval(() => {
            remainingSeconds--;
            console.log(`[SSE] Countdown: ${remainingSeconds}s remaining`);
            if (remainingSeconds > 0) {
                updateReconnectionCountdown(remainingSeconds);
            } else {
                showReconnectionAttempting();
            }
        }, 1000);

        // Actually reconnect after delay
        reconnectTimeout = setTimeout(() => {
            console.log('[SSE] Timeout expired, calling connectSSE()');
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            connectSSE();
        }, delay);
    }

    function showReconnectionMessage(seconds) {
        // Remove any existing reconnection message
        if (reconnectionMessageDiv) {
            reconnectionMessageDiv.remove();
        }

        // Create system message in chat with danger styling
        reconnectionMessageDiv = document.createElement('div');
        reconnectionMessageDiv.className = 'message system reconnection-danger';
        reconnectionMessageDiv.id = 'reconnection-status';
        reconnectionMessageDiv.style.cssText = `
            background: hsl(var(--destructive) / 0.1);
            border-left: 4px solid hsl(var(--destructive));
            padding-left: 12px;
            margin: 8px 0;
        `;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.style.color = 'hsl(var(--destructive))';
        avatar.innerHTML = '<i data-lucide="wifi-off" style="width: 18px; height: 18px;"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.style.cssText = 'color: hsl(var(--destructive)); font-weight: 500;';
        messageContent.innerHTML = `
            <div class="reconnection-message">
                <span>Connection lost. Reconnecting in </span>
                <span class="reconnection-countdown">
                    <span class="countdown-digit">${seconds}</span>
                </span>
                <span>s...</span>
            </div>
        `;

        reconnectionMessageDiv.appendChild(avatar);
        reconnectionMessageDiv.appendChild(messageContent);

        chatHistory.appendChild(reconnectionMessageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        refreshIcons();
    }

    function updateReconnectionCountdown(seconds) {
        if (!reconnectionMessageDiv) return;

        const countdownSpan = reconnectionMessageDiv.querySelector('.countdown-digit');
        if (countdownSpan) {
            // Trigger flip animation by replacing content
            countdownSpan.style.animation = 'none';
            setTimeout(() => {
                countdownSpan.textContent = seconds;
                countdownSpan.style.animation = '';
            }, 10);
        }
    }

    function showReconnectionAttempting() {
        if (!reconnectionMessageDiv) return;

        // Change to neutral styling
        reconnectionMessageDiv.className = 'message system reconnection-attempting';
        reconnectionMessageDiv.style.cssText = `
            background: hsl(var(--muted) / 0.3);
            border-left: 4px solid hsl(var(--muted-foreground));
            padding-left: 12px;
            margin: 8px 0;
        `;

        const avatar = reconnectionMessageDiv.querySelector('.message-avatar');
        if (avatar) {
            avatar.style.color = 'hsl(var(--muted-foreground))';
            avatar.innerHTML = '<i data-lucide="loader-2" style="width: 18px; height: 18px; animation: spin 1s linear infinite;"></i>';
        }

        const messageContent = reconnectionMessageDiv.querySelector('.message-content');
        if (messageContent) {
            messageContent.style.cssText = 'color: hsl(var(--muted-foreground)); font-weight: 500;';
            messageContent.innerHTML = `
                <div class="reconnection-message">
                    <span>Reconnecting now...</span>
                </div>
            `;
        }
        refreshIcons();
    }

    function hideReconnectionMessage() {
        if (reconnectionMessageDiv) {
            // Show success message instead of just removing
            showReconnectionSuccess();
        }
    }

    function showReconnectionSuccess() {
        if (!reconnectionMessageDiv) return;

        // Change to success styling
        reconnectionMessageDiv.className = 'message system reconnection-success';
        reconnectionMessageDiv.style.cssText = `
            background: hsl(142 76% 36% / 0.1);
            border-left: 4px solid hsl(142 76% 36%);
            padding-left: 12px;
            margin: 8px 0;
        `;

        const avatar = reconnectionMessageDiv.querySelector('.message-avatar');
        if (avatar) {
            avatar.style.color = 'hsl(142 76% 36%)';
            avatar.innerHTML = '<i data-lucide="wifi" style="width: 18px; height: 18px;"></i>';
        }

        const messageContent = reconnectionMessageDiv.querySelector('.message-content');
        if (messageContent) {
            messageContent.style.cssText = 'color: hsl(142 76% 36%); font-weight: 500;';
            messageContent.innerHTML = `
                <div class="reconnection-message">
                    <span>✓ Reconnected successfully</span>
                </div>
            `;
        }
        refreshIcons();

        // Remove the success message after 3 seconds
        setTimeout(() => {
            if (reconnectionMessageDiv) {
                reconnectionMessageDiv.remove();
                reconnectionMessageDiv = null;
            }
        }, 3000);
    }

    function registerSSEListeners(source) {
        source.addEventListener("message", (e) => {
            const data = JSON.parse(e.data);
            if (data.role === 'system') {
                appendSystemMessage(data.content);
            } else {
                appendMessage(data.role, data.content);
            }
        });

        // Escape key cancellation
        let isThinking = false;

        source.addEventListener("thinking_start", () => {
            isThinking = true;
            thinkingIndicator.classList.remove('hidden');
            // Scroll to bottom to ensure thinking indicator is visible and doesn't overlay user message
            chatHistory.scrollTop = chatHistory.scrollHeight;
        });

        source.addEventListener("thinking_end", () => {
            isThinking = false;
            thinkingIndicator.classList.add('hidden');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isThinking) {
                // Cancel the current request
                fetch('/api/chat/cancel', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'}
                }).catch(err => {
                    console.error('Error cancelling request:', err);
                });
            }
        });

        source.addEventListener("image_request_details", (e) => {
            const data = JSON.parse(e.data);
            // Store batch slug for this generation
            currentBatchSlug = data.batch_slug;

            // Create a system message showing the user prompt and generating status
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message system';
            messageDiv.dataset.batchSlug = data.batch_slug;

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.innerHTML = '<i data-lucide="image" style="width: 16px; height: 16px;"></i>';

            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            // Show user prompt by default, with "Generating..." status
            messageContent.innerHTML = `<p><strong>Image:</strong> ${escapeHtml(data.user_message)}</p><p class="text-muted">Generating images...</p>`;

            messageDiv.appendChild(avatar);
            messageDiv.appendChild(messageContent);

            chatHistory.appendChild(messageDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;

            // Add request details to this message (system instructions will be in collapsed section)
            addDetailsToggleToMessage(messageDiv, data, 'image');
            refreshIcons();
        });

        source.addEventListener("image_candidate", (e) => {
            const data = JSON.parse(e.data);
            appendImageMessage(data.image_path, data.index, data.batch_slug);
        });

        source.addEventListener("image_progress", (e) => {
            const data = JSON.parse(e.data);
            thinkingIndicator.classList.remove('hidden');
            thinkingIndicator.querySelector('.text').textContent = data.status || `Generating image ${data.current}/${data.total}...`;
        });

        source.addEventListener("images_ready", (e) => {
            thinkingIndicator.classList.add('hidden');
            thinkingIndicator.querySelector('.text').textContent = "Thinking...";
        });

        source.addEventListener("image_selected", (e) => {
            const data = JSON.parse(e.data);
            appendSystemMessage(`Image saved: ${data.filename}`);
        });

        source.addEventListener("agent_request_details", (e) => {
            const data = JSON.parse(e.data);
            // Find the most recent user message and add details to it
            const messages = chatHistory.querySelectorAll('.message.user');
            if (messages.length > 0) {
                const lastUserMessage = messages[messages.length - 1];
                addDetailsToggleToMessage(lastUserMessage, data, 'agent');
            }
        });

        source.addEventListener("tool_start", (e) => {
            const data = JSON.parse(e.data);
            console.log("Tool start:", data);
        });

        source.addEventListener("tool_end", (e) => {
            const data = JSON.parse(e.data);
            let result = data.result || "";

            // Check for Visual QA delimiter
            const visualQaDelimiter = "---VISUAL_QA_START---";
            let visualQaReport = null;

            if (result.includes(visualQaDelimiter)) {
                const parts = result.split(visualQaDelimiter);
                result = parts[0]; // The main tool output
                visualQaReport = parts[1]; // The Visual QA report
            }

            // --- Handle Main Tool Output ---

            // Special handling for replace_text
            if (data.tool === "replace_text" && data.args) {
                appendToolUsageMessage(data.tool, data.args, result);
            } else {
                // Truncate long results, but make them expandable
                let content = result;
                let needsExpand = false;

                if (data.tool === "read_file") {
                    // Special compact mode for read_file
                    const summary = `File content loaded (${result.length} characters).`;
                    const safeResult = escapeHtml(result).replace(/\n/g, '<br>');

                    const id = 'tool-res-' + Math.random().toString(36).substr(2, 9);

                    content = `
                        <div class="tool-result-summary text-muted">${escapeHtml(summary)}</div>
                        <button class="text-link" onclick="document.getElementById('${id}').classList.toggle('hidden')">Show Full Output</button>
                        <div id="${id}" class="tool-result-full hidden mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap">${safeResult}</div>
                    `;

                    needsExpand = true; // Treats content as HTML

                } else if (result.length > 200) {
                    // Create a summary
                    const summary = result.substring(0, 200) + "...";
                    // Create a details section
                    const safeResult = escapeHtml(result).replace(/\n/g, '<br>');

                    const id = 'tool-res-' + Math.random().toString(36).substr(2, 9);

                    content = `
                        <div class="tool-result-summary">${escapeHtml(summary)}</div>
                        <button class="text-link" onclick="document.getElementById('${id}').classList.toggle('hidden')">Show Full Output</button>
                        <div id="${id}" class="tool-result-full hidden mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap">${safeResult}</div>
                    `;

                    needsExpand = true;
                }

                // Format tool name and args as code block
                const toolCallStr = data.args ? `${data.tool}: ${JSON.stringify(data.args)}` : data.tool;
                appendSystemMessage(`Used tool: \`${toolCallStr}\``, content, needsExpand, true); // true = use tool icon
            }

            // --- Handle Visual QA Report (Separate Message) ---
            if (visualQaReport) {
                // Parse important parts
                let isCritical = visualQaReport.includes("CRITICAL VISUAL ISSUES FOUND");
                let description = "";
                let verdict = "";

                // Extract Description
                const descMatch = visualQaReport.match(/DESCRIPTION:(.*?)(?:VERDICT:|$)/s);
                if (descMatch) description = descMatch[1].trim();

                // Extract Verdict
                const verdictMatch = visualQaReport.match(/VERDICT:(.*?)(?:STOP AND THINK:|$)/s);
                if (verdictMatch) verdict = verdictMatch[1].trim();

                // Is it clean?
                if (verdict.includes("No issues found")) {
                    // Maybe don't show prominent warning, just a checkmark?
                    // User said: "We want to see the explanation... and the flag... always see that"
                }

                // Build HTML for Visual QA Message
                // Header
                let icon = isCritical ? '<i data-lucide="alert-triangle" class="text-red-500" style="width: 16px; height: 16px;"></i>' : '<i data-lucide="check-circle" class="text-green-500" style="width: 16px; height: 16px;"></i>';
                let title = isCritical ? "Visual Inspection: Issues Detected" : "Visual Inspection: Passed";

                let reportHtml = `
                    <div class="visual-qa-report ${isCritical ? 'critical' : 'passed'}">
                        <div class="qa-summary mb-2">
                            ${description ? `<p class="mb-1"><strong>Observed:</strong> ${escapeHtml(description)}</p>` : ''}
                            ${verdict ? `<p class="mb-1"><strong>Verdict:</strong> ${escapeHtml(verdict)}</p>` : ''}
                        </div>
                `;

                // Expandable Details (Full Report)
                const qaId = 'qa-res-' + Math.random().toString(36).substr(2, 9);

                // Clean up the report for raw view - remove the redundant header that we already show in UI
                let cleanReport = visualQaReport;
                if (isCritical) {
                    cleanReport = cleanReport.replace(/CRITICAL VISUAL ISSUES FOUND:\s*/, '');
                }
                cleanReport = cleanReport.trim();

                const safeReport = escapeHtml(cleanReport).replace(/\n/g, '<br>');

                reportHtml += `
                        <button class="text-link text-xs" onclick="document.getElementById('${qaId}').classList.toggle('hidden')">View Full Report</button>
                        <div id="${qaId}" class="tool-result-full hidden mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap">${safeReport}</div>
                    </div>
                `;

                // Append as a separate system message with special styling
                // We use a custom function or just appendSystemMessage with HTML
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message system visual-qa-message';
                if (isCritical) messageDiv.classList.add('border-l-4', 'border-red-500', 'bg-red-50/10', 'pl-3');

                const avatar = document.createElement('div');
                avatar.className = 'message-avatar';
                avatar.innerHTML = '<i data-lucide="eye" style="width: 16px; height: 16px;"></i>';

                const messageContent = document.createElement('div');
                messageContent.className = 'message-content';

                const titleDiv = document.createElement('div');
                titleDiv.className = `font-medium mb-1 flex items-center gap-2 ${isCritical ? 'text-red-500' : 'text-green-500'}`;
                titleDiv.innerHTML = `${icon} ${title}`;
                messageContent.appendChild(titleDiv);

                const contentDiv = document.createElement('div');
                contentDiv.innerHTML = reportHtml;
                messageContent.appendChild(contentDiv);

                messageDiv.appendChild(avatar);
                messageDiv.appendChild(messageContent);

                chatHistory.appendChild(messageDiv);
                chatHistory.scrollTop = chatHistory.scrollHeight;
                refreshIcons();
            }
        });

        source.addEventListener("tool_error", (e) => {
            const data = JSON.parse(e.data);
            appendSystemMessage(`✗ Tool ${data.tool} error: ${data.error}`);
        });

        source.addEventListener("layout_request", (e) => {
            const data = JSON.parse(e.data);
            showLayoutSelectionDialog(data.layouts, data.title, data.position);
        });

        source.addEventListener("presentation_updated", (e) => {
            console.log("Presentation updated, reloading preview...");

            // Automatically switch to preview view when presentation is updated
            switchView('preview');

            // Check if event data contains slide number
            let slideNumber = null;
            try {
                if (e.data) {
                    const data = JSON.parse(e.data);
                    if (data && data.slide_number) {
                        slideNumber = data.slide_number;
                    }
                }
            } catch (err) {
                console.warn("Error parsing presentation_updated data", err);
            }

            reloadPreview(slideNumber);
        });
    }

    // ===== Layout Selection Dialog =====

    function showLayoutSelectionDialog(layouts, title, position) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.style.display = 'flex';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal layout-selection-modal';

        const titleText = title ? ` titled "${title}"` : '';
        modal.innerHTML = `
            <h2>Select a Layout</h2>
            <p>Creating a new slide${titleText}. Choose a layout:</p>
            <div class="layouts-grid"></div>
            <div class="modal-actions">
                <button class="btn-cancel">Cancel</button>
            </div>
        `;

        const layoutsGrid = modal.querySelector('.layouts-grid');

        // Add layout options
        layouts.forEach(layout => {
            const layoutCard = document.createElement('div');
            layoutCard.className = 'layout-card';

            // Create simple preview (just show the layout name and first few lines)
            const previewLines = layout.content.split('\\n').slice(0, 5).join('\\n');

            // Build metadata badges
            let metadataHtml = '';
            if (layout.description) {
                metadataHtml += `<div class="layout-description">${escapeHtml(layout.description)}</div>`;
            }
            if (layout.image_friendly) {
                metadataHtml += `<span class="layout-badge image-badge">✓ Image-friendly</span>`;
                if (layout.recommended_aspect_ratio) {
                    metadataHtml += `<span class="layout-badge aspect-badge">${escapeHtml(layout.recommended_aspect_ratio)}</span>`;
                }
            }

            layoutCard.innerHTML = `
                <div class="layout-name">${layout.name}</div>
                ${metadataHtml}
                <div class="layout-preview">
                    <pre>${escapeHtml(previewLines)}...</pre>
                </div>
                <button class="btn-select-layout" data-layout="${escapeHtml(layout.name)}">
                    Select
                </button>
            `;

            layoutsGrid.appendChild(layoutCard);
        });

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Handle selection
        modal.querySelectorAll('.btn-select-layout').forEach(btn => {
            btn.addEventListener('click', async () => {
                const layoutName = btn.dataset.layout;
                
                try {
                    const response = await fetch('/api/layouts/select', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({layout_name: layoutName})
                    });
                    
                    if (response.ok) {
                        document.body.removeChild(overlay);
                    } else {
                        const error = await response.json();
                        alert('Error: ' + (error.error || 'Failed to select layout'));
                    }
                } catch (err) {
                    alert('Error selecting layout: ' + err.message);
                }
            });
        });
        
        // Handle cancel
        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }

    // Initialize SSE connection with reconnection support
    connectSSE();

    // ===== Initial Load =====

    // Check localStorage for persisted state (new behavior)
    const savedPresentation = AppState.presentation;
    const savedSlide = AppState.slide;

    if (savedPresentation) {
        console.log('[SESSION] Restoring session from localStorage:', savedPresentation, 'slide:', savedSlide);
        loadPresentation(savedPresentation, true); // preserveSlide = true

        // Navigate to saved slide after iframe loads (event-driven, not timeout)
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame && savedSlide > 1) {
            const slideNavigationHandler = () => {
                console.log('[SESSION] Preview iframe loaded, navigating to slide:', savedSlide);
                reloadPreview(savedSlide);
                // Clean up listener to prevent duplicate calls
                previewFrame.removeEventListener('load', slideNavigationHandler);
            };
            previewFrame.addEventListener('load', slideNavigationHandler);
        }

        // Ensure welcome screen is hidden
        hideWelcomeScreen();
        if (presentationCreate) {
            presentationCreate.classList.add('hidden');
        }
    } else {
        // No localStorage state, check backend for backward compatibility
        fetch('/api/state/current-presentation')
            .then(r => r.json())
            .then(state => {
                if (state.name) {
                    // Auto-restore presentation from backend
                    console.log('Restoring session from backend:', state.name);
                    loadPresentation(state.name);

                    // Ensure welcome screen is hidden
                    hideWelcomeScreen();
                    if (presentationCreate) {
                        presentationCreate.classList.add('hidden');
                    }
                } else {
                    // No state, show welcome screen
                    showWelcomeScreen();
                    if (presentationCreate) {
                        presentationCreate.classList.add('hidden');
                    }
                }
            })
            .catch(err => {
                console.error('Error checking backend state:', err);
                // Fallback to welcome screen
                showWelcomeScreen();
            });
    }
    
    // Initialize icons
    refreshIcons();
});
