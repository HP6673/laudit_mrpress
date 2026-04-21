/* ═══════════════════════════════════════════════════════════
   CLIENT.JS — Client portal logic
═══════════════════════════════════════════════════════════ */

// ── Auth guard ──
const session = LQ.requireAuth('client');
if (!session) throw new Error('Not authenticated');

document.getElementById('clientGreeting').textContent = `Hi, ${session.name || 'there'}`;

let currentProjectId = null;

// ── Tab switching ──
function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('tab-' + name).classList.remove('hidden');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`[onclick="showTab('${name}')"]`).classList.add('active');

  if (name === 'projects')      renderProjects();
  if (name === 'questionnaire') loadQuestionnaire();
}

// ── Projects ──
function renderProjects() {
  const projects = LQ.getProjectsForEmail(session.email);
  const grid     = document.getElementById('projectGrid');
  const noProj   = document.getElementById('noProjects');

  if (!projects.length) {
    noProj.classList.remove('hidden');
    grid.innerHTML = '';
    return;
  }
  noProj.classList.add('hidden');
  grid.innerHTML = projects.map(p => `
    <div class="project-card" onclick="openProjectDetail('${p.id}')">
      <div class="project-card-name">${esc(p.name)}</div>
      <div class="project-card-company">${esc(p.company)}</div>
      <div class="project-card-desc">${esc(p.desc || '—')}</div>
      <div class="project-card-meta">
        <span>📎 ${p.files.length} file(s)</span>
      </div>
    </div>
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

  renderClientFileList();
  document.getElementById('projectDetailModal').classList.remove('hidden');
}

function renderClientFileList() {
  const project = LQ.getProjects().find(p => p.id === currentProjectId);
  if (!project) return;
  const list = document.getElementById('clientFileList');
  list.innerHTML = project.files.length
    ? project.files.map(f => `
        <div class="file-item">
          <span class="file-item-name">📄 ${esc(f.name)}</span>
          <span class="file-item-size">${formatBytes(f.size)}</span>
          <span style="color:var(--muted);font-size:0.75rem">${esc(f.uploadedBy || '')}</span>
        </div>`)
      .join('')
    : '<p style="color:var(--muted);font-size:0.85rem">No files yet — upload your first documents above.</p>';
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  currentProjectId = null;
}

// ── Questionnaire ──
function loadQuestionnaire() {
  const saved = LQ.getQuestionnaire(session.email);
  if (!saved) return;
  const form = document.getElementById('questionnaireForm');
  Object.entries(saved).forEach(([name, value]) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el) el.value = value;
  });
}

function saveQuestionnaire() {
  const form   = document.getElementById('questionnaireForm');
  const fields = form.querySelectorAll('input, select, textarea');
  const data   = {};
  fields.forEach(f => { if (f.name) data[f.name] = f.value; });
  LQ.saveQuestionnaire(session.email, data);

  const status = document.getElementById('saveStatus');
  status.textContent = '✓ Saved';
  setTimeout(() => { status.textContent = ''; }, 2500);
}

// ── File upload ──
document.addEventListener('DOMContentLoaded', () => {
  renderProjects();

  const fileInput = document.getElementById('clientFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      Array.from(e.target.files).forEach(file => {
        LQ.addFileToProject(currentProjectId, {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          uploadedBy: session.name || session.email,
          uploadedAt: new Date().toISOString()
        });
      });
      renderClientFileList();
      fileInput.value = '';
    });
  }

  const zone = document.getElementById('clientUploadZone');
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
          uploadedBy: session.name || session.email,
          uploadedAt: new Date().toISOString()
        });
      });
      renderClientFileList();
    });
  }

  // Load questionnaire if on that tab
  loadQuestionnaire();
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

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) this.classList.add('hidden');
  });
});
