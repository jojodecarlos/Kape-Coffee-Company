
function initRegisterValidation() {
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
}


function initRevealAnimations(root = document) {
  const targets = root.querySelectorAll('.card, .lead h2, .lead p');
  if (!('IntersectionObserver' in window) || !targets.length) return;

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

  targets.forEach((el) => {
    if (!el.dataset.revealInit) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(14px)';
      el.dataset.revealInit = '1';
    }
    io.observe(el);
  });
}

async function initDynamicProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  try {
    const res = await fetch('products.json', { cache: 'no-store' });
    if (!res.ok) return; // leave original static HTML as-is
    const products = await res.json();
    if (!Array.isArray(products) || !products.length) return;

    const html = products.map(p => {
      const img = (p.image || 'Images/kape%20bag-final.png')
        .replace(/"/g, '&quot;');
      const alt = (p.alt || '').replace(/"/g, '&quot;');
      const origin = p.origin ? `
        <li class="option on"><span class="dot" aria-hidden="true"></span> ${p.origin}</li>` : '';
      const roast = p.roast ? `
        <li class="option on"><span class="dot" aria-hidden="true"></span> ${p.roast} Roast</li>` : '';

      return `
        <article class="card">
          <div class="bag" aria-hidden="true">
            <img src="${img}" alt="${alt}">
          </div>
          <h3>${p.name || ''}</h3>
          <p class="notes">${p.notes || ''}</p>
          <ul class="specs">
            ${origin}
            ${roast}
          </ul>
          <a class="btn cta" href="register.html">Get Notified</a>
        </article>`;
    }).join('');

    grid.innerHTML = html;

    initRevealAnimations(grid);
  } catch (_) {
  }
}


document.addEventListener('DOMContentLoaded', () => {
  initRegisterValidation();
  initRevealAnimations();
  initDynamicProducts();
});
