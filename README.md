# LogistiQ — Logistics Audit Website

A full client portal with a scroll-driven 3D truck homepage, client/admin login, project management, file sharing, and questionnaire system.

---

## 📁 File Structure

```
logistics-audit/
├── index.html              ← Homepage with 3D truck animation
├── css/
│   ├── style.css           ← Global styles (nav, hero, sections, footer)
│   ├── auth.css            ← Login / register page styles
│   └── portal.css          ← Admin & client dashboard styles
├── js/
│   ├── truck.js            ← Three.js 3D truck + scroll animation
│   ├── main.js             ← Homepage interactions (nav, card animations)
│   ├── storage.js          ← Data layer (localStorage / GitHub API bridge)
│   ├── auth.js             ← Login, registration, session logic
│   ├── admin.js            ← Admin dashboard logic
│   └── client.js           ← Client portal logic
├── pages/
│   ├── login.html          ← Sign in / create account page
│   ├── admin.html          ← Admin dashboard
│   └── client.html         ← Client portal
└── assets/                 ← (optional) custom truck model, images, icons
```

---

## 🚀 Quick Start (Run Locally)

### Option A — Open Directly
1. Double-click `index.html` to open in your browser.
2. Everything works from the file system — no server needed for basic use.
   > Note: Some browsers block ES modules when opened as `file://`. If you see errors, use Option B.

### Option B — Local Dev Server (Recommended)
```bash
# If you have Python installed:
cd logistics-audit
python3 -m http.server 8080
# Then open: http://localhost:8080

# Or with Node.js:
npx serve .
# Then open: http://localhost:3000
```

---

## 🌐 Deploy to GitHub Pages (Free Hosting)

### Step 1 — Create a GitHub Repository
1. Go to [github.com](https://github.com) → **New repository**
2. Name it: `logistics-audit` (or anything you like)
3. Set to **Private** (recommended — your client data stays private)
4. Click **Create repository**

### Step 2 — Push Your Files
```bash
cd logistics-audit
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/logistics-audit.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. In your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` → folder: `/ (root)`
4. Click **Save**
5. Your site will be live at: `https://YOUR_USERNAME.github.io/logistics-audit/`

> **Private repo + GitHub Pages**: GitHub Pages on private repos requires a paid plan (GitHub Pro, $4/month). Alternatively, deploy for free using **Netlify** or **Vercel** (both support private GitHub repos for free).

### Deploy to Netlify (Free, supports private repos)
1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Connect GitHub → select your repo
3. Build command: (leave blank)
4. Publish directory: `.` (root)
5. Click **Deploy** — you get a free `yoursite.netlify.app` URL

---

## 🔐 Admin Password

The default admin password is: **`admin`**

**Change it immediately before deploying:**
Open `js/auth.js` → line 5:
```javascript
const ADMIN_PASSWORD = 'admin'; // ← Change this
```

---

## 💾 Data Storage

By default, all data (users, projects, questionnaire responses, file metadata) is stored in **localStorage** in the browser. This means:
- ✅ Works instantly, no backend needed
- ✅ Free to host on GitHub Pages
- ⚠️ Data is per-browser (not shared across devices)
- ⚠️ File contents are stored as metadata only (names/sizes), not actual binary files

### Upgrade to Real Storage (GitHub API)

To store data in your private GitHub repo so it persists across devices:

1. Create a **Personal Access Token** (PAT):
   - GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Grant: **Contents** (read & write) on your repo

2. In `js/storage.js`, add these GitHub API functions alongside the existing localStorage ones:

```javascript
const GITHUB_TOKEN = 'ghp_YOUR_TOKEN_HERE'; // store this securely
const GITHUB_REPO  = 'YOUR_USERNAME/logistics-audit';
const DATA_BRANCH  = 'main';

async function githubRead(path) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return JSON.parse(atob(data.content));
}

async function githubWrite(path, content, sha) {
  const body = {
    message: `Update ${path}`,
    content: btoa(JSON.stringify(content, null, 2)),
    branch: DATA_BRANCH
  };
  if (sha) body.sha = sha;
  await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
```

3. Replace `localStorage.getItem/setItem` calls in `storage.js` with `await githubRead/githubWrite`.

> ⚠️ **Security note**: Never expose your GitHub token in public-facing code. For production, add a small backend (Cloudflare Workers, Netlify Functions) to proxy API calls and keep the token server-side.

---

## 🚛 Replace the Truck Model

The truck is built procedurally with Three.js geometry. To use a custom 3D model:

1. Get a `.glb` truck model (free sources: [Sketchfab](https://sketchfab.com), [Poly Pizza](https://poly.pizza))
2. Place it in `assets/truck.glb`
3. Add to `index.html` (after Three.js script tag):
   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/loaders/GLTFLoader.js"></script>
   ```
4. In `js/truck.js`, replace the "Truck builder" section with:
   ```javascript
   const loader = new THREE.GLTFLoader();
   loader.load('../assets/truck.glb', (gltf) => {
     const model = gltf.scene;
     model.scale.setScalar(1.0);
     model.traverse(child => {
       if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
     });
     truckGroup.add(model);
   });
   ```

---

## ⚙️ Customization Reference

| What to change | Where |
|---|---|
| Brand name | `index.html` nav + footer, `pages/login.html`, `pages/admin.html`, `pages/client.html` |
| Colors | `css/style.css` `:root` variables (`--amber`, `--black`, etc.) |
| Admin password | `js/auth.js` line 5 |
| Truck scroll speed | `js/truck.js` — `TRUCK_Z_START`, `TRUCK_Z_END`, `TRUCK_ROT_DEG` constants |
| Hero slogan | `index.html` `.hero-slogan` section |
| Questionnaire fields | `pages/client.html` `<fieldset>` sections |
| Services cards | `index.html` `.cards` section |

---

## 🔑 How the Portal Works

### Client flow
1. Client visits site → clicks **Portal**
2. On login page: selects **Client** tab → creates account with name + email + password
3. After login: sees projects they've been invited to
4. Can upload files (invoices, contracts, route logs) to any project
5. Can fill out the logistics questionnaire

### Admin flow
1. Admin visits login page → clicks **Admin** tab → enters admin password
2. Dashboard shows all projects and all registered clients
3. Admin creates a new project → searches invited clients by email as they type
4. Admin can upload files to any project
5. Admin can view all questionnaire responses

---

## 📋 Questionnaire Fields

The client questionnaire covers:
- Shipment volume (weekly shipments, goods types)
- Network (warehouses, delivery locations, regions)
- Carriers & fleet (current carriers, own fleet, contracts)
- Technology (TMS system, real-time tracking)
- Spend & pain points (annual spend, biggest complaints, prior audits)

Responses are saved per client email and visible in the Admin → Questionnaire tab.

---

## 🌟 Features Summary

- ✅ Scroll-driven 3D truck animation (Three.js + GSAP)
- ✅ Wheel rotation synced to scroll
- ✅ Parallax slogan with cinematic fade
- ✅ Moving road with amber dashes
- ✅ Client login + account creation (email + password)
- ✅ Admin login (password only)
- ✅ Admin: create projects, invite clients by email search
- ✅ Live email search dropdown (updates as you type)
- ✅ Per-project file upload (drag & drop + browse)
- ✅ Client questionnaire with auto-save
- ✅ Admin view of all questionnaire responses
- ✅ Fully responsive design
- ✅ Dark, high-end visual aesthetic (Bebas Neue + DM Sans)
- ✅ No backend required to start

---

*Built for logistics audit consulting operations.*
