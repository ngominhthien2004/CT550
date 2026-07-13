import sqlite3

db_path = r"C:\Users\Lenovo\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

# 1. Check the "Login trống" session for Render SPA rewrite fix
print("=== ses_0c033379: Login trống khi deploy Render ===")
c.execute("""
    SELECT m.id, json_extract(m.data, '$.role') as role, substr(p.data, 1, 500) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0c0333795ffeh9THJS2TU1mRpj'
    AND json_extract(p.data, '$.type') = 'text'
    AND json_extract(m.data, '$.role') = 'assistant'
    ORDER BY m.time_created
    LIMIT 3
""")
for r in c.fetchall():
    print(f"  msg={r[0]} role={r[1]} preview={r[2][:200]}")

# 2. Check the ranking session
print("\n=== ses_0c067b6d: Ranking page description ===")
c.execute("""
    SELECT m.id, json_extract(m.data, '$.role') as role, substr(p.data, 1, 300) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0c067b6d4ffeE4LagCf3Z001Uu'
    AND json_extract(p.data, '$.type') = 'text'
    AND json_extract(m.data, '$.role') = 'assistant'
    ORDER BY m.time_created
    LIMIT 5
""")
for r in c.fetchall():
    print(f"  msg={r[0]} role={r[1]} preview={r[2][:200]}")

# 3. Check the very large ses_0c8a2c5a session for any key user directives
print("\n=== ses_0c8a2c5a: User directives ===")
c.execute("""
    SELECT substr(p.data, 1, 400) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0c8a2c5a8ffeJ4ZlmDAUBEENrO'
    AND json_extract(p.data, '$.type') = 'text'
    AND json_extract(m.data, '$.role') = 'user'
    ORDER BY m.time_created
    LIMIT 15
""")
for r in c.fetchall():
    text = r[0] or ""
    # Skip tool results, only look for user messages
    if '"type":"tool"' not in text:
        print(f"  {text[:200]}")

# 4. Check recent search for "always" "never" "remember" "rule" user statements
print("\n=== User statements containing 'remember' or 'rule' or 'always' ===")
c.execute("""
    SELECT substr(p.data, 1, 500) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'user'
    AND json_extract(p.data, '$.type') = 'text'
    AND (p.data LIKE '%remember%' OR p.data LIKE '%luôn%' OR p.data LIKE '%mãi%')
    AND p.data NOT LIKE '%tool%'
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for r in c.fetchall():
    text = r[0] or ""
    if 'type' in text and '"type":"tool"' in text:
        continue
    # Extract just the text content
    if '"text":"' in text:
        start = text.index('"text":"') + 8
        end = text.index('"', start) if '"' in text[start:] else len(text)
        print(f"  {text[start:start+200]}")

# 5. Check for file writes (tool calls that created or modified files)
print("\n=== File writes in ses_0c033379 (Login/Render) ===")
c.execute("""
    SELECT substr(p.data, 1, 600) as preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_0c0333795ffeh9THJS2TU1mRpj'
    AND json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') IN ('write', 'edit')
    ORDER BY m.time_created
    LIMIT 10
""")
for r in c.fetchall():
    text = r[0] or ""
    # Extract tool name and file path
    if '"tool":"' in text:
        tool_start = text.index('"tool":"') + 8
        tool_end = text.index('"', tool_start)
        tool = text[tool_start:tool_end]
    else:
        tool = "?"
    if '"file_path":"' in text:
        fp_start = text.index('"file_path":"') + 13
        fp_end = text.index('"', fp_start)
        fp = text[fp_start:fp_end]
    elif '"path":"' in text:
        fp_start = text.index('"path":"') + 8
        fp_end = text.index('"', fp_start)
        fp = text[fp_start:fp_end]
    else:
        fp = "?"
    print(f"  {tool}: {fp}")

conn.close()
