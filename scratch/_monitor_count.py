import sqlite3, glob, os
files = [x for x in glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite') if 'metadata' not in x]
files.sort(key=lambda x: os.path.getsize(x), reverse=True)
if not files:
    print(0)
else:
    conn = sqlite3.connect(files[0])
    print(conn.execute('SELECT count(*) FROM questions').fetchone()[0])
    conn.close()