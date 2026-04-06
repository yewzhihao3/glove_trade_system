import os
import re

# Migration script to convert generic inline dark Tailwind components
# to a responsive dual-class dark/light structure safely via negative lookbehind

REPLACEMENTS = {
    r'(?<!dark:)\btext-white\b': 'text-slate-900 dark:text-white',
    r'(?<!dark:)\bbg-slate-900\b': 'bg-white dark:bg-slate-900',
    r'(?<!dark:)\bbg-slate-900/50\b': 'bg-black/5 dark:bg-slate-900/50',
    r'(?<!dark:)\bbg-slate-900/80\b': 'bg-white/80 dark:bg-slate-900/80',
    r'(?<!dark:)\btext-slate-200\b': 'text-slate-900 dark:text-slate-200',
    r'(?<!dark:)\btext-slate-300\b': 'text-slate-600 dark:text-slate-300',
    r'(?<!dark:)\btext-slate-400\b': 'text-slate-500 dark:text-slate-400',
    r'(?<!dark:)\bbg-white/5\b': 'bg-black/5 dark:bg-white/5',
    r'(?<!dark:)\bbg-white/10\b': 'bg-black/10 dark:bg-white/10',
    r'(?<!dark:)\bbg-white/20\b': 'bg-black/20 dark:bg-white/20',
    r'(?<!dark:)\bbg-white/40\b': 'bg-white/40 dark:bg-black/40', # Edge cases
    r'(?<!dark:)\bhover:bg-white/5\b': 'hover:bg-black/5 dark:hover:bg-white/5',
    r'(?<!dark:)\bhover:bg-white/10\b': 'hover:bg-black/10 dark:hover:bg-white/10',
    r'(?<!dark:)\bborder-white/5\b': 'border-black/5 dark:border-white/5',
    r'(?<!dark:)\bborder-white/10\b': 'border-black/10 dark:border-white/10',
    r'(?<!dark:)\bborder-white/20\b': 'border-black/20 dark:border-white/20',
    r'(?<!dark:)\bg-\[\#020617\]\b': 'bg-slate-50 dark:bg-[#020617]',
    r'(?<!dark:)\bg-\[\#020617\]/40\b': 'bg-white/40 dark:bg-[#020617]/40',
    r'(?<!dark:)\bg-\[\#020617\]/80\b': 'bg-white/80 dark:bg-[#020617]/80',
    r'(?<!dark:)\btext-rose-200\b': 'text-rose-700 dark:text-rose-200',
    r'(?<!dark:)\btext-emerald-200\b': 'text-emerald-700 dark:text-emerald-200',
    r'(?<!dark:)\bhover:text-white\b': 'hover:text-slate-900 dark:hover:text-white',
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
print(f"Starting migration for {base_dir}")
for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

print("Migration complete!")
