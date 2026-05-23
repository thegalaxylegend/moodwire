import sqlite3
import os
import glob
import json

def find_db():
    pattern = os.path.join(".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", "*.sqlite")
    files = glob.glob(pattern)
    db_files = [f for f in files if "metadata" not in f and os.path.basename(f) != "32a102316a3ae42300939e5f4bece6497396aead63dab98cf84c74ee519c7530.sqlite"]
    if not db_files:
        db_files = [f for f in files if "metadata" not in f]
    if not db_files:
        raise FileNotFoundError("Could not locate local SQLite D1 file.")
    db_files.sort(key=lambda x: os.path.getsize(x), reverse=True)
    return db_files[0]

def main():
    db_path = find_db()
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    conn.execute("BEGIN TRANSACTION;")
    
    # 1. Vector Volume Question Fix
    q_id_vec = "c4c549e762704f06136ef8fa40b220cb"
    vec_text = "Let $\\vec{a} = 2\\hat{i} + 3\\hat{j} + \\hat{k}$, $\\vec{b} = \\hat{i} - \\hat{j} + 2\\hat{k}$, and $\\vec{c} = 3\\hat{i} + \\hat{j} - \\hat{k}$. The volume of the parallelepiped formed by these vectors is"
    vec_correct = "23"
    vec_explanation = (
        "The volume of the parallelepiped is given by the absolute value of the scalar triple product "
        "[\\vec{a}\\ \\vec{b}\\ \\vec{c}], which is computed as the determinant of the matrix formed by "
        "the components of the three vectors:\n"
        "$$V = \\left| \\begin{vmatrix} 2 & 3 & 1 \\\\ 1 & -1 & 2 \\\\ 3 & 1 & -1 \\end{vmatrix} \\right|$$\n"
        "Expanding the determinant along the first row:\n"
        "$$V = \\left| 2((-1)(-1) - (2)(1)) - 3((1)(-1) - (2)(3)) + 1((1)(1) - (-1)(3)) \\right|$$\n"
        "$$V = \\left| 2(1 - 2) - 3(-1 - 6) + 1(1 + 3) \\right|$$\n"
        "$$V = \\left| 2(-1) - 3(-7) + 1(4) \\right|$$\n"
        "$$V = \\left| -2 + 21 + 4 \\right| = |23| = 23$$\n"
        "Therefore, the correct volume is 23."
    )
    cursor.execute(
        """
        UPDATE questions
        SET question_text = ?, correct_answer = ?, explanation = ?, 
            last_repaired_at = CURRENT_TIMESTAMP, repair_version = 'v2.1',
            repair_notes = 'Vector volume correction: corrected determinant value and explanation contradiction'
        WHERE id = ?;
        """,
        (vec_text, vec_correct, vec_explanation, q_id_vec)
    )
    print("Vector volume question (QID c4c549e762704f06136ef8fa40b220cb) successfully updated.")
    
    # 2. Trypsin Zymogen Question Fix
    q_id_trypsin = "0ed87f6f67cd5729bdae64a036bde299"
    trypsin_text = (
        "Which of the following proteolytic enzymes is secreted by the pancreas as an inactive zymogen, "
        "is activated by enteropeptidase (enterokinase) in the duodenum, and then activates other pancreatic zymogens?"
    )
    trypsin_options = json.dumps(["Pepsin", "Trypsin", "Chymotrypsin", "Carboxypeptidase"])
    trypsin_correct = "Trypsin"
    trypsin_explanation = (
        "Trypsin is secreted by the pancreas in its inactive zymogen form, trypsinogen. "
        "Upon reaching the duodenum, trypsinogen is cleaved and activated by enteropeptidase "
        "(enterokinase), an enzyme present in the intestinal mucosal brush border. Once active, "
        "trypsin catalyzes the activation of other pancreatic zymogens, including chymotrypsinogen, "
        "procarboxypeptidase, and additional trypsinogen molecules. This auto-catalytic and "
        "cascade activation makes trypsin the central molecular switch of pancreatic digestion."
    )
    cursor.execute(
        """
        UPDATE questions
        SET question_text = ?, options = ?, correct_answer = ?, explanation = ?,
            last_repaired_at = CURRENT_TIMESTAMP, repair_version = 'v2.1',
            repair_notes = 'Trypsin correction: updated stem to target zymogen activation precisely and removed ambiguity'
        WHERE id = ?;
        """,
        (trypsin_text, trypsin_options, trypsin_correct, trypsin_explanation, q_id_trypsin)
    )
    print("Trypsin zymogen question (QID 0ed87f6f67cd5729bdae64a036bde299) successfully updated.")
    
    # 3. Ellipse Eccentricity Question Fix
    q_id_ellipse = "4d0658b0f3e06f1f18cf938c303ce629"
    ellipse_text = (
        "Let $P$ be an endpoint of the latus rectum of the ellipse $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ "
        "(with $a > b$). If the latus rectum subtends a right angle at the center of the ellipse, then "
        "the eccentricity $e$ of the ellipse satisfies:"
    )
    ellipse_options = json.dumps([
        "$e^2 = \\frac{1}{2}$",
        "$e^2 = \\frac{\\sqrt{2}-1}{1}$",
        "$e^2 = \\frac{2}{3}$",
        "$e^2 = \\frac{\\sqrt{5}-1}{2}$"
    ])
    ellipse_correct = "$e^2 = \\frac{\\sqrt{5}-1}{2}$"
    ellipse_explanation = (
        "The endpoints of the latus rectum of the ellipse are $P(ae, \\frac{b^2}{a})$ and $Q(ae, -\\frac{b^2}{a})$. "
        "For the latus rectum to subtend a right angle at the center $O(0,0)$, the product of the slopes of "
        "the lines $OP$ and $OQ$ must equal $-1$:\n"
        "$$m_{OP} \\cdot m_{OQ} = -1 \\Rightarrow \\left(\\frac{b^2/a}{ae}\\right) \\cdot \\left(\\frac{-b^2/a}{ae}\\right) = -1$$\n"
        "$$\\Rightarrow -\\frac{b^4}{a^4 e^2} = -1 \\Rightarrow b^4 = a^4 e^2$$\n"
        "Since $b^2 = a^2(1 - e^2)$, we substitute and get:\n"
        "$$a^4(1 - e^2)^2 = a^4 e^2 \\Rightarrow (1 - e^2)^2 = e^2 \\Rightarrow 1 - e^2 = e \\quad \\text{(since } e > 0 \\text{ and } e < 1\\text{)}$$\n"
        "$$\\Rightarrow e^2 + e - 1 = 0$$\n"
        "Solving the quadratic equation in $e$ using the quadratic formula:\n"
        "$$e = \\frac{-1 + \\sqrt{5}}{2}$$\n"
        "Squaring both sides yields:\n"
        "$$e^2 = \\left(\\frac{\\sqrt{5}-1}{2}\\right)^2 = \\frac{5 - 2\\sqrt{5} + 1}{4} = \\frac{6 - 2\\sqrt{5}}{4} = \\frac{3 - \\sqrt{5}}{2}$$\n"
        "Note that $\\frac{3 - \\sqrt{5}}{2} = \\frac{\\sqrt{5}-1}{2}$ (since $\\frac{\\sqrt{5}-1}{2} = \\frac{2}{\\sqrt{5}+1}$ and matches golden ratio property $\\frac{3-\\sqrt{5}}{2} = \\frac{\\sqrt{5}-1}{2}$ by conjugate properties: $(3-\\sqrt{5})/2 = (\\sqrt{5}-1)^2/4$ which is $\\frac{\\sqrt{5}-1}{2}$ since $((\\sqrt{5}-1)/2)^2 = \\frac{\\sqrt{5}-1}{2}$? No, wait! Let\\'s verify this relation: $((\\sqrt{5}-1)/2)^2 = \\frac{6-2\\sqrt{5}}{4} = \\frac{3-\\sqrt{5}}{2}$. But wait! $\\frac{3-\\sqrt{5}}{2} = \\frac{\\sqrt{5}-1}{2}$? No, that would mean $(\\frac{\\sqrt{5}-1}{2})^2 = \\frac{\\sqrt{5}-1}{2}$, which is only true if it\\'s 0 or 1, which it\\'s not! Let\\'s compute: $(3-\\sqrt{5})/2 \\approx (3 - 2.236)/2 = 0.382$. But $(\\sqrt{5}-1)/2 \\approx 1.236/2 = 0.618$. Ah! Actually, the equation $(1-e^2)^2 = e^2$ has two roots for $1-e^2$: $1-e^2 = e$ or $1-e^2 = -e$. The root $1-e^2 = e \\Rightarrow e^2 + e - 1 = 0 \\Rightarrow e = \\frac{\\sqrt{5}-1}{2} \\approx 0.618$. The other root is $1-e^2 = -e \\Rightarrow e^2 - e - 1 = 0 \\Rightarrow e = \\frac{1+\\sqrt{5}}{2} > 1$ (which is invalid since $e < 1$). Thus we have $e^2 + e - 1 = 0 \\Rightarrow e^2 = 1-e$. Substituting $e = \\frac{\\sqrt{5}-1}{2}$ gives: $e^2 = 1 - \\frac{\\sqrt{5}-1}{2} = \\frac{2 - \\sqrt{5} + 1}{2} = \\frac{3-\\sqrt{5}}{2}$. Wait! How did the correct answer become $e^2 = \\frac{\\sqrt{5}-1}{2}$? Ah! Let\\'s re-derive: $b^4 = a^4 e^2 \\Rightarrow (b^2/a^2)^2 = e^2 \\Rightarrow (1-e^2)^2 = e^2 \\Rightarrow 1-e^2 = e$. So $e^2 + e - 1 = 0$. This gives $e = \\frac{\\sqrt{5}-1}{2}$! So $e = \\frac{\\sqrt{5}-1}{2}$ is the value of $e$, not $e^2$! If $e = \\frac{\\sqrt{5}-1}{2}$, then $e^2 = \\frac{3-\\sqrt{5}}{2} \\approx 0.382$. But wait! Is there another derivation where $e^2 = \\frac{\\sqrt{5}-1}{2}$? Yes! Let\\'s check: $b^2 = a^2 e^2 \\Rightarrow 1-e^2 = e^2 \\Rightarrow 2e^2 = 1 \\Rightarrow e^2 = 1/2$. What if the normal at the end of latus rectum passes through the other end of the minor axis? Then $e^4 + e^2 - 1 = 0$. Solving this quadratic in $e^2$ gives $e^2 = \\frac{\\sqrt{5}-1}{2}$! Yes! This is a completely different, famous JEE problem: \\'If the normal at one end of the latus rectum of the ellipse passes through the other extremity of the minor axis, then the eccentricity e satisfies $e^4 + e^2 - 1 = 0$, which gives $e^2 = \\frac{\\sqrt{5}-1}{2}$.\\' Ah! The question text from the generator was a combination/confusion of these two famous problems! It combined the latus rectum right-angle problem and the normal passing through the minor axis problem! It wrote the stem of the right-angle focal chord, but it wrote the options of the normal-latus-rectum problem! Let\\'s check if that\\'s true: Yes, the option $e^2 = \\frac{\\sqrt{5}-1}{2}$ belongs to the normal problem, whereas the right-angle problem gives $e = \\frac{\\sqrt{5}-1}{2}$ (meaning $e^2 = \\frac{3-\\sqrt{5}}{2}$). Under the normal-latus-rectum problem, the relation is $e^4 + e^2 - 1 = 0 \\Rightarrow e^2 = \\frac{\\sqrt{5}-1}{2}$. So let\\'s rewrite the stem of the ellipse question to match the normal-latus-rectum problem exactly! That way, the correct answer $e^2 = \\frac{\\sqrt{5}-1}{2}$ is 100% mathematically correct and matches the options perfectly! Let\\'s define this new stem: \\'If the normal at an end of the latus rectum of the ellipse $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ passes through the extremity of the minor axis $(0, -b)$, then the eccentricity $e$ of the ellipse satisfies:\\' This is exceptionally smart! It corrects the generator's confusion, matches the options and correct answer perfectly, and makes it a classic, rigorous JEE Advanced question!)"
    )
    ellipse_text_normal = (
        "If the normal at one end of the latus rectum of the ellipse $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ "
        "passes through the other extremity of the minor axis, then the eccentricity $e$ of the ellipse satisfies:"
    )
    ellipse_explanation_normal = (
        "Let the end of the latus rectum in the first quadrant be $P(ae, \\frac{b^2}{a})$. "
        "The equation of the normal to the ellipse at $P(x_1, y_1)$ is:\n"
        "$$\\frac{a^2 x}{x_1} - \\frac{b^2 y}{y_1} = a^2 - b^2$$\n"
        "Substituting $x_1 = ae$ and $y_1 = \\frac{b^2}{a}$:\n"
        "$$\\frac{a^2 x}{ae} - \\frac{b^2 y}{b^2/a} = a^2 - b^2 \\Rightarrow \\frac{a x}{e} - a y = a^2 - b^2$$\n"
        "Since the normal passes through the extremity of the minor axis $(0, -b)$:\n"
        "$$\\frac{a(0)}{e} - a(-b) = a^2 - b^2 \\Rightarrow ab = a^2 - b^2$$\n"
        "Dividing both sides by $a^2$:\n"
        "$$\\frac{b}{a} = 1 - \\frac{b^2}{a^2}$$\n"
        "Since $e^2 = 1 - \\frac{b^2}{a^2}$, we have $\\frac{b^2}{a^2} = 1 - e^2 \\Rightarrow \\frac{b}{a} = \\sqrt{1 - e^2}$. "
        "Substituting this in the equation:\n"
        "$$\\sqrt{1 - e^2} = e^2$$\n"
        "Squaring both sides:\n"
        "$$1 - e^2 = e^4 \\Rightarrow e^4 + e^2 - 1 = 0$$\n"
        "Solving this quadratic in $e^2$:\n"
        "$$e^2 = \\frac{-1 + \\sqrt{5}}{2} = \\frac{\\sqrt{5}-1}{2}$$\n"
        "Thus, the eccentricity satisfies $e^2 = \\frac{\\sqrt{5}-1}{2}$."
    )
    cursor.execute(
        """
        UPDATE questions
        SET question_text = ?, options = ?, correct_answer = ?, explanation = ?,
            last_repaired_at = CURRENT_TIMESTAMP, repair_version = 'v2.1',
            repair_notes = 'Ellipse correction: updated stem to normal-at-latus-rectum problem to match options and correct answer mathematically'
        WHERE id = ?;
        """,
        (ellipse_text_normal, ellipse_options, ellipse_correct, ellipse_explanation_normal, q_id_ellipse)
    )
    print("Ellipse question (QID 4d0658b0f3e06f1f18cf938c303ce629) successfully updated.")
    
    conn.commit()
    conn.close()
    print("Phase 2 known question corrections completed successfully.")

if __name__ == "__main__":
    main()
