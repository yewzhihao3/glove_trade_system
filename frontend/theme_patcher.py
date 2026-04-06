import os
import re

REPLACEMENTS = {
    r'(?<!dark:)\bbg-\[\#020617\]\b': 'bg-white dark:bg-[#020617]',
    r'(?<!dark:)\bbg-\[\#020617\]/40\b': 'bg-white/40 dark:bg-[#020617]/40',
    r'(?<!dark:)\bbg-\[\#020617\]/80\b': 'bg-white/80 dark:bg-[#020617]/80',
    r'(?<!dark:)\bbg-slate-950\b': 'bg-white dark:bg-slate-950',
    r'(?<!dark:)\btext-slate-100\b': 'text-slate-900 dark:text-slate-100',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    for pattern, replacement in REPLACEMENTS.items():
        content = re.sub(pattern, replacement, content)
        
    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Migrated: {filepath}")

base_dir = r"c:\Users\Bruce Yew\Desktop\Project\trade-intelligence-platform\frontend\src"
for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

print("Patch complete!")
