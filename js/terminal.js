window.openPopup = function() {
  const popup = document.getElementById("terminalPopup");
  const scrim = document.getElementById("popupScrim");
  const historyEl = document.getElementById("terminalHistory");
  const inputRow = popup?.querySelector(".terminal-input-row");
  const hiddenInput = document.getElementById("terminalHiddenInput");
  const inputTextSpan = popup?.querySelector(".terminal-input-row .input-text");
  
  if (!popup || !scrim || !historyEl) return;
  
  document.body.style.overflow = "hidden";
  popup.classList.add("is-open");
  scrim.classList.add("is-open");
  popup.setAttribute("aria-hidden", "false");
  
  // Hide input row during boot sequence
  if (inputRow) inputRow.style.display = "none";
  if (hiddenInput) {
    hiddenInput.value = "";
  }
  if (inputTextSpan) {
    inputTextSpan.textContent = "";
  }
  
  // Initialize history log with starting prompt and command
  historyEl.innerHTML = '<div class="terminal-row"><span class="prompt">priyanshu@portfolio:~$</span> <span class="typed-command"></span></div>';
  
  const lines = [
    { text: "Starting the terminal...", type: "input", delay: 200 },
    { text: "* Initializing dashboard diagnostics...", type: "output", delay: 700 },
    { text: "* Server Status: ACTIVE (Listening on port 5000)", type: "output", delay: 1200 },
    { text: "* System Health Check: 100% stable", type: "output", delay: 1700 },
    { text: "* LeetCode Statistics: Synchronized (OK)", type: "output", delay: 2100 },
    { text: "Welcome back, Priyanshu.", type: "output", delay: 2500 }
  ];
  
  const typedSpan = historyEl.querySelector(".typed-command");
  let commandText = lines[0].text;
  let charIdx = 0;
  
  function typeCommand() {
    if (charIdx < commandText.length) {
      if (typedSpan) typedSpan.textContent += commandText.charAt(charIdx);
      charIdx++;
      setTimeout(typeCommand, 60);
    } else {
      lines.slice(1).forEach((line, index) => {
        setTimeout(() => {
          const div = document.createElement("div");
          div.className = "terminal-row";
          div.innerHTML = `<span class="output">${line.text}</span>`;
          historyEl.appendChild(div);
          
          const bodyEl = document.getElementById("terminalBody");
          if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;

          // On last line, show the interactive input prompt
          if (index === lines.length - 2) {
            setTimeout(() => {
              if (inputRow) inputRow.style.display = "flex";
              if (hiddenInput) {
                hiddenInput.focus();
              }
            }, 300);
          }
        }, line.delay - lines[0].delay);
      });
    }
  }
  
  setTimeout(typeCommand, lines[0].delay);
};

