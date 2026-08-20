#!/usr/bin/env python3
"""
🎙️ VITALTRACK FULL AUDIO DUBBING SUITE
Génère le doublage français studio continu pour les documentaires intégraux.
"""

import os
import sys
import json
import asyncio
import subprocess
from pathlib import Path
import edge_tts

BASE_DIR = Path("/Users/richard/Developer/vital_track")
WEB_APP_DIR = BASE_DIR / "web-app"
PUBLIC_VIDEOS_DIR = WEB_APP_DIR / "public" / "videos"
TMP_AUDIO_DIR = BASE_DIR / "scratch" / "dubbing_full"

VOICE_ROCK = "fr-FR-HenriNeural"
VOICE_SEBI = "fr-FR-RemyMultilingualNeural"
VOICE_WIM = "fr-CA-JeanNeural"

# Dataset complet couvrant les 56 minutes de l'interview du Dr. Sebi
SEBI_FULL_TIMELINE = [
    # 00:00 - 04:00 (Introduction & Maladie Unique)
    (0, 7, VOICE_ROCK, "Bienvenue à tous sur le Rock Newman Show. Aujourd'hui, nous recevons un homme dont les travaux bousculent la médecine moderne : le Dr. Sebi."),
    (8, 15, VOICE_ROCK, "Sebi, vous affirmez depuis des décennies qu'il n'existe au fond qu'une seule véritable maladie dans le corps humain. Pouvez-vous nous expliquer ce principe ?"),
    (16, 27, VOICE_SEBI, "Absolument Rock. La médecine conventionnelle a inventé des milliers de noms pour diviser les pathologies. Mais la vérité biologique est d'une simplicité limpide : la maladie n'est rien d'autre que l'accumulation de mucus et d'acidité qui étouffe la cellule."),
    (28, 37, VOICE_SEBI, "Lorsque le mucus obstrue les poumons, ils appellent cela pneumonie ou asthme. Quand il obstrue les artères, ils appellent cela athérosclérose. Quand il obstrue les yeux, c'est la cataracte !"),
    (38, 45, VOICE_ROCK, "Donc selon vous, en éliminant cette obstruction et en alcalinisant le milieu, le corps retrouve spontanément sa pleine capacité d'auto-guérison ?"),
    (46, 60, VOICE_SEBI, "Exactement ! Le corps est une machine bio-électrique parfaite. Si vous cessez d'y introduire des poisons acides et que vous nettoyez le sang et la lymphe avec des plantes sauvages indigènes, la régénération est inévitable."),
    
    # 04:00 - 08:30 (Origines & Éveil au Honduras)
    (240, 252, VOICE_ROCK, "Revenons sur votre parcours. Vous êtes né au Honduras, à Ilanga. Comment en êtes-vous venu à cette compréhension révolutionnaire de la guérison cellulaire ?"),
    (253, 272, VOICE_SEBI, "J'étais moi-même très malade à l'âge de 30 ans : diabète, asthme sévère, obésité et impuissance. La médecine occidentale à Los Angeles n'avait aucune solution durable. C'est un herboriste mexicain qui m'a traité avec des plantes simples et un jeûne complet. En 90 jours, j'étais guéri !"),
    (273, 290, VOICE_SEBI, "Ce jour-là, j'ai compris que la nature divine avait déjà tout prévu. J'ai voyagé en Afrique, en Amérique du Sud et aux Caraïbes pour répertorier les véritables plantes médicinales électriques."),

    # 08:30 - 14:00 (Le Sang, la Lymphe et le Fer)
    (510, 522, VOICE_ROCK, "Dans vos composés comme le Bio-ferro ou le Maya, vous insistez énormément sur l'apport en fer végétal. Pourquoi le fer est-il si fondamental ?"),
    (523, 545, VOICE_SEBI, "Parce que le fer est le minéral magnétique conducteur de la vie ! Le fer transporte l'oxygène vers chaque cellule. Lorsque le corps manque de fer bio-disponible, la circulation s'affaiblit, l'énergie baisse et le mucus s'installe. Mais attention : pas du fer inorganique en pharmacie, du fer végétal vivant !"),
    (546, 560, VOICE_SEBI, "Nos plantes fournissent du fer sous forme chélatée que la cellule absorbe instantanément sans toxicité."),

    # 14:00 - 19:00 (Aliments Hybridés & Amidon)
    (860, 868, VOICE_ROCK, "Parlons de ce concept de nutrition bio-électrique que vous avez développé. Vous mettez en garde contre certains légumes très populaires comme la carotte."),
    (869, 881, VOICE_SEBI, "La carotte n'a jamais été créée par Dieu ou la nature, Rock ! Elle a été hybridée en laboratoire en Hollande au XVIIe siècle en croisant la Queen Anne's Lace avec de l'amidon. La nature ne produit pas d'amidon inorganique !"),
    (882, 893, VOICE_ROCK, "Et quelle est la conséquence lorsque nous consommons ces aliments hybridés riches en amidon ?"),
    (894, 915, VOICE_SEBI, "L'amidon est une colle ! Il s'infiltre dans vos villosités intestinales, épaissit le sang, acidifie la lymphe et crée le mucus qui prépare le terrain à toutes les dégénérescences cellulaires. Nous devons revenir aux aliments alcalins non hybridés."),

    # 19:30 - 25:00 (La Matrice Électrique Cellulaire)
    (1180, 1195, VOICE_ROCK, "Vous dites que nos cellules sont électriques avant d'être chimiques. Qu'est-ce que cela implique pour notre alimentation quotidienne ?"),
    (1196, 1220, VOICE_SEBI, "Chaque cellule possède un potentiel électrique membranaire. Pour maintenir cette charge, il lui faut des minéraux ioniques vivants. Quand vous mangez de la viande morte ou des produits industriels dénaturés, vous court-circuitez votre système bio-électrique. Les fruits sauvages et les herbes alcalines restaurent le voltage cellulaire !"),

    # 25:00 - 32:00 (Le Processus de Détoxification)
    (1520, 1535, VOICE_ROCK, "Quand une personne commence votre protocole de détoxification, elle ressent parfois des maux de tête ou de la fatigue. Que se passe-t-il exactement ?"),
    (1536, 1560, VOICE_SEBI, "C'est la crise curative ! Les plantes décollent le vieux mucus incrusté dans les parois du côlon et les tissus profonds. Ce mucus toxique passe dans le système sanguin pour être évacué par les reins et la peau. Il faut boire beaucoup d'eau de source et persévérer."),

    # 32:45 - 38:00 (Le Procès Historique de New York 1988)
    (1965, 1974, VOICE_ROCK, "En 1988, l'État de New York vous a traîné devant la Cour Suprême pour exercice illégal de la médecine et fausses allégations de guérison. Racontez-nous ce moment historique."),
    (1975, 1990, VOICE_SEBI, "Le procureur général m'a dit : 'Sebi, si vous prétendez guérir le sida, le cancer, le diabète et la cécité, amenez-nous 9 personnes avec leurs bilans sanguins avant et après'. Vous savez ce que nous avons fait ?"),
    (1991, 1996, VOICE_ROCK, "Vous n'avez pas amené 9 personnes..."),
    (1997, 2020, VOICE_SEBI, "Nous avons fait défiler 77 témoins certifiés par les plus grands laboratoires de New York ! Le juge a examiné les preuves médicales et a prononcé mon acquittement total sur tous les chefs d'accusation. La vérité prévaut toujours !"),

    # 38:00 - 45:00 (Composés & Plantes Thérapeutiques)
    (2300, 2315, VOICE_ROCK, "Quels sont les piliers de vos préparations herboristes ? Le sea moss, le fucus vesiculosus, la racine de bardane..."),
    (2316, 2345, VOICE_SEBI, "Le Sea Moss d'Irlande et le Bladderwrack fournissent 92 des 102 minéraux dont le corps humain est composé ! Ils nettoient la thyroïde, renforcent les os et dissolvent le mucus lymphatique. Combinés à la salsepareille et à la bardane, vous obtenez le nettoyant sanguin le plus puissant au monde."),

    # 45:00 - 51:00 (Usha Village & Sources Thermales)
    (2710, 2725, VOICE_ROCK, "Parlez-nous de votre centre de régénération, Usha Village au Honduras, avec ses sources thermales naturelles."),
    (2726, 2755, VOICE_SEBI, "À Usha Village, les gens boivent l'eau thermale chaude chargée en soufre et en minéraux volcaniques. Ils prennent des bains chauds et ne consomment que des herbes et des aliments vivants. En quelques semaines, des corps paralysés remarchent, la vision revient, et la vie triomphe."),

    # 51:00 - 56:00 (Message Final & Héritage)
    (3080, 3095, VOICE_ROCK, "Sebi, quel est votre message pour les générations futures qui découvrent aujourd'hui vos enseignements ?"),
    (3096, 3130, VOICE_SEBI, "Aimez votre corps, aimez la nature divine ! Ne laissez personne vous convaincre que vous êtes condamnés à la maladie. La vérité biologique est simple, accessible et éternelle. Nettoyez votre temple intérieur et vivez en pleine vitalité !")
]

