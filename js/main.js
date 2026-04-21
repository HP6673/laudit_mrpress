/* ═══════════════════════════════════════════════════════════
   MAIN.JS — General page interactions
═══════════════════════════════════════════════════════════ */

// Nav scroll state
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// Staggered card entrance
const cards = document.querySelectorAll('.card');
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity    = '1';
        entry.target.style.transform  = 'translateY(0)';
      }, i * 120);
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

cards.forEach(card => {
  card.style.opacity   = '0';
  card.style.transform = 'translateY(28px)';
  card.style.transition = 'opacity 0.6s ease, transform 0.6s ease, border-color 0.3s';
  cardObserver.observe(card);
});

// Stat number entrance
const stats = document.querySelectorAll('.stat');
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateX(0)';
      }, i * 150);
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

stats.forEach(stat => {
  stat.style.opacity   = '0';
  stat.style.transform = 'translateX(-20px)';
  stat.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  statObserver.observe(stat);
});
