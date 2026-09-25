document.getElementById('year').textContent = new Date().getFullYear();

// Scroll reveal
const revealTargets = document.querySelectorAll(
  '.reel-tag, .polaroid-cluster, .filmstrip, .and-more, .about-note, .polaroid--about, .contact h2, .contact-email'
);
revealTargets.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealTargets.forEach(el => observer.observe(el));
