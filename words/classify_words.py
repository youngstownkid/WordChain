import pandas as pd
from pathlib import Path

# ---- 1. Setup ----

base_dir = Path(__file__).parent   # folder with subtlex.xls and N.txt files
subtlex_path = base_dir / "subtlex.xls"

# Word lengths you have files for
lengths = range(2, 21)  # adjust as needed

# ---- 2. Load SUBTLEX ----

subtlex = pd.read_excel(subtlex_path, usecols=["Word", "FREQcount"])
subtlex = subtlex.rename(columns={"Word": "word", "FREQcount": "freq"})
subtlex["word"] = subtlex["word"].str.lower()

# ---- 3. Difficulty mapping ----

def freq_to_level(freq):
    if freq >= 1000:
        return "beginner"
    elif freq >= 100:
        return "mid-level"
    elif freq >= 10:
        return "advanced"
    else:
        return "expert"

# ---- 4. Process each length file and write 4 txt files ----

for L in lengths:
    txt_path = base_dir / f"{L}.txt"
    if not txt_path.exists():
        print(f"Skipping {txt_path} (not found)")
        continue

    print(f"Processing {txt_path}...")

    # Load words (one per line)
    words = pd.read_csv(txt_path, header=None, names=["word"], dtype=str)
    words["word"] = words["word"].str.strip().str.lower()
    words["length"] = L

    # Merge with SUBTLEX
    merged = words.merge(subtlex, on="word", how="left")
    merged["freq"] = merged["freq"].fillna(0)

    # Assign level
    merged["level"] = merged["freq"].apply(freq_to_level)

    # ---- 5. Split by level and save sorted txt files ----

    # Map level names to suffix letters
    level_suffix = {
        "beginner": "b",
        "mid-level": "m",
        "advanced": "a",
        "expert": "e",
    }

    for level_name, suffix in level_suffix.items():
        subset = merged[merged["level"] == level_name].copy()
        if subset.empty:
            continue

        subset = subset.sort_values("word")

        out_path = base_dir / f"{L}{suffix}.txt"
        # Write one word per line, no header
        subset["word"].to_csv(out_path, index=False, header=False)
        print(f"Saved {out_path}")

print("Done.")
