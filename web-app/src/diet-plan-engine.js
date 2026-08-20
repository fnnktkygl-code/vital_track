/**
 * diet-plan-engine.js — Moteur de Plan Alimentaire Vitaliste Déterministe 30 Jours
 * 
 * Génère des calendriers alimentaires ultra-variés, non-répétitifs, respectant
 * la nutrition vitaliste (Ehret, Sebi, Morse, Universelle) et s'adaptant à l'éco-région,
 * la saison, les préférences et les restrictions de l'utilisateur.
 */
(function () {
  var SUPPORTED_PROTOCOLS = ['ehret', 'sebi', 'morse', 'personalized'];

  // ═══════ POOLS DE SECOURS ÉTENDUS (30+ aliments par catégorie) ═══════
  var FALLBACK_POOLS = {
    fruits: [
      'Bleuets sauvages boréaux', 'Papaye solo', 'Mangue sauvage', 'Raisins noirs à pépins',
      'Pastèque à graines', 'Canneberges fraîches', 'Figues fraîches', 'Grenade pourpre',
      'Cerises noires', 'Framboises sauvages', 'Mûres sauvages', 'Pomme rustique ancestrale',
      'Poire conférence', 'Prunes sauvages', 'Ananas victoria', 'Sapotille', 'Corossol',
      'Goyave rose', 'Pamplemousse rose', 'Dattes Medjool', 'Poudre de Baobab', 'Baies d\'argousier',
      'Kiwis sauvages', 'Abricots secs bruts', 'Melon charentais', 'Pêches de vigne', 'Fraises des bois',
      'Baies d\'açaï sauvages', 'Tamarin doux', 'Citron vert Key Lime'
    ],
    veggies: [
      'Kale frisé pourpre', 'Roquette sauvage', 'Mâche bio', 'Concombre sans pépins',
      'Avocat créole', 'Courge Butternut rôtie', 'Potimarron doux', 'Courgette crue en tagliatelles',
      'Épinards sauvages', 'Pissenlit sauvage', 'Feuilles d\'ortie fraîche', 'Céleri branche croquant',
      'Fenouil doux', 'Poivron rouge doux', 'Betterave crue râpée', 'Carotte sauvage pourpre',
      'Pourpier d\'été', 'Brocoli sauvage', 'Choux kale lacinato', 'Algue Nori sauvage',
      'Algue Dulse de l\'Atlantique', 'Algue Wakamé bio', 'Laitue romaine croquante',
      'Pousses de tournesol vivantes', 'Micro-pousses de radis', 'Cresson de fontaine',
      'Asperges vertes', 'Artichaut vapeur', 'Navet doux râpé', 'Chicorée rouge de Trévise'
    ],
    grains: [
      'Quinoa royal blanc & noir', 'Amarante sauvage', 'Sarrasin complet germé',
      'Fonio ancestral d\'Afrique', 'Riz sauvage Zizania (Manomin)', 'Teff complet brun',
      'Millet perlé complet'
    ],
    herbs: [
      'Décoction de Chaga boréal', 'Infusion d\'Ortie dioïque reminéralisante',
      'Infusion de Chanca Piedra', 'Décoction de Gingembre frais & Citron',
      'Tisane de Menthe poivrée vivifiante', 'Infusion de Thym sauvage & Romarin',
      'Tisane de fleurs d\'Hibiscus (Bissap)', 'Infusion de Griffe de Chat (Uña de Gato)',
      'Décoction de Pau d\'Arco (Lapacho)', 'Tisane de Kinkéliba sauvage',
      'Infusion de Camomille matricaire', 'Décoction de racines de Pissenlit',
      'Tisane de Basilic sacré (Tulsi)', 'Infusion de Reine des Prés'
    ],
    oils: [
      'Huile d\'olive extra-vierge première pression à froid',
      'Huile de graines de chanvre vierge bio',
      'Huile de sésame noir pressée à froid',
      'Huile d\'avocat brute non raffinée',
      'Huile de graines de lin fraîche'
    ],
    nuts: [
      'Graines de courge d\'Autriche', 'Graines de tournesol germées',
      'Graines de chanvre décortiquées', 'Graines de chia noir activées',
      'Noix de Grenoble sauvages', 'Amandes brutes activées',
      'Noix du Brésil (sélénium)', 'Graines de sésame complet'
    ],
    spices: [
      'Gingembre frais râpé', 'Curcuma sauvage frais', 'Origan des montagnes',
      'Poivre de Cayenne doux', 'Piment habanero doux', 'Basilic sacré séché',
      'Cannelle de Ceylan véritable', 'Graines de coriandre moulues', 'Cardamome verte',
      'Clous de girofle sauvages', 'Anis étoilé'
    ],
    remineralizing: [
      'Huîtres sauvages fraîches du littoral', 'Moules de bouchot au thym',
      'Palourdes sauvages vapeur', 'Salade de macroalgues dulse & wakamé'
    ]
  };

  var CATEGORY_EMOJI = {
    fruits: '🍎', veggies: '🥬', grains: '🌾',
    herbs: '🌿', oils: '🫒', nuts: '🌰', spices: '🌶️', remineralizing: '🦪'
  };

  function emojiFor(name, category) {
    var table = (typeof window !== 'undefined' && window.VITAL_FOOD_EMOJIS) || {};
    if (table[name]) return table[name];
    var n = (name || '').toLowerCase();
    if (n.indexOf('bleuet') !== -1) return '🫐';
    if (n.indexOf('huître') !== -1 || n.indexOf('huitre') !== -1 || n.indexOf('moule') !== -1 || n.indexOf('palourde') !== -1) return '🦪';
    if (n.indexOf('chaga') !== -1 || n.indexOf('champignon') !== -1) return '🍄';
    if (n.indexOf('avocat') !== -1) return '🥑';
    if (n.indexOf('courge') !== -1 || n.indexOf('potimarron') !== -1) return '🎃';
    if (n.indexOf('pomme') !== -1) return '🍏';
    if (n.indexOf('banane') !== -1) return '🍌';
    if (n.indexOf('citron') !== -1) return '🍋';
    if (n.indexOf('mangue') !== -1) return '🥭';
    if (n.indexOf('pastèque') !== -1 || n.indexOf('pasteque') !== -1) return '🍉';
    if (n.indexOf('raisin') !== -1) return '🍇';
    if (n.indexOf('gingembre') !== -1 || n.indexOf('curcuma') !== -1) return '🫚';
    if (n.indexOf('tisane') !== -1 || n.indexOf('infusion') !== -1 || n.indexOf('décoction') !== -1) return '🍵';
    if (n.indexOf('algue') !== -1 || n.indexOf('dulse') !== -1 || n.indexOf('wakamé') !== -1) return '🌊';
    return CATEGORY_EMOJI[category] || '🍽️';
  }

  function approvedNamesByCategory() {
    var out = {};
    
    // 1. Check window.VITAL_APPROVED_FOODS
    if (typeof window !== 'undefined' && window.VITAL_APPROVED_FOODS) {
      var src = window.VITAL_APPROVED_FOODS;
      out.fruits = src.fruits || src['Fruits'] || [];
      out.veggies = src.veggies || src['Légumes'] || [];
      out.grains = src.grains || src['Céréales'] || [];
      out.herbs = src.herbs || src['Herbes & Thés'] || [];
      out.oils = src.oils || src['Huiles'] || [];
      out.nuts = src.nuts || src['Noix & Graines'] || [];
      out.spices = src.spices || src['Épices & Assaisonnements'] || [];
    }

    // 2. If vitalDb is available, complement dynamically
    if (typeof window !== 'undefined' && Array.isArray(window.vitalDb) && window.vitalDb.length > 0) {
      window.vitalDb.forEach(function(item) {
        var cat = item.category || '';
        var name = (item.names && (item.names[1] || item.names[0])) || item.id;
        if (!name) return;
        var cap = name.charAt(0).toUpperCase() + name.slice(1);
        
        var targetKey = 'veggies';
        var catLower = (cat || '').toLowerCase();
        if (cat === 'Fruits' || catLower.indexOf('fruit') !== -1) targetKey = 'fruits';
        else if (cat === 'Légumes' || catLower.indexOf('légume') !== -1 || catLower.indexOf('tubercule') !== -1) targetKey = 'veggies';
        else if (cat === 'Céréales' || catLower.indexOf('céréale') !== -1) targetKey = 'grains';
        else if (cat === 'Herbes & Thés' || catLower.indexOf('herbe') !== -1 || catLower.indexOf('thé') !== -1) targetKey = 'herbs';
        else if (cat === 'Huiles' || catLower.indexOf('huile') !== -1) targetKey = 'oils';
        else if (cat === 'Noix & Graines' || catLower.indexOf('noix') !== -1 || catLower.indexOf('graine') !== -1) targetKey = 'nuts';
        else if (cat === 'Épices & Assaisonnements' || catLower.indexOf('épice') !== -1) targetKey = 'spices';

        if (!out[targetKey]) out[targetKey] = [];
        if (out[targetKey].indexOf(cap) === -1) out[targetKey].push(cap);
      });
    }

    return out;
  }

  function buildPools(restrictions, context) {
    var byCat = approvedNamesByCategory();
    var restrictedWords = String(restrictions || '')
      .toLowerCase()
      .split(/[,;/\n]/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);

    function clean(list, fallback) {
      var source = (!list || list.length === 0) ? fallback : list.concat(fallback);
      // Dédoublonne en préservant l'ordre
      var seen = {};
      var dedup = [];
      source.forEach(function(item) {
        if (!item || seen[item.toLowerCase()]) return;
        seen[item.toLowerCase()] = true;
        dedup.push(item);
      });

      var filtered = dedup.filter(function (n) {
        var lower = n.toLowerCase();
        return !restrictedWords.some(function (r) { return lower.indexOf(r) !== -1; });
      });

      return filtered.length === 0 ? fallback : filtered;
    }

    var pools = {
      fruits: clean(byCat.fruits, FALLBACK_POOLS.fruits),
      veggies: clean(byCat.veggies, FALLBACK_POOLS.veggies),
      grains: clean(byCat.grains, FALLBACK_POOLS.grains),
      herbs: clean(byCat.herbs, FALLBACK_POOLS.herbs),
      oils: clean(byCat.oils, FALLBACK_POOLS.oils),
      nuts: clean(byCat.nuts, FALLBACK_POOLS.nuts),
      spices: clean(byCat.spices, FALLBACK_POOLS.spices),
      remineralizing: clean([], FALLBACK_POOLS.remineralizing)
    };

    // Eco-regional & seasonal prioritization
    var region = (context && context.country) || 'Canada';
    var isCold = region.indexOf('Canada') !== -1 || region.indexOf('Montréal') !== -1 || (context && context.season === 'Hiver');
    if (isCold) {
      // Prioritize warming & boreal staples
      pools.fruits.sort(function(a, b) {
        var aScore = (a.indexOf('Bleuet') !== -1 || a.indexOf('Canneberge') !== -1 || a.indexOf('Argousier') !== -1 || a.indexOf('Pomme') !== -1) ? -1 : 1;
        var bScore = (b.indexOf('Bleuet') !== -1 || b.indexOf('Canneberge') !== -1 || b.indexOf('Argousier') !== -1 || b.indexOf('Pomme') !== -1) ? -1 : 1;
        return aScore - bScore;
      });
      pools.veggies.sort(function(a, b) {
        var aScore = (a.indexOf('Courge') !== -1 || a.indexOf('Potimarron') !== -1 || a.indexOf('Ortie') !== -1 || a.indexOf('Racine') !== -1) ? -1 : 1;
        var bScore = (b.indexOf('Courge') !== -1 || b.indexOf('Potimarron') !== -1 || b.indexOf('Ortie') !== -1 || b.indexOf('Racine') !== -1) ? -1 : 1;
        return aScore - bScore;
      });
      pools.herbs.sort(function(a, b) {
        var aScore = (a.indexOf('Chaga') !== -1 || a.indexOf('Gingembre') !== -1 || a.indexOf('Thym') !== -1 || a.indexOf('Ortie') !== -1) ? -1 : 1;
        var bScore = (b.indexOf('Chaga') !== -1 || b.indexOf('Gingembre') !== -1 || b.indexOf('Thym') !== -1 || b.indexOf('Ortie') !== -1) ? -1 : 1;
        return aScore - bScore;
      });
    }

    return pools;
  }

  function pickSmart(list, dayIndex, seed, offset, excludeNames) {
    offset = offset || 0;
    excludeNames = excludeNames || [];
    if (!list || list.length === 0) return 'Aliment vitaliste';
    
    // Stride ensures full cycle through large pool without repeating modulo 4
    var stride = 7;
    var index = (dayIndex * stride + seed + offset) % list.length;
    var candidate = list[index];

    // If excluded (e.g. was consumed yesterday), step forward
    var attempts = 0;
    while (excludeNames.indexOf(candidate) !== -1 && attempts < list.length) {
      index = (index + 1) % list.length;
      candidate = list[index];
      attempts++;
    }
    return candidate;
  }

  function pickSmartN(list, n, dayIndex, seed, offset, excludeNames) {
    offset = offset || 0;
    excludeNames = excludeNames || [];
    var picked = [];
    for (var i = 0; picked.length < n && i < list.length; i++) {
      var item = pickSmart(list, dayIndex, seed, offset + i * 3, excludeNames.concat(picked));
      if (picked.indexOf(item) === -1) {
        picked.push(item);
      }
    }
    return picked;
  }

  function toTags(items, category) {
    return items.map(function (n) { return { e: emojiFor(n, category), n: n }; });
  }

  function weeklyThemeFor(weekNum) {
    switch (weekNum) {
      case 1:
        return { name: 'Semaine 1 : Élimination douce & Transition', focus: 'Alcalinisation des humeurs, verdures toniques et mono-fruits doux.' };
      case 2:
        return { name: 'Semaine 2 : Hydratation cellulaire profonde', focus: 'Fruits vivants à eau structurée, jus verts et régénération interstitielle.' };
      case 3:
        return { name: 'Semaine 3 : Reminéralisation & Lymphe', focus: 'Super-végétaux, baies boréales sauvages, graines riches et algues marines.' };
      case 4:
      default:
        return { name: 'Semaine 4 : Ancrage & Force vitale', focus: 'Céréales ancestrales douces, légumes vapeurs aromatisés et décoctions adaptogènes.' };
    }
  }

  function phaseLabel(protocol, dayIndex, numDays) {
    var weekNum = Math.floor(dayIndex / 7) + 1;
    var theme = weeklyThemeFor(weekNum);
    return theme.name;
  }

  function planName(protocol, objective) {
    var label = { ehret: 'Transition Ehret', sebi: 'Guide Dr. Sebi', morse: 'Détox Dr. Morse' }[protocol] || 'Programme Vitaliste Équilibré';
    var o = String(objective || '').trim();
    return o ? label + ' — ' + o : label;
  }

  function slotMeta(slot) {
    switch (slot) {
      case 'Réveil': return { time: '6h30-7h30', tone: 'matin', icon: '🌅' };
      case 'Petit-déjeuner': return { time: '8h30-9h30', tone: 'matin', icon: '🍽️' };
      case 'Déjeuner': return { time: '12h30-13h30', tone: 'midi', icon: '🥗' };
      case 'Collation': return { time: '16h30', tone: 'midi', icon: '🌰' };
      case 'Dîner': return { time: '19h00-20h00', tone: 'soir', icon: '🌙' };
      default: return { time: '', tone: 'midi', icon: '🍽️' };
    }
  }

  function uid() {
    return 'meal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  function toDateStr(d) {
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  /**
   * Construit les repas d'un jour précis avec diversité réelle et prise en compte des exceptions
   */
  function buildDayMeals(opts) {
    var protocol = opts.protocol, dayIndex = opts.dayIndex, numDays = opts.numDays;
    var date = opts.date, pools = opts.pools, seed = opts.seed || 0;
    var prevDayFoods = opts.prevDayFoods || [];
    var allowWeeklyMollusks = opts.allowWeeklyMollusks || false;

    var fruits = pools.fruits, veggies = pools.veggies, grains = pools.grains, herbs = pools.herbs, nuts = pools.nuts, remin = pools.remineralizing;
    var planned = [];

    function push(slot, items, category, note) {
      var meta = slotMeta(slot);
      planned.push({
        id: uid(),
        dateStr: toDateStr(date),
        slot: slot,
        title: slot,
        time: meta.time,
        tone: meta.tone,
        icon: meta.icon,
        tags: toTags(items, category),
        note: note || '',
        done: false
      });
    }

    var weekNum = Math.floor(dayIndex / 7) + 1;
    var dayOfWeek = date.getDay(); // 0 = Dimanche, 6 = Samedi
    var isSpecialRemineralizingDay = allowWeeklyMollusks && (dayOfWeek === 0 || (dayIndex > 0 && dayIndex % 7 === 6));

    var focusFoods = opts.focusFoods || [];
    // Sélection d'aliments du jour en évitant ceux de la veille
    var morningHerb = (dayIndex === 0 && focusFoods.length > 0) ? focusFoods[0] : pickSmart(herbs, dayIndex, seed, 0, prevDayFoods);
    var morningFruits = pickSmartN(fruits, weekNum === 1 ? 1 : 2, dayIndex, seed, 1, prevDayFoods);
    
    var lunchVeggies = pickSmartN(veggies, 2, dayIndex, seed, 3, prevDayFoods);
    var lunchGrain = pickSmart(grains, dayIndex, seed, 2, prevDayFoods);
    
    var afternoonSnack = pickSmart(nuts, dayIndex, seed, 4, prevDayFoods);
    var dinnerVeggies = pickSmartN(veggies, 2, dayIndex, seed, 7, lunchVeggies.concat(prevDayFoods));

    switch (protocol) {
      case 'ehret':
        push('Réveil', [morningHerb], 'herbs', "Draine la lymphe et active les reins avant le premier repas.");
        push('Petit-déjeuner', morningFruits, 'fruits', "Mono-fruit de préférence. Mâche lentement, jusqu'à satiété légère.");
        
        var lunchItems = lunchVeggies;
        if (dayIndex % 2 === 1) lunchItems = lunchItems.concat([lunchGrain]);
        push('Déjeuner', lunchItems, 'veggies', 'Grande salade vivante sans mucus + féculent doux autorisé.');
        
        push('Dîner', dinnerVeggies, 'veggies', 'Repas léger du soir. Arrête de manger au moins 3h avant le coucher.');
        break;

      case 'sebi':
        push('Réveil', [morningHerb], 'herbs', 'Tisane drainante bio-minérale Dr. Sebi.');
        push('Petit-déjeuner', morningFruits, 'fruits', "Fruits vivants à graines de la liste alcalinisante.");
        
        var sebiLunch = lunchVeggies.concat([lunchGrain]);
        if (isSpecialRemineralizingDay && remin.length > 0) {
          sebiLunch = [pickSmart(remin, Math.floor(dayIndex / 7), seed, 0)].concat(lunchVeggies.slice(0, 1));
        }
        push('Déjeuner', sebiLunch, 'veggies', isSpecialRemineralizingDay ? '🌿 Déjeuner reminéralisant hebdomadaire (zinc & iode bio-actifs).' : 'Céréale ancestrale sans gluten + légumes-feuilles alcalins.');
        
        push('Collation', [afternoonSnack], 'nuts', 'Petite poignée de graines brutes activées.');
        push('Dîner', dinnerVeggies, 'veggies', 'Légumes vapeur aux herbes + huile vierge pressée à froid.');
        break;

      case 'morse':
        push('Réveil', ['Eau de source pure'], 'herbs', 'Hydrate en profondeur le système lymphatique.');
        push('Petit-déjeuner', morningFruits, 'fruits', 'Fruits astringents et riches en eau structurée EZ.');
        push('Déjeuner', lunchVeggies.concat([pickSmart(veggies, dayIndex, seed, 11, lunchVeggies)]), 'veggies', 'La grande salade crue vitaliste — le pilier régénérateur.');
        push('Collation', [pickSmart(fruits, dayIndex, seed, 5, morningFruits)], 'fruits', 'Fruit frais hydratant en collation légère.');
        push('Dîner', dinnerVeggies, 'veggies', 'Dîner léger végétal, cuit à basse température si besoin.');
        break;

      default: // personalized
        push('Réveil', [morningHerb], 'herbs', 'Éveil digestif et hydratation rénale.');
        push('Petit-déjeuner', morningFruits, 'fruits', 'Fruits mûrs de saison à haute vitalité.');
        
        var persLunch = lunchVeggies.concat([lunchGrain]);
        if (isSpecialRemineralizingDay && remin.length > 0) {
          persLunch = [pickSmart(remin, Math.floor(dayIndex / 7), seed, 0)].concat(lunchVeggies.slice(0, 1));
        }
        push('Déjeuner', persLunch, 'veggies', isSpecialRemineralizingDay ? 'Repas de reminéralisation marine hebdomadaire.' : 'Assiette végétale colorée : verdures + grains ancestraux.');
        
        push('Collation', [afternoonSnack], 'nuts', 'Graines bio-actives riches en magnésium.');
        push('Dîner', dinnerVeggies, 'veggies', 'Légumes tièdes aux épices douces et herbes aromatiques.');
    }

    return planned;
  }

  /**
   * Génère un plan complet de 1 à 30 jours sans boucle répétitive
   */
  function generateDietPlan(request) {
    var protocol = SUPPORTED_PROTOCOLS.indexOf(request.protocol) !== -1 ? request.protocol : 'personalized';
    var numDays = Math.max(1, Math.min(30, request.numDays || 7));
    var objective = request.objective || '';
    var restrictions = request.restrictions || '';
    var startDate = request.startDate ? new Date(request.startDate) : new Date();
    startDate.setHours(0, 0, 0, 0);

    // Détecte les demandes d'exceptions spéciales (ex: mollusques 1x/semaine)
    var combinedReq = (restrictions + ' ' + objective).toLowerCase();
    var allowWeeklyMollusks = combinedReq.indexOf('mollusque') !== -1 || combinedReq.indexOf('huître') !== -1 || combinedReq.indexOf('huitre') !== -1 || combinedReq.indexOf('fruits de mer') !== -1;

    // Profil utilisateur local si présent
    var userContext = {};
    if (typeof window !== 'undefined' && window.getUserProfile) {
      try { userContext = window.getUserProfile() || {}; } catch(e) {}
    }

    var pools = buildPools(restrictions, userContext);
    var focusFoods = (request && (request.focusFoods || request.preferredFoods || request.customFoods)) || [];
    if (!Array.isArray(focusFoods) && typeof focusFoods === 'string') focusFoods = [focusFoods];
    
    // Also scan combined request/objective for explicitly mentioned medicinal herbs/foods
    var textToScan = (combinedReq + ' ' + (objective || '')).toLowerCase();
    if (textToScan.indexOf('bardane') !== -1 && focusFoods.indexOf('Décoction de racine de bardane') === -1) {
      focusFoods.push('Décoction de racine de bardane');
    }
    if (textToScan.indexOf('chaga') !== -1 && focusFoods.indexOf('Décoction de Chaga boréal') === -1) {
      focusFoods.push('Décoction de Chaga boréal');
    }

    var meals = [];
    var phaseByDate = {};
    var prevDayFoods = [];

    for (var i = 0; i < numDays; i++) {
      var date = new Date(startDate);
      date.setDate(date.getDate() + i);

      var dayMeals = buildDayMeals({
        protocol: protocol,
        dayIndex: i,
        numDays: numDays,
        date: date,
        pools: pools,
        seed: i * 13,
        prevDayFoods: prevDayFoods,
        allowWeeklyMollusks: allowWeeklyMollusks,
        focusFoods: focusFoods
      });

      meals = meals.concat(dayMeals);
      phaseByDate[toDateStr(date)] = phaseLabel(protocol, i, numDays);

      // Collecte les aliments du jour pour éviter la répétition le lendemain
      prevDayFoods = [];
      dayMeals.forEach(function(m) {
        if (m.tags) m.tags.forEach(function(t) { prevDayFoods.push(t.n); });
      });
    }

    return {
      meals: meals,
      meta: {
        name: planName(protocol, objective),
        protocol: protocol,
        numDays: numDays,
        objective: objective,
        restrictions: restrictions,
        startDateStr: toDateStr(startDate),
        totalMeals: meals.length,
        phaseByDate: phaseByDate
      }
    };
  }

  /**
   * Régénère les repas d'un jour spécifique
   */
  function regenerateDietDay(opts) {
    var userContext = {};
    if (typeof window !== 'undefined' && window.getUserProfile) {
      try { userContext = window.getUserProfile() || {}; } catch(e) {}
    }
    var pools = buildPools(opts.restrictions, userContext);
    var seed = (Date.now() % 97) + 1;
    return buildDayMeals({
      protocol: SUPPORTED_PROTOCOLS.indexOf(opts.protocol) !== -1 ? opts.protocol : 'personalized',
      dayIndex: opts.dayIndex,
      numDays: opts.numDays,
      date: new Date(opts.date),
      pools: pools,
      seed: seed
    });
  }

  /**
   * Propose des substituts d'aliments intelligents pour un aliment donné
   */
  function getFoodSubstitutes(foodName, preferredCategory) {
    var cleanName = (foodName || '').trim();
    var byCat = approvedNamesByCategory();

    // Détecte la catégorie de l'aliment
    var catKey = preferredCategory || 'veggies';
    var foundIn = null;
    var allCats = ['fruits', 'veggies', 'grains', 'herbs', 'nuts', 'oils', 'spices', 'remineralizing'];
    for (var i = 0; i < allCats.length; i++) {
      var c = allCats[i];
      var list = (byCat[c] || []).concat(FALLBACK_POOLS[c] || []);
      if (list.some(function(item) { return item.toLowerCase() === cleanName.toLowerCase(); })) {
        foundIn = c;
        break;
      }
    }
    if (foundIn) catKey = foundIn;

    var candidates = (byCat[catKey] || []).concat(FALLBACK_POOLS[catKey] || []);
    // Filtre pour ne pas renvoyer l'aliment lui-même
    var substitutes = [];
    var seen = {};
    candidates.forEach(function(item) {
      if (!item || item.toLowerCase() === cleanName.toLowerCase() || seen[item.toLowerCase()]) return;
      seen[item.toLowerCase()] = true;
      substitutes.push({
        name: item,
        emoji: emojiFor(item, catKey),
        category: catKey
      });
    });

    return substitutes.slice(0, 6);
  }

  window.DietPlanEngine = {
    supportedProtocols: SUPPORTED_PROTOCOLS,
    generate: generateDietPlan,
    generateDietPlan: generateDietPlan,
    regenerateDietDay: regenerateDietDay,
    getFoodSubstitutes: getFoodSubstitutes,
    emojiFor: emojiFor
  };
})();
