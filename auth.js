/* ═══════════════════════════════════════════════════════════
   AUTH.JS — Login, register, role switching
═══════════════════════════════════════════════════════════ */

const ADMIN_PASSWORD = 'admin'; // Change this to a strong password

/* ── Redirect if already logged in ── */
(function () {
  const session = JSON.parse(localStorage.getItem('lq_session') || 'null');
  if (session) {
    window.location.href = session.role === 'admin' ? 'admin.html' : 'client.html';
  }
})();

/* ── Role / sub-tab UI ── */
function switchRole(role) {
  document.querySelectorAll('.role-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.role === role);
  });
  document.getElementById('clientPanel').classList.toggle('hidden', role !== 'client');
  document.getElementById('adminPanel').classList.toggle('hidden', role !== 'admin');
}

function switchSub(sub) {
  document.querySelectorAll('.sub-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && sub === 'signin') || (i === 1 && sub === 'register'));
  });
  document.getElementById('clientSignin').classList.toggle('hidden', sub !== 'signin');
  document.getElementById('clientRegister').classList.toggle('hidden', sub !== 'register');
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}
function clearError(id) {
  document.getElementById(id).classList.add('hidden');
}

/* ── Client Sign In ── */
function clientSignIn() {
  clearError('clientSigninError');
  const email = document.getElementById('clientEmail').value.trim();
  const pass  = document.getElementById('clientPassword').value;
  if (!email || !pass) { showError('clientSigninError', 'Please fill in all fields.'); return; }

  const result = LQ.loginUser(email, pass);
  if (result.error) { showError('clientSigninError', result.error); return; }

  LQ.saveSession({ role: 'client', email: result.user.email, name: result.user.name });
  window.location.href = 'client.html';
}

/* ── Client Register ── */
function clientRegister() {
  clearError('regError');
  const name    = document.getElementById('regName').value.trim();
  const email   = document.getElementById('regEmail').value.trim();
  const pass    = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;

  if (!name || !email || !pass || !confirm) { showError('regError', 'Please fill in all fields.'); return; }
  if (pass.length < 8) { showError('regError', 'Password must be at least 8 characters.'); return; }
  if (pass !== confirm) { showError('regError', 'Passwords do not match.'); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { showError('regError', 'Please enter a valid email.'); return; }

  const result = LQ.registerUser(name, email, pass);
  if (result.error) { showError('regError', result.error); return; }

  LQ.saveSession({ role: 'client', email: result.user.email, name: result.user.name });
  window.location.href = 'client.html';
}

/* ── Admin Sign In ── */
function adminSignIn() {
  clearError('adminError');
  const pass = document.getElementById('adminPassword').value;
  if (!pass) { showError('adminError', 'Please enter the admin password.'); return; }
  if (pass !== ADMIN_PASSWORD) { showError('adminError', 'Incorrect password.'); return; }

  LQ.saveSession({ role: 'admin' });
  window.location.href = 'admin.html';
}
