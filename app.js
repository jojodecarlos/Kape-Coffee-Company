// Minimal, style-safe enhancements for Kapé

// 1) Client-side validation for Register (password match)
(function () {
  const form = document.querySelector('.lead-form');
  if (!form) return;

  const password = document.querySelector('#password');
  const confirm = document.querySelector('#confirm_password');

  if (password && confirm) {
    form.addEventListener('submit', (e) => {
      if (password.value !== confirm.value) {
        e.preventDefault();
        alert('Passwords do not match. Please re-enter.');
        confirm.focus();
      }
    });
  }
})();

// 2) Lightweight reveal-on-scroll (no CSS changes required)
(function () {
  const revealTargets = document.querySelectorAll('.card, .lead h2, .lead p');
  if (!('IntersectionObserver' in window) || !revealTargets.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.transition = 'opacity .6s ease, transform .6s ease';
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'none';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    io.observe(el);
  });
})();
