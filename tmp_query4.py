import sqlite3

db_path = r"C:\Users\Lenovo\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Find the render.yaml edit in ses_0c033379
print("=== render.yaml edit details in ses_0c033379 ===")
c.execute("""
    SELECT substr(p.data, 1, 2000) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0c0333795ffeh9THJS2TU1mRpj'
    AND json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') = 'edit'
    AND p.data LIKE '%render.yaml%'
    ORDER BY m.time_created
""")
for r in c.fetchall():
    text = r[0] or ""
    # Find old_string and new_string
    if '"old_string"' in text:
        old_start = text.index('"old_string"') + 13
        old_end = text.index('"', old_start)
        old_val = text[old_start:old_end][:200]
        print(f"  old_string: {old_val}")
    if '"new_string"' in text:
        new_start = text.index('"new_string"') + 14
        new_end = text.index('"', new_start)
        new_val = text[new_start:new_end][:200]
        print(f"  new_string: {new_val}")

# Check the ses_0c067b6d session for ranking docs creation
print("\n=== Ranking page docs creation in ses_0c067b6d ===")
c.execute("""
    SELECT substr(p.data, 1, 1000) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0c067b6d4ffeE4LagCf3Z001Uu'
    AND json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') = 'write'
    AND p.data LIKE '%ui-guide%'
    ORDER BY m.time_created
    LIMIT 3
""")
for r in c.fetchall():
    text = r[0] or ""
    if '"file_path"' in text:
        fp_start = text.index('"file_path"') + 13
        fp_end = text.index('"', fp_start)
        fp = text[fp_start:fp_end]
        print(f"  wrote: {fp}")

# Check ses_0bb3f79c for the CardMenuDropdown hover fix
print("\n=== CardMenuDropdown hover fix details ===")
c.execute("""
    SELECT substr(p.data, 1, 800) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0bb3f79ccffenO4br67J3hR70O'
    AND json_extract(p.data, '$.type') = 'text'
    AND json_extract(m.data, '$.role') = 'assistant'
    AND p.data LIKE '%hover%'
    ORDER BY m.time_created
    LIMIT 3
""")
for r in c.fetchall():
    text = r[0] or ""
    if '"text":"' in text:
        start = text.index('"text":"') + 8
        # find the end of the text
        end = text.rindex('"')
        print(f"  {text[start:start+400]}")

# Check the notification route fix
print("\n=== Notification route fix ===")
c.execute("""
    SELECT substr(p.data, 1, 800) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0c8a2c5a8ffeJ4ZlmDAUBEENrO'
    AND json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') IN ('write', 'edit')
    AND p.data LIKE '%Notification%'
    ORDER BY m.time_created
    LIMIT 5
""")
for r in c.fetchall():
    text = r[0] or ""
    if '"file_path"' in text:
        fp_start = text.index('"file_path"') + 13
        fp_end = text.index('"', fp_start)
        fp = text[fp_start:fp_end]
        print(f"  edited: {fp}")

conn.close()
