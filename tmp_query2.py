import sqlite3
from datetime import datetime, timedelta

db_path = r"C:\Users\Lenovo\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Get user sessions (not checkpoint-writer) - last 7 days
seven_days_ago = int((datetime.now() - timedelta(days=7)).timestamp() * 1000)
c.execute("""
    SELECT id, title, time_created 
    FROM session 
    WHERE directory LIKE '%CT550%' 
    AND title NOT LIKE '%checkpoint-writer%'
    AND time_created > ?
    ORDER BY time_created DESC
""", (seven_days_ago,))
rows = c.fetchall()
print(f"=== USER SESSIONS (last 7 days, since {datetime.fromtimestamp(seven_days_ago/1000).isoformat()}) ===")
print(f"Count: {len(rows)}")
for r in rows:
    ts = datetime.fromtimestamp(r[2]/1000).strftime('%Y-%m-%d %H:%M')
    print(f"  {r[0]} | {ts} | {(r[1] or '')[:80]}")

# Also check if there's a current session
c.execute("""
    SELECT id, title, time_created 
    FROM session 
    WHERE directory LIKE '%CT550%' 
    AND id = 'ses_0b0ef6186ffeRRjz3TBqvEwWCj'
""")
cur = c.fetchone()
if cur:
    print(f"\n=== CURRENT SESSION ===")
    ts = datetime.fromtimestamp(cur[2]/1000).strftime('%Y-%m-%d %H:%M')
    print(f"  {cur[0]} | {ts} | {cur[1]}")

# Check how many messages in recent non-checkpoint sessions
print("\n=== MESSAGE COUNTS FOR RECENT SESSIONS ===")
for r in rows[:10]:
    c.execute("SELECT COUNT(*) FROM message WHERE session_id = ?", (r[0],))
    msg_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM part WHERE session_id = ?", (r[0],))
    part_count = c.fetchone()[0]
    ts = datetime.fromtimestamp(r[2]/1000).strftime('%Y-%m-%d %H:%M')
    print(f"  {r[0]} | {ts} | msgs={msg_count} parts={part_count} | {(r[1] or '')[:60]}")

conn.close()
