import re

with open("firestore.rules", "r") as f:
    content = f.read()

# Fix operator precedence for group_battles and battle_sessions
content = re.sub(
    r"allow delete: if isSignedIn\(\) && resource\.data\.hostId == request\.auth\.uid \|\| isAdmin\(\);",
    r"allow delete: if (isSignedIn() && resource.data.hostId == request.auth.uid) || isAdmin();",
    content
)

content = re.sub(
    r"allow delete: if isSignedIn\(\) && \(resource\.data\.player1\.id == request\.auth\.uid \|\| \(resource\.data\.player2 != null && resource\.data\.player2\.id == request\.auth\.uid\)\) \|\| isAdmin\(\);",
    r"allow delete: if (isSignedIn() && (resource.data.player1.id == request.auth.uid || (resource.data.player2 != null && resource.data.player2.id == request.auth.uid))) || isAdmin();",
    content
)

with open("firestore.rules", "w") as f:
    f.write(content)
