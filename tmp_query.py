import sqlite3, sys

db_path = r"C:\Users\Lenovo\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Get all sessions ordered by newest first
c.execute("SELECT id, directory, title, time_created FROM session ORDER BY time_created DESC LIMIT 30")
rows = c.fetchall()
print("=== RECENT SESSIONS ===")
for r in rows:
    sid = r[0]
    directory = (r[1] or "")[:80]
    title = (r[2] or "")[:60]
    time = r[3] or ""
    print(f"  {sid} | {directory} | {title} | {time}")

# Get the schema
print("\n=== TABLES ===")
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
for row in c.fetchall():
    print(f"  {row[0]}")

conn.close()
