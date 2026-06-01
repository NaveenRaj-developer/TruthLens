from flask import Flask, request, jsonify, session, send_from_directory
import sqlite3
from flask_cors import CORS
from datetime import datetime
import os
import pickle

app = Flask(__name__)
app.secret_key = "truthlens_secret_key"
CORS(app)

DB = "database.db"

# ================= LOAD ML MODELS =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE_DIR,"models/news_model.pkl"),"rb") as f:
    news_model = pickle.load(f)

with open(os.path.join(BASE_DIR,"models/news_vectorizer.pkl"),"rb") as f:
    news_vectorizer = pickle.load(f)

with open(os.path.join(BASE_DIR,"models/message_model.pkl"),"rb") as f:
    message_model = pickle.load(f)

with open(os.path.join(BASE_DIR,"models/message_vectorizer.pkl"),"rb") as f:
    message_vectorizer = pickle.load(f)

with open(os.path.join(BASE_DIR,"models/url_model.pkl"),"rb") as f:
    url_model = pickle.load(f)

with open(os.path.join(BASE_DIR,"models/url_vectorizer.pkl"),"rb") as f:
    url_vectorizer = pickle.load(f)

print("ML Models Loaded")

# ================= DATABASE =================
def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT 
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS history(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        content TEXT,
        result TEXT,
        time TEXT,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS admins(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
    """)

    cur.execute("SELECT * FROM admins WHERE username='admin'")
    if not cur.fetchone():
        cur.execute(
            "INSERT INTO admins(username,password) VALUES (?,?)",
            ("admin","admin123")
        )

    conn.commit()
    conn.close()

init_db()

# ================= USER PAGES =================
@app.route("/")
def home():
    return send_from_directory("users","index.html")

@app.route("/login")
def login_page():
    return send_from_directory("users","login.html")

@app.route("/signup")
def signup_page():
    return send_from_directory("users","signup.html")

@app.route("/news")
def news_page():
    return send_from_directory("users","news.html")

@app.route("/message")
def message_page():
    return send_from_directory("users","message.html")

@app.route("/url")
def url_page():
    return send_from_directory("users","url.html")

@app.route("/settings")
def settings_page():
    return send_from_directory("users","settings.html")

# ================= ADMIN PAGES =================
@app.route("/admin")
def admin_login():
    return send_from_directory("admin","admin-login.html")

@app.route("/admin/dashboard")
def admin_dashboard():
    return send_from_directory("admin","admin.html")

@app.route("/admin/users")
def admin_users():
    return send_from_directory("admin","admin-users.html")

# ================= STATIC =================
@app.route("/admin/<path:filename>")
def admin_static(filename):
    return send_from_directory("admin",filename)

@app.route("/users/<path:filename>")
def user_static(filename):
    return send_from_directory("users",filename)

# ================= USER AUTH =================
@app.route("/api/login", methods=["POST"])
def login():

    data = request.json
    email = data["email"]
    password = data["password"]

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM users WHERE email=? AND password=?",
        (email,password)
    )

    user = cur.fetchone()

    if user:

        session["user_id"] = user["id"]
        conn.close()

        return jsonify({"status":"success"})

    else:

        cur.execute(
            "INSERT INTO users(email,password) VALUES (?,?)",
            (email,password)
        )

        conn.commit()

        cur.execute(
            "SELECT * FROM users WHERE email=?",
            (email,)
        )

        user = cur.fetchone()

        session["user_id"] = user["id"]

        conn.close()

        return jsonify({"status":"success"})


@app.route("/api/signup", methods=["POST"])
def signup():

    data = request.json
    email = data["email"]
    password = data["password"]

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM users WHERE email=?",
        (email,)
    )

    if cur.fetchone():

        conn.close()
        return jsonify({
            "status":"error",
            "message":"Email already exists"
        })

    cur.execute(
        "INSERT INTO users(email,password) VALUES (?,?)",
        (email,password)
    )

    conn.commit()
    conn.close()

    return jsonify({"status":"success"})


@app.route("/api/logout")
def logout():

    session.pop("user_id",None)

    return jsonify({"status":"logged_out"})


# ================= ADMIN AUTH =================
@app.route("/api/admin/login", methods=["POST"])
def admin_login_api():

    data = request.json
    username = data["username"]
    password = data["password"]

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM admins WHERE username=? AND password=?",
        (username,password)
    )

    admin = cur.fetchone()
    conn.close()

    if admin:

        session["admin"] = True
        return jsonify({"status":"success"})

    return jsonify({"status":"failed"})


@app.route("/api/admin/logout")
def admin_logout():

    session.pop("admin",None)

    return jsonify({"status":"logged_out"})


# ================= ADMIN USERS =================
@app.route("/api/admin/users")
def admin_users_api():

    if not session.get("admin"):
        return jsonify([])

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id,email FROM users ORDER BY id DESC")

    rows = cur.fetchall()

    conn.close()

    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/delete_user/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):

    if not session.get("admin"):
        return jsonify({"status":"unauthorized"})

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "DELETE FROM history WHERE user_id=?",
        (user_id,)
    )

    cur.execute(
        "DELETE FROM users WHERE id=?",
        (user_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({"status":"success"})


# ================= ADMIN STATS =================
@app.route("/api/admin/stats")
def admin_stats():

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    SELECT h.result, COUNT(*) as count
    FROM history h
    JOIN users u ON h.user_id = u.id
    WHERE h.is_deleted = 0
    GROUP BY h.result
    """)

    rows = cur.fetchall()
    conn.close()

    stats = {}
    for r in rows:
        stats[r["result"]] = r["count"]

    return jsonify(stats)


# ================= DETECTION =================
@app.route("/api/detect", methods=["POST"])
def detect():

    data = request.json
    dtype = data["type"]
    content = data["content"]

    user_id = session.get("user_id")

    # FREE DETECTION
    if not user_id:

        free_used = session.get("free_used")

        if free_used:
            return jsonify({"status":"login_required"})

        session["free_used"] = True

    # MESSAGE
    if dtype=="message":

        vec = message_vectorizer.transform([content])
        pred = message_model.predict(vec)[0]

        result = "Spam Message" if pred==1 else "Safe Message"

    # NEWS
    elif dtype=="news":

        vec = news_vectorizer.transform([content])
        pred = news_model.predict(vec)[0]

        result = "Fake News" if pred==0 else "Real News"

    # URL
    elif dtype=="url":

        if "@" in content or "-" in content:
            result = "Phishing URL"

        elif content.startswith("https"):
            result = "Safe URL"

        else:
            result = "Unknown URL"

    else:
        return jsonify({"status":"invalid_type"})

    # SAVE HISTORY
    if user_id:

        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
        INSERT INTO history(user_id,type,content,result,time)
        VALUES (?,?,?,?,?)
        """,
        (
            user_id,
            dtype,
            content,
            result,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

        conn.commit()
        conn.close()

    return jsonify({
        "status":"success",
        "result":result
    })


# ================= HISTORY =================
@app.route("/api/history")
def history():

    user_id = session.get("user_id")

    if not user_id:
        return jsonify([])

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    SELECT id,type,content,result,time
    FROM history
    WHERE user_id=? AND is_deleted=0
    ORDER BY id DESC
    """,(user_id,))

    rows = cur.fetchall()
    conn.close()

    return jsonify([dict(r) for r in rows])


# ================= RUN =================
if __name__=="__main__":
    app.run(debug=True,host="0.0.0.0",port=5000)