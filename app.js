// app.js — Kapé frontend behavior (module)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


const SUPABASE_URL = 'https://vwxkuhjlkcvdpedehwcu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eGt1aGpsa2N2ZHBlZGVod2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTQ1NTksImV4cCI6MjA3NjAzMDU1OX0.yvMeomhLoqU3hSaLHhxL9YwmPBFWNzKDg79Pi0ZXpxg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const q = (sel, root = document) => root.querySelector(sel);


function initRegisterFlow() {
  // Only bind on the Register page (uses the .page-register body class + .lead-form)
  const form = q('.page-register form.lead-form');
  if (!form) return;

  const get = (id) => form.querySelector(`#${id}`);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = get('email')?.value.trim();
    const password = get('password')?.value || '';
    const confirm = get('confirm_password')?.value || '';

    if (!email || !password) {
      alert('Email and password are required.');
      return;
    }
    if (password !== confirm) {
      alert('Passwords do not match. Please re-enter.');
      get('confirm_password')?.focus();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {

        emailRedirectTo: `${window.location.origin}/signin.html`,
      },
    });

    if (error) {
      alert(error.message);
      return;
    }


    const user = data.user;
    if (user) {
      const payload = {
        user_id: user.id,
        first_name: get('first_name')?.value || null,
        last_name: get('last_name')?.value || null,
        phone: get('phone')?.value || null,
        address: get('address')?.value || null,
        city: get('city')?.value || null,
        postal: get('postal')?.value || null,
        country: get('country')?.value || null,
        interest: get('interest')?.value || null,
        message: get('message')?.value || null,
      };

      const { error: pErr } = await supabase.from('profiles').insert(payload);
      if (pErr) {
        alert(pErr.message);
        return;
      }
    }


    alert('Account created! Check your email to verify (if required), then sign in.');
    window.location.href = 'signin.html';
  });
}


function initRegisterValidation() {
  const form = q('.page-register form.lead-form');
  if (!form) return;

  const password = q('#password', form);
  const confirm = q('#confirm_password', form);
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


function initSignInFlow() {
  const form = q('#signin-form');
  if (!form) return;

  const emailEl = q('#signin_email', form);
  const passEl = q('#signin_password', form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailEl?.value.trim();
    const password = passEl?.value || '';

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      return;
    }

    alert('Signed in!');
    // Redirect somewhere useful (home for now)
    window.location.href = 'index.html';
  });
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
    if (!res.ok) return; // keep original static HTML as-is
    const products = await res.json();
    if (!Array.isArray(products) || !products.length) return;

    const html = products.map(p => {
      const img = (p.image || 'Images/kape%20bag-final.png').replace(/"/g, '&quot;');
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
    // If JSON fails, we keep the static HTML
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initRegisterValidation();
  initRegisterFlow();
  initSignInFlow();
  initRevealAnimations();
  initDynamicProducts();
});
