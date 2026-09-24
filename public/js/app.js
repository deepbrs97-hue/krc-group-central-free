const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let users = [];
let modules = [];
let selectedPermissionUser = null;
let currentModule = null;

const ICONS = ["📄","📦","🚛","👨‍✈️","🚚","📋","📝","👥","📦","🧾","💰","🔧","⚠️","🛞","📊","🏠","📁","📌","📈","🗂️","🛠️","💼","🔐","◈"];

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

const SAVED_CREDENTIALS_KEY = "krcGroupSavedCredentials";
let pendingCredentials = null;

function getSavedCredentials() {
  try { return JSON.parse(localStorage.getItem(SAVED_CREDENTIALS_KEY) || "null"); }
  catch (_) { return null; }
}

function fillSavedCredentials() {
  const saved = getSavedCredentials();
  if (!saved?.username || !saved?.password) return;
  $("#username").value = saved.username;
  $("#password").value = saved.password;
}

function showSaveCredentialsPrompt(username, password) {
  const saved = getSavedCredentials();
  if (saved?.username === username && saved?.password === password) return;
  pendingCredentials = { username, password };
  $("#saveCredentialsPrompt").classList.remove("hidden");
}

function closeSaveCredentialsPrompt() {
  pendingCredentials = null;
  $("#saveCredentialsPrompt").classList.add("hidden");
}

function savePendingCredentials() {
  if (!pendingCredentials) return;
  try {
    localStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify(pendingCredentials));
    toast("Login details saved on this device.");
  } catch (_) {
    toast("Could not save login details on this device.");
  }
  closeSaveCredentialsPrompt();
}

function updateAnalogClock(id) {
  const clock = $(id);
  if (!clock) return;
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "numeric", second: "numeric", hour12: false }).formatToParts(now);
  const getPart = (type) => Number(parts.find(p => p.type === type)?.value || 0);
  const seconds = getPart("second") + now.getMilliseconds() / 1000;
  const minutes = getPart("minute") + seconds / 60;
  const hours = (getPart("hour") % 12) + minutes / 60;
  const hour = clock.querySelector(".clock-hour");
  const minute = clock.querySelector(".clock-minute");
  const second = clock.querySelector(".clock-second");
  if (hour) hour.style.transform = `translateX(-50%) rotate(${hours * 30}deg)`;
  if (minute) minute.style.transform = `translateX(-50%) rotate(${minutes * 6}deg)`;
  if (second) second.style.transform = `translateX(-50%) rotate(${seconds * 6}deg)`;
}

function updateDashboardClocks() {
  const now = new Date();
  const dateText = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", weekday: "short", month: "short", day: "numeric", year: "numeric"
  }).format(now);
  const timeText = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true
  }).format(now);
  if ($("#dashboardDate")) $("#dashboardDate").textContent = dateText;
  if ($("#dashboardTime")) $("#dashboardTime").textContent = timeText;
  if ($("#userDashboardDate")) $("#userDashboardDate").textContent = dateText;
  if ($("#userDashboardTime")) $("#userDashboardTime").textContent = timeText;
  updateAnalogClock("#adminAnalogClock");
  updateAnalogClock("#userAnalogClock");
}

fillSavedCredentials();
updateDashboardClocks();
setInterval(updateDashboardClocks, 1000);

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function hideAllViews() {
  $("#loginView").classList.add("hidden");
  $("#adminView").classList.add("hidden");
  $("#userView").classList.add("hidden");
  closeModuleViewer();
}

function showAdmin(user) {
  hideAllViews();
  $("#adminView").classList.remove("hidden");
  $("#adminName").textContent = user.username;
  loadDashboard();
  loadUsers();
  loadModules();
  loadActivity();
}

