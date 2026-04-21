/* ═══════════════════════════════════════════════════════════
   ADMIN.JS — Admin dashboard logic
═══════════════════════════════════════════════════════════ */

// ── Auth guard ──
const session = LQ.requireAuth('admin');
if (!session) throw new Error('Not authenticated');

let currentProjectId = null;
let invitedEmails    = [];

// ── Tab switching ──
function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('tab-' + name).classList.remove('hidden');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`[onclick="showTab('${name}')"]`).classList.add('active');

  if (name === 'clients')       renderClientsTable();
  if (name === 'projects')      renderProjects();
  if (name === 'questionnaire') renderQuestionnaires();
}

// ── Projects ──
function renderProjects() {
  const grid = document.getElementById('projectGrid');
  const projects = LQ.getProjects();
  if (!projects.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📁</div><p>No projects yet. Create your first one.</p></div>';
    return;
  }
  grid.innerHTML = projects.map(p => `
    <div class="project-card" onclick="openProjectDetail('${p.id}')">
      <div class="project-card-name">${esc(p.name)}</div>
      <div class="project-card-company">${esc(p.company)}</div>
      <div class="project-card-desc">${esc(p.desc || '—')}</div>
      <div class="project-card-meta">
        <span>👥 ${p.invitedEmails.length} client(s)</span>
        <span>📎 ${p.files.length} file(s)</span>
      </div>
    </div>
  `).join('');
}

// ── Clients table ──
function renderClientsTable() {
  const users = LQ.getUsers();
  const projects = LQ.getProjects();
  const tbody = document.getElementById('clientsBody');
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--muted);text-align:center;padding:2rem">No registered clients yet.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => {
    const projCount = projects.filter(p => p.invitedEmails.includes(u.email)).length;
    const date = new Date(u.createdAt).toLocaleDateString();
    return `<tr>
      <td>${esc(u.name)}</td>
      <td>${esc(u.email)}</td>
      <td>${date}</td>
      <td>${projCount}</td>
    </tr>`;
  }).join('');
}

// ── Questionnaires ──
function renderQuestionnaires() {
  const users = LQ.getUsers();
  const container = document.getElementById('questionnaireList');
  const responses = users.map(u => ({ user: u, data: LQ.getQuestionnaire(u.email) })).filter(r => r.data);
  if (!responses.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No questionnaire responses yet.</p></div>';
    return;
  }
  container.innerHTML = responses.map(({ user, data }) => `
    <div class="q-response-card">
      <h3>${esc(user.name)} — ${esc(user.email)}</h3>
      ${Object.entries(data).map(([k, v]) => v ? `
        <div class="q-row">
          <span class="q-label">${formatKey(k)}</span>
          <span class="q-val">${esc(v)}</span>
        </div>` : '').join('')}
    </div>
  `).join('');
}

