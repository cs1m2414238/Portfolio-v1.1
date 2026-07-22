const body = document.body;
const progressBar = document.querySelector("#progress-bar");
const menuToggle = document.querySelector("#menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const menuScrim = document.querySelector("#menu-scrim");
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
  const randomX = translateXOptions[Math.floor(Math.random() * translateXOptions.length)];
  const randomY = translateYOptions[Math.floor(Math.random() * translateYOptions.length)];
  // GPU compositor layer only — zero layout recalculation
  blob.style.transform = `translate3d(${randomX}px, ${randomY}px, 0)`;
}

ambientBlobs.forEach((blob) => {
  blob.addEventListener("animationiteration", () => {
    shuffleBlobPosition(blob);
  });
});



const setMenuState = (open) => {
  if (mobileMenu) mobileMenu.classList.toggle("is-open", open);
  if (menuScrim) menuScrim.classList.toggle("is-open", open);
  if (menuToggle) menuToggle.setAttribute("aria-expanded", String(open));
};

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mobileMenu ? mobileMenu.classList.contains("is-open") : false;
    setMenuState(!isOpen);
  });
}

if (menuScrim) {
  menuScrim.addEventListener("click", () => setMenuState(false));
}

if (mobileMenu) {
  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });
}

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

  if (!document.startViewTransition) {
    body.dataset.theme = nextTheme;
    updateIcon(nextTheme);
    return;
  }

  const transition = document.startViewTransition(() => {
    body.dataset.theme = nextTheme;
  });

  transition.ready.then(() => {
    const x = e.clientX;
    const y = e.clientY;

    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Going light → expand new (dawn) from click point (the button)
    // Going dark  → expand new (night) from the OPPOSITE corner of the screen
    //               so dark sweeps in from far away, not back into the button
    const originX = isDark ? (x < window.innerWidth  / 2 ? window.innerWidth  : 0) : x;
    const originY = isDark ? (y < window.innerHeight / 2 ? window.innerHeight : 0) : y;

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${originX}px ${originY}px)`,
          `circle(${radius}px at ${originX}px ${originY}px)`
        ]
      },
      {
        duration: 650,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
        pseudoElement: "::view-transition-new(root)"
      }
    );
  });

  // Update icon after transition completes
  transition.finished.then(() => updateIcon(nextTheme));
});

//  HEADER SHRINK ON SCROLL

const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {

  if (window.scrollY > 40) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }

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

const updateProgressBar = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${progress}%`;
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

revealItems.forEach((item) => revealObserver.observe(item));

if (boardShell) {
  boardShell.addEventListener("pointermove", (event) => {
    const rect = boardShell.getBoundingClientRect();
    const percentX = (event.clientX - rect.left) / rect.width - 0.5;
    const percentY = (event.clientY - rect.top) / rect.height - 0.5;

    boardShell.style.setProperty("--tilt-x", `${percentY * -7}deg`);
    boardShell.style.setProperty("--tilt-z", `${percentX * 9}deg`);
  });

  boardShell.addEventListener("pointerleave", () => {
    boardShell.style.setProperty("--tilt-x", "0deg");
    boardShell.style.setProperty("--tilt-z", "0deg");
  });
}

window.addEventListener("scroll", updateProgressBar, { passive: true });
window.addEventListener("load", () => {
  updateProgressBar();
  const skillShell = document.querySelector('.skill-board-shell');
  if (skillShell) {
    skillShell.classList.add('glow-active');
    setTimeout(() => skillShell.classList.remove('glow-active'), 2100);
  }
});

// Keyboard and click interactive features for the skill keys
const keysList = document.querySelectorAll(".key");
const physicalKeys = [
  "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", // Row 1
  "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", // Row 2
  "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", // Row 3
  "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB"  // Row 4
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
document.addEventListener("DOMContentLoaded",() => {
  
  const roles = [
    "Priyanshu Sharma",
    "Problem Solver",
    "Full Stack Developer",
    "Backend Developer",
    "Java Developer"
  ];

  const typingElement = document.getElementById('typing');
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
  const scheduleRows = document.querySelectorAll(".schedule-row");
  scheduleRows.forEach(row => {
    const card = row.querySelector(".schedule-card");
    if (card) {
      const activateRow = () => {
        scheduleRows.forEach(r => {
          r.classList.remove("active");
          const c = r.querySelector(".schedule-card");
          if (c) c.classList.remove("active-gradient");
        });
        row.classList.add("active");
        card.classList.add("active-gradient");
      };

      row.addEventListener("mouseenter", activateRow);
      row.addEventListener("click", activateRow);
    }
  });
});
