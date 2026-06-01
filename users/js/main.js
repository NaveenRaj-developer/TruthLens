let redirectPage = "";

/* POPUP */
function openPopup(page, title, text) {
    redirectPage = page;
    document.getElementById("popupTitle").innerText = title;
    document.getElementById("popupText").innerText = text;
    document.getElementById("popupOverlay").style.display = "flex";
}

function goPage() {
    window.location.href = redirectPage;
}

/* LOGIN */
async function login() {

    const email = document.querySelector("input[type=email]").value;
    const password = document.getElementById("passwordInput").value;

    const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.status === "success") {

        localStorage.setItem("isLoggedIn", "true");

        alert("Login successful");
        updateAuthUI();

        window.location.href = "/";
    } else {
        alert("Invalid login");
    }
}

/* SIGNUP */
async function signup() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("passwordInput").value;

    if (!email || !password) {
        alert("Please fill all fields");
        return;
    }

    const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await res.json();

    if (data.status === "success") {

        alert("Account created successfully");

        window.location.href = "/login";

    } else {

        alert(data.message);
    }
}

/* UPDATE LOGIN UI */
function updateAuthUI() {

    const loggedIn = localStorage.getItem("isLoggedIn");

    const logoutBtn = document.getElementById("logoutBtn");
    const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");

    if (loggedIn === "true") {

        // SHOW
        if (logoutBtn)
            logoutBtn.style.display = "inline-block";

        if (sidebarLogoutBtn)
            sidebarLogoutBtn.style.display = "block";

    } else {

        // HIDE
        if (logoutBtn)
            logoutBtn.style.display = "none";

        if (sidebarLogoutBtn)
            sidebarLogoutBtn.style.display = "none";
    }
}

/* PASSWORD TOGGLE */
document.addEventListener("DOMContentLoaded", function () {

    updateAuthUI();

    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("passwordInput");

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", function () {
            const type =
                passwordInput.getAttribute("type") === "password"
                    ? "text"
                    : "password";

            passwordInput.setAttribute("type", type);

            this.classList.toggle("bi-eye-fill");
            this.classList.toggle("bi-eye-slash-fill");
        });
    }
});

/* RESULT DISPLAY */
function showResult(result) {

    const alertBox = document.getElementById("alertBox");
    const msgResult = document.getElementById("msgResult");
    const newsResult = document.getElementById("result");
    const urlResult = document.getElementById("urlResult");

    if (alertBox) {
        alertBox.style.display = "block";
        alertBox.innerHTML = "<b>" + result + "</b>";
    }

    if (msgResult) msgResult.innerHTML = "<b>" + result + "</b>";
    if (newsResult) newsResult.innerHTML = "<b>" + result + "</b>";
    if (urlResult) urlResult.innerHTML = "<b>" + result + "</b>";
}

/* MESSAGE DETECT */
async function checkMsg() {

    const msg = document.getElementById("msg").value;

    if (!msg) {
        alert("Please enter a message");
        return;
    }

    const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: "message",
            content: msg
        })
    });

    const data = await res.json();

    if (data.status === "login_required") {
        alert("Free detection finished. Please login.");
        window.location.href = "/login";
        return;
    }

    showResult(data.result);
    saveToHistory("message", msg);
}

/* NEWS DETECT */
async function checkNews() {

    const text = document.getElementById("newsText").value;

    if (!text) {
        alert("Please enter news content");
        return;
    }

    const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: "news",
            content: text
        })
    });

    const data = await res.json();

    if (data.status === "login_required") {
        alert("Free detection finished. Please login.");
        window.location.href = "/login";
        return;
    }

    showResult(data.result);
    saveToHistory("news", text);
}

/* URL DETECT */
async function checkURL() {

    const url = document.getElementById("url").value;

    if (!url) {
        alert("Please enter a URL");
        return;
    }

    const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: "url",
            content: url
        })
    });

    const data = await res.json();

    if (data.status === "login_required") {
        alert("Free detection finished. Please login.");
        window.location.href = "/login";
        return;
    }

    showResult(data.result);
    saveToHistory("url", url);
}

/* HISTORY SYSTEM */
let currentType = "all";

function toggleHistoryMenu() {
    document.getElementById("historyMenu").classList.toggle("open");
}

function openHistory(type) {

    currentType = type;

    document.getElementById("settingsSection").style.display = "none";
    document.getElementById("historySection").style.display = "block";

    document.querySelector(".quantum-title").innerText = "History";

    loadHistory(type);
}

function openSettings() {

    document.getElementById("settingsSection").style.display = "block";
    document.getElementById("historySection").style.display = "none";

    document.querySelector(".quantum-title").innerText = "Settings";
}

function saveSettings() {
    localStorage.setItem("autoDetect", document.getElementById("autoDetect").checked);
    localStorage.setItem("highlightFake", document.getElementById("highlightFake").checked);
    alert("Settings saved!");
}

function loadHistory(type = currentType) {

    currentType = type;

    const history = JSON.parse(localStorage.getItem("history")) || [];
    const list = document.getElementById("historyList");

    if (!list) return;

    list.innerHTML = "";

    let filtered = history;

    if (type !== "all") {
        filtered = history.filter(item => item.type.toLowerCase() === type);
    }

    displayHistory(filtered);
}

function displayHistory(data){

const list = document.getElementById("historyList");

if(!list) return;

list.innerHTML = "";

if(data.length === 0){

list.innerHTML = `
<tr>
<td colspan="5" class="text-center text-secondary">
No history found
</td>
</tr>
`;

return;

}

let rows = "";

data.forEach((item,index)=>{

rows += `
<tr>

<td>${index+1}</td>

<td>${item.type}</td>

<td>${item.text}</td>

<td>${item.time}</td>

<td>

<button class="btn btn-danger btn-sm"
onclick="deleteOne('${item.time}')">

Delete

</button>

</td>

</tr>
`;

});

list.innerHTML = rows;

}

function deleteOne(time) {

    let history = JSON.parse(localStorage.getItem("history")) || [];

    history = history.filter(item => item.time !== time);

    localStorage.setItem("history", JSON.stringify(history));

    loadHistory(currentType);
}

function deleteAllHistory() {
    if (confirm("Delete all history?")) {
        localStorage.removeItem("history");
        loadHistory(currentType);
    }
}

function saveToHistory(type, text) {

    let history = JSON.parse(localStorage.getItem("history")) || [];

    const newItem = {
        type: type,
        text: text,
        time: new Date().toLocaleString()
    };

    history.unshift(newItem);

    localStorage.setItem("history", JSON.stringify(history));
}

function searchHistory() {

    const keyword = document
        .getElementById("historySearch")
        .value
        .toLowerCase();

    const history = JSON.parse(localStorage.getItem("history")) || [];

    let filtered = history;

    if (currentType !== "all") {
        filtered = history.filter(item => item.type.toLowerCase() === currentType);
    }

    filtered = filtered.filter(item =>
        item.text.toLowerCase().includes(keyword) ||
        item.type.toLowerCase().includes(keyword)
    );

    displayHistory(filtered);
}

/* PAGE LOAD */
window.onload = function () {
    updateAuthUI();
    loadHistory("all");
}

/* LOGOUT */
async function logout() {

    await fetch("/api/logout");

    localStorage.removeItem("isLoggedIn");

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.style.display = "none";
    }

    alert("Logged out successfully");

    window.location.href = "/";
}

window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("tab") === "history") {
        openHistory("all");
    }
});