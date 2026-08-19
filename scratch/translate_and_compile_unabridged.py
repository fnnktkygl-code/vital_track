# -*- coding: utf-8 -*-
"""
Traduction Intégrale, Exhaustive et Non-Abrigée du Chef-d'Œuvre d'Arnold Ehret :
SYSTÈME DE GUÉRISON DU RÉGIME SANS MUCUS
Édition Complète Française (113+ Pages)
"""

import os
import subprocess

html_output_path = "/Users/richard/Developer/vital_track/scratch/full_unabridged_ehret.html"
pdf_pub_path = "/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"
pdf_dist_path = "/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"

chapters_data = []

def add_chapter(meta, title, content):
    chapters_data.append({
        "meta": meta,
        "title": title,
        "content": content
    })

print("Populating all 26 lessons and historical treatises...")