function showUser(user) {
  hideAllViews();
  $("#userView").classList.remove("hidden");
  const name = user.username || "User";
  const initial = name.charAt(0).toUpperCase();
  $("#sidebarUserName").textContent = name;
  $("#userTopName").textContent = name;
  $("#userWelcomeName").textContent = name;
  $("#userAvatar").textContent = initial;
  $("#userTopAvatar").textContent = initial;
  $("#userAccessLevel").textContent = user.role === "admin" ? "Administrator" : "User";
  $("#userWelcomeAccess").textContent = user.role === "admin" ? "Administrator" : "User";
  loadUserDashboard();
}

async function boot() {
  try {
    const data = await api("/api/me");
    if (!data.user) return;
    if (data.user.role === "admin") showAdmin(data.user);
    else showUser(data.user);
  } catch (_) {}
}
boot();

$("#togglePassword").onclick = () => {
  const input = $("#password");
  input.type = input.type === "password" ? "text" : "password";
  $("#togglePassword").textContent = input.type === "password" ? "Show" : "Hide";
};

$("#loginForm").onsubmit = async (e) => {
  e.preventDefault();
  $("#loginError").textContent = "";
  const username = $("#username").value.trim();
  const password = $("#password").value;
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    if (data.user.role === "admin") showAdmin(data.user);
    else showUser(data.user);
    setTimeout(() => showSaveCredentialsPrompt(username, password), 180);
  } catch (err) {
    $("#loginError").textContent = err.message;
  }
};

$("#saveCredentialsBtn").onclick = savePendingCredentials;
$("#skipSaveCredentials").onclick = closeSaveCredentialsPrompt;

$$('#adminView .nav-item').forEach(btn => {
  btn.onclick = () => {
    $$('#adminView .nav-item').forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    $$('#adminView .page-section').forEach(x => x.classList.remove("active-section"));
    $("#" + btn.dataset.section).classList.add("active-section");
    $("#pageTitle").textContent = btn.textContent;
    closeModuleViewer();
  };
});

$$('[data-section-jump]').forEach(btn => {
  btn.onclick = () => {
    const section = btn.dataset.sectionJump;
    const nav = $(`#adminView .nav-item[data-section="${section}"]`);
    if (nav) nav.click();
  };
});

async function logout() {
  try { await api("/api/logout", { method: "POST" }); } finally { location.reload(); }
}
$("#adminLogoutBtn").onclick = logout;
$("#userLogoutBtn").onclick = logout;

// ---------------- EMBEDDED MODULE VIEWER ----------------
function isValidHttpUrl(value) {
  try { const u = new URL(String(value || "").trim()); return u.protocol === "http:" || u.protocol === "https:"; }
  catch (_) { return false; }
}
function openModuleViewer(module) {
  if (!module || !isValidHttpUrl(module.url)) return toast("This module has no valid URL. Ask the administrator to edit the module URL.");
  currentModule = module;
  $("#viewerModuleName").textContent = module.name;
  $("#moduleLoadingUrl").textContent = module.url;
  $("#moduleLoading").classList.remove("hidden");
  $("#moduleViewer").classList.remove("hidden");
  document.body.classList.add("module-view-open");
  const frame = $("#moduleWebview");
  frame.onload = () => $("#moduleLoading").classList.add("hidden");
  frame.onerror = () => { $("#moduleLoading").classList.add("hidden"); toast("Module could not be embedded. Use Open in Browser."); };
  frame.src = module.url;
}
function closeModuleViewer() {
  currentModule = null;
  const viewer = $("#moduleViewer");
  if (!viewer) return;
  viewer.classList.add("hidden");
  document.body.classList.remove("module-view-open");
  const frame = $("#moduleWebview");
  if (frame) frame.src = "about:blank";
}
$("#moduleBackBtn").onclick = closeModuleViewer;
$("#moduleRefreshBtn").onclick = () => { const frame = $("#moduleWebview"); if (frame) frame.src = frame.src; };
$("#moduleExternalBtn").onclick = () => {
  if (currentModule?.url && isValidHttpUrl(currentModule.url)) window.open(currentModule.url, "_blank", "noopener,noreferrer");
};
// ---------------- ADMIN ----------------
async function loadDashboard() {
  try {
    const d = await api("/api/dashboard");
    $("#totalUsers").textContent = d.users;
    $("#activeUsers").textContent = d.activeUsers;
    $("#totalModules").textContent = d.modules;
    $("#recentEventCount").textContent = d.logs?.length || 0;
    $("#dashboardWelcomeName").textContent = $("#adminName").textContent || "Admin";
    updateDashboardClocks();
    renderLogs("#recentLogs", d.logs);
    const md = await api("/api/modules");
    $("#adminQuickModules").innerHTML = md.modules.filter(m => m.active).map(m => `
      <button class="quick-module-card" data-module-id="${m.id}">
        <span class="module-icon">${escapeHtml(m.icon || "◈")}</span>
        <span><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.category || "OTHER")}</small></span>
        <span class="module-arrow">→</span>
      </button>
    `).join("") || `<div class="empty-cell">No active modules.</div>`;
    $$("#adminQuickModules [data-module-id]").forEach(btn => btn.onclick = () => {
      const m = md.modules.find(x => x.id === Number(btn.dataset.moduleId));
      openModuleViewer(m);
    });
  } catch (err) { toast(err.message); }
}