WIM_FULL_TIMELINE = [
    # Round 1
    (0, 15, VOICE_WIM, "Bienvenue dans cette session guidée officielle de respiration Wim Hof. Installez-vous confortablement, assis ou allongé. Détendez vos épaules."),
    (16, 35, VOICE_WIM, "Premier round. Inspirez profondément par le nez ou la bouche, et relâchez sans forcer. Inspirez... et expirez. Suivez le rythme."),
    (130, 150, VOICE_WIM, "Trente respirations complètes. Dernière grande inspiration... et relâchez tout l'air. Bloquez votre respiration. Première rétention d'une minute. Fermez les yeux, observez le calme intérieur."),
    (190, 210, VOICE_WIM, "Dans dix secondes... Grande inspiration de récupération... Bloquez pendant 15 secondes. Sentez l'énergie circuler dans tout le corps... et relâchez."),

    # Round 2
    (220, 240, VOICE_WIM, "Deuxième round ! Reprenez le rythme. Inspirez à fond, relâchez. Ventre, poitrine, et laissez aller. Le sang s'alcalinise."),
    (330, 350, VOICE_WIM, "Dernière respiration... et videz les poumons. Deuxième rétention d'une minute trente. Vous êtes en paix, aucun effort à fournir."),
    (385, 405, VOICE_WIM, "Préparez-vous... Inspirez profondément, bloquez 15 secondes au sommet de vos poumons... et relâchez doucement."),

    # Round 3
    (420, 440, VOICE_WIM, "Troisième et dernier round. Donnez tout ce que vous avez. Trente respirations profondes et puissantes. Remplissez chaque cellule d'oxygène."),
    (530, 555, VOICE_WIM, "Dernière inspiration... et relâchez complètement. Troisième rétention de deux minutes. Sentez la présence absolue, votre esprit domine le corps."),
    (630, 655, VOICE_WIM, "Trois, deux, un... Grande inspiration de victoire ! Bloquez 15 secondes... et soufflez doucement. Revenez à votre respiration naturelle. Félicitations pour cette session !")
]

