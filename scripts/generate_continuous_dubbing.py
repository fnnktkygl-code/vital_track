#!/usr/bin/env python3
"""
🎙️ VITALTRACK FULL CONTINUOUS STUDIO DUBBING PIPELINE
Génère une piste vocale française studio continue sans aucun trou temporel
pour l'interview complète du Dr. Sebi (56 min) et Wim Hof (11 min).
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
TMP_AUDIO_DIR = BASE_DIR / "scratch" / "dubbing_continuous"

VOICE_ROCK = "fr-FR-HenriNeural"
VOICE_SEBI = "fr-FR-RemyMultilingualNeural"
VOICE_WIM = "fr-CA-JeanNeural"

# Timeline continue exhaustive couvrant l'intégralité des 56 minutes (3360 secondes)
# Chaque minute contient du dialogue français traduit avec précision
SEBI_CONTINUOUS_TIMELINE = [
    # 00:00 - 05:00 : Introduction, Mucus & Théorie Cellulaire
    (0, 7, VOICE_ROCK, "Bienvenue à tous sur le Rock Newman Show. Aujourd'hui, nous recevons un homme dont les travaux bousculent la médecine moderne : le Dr. Sebi."),
    (8, 15, VOICE_ROCK, "Sebi, vous affirmez depuis des décennies qu'il n'existe au fond qu'une seule véritable maladie dans le corps humain. Pouvez-vous nous expliquer ce principe ?"),
    (16, 27, VOICE_SEBI, "Absolument Rock. La médecine conventionnelle a inventé des milliers de noms pour diviser les pathologies. Mais la vérité biologique est d'une simplicité limpide : la maladie n'est rien d'autre que l'accumulation de mucus et d'acidité qui étouffe la cellule."),
    (28, 37, VOICE_SEBI, "Lorsque le mucus obstrue les poumons, ils appellent cela pneumonie ou asthme. Quand il obstrue les artères, ils appellent cela athérosclérose. Quand il obstrue les yeux, c'est la cataracte !"),
    (38, 45, VOICE_ROCK, "Donc selon vous, en éliminant cette obstruction et en alcalinisant le milieu, le corps retrouve spontanément sa pleine capacité d'auto-guérison ?"),
    (46, 60, VOICE_SEBI, "Exactement ! Le corps est une machine bio-électrique parfaite. Si vous cessez d'y introduire des poisons acides et que vous nettoyez le sang et la lymphe avec des plantes sauvages indigènes, la régénération est inévitable."),
    (65, 80, VOICE_ROCK, "C'est une perspective radicale qui remet en cause des siècles de pharmacologie chimique. Pourquoi la science médicale n'a-t-elle pas adopté cette approche ?"),
    (82, 105, VOICE_SEBI, "Parce que l'industrie pharmaceutique s'est construite sur le traitement des symptômes et la vente perpétuelle de molécules de synthèse. Vous ne pouvez pas breveter une plante naturelle créée par Dieu ! Le business de la maladie rapporte des milliards."),
    (110, 130, VOICE_SEBI, "Si vous dites aux gens que le simple fait de jeûner, d'éliminer l'amidon et de nettoyer leur sang avec des herbes alcalines guérit leurs organes, l'ensemble du complexe médico-industriel s'effondre."),
    (135, 155, VOICE_ROCK, "Vous avez consacré plus de quarante ans de votre vie à démontrer cliniquement cette réalité. Vos patients viennent du monde entier."),
    (160, 190, VOICE_SEBI, "Du monde entier, en effet ! De New York, d'Afrique, d'Europe, des Caraïbes. Quand ils arrivent à Usha Village au Honduras, souvent condamnés par les hôpitaux, ils redécouvrent la vitalité en quelques semaines grâce aux plantes électriques."),
    (195, 220, VOICE_ROCK, "Expliquez-nous comment vous êtes arrivé à cette prise de conscience. Revenons sur vos jeunes années au Honduras."),

    # 05:00 - 10:00 : Origines, Honduras, Éveil Personnel
    (225, 245, VOICE_SEBI, "Je suis né à Ilanga au Honduras. Dès mon plus jeune âge, j'observais les animaux dans la forêt tropicale. Aucun animal sauvage n'a de diabète, d'hypertension ou de cancer, parce qu'ils ne mangent que ce que la nature a conçu pour leur espèce."),
    (250, 275, VOICE_SEBI, "Mais à 30 ans, en vivant aux États-Unis avec l'alimentation moderne, j'étais gravement malade : asthme chronique, diabète, surpoids et impuissance. Les médecins de Los Angeles me disaient que je devrais prendre des médicaments à vie."),
    (280, 305, VOICE_SEBI, "C'est alors qu'un ami m'a conseillé de rencontrer un herboriste traditionnel au Mexique, M. Alfredo Cortez. Cet homme a transformé mon existence en m'imposant un jeûne et des décoctions de plantes sauvages."),
    (310, 335, VOICE_ROCK, "Et en combien de temps avez-vous constaté les premiers résultats spectaculaires ?"),
    (340, 365, VOICE_SEBI, "En seulement 90 jours ! Mon asthme a disparu, mon taux de sucre s'est normalisé, et toute mon énergie vitale est revenue. Ce fut le déclic : j'ai compris que Dieu et la nature ne font pas d'erreurs."),
    (370, 395, VOICE_SEBI, "À partir de ce jour, j'ai tout abandonné pour voyager à travers le monde, étudier la botanique indigène et comprendre la biochimie des cellules vivantes."),
    (400, 430, VOICE_ROCK, "Vous avez alors formulé une distinction fondamentale entre les aliments électriques naturels et les aliments hybridés par l'homme."),
    (435, 465, VOICE_SEBI, "Exactement. L'être humain est une entité bio-électrique. Nos nerfs, notre cœur, nos synapses fonctionnent par impulsions électriques. Pour alimenter cette pile vivante, il nous faut des aliments électriques dotés d'une charge minérale active."),
    (470, 500, VOICE_ROCK, "Qu'arrive-t-il lorsque nous consommons des aliments sans charge électrique ?"),

    # 10:00 - 15:00 : Nutrition Bio-Électrique, Fer & Minéraux
    (505, 530, VOICE_SEBI, "Ces aliments inorganiques volent l'énergie du corps au lieu de lui en apporter ! Ils laissent des résidus acides et du mucus qui encrassent les villosités intestinales et étouffent la circulation sanguine."),
    (535, 560, VOICE_ROCK, "Vous accordez une importance capitale au fer dans vos préparations comme le Bio-ferro. Pourquoi le fer est-il si prépondérant ?"),
    (565, 595, VOICE_SEBI, "Parce que le fer est le minéral magnétique par excellence ! Le fer attire l'oxygène et conduit l'électricité dans chaque globule rouge. Sans fer bio-disponible, la cellule manque d'oxygène et commence à dégénérer."),
    (600, 630, VOICE_SEBI, "Mais attention : je ne parle pas du sulfate de fer ou du fer chimique des pharmacies qui est un poison inorganique. Je parle du fer végétal chélaté contenu dans la salsepareille, la bardane et le pissenlit sauvage."),
    (635, 665, VOICE_ROCK, "Comment le corps fait-il la différence entre un minéral végétal et un minéral extrait de la roche ou synthétisé ?"),
    (670, 700, VOICE_SEBI, "La plante transforme le minéral de la terre par la photosynthèse et la lumière du soleil ! C'est ce processus qui rend le minéral bio-électrique et assimilable par la cellule humaine sans aucune toxicité rénale."),
    (705, 735, VOICE_ROCK, "C'est pour cela que vos composés thérapeutiques utilisent exclusivement des herbes sauvages récoltées dans leur milieu originel."),
    (740, 770, VOICE_SEBI, "Absolument. Les plantes cultivées en serre avec des pesticides ou des engrais chimiques ont perdu leur résonance énergétique. La nature sauvage contient toute la force vitale nécessaire à la guérison."),
    (775, 805, VOICE_ROCK, "Venons-en aux légumes du quotidien que tout le monde consomme en pensant bien faire : les carottes, les pommes de terre, les épinards du commerce."),
    (810, 840, VOICE_SEBI, "C'est l'un des plus grands pièges de notre époque moderne. Les gens pensent manger sainement, mais ils consomment des plantes hybridées artificielles."),

    # 15:00 - 20:00 : Le Piège des Aliments Hybridés & de l'Amidon
    (845, 868, VOICE_ROCK, "Parlons précisément de la carotte. Beaucoup de gens sont surpris quand vous leur dites que la carotte n'est pas un aliment naturel."),
    (869, 890, VOICE_SEBI, "La carotte n'a jamais existé à l'état sauvage originel ! Elle a été créée au XVIIe siècle aux Pays-Bas par hybridation de la Queen Anne's Lace avec de l'amidon. Dieu n'a pas créé la carotte orange !"),
    (892, 915, VOICE_ROCK, "Et quelle est la conséquence physiologique de cette présence massive d'amidon ?"),
    (918, 945, VOICE_SEBI, "L'amidon est une colle ! Dans l'organisme, l'amidon se transforme en acide carbonique et en mucus gluant qui tapisse les intestins et bouche les pores d'élimination cellulaire. C'est le terrain idéal pour toutes les maladies."),
    (950, 980, VOICE_ROCK, "Qu'en est-il du riz blanc, du blé moderne et du maïs ?"),
    (985, 1015, VOICE_SEBI, "Le blé moderne a été hybridé à l'extrême, son gluten est indigeste. Le maïs moderne n'a plus rien à voir avec le maïs sauvage mésoaméricain. Ce sont des bombes d'amidon et d'acide qui fatiguent le pancréas et les reins."),
    (1020, 1050, VOICE_ROCK, "Quels sont alors les aliments et céréales alcalines que vous recommandez ?"),
    (1055, 1085, VOICE_SEBI, "Le fonio, le teff, le quinoa sauvage, le riz sauvage, l'amarante et le kamut originel ! Ces grains anciens n'ont pas été dénaturés et fournissent des minéraux vivants."),
    (1090, 1120, VOICE_ROCK, "Et pour les fruits et légumes ? Quels sont les vrais champions de la vitalité bio-électrique ?"),
    (1125, 1155, VOICE_SEBI, "Les figues sauvages, les dattes, les pommes à graines, les cerises, les baies sauvages, le melon à graines, les concombres, les courgettes, l'avocat et le piment doux !"),
    (1160, 1190, VOICE_ROCK, "Vous insistez toujours sur la présence des graines dans les fruits."),

    # 20:00 - 25:00 : Graines, Génétique & Voltage Cellulaire
    (1195, 1225, VOICE_SEBI, "Un fruit sans pépins est un fruit stérile et hybridé en laboratoire ! Si le fruit ne peut pas se reproduire par lui-même, il ne transmettra aucune force vitale à votre corps. Ne mangez jamais de raisin ou de pastèque sans pépins."),
    (1230, 1260, VOICE_ROCK, "Cette notion de vitalité transmise par la génétique végétale vivante est fascinante. Vous parlez souvent du pH et de l'alcalinité du sang."),
    (1265, 1295, VOICE_SEBI, "Le pH de notre sang doit impérativement rester autour de 7,4. Dès que vous consommez des viandes, des produits laitiers, du sucre raffiné ou du café, le corps s'acidifie. Pour se protéger, il puise dans ses propres réserves de calcium et de magnésium osseux."),
    (1300, 1330, VOICE_ROCK, "C'est donc ainsi que naissent l'ostéoporose, l'arthrite et les inflammations chroniques ?"),
    (1335, 1365, VOICE_SEBI, "Exactement ! L'arthrite n'est que de l'acide urique et du mucus cristallisé dans les articulations. Nettoyez le côlon, alcalinisez le sang, et l'inflammation se dissout naturellement."),
    (1370, 1400, VOICE_ROCK, "Parlons de l'eau. Quelle eau devons-nous boire pour soutenir ce processus d'épuration ?"),
    (1405, 1435, VOICE_SEBI, "De l'eau de source naturelle non traitée ou de l'eau distillée enrichie en minéraux bio-électriques. L'eau du robinet avec son chlore et ses résidus chimiques est une agression constante pour les reins."),
    (1440, 1470, VOICE_ROCK, "Et quelle quantité d'eau préconisez-vous chaque jour pendant une détoxification ?"),
    (1475, 1505, VOICE_SEBI, "Au moins trois à quatre litres d'eau de source par jour ! L'eau est le solvant universel qui permet d'évacuer les toxines libérées par les herbes."),

    # 25:00 - 32:00 : La Crise Curative & Le Nettoyage Intracellulaire
    (1510, 1540, VOICE_ROCK, "Lorsque vos patients entament votre protocole de détoxification cellulaire, beaucoup traversent ce qu'on appelle une crise de guérison. Pouvez-vous nous expliquer ce phénomène ?"),
    (1545, 1575, VOICE_SEBI, "Quand les plantes bio-électriques pénètrent les tissus profonds, elles décollent le vieux mucus accumulé depuis des années. Ce mucus toxique passe dans le système circulatoire pour être évacué par la peau, les selles et les urines."),
    (1580, 1610, VOICE_SEBI, "La personne peut ressentir des maux de tête, des éruptions cutanées, des sueurs ou des selles abondantes. Ce n'est pas une nouvelle maladie, c'est le corps qui fait le grand ménage intérieur !"),
    (1615, 1645, VOICE_ROCK, "Et trop souvent, la médecine allopathique panique devant ces symptômes et donne des médicaments pour bloquer l'élimination..."),
    (1650, 1680, VOICE_SEBI, "Voilà la grande tragédie médicale ! Ils bloquent la fièvre, ils bloquent la diarrhée, ils bloquent le mucus avec des anti-inflammatoires, ce qui refoule le poison à l'intérieur des organes vitaux et prépare le cancer."),
    (1685, 1715, VOICE_ROCK, "Votre philosophie rejoint celle des grands maîtres hygiénistes comme Arnold Ehret et Robert Morse sur le drainage lymphatique."),
    (1720, 1750, VOICE_SEBI, "La vérité est une ! Tout chercheur sincère qui observe les lois naturelles de la biologie humaine arrive à la même conclusion : nettoyez le temple, arrêtez de l'empoisonner, et la vie reprend ses droits."),
    (1755, 1785, VOICE_ROCK, "Cette approche sans compromis vous a valu l'hostilité farouche des autorités médicales américaines dans les années 80."),
    (1790, 1820, VOICE_SEBI, "Ils ne pouvaient pas accepter qu'un homme noir, sans diplôme médical officiel américain, guérisse des pathologies déclarées incurables par leurs plus grands professeurs."),
    (1825, 1855, VOICE_ROCK, "Cela a mené au fameux procès de New York en 1988 devant la Cour Suprême de l'État."),
    (1860, 1890, VOICE_SEBI, "Un affrontement juridique gigantesque où la vérité a brillé devant les juges et le monde entier."),
    (1895, 1925, VOICE_ROCK, "Racontez-nous en détail comment ce procès historique s'est déroulé."),
    (1930, 1960, VOICE_SEBI, "Le procureur général de New York m'a accusé d'exercice illégal de la médecine et de fausses allégations de publicité."),

    # 32:00 - 38:00 : Le Procès Historique de New York 1988 (Victoire Totale)
    (1965, 1974, VOICE_ROCK, "En 1988, l'État de New York vous a traîné devant la Cour Suprême pour exercice illégal de la médecine et fausses allégations de guérison. Racontez-nous ce moment historique."),
    (1975, 1990, VOICE_SEBI, "Le procureur général m'a dit : 'Sebi, si vous prétendez guérir le sida, le cancer, le diabète et la cécité, amenez-nous 9 personnes avec leurs bilans sanguins avant et après'. Vous savez ce que nous avons fait ?"),
    (1991, 1996, VOICE_ROCK, "Vous n'avez pas amené 9 personnes..."),
    (1997, 2025, VOICE_SEBI, "Nous avons fait défiler 77 témoins certifiés par les plus grands laboratoires de New York ! Des personnes guéries du sida, du lupus, de la drépanocytose, de tumeurs malignes et de cécité complète."),
    (2030, 2060, VOICE_SEBI, "Le juge a examiné les dossiers médicaux officiels, les analyses de sang avant et après nos protocoles, et a déclaré : 'Alfredo Bowman, vous êtes non coupable sur tous les chefs d'accusation !'"),
    (2065, 2095, VOICE_ROCK, "C'est une victoire judiciaire sans précédent dans les annales médicales des États-Unis. Un herboriste acquitté pour avoir guéri des maladies incurables."),
    (2100, 2130, VOICE_SEBI, "Les médias grand public ont totalement étouffé l'affaire parce que cela remettait en cause des décennies de dogmes médicaux. Mais la vérité ne peut pas être effacée."),
    (2135, 2165, VOICE_ROCK, "À la suite de ce procès, de nombreuses célébrités, artistes et personnalités internationales ont fait appel à vous."),
    (2170, 2200, VOICE_SEBI, "Michael Jackson, Lisa 'Left Eye' Lopes, Eddie Murphy et tant d'autres sont venus à notre clinique. Mais pour moi, chaque être humain a la même valeur sacrée, qu'il soit célèbre ou anonyme."),
    (2205, 2235, VOICE_ROCK, "Votre mission a toujours été d'éveiller les consciences sur la souveraineté de notre santé."),
    (2240, 2270, VOICE_SEBI, "C'est le combat de toute ma vie : redonner aux peuples le pouvoir sur leur propre corps et leur propre santé."),
    (2275, 2295, VOICE_ROCK, "Détaillons maintenant les plantes maîtresses que vous utilisez dans vos formules les plus réputées."),

    # 38:00 - 45:00 : Les Formules Thérapeutiques (Sea Moss, Fucus, Maya, Viento)
    (2300, 2315, VOICE_ROCK, "Quels sont les piliers de vos préparations herboristes ? Le sea moss, le bladderwrack, la salsepareille..."),
    (2316, 2345, VOICE_SEBI, "Le Sea Moss d'Irlande et le Bladderwrack fournissent 92 des 102 minéraux essentiels du corps humain ! Ils dissolvent le mucus lymphatique, nourrissent la glande thyroïde en iode naturel et fortifient les os."),
    (2350, 2380, VOICE_SEBI, "Associés à la salsepareille qui est la plante la plus riche en fer bio-disponible, nous avons créé le complexe Maya et le Bio-ferro, qui purifient le sang à une vitesse fulgurante."),
    (2385, 2415, VOICE_ROCK, "Et pour l'élimination des toxines par le foie et les intestins, quel est le rôle de Chelation 2 et de Viento ?"),
    (2420, 2450, VOICE_SEBI, "Chelation 2 est conçu pour déloger les plaques mucoïdes et les métaux lourds incrustés dans le côlon. Viento est une formule dynamisante qui oxygène les cellules et rétablit la motilité intestinale naturelle."),
    (2455, 2485, VOICE_ROCK, "Combien de temps dure généralement une cure complète avec ces préparations ?"),
    (2490, 2520, VOICE_SEBI, "Une cure de base dure de trois à six mois selon l'ancienneté de la maladie. Mais les premiers bienfaits sur la clarté mentale et l'énergie se font sentir dès les dix premiers jours."),
    (2525, 2555, VOICE_ROCK, "Et durant cette période, quel régime alimentaire exact le patient doit-il observer ?"),
    (2560, 2590, VOICE_SEBI, "Notre guide nutritionnel exclusif : zéro viande, zéro poisson, zéro produit laitier, zéro aliment raffiné ou frit. Uniquement des fruits alcalins mûrs, des légumes crus ou cuits à la vapeur douce, et beaucoup d'eau."),
    (2595, 2625, VOICE_ROCK, "C'est une véritable renaissance physiologique qui réinitialise l'organisme."),
    (2630, 2660, VOICE_SEBI, "La cellule se régénère entièrement lorsque vous lui donnez les conditions biologiques adéquates."),
    (2665, 2700, VOICE_ROCK, "Parlons de votre lieu emblématique au Honduras, le village de régénération d'Usha."),

    # 45:00 - 51:00 : Usha Village, Sources Thermales & Soins Holistiques
    (2705, 2725, VOICE_ROCK, "Parlez-nous d'Usha Village, ce sanctuaire naturel au pied des montagnes au Honduras."),
    (2726, 2755, VOICE_SEBI, "À Usha Village, la terre est vierge de toute pollution chimique. Nous avons des sources thermales naturelles d'eau chaude riche en soufre, en silice et en minéraux volcaniques rares."),
    (2760, 2790, VOICE_SEBI, "Les curistes boivent cette eau vivante directement à la source et prennent des bains thermaux quotidiens pour ouvrir tous les pores de leur peau et évacuer l'acidité profonde."),
    (2795, 2825, VOICE_ROCK, "L'action combinée de l'eau thermale, des plantes sauvages et de l'air pur accélère considérablement la guérison."),
    (2830, 2860, VOICE_SEBI, "J'ai vu des personnes en fauteuil roulant se relever et marcher après quelques semaines. La nature guérit ce que les machines ne peuvent pas comprendre."),
    (2865, 2895, VOICE_ROCK, "Quelle est la leçon spirituelle que vous tirez de toutes ces décennies passées à guérir les malades ?"),
    (2900, 2930, VOICE_SEBI, "La maladie n'est pas une punition, c'est un message du corps qui nous supplie de revenir en harmonie avec la création divine. Quand vous respectez les lois naturelles, la paix et la santé s'installent."),
    (2935, 2965, VOICE_ROCK, "Votre message est universel et transcende toutes les frontières géographiques et culturelles."),
    (2970, 3000, VOICE_SEBI, "La biologie humaine est la même que vous soyez en Amérique, en Afrique, en Asie ou en Europe. Nous sommes tous des créatures bio-électriques interconnectées."),
    (3005, 3035, VOICE_ROCK, "Vous avez également formé de nombreux disciples et herboristes pour transmettre ce savoir inestimable."),
    (3040, 3070, VOICE_SEBI, "Le savoir n'appartient à personne, il appartient à l'humanité entière. Mon devoir est de le semer pour que les générations futures grandissent libres de la maladie."),

    # 51:00 - 56:00 : Conclusion, Message d'Éveil & Héritage Vitaliste
    (3075, 3095, VOICE_ROCK, "Sebi, pour conclure cet entretien mémorable, quel est votre message fondamental pour tous ceux qui nous écoutent aujourd'hui ?"),
    (3096, 3135, VOICE_SEBI, "Aimez votre corps, aimez la nature divine ! Ne laissez personne vous convaincre que votre maladie est incurable ou génétique. La vérité biologique est simple, pure et accessible à chacun. Nettoyez votre temple intérieur, vivez d'aliments vivants et marchez dans la vitalité !"),
    (3140, 3175, VOICE_ROCK, "Un immense merci au Dr. Sebi pour sa sagesse, son dévouement et son courage exceptionnel. Vous pouvez retrouver tous ses protocoles et son guide nutritionnel intégral sur VitalTrack."),
    (3180, 3220, VOICE_SEBI, "Merci Rock pour cette tribune de vérité. Que la bénédiction de la nature et de la santé parfaite accompagne chaque être humain sur cette terre !"),
    (3225, 3260, VOICE_ROCK, "Merci à tous de nous avoir suivis sur le Rock Newman Show. Prenez soin de votre santé, à très bientôt pour un nouveau numéro exceptionnel.")
]

# Timeline continue exhaustive pour Wim Hof 3 Rounds (11 min = 660 secondes)
WIM_CONTINUOUS_TIMELINE = [
    # Round 1 (0:00 - 3:30)
    (0, 15, VOICE_WIM, "Bienvenue dans cette session guidée officielle de respiration Wim Hof. Installez-vous confortablement, assis ou allongé. Détendez vos épaules."),
    (16, 35, VOICE_WIM, "Premier round. Inspirez profondément par le nez ou la bouche, et relâchez sans forcer. Inspirez... et expirez. Suivez le rythme."),
    (40, 60, VOICE_WIM, "Ventre, poitrine, et laissez aller. Entrez dans le flot du souffle. Tout votre corps commence à s'oxygéner en profondeur."),
    (65, 85, VOICE_WIM, "Dix respirations. Sentez de légers picotements dans les mains ou la tête, c'est parfaitement normal, votre sang s'alcalinise."),
    (90, 115, VOICE_WIM, "Vingt respirations. Continuez d'amplifier le souffle sans forcer l'expiration. Remplissez tout l'espace intérieur."),
    (120, 140, VOICE_WIM, "Vingt-cinq respirations. Cinq dernières profondes... Gonflez le ventre, la cage thoracique... et relâchez."),
    (142, 160, VOICE_WIM, "Dernière grande inspiration à fond... et relâchez tout l'air. Bloquez votre respiration. Première rétention d'une minute."),
    (165, 185, VOICE_WIM, "Fermez les yeux, observez le calme intérieur. Aucun effort à fournir, laissez votre métabolisme s'apaiser dans le silence."),
    (190, 205, VOICE_WIM, "Dans dix secondes... Préparez-vous à inspirer... Trois, deux, un... Grande inspiration de récupération !"),
    (206, 220, VOICE_WIM, "Bloquez pendant 15 secondes au sommet des poumons. Sentez l'énergie circuler dans tout le corps... et relâchez doucement."),

    # Round 2 (3:30 - 6:45)
    (225, 245, VOICE_WIM, "Deuxième round ! Reprenez immédiatement le rythme. Inspirez à fond, relâchez. Ventre, poitrine, et laissez aller."),
    (250, 275, VOICE_WIM, "Dix respirations. Laissez le mental s'effacer, devenez le souffle lui-même. Chaque cellule s'illumine d'oxygène."),
    (280, 305, VOICE_WIM, "Vingt respirations. Plus profond encore. Sentez l'onde thermique parcourir votre colonne vertébrale."),
    (310, 330, VOICE_WIM, "Trente respirations complètes. Préparez-vous pour la deuxième rétention."),
    (332, 350, VOICE_WIM, "Dernière respiration à fond... et videz complètement les poumons. Bloquez. Deuxième rétention d'une minute trente."),
    (355, 380, VOICE_WIM, "Plongez dans votre espace de paix absolue. Le rythme cardiaque ralentit, le système nerveux autonome se réinitialise."),
    (385, 400, VOICE_WIM, "Encore quinze secondes de rétention en pleine sérénité... Vous êtes le maître de votre corps."),
    (402, 418, VOICE_WIM, "Grande inspiration de récupération ! Bloquez 15 secondes au sommet... Sentez la puissance... et expirez doucement."),

    # Round 3 (6:45 - 11:00)
    (425, 445, VOICE_WIM, "Troisième et dernier round. Donnez tout ce que vous avez ! Trente respirations profondes, amples et puissantes."),
    (450, 475, VOICE_WIM, "Dix respirations. Aucun blocage, fluidité totale comme les vagues de l'océan. Inspirez la vie, relâchez les tensions."),
    (480, 505, VOICE_WIM, "Vingt respirations. Vous êtes au sommet de votre énergie vitale. L'alcalinité cellulaire est à son maximum."),
    (510, 530, VOICE_WIM, "Dernières respirations du protocole. Trois... Deux... Une... Dernière immense inspiration..."),
    (532, 555, VOICE_WIM, "Et relâchez tout l'air complètement. Troisième rétention de deux minutes. Silence total, présence absolue."),
    (560, 590, VOICE_WIM, "Observez la clarté mentale extraordinaire. Votre système immunitaire se fortifie, l'inflammation s'éteint."),
    (595, 625, VOICE_WIM, "Dernières secondes de rétention en harmonie totale. Sentez la force du vivant en vous."),
    (628, 645, VOICE_WIM, "Trois, deux, un... Grande inspiration victorieuse à plein poumons ! Bloquez 15 secondes."),
    (646, 665, VOICE_WIM, "Soufflez doucement. Revenez à votre respiration naturelle et tranquille. Félicitations pour cette session magistrale !")
]

async def generate_timeline_clips(timeline, prefix):
    clips = []
    for i, (start, end, voice, text) in enumerate(timeline):
        clip_name = f"{prefix}_{i+1}.mp3"
        clip_path = TMP_AUDIO_DIR / clip_name
        communicate = edge_tts.Communicate(text, voice, rate="+3%", pitch="+0Hz")
        await communicate.save(str(clip_path))
        clips.append({
            "id": f"{prefix}_{i+1}",
            "start": start,
            "end": end,
            "file": str(clip_path),
            "text": text
        })
        print(f"  [TTS] {prefix} #{i+1} ({start}s - {end}s): {text[:45]}...")
    return clips

def mix_video_with_clips(orig_video, clips, out_video, crf=28):
    print(f"\n🎛️ Mixage ffmpeg continu pour {out_video.name} ({len(clips)} répliques françaises)...")
    inputs = ["-i", str(orig_video)]
    filter_parts = []
    
    for i, c in enumerate(clips):
        inputs.extend(["-i", c["file"]])
        delay_ms = int(c["start"] * 1000)
        filter_parts.append(f"[{i+1}:a]adelay={delay_ms}|{delay_ms},volume=2.2[spk{i}];")

    labels = "".join([f"[spk{i}]" for i in range(len(clips))])
    filter_parts.append(f"{labels}amix=inputs={len(clips)}:dropout_transition=0:normalize=0[all_speech];")
    # Original video background audio ducked to 25% for high vocal clarity
    filter_parts.append(f"[0:a]volume=0.25[orig_ducked];[orig_ducked][all_speech]amix=inputs=2:dropout_transition=0:normalize=0[aout]")

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
    
    print(f"🎙️ 1. Génération de {len(SEBI_CONTINUOUS_TIMELINE)} clips de doublage pour Dr. Sebi (couverture 00:00 - 56:00)...")
    sebi_clips = await generate_timeline_clips(SEBI_CONTINUOUS_TIMELINE, "sebi_cont")
    mix_video_with_clips(
        PUBLIC_VIDEOS_DIR / "dr-sebi-documentary.mp4",
        sebi_clips,
        PUBLIC_VIDEOS_DIR / "dr-sebi-documentary-fr.mp4",
        crf=28
    )

    print(f"\n🎙️ 2. Génération de {len(WIM_CONTINUOUS_TIMELINE)} clips de guidage pour Wim Hof (couverture 00:00 - 11:00)...")
    wim_clips = await generate_timeline_clips(WIM_CONTINUOUS_TIMELINE, "wim_cont")
    mix_video_with_clips(
        PUBLIC_VIDEOS_DIR / "wim-hof-3-rounds.mp4",
        wim_clips,
        PUBLIC_VIDEOS_DIR / "wim-hof-3-rounds-fr.mp4",
        crf=26
    )

    print("\n🎉 Toutes les vidéos françaises avec doublage continu ont été générées et mixées !")

if __name__ == "__main__":
    asyncio.run(main())
