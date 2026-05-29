import re

with open("firestore.rules", "r") as f:
    content = f.read()

# Remove the global bypass block
content = re.sub(
    r"\s*// --- GLOBAL ADMIN BYPASS ---.*?match /\{path=\*\*\} \{\s*allow read, write: if isAdmin\(\);\s*\}",
    "",
    content,
    flags=re.DOTALL,
)

# Add isAdmin() bypasses to specific endpoints.
# engine_questions list
content = re.sub(
    r"(match /engine_questions/\{question\} \{.*?allow list: if request\.query\.limit <= 50)(;)",
    r"\1 || isAdmin()\2",
    content,
    flags=re.DOTALL,
)

# group_battles delete
content = re.sub(
    r"(match /group_battles/\{battleId\} \{.*?allow delete: if isSignedIn\(\) && resource\.data\.hostId == request\.auth\.uid)(;)",
    r"\1 || isAdmin()\2",
    content,
    flags=re.DOTALL,
)

# battle_sessions delete
content = re.sub(
    r"(match /battle_sessions/\{sessionId\} \{.*?allow delete: if isSignedIn\(\) && \(resource\.data\.player1\.id == request\.auth\.uid \|\| \(resource\.data\.player2 != null && resource\.data\.player2\.id == request\.auth\.uid\)\))(;)",
    r"\1 || isAdmin()\2",
    content,
    flags=re.DOTALL,
)

# referral_codes write, delete (delete doesn't exist, change create, update to allow create, update, delete)
content = re.sub(
    r"(match /referral_codes/\{code\} \{.*?allow create, update: if isSignedIn\(\))(;)",
    r"\1 || isAdmin();\n      allow delete: if isAdmin();",
    content,
    flags=re.DOTALL,
)

with open("firestore.rules", "w") as f:
    f.write(content)
