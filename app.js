

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


const SUPABASE_URL = 'https://vwxkuhjlkcvdpedehwcu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eGt1aGpsa2N2ZHBlZGVod2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTQ1NTksImV4cCI6MjA3NjAzMDU1OX0.yvMeomhLoqU3hSaLHhxL9YwmPBFWNzKDg79Pi0ZXpxg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const $ = (sel, root = document) => root.querySelector(sel);
const setText = (el, text) => { if (el) el.textContent = text; };
const setStatus = (id, msg) => { const el = document.getElementById(id); if (el) el.textContent = msg || ''; };


async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'signin.html';
    return null;
  }
  return session;
}

async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'signin.html';
}


function initRegisterFlow() {
  const form = $('.page-register form.lead-form');
  if (!form || window.location.pathname.endsWith('/profile.html')) return; // not on profile

  const get = (id) => form.querySelector(`#${id}`);

  form.addEventListener('submit', async (e) => {
    if (!window.location.pathname.endsWith('/register.html')) return;
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

    if (error) return alert(error.message);

    if (data.session && data.user) {
      const payload = {
        user_id: data.user.id,
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
      if (pErr) return alert(pErr.message);
    }

    alert('Account created! Check your email to verify (if required), then sign in.');
    window.location.href = 'signin.html';
  });
}


async function ensureProfileExists(session) {
  const user = session?.user;
  if (!user) return;
  const { data, error } = await supabase.from('profiles').select('user_id').eq('user_id', user.id).maybeSingle();
  if (error) return; // ignore
  if (!data) {
    // create an empty profile row owned by the user
    await supabase.from('profiles').insert({ user_id: user.id });
  }
}


function initSignInFlow() {
  const form = $('#signin-form');
  if (!form) return;

  const emailEl = $('#signin_email', form);
  const passEl = $('#signin_password', form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailEl.value.trim(),
      password: passEl.value
    });
    if (error) return alert(error.message);

    if (data.session) await ensureProfileExists(data.session);

    window.location.href = 'profile.html';
  });
}


async function initProfileDashboard() {
  if (!window.location.pathname.endsWith('/profile.html')) return;

  const session = await requireAuth();
  if (!session) return;

  const user = session.user;
  setText($('#profile-email'), `Signed in as ${user.email || ''}`);

  $('#signout-btn')?.addEventListener('click', async () => { await signOut(); });

  const { data: prof, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) setStatus('profile-status', error.message);


  if (!prof) {
    await supabase.from('profiles').insert({ user_id: user.id });
  }


  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();


  const form = $('#profile-form');
  const fill = (id, v) => { const el = $(`#${id}`, form); if (el) el.value = v || ''; };
  fill('first_name', profile?.first_name);
  fill('last_name', profile?.last_name);
  fill('phone', profile?.phone);
  fill('address', profile?.address);
  fill('city', profile?.city);
  fill('postal', profile?.postal);
  fill('country', profile?.country);
  fill('interest', profile?.interest);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('profile-status', 'Saving...');
    const payload = {
      first_name: $('#first_name', form)?.value || null,
      last_name: $('#last_name', form)?.value || null,
      phone: $('#phone', form)?.value || null,
      address: $('#address', form)?.value || null,
      city: $('#city', form)?.value || null,
      postal: $('#postal', form)?.value || null,
      country: $('#country', form)?.value || null,
      interest: $('#interest', form)?.value || null,
      updated_at: new Date().toISOString(),
    };
    const { error: upErr } = await supabase
      .from('profiles')
      .update(payload)
      .eq('user_id', user.id);
    if (upErr) return setStatus('profile-status', upErr.message);
    setStatus('profile-status', 'Profile saved.');
  });


  const pwForm = $('#password-form');
  pwForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('password-status', 'Updating password...');
    const oldPw = $('#old_password', pwForm).value;
    const newPw = $('#new_password', pwForm).value;
    const newPw2 = $('#new_password_confirm', pwForm).value;
    if (newPw.length < 8) return setStatus('password-status', 'New password must be at least 8 characters.');
    if (newPw !== newPw2) return setStatus('password-status', 'New passwords do not match.');


    const email = user.email;
    const { error: reauthErr } = await supabase.auth.signInWithPassword({ email, password: oldPw });
    if (reauthErr) return setStatus('password-status', 'Current password is incorrect.');


    const { error: updErr } = await supabase.auth.updateUser({ password: newPw });
    if (updErr) return setStatus('password-status', updErr.message);

    setStatus('password-status', 'Password updated successfully.');

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
    if (!res.ok) return;
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
  } catch (_) { /* keep static HTML */ }
}


document.addEventListener('DOMContentLoaded', async () => {
  initRegisterFlow();
  initSignInFlow();
  initRevealAnimations();
  initDynamicProducts();


  await initProfileDashboard();
});
