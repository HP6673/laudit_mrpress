/* ═══════════════════════════════════════════════════════════
   STORAGE.JS — Local data layer
   All data is stored in localStorage (JSON).
   Keys:
     lq_users      → array of { id, name, email, password, createdAt }
     lq_projects   → array of { id, name, company, desc, invitedEmails[], files[], createdAt }
     lq_session    → { role: 'admin'|'client', email?, name? }
     lq_q_{email}  → questionnaire responses for that client

   FOR GITHUB STORAGE:
   Replace the get/set functions below with GitHub API calls.
   See README.md for the GitHub integration guide.
═══════════════════════════════════════════════════════════ */

window.LQ = window.LQ || {};

/* ── Helpers ── */
LQ.getUsers    = () => JSON.parse(localStorage.getItem('lq_users')    || '[]');
LQ.getProjects = () => JSON.parse(localStorage.getItem('lq_projects') || '[]');
LQ.getSession  = () => JSON.parse(localStorage.getItem('lq_session')  || 'null');

LQ.saveUsers    = (u) => localStorage.setItem('lq_users',    JSON.stringify(u));
LQ.saveProjects = (p) => localStorage.setItem('lq_projects', JSON.stringify(p));
LQ.saveSession  = (s) => localStorage.setItem('lq_session',  JSON.stringify(s));

LQ.clearSession = () => localStorage.removeItem('lq_session');

LQ.getQuestionnaire = (email) => JSON.parse(localStorage.getItem('lq_q_' + email) || 'null');
LQ.saveQuestionnaire = (email, data) => localStorage.setItem('lq_q_' + email, JSON.stringify(data));

/* ── Auth helpers ── */
LQ.findUser = (email) => LQ.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());

LQ.registerUser = (name, email, password) => {
  const users = LQ.getUsers();
  if (LQ.findUser(email)) return { error: 'An account with this email already exists.' };
  const user = { id: Date.now().toString(), name, email: email.toLowerCase(), password, createdAt: new Date().toISOString() };
  users.push(user);
  LQ.saveUsers(users);
  return { user };
};

LQ.loginUser = (email, password) => {
  const user = LQ.findUser(email);
  if (!user) return { error: 'No account found with this email.' };
  if (user.password !== password) return { error: 'Incorrect password.' };
  return { user };
};

/* ── Project helpers ── */
LQ.createProject = (name, company, desc, invitedEmails) => {
  const projects = LQ.getProjects();
  const proj = {
    id: Date.now().toString(),
    name, company, desc,
    invitedEmails: invitedEmails.map(e => e.toLowerCase()),
    files: [],
    createdAt: new Date().toISOString()
  };
  projects.push(proj);
  LQ.saveProjects(projects);
  return proj;
};

LQ.getProjectsForEmail = (email) => {
  return LQ.getProjects().filter(p => p.invitedEmails.includes(email.toLowerCase()));
};

LQ.addFileToProject = (projectId, fileInfo) => {
  const projects = LQ.getProjects();
  const proj = projects.find(p => p.id === projectId);
  if (!proj) return false;
  proj.files.push(fileInfo);
  LQ.saveProjects(projects);
  return true;
};

LQ.removeFileFromProject = (projectId, fileId) => {
  const projects = LQ.getProjects();
  const proj = projects.find(p => p.id === projectId);
  if (!proj) return false;
  proj.files = proj.files.filter(f => f.id !== fileId);
  LQ.saveProjects(projects);
  return true;
};

/* ── Guard: redirect if not logged in ── */
LQ.requireAuth = (expectedRole) => {
  const session = LQ.getSession();
  if (!session) { window.location.href = 'login.html'; return null; }
  if (expectedRole && session.role !== expectedRole) {
    window.location.href = session.role === 'admin' ? 'admin.html' : 'client.html';
    return null;
  }
  return session;
};

/* ── Logout ── */
LQ.logout = () => {
  LQ.clearSession();
  window.location.href = 'login.html';
};
window.logout = LQ.logout;
