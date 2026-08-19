# -*- coding: utf-8 -*-
import os
import re
import html
import subprocess

chapters_dir = "/Users/richard/Developer/vital_track/scratch/ehret_chapters"
html_out_path = "/Users/richard/Developer/vital_track/scratch/full_unabridged_ehret.html"
pdf_pub_path = "/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"
pdf_dist_path = "/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"

print("Reading all chapter files...")
chapter_files = sorted([f for f in os.listdir(chapters_dir) if f.endswith('.txt') and int(f.replace('ch_', '').replace('.txt', '')) >= 30])
print(f"Found {len(chapter_files)} chapter files to compile.")
