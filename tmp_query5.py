import sqlite3, os

db_path = r"C:\Users\Lenovo\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Verify model count - what's on disk
print("=== Backend model files on disk ===")
models_dir = r"E:\HocTap\CT550\backend\models"
if os.path.exists(models_dir):
    files = [f for f in os.listdir(models_dir) if f.endswith('.js') and not f.startswith('index')]
    print(f"  Count: {len(files)}")
    for f in sorted(files):
        print(f"  - {f}")

# Check the custom domain 403 details
print("\n=== Custom domain 403 details in ses_0d7b4b3b ===")
c.execute("""
    SELECT substr(p.data, 1, 600) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0d7b4b3beffedDS78C6haIhEde'
    AND json_extract(p.data, '$.type') = 'text'
    AND json_extract(m.data, '$.role') = 'assistant'
    AND p.data LIKE '%403%'
    ORDER BY m.time_created
    LIMIT 5
""")
for r in c.fetchall():
    text = r[0] or ""
    if '"text":"' in text:
        start = text.index('"text":"') + 8
        end = text.rindex('"')
        print(f"  {text[start:start+400]}")

# Check sidebar compact toggle
print("\n=== Sidebar compact toggle in ses_0d7bd3f27 ===")
c.execute("""
    SELECT substr(p.data, 1, 600) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0d7bd3f27ffegLFx0v2pXovuuW'
    AND json_extract(p.data, '$.type') = 'text'
    AND json_extract(m.data, '$.role') = 'assistant'
    AND p.data LIKE '%sidebar%'
    ORDER BY m.time_created
    LIMIT 5
""")
for r in c.fetchall():
    text = r[0] or ""
    if '"text":"' in text:
        start = text.index('"text":"') + 8
        end = text.rindex('"')
        print(f"  {text[start:start+400]}")

# Check if HomeFeedColumn heart button fix is in a different session
print("\n=== HomeFeedColumn fix commit check ===")
c.execute("""
    SELECT substr(p.data, 1, 800) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0bb3f79ccffenO4br67J3hR70O'
    AND json_extract(p.data, '$.type') = 'text'
    AND p.data LIKE '%HomeFeedColumn%'
    AND p.data LIKE '%heart%'
    ORDER BY m.time_created
    LIMIT 3
""")
for r in c.fetchall():
    text = r[0] or ""
    if '"text":"' in text:
        start = text.index('"text":"') + 8
        end = text.rindex('"')
        print(f"  {text[start:start+400]}")

# Check what MEMORY.md line 83 claims about model count vs actual
# Let's grep for model definitions
print("\n=== Models referenced in MEMORY.md line 83 ===")
print("MEMORY claims 26 models + adds Series, ChatSession, ChatMessage, Banner, BrowseHistory, UserReport, CommentReport")
print("ses_0d7bd3f27 says 24 models and confirms ALL are actively used")
print("Actual files on disk: see above")

# Check if any session talked about sidebarCompact
print("\n=== Sidebar compact discussions ===")
c.execute("""
    SELECT m.session_id, substr(p.data, 1, 400) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(p.data, '$.type') = 'text'
    AND json_extract(m.data, '$.role') = 'assistant'
    AND p.data LIKE '%sidebarCompact%'
    AND p.data NOT LIKE '%tool%'
    ORDER BY m.time_created DESC
    LIMIT 5
""")
for r in c.fetchall():
    text = r[2] or ""
    if '"text":"' in text:
        start = text.index('"text":"') + 8
        end = text.rindex('"')
        print(f"  [{r[0][:20]}] {text[start:start+300]}")

conn.close()
