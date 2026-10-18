window.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const welcomeTexts = Array.from(document.querySelectorAll(".welcome-text"));
  const targetElements = [".site-header", "main", ".site-footer"];
  const loadingScreen = document.querySelector(".loading");

  if (!loadingScreen || welcomeTexts.length === 0) return;

  // Never leave the portfolio covered if the animation library cannot load.
  if (typeof gsap === "undefined") {
    loadingScreen.remove();
    window.dispatchEvent(new CustomEvent("preloaderFinished"));
    return;
  }

  // lock user scroll while loading
  body.classList.add("lock-scroll");

  // prepare initial states
  gsap.set(targetElements, { y: 40, opacity: 0 });

  // create preloader timeline
  const timeline = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    onComplete: () => {
      // clean up preloader and restore scrolling once animation concludes
      //  to bring back scroll functionality
      body.classList.remove("lock-scroll");
      if (loadingScreen) loadingScreen.remove();
      window.dispatchEvent(new CustomEvent("preloaderFinished"));
      console.log("Welcome screen animation completed.");
    }
  });

  // multilingual text cross-fade cycle
  welcomeTexts.forEach((text, index) => {
    const isFirst = index === 0;
    const isLast = index === welcomeTexts.length - 1;
    
    // hold first and last words slightly longer
    const holdTime = isFirst ? 0.65 : isLast ? 0.65 : 0.15;

    if (isFirst) {
      timeline.to(text, { opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.5 });
    } else {
      timeline.set(text, { opacity: 1 });
    }

    if (!isLast) {
      timeline.set(text, { opacity: 0 }, `+=${holdTime}`);
    }
  });

  // slide up greeting container
  timeline.to(".text", {
    y: -60,
    opacity: 0,
    duration: 0.5,
    ease: "power3.inOut"
  }, "+=0.3");

  // exit transition sequence
  timeline.to(loadingScreen, {
    y: "-100%",
    duration: 0.95,
    ease: "expo.out"
  }, "-=0.15")
  .to(".loading-round", {
    height: 0,
    duration: 0.95,
    ease: "expo.out"
  }, "-=0.65")
  .to(targetElements, {
    y: 0,
    opacity: 1,
    duration: 0.95,
    ease: "expo.out",
    stagger: 0.05
  }, "-=0.88");
});
