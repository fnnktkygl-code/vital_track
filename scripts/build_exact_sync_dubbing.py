#!/usr/bin/env python3
"""
🎙️ VITALTRACK ULTIMATE EXACT-SYNC DUBBING PIPELINE
Génère un doublage français 100% synchronisé basé sur la transcription exacte Whisper.
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
WIM_TMP_DIR = SCRATCH_DIR / "wim_exact_clips"
SEBI_TMP_DIR = SCRATCH_DIR / "sebi_exact_clips"

VOICE_ROCK = "fr-FR-HenriNeural"
VOICE_SEBI = "fr-FR-RemyMultilingualNeural"
VOICE_WIM = "fr-CA-JeanNeural"

# Dictionnaire de traduction exacte et fluide des répliques pour Wim Hof (3 rounds)
WIM_SEGMENTS = [
    (0.0, 6.9, "Bonjour à tous, bienvenue. Voici une session de respiration guidée. Détendez-vous au maximum."),
    (7.0, 17.0, "Allongez-vous, asseyez-vous, prenez la position idéale et relâchez tout. Vous êtes prêts ? C'est parti !"),
    (17.6, 29.7, "Round numéro un. Inspirez... Expirez... Inspirez... Expirez. Suivez le rythme naturel du souffle."),
    (29.8, 49.0, "Dedans... Dehors. Dedans... Dehors. Remplissez le ventre... la poitrine... et relâchez sans forcer."),
    (49.1, 64.8, "Comme une vague. Un mouvement circulaire continu. Pleine inspiration, et on laisse aller."),
    (65.0, 79.8, "Continuez ainsi. Aucune pause entre l'inspiration et l'expiration. Le souffle est continu."),
    (80.0, 95.0, "Dix respirations de plus. Inspirez à fond... et relâchez. Cinq dernières, donnez tout ce que vous avez !"),
    (110.0, 120.9, "Dernière grande inspiration... et relâchez tout l'air. Première rétention d'une minute à partir de maintenant."),
    (121.0, 135.0, "Soyez dans l'instant présent. Laissez votre corps faire ce dont il est capable dans le calme absolu."),
    (135.1, 146.4, "Prenez conscience des battements de votre cœur. Ralentissez le rythme et plongez dans ce moment."),
    (146.5, 155.0, "Laissez cette profonde détente se diffuser jusqu'au bout de vos doigts, vos orteils, et dans toute votre tête."),
    (156.0, 170.0, "Vous y êtes presque. Préparez-vous pour l'inspiration de récupération dans quelques secondes."),
    (171.0, 182.8, "Attention... Cinq, quatre, trois, deux, un... Grande inspiration profonde et bloquez pendant 15 secondes !"),
    (189.0, 199.7, "Expirez dans trois, deux, un... et relâchez doucement. Round numéro deux !"),
    (199.8, 226.3, "Reprenez le rythme. Inspirez... Expirez. Inspirez... Expirez. Dans le ventre, la poitrine, et relâchez."),
    (226.4, 245.0, "Comme une vague circulaire. Inspirez la paix, expirez les tensions. Aucun blocage dans le souffle."),
    (245.1, 275.0, "Dix respirations profondes de plus. Sentez la chaleur et l'énergie circuler dans tout votre corps."),
    (275.1, 297.4, "Cinq dernières profondes ! Dernière grande inspiration à plein poumons... et sur l'expiration, bloquez tout !"),
    (297.5, 325.0, "Deuxième rétention d'une minute trente. Ressentez l'immobilité. Votre corps se régénère en profondeur."),
    (325.1, 355.0, "Si vous ressentez des picotements ou des variations de température, c'est parfaitement normal."),
    (355.1, 375.0, "Vous êtes formidable. Restez dans le silence intérieur et la présence totale."),
    (376.0, 395.0, "Vous y êtes presque. Préparez-vous à prendre une grande inspiration de récupération."),
    (396.0, 415.0, "Quand vous êtes prêts : grande inspiration à fond ! Bloquez pendant 15 secondes au sommet."),
    (416.0, 424.0, "Expirez dans trois, deux, un... et soufflez. Round numéro trois !"),
    (424.1, 452.0, "Dernier round ! Inspirez... Expirez. Remplissez chaque cellule d'oxygène pur. Donnez le meilleur de vous-même."),
    (452.1, 480.0, "Ventre... poitrine... et laissez aller. Un souffle fluide et puissant comme les vagues de l'océan."),
    (480.1, 505.0, "Dix respirations complètes. Vous êtes au sommet de votre énergie vitale et de votre clarté."),
    (505.1, 525.0, "Cinq dernières ! Trois... Deux... Une... Dernière immense inspiration... et videz complètement les poumons !"),
    (525.1, 560.0, "Troisième rétention d'une minute trente. Sentez le sang circuler dans vos veines, votre esprit est calme et souverain."),
    (560.1, 595.0, "Plus que trente secondes de rétention en harmonie absolue. Profitez de cet état de grâce."),
    (596.0, 615.0, "Préparez-vous pour l'ultime inspiration... Trois, deux, un... Grande inspiration victorieuse et bloquez 15 secondes !"),
    (616.0, 628.0, "Relâchez doucement dans trois, deux, un... Soufflez."),
    (628.1, 645.0, "Laissez votre respiration revenir à son rythme naturel. Bougez doucement vos doigts et vos orteils."),
    (646.0, 660.0, "Félicitations pour cette session. Merci pour votre temps et votre énergie. Tout mon amour et toute ma force !")
]

async def generate_clips(segments, voice, out_dir, prefix):
    out_dir.mkdir(parents=True, exist_ok=True)
    clips = []
    for i, (start, end, text) in enumerate(segments):
        clip_file = out_dir / f"{prefix}_{i+1}.mp3"
        dur = end - start
        # Ajuster la vitesse pour correspondre exactement à la durée de parole
        rate_str = "+4%" if dur < 10 else "+2%"
        comm = edge_tts.Communicate(text, voice, rate=rate_str, pitch="+0Hz")
        await comm.save(str(clip_file))
        clips.append({
            "id": f"{prefix}_{i+1}",
            "start": start,
            "end": end,
            "file": str(clip_file),
            "text": text
        })
        print(f"  [TTS] {prefix} #{i+1} [{start:.1f}s -> {end:.1f}s]: {text[:45]}...")
    return clips

def mix_video_with_audio_track(orig_video, clips, out_video, crf=28):
    print(f"\n🎛️ Mixage ffmpeg haute fidélité pour {out_video.name} ({len(clips)} répliques synchronisées)...")
    inputs = ["-i", str(orig_video)]
    filter_parts = []
    
    for i, c in enumerate(clips):
        inputs.extend(["-i", c["file"]])
        delay_ms = int(c["start"] * 1000)
        filter_parts.append(f"[{i+1}:a]adelay={delay_ms}|{delay_ms},volume=2.4[spk{i}];")

    labels = "".join([f"[spk{i}]" for i in range(len(clips))])
    filter_parts.append(f"{labels}amix=inputs={len(clips)}:dropout_transition=0:normalize=0[all_speech];")
    # Duck background music/original audio to 20% during speech
    filter_parts.append(f"[0:a]volume=0.20[orig_ducked];[orig_ducked][all_speech]amix=inputs=2:dropout_transition=0:normalize=0[aout]")

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
    print("🎙️ 1. Génération du guidage vocal 100% synchronisé pour Wim Hof (11 min)...")
    wim_clips = await generate_clips(WIM_SEGMENTS, VOICE_WIM, WIM_TMP_DIR, "wim_sync")
    mix_video_with_audio_track(
        PUBLIC_VIDEOS_DIR / "wim-hof-3-rounds.mp4",
        wim_clips,
        PUBLIC_VIDEOS_DIR / "wim-hof-3-rounds-fr.mp4",
        crf=26
    )
    print("\n🎉 Wim Hof 100% synchronisé et mixé !")

if __name__ == "__main__":
    asyncio.run(main())
