const body = document.body;
const BACKEND_API_BASE = "https://portfolio-api-1026847531254.asia-south1.run.app";
const progressBar = document.querySelector("#progress-bar");
const themeToggle = document.querySelector("#theme-toggle");
const starfield = document.querySelector("#starfield");
const boardShell = document.querySelector("#skill-board-shell");
const revealItems = document.querySelectorAll(".reveal");
const icon = themeToggle ? themeToggle.querySelector(".icon") : null;

// HyperOS Ambient Blobs Position Shuffler (GPU-only, zero layout shifts)
const ambientBlobs = document.querySelectorAll(".ambient");
const translateXOptions = [-100, 80, 200, 350, 500, 650, 800];
const translateYOptions = [-60, -30, 0, 30];

function shuffleBlobPosition(blob) {
  const randomX =
    translateXOptions[Math.floor(Math.random() * translateXOptions.length)];
  const randomY =
    translateYOptions[Math.floor(Math.random() * translateYOptions.length)];
  // GPU compositor layer only — zero layout recalculation
  blob.style.transform = `translate3d(${randomX}px, ${randomY}px, 0)`;
}

ambientBlobs.forEach((blob) => {
  blob.addEventListener("animationiteration", () => {
    shuffleBlobPosition(blob);
  });
});

//-----------------------------------------------------------------
//  Toggle between sun and moon icons function

function updateIcon(theme) {
  if (!icon) return; // Safety check or prevent crash if icon is not found

  icon.classList.add("switch-out");

  setTimeout(() => {
    icon.classList.toggle("icon-moon", theme === "night");
    icon.classList.toggle("icon-sun", theme !== "night");

    icon.classList.remove("switch-out");
    icon.classList.add("switch-in");

    setTimeout(() => {
      icon.classList.remove("switch-in");
    }, 400);
  }, 200);
}