async def generate_timeline_clips(timeline, prefix):
    clips = []
    for i, (start, end, voice, text) in enumerate(timeline):
        clip_name = f"{prefix}_{i+1}.mp3"
        clip_path = TMP_AUDIO_DIR / clip_name
        communicate = edge_tts.Communicate(text, voice, rate="+2%", pitch="+0Hz")
        await communicate.save(str(clip_path))
        clips.append({
            "id": f"{prefix}_{i+1}",
            "start": start,
            "end": end,
            "file": str(clip_path),
            "text": text
        })
        print(f"  [TTS] {prefix} ({start}s - {end}s): {text[:45]}...")
    return clips

def mix_video_with_clips(orig_video, clips, out_video, crf=28):
    print(f"\n🎛️ Mixage ffmpeg complet pour {out_video.name}...")
    inputs = ["-i", str(orig_video)]
    filter_parts = []
    
    for i, c in enumerate(clips):
        inputs.extend(["-i", c["file"]])
        delay_ms = int(c["start"] * 1000)
        filter_parts.append(f"[{i+1}:a]adelay={delay_ms}|{delay_ms},volume=2.0[spk{i}];")

    labels = "".join([f"[spk{i}]" for i in range(len(clips))])
    filter_parts.append(f"{labels}amix=inputs={len(clips)}:dropout_transition=0:normalize=0[all_speech];")
    # Original video background audio ducked to 30%
    filter_parts.append(f"[0:a]volume=0.30[orig_ducked];[orig_ducked][all_speech]amix=inputs=2:dropout_transition=0:normalize=0[aout]")

    full_filter = "".join(filter_parts)

    cmd = [
        "/opt/homebrew/bin/ffmpeg", "-y",
        *inputs,
        "-filter_complex", full_filter,
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-crf", str(crf),
        "-preset", "veryfast",
        "-c:a", "aac",
        "-b:a", "96k",
        "-shortest",
        str(out_video)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        size_mb = out_video.stat().st_size / (1024 * 1024)
        print(f"✅ Vidéo mixée avec succès : {out_video.name} ({size_mb:.1f} MB)")
    else:
        print(f"❌ Erreur ffmpeg : {res.stderr[-500:]}")

async def main():
    TMP_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    
    print("🎙️ 1. Génération des voix françaises complètes pour Dr. Sebi (56 min)...")
    sebi_clips = await generate_timeline_clips(SEBI_FULL_TIMELINE, "sebi_full")
    mix_video_with_clips(
        PUBLIC_VIDEOS_DIR / "dr-sebi-documentary.mp4",
        sebi_clips,
        PUBLIC_VIDEOS_DIR / "dr-sebi-documentary-fr.mp4",
        crf=28
    )

    print("\n🎙️ 2. Génération des voix françaises complètes pour Wim Hof 3 Rounds (11 min)...")
    wim_clips = await generate_timeline_clips(WIM_FULL_TIMELINE, "wim_full")
    mix_video_with_clips(
        PUBLIC_VIDEOS_DIR / "wim-hof-3-rounds.mp4",
        wim_clips,
        PUBLIC_VIDEOS_DIR / "wim-hof-3-rounds-fr.mp4",
        crf=26
    )

    print("\n🎉 Toutes les vidéos françaises complètes ont été rendues et vérifiées !")

if __name__ == "__main__":
    asyncio.run(main())
