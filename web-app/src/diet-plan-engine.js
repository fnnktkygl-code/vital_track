/**
 * diet-plan-engine.js
 *
 * Port JS du DietPlanGenerator Dart (vital_track/services + models).
 * Déterministe, ne fait AUCUN appel réseau/IA : compose le calendrier à
 * partir d'une liste d'aliments approuvés, exactement comme le fait le
 * moteur Flutter. Le chat (Gemini) ne doit plus fournir que des
 * PARAMÈTRES (dietPlanRequest) — c'est ce fichier qui transforme ces
 * paramètres en repas réels, avec les mêmes garanties de sécurité/
 * cohérence que côté mobile.
 *
 * Si vous avez déjà une base d'aliments approuvés côté web (ex. le même
 * assets/vital_ranking.json que Flutter, ou un équivalent JS de
 * VitalRulesEngine), branchez-la via `window.VITAL_APPROVED_FOODS`
 * (voir `approvedNamesByCategory` plus bas) — sinon ce module retombe sur
 * les mêmes listes de secours que le générateur Dart.
 */
(function () {
  var SUPPORTED_PROTOCOLS = ['ehret', 'sebi', 'morse', 'personalized'];

  var FALLBACK_POOLS = {
    fruits: ['Papaye', 'Mangue', 'Raisins noirs', 'Pastèque'],
    veggies: ['Kale', 'Concombre', 'Avocat', 'Roquette'],
    grains: ['Quinoa', 'Amarante', 'Sarrasin'],
    herbs: ['Tisane de gingembre', 'Tisane de menthe'],
    oils: ["Huile d'olive", 'Huile de sésame'],
    nuts: ['Graines de courge', 'Graines de tournesol'],
    spices: ['Gingembre frais', 'Origan']
  };

  // Emoji par défaut si votre base d'aliments approuvés n'en fournit pas
  // déjà un par nom (le schéma foodAnalysisPrompt en génère un par
  // aliment scanné — idéalement réutilisez cette même table ici via
  // window.VITAL_FOOD_EMOJIS = { "Papaye": "🥭", ... }).
  var CATEGORY_EMOJI = {
    fruits: '🍎', veggies: '🥬', grains: '🌾',
    herbs: '🌿', oils: '🫒', nuts: '🌰', spices: '🌶️'
  };

  function emojiFor(name, category) {
    var table = (typeof window !== 'undefined' && window.VITAL_FOOD_EMOJIS) || {};
    return table[name] || CATEGORY_EMOJI[category] || '🍽️';
  }

  function approvedNamesByCategory() {
    // Attendu: { Fruits: [...], "Légumes": [...], "Céréales": [...],
    //            "Herbes & Thés": [...], Huiles: [...],
    //            "Noix & Graines": [...], "Épices & Assaisonnements": [...] }
    if (typeof window !== 'undefined' && window.VITAL_APPROVED_FOODS) {
      return window.VITAL_APPROVED_FOODS;
    }
    return {};
  }

  function buildPools(restrictions) {
    var byCategory = approvedNamesByCategory();
    var restrictedWords = String(restrictions || '')
      .toLowerCase()
      .split(/[,;/\n]/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);

    function clean(list, fallback) {
      var source = (!list || list.length === 0) ? fallback : list;
      var filtered = source.filter(function (n) {
        var lower = n.toLowerCase();
        return !restrictedWords.some(function (r) { return lower.indexOf(r) !== -1; });
      });
      // dédoublonne
      filtered = filtered.filter(function (n, i) { return filtered.indexOf(n) === i; });
      return filtered.length === 0 ? fallback : filtered;
    }

    return {
      fruits: clean(byCategory['Fruits'], FALLBACK_POOLS.fruits),
      veggies: clean(byCategory['Légumes'], FALLBACK_POOLS.veggies),
      grains: clean(byCategory['Céréales'], FALLBACK_POOLS.grains),
      herbs: clean(byCategory['Herbes & Thés'], FALLBACK_POOLS.herbs),
      oils: clean(byCategory['Huiles'], FALLBACK_POOLS.oils),
      nuts: clean(byCategory['Noix & Graines'], FALLBACK_POOLS.nuts),
      spices: clean(byCategory['Épices & Assaisonnements'], FALLBACK_POOLS.spices)
    };
  }

  function pick(list, dayIndex, seed, offset) {
    offset = offset || 0;
    return list[(dayIndex + seed + offset) % list.length];
  }

  function pickN(list, n, dayIndex, seed, offset) {
    offset = offset || 0;
    var out = [];
    for (var k = 0; out.length < n && k < n + list.length; k++) {
      var v = list[(dayIndex + seed + offset + k) % list.length];
      if (out.indexOf(v) === -1) out.push(v);
    }
    return out;
  }

  function toTags(items, category) {
    return items.map(function (n) { return { e: emojiFor(n, category), n: n }; });
  }

  function phaseLabel(protocol, dayIndex, numDays) {
    var ratio = numDays <= 1 ? 1 : dayIndex / (numDays - 1);
    switch (protocol) {
      case 'ehret':
        if (ratio < 0.34) return 'Élimination douce';
        if (ratio < 0.7) return 'Transition mucusless';
        return 'Régénération';
      case 'sebi':
        if (ratio < 0.34) return 'Nettoyage alcalin';
        if (ratio < 0.7) return 'Reconstruction minérale';
        return 'Équilibre bio-minéral';
      case 'morse':
        if (ratio < 0.34) return 'Activation lymphatique';
        if (ratio < 0.7) return 'Détoxification';
        return 'Régénération cellulaire';
      default:
        if (ratio < 0.34) return 'Mise en route';
        if (ratio < 0.7) return 'Approfondissement';
        return 'Ancrage';
    }
  }

  function planName(protocol, objective) {
    var label = { ehret: 'Transition Ehret', sebi: 'Guide Dr. Sebi', morse: 'Détox Dr. Morse' }[protocol] || 'Plan Vitaliste';
    var o = String(objective || '').trim();
    return o ? label + ' — ' + o : label;
  }

  function slotMeta(slot) {
    switch (slot) {
      case 'Réveil': return { time: '6h-7h', tone: 'matin', icon: '🌅' };
      case 'Petit-déjeuner': return { time: '8h-9h', tone: 'matin', icon: '🍽️' };
      case 'Déjeuner': return { time: '12h-13h', tone: 'midi', icon: '🥗' };
      case 'Collation': return { time: '16h', tone: 'midi', icon: '🌰' };
      case 'Dîner': return { time: '19h-20h', tone: 'soir', icon: '🌙' };
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

  /** Construit les repas d'UN jour, sous forme de la structure attendue par calendar-legacy.js */
  function buildDayMeals(opts) {
    var protocol = opts.protocol, dayIndex = opts.dayIndex, numDays = opts.numDays;
    var date = opts.date, pools = opts.pools, seed = opts.seed;

    var fruits = pools.fruits, veggies = pools.veggies, grains = pools.grains, herbs = pools.herbs, nuts = pools.nuts;
    var earlyRatio = numDays <= 1 ? 1 : dayIndex / (numDays - 1);
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
        note: note,
        done: false
      });
    }

    switch (protocol) {
      case 'ehret':
        push('Réveil', ['Eau tiède citronnée'], 'herbs', "Draine la lymphe avant le premier repas — l'estomac vide.");
        push('Petit-déjeuner', pickN(fruits, earlyRatio < 0.3 ? 1 : 2, dayIndex, seed), 'fruits', "Mono-fruit de préférence. Mâche lentement, jusqu'à satiété légère.");
        push('Déjeuner', pickN(veggies, 2, dayIndex, seed).concat(earlyRatio > 0.4 ? [pick(grains, dayIndex, seed, 1)] : []), 'veggies', 'Salade crue en base, + un féculent sans mucus si bien toléré.');
        push('Dîner', pickN(veggies, 2, dayIndex, seed, 3), 'veggies', 'Repas léger. Arrête de manger au moins 3h avant le coucher.');
        break;

      case 'sebi':
        push('Réveil', [pick(herbs, dayIndex, seed)], 'herbs', 'Tisane du guide nutritionnel Dr. Sebi.');
        push('Petit-déjeuner', pickN(fruits, 2, dayIndex, seed), 'fruits', "Uniquement des fruits de la liste approuvée (pas de pastèque hybride ni d'agrumes doux).");
        push('Déjeuner', pickN(veggies, 2, dayIndex, seed, 1).concat([pick(grains, dayIndex, seed)]), 'veggies', 'Céréale sans gluten (liste approuvée) + légumes-feuilles.');
        push('Collation', [pick(nuts, dayIndex, seed)], 'nuts', 'Petite poignée — pas de cacahuètes ni de noix de cajou.');
        push('Dîner', pickN(veggies, 2, dayIndex, seed, 2), 'veggies', 'Légumes vapeur + huile approuvée (olive, sésame, chanvre).');
        break;

      case 'morse':
        push('Réveil', ['Eau de source'], 'herbs', 'Hydrate le système lymphatique avant tout.');
        push('Petit-déjeuner', pickN(fruits, 2, dayIndex, seed), 'fruits', 'Fruits astringents — jusqu\u2019à midi uniquement, jamais après.');
        push('Déjeuner', pickN(veggies, 3, dayIndex, seed), 'veggies', 'La grande salade crue du jour — le repas le plus important pour Morse.');
        push('Collation', [pick(fruits, dayIndex, seed, 2)], 'fruits', 'Un fruit si besoin, jamais juste avant le dîner.');
        push('Dîner', pickN(veggies, 2, dayIndex, seed, 1), 'veggies', 'Léger, vapeur si besoin de chaud.');
        break;

      default: // personalized
        push('Réveil', ['Eau tiède citronnée'], 'herbs', '');
        push('Petit-déjeuner', pickN(fruits, 2, dayIndex, seed), 'fruits', 'Le point commun des trois écoles : fruits frais et mûrs.');
        push('Déjeuner', pickN(veggies, 2, dayIndex, seed).concat([pick(grains, dayIndex, seed)]), 'veggies', '');
        push('Collation', [pick(nuts, dayIndex, seed)], 'nuts', '');
        push('Dîner', pickN(veggies, 2, dayIndex, seed, 2), 'veggies', '');
    }

    return planned;
  }

  /**
   * Génère un plan complet à partir des seuls PARAMÈTRES fournis par le chat.
   * Ne fait aucune supposition sur le contenu des repas : tout vient de
   * buildPools() + buildDayMeals(), donc reste dans la liste approuvée et
   * respecte les restrictions comme côté Flutter.
   */
  function generateDietPlan(request) {
    var protocol = SUPPORTED_PROTOCOLS.indexOf(request.protocol) !== -1 ? request.protocol : 'personalized';
    var numDays = Math.max(1, Math.min(30, request.numDays || 7));
    var objective = request.objective || '';
    var restrictions = request.restrictions || '';
    var startDate = request.startDate ? new Date(request.startDate) : new Date();
    startDate.setHours(0, 0, 0, 0);

    var pools = buildPools(restrictions);
    var meals = [];
    var phaseByDate = {};
    for (var i = 0; i < numDays; i++) {
      var date = new Date(startDate);
      date.setDate(date.getDate() + i);
      var dayMeals = buildDayMeals({ protocol: protocol, dayIndex: i, numDays: numDays, date: date, pools: pools, seed: 0 });
      meals = meals.concat(dayMeals);
      phaseByDate[toDateStr(date)] = phaseLabel(protocol, i, numDays);
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

  /** Régénère uniquement le contenu d'un jour (nouvelle sélection d'aliments), comme regenerateDay() côté Dart. */
  function regenerateDietDay(opts) {
    var pools = buildPools(opts.restrictions);
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

  window.DietPlanEngine = {
    supportedProtocols: SUPPORTED_PROTOCOLS,
    generate: generateDietPlan,
    generateDietPlan: generateDietPlan,
    regenerateDietDay: regenerateDietDay
  };
})();
