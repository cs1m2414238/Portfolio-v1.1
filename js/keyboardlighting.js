const keys = document.querySelectorAll(".key");

// Hide elements immediately on script execution to prevent flashing
gsap.set([".key-legend-qwerty", ".key i"], { opacity: 0 });
gsap.set(".skill-board", { opacity: 0, scale: 0.95, y: 25 });

function runBootAnimation() {
  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" }
  });

  // 1. Load Board (Chassis & socket area)
  tl.to(".skill-board", {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.85,
    ease: "back.out(1.1)"
  });

  // 2. Blink each text (legend) 3 times 
  tl.to(".key-legend-qwerty", {
    opacity: 0.55,
    duration: 0.28,
    repeat: 4,
    yoyo: true,
    stagger: () => Math.random() * 0.6,
    ease: "power1.inOut"
  }, "+=0.15");

  // 4. Load all logos (blink randomized in the same manner)
  tl.to(".key i", {
    opacity: 1,
    duration: 0.28,
    repeat: 4,
    yoyo: true,
    stagger: () => Math.random() * 0.6,
    ease: "power1.inOut",
    onComplete: () => {
      // Add booted class to all keys to apply final stylesheet opacities
      keys.forEach(k => k.classList.add("booted"));

      // Clear inline opacity so standard hover state transition works
      gsap.set(".key-legend-qwerty", { clearProps: "opacity" });
      gsap.set(".key i", { clearProps: "opacity" });
      
      // Clear inline transform on the skill board so the CSS 3D hover/tilt works
      gsap.set(".skill-board", { clearProps: "transform" });


      // Open GitHub profile when clicking the GitHub key icon
      
      const gitbtn = document.querySelector(".key i.fa-github");
      if(gitbtn){
        gitbtn.addEventListener('click', () =>{
          window.open('https://github.com/cs1m2414238', '_blank')
        });
      }

      // Enable the terminal continuous prompt cursor blink
      const termIcon = document.querySelector(".key i.fa-terminal");
      if (termIcon) {
        termIcon.classList.add("cursor-active");
      }
    }
  }, "+=0.15");
}

function runLightingWave() {
  keys.forEach((key, index) => {
    // Stagger the activation of each key
    setTimeout(() => {
        key.classList.add("is-lit");
        key.classList.add("is-pressed");
          
        // Release the key physically and turn off its light after a short delay
        setTimeout(() => {
            key.classList.remove("is-pressed");
        }, 250);
        setTimeout(() => {
            key.classList.remove("is-lit");
        }, 400);
    }, index * 60);
  });
}

// Map both night and dawn wave functions to the same high-performance sweep logic
const runLightingWaveDawn = runLightingWave;

// Trigger the boot animation automatically when the welcome preloader screen finishes
window.addEventListener("preloaderFinished", () => {
  setTimeout(runBootAnimation, 400);
});

// Fallback: run the boot animation on load if the preloader isn't present
function triggerBootIfReady() {
  if (!document.querySelector(".loading")) {
    setTimeout(runBootAnimation, 400);
  }
}

if (document.readyState === "complete") {
  triggerBootIfReady();
} else {
  window.addEventListener("load", triggerBootIfReady);
}

const themeToggleBtn = document.querySelector("#theme-toggle");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    // Run the sweep wave right as the theme transition finishes
    setTimeout(runLightingWave, 700);
  });
}
