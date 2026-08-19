/**
 * 🎙️ VITALTRACK MULTI-SPEAKER VIDEO DUBBING & DIALOGUE DATASET
 * Profils vocaux distincts par intervenant, répliques horodatées et traductions françaises fluides.
 */

export const VIDEO_DUBBING_DATABASE = {
  // ═══════ 1. THE ROCK NEWMAN SHOW FT. DR. SEBI ═══════
  "dr_sebi_interview": {
    videoId: "dr_sebi_interview",
    youtubeId: "V5l9VqC1k8w",
    mediaUrl: "/videos/dr-sebi-documentary.mp4",
    title: "The Rock Newman Show ft. Dr. Sebi (Interview Complète)",
    source: "WHUT TV / Howard University",
    duration: 3360, // 56 min
    speakers: {
      "rock_newman": {
        id: "rock_newman",
        name: "Rock Newman",
        role: "Présentateur & Journaliste TV",
        avatar: "🎙️",
        color: "#38bdf8",
        gender: "male",
        voiceSettings: {
          pitch: 1.05,
          rate: 1.0,
          preferredVoiceType: "male_clear"
        }
      },
      "dr_sebi": {
        id: "dr_sebi",
        name: "Dr. Sebi (Alfredo Bowman)",
        role: "Chercheur, Herboriste & Guérisseur",
        avatar: "⚡",
        color: "#34d399",
        gender: "male",
        voiceSettings: {
          pitch: 0.86,
          rate: 0.94,
          preferredVoiceType: "male_deep"
        }
      }
    },
    dialogues: [
      // Introduction & Mucus (00:00 - 03:30)
      {
        id: "sebi_d1",
        start: 0,
        end: 7,
        speaker: "rock_newman",
        textFr: "Bienvenue à tous sur le Rock Newman Show. Aujourd'hui, nous recevons un homme dont les travaux bousculent la médecine moderne : le Dr. Sebi.",
        textEn: "Welcome everybody to The Rock Newman Show. Today we have a very special guest, a man whose work is shaking modern medicine: Dr. Sebi."
      },
      {
        id: "sebi_d2",
        start: 8,
        end: 15,
        speaker: "rock_newman",
        textFr: "Sebi, vous affirmez depuis des décennies qu'il n'existe au fond qu'une seule véritable maladie dans le corps humain. Pouvez-vous nous expliquer ce principe ?",
        textEn: "Sebi, you have been stating for decades that there is fundamentally only one true disease in the human body. Can you break down this principle for us?"
      },
      {
        id: "sebi_d3",
        start: 16,
        end: 27,
        speaker: "dr_sebi",
        textFr: "Absolument Rock. La médecine conventionnelle a inventé des milliers de noms pour diviser les pathologies. Mais la vérité biologique est d'une simplicité limpide : la maladie n'est rien d'autre que l'accumulation de mucus et d'acidité qui étouffe la cellule.",
        textEn: "Absolutely Rock. Conventional medicine invented thousands of names to divide pathologies. But biological truth is clear: disease is nothing more than the accumulation of mucus and acidity choking the cell."
      },
      {
        id: "sebi_d4",
        start: 28,
        end: 37,
        speaker: "dr_sebi",
        textFr: "Lorsque le mucus obstrue les poumons, ils appellent cela pneumonie ou asthme. Quand il obstrue les artères, ils appellent cela athérosclérose. Quand il obstrue les yeux, c'est la cataracte !",
        textEn: "When mucus obstructs the lungs, they call it pneumonia or asthma. When it clogs the arteries, they call it atherosclerosis. When it clouds the eyes, it's cataract!"
      },
      {
        id: "sebi_d5",
        start: 38,
        end: 45,
        speaker: "rock_newman",
        textFr: "Donc selon vous, en éliminant cette obstruction et en alcalinisant le milieu, le corps retrouve spontanément sa pleine capacité d'auto-guérison ?",
        textEn: "So according to you, by eliminating this obstruction and alkalizing the terrain, the body spontaneously recovers its full self-healing capacity?"
      },
      {
        id: "sebi_d6",
        start: 46,
        end: 58,
        speaker: "dr_sebi",
        textFr: "Exactement ! Le corps est une machine bio-électrique parfaite. Si vous cessez d'y introduire des poisons acides et que vous nettoyez le sang et la lymphe avec des plantes sauvages indigènes, la régénération est inévitable.",
        textEn: "Exactly! The body is a perfect bio-electric machine. If you stop introducing acidic poisons and cleanse the blood and lymph with wild indigenous plants, regeneration is inevitable."
      },

      // Section Nutrition Bio-Électrique (14:20 - 15:50 / 860s - 950s)
      {
        id: "sebi_d7",
        start: 860,
        end: 868,
        speaker: "rock_newman",
        textFr: "Parlons de ce concept de nutrition bio-électrique que vous avez développé. Vous mettez souvent en garde contre certains légumes très populaires comme la carotte.",
        textEn: "Let's talk about this concept of bio-electric nutrition that you developed. You often warn against popular vegetables like carrots."
      },
      {
        id: "sebi_d8",
        start: 869,
        end: 881,
        speaker: "dr_sebi",
        textFr: "La carotte n'a jamais été créée par Dieu ou la nature, Rock ! Elle a été hybridée en laboratoire en Hollande au XVIIe siècle en croisant la Queen Anne's Lace avec de l'amidon. La nature ne produit pas d'amidon inorganique !",
        textEn: "Carrots were never created by God or nature, Rock! They were hybridized in a lab in Holland in the 17th century by crossing Queen Anne's Lace with starch. Nature does not produce inorganic starch!"
      },
      {
        id: "sebi_d9",
        start: 882,
        end: 893,
        speaker: "rock_newman",
        textFr: "Et quelle est la conséquence lorsque nous consommons ces aliments hybridés riches en amidon ?",
        textEn: "And what is the consequence when we consume these hybridized foods loaded with starch?"
      },
      {
        id: "sebi_d10",
        start: 894,
        end: 908,
        speaker: "dr_sebi",
        textFr: "L'amidon est une colle ! Il s'infiltre dans vos villosités intestinales, épaissit le sang, acidifie la lymphe et crée le mucus qui prépare le terrain à toutes les dégénérescences cellulaires. Nous devons revenir aux aliments alcalins non hybridés.",
        textEn: "Starch is glue! It coats your intestinal villi, thickens the blood, acidifies the lymph and creates the mucus that prepares the ground for all cellular degeneration. We must return to non-hybrid alkaline foods."
      },

      // Section Le Procès de New York (32:45 - 34:30 / 1965s - 2070s)
      {
        id: "sebi_d11",
        start: 1965,
        end: 1974,
        speaker: "rock_newman",
        textFr: "En 1988, l'État de New York vous a traîné devant la Cour Suprême pour exercice illégal de la médecine et fausses allégations de guérison. Racontez-nous ce moment historique.",
        textEn: "In 1988, the State of New York dragged you in front of the Supreme Court for illegal practice of medicine and false claims of curing diseases. Tell us about that historic moment."
      },
      {
        id: "sebi_d12",
        start: 1975,
        end: 1990,
        speaker: "dr_sebi",
        textFr: "Le procureur général m'a dit : 'Sebi, si vous prétendez guérir le sida, le cancer, le diabète et la cécité, amenez-nous 9 personnes avec leurs bilans sanguins avant et après'. Vous savez ce que nous avons fait ?",
        textEn: "The Attorney General told me: 'Sebi, if you claim to cure AIDS, cancer, diabetes, and blindness, bring us 9 patients with certified before and after blood work'. You know what we did?"
      },
      {
        id: "sebi_d13",
        start: 1991,
        end: 1996,
        speaker: "rock_newman",
        textFr: "Vous n'avez pas amené 9 personnes...",
        textEn: "You didn't bring 9 people..."
      },
      {
        id: "sebi_d14",
        start: 1997,
        end: 2012,
        speaker: "dr_sebi",
        textFr: "Nous avons fait défiler 77 témoins certifiés par les plus grands laboratoires de New York ! Le juge a examiné les preuves médicales et a prononcé mon acquittement total sur tous les chefs d'accusation. La vérité prévaut toujours !",
        textEn: "We brought 77 certified patients tested by top New York labs! The judge reviewed the medical proof and pronounced my complete acquittal on all counts. Truth always prevails!"
      }
    ]
  },

  // ═══════ 2. VICE DOCUMENTARY — INSIDE THE SUPERHUMAN WORLD OF WIM HOF ═══════
  "wim_hof_vice": {
    videoId: "wim_hof_vice",
    youtubeId: "VaMjhwFE1Zw",
    mediaUrl: "/videos/wim-hof-science.mp4",
    title: "Documentaire : Inside the Superhuman World of Wim Hof (Vice)",
    source: "Vice Media HD",
    duration: 2340, // 39 min
    speakers: {
      "matt_shea": {
        id: "matt_shea",
        name: "Matt Shea",
        role: "Journaliste & Enquêteur Vice",
        avatar: "📹",
        color: "#f59e0b",
        gender: "male",
        voiceSettings: {
          pitch: 1.08,
          rate: 1.02,
          preferredVoiceType: "male_young"
        }
      },
      "wim_hof": {
        id: "wim_hof",
        name: "Wim Hof (\"The Iceman\")",
        role: "Pionnier de la Méthode & Recordman",
        avatar: "❄️",
        color: "#38bdf8",
        gender: "male",
        voiceSettings: {
          pitch: 0.84,
          rate: 0.96,
          preferredVoiceType: "male_energetic"
        }
      },
      "dr_pickkers": {
        id: "dr_pickkers",
        name: "Prof. Peter Pickkers",
        role: "Directeur de Recherche Clinique (Univ. Radboud)",
        avatar: "🔬",
        color: "#a78bfa",
        gender: "male",
        voiceSettings: {
          pitch: 0.96,
          rate: 0.95,
          preferredVoiceType: "male_professor"
        }
      }
    },
    dialogues: [
      // Origines et immersion dans la glace (01:15 - 02:45 / 75s - 165s)
      {
        id: "wim_d1",
        start: 75,
        end: 83,
        speaker: "matt_shea",
        textFr: "Nous sommes en Pologne, au milieu de températures négatives, pour rencontrer un homme qui prétend avoir déverrouillé les clés de notre système immunitaire : Wim Hof.",
        textEn: "We are in Poland in freezing sub-zero temperatures to meet a man who claims to have unlocked the keys to our immune system: Wim Hof."
      },
      {
        id: "wim_d2",
        start: 84,
        end: 92,
        speaker: "wim_hof",
        textFr: "Bienvenue les amis ! Le froid n'est pas un ennemi, le froid est un miroir impitoyable et un maître d'une clarté absolue.",
        textEn: "Welcome guys! The cold is not an enemy, cold is a merciless mirror and a teacher of absolute clarity."
      },
      {
        id: "wim_d3",
        start: 93,
        end: 101,
        speaker: "matt_shea",
        textFr: "Wim, la plupart des gens pensent que vous êtes une anomalie génétique, un surhomme né avec une résistance hors-norme.",
        textEn: "Wim, most people think you are a genetic freak, a superhuman born with extraordinary resistance."
      },
      {
        id: "wim_d4",
        start: 102,
        end: 114,
        speaker: "wim_hof",
        textFr: "Non, c'est faux ! Ce que je fais, n'importe quel être humain peut le faire dès aujourd'hui. En respirant profondément et en alcalinisant le sang, nous réactivons des circuits nerveux endormis depuis des millénaires.",
        textEn: "No, that is completely wrong! What I do, any human being can do today. By breathing deeply and alkalizing the blood, we reactivate neural circuits asleep for millennia."
      },

      // Étude Scientifique Radboud (18:30 - 20:00 / 1110s - 1200s)
      {
        id: "wim_d5",
        start: 1110,
        end: 1119,
        speaker: "matt_shea",
        textFr: "Pour tester scientifiquement ces allégations, l'Université Radboud aux Pays-Bas a mis en place un protocole clinique strict sous contrôle médical.",
        textEn: "To scientifically test these claims, Radboud University in the Netherlands set up a strict clinical trial under medical surveillance."
      },
      {
        id: "wim_d6",
        start: 1120,
        end: 1132,
        speaker: "dr_pickkers",
        textFr: "Nous avons injecté à Wim et à son groupe entraîné une endotoxine bactérienne d'E. coli qui provoque normalement de violentes fièvres et des frissons intenses chez 100% des sujets sains.",
        textEn: "We injected Wim and his trained group with an E. coli bacterial endotoxin that normally induces heavy fever and intense chills in 100% of healthy subjects."
      },
      {
        id: "wim_d7",
        start: 1133,
        end: 1144,
        speaker: "dr_pickkers",
        textFr: "Les résultats ont stupéfait notre communauté médicale : en utilisant sa technique de respiration, Wim et ses élèves ont réussi à doubler leur taux d'adrénaline et à supprimer presque totalement la tempête de cytokines inflammatoires.",
        textEn: "The results stunned our medical community: using his breathing technique, Wim and his students doubled their adrenaline levels and almost entirely suppressed the inflammatory cytokine storm."
      },
      {
        id: "wim_d8",
        start: 1145,
        end: 1156,
        speaker: "wim_hof",
        textFr: "C'est la preuve irréfutable que l'esprit et la respiration peuvent influencer le système nerveux autonome. La santé et la vitalité sont entre nos mains !",
        textEn: "This is irrefutable proof that mind and breath can influence the autonomic nervous system. Health and vitality are in our hands!"
      }
    ]
  },

  // ═══════ 3. GUIDED WIM HOF BREATHING SESSION ═══════
  "wim_hof_breathing": {
    videoId: "wim_hof_breathing",
    youtubeId: "tybOi4hjZFQ",
    mediaUrl: "/videos/wim-hof-3-rounds.mp4",
    title: "Session Guidée de Respiration Wim Hof (3 Rounds Officiels)",
    source: "Chaîne Officielle Wim Hof",
    duration: 680,
    speakers: {
      "wim_hof": {
        id: "wim_hof",
        name: "Wim Hof (Guide Vocal)",
        role: "Maître de Respiration",
        avatar: "🌬️",
        color: "#38bdf8",
        gender: "male",
        voiceSettings: {
          pitch: 0.88,
          rate: 0.94,
          preferredVoiceType: "male_rhythmic"
        }
      }
    },
    dialogues: [
      {
        id: "wim_br_1",
        start: 0,
        end: 12,
        speaker: "wim_hof",
        textFr: "Installez-vous confortablement, assis ou allongé. Détendez vos épaules, votre mâchoire et votre ventre. Nous allons faire 3 rounds de respiration profonde.",
        textEn: "Get into a comfortable position, sitting or lying down. Relax your shoulders, your jaw and your belly. We are going to do 3 rounds of deep breathing."
      },
      {
        id: "wim_br_2",
        start: 13,
        end: 25,
        speaker: "wim_hof",
        textFr: "Inspirez à fond par le ventre puis la poitrine... et relâchez sans forcer. Inspirez... et expirez. Suivez le rythme de la vague.",
        textEn: "Breathe in deeply into the belly, chest... and let go. In... and out. Follow the wave."
      },
      {
        id: "wim_br_3",
        start: 130,
        end: 145,
        speaker: "wim_hof",
        textFr: "Dernière grande inspiration... remplissez vos poumons au maximum... et relâchez. Bloquez la respiration poumons vides. Fermez les yeux et plongez dans le calme intérieur.",
        textEn: "Last big inhale... fill your lungs completely... and let go. Hold your breath on empty lungs. Close your eyes and dive into inner peace."
      },
      {
        id: "wim_br_4",
        start: 190,
        end: 205,
        speaker: "wim_hof",
        textFr: "Prenez une grande inspiration de récupération... et bloquez 15 secondes au sommet. Sentez l'énergie circuler dans tout votre corps... et relâchez doucement.",
        textEn: "Take a deep recovery breath in... and hold for 15 seconds at the top. Feel the energy flowing through your entire body... and gently let go."
      }
    ]
  },

  // ═══════ 4. MASTERCLASS ARNOLD EHRET ═══════
  "arnold_ehret_masterclass": {
    videoId: "arnold_ehret_masterclass",
    mediaUrl: "/videos/arnold-ehret-masterclass.mp4",
    title: "Masterclass : Les Lois Fondamentales d'Arnold Ehret",
    source: "Institut Vitaliste & Arnold Ehret",
    duration: 1800,
    speakers: {
      "narrator_fr": {
        id: "narrator_fr",
        name: "Narrateur Vitaliste",
        role: "Enseignant en Hygiène Vitale",
        avatar: "🎙️",
        color: "#34d399",
        gender: "male",
        voiceSettings: {
          pitch: 1.0,
          rate: 0.98,
          preferredVoiceType: "male_narrator"
        }
      },
      "arnold_ehret": {
        id: "arnold_ehret",
        name: "Prof. Arnold Ehret",
        role: "Fondateur du Système de Guérison Sans Mucus",
        avatar: "🍎",
        color: "#f59e0b",
        gender: "male",
        voiceSettings: {
          pitch: 0.88,
          rate: 0.94,
          preferredVoiceType: "male_professor"
        }
      }
    },
    dialogues: [
      {
        id: "ehret_d1",
        start: 0,
        end: 14,
        speaker: "narrator_fr",
        textFr: "Bienvenue dans cette masterclass consacrée au professeur Arnold Ehret, le père fondateur de la diététique sans mucus et du jeûne rationnel.",
        textEn: "Welcome to this masterclass dedicated to Professor Arnold Ehret, founding father of the mucusless diet and rational fasting."
      },
      {
        id: "ehret_d2",
        start: 255,
        end: 270,
        speaker: "arnold_ehret",
        textFr: "Toute la vie et la puissance de l'organisme humain reposent sur une formule mathématique simple : V = P - O. La Vitalité est égale à la Puissance d'origine moins l'Obstruction interne.",
        textEn: "All life and power in the human engine rests on a simple equation: V = P - O. Vitality equals Power minus internal Obstruction."
      },
      {
        id: "ehret_d3",
        start: 271,
        end: 285,
        speaker: "narrator_fr",
        textFr: "Cela signifie que pour retrouver une énergie optimale, il ne s'agit pas de surcharger le corps de stimulants, mais d'éliminer méthodiquement les déchets et glaires accumulés.",
        textEn: "This means that to recover peak energy, one must not overload the engine with stimulants, but methodically eliminate accumulated waste and mucus."
      }
    ]
  },

  // ═══════ 5. DR. ROBERT MORSE — SYSTÈME LYMPHATIQUE ═══════
  "dr_morse_lymphatic": {
    videoId: "dr_morse_lymphatic",
    mediaUrl: "/videos/dr-morse-lymphatic-system.mp4",
    title: "Dr. Robert Morse — Le Système Lymphatique et la Filtration Rénale",
    source: "Conférence Clinique Morse",
    duration: 2100,
    speakers: {
      "dr_morse": {
        id: "dr_morse",
        name: "Dr. Robert Morse, N.D.",
        role: "Docteur en Naturopathie & Spécialiste de la Détox",
        avatar: "🍇",
        color: "#c084fc",
        gender: "male",
        voiceSettings: {
          pitch: 0.92,
          rate: 0.95,
          preferredVoiceType: "male_enthusiastic"
        }
      }
    },
    dialogues: [
      {
        id: "morse_d1",
        start: 0,
        end: 15,
        speaker: "dr_morse",
        textFr: "Bonjour à tous les amis ! Aujourd'hui nous plongeons au cœur du plus grand système de notre corps : le système lymphatique, véritable système d'égout cellulaire.",
        textEn: "Hello everyone my friends! Today we dive into the heart of the largest fluid system: the lymphatic system, the great cellular sewage."
      },
      {
        id: "morse_d2",
        start: 520,
        end: 540,
        speaker: "dr_morse",
        textFr: "Comprenez bien ceci : le sang est la cuisine qui nourrit la cellule (20% des fluides), mais la lymphe est la salle de bain et les toilettes (80% des fluides). Si vos reins ne filtrent pas, vos cellules baignent dans leurs propres acides !",
        textEn: "Understand this clearly: blood is the kitchen feeding the cells (20% of fluids), but lymph is the bathroom and septic system (80% of fluids). If your kidneys are not filtering, your cells bathe in their own acid waste!"
      }
    ]
  }
};