// Toggle between "sun" and "moon" icons and theme with View Transitions
themeToggle.addEventListener("click", (e) => {
  const nextTheme = body.dataset.theme === "night" ? "dawn" : "night";
  const isDark = nextTheme === "night";
  const applyTheme = () => {
    body.dataset.theme = nextTheme;
    try {
      localStorage.setItem("portfolio:theme", nextTheme);
    } catch {
      // Theme switching still works when browser storage is unavailable.
    }
  };

  if (!document.startViewTransition) {
    applyTheme();
    updateIcon(nextTheme);
    return;
  }

  const transition = document.startViewTransition(applyTheme);

  transition.ready.then(() => {
    const x = e.clientX;
    const y = e.clientY;

    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    // Going light → expand new (dawn) from click point (the button)
    // Going dark  → expand new (night) from the OPPOSITE corner of the screen
    //               so dark sweeps in from far away, not back into the button
    const originX = isDark
      ? x < window.innerWidth / 2
        ? window.innerWidth
        : 0
      : x;
    const originY = isDark
      ? y < window.innerHeight / 2
        ? window.innerHeight
        : 0
      : y;

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${originX}px ${originY}px)`,
          `circle(${radius}px at ${originX}px ${originY}px)`,
        ],
      },
      {
        duration: 650,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });

  // Update icon after transition completes
  transition.finished.then(() => updateIcon(nextTheme));
});

//  HEADER SHRINK ON SCROLL (Throttled with requestAnimationFrame)
const header = document.querySelector(".site-header");
let headerTicking = false;
let isHeaderScrolled = false;

window.addEventListener("scroll", () => {
  if (!headerTicking) {
    requestAnimationFrame(() => {
      const shouldBeScrolled = window.scrollY > 40;
      if (shouldBeScrolled !== isHeaderScrolled) {
        isHeaderScrolled = shouldBeScrolled;
        if (header) {
          header.classList.toggle("scrolled", isHeaderScrolled);
        }
      }
      headerTicking = false;
    });
    headerTicking = true;
  }
}, { passive: true });

// Smooth scrolling for navigation anchor links (replaces global scroll-behavior)
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (event) {
    const targetId = this.getAttribute("href");
    if (targetId && targetId !== "#") {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        event.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
});

// Initial load
updateIcon(body.dataset.theme);

const renderStars = () => {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 90; index += 1) {
    const star = document.createElement("span");
    const size = Math.random() * 2.6 + 0.8;
    const duration = Math.random() * 6 + 5;

    star.className = "star";
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDuration = `${duration}s`;
    star.style.animationDelay = `${Math.random() * 6}s`;

    fragment.appendChild(star);
  }

  starfield.appendChild(fragment);
};

// GPU-accelerated progress bar update via transform scaleX
let progressTicking = false;
const updateProgressBar = () => {
  if (!progressTicking) {
    requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      if (progressBar) {
        progressBar.style.transform = `scaleX(${progress})`;
      }
      progressTicking = false;
    });
    progressTicking = true;
  }
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 },
);

revealItems.forEach((item) => revealObserver.observe(item));

// 3D Skill Board Tilt: cached bounding rect + rAF throttling
if (boardShell) {
  let tiltTicking = false;
  let mouseX = 0;
  let mouseY = 0;
  let shellRect = null;

  const updateShellRect = () => {
    shellRect = boardShell.getBoundingClientRect();
  };

  boardShell.addEventListener("mouseenter", updateShellRect, { passive: true });
  window.addEventListener("resize", updateShellRect, { passive: true });

  boardShell.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;

    if (!tiltTicking) {
      requestAnimationFrame(() => {
        if (!shellRect) {
          shellRect = boardShell.getBoundingClientRect();
        }
        const percentX = (mouseX - shellRect.left) / shellRect.width - 0.5;
        const percentY = (mouseY - shellRect.top) / shellRect.height - 0.5;

        boardShell.style.setProperty("--tilt-x", `${percentY * -7}deg`);
        boardShell.style.setProperty("--tilt-z", `${percentX * 9}deg`);
        tiltTicking = false;
      });
      tiltTicking = true;
    }
  }, { passive: true });

  boardShell.addEventListener("pointerleave", () => {
    boardShell.style.setProperty("--tilt-x", "0deg");
    boardShell.style.setProperty("--tilt-z", "0deg");
    shellRect = null;
  });
}

window.addEventListener("scroll", updateProgressBar, { passive: true });
window.addEventListener("load", () => {
  updateProgressBar();
  const skillShell = document.querySelector(".skill-board-shell");
  if (skillShell) {
    skillShell.classList.add("glow-active");
    setTimeout(() => skillShell.classList.remove("glow-active"), 2100);
  }
});

// Keyboard and click interactive features for the skill keys
const keysList = document.querySelectorAll(".key");
const physicalKeys = [
  "KeyQ",
  "KeyW",
  "KeyE",
  "KeyR",
  "KeyT", // Row 1
  "KeyY",
  "KeyU",
  "KeyI",
  "KeyO",
  "KeyP", // Row 2
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyF",
  "KeyG", // Row 3
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyB", // Row 4
];

// Keypress event listeners
window.addEventListener("keydown", (event) => {
  const index = physicalKeys.indexOf(event.code);
  if (index !== -1 && keysList[index]) {
    keysList[index].classList.add("is-pressed");
  }
});

window.addEventListener("keyup", (event) => {
  const index = physicalKeys.indexOf(event.code);
  if (index !== -1 && keysList[index]) {
    keysList[index].classList.remove("is-pressed");
  }
});

// Virtual key click event listeners
keysList.forEach((keyEl) => {
  keyEl.addEventListener("pointerdown", (e) => {
    keyEl.classList.add("is-pressed");
    e.preventDefault();
  });

  const release = () => {
    keyEl.classList.remove("is-pressed");
  };

  keyEl.addEventListener("pointerup", release);
  keyEl.addEventListener("pointerleave", release);
  keyEl.addEventListener("pointercancel", release);
});

renderStars();
updateProgressBar();

//  adding script for suffling in names
document.addEventListener("DOMContentLoaded", () => {
  const roles = [
    "Priyanshu Sharma",
    "Problem Solver",
    "Full Stack Developer",
    "AI/ML Engineer",
  ];

  const typingElement = document.getElementById("typing");
  const titleSpace = document.querySelector(".hero-title-space");
  if (titleSpace) {
    titleSpace.replaceChildren(...roles.map(role => {
      const span = document.createElement("span");
      span.textContent = role;
      return span;
    }));
  }
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function typeEffect() {
    const currentRole = roles[roleIndex];

    if (!deleting) {
      typingElement.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;

      if (charIndex === currentRole.length) {
        deleting = true;
        setTimeout(typeEffect, 1500);
        return;
      }
    } else {
      typingElement.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
    }

    setTimeout(typeEffect, deleting ? 50 : 100);
  }

  typeEffect();
});

// Journey Timeline Interactivity
document.addEventListener("DOMContentLoaded", () => {
  const timelineColumns = document.querySelectorAll(".timeline-column");
  timelineColumns.forEach((col) => {
    col.addEventListener("mouseenter", () => {
      timelineColumns.forEach((c) => c.classList.remove("active"));
      col.classList.add("active");
    });
  });
});

// Toast Notification & Contact Form Handling
function showToast(title, text) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;

  if (title) {
    const titleEl = toast.querySelector(".toast-title");
    if (titleEl) titleEl.textContent = title;
  }
  if (text) {
    const textEl = toast.querySelector(".toast-text");
    if (textEl) textEl.textContent = text;
  }

  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// Toast Notification
function showToast(title, text, isError = false) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;

  toast.classList.toggle("toast-error", isError);

  const iconEl = toast.querySelector(".toast-icon i");
  if (iconEl) {
    iconEl.className = isError ? "fa-solid fa-circle-xmark" : "fa-solid fa-circle-check";
  }

  if (title) {
    const titleEl = toast.querySelector(".toast-title");
    if (titleEl) titleEl.textContent = title;
  }
  if (text) {
    const textEl = toast.querySelector(".toast-text");
    if (textEl) textEl.textContent = text;
  }

  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.remove("toast-error");
  }, 4500);
}

// Contact Form Submission Handling
document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contact-form");
  if (!contactForm) return;

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalButtonHtml = submitButton ? submitButton.innerHTML : '<i class="fa-solid fa-paper-plane"></i> Send Message';

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("form-name");
    const emailInput = document.getElementById("form-email");
    const subjectInput = document.getElementById("form-subject");
    const messageInput = document.getElementById("form-message");

    const contactData = {
      name: nameInput ? nameInput.value.trim() : "",
      email: emailInput ? emailInput.value.trim() : "",
      subject: subjectInput ? subjectInput.value.trim() : "",
      message: messageInput ? messageInput.value.trim() : "",
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    }

    try {
      const response = await fetch(`${BACKEND_API_BASE}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });

      const data = await response.json().catch(() => null);
//  applied rate limit 
      if (response.ok) {
        showToast("Message Sent!", `Thank you, ${contactData.name || "there"}! Your message has been sent.`);
        contactForm.reset();
      } else if (response.status === 429) {
        showToast("You've reached the daily limit of 2 messages. Please try again tomorrow.", true);
      } else {
        const errorMsg = (data && data.message) ? data.message : "Failed to send message. Please try again later.";
        showToast("Error Sending Message", errorMsg, true);
      }
    } catch (error) {
      console.error("Contact form error:", error);
      showToast("Connection Error", "Unable to connect to the backend server. Please try again later.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonHtml;
      }
    }
  });
});


