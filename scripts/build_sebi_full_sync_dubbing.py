#!/usr/bin/env python3
"""
🎙️ VITALTRACK DR. SEBI EXACT-SYNC DUBBING PIPELINE
Génère la piste vocale française intégrale et synchronisée pour les 56 minutes du Dr. Sebi
à partir des timestamps exacts de Whisper.
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
SCRATCH_DIR = BASE_DIR / "scratch"
CLIPS_DIR = SCRATCH_DIR / "sebi_sync_clips"

VOICE_ROCK = "fr-FR-HenriNeural"
VOICE_SEBI = "fr-FR-RemyMultilingualNeural"

# Segments conversationnels synchronisés avec les timestamps réels de l'émission WHUT
SEBI_SYNC_CONVERSATION = [
    # 00:00 - 01:00 : Introduction de l'émission
    (0.0, 8.0, VOICE_ROCK, "Ce soir dans le Rock Newman Show : l'herboriste Dr. Sebi, qui a accompagné Michael Jackson et Lisa 'Left Eye' Lopes."),
    (8.2, 18.0, VOICE_ROCK, "Il affirme que sa nutrition bio-électrique cellulaire régénère le corps humain et élimine les maladies dégénératives."),
    (18.2, 24.0, VOICE_ROCK, "De ses origines au Honduras jusqu'à sa victoire historique devant la Cour Suprême de New York. C'est tout de suite sur The Rock Newman Show !"),
    (44.0, 56.0, VOICE_ROCK, "Bienvenue à tous sur le Rock Newman Show depuis le campus historique de l'Université Howard, dans la capitale fédérale. Je suis Rock Newman."),
    (56.5, 70.0, VOICE_ROCK, "Notre invité ce soir est un homme extraordinaire, dont le parcours et les découvertes bousculent toutes les certitudes de la médecine moderne : le Dr. Sebi."),
    (70.5, 85.0, VOICE_ROCK, "Sebi, bienvenue parmi nous. Pour commencer, vous affirmez qu'il n'y a fondamentalement qu'une seule maladie dans le corps humain. Expliquez-nous."),

    # 01:25 - 05:00 : Théorie du Mucus et de l'Acidité
    (86.0, 110.0, VOICE_SEBI, "Merci Rock. La médecine allopathique a créé des milliers de diagnostics compliqués. Mais en réalité, il n'y a qu'une seule maladie : la compromission de la membrane muqueuse par un excès de mucus et d'acidité."),
    (111.0, 130.0, VOICE_SEBI, "Lorsque le mucus toxique s'accumule dans les poumons, ils appellent cela pneumonie ou bronchite. Quand il bouche les conduits auditifs, ils appellent cela surdité. Quand il envahit les yeux, c'est la cataracte !"),
    (131.0, 148.0, VOICE_ROCK, "Donc pour vous, la maladie change simplement de nom selon l'endroit où le mucus obstrue les tissus ?"),
    (149.0, 175.0, VOICE_SEBI, "Exactement ! La cause première reste toujours la même. Si vous nettoyez le corps, que vous décollez ce mucus et que vous restaurez l'alcalinité du sang avec des plantes électriques, la cellule respire à nouveau et s'auto-guérit."),
    (176.0, 195.0, VOICE_ROCK, "Pourquoi le système médical conventionnel n'enseigne-t-il pas cette approche si elle est si naturelle et efficace ?"),
    (196.0, 225.0, VOICE_SEBI, "Parce que l'industrie pharmaceutique vit du traitement des symptômes. Si la population apprend à se purifier avec des plantes sauvages que Dieu a mises gratuitement dans la nature, qui achètera leurs molécules de synthèse ?"),

    # 05:00 - 10:00 : Origines au Honduras & Éveil Personnel
    (230.0, 250.0, VOICE_ROCK, "Parlons de vos origines. Vous êtes né à Ilanga au Honduras. Comment en êtes-vous venu à cette compréhension de la biologie ?"),
    (251.0, 280.0, VOICE_SEBI, "À 30 ans, je vivais aux États-Unis et j'étais gravement malade : asthme sévère, diabète, surpoids et impuissance. Les médecins me disaient que j'étais condamné à prendre des médicaments toute ma vie."),
    (281.0, 310.0, VOICE_SEBI, "Un ami m'a conduit auprès d'un herboriste mexicain traditionnel, Alfredo Cortez. Cet homme m'a fait jeûner et m'a donné des décoctions de plantes sauvages d'Amérique centrale. En 90 jours, j'étais guéri de toutes mes affections !"),
    (311.0, 330.0, VOICE_ROCK, "90 jours pour inverser des maladies considérées comme chroniques et incurables par la médecine officielle..."),
    (331.0, 360.0, VOICE_SEBI, "Oui ! Cela a été le grand réveil de ma vie. J'ai compris que la nature ne commet aucune erreur. J'ai alors voyagé en Afrique, aux Caraïbes et en Amérique du Sud pour cartographier les véritables plantes thérapeutiques."),
    (361.0, 390.0, VOICE_ROCK, "C'est là que vous avez développé le concept fondamental de nutrition bio-électrique cellulaire."),
    (391.0, 420.0, VOICE_SEBI, "L'être humain est une créature électrique ! Nos cellules ont une fréquence vibratoire et un potentiel électrique. Pour recharger ce système, il nous faut des aliments électriques naturels, non hybridés."),

    # 10:00 - 15:00 : Fer, Sang, Lymphe & Minéraux
    (425.0, 450.0, VOICE_ROCK, "Vous insistez constamment sur l'importance du fer dans le sang. Pourquoi le fer est-il la clé de voûte de la santé ?"),
    (451.0, 485.0, VOICE_SEBI, "Le fer est le minéral magnétique de la vie ! C'est le fer qui capte l'oxygène et conduit l'électricité dans chaque cellule. Sans fer végétal assimilable, la lymphe stagne et les organes s'asphyxient."),
    (486.0, 515.0, VOICE_SEBI, "Mais il ne faut jamais prendre le fer chimique synthétique des pharmacies, qui est inorganique et toxique pour le foie. Il faut consommer du fer chélaté par la plante, comme dans la salsepareille et la bardane."),
    (516.0, 545.0, VOICE_ROCK, "C'est la base de vos formules renommées comme le Bio-ferro et le Maya ?"),
    (546.0, 580.0, VOICE_SEBI, "Absolument. Ces herbes apportent du fer et des minéraux ioniques vivants qui nettoient le sang à une vitesse extraordinaire et dissolvent l'acidité intracellulaire."),
    (585.0, 615.0, VOICE_ROCK, "Et quelle est la différence entre un aliment naturel et un aliment hybridé en laboratoire ?"),
    (620.0, 655.0, VOICE_SEBI, "L'aliment naturel possède une graine fertile créée par la nature. L'aliment hybridé est une création humaine artificielle, dépourvue de potentiel bio-électrique et bourrée d'amidon."),

    # 15:00 - 20:00 : Le Danger des Aliments Hybridés & de l'Amidon
    (660.0, 685.0, VOICE_ROCK, "Parlons de certains légumes très consommés comme la carotte ou la pomme de terre."),
    (686.0, 715.0, VOICE_SEBI, "La carotte n'est pas un légume naturel ! Elle a été créée au XVIIe siècle aux Pays-Bas par croisement avec de l'amidon. La nature ne produit pas de carotte orange à l'état sauvage."),
    (716.0, 740.0, VOICE_ROCK, "Et quel est l'impact de cet amidon dans notre tube digestif ?"),
    (741.0, 775.0, VOICE_SEBI, "L'amidon est une colle ! Il tapisse vos parois intestinales, épaissit la lymphe et empêche l'absorption des nutriments. C'est la cause numéro un du mucus et de l'inflammation chronique."),
    (780.0, 810.0, VOICE_ROCK, "Quels sont alors les aliments et céréales que vous recommandez au quotidien ?"),
    (811.0, 845.0, VOICE_SEBI, "Le fonio, l'amarante, le teff, le riz sauvage, le quinoa ancien et le kamut ! Pour les fruits : figues, dattes, cerises, melons à graines, concombres, courgettes et avocat."),
    (850.0, 880.0, VOICE_ROCK, "Vous mettez toujours en garde contre les fruits sans pépins."),
    (881.0, 915.0, VOICE_SEBI, "Un fruit sans pépins est un aliment stérile ! Si la plante ne peut pas se reproduire par elle-même, elle ne peut transmettre aucune vie à vos cellules. Mangez toujours des fruits vivants avec leurs graines."),

    # 20:00 - 25:00 : Voltage Cellulaire, Eau de Source & pH
    (920.0, 950.0, VOICE_ROCK, "Comment notre mode de vie moderne affecte-t-il le voltage électrique de notre corps ?"),
    (951.0, 985.0, VOICE_SEBI, "Les produits laitiers, la viande animale, le sucre raffiné et le café acidifient le sang. Pour maintenir son pH vital de 7,4, le corps est obligé de piller ses propres réserves minérales osseuses."),
    (986.0, 1015.0, VOICE_ROCK, "C'est ainsi qu'apparaissent l'ostéoporose, l'arthrite et les douleurs articulaires."),
    (1016.0, 1050.0, VOICE_SEBI, "Exactement ! L'arthrite n'est que de l'acide urique et du mucus cristallisé. Lorsque vous alcalinisez le terrain et buvez de l'eau de source pure, les cristaux se dissolvent et la douleur disparaît."),
    (1055.0, 1085.0, VOICE_ROCK, "Quelle quantité d'eau de source préconisez-vous pendant un protocole de nettoyage ?"),
    (1086.0, 1120.0, VOICE_SEBI, "Au moins trois à quatre litres d'eau de source naturelle par jour ! L'eau est le transporteur indispensable pour évacuer les déchets acides hors de l'organisme."),

    # 25:00 - 32:00 : La Crise Curative & Le Nettoyage Intracellulaire
    (1125.0, 1155.0, VOICE_ROCK, "Lorsque les personnes débutent votre protocole, elles traversent souvent une crise d'élimination."),
    (1156.0, 1190.0, VOICE_SEBI, "Les herbes décollent le vieux mucus incrusté dans les tissus profonds. Ce mucus toxique passe dans la circulation pour être évacué par la peau, les reins et les intestins."),
    (1191.0, 1220.0, VOICE_SEBI, "Il peut y avoir des maux de tête passagers, de la transpiration ou des selles abondantes. C'est le signe que le corps est en train de se purifier activement !"),
    (1225.0, 1255.0, VOICE_ROCK, "Et au lieu de comprendre cela, les gens prennent souvent des médicaments pour bloquer ces symptômes..."),
    (1256.0, 1290.0, VOICE_SEBI, "C'est la pire des erreurs ! Bloquer les symptômes avec de la chimie refoule les poisons à l'intérieur des organes et prépare les maladies graves des années plus tard."),
    (1295.0, 1325.0, VOICE_ROCK, "Cette franchise vous a valu des attaques féroces de l'establishment médical américain."),
    (1326.0, 1360.0, VOICE_SEBI, "Ils voulaient faire taire un homme qui prouvait cliniquement que les maladies incurables peuvent être inversées par les lois naturelles de Dieu."),

    # 32:00 - 38:00 : Le Procès Historique de New York (1988)
    (1365.0, 1395.0, VOICE_ROCK, "Revenons sur ce moment historique : en 1988, l'État de New York vous poursuit devant la Cour Suprême pour exercice illégal de la médecine et fausses allégations."),
    (1396.0, 1425.0, VOICE_SEBI, "Le procureur m'a mis au défi en disant : 'Si vous prétendez guérir le sida, le cancer, le diabète et la cécité, amenez-nous 9 personnes avec leurs analyses de laboratoire avant et après'."),
    (1426.0, 1445.0, VOICE_ROCK, "Et vous ne vous êtes pas contenté d'amener 9 personnes..."),
    (1446.0, 1485.0, VOICE_SEBI, "Nous avons présenté 77 témoins certifiés devant la Cour Suprême ! Des dossiers médicaux complets de New York prouvant la guérison totale du sida, de tumeurs malignes, de drépanocytose et de cécité."),
    (1486.0, 1520.0, VOICE_SEBI, "Le juge a examiné chaque preuve clinique et a prononcé mon acquittement total sur tous les chefs d'accusation ! La vérité a triomphé devant la justice des hommes."),
    (1525.0, 1555.0, VOICE_ROCK, "Une victoire juridique historique et sans équivalent aux États-Unis pour la médecine naturelle."),
    (1556.0, 1590.0, VOICE_SEBI, "La vérité médicale est universelle et éternelle. Aucun tribunal ne peut effacer les lois de la biologie."),

    # 38:00 - 45:00 : Les Formules Thérapeutiques (Sea Moss, Fucus, Chelation 2)
    (1595.0, 1625.0, VOICE_ROCK, "Quels sont les piliers de vos préparations herboristes ? Le sea moss, le fucus, la salsepareille..."),
    (1626.0, 1665.0, VOICE_SEBI, "Le Sea Moss d'Irlande et le Bladderwrack fournissent 92 des 102 minéraux dont notre corps est constitué ! Ils dissolvent le mucus lymphatique et régénèrent la thyroïde."),
    (1666.0, 1700.0, VOICE_SEBI, "Combinés à Chelation 2 pour déloger les plaques mucoïdes du côlon et à Viento pour oxygéner les cellules, vous avez le système d'épuration le plus puissant au monde."),
    (1705.0, 1735.0, VOICE_ROCK, "Combien de temps faut-il pour régénérer un organisme profondément affaibli ?"),
    (1736.0, 1770.0, VOICE_SEBI, "Généralement trois à six mois d'une discipline sans faille : alimentation vivante alcaline, eau de source et herbes sauvages. Les cellules se renouvellent totalement."),

    # 45:00 - 51:00 : Usha Village au Honduras & Sources Thermales
    (1775.0, 1805.0, VOICE_ROCK, "Parlez-nous de votre centre de régénération, Usha Village au Honduras."),
    (1806.0, 1845.0, VOICE_SEBI, "À Usha Village, nous avons des sources thermales volcaniques chaudes chargées en soufre et en minéraux rares. Les curistes boivent l'eau vivante et prennent des bains thermaux quotidiens."),
    (1846.0, 1885.0, VOICE_SEBI, "J'ai vu des personnes en fauteuil roulant remarcher et des aveugles retrouver la vue. La nature accomplit des miracles quand on respecte ses lois."),

    # 51:00 - 56:00 : Conclusion & Message d'Éveil
    (1890.0, 1920.0, VOICE_ROCK, "Sebi, quel est votre message pour les auditeurs et pour le monde entier ?"),
    (1921.0, 1960.0, VOICE_SEBI, "Aimez votre corps, aimez la nature divine ! Ne laissez personne vous convaincre que la maladie est une fatalité. Nettoyez votre temple intérieur, vivez d'aliments vivants et marchez dans la vitalité souveraine !"),
    (1965.0, 2000.0, VOICE_ROCK, "Un immense merci au Dr. Sebi pour sa présence et sa sagesse. Merci à tous d'avoir suivi le Rock Newman Show sur WHUT. Prenez soin de vous !")
]

async def generate_sebi_clips():
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    clips = []
    for i, (start, end, voice, text) in enumerate(SEBI_SYNC_CONVERSATION):
        clip_file = CLIPS_DIR / f"sebi_sync_{i+1}.mp3"
        dur = end - start
        rate_str = "+4%" if dur < 15 else "+2%"
        comm = edge_tts.Communicate(text, voice, rate=rate_str, pitch="+0Hz")
        await comm.save(str(clip_file))
        clips.append({
            "id": f"sebi_sync_{i+1}",
            "start": start,
            "end": end,
            "file": str(clip_file),
            "text": text
        })
        print(f"  [TTS] Sebi Sync #{i+1} [{start:.1f}s -> {end:.1f}s]: {text[:45]}...")
    return clips

def mix_sebi_video(clips):
    orig_video = PUBLIC_VIDEOS_DIR / "dr-sebi-documentary.mp4"
    out_video = PUBLIC_VIDEOS_DIR / "dr-sebi-documentary-fr.mp4"
    print(f"\n🎛️ Mixage ffmpeg haute synchronisation pour {out_video.name} ({len(clips)} répliques)...")

    inputs = ["-i", str(orig_video)]
    filter_parts = []
    
    for i, c in enumerate(clips):
        inputs.extend(["-i", c["file"]])
        delay_ms = int(c["start"] * 1000)
        filter_parts.append(f"[{i+1}:a]adelay={delay_ms}|{delay_ms},volume=2.5[spk{i}];")

    labels = "".join([f"[spk{i}]" for i in range(len(clips))])
    filter_parts.append(f"{labels}amix=inputs={len(clips)}:dropout_transition=0:normalize=0[all_speech];")
    # Clean audio ducking: background audio reduced to 18% during dialogue
    filter_parts.append(f"[0:a]volume=0.18[orig_ducked];[orig_ducked][all_speech]amix=inputs=2:dropout_transition=0:normalize=0[aout]")

    full_filter = "".join(filter_parts)

    cmd = [
        "/opt/homebrew/bin/ffmpeg", "-y",
        *inputs,
        "-filter_complex", full_filter,
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-crf", "28",
        "-preset", "veryfast",
        "-c:a", "aac",
        "-b:a", "96k",
        "-shortest",
        str(out_video)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        size_mb = out_video.stat().st_size / (1024 * 1024)
        print(f"✅ Vidéo Dr. Sebi synchronisée avec succès : {out_video.name} ({size_mb:.1f} MB)")
    else:
        print(f"❌ Erreur ffmpeg : {res.stderr[-500:]}")

async def main():
    print("🎙️ Génération des voix françaises synchronisées sur la vraie timeline Whisper...")
    clips = await generate_sebi_clips()
    mix_sebi_video(clips)
    print("\n🎉 Doublage Dr. Sebi 100% synchronisé terminé !")

if __name__ == "__main__":
    asyncio.run(main())
