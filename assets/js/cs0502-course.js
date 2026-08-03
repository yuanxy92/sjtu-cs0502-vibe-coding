(function() {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function(resolve, reject) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        textarea.remove();
      }
    });
  }

  function initCopyPrompt(root) {
    const button = root.querySelector('[data-copy-prompt]');
    if (!button) return;

    function activePrompt() {
      return root.querySelector('[data-language-content="turing"]:not([hidden]) .cs0502-starter-prompt');
    }

    function copyLabel() {
      const prompt = activePrompt();
      return prompt && prompt.closest('[data-language="zh"]') ? '复制提示词' : 'Copy prompt';
    }

    let resetTimer = null;
    button.addEventListener('click', function() {
      const prompt = activePrompt();
      if (!prompt) return;
      copyText(prompt.textContent.trim()).then(function() {
        button.classList.add('is-copied');
        button.querySelector('[data-copy-label]').textContent = prompt.closest('[data-language="zh"]') ? '已复制' : 'Copied';
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(function() {
          button.classList.remove('is-copied');
          button.querySelector('[data-copy-label]').textContent = copyLabel();
        }, 1800);
      }).catch(function() {
        button.querySelector('[data-copy-label]').textContent = prompt.closest('[data-language="zh"]') ? '复制失败' : 'Copy failed';
      });
    });
  }

  function initLanguageSwitchers(root) {
    root.querySelectorAll('[data-language-switcher]').forEach(function(switcher) {
      const target = switcher.dataset.languageTarget;
      const buttons = Array.from(switcher.querySelectorAll('[data-language]'));
      const contents = Array.from(root.querySelectorAll('[data-language-content="' + target + '"]'));
      if (!target || !buttons.length || !contents.length) return;

      function selectLanguage(language) {
        buttons.forEach(function(button) {
          const selected = button.dataset.language === language;
          button.classList.toggle('is-active', selected);
          button.setAttribute('aria-pressed', String(selected));
        });
        contents.forEach(function(content) {
          content.hidden = content.dataset.language !== language;
        });
        root.querySelectorAll('[data-language-heading="' + target + '"]').forEach(function(heading) {
          const text = heading.dataset[language];
          if (text) heading.textContent = text;
        });
        if (target === 'turing') {
          const copyButton = root.querySelector('[data-copy-prompt]');
          const copyLabel = root.querySelector('[data-copy-label]');
          if (copyLabel && (!copyButton || !copyButton.classList.contains('is-copied'))) {
            copyLabel.textContent = language === 'zh' ? '复制提示词' : 'Copy prompt';
          }
        }
      }

      buttons.forEach(function(button) {
        button.addEventListener('click', function() {
          selectLanguage(button.dataset.language);
        });
      });

      const initiallySelected = buttons.find(function(button) {
        return button.classList.contains('is-active');
      });
      selectLanguage((initiallySelected || buttons[0]).dataset.language);
    });
  }

  function initAiProjectDataLinks(root) {
    var links = window.CS0502_AI_DATA_LINKS || {};
    root.querySelectorAll('[data-ai-project-data]').forEach(function(button) {
      var entry = links[button.dataset.aiProjectData];
      var url = typeof entry === 'string' ? entry : entry && entry.url;
      var extractionCode = typeof entry === 'object' && entry ? entry.extractionCode : '';
      if (typeof url === 'string' && /^https?:\/\//.test(url)) {
        button.href = url;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.removeAttribute('aria-disabled');
        button.removeAttribute('title');
        button.classList.remove('course-data-action--disabled');
        button.querySelectorAll('[data-extraction-code]').forEach(function(codeLabel) {
          if (extractionCode) {
            codeLabel.textContent = extractionCode;
            codeLabel.hidden = false;
          }
        });
        return;
      }

      button.href = '#';
      button.setAttribute('aria-disabled', 'true');
      button.title = '教师尚未发布该数据下载链接';
      button.classList.add('course-data-action--disabled');
      button.addEventListener('click', function(event) {
        event.preventDefault();
      });
    });
  }

  window.initCS0502Course = function() {
    const root = document.querySelector('.course-page');
    if (!root || root.dataset.cs0502Initialized === 'true') return;
    root.dataset.cs0502Initialized = 'true';
    initLanguageSwitchers(root);
    initCopyPrompt(root);
    initAiProjectDataLinks(root);
  };
})();
