#!/usr/bin/env python3
"""
Mise à jour de mediaSearchIndex.js avec les chapitres français et anglais locaux.
"""

import re
import json
from pathlib import Path

FILE_PATH = Path("/Users/richard/Developer/vital_track/web-app/src/data/mediaSearchIndex.js")

FRENCH_SEBI_CHAPTERS = [
    {
        "id": "vid_sebi_fr_01",
        "type": "video",
        "lang": "fr",
        "langLabel": "Français (VF HD)",
        "title": "The Rock Newman Show ft. Dr. Sebi (Version Française HD)",
        "speaker": "Dr. Sebi (Doublage Studio Français)",
        "source": "Média Local HD",
        "videoType": "local",
        "mediaUrl": "/videos/dr-sebi-documentary-fr.mp4",
        "chapter": "Introduction & La Maladie Unique (Mucus & Acidité)",
        "timeFormatted": "00:00",
        "timeSeconds": 0,
        "badgeClass": "badge-success",
        "keywords": ["dr sebi", "mucus", "maladie unique", "acidite", "bio electrique", "alcalinite"],
        "topics": ["dr-sebi", "mucus", "interview", "guerison"],
        "excerpt": "Le Dr. Sebi démontre que la maladie est causée par une seule anomalie fondamentale : l'accumulation de mucus et d'acidité qui étouffe la cellule.",
        "fullText": "Dr Sebi interview Rock Newman maladie unique mucus acidite nutrition bio-electrique terrain alcalin."
    },
    {
        "id": "vid_sebi_fr_02",
        "type": "video",
        "lang": "fr",
        "langLabel": "Français (VF HD)",
        "title": "The Rock Newman Show ft. Dr. Sebi (Version Française HD)",
        "speaker": "Dr. Sebi (Doublage Studio Français)",
        "source": "Média Local HD",
        "videoType": "local",
        "mediaUrl": "/videos/dr-sebi-documentary-fr.mp4",
        "chapter": "Origines au Honduras & Éveil Thérapeutique",
        "timeFormatted": "04:00",
        "timeSeconds": 240,
        "badgeClass": "badge-success",
        "keywords": ["honduras", "ilanga", "mexique", "herboriste", "asthme", "diabete", "guerison 90 jours"],
        "topics": ["dr-sebi", "histoire", "origines"],
        "excerpt": "Comment Dr. Sebi s'est lui-même guéri de l'asthme et du diabète en 90 jours grâce à un herboriste mexicain et aux plantes sauvages.",
        "fullText": "Dr Sebi origines Ilanga Honduras guerison diabete asthme Alfredo Cortez 90 jours plantes sauvages."
    },
    {
        "id": "vid_sebi_fr_03",
        "type": "video",
        "lang": "fr",
        "langLabel": "Français (VF HD)",
        "title": "The Rock Newman Show ft. Dr. Sebi (Version Française HD)",
        "speaker": "Dr. Sebi (Doublage Studio Français)",
        "source": "Média Local HD",
        "videoType": "local",
        "mediaUrl": "/videos/dr-sebi-documentary-fr.mp4",
        "chapter": "Le Rôle du Sang, de la Lymphe & du Fer Bio-électrique",
        "timeFormatted": "08:30",
        "timeSeconds": 510,
        "badgeClass": "badge-success",
        "keywords": ["fer", "bio ferro", "maya", "sang", "lymphe", "oxygene", "salsepareille", "bardane"],
        "topics": ["dr-sebi", "fer", "sang", "lymphe"],
        "excerpt": "Le fer végétal chélaté est le minéral magnétique conducteur qui transporte l'oxygène et l'électricité dans toutes les cellules.",
        "fullText": "Fer bio-electrique Bio-ferro Maya salsepareille bardane sang lymphe oxygene cellulaire."
    },
    {
        "id": "vid_sebi_fr_04",
        "type": "video",
        "lang": "fr",
        "langLabel": "Français (VF HD)",
        "title": "The Rock Newman Show ft. Dr. Sebi (Version Française HD)",
        "speaker": "Dr. Sebi (Doublage Studio Français)",
        "source": "Média Local HD",
        "videoType": "local",
        "mediaUrl": "/videos/dr-sebi-documentary-fr.mp4",
        "chapter": "Nutrition Bio-Électrique vs Aliments Hybridés & Amidon",
        "timeFormatted": "14:20",
        "timeSeconds": 860,
        "badgeClass": "badge-success",
        "keywords": ["amidon", "carotte", "hybridation", "hollande", "aliments electriques", "pomme de terre", "ble"],
        "topics": ["dr-sebi", "amidon", "aliments-electriques"],
        "excerpt": "La carotte et les légumes hybridés créés en laboratoire sont bourrés d'amidon inorganique qui encolle les villosités intestinales.",
        "fullText": "Aliments hybrides amidon colle intestinale carotte Queen Annes Lace nutrition bio-electrique."
    },
    {
        "id": "vid_sebi_fr_05",
        "type": "video",
        "lang": "fr",
        "langLabel": "Français (VF HD)",
        "title": "The Rock Newman Show ft. Dr. Sebi (Version Française HD)",
        "speaker": "Dr. Sebi (Doublage Studio Français)",
        "source": "Média Local HD",
        "videoType": "local",
        "mediaUrl": "/videos/dr-sebi-documentary-fr.mp4",
        "chapter": "Voltage Cellulaire, Graines & Eau de Source Alcaline",
        "timeFormatted": "19:40",
        "timeSeconds": 1180,
        "badgeClass": "badge-success",
        "keywords": ["graines", "fruits sans pepins", "voltage", "electricite", "eau de source", "alcalinite"],
        "topics": ["dr-sebi", "aliments-electriques", "eau"],
        "excerpt": "Importance vitale de consommer des fruits avec leurs graines et de boire au moins 3 à 4 litres d'eau de source pure par jour.",
        "fullText": "Graines fruits voltage cellulaire eau de source alcalinite membrane cellulaire electricite."
    },
    {
        "id": "vid_sebi_fr_06",
        "type": "video",
        "lang": "fr",
        "langLabel": "Français (VF HD)",
        "title": "The Rock Newman Show ft. Dr. Sebi (Version Française HD)",
        "speaker": "Dr. Sebi (Doublage Studio Français)",
        "source": "Média Local HD",
        "videoType": "local",
        "mediaUrl": "/videos/dr-sebi-documentary-fr.mp4",
        "chapter": "La Crise Curative & Le Grand Nettoyage Intracellulaire",
        "timeFormatted": "25:20",
        "timeSeconds": 1520,
        "badgeClass": "badge-success",
        "keywords": ["crise curative", "herxheimer", "elimination", "detoxification", "maux de tete", "reins"],
        "topics": ["dr-sebi", "detox", "crise-curative"],
        "excerpt": "Explication de la crise d'élimination : les herbes décollent le vieux mucus qui est évacué par les émonctoires.",
        "fullText": "Crise curative elimination mucus intracellulaire drainage lymphatique reins peau selles."
    },
    {
        "id": "vid_sebi_fr_07",
        "type": "video",
        "lang": "fr",
        "langLabel": "Français (VF HD)",
        "title": "The Rock Newman Show ft. Dr. Sebi (Version Française HD)",
        "speaker": "Dr. Sebi (Doublage Studio Français)",
        "source": "Média Local HD",
        "videoType": "local",
        "mediaUrl": "/videos/dr-sebi-documentary-fr.mp4",
        "chapter": "Le Procès de la Cour Suprême de New York (1988)",
        "timeFormatted": "32:45",
        "timeSeconds": 1965,
        "badgeClass": "badge-success",
        "keywords": ["proces 1988", "cour supreme", "77 temoins", "sida", "cancer", "cecite", "acquittement"],
        "topics": ["dr-sebi", "proces", "preuves"],
        "excerpt": "Le récit du procès historique gagné à New York avec 77 témoins guéris et bilans sanguins certifiés par de grands laboratoires.",
        "fullText": "Proces Cour Supreme New York 1988 77 temoins guerison sida cancer cecite acquittement total."
    },
    {
        "id": "vid_sebi_fr_08",
        "type": "video",
        "lang": "fr",
        "langLabel": "Français (VF HD)",
        "title": "The Rock Newman Show ft. Dr. Sebi (Version Française HD)",
        "speaker": "Dr. Sebi (Doublage Studio Français)",
        "source": "Média Local HD",
        "videoType": "local",
        "mediaUrl": "/videos/dr-sebi-documentary-fr.mp4",
        "chapter": "Protocoles Thérapeutiques : Sea Moss, Fucus, Maya & Viento",
        "timeFormatted": "38:20",
        "timeSeconds": 2300,
        "badgeClass": "badge-success",
        "keywords": ["sea moss", "bladderwrack", "fucus", "chelation 2", "viento", "92 mineraux", "thyroide"],
        "topics": ["dr-sebi", "plantes", "sea-moss", "formules"],
        "excerpt": "Le Sea Moss d'Irlande et le Bladderwrack apportent 92 minéraux sur les 102 nécessaires au corps pour régénérer la cellule.",
        "fullText": "Sea Moss Bladderwrack fucus Chelation 2 Viento 92 mineraux salsepareille bio-ferro thyroide."
    },
    {
        "id": "vid_sebi_fr_09",
        "type": "video",
        "lang": "fr",
        "langLabel": "Français (VF HD)",
        "title": "The Rock Newman Show ft. Dr. Sebi (Version Française HD)",
        "speaker": "Dr. Sebi (Doublage Studio Français)",
        "source": "Média Local HD",
        "videoType": "local",
        "mediaUrl": "/videos/dr-sebi-documentary-fr.mp4",
        "chapter": "Usha Village au Honduras & Sources Thermales Volcaniques",
        "timeFormatted": "45:10",
        "timeSeconds": 2710,
        "badgeClass": "badge-success",
        "keywords": ["usha village", "honduras", "sources thermales", "eau chaude", "soufre", "bains"],
        "topics": ["dr-sebi", "usha-village", "thermes"],
        "excerpt": "Les cures de régénération à Usha Village au Honduras avec les eaux thermales soufrées et l'alimentation vivante.",
        "fullText": "Usha Village Honduras sources thermales mineraux volcaniques soufre bains chauds guerison holistique."
    },
    {
        "id": "vid_sebi_fr_10",
        "type": "video",
        "lang": "fr",
        "langLabel": "Français (VF HD)",
        "title": "The Rock Newman Show ft. Dr. Sebi (Version Française HD)",
        "speaker": "Dr. Sebi (Doublage Studio Français)",
        "source": "Média Local HD",
        "videoType": "local",
        "mediaUrl": "/videos/dr-sebi-documentary-fr.mp4",
        "chapter": "Message Final d'Éveil & Héritage Vitaliste pour l'Humanité",
        "timeFormatted": "51:20",
        "timeSeconds": 3080,
        "badgeClass": "badge-success",
        "keywords": ["message", "heritage", "amour", "nature", "temple interieur", "souverainete"],
        "topics": ["dr-sebi", "spiritualite", "heritage"],
        "excerpt": "Le puissant message d'espoir du Dr. Sebi : respecter le temple du corps, embrasser les lois naturelles et vivre libre de la maladie.",
        "fullText": "Message final Dr Sebi amour du corps nature divine temple interieur souverainete sante vitalite."
    }
]

content = FILE_PATH.read_text(encoding="utf-8")

# Let's insert these 10 chapters right after export const MEDIA_SEARCH_DATABASE = [
insert_str = "export const MEDIA_SEARCH_DATABASE = [\n" + ",\n".join([f"  {json.dumps(c, ensure_ascii=False, indent=4).replace(chr(10), chr(10) + '  ')}" for c in FRENCH_SEBI_CHAPTERS]) + ",\n"

new_content = content.replace("export const MEDIA_SEARCH_DATABASE = [\n", insert_str, 1)
FILE_PATH.write_text(new_content, encoding="utf-8")
print(f"✅ Ajout de {len(FRENCH_SEBI_CHAPTERS)} chapitres français HD dans MEDIA_SEARCH_DATABASE.")