async function loadUsers() {
  const d = await api("/api/users");
  users = d.users;
  renderUsers();
  populatePermissionUsers();
}

function renderUsers() {
  const q = ($("#userSearch").value || "").toLowerCase();
  $("#usersTable").innerHTML = users.filter(u => u.username.toLowerCase().includes(q)).map(u => `
    <tr>
      <td><strong>${escapeHtml(u.username)}</strong></td>
      <td>${escapeHtml(u.role)}</td>
      <td><span class="badge ${u.active ? "active" : "off"}">${u.active ? "Active" : "Disabled"}</span></td>
      <td>${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata" }).format(new Date(u.created_at + "Z"))}</td>
      <td>
        <button class="action-btn" onclick="editUser(${u.id})">Edit</button>
        <button class="action-btn" onclick="changePassword(${u.id})">Password</button>
        <button class="action-btn danger-btn" onclick="deleteUser(${u.id})">Delete</button>
      </td>
    </tr>
  `).join("");
}

$("#userSearch").oninput = renderUsers;

$("#addUserBtn").onclick = () => {
  openModal(`
    <h3>Add New User</h3>
    <form id="addUserForm" class="modal-form">
      <label>Username<input name="username" required></label>
      <label>Temporary Password<input name="password" type="password" minlength="6" required></label>
      <label>Role<select name="role"><option value="user">User</option><option value="admin">Admin</option></select></label>
      <div class="modal-actions"><button type="button" class="action-btn" onclick="closeModal()">Cancel</button><button class="primary-btn">Create User</button></div>
    </form>
  `);
  $("#addUserForm").onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api("/api/users", { method: "POST", body: JSON.stringify(Object.fromEntries(fd)) });
      closeModal(); toast("User created."); await loadUsers(); await loadDashboard(); await loadActivity();
    } catch (err) { toast(err.message); }
  };
};

window.editUser = async (id) => {
  const u = users.find(x => x.id === id);
  if (!u) return;
  openModal(`
    <h3>Edit User</h3>
    <form id="editUserForm" class="modal-form">
      <label>Username<input value="${escapeHtml(u.username)}" disabled></label>
      <label>Role<select name="role"><option value="user" ${u.role === "user" ? "selected" : ""}>User</option><option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option></select></label>
      <label>Status<select name="active"><option value="true" ${u.active ? "selected" : ""}>Active</option><option value="false" ${!u.active ? "selected" : ""}>Disabled</option></select></label>
      <div class="modal-actions"><button type="button" class="action-btn" onclick="closeModal()">Cancel</button><button class="primary-btn">Save Changes</button></div>
    </form>
  `);
  $("#editUserForm").onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ role: fd.get("role"), active: fd.get("active") === "true" }) });
      closeModal(); toast("User updated."); await loadUsers(); await loadDashboard(); await loadActivity();
    } catch (err) { toast(err.message); }
  };
};