function formatKey(k) {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

// ── New project modal ──
function openNewProjectModal() {
  invitedEmails = [];
  renderChips();
  document.getElementById('projName').value    = '';
  document.getElementById('projCompany').value = '';
  document.getElementById('projDesc').value    = '';
  document.getElementById('inviteSearch').value = '';
  document.getElementById('emailDropdown').classList.add('hidden');
  document.getElementById('newProjectModal').classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  currentProjectId = null;
}

function createProject() {
  const name    = document.getElementById('projName').value.trim();
  const company = document.getElementById('projCompany').value.trim();
  const desc    = document.getElementById('projDesc').value.trim();
  if (!name || !company) { alert('Project name and company are required.'); return; }

  LQ.createProject(name, company, desc, invitedEmails);
  closeModal('newProjectModal');
  renderProjects();
}

// ── Email search dropdown ──
function searchClients(query) {
  const dropdown = document.getElementById('emailDropdown');
  if (!query.trim()) { dropdown.classList.add('hidden'); return; }

  const users = LQ.getUsers();
  const q     = query.toLowerCase();
  const matches = users.filter(u =>
    (u.email.includes(q) || u.name.toLowerCase().includes(q)) &&
    !invitedEmails.includes(u.email)
  );

  if (!matches.length) { dropdown.classList.add('hidden'); return; }

  dropdown.innerHTML = matches.map(u => `
    <div class="email-option" onclick="addInvite('${esc(u.email)}', '${esc(u.name)}')">
      <strong>${esc(u.name)}</strong> <span style="color:var(--muted)">${esc(u.email)}</span>
    </div>
  `).join('');
  dropdown.classList.remove('hidden');
}

function addInvite(email, name) {
  if (!invitedEmails.includes(email)) invitedEmails.push(email);
  document.getElementById('inviteSearch').value = '';
  document.getElementById('emailDropdown').classList.add('hidden');
  renderChips();
}

function removeInvite(email) {
  invitedEmails = invitedEmails.filter(e => e !== email);
  renderChips();
}

function renderChips() {
  const container = document.getElementById('invitedChips');
  container.innerHTML = invitedEmails.map(e => `
    <div class="chip">${esc(e)}<button onclick="removeInvite('${esc(e)}')">✕</button></div>
  `).join('');
}

// ── Project detail modal ──
function openProjectDetail(id) {
  const project = LQ.getProjects().find(p => p.id === id);
  if (!project) return;
  currentProjectId = id;

  document.getElementById('detailProjectName').textContent    = project.name;
  document.getElementById('detailProjectCompany').textContent = project.company;
  document.getElementById('detailProjectDesc').textContent    = project.desc || '';

  // Invited clients chips
  const clientsEl = document.getElementById('detailClients');
  clientsEl.innerHTML = project.invitedEmails.length
    ? project.invitedEmails.map(e => `<div class="chip">${esc(e)}</div>`).join('')
    : '<span style="color:var(--muted);font-size:0.85rem">No clients invited.</span>';

  renderProjectFiles('admin');
  document.getElementById('projectDetailModal').classList.remove('hidden');
}

function renderProjectFiles(role) {
  const project = LQ.getProjects().find(p => p.id === currentProjectId);
  if (!project) return;
  const listId = role + 'FileList';
  const list   = document.getElementById(listId);
  list.innerHTML = project.files.length
    ? project.files.map(f => `
        <div class="file-item">
          <span class="file-item-name">📄 ${esc(f.name)}</span>
          <span class="file-item-size">${formatBytes(f.size)}</span>
          <span style="color:var(--muted);font-size:0.75rem">${esc(f.uploadedBy || 'unknown')}</span>
          ${role === 'admin' ? `<button class="file-item-delete" onclick="deleteFile('${f.id}')">🗑</button>` : ''}
        </div>`)
      .join('')
    : '<p style="color:var(--muted);font-size:0.85rem">No files yet.</p>';
}

function deleteFile(fileId) {
  if (!confirm('Delete this file?')) return;
  LQ.removeFileFromProject(currentProjectId, fileId);
  renderProjectFiles('admin');
}

// File upload (stored as metadata; for real binary storage → GitHub API)
document.addEventListener('DOMContentLoaded', () => {
  renderProjects();

  const fileInput = document.getElementById('adminFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      Array.from(e.target.files).forEach(file => {
        const info = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          uploadedBy: 'Admin',
          uploadedAt: new Date().toISOString()
        };
        LQ.addFileToProject(currentProjectId, info);
      });
      renderProjectFiles('admin');
      fileInput.value = '';
    });
  }

  // Drag-and-drop
  const zone = document.getElementById('adminUploadZone');
  if (zone) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      Array.from(e.dataTransfer.files).forEach(file => {
        LQ.addFileToProject(currentProjectId, {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          uploadedBy: 'Admin',
          uploadedAt: new Date().toISOString()
        });
      });
      renderProjectFiles('admin');
    });
  }
});

// ── Utilities ──
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(1) + ' MB';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) this.classList.add('hidden');
  });
});
