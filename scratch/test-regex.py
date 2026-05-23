import re

cp1252_to_byte = {
    0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
    0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
    0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
    0x017e: 0x9e, 0x0178: 0x9f
}

pattern = re.compile(r'[\u00c0-\u00ff\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178\x80-\x9f]{2,}')

def repl(m):
    seg = m.group(0)
    try:
        b = [cp1252_to_byte.get(ord(c), ord(c)) for c in seg]
        # Recursively fix if double encoded
        decoded = bytes(b).decode('utf-8')
        # If the result still contains mojibake, try decoding again
        while pattern.search(decoded):
            new_decoded = pattern.sub(repl, decoded)
            if new_decoded == decoded:
                break
            decoded = new_decoded
        return decoded
    except Exception:
        return seg

text = 'Cl\u00e2\u201a\u201a and H\u00e2\u2020\u2019O'
print("Original text bytes:", text.encode('utf-8'))
fixed = pattern.sub(repl, text)
print("Fixed text bytes:", fixed.encode('utf-8'))