// GitHub section: load developer stats, language distribution, and pinned repos


const GITHUB_USERNAME = "cs1m2414238";

const GITHUB_LANG_COLORS = {
  Java: "#b07219",
  Python: "#3572A5",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Makefile: "#6d8086",
  C: "#555555",
  "C++": "#f34b7d",
  Shell: "#89e051"
};

// Priority list to select the 3 featured repositories showcase
const FEATURED_REPO_NAMES = [
  "vidyutEV-1.0",
  "vidyut-1.1",
  "urban_heat_mitigation",
  "Text-Pro",
  "voiceFlowAi-v1.0"
];

// Helper to fetch with timeout so offline backend doesn't freeze the UI
async function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Copy profile URL helper
window.copyProfileUrl = function (event) {
  if (event) event.stopPropagation();
  const url = `https://github.com/${GITHUB_USERNAME}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast("Link Copied!", "GitHub profile link copied to clipboard.");
  }).catch(() => {
    showToast("Copy Failed", "Unable to copy to clipboard.", true);
  });
};

// Render compact developer identity card
function renderCompactGithubProfile(profile) {
  const profileEl = document.getElementById("github-profile");
  if (!profileEl) return;

  const displayName = profile.name && profile.name.trim() !== "" ? profile.name : "Priyanshu Sharma";
  const avatarUrl = profile.avatar_url || `https://avatars.githubusercontent.com/u/184855110?v=4`;
  const repoCount = profile.public_repos !== undefined ? profile.public_repos : 20;

  profileEl.innerHTML = `
    <div class="gh-compact-user">
      <div class="gh-compact-avatar-wrap">
        <img class="gh-compact-avatar" src="${avatarUrl}" alt="${displayName}" onerror="this.src='https://github.com/${GITHUB_USERNAME}.png'" />
        <span class="gh-pulse-dot" title="Active on GitHub"></span>
      </div>
      <div class="gh-compact-meta">
        <div class="gh-name-line">
          <h4>${displayName}</h4>
          <a class="gh-user-pill" href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener noreferrer">
            <i class="fa-brands fa-github"></i> @${GITHUB_USERNAME}
          </a>
        </div>
        <p class="gh-role-sub">Backend • AI/ML • Agentic Systems</p>
        <div class="gh-quick-tags">
          <span><i class="fa-solid fa-code-branch"></i> <strong>${repoCount}</strong> Public Repositories</span>
          <span><i class="fa-solid fa-location-dot"></i> Kanpur, India</span>
        </div>
      </div>
    </div>
    <div class="gh-identity-actions">
      <a class="secondary-button" href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener noreferrer">
        <i class="fa-brands fa-github"></i> Follow
      </a>
      <button class="icon-button" type="button" onclick="copyProfileUrl(event)" title="Copy GitHub Profile URL">
        <i class="fa-regular fa-copy"></i>
      </button>
    </div>
  `;
}