window.changePassword = (id) => {
  const u = users.find(x => x.id === id);
  if (!u) return;
  openModal(`
    <h3>Change Password</h3>
    <p class="muted">Set a new password for <strong>${escapeHtml(u.username)}</strong>.</p>
    <form id="pwForm" class="modal-form">
      <label>New Password<input name="password" type="password" minlength="6" required></label>
      <div class="modal-actions"><button type="button" class="action-btn" onclick="closeModal()">Cancel</button><button class="primary-btn">Update Password</button></div>
    </form>
  `);
  $("#pwForm").onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api(`/api/users/${id}/password`, { method: "POST", body: JSON.stringify({ password: fd.get("password") }) });
      closeModal(); toast("Password updated."); await loadActivity();
    } catch (err) { toast(err.message); }
  };
};

window.deleteUser = async (id) => {
  const u = users.find(x => x.id === id);
  if (!u || !confirm(`Delete user "${u.username}" permanently?`)) return;
  try {
    await api(`/api/users/${id}`, { method: "DELETE" });
    toast("User deleted."); await loadUsers(); await loadDashboard(); await loadActivity();
  } catch (err) { toast(err.message); }
};

function iconSelector(selected = "") {
  return `<div class="icon-selector" id="iconSelector">${ICONS.map(icon => `<button type="button" class="icon-choice ${icon === selected ? "selected" : ""}" data-icon="${escapeHtml(icon)}">${icon}</button>`).join("")}<input type="hidden" name="icon" id="selectedIcon" value="${escapeHtml(selected)}"></div>`;
}

function bindIconSelector() {
  $$("#iconSelector .icon-choice").forEach(btn => btn.onclick = () => {
    $$("#iconSelector .icon-choice").forEach(x => x.classList.remove("selected"));
    btn.classList.add("selected");
    $("#selectedIcon").value = btn.dataset.icon;
  });
}

function moduleFormHtml(title, module = null) {
  const icon = module?.icon || "";
  return `
    <h3>${title}</h3>
    <form id="moduleForm" class="modal-form">
      <label>Module Name<input name="name" value="${escapeHtml(module?.name || "")}" placeholder="e.g. Attendance Portal" required></label>
      <label>Web Page URL<input name="url" type="url" value="${escapeHtml(module?.url || "")}" placeholder="https://example.com/portal" required></label>
      <label>Category <span class="optional-label">Optional</span><input name="category" value="${escapeHtml(module?.category || "")}" placeholder="e.g. OPERATIONS"></label>
      <label>Icon <span class="optional-label">Optional — choose built-in</span></label>
      ${iconSelector(icon)}
      ${module ? `<label>Status<select name="active"><option value="true" ${module.active ? "selected" : ""}>Active</option><option value="false" ${!module.active ? "selected" : ""}>Disabled</option></select></label>` : ""}
      <div class="modal-actions"><button type="button" class="action-btn" onclick="closeModal()">Cancel</button><button class="primary-btn">${module ? "Save Changes" : "Add Module"}</button></div>
    </form>`;
}

$("#addModuleBtn").onclick = () => {
  openModal(moduleFormHtml("Add Module"));
  bindIconSelector();
  $("#moduleForm").onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const payload = Object.fromEntries(fd);
      if (!payload.icon) payload.icon = "◈";
      await api("/api/modules", { method: "POST", body: JSON.stringify(payload) });
      closeModal(); toast("Module added successfully.");
      await loadModules(); await loadDashboard(); await loadActivity();
    } catch (err) { toast(err.message); }
  };
};

