const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    const passwordInput = document.getElementById('admin-password');
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.classList.toggle('bi-eye');
        togglePassword.classList.toggle('bi-eye-fill');
    });
}

// ================== ADMIN LOGIN ==================
function adminLogin() {
    const username = document.getElementById("admin-username").value;
    const password = document.getElementById("admin-password").value;

    fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            window.location.href = "/admin/dashboard";
        } else {
            alert("❌ Wrong Username or Password");
        }
    })
    .catch(err => {
        console.error(err);
        alert("Server error");
    });
}

// ================== MAIN ==================
const main = document.querySelector(".main");
let dashboardChart;
let currentPage = "dashboard";

// ================== DASHBOARD ==================
function renderDashboard() {
    currentPage = "dashboard";
    if (!main) return;

    main.innerHTML = `
        <h1 class="dashboard-title">AI Core Control Panel</h1>
        <p class="dashboard-sub">Misinformation Monitoring System</p>

        <div class="cards">
            <div class="glass-card blue">
                <i class="fas fa-check-square icon"></i>
                <h3>Total Checks</h3>
                <h2 id="totalChecks">0</h2>
            </div>
            <div class="glass-card red">
                <i class="fas fa-exclamation icon"></i>
                <h3>Fake Detected</h3>
                <h2 id="fakeCount">0</h2>
            </div>
            <div class="glass-card green">
                <i class="fas fa-comment icon"></i>
                <h3>Messages</h3>
                <h2 id="messageCount">0</h2>
            </div>
            <div class="glass-card yellow">
                <i class="fas fa-link icon"></i>
                <h3>URLs Analyzed</h3>
                <h2 id="urlCount">0</h2>
            </div>
        </div>

        <h2 class="chart-title">Misinformation Detection Activity</h2>
        <div class="chart-container">
            <canvas id="dashboardChart"></canvas>
        </div>
    `;

    fetch("/api/admin/stats")
    .then(res => res.json())
    .then(stats => {
        const fake = stats["Fake News"] || 0;
        const real = stats["Real News"] || 0;
        const spam = stats["Spam Message"] || 0;
        const safe = stats["Safe Message"] || 0;
        const phishing = stats["Phishing URL"] || 0;
        const legit = stats["Safe URL"] || 0;

        const total = fake + real + spam + safe + phishing + legit;

        document.getElementById("totalChecks").innerText = total;
        document.getElementById("fakeCount").innerText = fake;
        document.getElementById("messageCount").innerText = spam + safe;
        document.getElementById("urlCount").innerText = phishing + legit;

        const ctx = document.getElementById("dashboardChart").getContext("2d");
        if(dashboardChart) dashboardChart.destroy();

        dashboardChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Fake News','Real News','Spam','Safe','Phishing','Safe URL'],
                datasets: [{
                    label: 'Total Checks',
                    data: [fake, real, spam, safe, phishing, legit],
                    fill: true,
                    borderColor: '#22d3ee',
                    borderWidth: 3,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    })
    .catch(err => console.error(err));
}

// ================== USERS ==================
function renderUsers() {
    currentPage = "users";
    if (!main) return;

    fetch("/api/admin/users")
    .then(res => res.json())
    .then(users => {
        let rows = "";
        users.forEach(user => {
            rows += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.email}</td>
                    <td>User Login</td>
                    <td class="status-online">Active</td>
                    <td>
                        <button class="remove-btn" onclick="deleteUser(${user.id})">Remove</button>
                    </td>
                </tr>`;
        });

        main.innerHTML = `
            <h1>User Activity Monitoring</h1>
            <table>
                <tr>
                    <th>ID</th><th>User Email</th><th>Activity</th><th>Status</th><th>Action</th>
                </tr>
                ${rows}
            </table>`;
    })
    .catch(err => console.error(err));
}

// ================== SETTINGS ==================
function renderSettings() {
    currentPage = "settings";
    if (!main) return;

    main.innerHTML = `
        <h1 class="dashboard-title">Settings Panel</h1>
        <p class="dashboard-sub">Admin Control Configuration</p>
        <div class="settings-container">
            <div class="settings-card">
                <h3>Notifications</h3>
                <div class="settings-row">
                    <span>Email Alerts</span>
                    <label class="switch"><input type="checkbox" id="emailAlerts"><span class="slider"></span></label>
                </div>
                <div class="settings-row">
                    <span>Push Notifications</span>
                    <label class="switch"><input type="checkbox" id="pushNotifications"><span class="slider"></span></label>
                </div>
            </div>
        </div>
        <div style="margin-top:30px;">
            <button class="btn-primary" onclick="saveSettings()">Save Settings</button>
        </div>`;

    loadSettings();
}

function saveSettings() {
    const settings = {
        emailAlerts: document.getElementById("emailAlerts").checked,
        pushNotifications: document.getElementById("pushNotifications").checked
    };
    localStorage.setItem("adminSettings", JSON.stringify(settings));
    alert("Settings Saved Successfully ✅");
}

function loadSettings() {
    const saved = JSON.parse(localStorage.getItem("adminSettings"));
    if(!saved) return;
    document.getElementById("emailAlerts").checked = saved.emailAlerts;
    document.getElementById("pushNotifications").checked = saved.pushNotifications;
}

// ================== LOGOUT ==================
function logout() {
    fetch("/api/admin/logout")
    .then(() => { window.location.href="/admin"; });
}

// ================== SIDEBAR ==================
document.querySelectorAll(".admin-sidebar a[data-page]").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const page = link.dataset.page;
        document.querySelectorAll(".admin-sidebar a").forEach(l => { if(l.dataset.page) l.classList.remove("active"); });
        link.classList.add("active");

        if(page==="dashboard") renderDashboard();
        else if(page==="users") renderUsers();
        else if(page==="settings") renderSettings();
    });
});

// ================== INITIAL LOAD ==================
if(main) renderDashboard();

// ================== AUTO REFRESH ==================
setInterval(() => {
    if(currentPage==="dashboard") renderDashboard();
}, 5000);

// ================== DELETE USER ==================
function deleteUser(id) {
    if(!confirm("Are you sure you want to remove this user?")) return;

    fetch("/api/admin/delete_user/"+id, { method:"DELETE" })
    .then(res => res.json())
    .then(data => {
        if(data.status==="success") {
            alert("User removed successfully");
            renderUsers();
        } else alert("Delete failed");
    })
    .catch(err => { console.error(err); alert("Server error"); });
}