/**
 * Retrouve la configuration de doublage d'une vidéo selon son ID YouTube ou URL
 */
export function getDubbingDataForVideo(youtubeId = '', mediaUrl = '', title = '') {
  if (youtubeId) {
    for (const key of Object.values(VIDEO_DUBBING_DATABASE)) {
      if (key.youtubeId === youtubeId) return key;
    }
  }

  if (mediaUrl) {
    for (const key of Object.values(VIDEO_DUBBING_DATABASE)) {
      if (key.mediaUrl && (mediaUrl.includes(key.mediaUrl) || key.mediaUrl.includes(mediaUrl))) return key;
    }
  }

  if (title) {
    const t = title.toLowerCase();
    if (t.includes('sebi')) return VIDEO_DUBBING_DATABASE.dr_sebi_interview;
    if (t.includes('vice') || t.includes('superhuman')) return VIDEO_DUBBING_DATABASE.wim_hof_vice;
    if (t.includes('respiration') || t.includes('rounds')) return VIDEO_DUBBING_DATABASE.wim_hof_breathing;
    if (t.includes('ehret')) return VIDEO_DUBBING_DATABASE.arnold_ehret_masterclass;
    if (t.includes('morse')) return VIDEO_DUBBING_DATABASE.dr_morse_lymphatic;
  }

  return null;
}