window.editModule = (id) => {
  const m = modules.find(x => x.id === id);
  if (!m) return;
  openModal(moduleFormHtml("Edit Module", m));
  bindIconSelector();
  $("#moduleForm").onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd);
    payload.active = payload.active === "true";
    if (!payload.icon) payload.icon = "◈";
    try {
      await api(`/api/modules/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      closeModal(); toast("Module updated successfully.");
      await loadModules(); await loadDashboard(); await loadActivity();
    } catch (err) { toast(err.message); }
  };
};

window.deleteModule = async (id) => {
  const m = modules.find(x => x.id === id);
  if (!m) return;
  if (!confirm(`Delete module "${m.name}"? Its user permission entries will also be removed.`)) return;
  try {
    await api(`/api/modules/${id}`, { method: "DELETE" });
    toast("Module deleted.");
    await loadModules(); await loadDashboard(); await loadActivity();
  } catch (err) { toast(err.message); }
};

async function loadModules() {
  const d = await api("/api/modules");
  modules = d.modules;
  const grouped = modules.reduce((acc, m) => {
    (acc[m.category || "OTHER"] ||= []).push(m);
    return acc;
  }, {});
  $("#modulesList").innerHTML = Object.entries(grouped).map(([category, items]) => `
    <div class="module-group">
      <div class="module-group-title">${escapeHtml(category)}</div>
      <div class="module-list-grid">
        ${items.map(m => `
          <div class="module-item">
            <div class="module-item-main">
              <span class="module-item-icon">${escapeHtml(m.icon || "◈")}</span>
              <div>
                <strong>${escapeHtml(m.name)}</strong>
                <small>${escapeHtml(m.slug)}</small>
                <small class="module-url">${escapeHtml(m.url)}</small>
              </div>
            </div>
            <div class="module-item-actions">
              <span class="badge ${m.active ? "active" : "off"}">${m.active ? "Active" : "Disabled"}</span>
              ${m.active ? `<button class="action-btn" onclick="openModuleFromId(${m.id})">Open</button>` : ""}
              <button class="action-btn" onclick="editModule(${m.id})">Edit</button>
              <button class="action-btn danger-btn" onclick="deleteModule(${m.id})">Delete</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("") || `<div class="empty-cell">No modules created.</div>`;
  if (selectedPermissionUser) loadPermissions(selectedPermissionUser);
}

window.openModuleFromId = (id) => {
  const m = modules.find(x => x.id === id);
  if (m) openModuleViewer(m);
};

function populatePermissionUsers() {
  $("#permissionUser").innerHTML = users.map(u => `<option value="${u.id}">${escapeHtml(u.username)} (${escapeHtml(u.role)})</option>`).join("");
  if (users.length) {
    selectedPermissionUser = Number($("#permissionUser").value);
    loadPermissions(selectedPermissionUser);
  }
}

$("#permissionUser").onchange = () => {
  selectedPermissionUser = Number($("#permissionUser").value);
  loadPermissions(selectedPermissionUser);
};

async function loadPermissions(userId) {
  const user = users.find(x => x.id === userId);
  if (!user) return;
  const d = await api(`/api/users/${userId}/permissions`);
  $("#permissionUserMeta").innerHTML = `<strong>${escapeHtml(d.user.username)}</strong><br>${escapeHtml(d.user.role)} · ${d.user.active ? "Active" : "Disabled"}`;
  const isAdmin = d.user.role === "admin";
  $("#permissionGrid").innerHTML = d.permissions.map(p => `
    <label class="permission-item">
      <input type="checkbox" value="${p.id}" ${p.granted ? "checked" : ""} ${!p.active || isAdmin ? "disabled" : ""}>
      <span>${escapeHtml(p.name)}</span>
    </label>
  `).join("");
  if (isAdmin) $("#permissionUserMeta").innerHTML += `<div class="permission-note">Admin accounts have full access to all active modules automatically.</div>`;
}

$("#savePermissionsBtn").onclick = async () => {
  if (!selectedPermissionUser) return;
  const selectedUser = users.find(u => u.id === selectedPermissionUser);
  const ids = $$("#permissionGrid input:checked").map(x => Number(x.value));
  if (selectedUser?.role === "admin") return toast("Admin already has full access to all active modules.");
  try {
    await api(`/api/users/${selectedPermissionUser}/permissions`, { method: "PUT", body: JSON.stringify({ moduleIds: ids }) });
    toast("Permissions saved."); await loadActivity();
  } catch (err) { toast(err.message); }
};

async function loadActivity() {
  const d = await api("/api/activity");
  renderLogs("#activityTable", d.logs, true);
}

function renderLogs(selector, logs, table = false) {
  if (table) {
    $(selector).innerHTML = logs.length ? logs.map(l => `<tr><td>${formatDate(l.created_at)}</td><td>${escapeHtml(l.username || "System")}</td><td>${escapeHtml(l.action)}</td><td>${escapeHtml(l.details || "")}</td></tr>`).join("") : `<tr><td colspan="4" class="empty-cell">No activity recorded yet.</td></tr>`;
  } else {
    $(selector).innerHTML = logs.length ? logs.map(l => `<div class="activity-row"><div><strong>${escapeHtml(l.action)}</strong><span>${escapeHtml(l.details || "")}</span></div><span>${formatDate(l.created_at)}</span></div>`).join("") : `<p class="muted">No activity recorded yet.</p>`;
  }
}

// ---------------- USER WORKPLACE ----------------
function renderUserModuleCards(target, list, limit = null) {
  const items = limit ? list.slice(0, limit) : list;
  $(target).innerHTML = items.length ? items.map(m => `
    <button class="user-module-card" data-module-id="${m.id}">
      <span class="module-icon">${escapeHtml(m.icon || "◈")}</span>
      <span class="module-card-text"><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.category || "OTHER")} · Access granted</small></span>
      <span class="module-arrow">→</span>
    </button>
  `).join("") : `
    <div class="user-empty">
      <div class="empty-icon">—</div>
      <h3>No modules assigned</h3>
      <p>Your account is active, but no modules have been assigned yet. Please contact the administrator.</p>
    </div>
  `;
  $$(target + " [data-module-id]").forEach(btn => btn.onclick = async () => {
    const item = list.find(m => m.id === Number(btn.dataset.moduleId));
    if (!item) return;
    try {
      const check = await api(`/api/my-modules/${encodeURIComponent(item.slug)}`);
      openModuleViewer(check.module);
    } catch (err) { toast(err.message); }
  });
}

function activateUserSection(sectionId) {
  $$(".user-nav-item").forEach(x => x.classList.toggle("active", x.dataset.userSection === sectionId));
  $$(".user-page-section").forEach(x => x.classList.toggle("active-user-section", x.id === sectionId));
  const title = sectionId === "userModulesSection" ? "My Modules" : "Dashboard";
  $("#userPageTitle").textContent = title;
}

$$('.user-nav-item').forEach(btn => {
  btn.onclick = () => activateUserSection(btn.dataset.userSection);
});
$$('[data-user-section-jump]').forEach(btn => {
  btn.onclick = () => activateUserSection(btn.dataset.userSectionJump);
});

async function loadUserDashboard() {
  try {
    const d = await api("/api/user-dashboard");
    const count = d.modules.length;
    $("#moduleCount").textContent = `${count} module${count === 1 ? "" : "s"}`;
    $("#sidebarModuleCount").textContent = count;
    $("#userModuleStat").textContent = count;
    renderUserModuleCards("#userModules", d.modules);
    renderUserModuleCards("#userDashboardModules", d.modules, 6);
    activateUserSection("userDashboard");
  } catch (err) {
    $("#userModules").innerHTML = `<div class="user-empty"><h3>Unable to load modules</h3><p>${escapeHtml(err.message)}</p></div>`;
    $("#userDashboardModules").innerHTML = $("#userModules").innerHTML;
  }
}

function formatDate(s) { return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(s.endsWith("Z") ? s : s + "Z")); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }

function openModal(html) {
  $("#modalContent").innerHTML = html;
  $("#modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => $("#modalCard")?.scrollTo({ top: 0 }));
}
function closeModal() {
  $("#modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
}
$("#closeModal").onclick = closeModal;
$("#modal").onclick = e => { if (e.target.id === "modal") closeModal(); };
window.closeModal = closeModal;