window.closePopup = function() {
  const popup = document.getElementById("terminalPopup");
  const scrim = document.getElementById("popupScrim");
  if (!popup || !scrim) return;
  document.body.style.overflow = "";   // to prevent scroll of main page 
  popup.classList.remove("is-open");
  scrim.classList.remove("is-open");
  popup.setAttribute("aria-hidden", "true");
  
  // Clear dragged/resized inline coordinates so it centers properly next time
  setTimeout(() => {
    popup.style.left = "";
    popup.style.top = "";
    popup.style.transform = "";
    popup.style.margin = "";
    
    const windowEl = popup.querySelector(".terminal-window");
    if (windowEl) {
      windowEl.style.width = "";
      windowEl.style.height = "";
      const bodyEl = windowEl.querySelector(".terminal-body");
      if (bodyEl) bodyEl.style.maxHeight = "";
    }
  }, 300);
};

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("terminalPopup");
  const windowEl = popup?.querySelector(".terminal-window");
  const handle = popup?.querySelector(".terminal-resize-handle");
  const header = windowEl?.querySelector(".terminal-header");

  if (!popup || !windowEl || !handle || !header) return;

  // --- Window Positioning and Dragging Logic ---
  let isDragging = false;
  let isResizing = false;
  let dragStartX = 0, dragStartY = 0;
  let initialLeft = 0, initialTop = 0;
  let startWidth = 0, startHeight = 0;
  let startX = 0, startY = 0;

  // Capture centered layout coordinates and apply as absolute pixels
  function pinPosition() {
    if (!popup.style.left || popup.style.left === "50%") {
      const rect = popup.getBoundingClientRect();
      popup.style.left = `${rect.left}px`;
      popup.style.top = `${rect.top}px`;
      popup.style.transform = "none";
      popup.style.margin = "0";
    }
  }

  // Drag Handlers
  header.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // Left click only
    if (e.target.closest(".terminal-dots")) return; // Don't drag on close/buttons
    if (isResizing) return;

    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  });

  header.addEventListener("touchstart", (e) => {
    if (e.target.closest(".terminal-dots")) return;
    if (isResizing) return;

    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
    e.preventDefault();
  });

  function startDrag(clientX, clientY) {
    isDragging = true;
    popup.classList.add("is-dragging");
    pinPosition();

    const rect = popup.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    dragStartX = clientX;
    dragStartY = clientY;
  }

  function updateDrag(clientX, clientY) {
    if (!isDragging) return;

    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;

    let left = initialLeft + dx;
    let top = initialTop + dy;

    // Bounds check to keep header inside viewport
    const headerHeight = header.offsetHeight;
    const popupWidth = popup.offsetWidth;

    left = Math.max(-popupWidth + 100, Math.min(left, window.innerWidth - 100));
    top = Math.max(0, Math.min(top, window.innerHeight - headerHeight));

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  }

  function stopDrag() {
    if (isDragging) {
      isDragging = false;
      popup.classList.remove("is-dragging");
    }
  }

  // Resize Handlers
  function startResize(clientX, clientY) {
    isResizing = true;
    popup.classList.add("is-dragging");
    pinPosition();

    startWidth = windowEl.offsetWidth;
    startHeight = windowEl.offsetHeight;
    startX = clientX;
    startY = clientY;

    document.body.style.userSelect = "none";
  }

  function updateSize(clientX, clientY) {
    if (!isResizing) return;

    const width = startWidth + (clientX - startX);
    const height = startHeight + (clientY - startY);

    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.85;

    const newWidth = Math.max(320, Math.min(width, maxWidth));
    const newHeight = Math.max(200, Math.min(height, maxHeight));

    windowEl.style.width = `${newWidth}px`;
    windowEl.style.height = `${newHeight}px`;

    const bodyEl = windowEl.querySelector(".terminal-body");
    const headerEl = windowEl.querySelector(".terminal-header");

    if (bodyEl && headerEl) {
      bodyEl.style.maxHeight = `${newHeight - headerEl.offsetHeight}px`;
    }
  }

  function stopResize() {
    if (isResizing) {
      isResizing = false;
      popup.classList.remove("is-dragging");
      document.body.style.userSelect = "";
    }
  }

  // Shared Global Listeners for Drag & Resize
  document.addEventListener("mousemove", (e) => {
    if (isDragging) updateDrag(e.clientX, e.clientY);
    if (isResizing) updateSize(e.clientX, e.clientY);
  });

  document.addEventListener("mouseup", () => {
    stopDrag();
    stopResize();
  });

  document.addEventListener("touchmove", (e) => {
    if (!isDragging && !isResizing) return;
    const touch = e.touches[0];
    if (isDragging) updateDrag(touch.clientX, touch.clientY);
    if (isResizing) updateSize(touch.clientX, touch.clientY);
    e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", () => {
    stopDrag();
    stopResize();
  });

  handle.addEventListener("mousedown", (e) => {
    startResize(e.clientX, e.clientY);
    e.preventDefault();
  });

  handle.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    startResize(touch.clientX, touch.clientY);
    e.preventDefault();
  });

  // Keep resized dimensions within bounds on viewport changes
  window.addEventListener("resize", () => {
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.85;

    if (windowEl.offsetWidth > maxWidth) {
      windowEl.style.width = `${maxWidth}px`;
    }
    if (windowEl.offsetHeight > maxHeight) {
      windowEl.style.height = `${maxHeight}px`;
    }
  });


  // --- Terminal Command Parsing & Input Sync ---
  const hiddenInput = document.getElementById("terminalHiddenInput");
  const inputTextSpan = popup.querySelector(".terminal-input-row .input-text");
  const historyEl = document.getElementById("terminalHistory");
  const terminalBody = document.getElementById("terminalBody");

  if (!hiddenInput || !inputTextSpan || !historyEl || !terminalBody) return;

  let cmdHistory = [];
  let historyIndex = -1;

  // Focus input on window click
  windowEl.addEventListener("click", () => {
    hiddenInput.focus();
  });

  // Sync virtual text display with hidden input
  hiddenInput.addEventListener("input", () => {
    inputTextSpan.textContent = hiddenInput.value;
  });

  // Handle Command Line Key Events
  hiddenInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const command = hiddenInput.value.trim();
      executeCommand(command);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      
      if (historyIndex === -1) {
        historyIndex = cmdHistory.length - 1;
      } else if (historyIndex > 0) {
        historyIndex--;
      }
      hiddenInput.value = cmdHistory[historyIndex];
      inputTextSpan.textContent = hiddenInput.value;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      
      if (historyIndex < cmdHistory.length - 1) {
        historyIndex++;
        hiddenInput.value = cmdHistory[historyIndex];
      } else {
        historyIndex = -1;
        hiddenInput.value = "";
      }
      inputTextSpan.textContent = hiddenInput.value;
    }
  });

  function executeCommand(cmdText) {
    hiddenInput.value = "";
    inputTextSpan.textContent = "";
    historyIndex = -1;

    // Append user command to history log
    const promptRow = document.createElement("div");
    promptRow.className = "terminal-row";
    promptRow.innerHTML = `<span class="prompt">priyanshu@portfolio:~$</span> <span>${escapeHTML(cmdText)}</span>`;
    historyEl.appendChild(promptRow);

    if (cmdText.trim() === "") {
      scrollToBottom();
      return;
    }

    cmdHistory.push(cmdText);
    if (cmdHistory.length > 50) cmdHistory.shift();

    const args = cmdText.split(/\s+/);
    const cmd = args[0].toLowerCase();
    let output = "";

    switch (cmd) {
      case "help":
        output = `Available commands:<br>
  - <span class="info">about</span>: Learn more about Priyanshu Sharma<br>
  - <span class="info">skills</span>: Display core programming stack & tools<br>
  - <span class="info">projects</span>: List featured software engineering work<br>
  - <span class="info">stats</span>: Show competitive programming statistics<br>
  - <span class="info">github</span>: View GitHub profile & repositories<br>
  - <span class="info">contact</span>: Print contact information<br>
  - <span class="info">theme</span>: Toggle portfolio dark/light theme mode<br>
  - <span class="info">clear</span>: Clear terminal history<br>
  - <span class="info">exit</span>: Close this terminal popup`;
        break;

      case "clear":
        historyEl.innerHTML = "";
        scrollToBottom();
        return;

      case "exit":
      case "close":
        if (typeof window.closePopup === "function") {
          window.closePopup();
        }
        return;

      case "theme":
        const themeBtn = document.getElementById("theme-toggle");
        if (themeBtn) {
          themeBtn.click();
          output = `System theme toggled.`;
        } else {
          output = `Error: Theme toggler not found.`;
        }
        break;

      case "about":
        output = `<strong>Priyanshu Sharma</strong><br>
---------------------------------------------<br>
A Software Developer pursuing a Bachelor of Technology in Computer Science & Engineering. Passionate about Backend Development and problem-solving, building scalable, high-motion websites and robust backend applications.`;
        break;

      case "skills":
        output = `<strong>Technical Stack:</strong><br>
---------------------------------------------<br>
- <span class="info">Languages:</span> Java, Python, C, JavaScript, SQL<br>
- <span class="info">Frameworks & Backend:</span> Spring Boot, RESTful APIs, JDBC<br>
- <span class="info">Frontend:</span> HTML5, CSS3, ES6 JavaScript, React<br>
- <span class="info">DevOps & Databases:</span> Git, GitHub, MySQL, Linux, Docker, AWS, PostgreSQL`;
        break;

      case "projects":
        output = `<strong>Featured Projects:</strong><br>
---------------------------------------------<br>
1. <span class="info">Realtime Operations Board</span> - Monitoring interface with crisp states and layered panels.<br>
2. <span class="info">Motion Commerce Landing</span> - E-commerce UI featuring highly fluid responsive sections.<br>
3. <span class="info">Prompt Workflow Studio</span> - Dashboard workflow interface built for teams managing LLM prompts.`;
        break;

      case "stats":
        output = `<strong>Competitive Programming Stats:</strong><br>
---------------------------------------------<br>
- LeetCode Rating: <span class="success">1,847</span> (Knight Status, Top 4.8%)<br>
- Problems Solved: <span class="success">387</span><br>
- Acceptance Rate: <span class="info">68.4%</span><br>
- Global Rank: <span class="success">48,312</span><br><br>
Scrolling to stats dashboard...`;
        const statsSec = document.getElementById("stats-panel-section");
        if (statsSec) {
          statsSec.scrollIntoView({ behavior: "smooth" });
        }
        break;

      case "github":
        output = `<strong>GitHub Profile & Ecosystem:</strong><br>
---------------------------------------------<br>
- <span class="info">User:</span> Priyanshu Sharma (@cs1m2414238)<br>
- <span class="info">Repositories:</span> 20+ public repositories<br>
- <span class="info">Primary Languages:</span> Java, TypeScript, Python, HTML/CSS<br>
- <span class="info">Profile Link:</span> <a href="https://github.com/cs1m2414238" target="_blank" class="terminal-link">github.com/cs1m2414238</a><br><br>
Scrolling to GitHub section...`;
        const ghSec = document.getElementById("github");
        if (ghSec) {
          ghSec.scrollIntoView({ behavior: "smooth" });
        }
        break;

      case "contact":
        output = `<strong>Contact & Socials:</strong><br>
---------------------------------------------<br>
- <span class="info">Email:</span> priyanshu@example.com<br>
- <span class="info">LinkedIn:</span> <a href="https://linkedin.com/" target="_blank" class="terminal-link">linkedin.com/in/priyanshu</a><br>
- <span class="info">GitHub:</span> <a href="https://github.com/cs1m2414238" target="_blank" class="terminal-link">github.com/cs1m2414238</a>`;
        break;

      default:
        output = `bash: command not found: <span class="error">${escapeHTML(cmd)}</span>. Type <span class="info">help</span> for options.`;
    }

    if (output) {
      const outputRow = document.createElement("div");
      outputRow.className = "terminal-row";
      outputRow.innerHTML = `<span class="output-line">${output}</span>`;
      historyEl.appendChild(outputRow);
    }

    scrollToBottom();
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  function scrollToBottom() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }
});