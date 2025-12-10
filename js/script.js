$(document).ready(function() {
    // Current state
    let currentConvo = null;
    const totalConvos = 6;
    
    // Initial Render
    renderHome();

    // Navigation Click Handler
    $('.nav-btn').click(function() {
        const target = $(this).data('target');
        
        // Update active state
        $('.nav-btn').removeClass('active');
        $(this).addClass('active');

        if (target === 'home') {
            renderHome();
        } else {
            loadConversation(target);
        }
    });

    // Function to render the home screen
    function renderHome() {
        const $content = $('#main-content');
        $content.fadeOut(200, function() {
            $content.empty();
            
            const $wrapper = $('<div class="content-wrapper" style="background:transparent; box-shadow:none; border:none;"></div>');
            const $menu = $('<div class="home-menu"></div>');

            for (let i = 1; i <= totalConvos; i++) {
                const $card = $(`
                    <div class="home-card" onclick="$('.nav-btn[data-target=${i}]').click()">
                        <h3>CONVERSATION ${i}</h3>
                        <p>Access neural archive sequence 00${i}</p>
                    </div>
                `);
                $menu.append($card);
            }

            $wrapper.append('<h1 style="color:white; text-shadow:0 0 10px #ff00ff;">SELECT ARCHIVE</h1>');
            $wrapper.append($menu);
            $content.append($wrapper).fadeIn(300);
        });
    }

    // Function to load conversation text
    function loadConversation(id) {
        const $content = $('#main-content');
        const fileName = `convo ${id}.txt`;

        $content.fadeOut(200, function() {
            $content.empty();
            $content.append('<div style="color:white; text-align:center;">DECRYPTING DATA...</div>');
            $content.fadeIn(100);

            // Fetch the text file
            fetch(fileName)
                .then(response => {
                    if (!response.ok) throw new Error("Network response was not ok");
                    return response.text();
                })
                .then(text => {
                    processAndRenderText(text, id);
                })
                .catch(error => {
                    $content.html(`<div class="content-wrapper"><h2 style="color:red">ERROR LOADING ARCHIVE ${id}</h2><p>${error.message}</p></div>`);
                });
        });
    }

    // Process text: Parse formatting and Apply highlighting
    function processAndRenderText(text, id) {
        const lines = text.split('\n');
        const $wrapper = $('<div class="content-wrapper"></div>');
        
        // Extract Title (usually first line)
        let title = `ARCHIVE 00${id}`;
        let startLine = 0;
        
        if (lines.length > 0 && lines[0].toLowerCase().includes('title')) {
            title = lines[0].replace(/Short Title:/i, '').trim();
            startLine = 1;
        }

        $wrapper.append(`<h1>${title}</h1>`);

        let currentParagraph = '';
        
        for (let i = startLine; i < lines.length; i++) {
            let line = lines[i].trim();
            
            if (!line) continue;

            // Detect Timestamps or Speakers for special formatting
            const timeRegex = /^\d{1,2}:\d{2}\s?(AM|PM)$/i;
            const speakerRegex = /^(Gemini-3-Pro|User|Thinking\.\.\.|Note:|Summary|Step Id:|File Path:)/i;

            if (timeRegex.test(line)) {
                if (currentParagraph) {
                    $wrapper.append(formatParagraph(currentParagraph));
                    currentParagraph = '';
                }
                $wrapper.append(`<div class="chat-timestamp">${line}</div>`);
            } else if (speakerRegex.test(line) || line === 'Thinking...') {
                if (currentParagraph) {
                    $wrapper.append(formatParagraph(currentParagraph));
                    currentParagraph = '';
                }
                // Don't highlight speaker names heavily, just style them
                $wrapper.append(`<span class="chat-speaker">${line}</span>`);
            } else {
                // Accumulate text for paragraph processing
                currentParagraph += line + ' ';
            }
        }
        
        if (currentParagraph) {
            $wrapper.append(formatParagraph(currentParagraph));
        }

        $('#main-content').hide().empty().append($wrapper).fadeIn(500);
    }

    // Intelligent Highlighting Logic
    function formatParagraph(text) {
        const words = text.split(' ');
        const processedWords = words.map(word => {
            // Remove punctuation for analysis
            const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            
            // Heuristic for "importance":
            // 1. Length > 6
            // 2. Starts with Capital letter (and not just a generic small word) -> likely Proper Noun
            // 3. Is a number
            // 4. Is in UPPERCASE
            
            let isImportant = false;
            
            if (cleanWord.length > 6) isImportant = true;
            if (/^[A-Z]/.test(cleanWord) && cleanWord.length > 3) isImportant = true;
            if (/[0-9]/.test(cleanWord)) isImportant = true;
            if (cleanWord === cleanWord.toUpperCase() && cleanWord.length > 1 && /[A-Z]/.test(cleanWord)) isImportant = true;

            // Wrap
            if (isImportant) {
                return `<span class="highlight-heavy">${word}</span>`;
            } else {
                return `<span class="highlight-normal">${word}</span>`;
            }
        });

        return `<div class="chat-line">${processedWords.join(' ')}</div>`;
    }
});
