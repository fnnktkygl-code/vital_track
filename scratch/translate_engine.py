# -*- coding: utf-8 -*-
"""
Moteur de Traduction Intégrale Haute Fidélité pour le Livre d'Arnold Ehret
Génère le texte complet en français sans aucune abréviation.
"""

import os
import re
import html
import subprocess

chapters_dir = "/Users/richard/Developer/vital_track/scratch/ehret_chapters"
html_out_path = "/Users/richard/Developer/vital_track/scratch/full_unabridged_ehret.html"
pdf_pub_path = "/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"
pdf_dist_path = "/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"

print("Starting full unabridged translation engine...")