// Calculate and render language distribution bars dynamically
function renderLanguageBars(repos) {
  const container = document.getElementById("gh-languages-container");
  if (!container) return;

  const counts = {};
  let total = 0;

  (repos || []).forEach(repo => {
    if (repo.language && repo.language.trim() !== "") {
      counts[repo.language] = (counts[repo.language] || 0) + 1;
      total++;
    }
  });

  // Graceful standard distribution if offline/empty
  if (total === 0) {
    counts["Java"] = 8;
    counts["TypeScript"] = 4;
    counts["Python"] = 3;
    total = 15;
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  container.innerHTML = sorted.map(([lang, count]) => {
    const pct = Math.round((count / total) * 100);
    const color = GITHUB_LANG_COLORS[lang] || "var(--accent)";
    return `
      <div class="lang-bar-item">
        <div class="lang-bar-header">
          <span class="lang-name-tag">
            <span class="lang-dot" style="background-color: ${color};"></span>
            ${lang}
          </span>
          <span>${pct}%</span>
        </div>
        <div class="lang-bar-track">
          <div class="lang-bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
        </div>
      </div>
    `;
  }).join("");
}

// Render maximum 3 featured repository cards
function renderCompactRepos(repos) {
  const reposEl = document.getElementById("github-repos");
  if (!reposEl) return;

  // Pick the 3 featured repositories: Vidyut, Urban Heat Mitigation, Text Pro
  const repoMap = new Map();
  (repos || []).forEach(r => {
    if (r && r.name) repoMap.set(r.name.toLowerCase(), r);
  });

  const selectedRepos = [];

  // 1. Vidyut (prefer vidyutEV-1.0 or vidyut-1.1)
  const vidyutRepo = repoMap.get("vidyutev-1.0") || repoMap.get("vidyut-1.1");
  if (vidyutRepo) selectedRepos.push(vidyutRepo);
  else selectedRepos.push({
    name: "vidyutEV-1.0",
    description: "Autonomous AI-powered EV charging ecosystem with intelligent journey planning, station failover rerouting, and dynamic grid telemetry.",
    language: "Java",
    stargazers_count: 1,
    forks_count: 0,
    html_url: `https://github.com/${GITHUB_USERNAME}/vidyutEV-1.0`
  });

  // 2. Amazon ML Challenge
  const mlRepo = repoMap.get("amazonml") || repoMap.get("amazon-ml-challenge-2026");
  if (mlRepo) selectedRepos.push(mlRepo);
  else selectedRepos.push({
    name: "amazonML",
    description: "High-throughput machine learning solution with multimodal feature extraction, text/image embeddings, and ensemble models.",
    language: "Python",
    stargazers_count: 1,
    forks_count: 0,
    html_url: `https://github.com/${GITHUB_USERNAME}/amazonML`
  });

  // 3. Urban Heat Mitigation
  const heatRepo = repoMap.get("urban_heat_mitigation");
  if (heatRepo) selectedRepos.push(heatRepo);
  else selectedRepos.push({
    name: "urban_heat_mitigation",
    description: "Geospatial satellite telemetry & environmental simulation pipeline to model urban heat islands and climate-resilient cooling infrastructure.",
    language: "TypeScript",
    stargazers_count: 1,
    forks_count: 1,
    html_url: `https://github.com/${GITHUB_USERNAME}/urban_heat_mitigation`
  });

  // Ensure maximum 3 cards
  const finalThree = selectedRepos.slice(0, 3);

  reposEl.innerHTML = finalThree.map(repo => {
    const lang = repo.language || "Code";
    const color = GITHUB_LANG_COLORS[lang] || "var(--accent)";
    const desc = repo.description || "Production-grade engineering project built with scalable architecture and clean code.";
    const repoUrl = repo.html_url || `https://github.com/${GITHUB_USERNAME}/${repo.name}`;

    return `
      <article class="compact-repo-card">
        <div class="compact-repo-top">
          <div class="compact-repo-head">
            <a class="compact-repo-title" href="${repoUrl}" target="_blank" rel="noopener noreferrer">
              <i class="fa-regular fa-folder-closed"></i> ${repo.name}
            </a>
            <span class="compact-repo-badge">Public</span>
          </div>
          <p class="compact-repo-desc">${desc}</p>
        </div>
        <div class="compact-repo-footer">
          <div class="compact-repo-meta">
            <span class="repo-lang">
              <span class="lang-dot" style="background-color: ${color};"></span>
              ${lang}
            </span>
            <span class="repo-stat-item" title="Stars">
              <i class="fa-solid fa-star"></i> ${repo.stargazers_count || 0}
            </span>
            <span class="repo-stat-item" title="Forks">
              <i class="fa-solid fa-code-fork"></i> ${repo.forks_count || 0}
            </span>
          </div>
          <a class="compact-repo-link" href="${repoUrl}" target="_blank" rel="noopener noreferrer">
            View <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </article>
    `;
  }).join("");
}

// Master function to load GitHub data
async function loadGithub() {
  const statusIndicator = document.getElementById("github-status");
  const statusText = document.getElementById("github-status-text");

  let profile = null;
  let repos = null;

  // 1. Try local Spring Boot proxy first
  try {
    const [profileRes, reposRes] = await Promise.all([
      fetchWithTimeout(`${BACKEND_API_BASE}/api/github/profile`, {}, 3000),
      fetchWithTimeout(`${BACKEND_API_BASE}/api/github/repos`, {}, 3000)
    ]);
    if (profileRes.ok && reposRes.ok) {
      profile = await profileRes.json();
      repos = await reposRes.json();
    }
  } catch (e) {
    // Local proxy offline
  }

  // 2. Fallback to public GitHub API
  if (!profile || !repos) {
    try {
      const [pubProfileRes, pubReposRes] = await Promise.all([
        fetchWithTimeout(`https://api.github.com/users/${GITHUB_USERNAME}`, {
          headers: { Accept: "application/vnd.github.v3+json" }
        }, 3000),
        fetchWithTimeout(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=30`, {
          headers: { Accept: "application/vnd.github.v3+json" }
        }, 3000)
      ]);

      if (pubProfileRes.ok && pubReposRes.ok) {
        profile = await pubProfileRes.json();
        repos = await pubReposRes.json();
      }
    } catch (e) {
      // API rate limited or offline
    }
  }

  // 3. Fallback defaults if network is offline
  if (!profile) {
    profile = {
      name: "Priyanshu Sharma",
      login: GITHUB_USERNAME,
      public_repos: 20,
      avatar_url: "https://avatars.githubusercontent.com/u/184855110?v=4"
    };
  }

  // Render the components
  renderCompactGithubProfile(profile);
  renderLanguageBars(repos);
  renderCompactRepos(repos);

  if (statusIndicator && statusText) {
    statusIndicator.innerHTML = '<span class="sync-dot"></span> <span id="github-status-text">Connected</span>';
  }
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadGithub);
} else {
  loadGithub();
}
