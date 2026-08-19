# -*- coding: utf-8 -*-
"""
Traducteur automatique intégral pour l'œuvre complète d'Arnold Ehret
Traduit l'intégralité des 269 000 caractères paragraphe par paragraphe.
"""

import os
import re
import html
import subprocess

chapters_dir = "/Users/richard/Developer/vital_track/scratch/ehret_chapters"
html_out_path = "/Users/richard/Developer/vital_track/scratch/full_unabridged_ehret.html"
pdf_pub_path = "/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"
pdf_dist_path = "/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"

# Vitalist French terminology dictionary
VITALIST_DICT = [
    (r"\bMucusless Diet Healing System\b", "Système de Guérison du Régime Sans Mucus"),
    (r"\bMucusless Diet\b", "Régime Sans Mucus"),
    (r"\bmucusless\b", "sans mucus"),
    (r"\bMucus-Forming Foods\b", "Aliments Formateurs de Mucus"),
    (r"\bmucus-forming\b", "formateur de mucus"),
    (r"\bmucus\b", "mucus"),
    (r"\bRational Fasting\b", "Jeûne Rationnel"),
    (r"\bfasting\b", "jeûne"),
    (r"\bfaster\b", "jeûneur"),
    (r"\bVitality\b", "Vitalité"),
    (r"\bvitality\b", "vitalité"),
    (r"\bObstruction\b", "Obstruction"),
    (r"\bobstruction\b", "obstruction"),
    (r"\bPower\b", "Puissance"),
    (r"\bpower\b", "puissance"),
    (r"\bConstipation\b", "Constipation"),
    (r"\bconstipation\b", "constipation"),
    (r"\bTransition Diet\b", "Régime de Transition"),
    (r"\btransition diet\b", "régime de transition"),
    (r"\bMagic Mirror\b", "Miroir Magique"),
    (r"\bFormula of Life\b", "Formule de la Vie"),
    (r"\bNew Physiology\b", "Nouvelle Physiologie"),
    (r"\bnew physiology\b", "nouvelle physiologie"),
    (r"\bNaturopathy\b", "Naturopathie"),
    (r"\bnaturopathy\b", "naturopathie"),
    (r"\bMedical Science\b", "Science Médicale"),
    (r"\bmedical science\b", "science médicale"),
    (r"\bMetabolism\b", "Métabolisme"),
    (r"\bmetabolism\b", "métabolisme"),
    (r"\bProtein\b", "Protéine"),
    (r"\bprotein\b", "protéine"),
    (r"\bproteins\b", "protéines"),
    (r"\bAlbumin\b", "Albumine"),
    (r"\balbumin\b", "albumine"),
    (r"\bBright's disease\b", "maladie de Bright"),
    (r"\bEhretist\b", "Ehrétiste"),
    (r"\bEhretists\b", "Ehrétistes"),
    (r"\bEhretism\b", "Ehrétisme"),
    (r"\bNo-Breakfast Plan\b", "Plan Sans Petit-Déjeuner"),
    (r"\bintestinal broom\b", "balai intestinal"),
    (r"\benema\b", "lavement"),
    (r"\benemas\b", "lavements")
]

print("Preparing chapter processing...")
