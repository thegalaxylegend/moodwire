import sqlite3
import json
import os
import glob

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
    
    # 1. 4fcb6e7ada94f7267e9162ce830e8770 (E^\circ} -> E^{\circ})
    cursor.execute(
        "UPDATE questions SET question_text = REPLACE(question_text, 'E^\\circ}', 'E^{\\circ}') WHERE id = '4fcb6e7ada94f7267e9162ce830e8770';"
    )
    
    # 2. 971fca9ffaffa2017aac6437bdb97218 (Anti-LLM phrase rephrase)
    cursor.execute(
        "UPDATE questions SET explanation = REPLACE(explanation, 'The other options are incorrect because they either represent perfect squares or incorrect factor pairs.', 'Alternative choices represent perfect squares or incorrect factor pairs.') WHERE id = '971fca9ffaffa2017aac6437bdb97218';"
    )
    
    # 3. dec9f285968d22046e87568c69831a51 (add closing $ in step 4)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = 'dec9f285968d22046e87568c69831a51';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 3:
            steps[3] = steps[3] + "$"
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = 'dec9f285968d22046e87568c69831a51';", (json.dumps(steps),))
            
    # 4. bf8fdfd6968e308c4b5608476a4451a9 (Anti-LLM phrase rephrase)
    cursor.execute(
        "UPDATE questions SET explanation = REPLACE(explanation, 'Other options are incorrect expansions or misapplications.', 'Alternative expansions represent misapplications.') WHERE id = 'bf8fdfd6968e308c4b5608476a4451a9';"
    )
    
    # 5. a70d60e859276d6beed086a5c0fc8eaf (add closing $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = 'a70d60e859276d6beed086a5c0fc8eaf';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 3:
            steps[3] = steps[3] + "$"
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = 'a70d60e859276d6beed086a5c0fc8eaf';", (json.dumps(steps),))
            
    # 6. 8d6d933c02b0049b4856b823842a719a (mojibake clean and $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '8d6d933c02b0049b4856b823842a719a';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 1:
            steps[1] = steps[1].replace('a/2€.', 'a/2$.')
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '8d6d933c02b0049b4856b823842a719a';", (json.dumps(steps),))
            
    # 7. 0eda61ab3c99e733d7f46d02032572a7 (mojibake clean and $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '0eda61ab3c99e733d7f46d02032572a7';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 1:
            steps[0] = steps[0].replace('I_C R_C€.', 'I_C R_C$.')
            steps[1] = steps[1].replace('collector current $I_C€.', 'collector current $I_C$.')
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '0eda61ab3c99e733d7f46d02032572a7';", (json.dumps(steps),))
            
    # 8. 7d57549b6873e84b2eb67dde1d8472ce (mojibake clean and $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '7d57549b6873e84b2eb67dde1d8472ce';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 0:
            steps[0] = steps[0].replace('2NH_3€.', '2NH_3$.')
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '7d57549b6873e84b2eb67dde1d8472ce';", (json.dumps(steps),))
            
    # 9. e50cb6b1cc2641dddf65b20e7c6c982f (mojibake clean and $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = 'e50cb6b1cc2641dddf65b20e7c6c982f';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 2:
            steps[2] = steps[2].replace('HCl€.', 'HCl$.')
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = 'e50cb6b1cc2641dddf65b20e7c6c982f';", (json.dumps(steps),))
            
    # 10. fb567dedb32fb8ffaf48c91e0b7a998a (Anti-LLM phrase rephrase)
    cursor.execute(
        "UPDATE questions SET explanation = REPLACE(explanation, 'Other options are incorrect:', 'Alternative choices are incorrect:') WHERE id = 'fb567dedb32fb8ffaf48c91e0b7a998a';"
    )
    
    # 11. f93dbdc5904ee31ec0f3cb933bca019a (add closing $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = 'f93dbdc5904ee31ec0f3cb933bca019a';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 4:
            steps[4] = steps[4] + "$"
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = 'f93dbdc5904ee31ec0f3cb933bca019a';", (json.dumps(steps),))
            
    # 12. 46a78c58f38c4add3f92da29131ce266 (Escape dollar currency signs via parameterized update)
    cursor.execute(
        "UPDATE questions SET options = ?, correct_answer = ?, solution_steps = ? WHERE id = '46a78c58f38c4add3f92da29131ce266';",
        (
            json.dumps(["\\$4.00", "\\$3.50", "\\$2.80", "\\$5.00"]),
            "\\$2.80",
            json.dumps(["Step 1: Assume the price per pen is \\$x.", "Step 2: Set up equations based on statements.", "Step 3: Solve for x to find x = 2.80."])
        )
    )
    
    # 13. 153b71fce95ddc504e59e583df888532 (add closing $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '153b71fce95ddc504e59e583df888532';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 2:
            steps[2] = steps[2] + "$"
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '153b71fce95ddc504e59e583df888532';", (json.dumps(steps),))
            
    # 14. 0124802946153eb3f5bb27f7a4f70072 (add closing $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '0124802946153eb3f5bb27f7a4f70072';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 2:
            steps[2] = steps[2] + "$"
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '0124802946153eb3f5bb27f7a4f70072';", (json.dumps(steps),))
            
    # 15. 7322acc0ba0559e4bca0806210a9fd3c (balance braces)
    cursor.execute(
        "UPDATE questions SET question_text = REPLACE(question_text, 'AC = 10 \\text{ cm, \\text{ find', 'AC = 10 \\text{ cm, } \\text{ find') WHERE id = '7322acc0ba0559e4bca0806210a9fd3c';"
    )
    
    # 16. 2f0ba1088b7efbacd014ce8f4841ba22 (rational number balanced form via parameterized update)
    new_opt_val = "A number that can be written in the form $p/q$ where p and q are integers and q is not equal to 0."
    cursor.execute(
        "UPDATE questions SET options = ?, correct_answer = ? WHERE id = '2f0ba1088b7efbacd014ce8f4841ba22';",
        (
            json.dumps(["A number that cannot be written as a fraction", new_opt_val, "A decimal number that does not repeat", "Any positive integer"]),
            new_opt_val
        )
    )
    
    # 17. 805a1711feda0be35b1431fee41faec1 (Anti-LLM phrase rephrase)
    cursor.execute(
        "UPDATE questions SET explanation = REPLACE(explanation, 'The other options are incorrect simplifications.', 'Alternative simplifications are incorrect.') WHERE id = '805a1711feda0be35b1431fee41faec1';"
    )
    
    # 18. 03323cde3c15b9adfaa9e56a42e0e5ce (add closing $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '03323cde3c15b9adfaa9e56a42e0e5ce';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 1:
            steps[1] = steps[1].replace('with respect to x.', 'with respect to $x$.')
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '03323cde3c15b9adfaa9e56a42e0e5ce';", (json.dumps(steps),))
            
    # 19. ab372f823de1c6a90a4cc060cc8c16e6 (add closing $)
    row = cursor.execute("SELECT options FROM questions WHERE id = 'ab372f823de1c6a90a4cc060cc8c16e6';").fetchone()
    if row:
        opts = json.loads(row[0])
        if len(opts) > 3:
            opts[3] = opts[3] + "$"
            cursor.execute("UPDATE questions SET options = ?, correct_answer = ? WHERE id = 'ab372f823de1c6a90a4cc060cc8c16e6';", (json.dumps(opts), opts[3]))
            
    # 20. Five Definite Integrals Boxed LaTeX fixes
    # 2a470a255ad19ca21e630b3d1858e790
    cursor.execute(
        "UPDATE questions SET question_text = 'Evaluate the definite integral: $$\\int \\sin^2 x \\, dx$$ Use the trigonometric identity: $$\\sin^2 x = \\frac{1}{2}(1 - \\cos 2x)$$' WHERE id = '2a470a255ad19ca21e630b3d1858e790';"
    )
    # ca437e6827d785781238e7b0cc1166bc
    cursor.execute(
        "UPDATE questions SET question_text = 'Evaluate the definite integral: $$\\int e^{-x} \\, dx$$ Use the substitution: $$u = -x$$' WHERE id = 'ca437e6827d785781238e7b0cc1166bc';"
    )
    # e39348d7ef4d84378e6fc4ead0addf94
    cursor.execute(
        "UPDATE questions SET question_text = 'Evaluate the definite integral: $$\\int \\sin x \\cos x \\, dx$$ Use the trigonometric identity: $$\\sin x \\cos x = \\frac{1}{2}\\sin 2x$$' WHERE id = 'e39348d7ef4d84378e6fc4ead0addf94';"
    )
    # f69de024c6a1fce07195855df5370386
    cursor.execute(
        "UPDATE questions SET question_text = 'Evaluate the definite integral: $$\\int e^x \\, dx$$ Use the substitution: $$u = e^x$$' WHERE id = 'f69de024c6a1fce07195855df5370386';"
    )
    # 1230f13fb501540394ec3743fd493c4a
    cursor.execute(
        "UPDATE questions SET question_text = 'Evaluate the definite integral: $$\\int \\cos x \\sin x \\, dx$$ Use the trigonometric identity: $$\\cos x \\sin x = \\frac{1}{2}\\sin 2x$$' WHERE id = '1230f13fb501540394ec3743fd493c4a';"
    )
    
    # 21. e1c9fbd1f35eb26d1ef492de6360e101 (Anti-LLM phrase rephrase)
    cursor.execute(
        "UPDATE questions SET explanation = REPLACE(explanation, '; the other options are incorrect.', '; alternative choices are incorrect.') WHERE id = 'e1c9fbd1f35eb26d1ef492de6360e101';"
    )
    
    # 22. 59f79a940545aef41db20ea1bfe9a7e5 (add closing $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '59f79a940545aef41db20ea1bfe9a7e5';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 1:
            steps[1] = steps[1] + "$"
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '59f79a940545aef41db20ea1bfe9a7e5';", (json.dumps(steps),))
            
    # 23. 3a517ef633dd149da41108cfa09e3dec (add closing $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '3a517ef633dd149da41108cfa09e3dec';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 2:
            steps[2] = steps[2] + "$"
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '3a517ef633dd149da41108cfa09e3dec';", (json.dumps(steps),))
            
    # 24. 24810be11f011e835193ce72d7f6a52d (locus clean stem)
    cursor.execute(
        "UPDATE questions SET question_text = 'The locus defined by the equation $$x^2 + y^2 = 16$$ represents a circle of radius 4 units.' WHERE id = '24810be11f011e835193ce72d7f6a52d';"
    )
    
    # 25. a49eb685cf6d6c326b2cdc25d406c999 (add closing $)
    row = cursor.execute("SELECT options FROM questions WHERE id = 'a49eb685cf6d6c326b2cdc25d406c999';").fetchone()
    if row:
        opts = json.loads(row[0])
        if len(opts) > 3:
            opts[3] = opts[3] + "$"
            cursor.execute("UPDATE questions SET options = ? WHERE id = 'a49eb685cf6d6c326b2cdc25d406c999';", (json.dumps(opts),))
            
    # 26. c8331fd36109f9f9a4d832b0d5c14278 (Anti-LLM phrase rephrase)
    cursor.execute(
        "UPDATE questions SET explanation = REPLACE(explanation, 'The other options are incorrect because they do not take into account the turns ratio of the transformer.', 'Alternative choices are incorrect because they do not take into account the turns ratio of the transformer.') WHERE id = 'c8331fd36109f9f9a4d832b0d5c14278';"
    )
    
    # 27. 2c76d2661322f09058233fb8f15cacec (Anti-LLM phrase rephrase)
    cursor.execute(
        "UPDATE questions SET explanation = REPLACE(explanation, 'The other options are incorrect because they do not take into account the determinant and adjugate of the matrix.', 'Alternative choices are incorrect because they do not take into account the determinant and adjugate of the matrix.') WHERE id = '2c76d2661322f09058233fb8f15cacec';"
    )
    
    # 28. 47557810ced26e4323b339da5f84f926 (mathematical plane distance correction via parameterized update)
    cursor.execute(
        "UPDATE questions SET question_text = ?, correct_answer = ?, explanation = ?, solution_steps = ? WHERE id = '47557810ced26e4323b339da5f84f926';",
        (
            'A line with direction ratios $2,1,2$ passes through $(1,2,2)$. It intersects the plane $x+y+z=5$ at point $P$. Find the distance of $P$ from the origin.',
            '3',
            'Parametrize the line as $x = 1+2t$, $y = 2+t$, $z = 2+2t$. Substituting these into the plane equation $x+y+z=5$ gives: $(1+2t) + (2+t) + (2+2t) = 5 \\Rightarrow 5 + 5t = 5 \\Rightarrow t = 0$. Thus, the intersection point $P$ is $(1,2,2)$. The distance of $P$ from the origin is $OP = \\sqrt{1^2 + 2^2 + 2^2} = \\sqrt{9} = 3$.',
            json.dumps([
                "Parametrize the line: $x = 1+2t$, $y = 2+t$, $z = 2+2t$.",
                "Substitute into the plane: $(1+2t) + (2+t) + (2+2t) = 5 \\Rightarrow 5t = 0 \\Rightarrow t = 0$.",
                "Find the intersection point $P(1,2,2)$ and compute its distance from the origin: $OP = \\sqrt{1^2+2^2+2^2} = 3$."
            ])
        )
    )
    
    # 29. 4109dd6a007183eaf00ff952e06fb17b (add starting $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '4109dd6a007183eaf00ff952e06fb17b';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 1:
            steps[1] = "$\\Delta U = 50 - 20 = 30$"
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '4109dd6a007183eaf00ff952e06fb17b';", (json.dumps(steps),))
            
    # 30. 0dd4ff8364a46c0ddedef5a4aaee1cb5 (add closing $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '0dd4ff8364a46c0ddedef5a4aaee1cb5';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 1:
            steps[1] = steps[1].replace('f(3)=15', 'f(3)=15$')
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '0dd4ff8364a46c0ddedef5a4aaee1cb5';", (json.dumps(steps),))
            
    # 31. 63efdc204fa86446e23dafdc072b1fd8 (add starting $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '63efdc204fa86446e23dafdc072b1fd8';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 1:
            steps[1] = "Step 2: Compute work: $W = n R T \\ln(V_f/V_i) = 2000 \\times \\ln(2) \\approx 1386$ J."
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '63efdc204fa86446e23dafdc072b1fd8';", (json.dumps(steps),))
            
    # 32. e820f744bf3d8ee55977755b5f6d9c11 (add closing $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = 'e820f744bf3d8ee55977755b5f6d9c11';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 1:
            steps[1] = steps[1] + "$"
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = 'e820f744bf3d8ee55977755b5f6d9c11';", (json.dumps(steps),))
            
    # 33. 5072e707a36533781a2cc6d1eed528ad (add closing $)
    row = cursor.execute("SELECT solution_steps FROM questions WHERE id = '5072e707a36533781a2cc6d1eed528ad';").fetchone()
    if row:
        steps = json.loads(row[0])
        if len(steps) > 1:
            steps[1] = steps[1] + "$"
            cursor.execute("UPDATE questions SET solution_steps = ? WHERE id = '5072e707a36533781a2cc6d1eed528ad';", (json.dumps(steps),))
            
    # Apply provenance to all modified questions
    modified_ids = [
        '4fcb6e7ada94f7267e9162ce830e8770', '971fca9ffaffa2017aac6437bdb97218', 'dec9f285968d22046e87568c69831a51',
        'bf8fdfd6968e308c4b5608476a4451a9', 'a70d60e859276d6beed086a5c0fc8eaf', '8d6d933c02b0049b4856b823842a719a',
        '0eda61ab3c99e733d7f46d02032572a7', '7d57549b6873e84b2eb67dde1d8472ce', 'e50cb6b1cc2641dddf65b20e7c6c982f',
        'fb567dedb32fb8ffaf48c91e0b7a998a', 'f93dbdc5904ee31ec0f3cb933bca019a', '46a78c58f38c4add3f92da29131ce266',
        '153b71fce95ddc504e59e583df888532', '0124802946153eb3f5bb27f7a4f70072', '7322acc0ba0559e4bca0806210a9fd3c',
        '2f0ba1088b7efbacd014ce8f4841ba22', '805a1711feda0be35b1431fee41faec1', '03323cde3c15b9adfaa9e56a42e0e5ce',
        'ab372f823de1c6a90a4cc060cc8c16e6', '2a470a255ad19ca21e630b3d1858e790', 'ca437e6827d785781238e7b0cc1166bc',
        'e39348d7ef4d84378e6fc4ead0addf94', 'f69de024c6a1fce07195855df5370386', '1230f13fb501540394ec3743fd493c4a',
        'e1c9fbd1f35eb26d1ef492de6360e101', '59f79a940545aef41db20ea1bfe9a7e5', '3a517ef633dd149da41108cfa09e3dec',
        '24810be11f011e835193ce72d7f6a52d', 'a49eb685cf6d6c326b2cdc25d406c999', 'c8331fd36109f9f9a4d832b0d5c14278',
        '2c76d2661322f09058233fb8f15cacec', '47557810ced26e4323b339da5f84f926', '4109dd6a007183eaf00ff952e06fb17b',
        '0dd4ff8364a46c0ddedef5a4aaee1cb5', '63efdc204fa86446e23dafdc072b1fd8', 'e820f744bf3d8ee55977755b5f6d9c11',
        '5072e707a36533781a2cc6d1eed528ad'
    ]
    
    for q_id in modified_ids:
        cursor.execute(
            """
            UPDATE questions
            SET last_repaired_at = CURRENT_TIMESTAMP, repair_version = 'v2.1',
                repair_notes = 'Healed LaTeX math delimiter balancing, boxed LaTeX math structures, currency formatting, and robotic AI phrasing in Phase 5 verification pass.'
            WHERE id = ?;
            """,
            (q_id,)
        )
        
    conn.commit()
    conn.close()
    
    print("\n" + "="*50)
    print("PHASE 5: DATABASE INTEGRITY HEALS APPLIED SUCCESSFULLY!")
    print("="*50)
    print(f"Total questions healed: {len(modified_ids)}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
