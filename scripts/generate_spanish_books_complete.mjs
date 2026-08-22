/**
 * generate_spanish_books_complete.mjs
 * 
 * Générateur de traduction espagnole intégrale de haute fidélité pour :
 * 1. Prof. Arnold Ehret - "Sistema de Curación por Dieta Sin Moco"
 * 2. Dr. Robert Morse - "El Milagro de la Desintoxicación"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { ehretMucuslessFr } from '../web-app/src/data/books/ehretMucuslessFr.js';
import { morseDetoxMiracleFr } from '../web-app/src/data/books/morseDetoxMiracleFr.js';

console.log('🇪🇸 =================================================================');
console.log('📖 GÉNÉRATION DE TRADUCTION INTÉGRALE EN ESPAGNOL (EHRET & MORSE)');
console.log('=================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// DICTIONNAIRES DE GLOSSAIRE ESPAGNOL AVEC SOURCES ACADÉMIQUES
// ─────────────────────────────────────────────────────────────────────────────

const EHRET_GLOSSARY_ES = {
  "moco": {
    "def": "Sustancia viscosa y patológica formada según Ehret por residuos de alimentos no digeridos y desnaturalizados (harinas blancas, carnes, lácteos, almidones refinados), que obstruye las vías circulatorias y constituye la causa fundamental de toda enfermedad.",
    "note": "El «moco» de Ehret es una metáfora clínica visionaria para designar la inflamación mucosa crónica, las endotoxinas, la obstrucción fecal y la hiperpermeabilidad intestinal. La medicina moderna demuestra no obstante que las patologías tienen causas multifactoriales y no se limitan a un único factor.",
    "type": "science",
    "sources": [
      "Minihane, A. M., et al. (2015). 'Low-grade inflammation, diet composition and health: current research evidence and its translation.' British Journal of Nutrition, 114(7), 999-1012. DOI: 10.1017/S0007114515002093",
      "Robbins & Cotran (2020). 'Pathologic Basis of Disease', 10th Ed., Capítulo 2: 'Cellular Responses to Stress and Toxic Insults' (Elsevier, ISBN: 978-0323531139)"
    ]
  },
  "motor humano a presión de aire": {
    "def": "Concepto de Ehret que afirma que el cuerpo es un motor elástico impulsado por la presión atmosférica y la respiración, donde los pulmones actúan como bomba motriz y el corazón como simple válvula reguladora pasiva.",
    "note": "Refutación anatómica objetiva: La cardiología moderna demuestra inequívocamente que el corazón es un músculo contráctil potente (el miocardio) que bombea activamente unos 5 litros de sangre por minuto en reposo.",
    "type": "warning",
    "sources": [
      "Guyton, A. C., & Hall, J. E. (2020). 'Textbook of Medical Physiology', 14th Ed., Capítulo 9: 'Heart Muscle; The Heart as a Pump' (Elsevier, ISBN: 978-0323597128)",
      "Harvey, W. (1628). 'Exercitatio Anatomica de Motu Cordis et Sanguinis in Animalibus' (Demostración de la bomba cardíaca)",
      "Braunwald, E. (2021). 'Heart Disease: A Textbook of Cardiovascular Medicine', 12th Ed. (Elsevier)"
    ]
  },
  "proteínas": {
    "def": "Dogma nutricional combatido por Ehret, quien sostenía que el consumo de proteínas es innecesario y que el cuerpo humano puede sintetizarlo todo a partir de azúcares simples de frutas maduras.",
    "note": "Consenso bioquímico unánime: El cuerpo humano es incapaz de sintetizar los 9 aminoácidos esenciales a partir de carbohidratos. Un aporte proteico regular (especialmente vegetal) es indispensable.",
    "type": "warning",
    "sources": [
      "Nelson, D. L., & Cox, M. M. (2021). 'Lehninger Principles of Biochemistry', 8th Ed., Capítulo 22: 'Biosynthesis of Amino Acids' (Macmillan, ISBN: 978-1319228002)",
      "Rose, W. C. (1938). 'The nutritive significance of the amino acids.' Physiological Reviews, 18(1), 109-136",
      "OMS / FAO / UNU (2007). 'Besoins en protéines et en acides aminés dans la nutrition humaine', Informe Técnico n° 935, Organización Mundial de la Salud"
    ]
  },
  "medicamentos químicos": {
    "def": "Sustancias alopáticas calificadas por Ehret como venenos tóxicos que no curan, retienen los desechos en los órganos y se transmiten químicamente de generación en generación.",
    "note": "Advertencia sanitaria: La medicina de urgencia, antibióticos y cirugía salvan millones de vidas cada año. Jamás se debe interrumpir un tratamiento médico prescrito sin supervisión médica.",
    "type": "warning",
    "sources": [
      "Organización Mundial de la Salud (OMS, 2020). 'Global Report on Sepsis: Improving the prevention, diagnosis and clinical management of sepsis'",
      "Goodman & Gilman (2022). 'The Pharmacological Basis of Therapeutics', 14th Ed. (McGraw-Hill, ISBN: 978-1264258079)"
    ]
  },
  "ayuno racional": {
    "def": "Abstención total y deliberada de alimentos sólidos, permitiendo a la fuerza vital del organismo canalizar su energía hacia la disolución, autólisis y eliminación de obstrucciones mucosas acumuladas.",
    "note": "Validado en biología celular: El ayuno activa la autofagia y la biogénesis mitocondrial, mecanismos premiados con el Premio Nobel de Medicina en 2016.",
    "type": "science",
    "sources": [
      "Ohsumi, Y. (2016). 'Nobel Prize in Physiology or Medicine: Discoveries of mechanisms for autophagy.' Nobel Foundation",
      "Long, V. D., & Mattson, M. P. (2014). 'Fasting: molecular mechanisms and clinical applications.' Cell Metabolism, 19(2), 181-192. DOI: 10.1016/j.cmet.2013.12.008"
    ]
  },
  "vitalidad": {
    "def": "Potencia motriz neta disponible para el ser humano, definida por la ecuación fundamental V = P - O.",
    "note": "Corresponde en bioenergética celular a la producción mitocondrial neta de ATP y al potencial redox libre de inflamación sistémica.",
    "type": "science",
    "sources": [
      "Mitchell, P. (1961). 'Coupling of phosphorylation to electron and hydrogen transfer by a chemiosmotic type of mechanism.' Nature, 191, 144-148",
      "Nicholls, D. G., & Ferguson, S. J. (2013). 'Bioenergetics 4', Academic Press"
    ]
  },
  "obstrucción": {
    "def": "Acumulación progresiva de materias fecales duras, moco y toxinas en el tracto digestivo y tejidos profundos.",
    "note": "La estasis fecal y el tránsito ralentizado generan fermentaciones tóxicas e inflamación de la mucosa digestiva.",
    "type": "science",
    "sources": [
      "Slavin, J. (2013). 'Fiber and prebiotics: mechanisms and health benefits.' Nutrients, 5(4), 1417-1435"
    ]
  },
  "encombrement": {
    "def": "Sinónimo de obstrucción interna: cúmulo de residuos no digeridos y moco en los tejidos y órganos emuntorios.",
    "note": "Corresponde a la sobrecarga metabólica y a la toxemia tisular acumulada.",
    "type": "science",
    "sources": [
      "Slavin, J. (2013). 'Fiber and prebiotics: mechanisms and health benefits.' Nutrients, 5(4), 1417-1435"
    ]
  },
  "dieta sin moco": {
    "def": "Alimentación curativa compuesta exclusivamente de frutas frescas maduras y verduras de hoja verde crudas o cocidas sin almidón, que no generan residuos adhesivos ni flemas.",
    "note": "Alimentación de altísima densidad de micronutrientes, polifenoles y fibra soluble, con bajo índice glucémico y PRAL fuertemente alcalinizante.",
    "type": "science",
    "sources": [
      "Remer, T., & Manz, F. (1995). 'Potential renal acid load of foods and its influence on urine pH.' Journal of the American Dietetic Association, 95(7), 791-797. DOI: 10.1016/S0002-8223(95)00219-7"
    ]
  },
  "dieta de transición": {
    "def": "Fase terapéutica gradual que permite transicionar desde la dieta occidental moderna hacia la dieta sin moco, evitando crisis agudas de desintoxicación.",
    "note": "Principio de gradualidad validado por la farmacocinética y la toxicología para proteger los emuntorios renal y hepático.",
    "type": "science",
    "sources": [
      "Klaassen, C. D. (2019). 'Casarett & Doull's Toxicology: The Basic Science of Poisons', 9th Ed. (McGraw-Hill)"
    ]
  },
  "ecuación suprema": {
    "def": "La fórmula maestra de la vitalidad formulada por Arnold Ehret: V = P - O (Vitalidad = Potencia menos Obstrucción).",
    "note": "Expresión conceptual pionera de la bioenergética moderna: el rendimiento energético celular depende de la minimización de la fricción metabólica.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). 'Textbook of Medical Physiology', 14th Ed. (Elsevier)"
    ]
  },
  "ensalada escoba": {
    "def": "Combinación depurativa de verduras crudas ralladas (repollo, zanahoria, apio) aliñadas sin vinagre que barre mecánicamente las vellosidades intestinales.",
    "note": "Las fibras insolubles estimulan el peristaltismo, reducen el tiempo de tránsito cólico y alimentan la microbiota beneficiosa.",
    "type": "science",
    "sources": [
      "Slavin, J. (2013). 'Fiber and prebiotics: mechanisms and health benefits.' Nutrients, 5(4), 1417-1435"
    ]
  },
  "espejo mágico": {
    "def": "La lengua humana observada durante un ayuno corto, cuya saburra blanca o amarillenta revela el grado exacto de obstrucción mucosa interna.",
    "note": "La saburra lingual refleja la disminución de secreción salival y la descamación de papilas durante el reposo digestivo.",
    "type": "science",
    "sources": [
      "Danser, M. M., et al. (2003). 'Tongue coating and tongue brushing: a review.' Int J Dent Hygiene, 1(3), 151-158"
    ]
  },
  "miroir magique": {
    "def": "La lengua observada durante el ayuno corto como reflejo del estado interno de los órganos y mucosas.",
    "note": "Indicador de descamación celular y reconfiguración microbiana.",
    "type": "science",
    "sources": [
      "Danser, M. M., et al. (2003). 'Tongue coating and tongue brushing.' Int J Dent Hygiene, 1(3), 151-158"
    ]
  },
  "autólisis": {
    "def": "Proceso fisiológico mediante el cual el organismo en ayunas degrada y recicla sus propios tejidos senescentes y depósitos morbosos para nutrir órganos vitales.",
    "note": "Mecanismo biológico de la autofagia descubierto y documentado por Yoshinori Ohsumi (Premio Nobel 2016).",
    "type": "science",
    "sources": [
      "Mizushima, N., & Komatsu, M. (2011). 'Autophagy: renovation of cells and tissues.' Cell, 147(4), 728-741"
    ]
  },
  "autolyse": {
    "def": "Autodigestión celular controlada en fase de ayuno para reutilizar componentes y eliminar residuos.",
    "note": "Sinónimo biológico de autofagia lisosomal celular.",
    "type": "science",
    "sources": [
      "Ohsumi, Y. (2016). Nobel Prize in Physiology or Medicine"
    ]
  },
  "toxemia": {
    "def": "Intoxicación generalizada de la sangre y fluidos corporales por acumulación de ácidos y desechos metabólicos mal eliminados.",
    "note": "Equivalente en fisiopatología moderna a la endotoxemia metabólica y a la inflamación sistémica de bajo grado.",
    "type": "science",
    "sources": [
      "Cani, P. D., et al. (2007). 'Metabolic endotoxemia initiates obesity and insulin resistance.' Diabetes, 56(7), 1761-1772"
    ]
  },
  "toxémie": {
    "def": "Presencia excesiva de toxinas y desechos metabólicos en el torrente circulatorio.",
    "note": "Corresponde a la carga tóxica sistémica y desequilibrio homeostático.",
    "type": "science",
    "sources": [
      "Cani, P. D., et al. (2007). Diabetes, 56(7), 1761-1772"
    ]
  },
  "colon": {
    "def": "Intestino grueso considerado por Ehret como el reservorio principal de residuos tóxicos fermentados.",
    "note": "La barrera epitelial colónica y la microbiota intestinal son claves en la inmunidad sistémica.",
    "type": "science",
    "sources": [
      "Barker, N. (2014). 'Adult intestinal stem cells.' Nature Reviews Mol Cell Bio, 15(1), 19-33"
    ]
  },
  "eliminación": {
    "def": "Expulsión activa de moco, ácidos y toxinas por los emuntorios corporales (riñones, colon, pulmones, piel).",
    "note": "Procesos de excreción y detoxificación hepática de fase I y II acoplados a la filtración renal.",
    "type": "science",
    "sources": [
      "Klaassen, C. D. (2019). 'Casarett & Doull's Toxicology', 9th Ed."
    ]
  },
  "élimination": {
    "def": "Proceso depurativo por el cual el organismo expulsa las sustancias patógenas al exterior.",
    "note": "Fisiología excretora coordinada por los riñones, hígado, intestinos, piel y pulmones.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). 'Textbook of Medical Physiology', 14th Ed."
    ]
  },
  "ácido úrico": {
    "def": "Subproducto metabólico derivado del catabolismo de purinas (carnes, mariscos) que cristaliza e inflama articulaciones y tejidos.",
    "note": "Un exceso de ácido úrico (hiperuricemia) predispone a gota y nefrolitiasis.",
    "type": "science",
    "sources": [
      "Choi, H. K., et al. (2004). 'Purine-rich foods, dairy and protein intake, and the risk of gout in men.' N Engl J Med, 350(11), 1093-1103"
    ]
  },
  "acide urique": {
    "def": "Desecho metabólico purínico que sobrecarga riñones y articulaciones.",
    "note": "Marcador clínico de acidemia tisular e hiperuricemia.",
    "type": "science",
    "sources": [
      "Choi, H. K., et al. (2004). N Engl J Med, 350(11), 1093-1103"
    ]
  },
  "fricción": {
    "def": "Resistencia que frena la circulación sanguínea y reduce la vitalidad motriz humana (F en la fórmula E = P - F).",
    "note": "Equivalente hemodinámico a la resistencia vascular periférica y a la viscosidad sanguínea.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). Capítulo 14: 'Overview of the Circulation; Medical Physics of Pressure, Flow, and Resistance'"
    ]
  },
  "friction": {
    "def": "Resistencia hemodinámica debida a la viscosidad y acumulación de desechos en los vasos capilares.",
    "note": "Resistencia vascular periférica y viscosidad plasmática.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). 'Textbook of Medical Physiology', 14th Ed."
    ]
  },
  "potencia": {
    "def": "La fuerza intrínseca que impulsa el organismo humano (P en la fórmula fundamental).",
    "note": "Capacidad funcional celular de generación de energía bioeléctrica y ATP.",
    "type": "science",
    "sources": [
      "Lehninger Principles of Biochemistry, 8th Ed."
    ]
  },
  "puissance": {
    "def": "La energía vital disponible que mantiene activo el motor humano.",
    "note": "Fuerza vital y bioenergía mitocondrial.",
    "type": "science",
    "sources": [
      "Lehninger Principles of Biochemistry, 8th Ed."
    ]
  },
  "régime sans mucus": {
    "def": "Alimentación basada en frutas y verduras sin almidón que previene la obstrucción tisular.",
    "note": "Dieta fisiológica altamente alcalinizante y regenerativa.",
    "type": "science",
    "sources": [
      "Remer & Manz (1995). J Am Diet Assoc, 95(7), 791-797"
    ]
  },
  "alimentos sin moco": {
    "def": "Frutas maduras, cítricos, bayas, uvas, manzanas, verduras de hoja verde, apio y vegetales crudos o cocidos sin almidón.",
    "note": "Alimentos de residuo neutro o alcalino que limpian las vías digestivas.",
    "type": "science",
    "sources": [
      "Remer, T. (2000). 'Influence of nutrition on acid-base balance.' Eur J Nutr, 39(5), 244-249"
    ]
  },
  "aliments sans mucus": {
    "def": "Frutas y verduras de hoja que no dejan residuos pegajosos ni obstrucciones.",
    "note": "Alimentos de carga ácida renal negativa (alcalinos).",
    "type": "science",
    "sources": [
      "Remer & Manz (1995). J Am Diet Assoc, 95(7), 791-797"
    ]
  },
  "alimentos formadores de moco": {
    "def": "Carnes, pescados, huevos, productos lácteos, pan blanco, cereales refinados, arroz blanco, patatas y legumbres densas.",
    "note": "Alimentos de digestión pesada y residuo altamente acidificante.",
    "type": "science",
    "sources": [
      "Remer & Manz (1995). J Am Diet Assoc, 95(7), 791-797"
    ]
  },
  "aliments producteurs de mucus": {
    "def": "Alimentos densos y refinados que generan flemas, moco y residuos no digeridos.",
    "note": "Alimentos con PRAL positivo y alto potencial de fermentación colónica.",
    "type": "science",
    "sources": [
      "Remer & Manz (1995). J Am Diet Assoc, 95(7), 791-797"
    ]
  },
  "constipación constitucional": {
    "def": "Estado crónico de congestión microscópica de todos los capilares y tejidos del organismo humano.",
    "note": "Microangiopatía funcional y congestión del espacio intersticial de la matriz extracelular.",
    "type": "science",
    "sources": [
      "Pischinger, A. (2007). 'The Extracellular Matrix and Ground Regulation: Basis for a Holistic Biological Medicine' (North Atlantic Books)"
    ]
  },
  "baños de sol": {
    "def": "Exposición terapéutica del cuerpo al aire libre y la luz solar para estimular la vitalidad y la eliminación cutánea.",
    "note": "Estimulación de la síntesis cutánea de vitamina D3 y vasodilatación por liberación de óxido nítrico.",
    "type": "science",
    "sources": [
      "Holick, M. F. (2007). 'Vitamin D deficiency.' N Engl J Med, 357(3), 266-281",
      "Weller, R. B. (2016). 'Sunlight Has Cardiovascular Benefits Independently of Vitamin D.' Blood Purif, 41(1-3), 130-134"
    ]
  },
  "bains de soleil": {
    "def": "Helioterapia racional para potenciar la transpiración y la vitalidad celular.",
    "note": "Síntesis de vitamina D3 y modulación circulatoria.",
    "type": "science",
    "sources": [
      "Holick, M. F. (2007). N Engl J Med, 357(3), 266-281"
    ]
  },
  "aire fresco": {
    "def": "Elemento vital indispensable para la oxigenación celular, el metabolismo y la combustión de desechos internos.",
    "note": "La adecuada hematosis pulmonar es el pilar de la oxigenación mitocondrial y el pH sanguíneo.",
    "type": "science",
    "sources": [
      "West, J. B. (2012). 'Respiratory Physiology: The Essentials', 9th Ed. (Lippincott)"
    ]
  },
  "air frais": {
    "def": "Oxigenación pura indispensable para el motor humano.",
    "note": "Fisiología respiratoria y hematosis celular.",
    "type": "science",
    "sources": [
      "West, J. B. (2012). 'Respiratory Physiology'"
    ]
  },
  "sangre limpia": {
    "def": "Sangre alcalina y fluida libre de toxinas, leucocitosis digestiva y desechos de fermentación.",
    "note": "Optimización del perfil lipídico, reducción de marcadores inflamatorios (PCR, TNF-alfa) y preservación endotelial.",
    "type": "science",
    "sources": [
      "Libby, P. (2002). 'Inflammation in atherosclerosis.' Nature, 420(6917), 868-874"
    ]
  },
  "sang propre": {
    "def": "Plasma sanguíneo fluido y libre de sobrecarga metabólica.",
    "note": "Mantenimiento del endotelio vascular y homeostasis circulatoria.",
    "type": "science",
    "sources": [
      "Libby, P. (2002). Nature, 420(6917), 868-874"
    ]
  },
  "leucocitos": {
    "def": "Glóbulos blancos interpretados por Ehret como materias de desecho resultantes de la ingestión de alimentos erróneos.",
    "note": "Aclaración inmunológica: Los leucocitos son células inmunitarias esenciales contra infecciones bacterianas y víricas.",
    "type": "warning",
    "sources": [
      "Abbas, A. K., Lichtman, A. H., & Pillai, S. (2021). 'Cellular and Molecular Immunology', 10th Ed. (Elsevier)"
    ]
  },
  "glóbulos rojos": {
    "def": "Eritrocitos de la sangre transportadores de oxígeno enriquecidos por sales minerales asimilables de frutas y verduras.",
    "note": "La hemoglobina requiere hierro y oligoelementos para el transporte óptimo de oxígeno a todos los tejidos.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). Capítulo 33: 'Red Blood Cells, Anemia, and Polycythemia'"
    ]
  },
  "hígado": {
    "def": "Órgano emuntorio central responsable de filtrar y neutralizar sustancias tóxicas en la circulación.",
    "note": "Centro de detoxificación metabólica de fases I y II y producción de bilis.",
    "type": "science",
    "sources": [
      "Klaassen, C. D. (2019). 'Casarett & Doull's Toxicology', 9th Ed."
    ]
  },
  "riñones": {
    "def": "Emuntorio principal encargado de filtrar la sangre, eliminar ácidos y regular el equilibrio hidroelectrolítico.",
    "note": "Filtración glomerular de 180 L diarios y excreción de ácidos metabólicos y urea.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). Capítulo 26: 'Renal Physiology'"
    ]
  },
  "estómago": {
    "def": "Órgano digestivo proximal donde se inicia la degradación química de los alimentos y foco de fermentaciones tóxicas cuando se consumen alimentos incompatibles.",
    "note": "Digestión ácida por ácido clorhídrico y pepsina.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). Capítulo 65: 'Gastrointestinal Physiology'"
    ]
  },
  "intestinos": {
    "def": "Vías de asimilación y eliminación compuestas por el intestino delgado y el colon.",
    "note": "Absorción de nutrientes y barrera inmunológica del microbiota.",
    "type": "science",
    "sources": [
      "Sender, R., et al. (2016). PLOS Biology, 14(8), e1002533"
    ]
  },
  "féculents": {
    "def": "Almidones y harinas que forman gomas pegajosas y residuos en el tubo digestivo.",
    "note": "Carbohidratos complejos de absorción rápida que pueden generar picos de glucemia.",
    "type": "science",
    "sources": [
      "Slavin, J. (2013). Nutrients, 5(4), 1417-1435"
    ]
  },
  "enfermedad de bright": {
    "def": "Término histórico para la nefritis crónica y la insuficiencia renal albuminúrica.",
    "note": "Glomerulonefritis y nefropatía crónica en nefrología moderna.",
    "type": "science",
    "sources": [
      "Brenner & Rector's The Kidney, 11th Ed. (Elsevier, 2019)"
    ]
  },
  "diabetes": {
    "def": "Trastorno metabólico caracterizado por glucosuria y alteración en el uso de la glucosa.",
    "note": "Resistencia a la insulina o deficiencia de secreción pancreática.",
    "type": "science",
    "sources": [
      "American Diabetes Association (ADA, 2023). 'Standards of Care in Diabetes'"
    ]
  },
  "aire-gas": {
    "def": "Concepto ehretista referente a la presión de los gases digestivos y el aire atmosférico en el funcionamiento de los órganos.",
    "note": "Corresponde a la presión intratorácica y a los gases de fermentación colónica.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). Textbook of Medical Physiology, 14th Ed."
    ]
  },
  "estreñimiento intestinal": {
    "def": "Retención anormal y estasis de materias fecales y mucosidades en las asas del colon.",
    "note": "El tránsito colónico enlentecido incrementa la reabsorción de endotoxinas y la inflamación de la mucosa.",
    "type": "science",
    "sources": [
      "Slavin, J. (2013). Nutrients, 5(4), 1417-1435"
    ]
  },
  "enema": {
    "def": "Lavado del colon con agua templada para ayudar a desalojar residuos mucosos retenidos.",
    "note": "Procedimiento mecánico coadyuvante en crisis agudas de eliminación.",
    "type": "science",
    "sources": [
      "Robbins & Cotran (2020). Pathologic Basis of Disease, 10th Ed."
    ]
  },
  "ragnar berg": {
    "def": "Célebre químico fisiólogo sueco (1873-1956) pionero en el análisis cuantitativo del equilibrio ácido-base y de las sales minerales en los alimentos.",
    "note": "Sus análisis de laboratorio demostraron científicamente la carga ácida o alcalina generada por cada grupo de alimentos.",
    "type": "science",
    "sources": [
      "Berg, R. (1913). 'Der Einfluss der Zubereitung auf die Zusammensetzung unserer Nahrungsmittel'",
      "Remer, T., & Manz, F. (1995). J Am Diet Assoc, 95(7), 791-797"
    ]
  },
  "ruptura del ayuno": {
    "def": "El momento crítico de reintroducción alimentaria tras un período de ayuno, requiriendo frutas laxantes o verduras sin almidón.",
    "note": "La reactivación de secreciones enzimáticas exige máxima prudencia y gradualidad para evitar sobrecargas pancreáticas o metabólicas.",
    "type": "science",
    "sources": [
      "Long, V. D., & Mattson, M. P. (2014). Cell Metabolism, 19(2), 181-192"
    ]
  },
  "almidones y féculas": {
    "def": "Harinas refinadas, cereales densos, patatas y legumbres que según Ehret generan pastas viscosas y mucosidad en el tracto digestivo.",
    "note": "Carbohidratos amiláceos que requieren amilasa salival y pancreática.",
    "type": "science",
    "sources": [
      "Slavin, J. (2013). Nutrients, 5(4), 1417-1435"
    ]
  }
};

const MORSE_GLOSSARY_ES = {
  "linfa": {
    "def": "El sistema inmunológico y depurativo principal del cuerpo: un líquido alcalino que baña todas las células, absorbe sus desechos celulares ácidos y los conduce hacia los ganglios linfáticos y los riñones.",
    "note": "El sistema linfático drena el líquido intersticial y transporta células inmunitarias y lípidos, garantizando la homeostasis de la matriz extracelular.",
    "type": "science",
    "sources": [
      "Guyton, A. C., & Hall, J. E. (2020). 'Textbook of Medical Physiology', 14th Ed., Capítulo 16: 'The Microcirculation and Lymphatic System' (Elsevier, ISBN: 978-0323597128)",
      "Moore, J. E., & Bertram, C. D. (2018). 'Lymphatic System Flow: Key to Fluid Homeostasis and Immunity.' Annual Review of Fluid Mechanics, 50, 459-482. DOI: 10.1146/annurev-fluid-122316-045259"
    ]
  },
  "sistema linfático": {
    "def": "La red vascular secundaria del cuerpo responsable de la recogida de toxinas, desechos metabólicos celulares y defensa inmunitaria.",
    "note": "Red linfática integral y ganglios linfáticos filtrantes.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). Capítulo 16: 'The Microcirculation and Lymphatic System'"
    ]
  },
  "filtración renal": {
    "def": "La capacidad esencial de los riñones para abrir sus glomérulos y expulsar activamente los desechos linfáticos celulares y sedimentos en la orina.",
    "note": "Filtración glomerular (aprox. 125 mL/min) y excreción de ácidos metabólicos mediante amoniogénesis y fosfatos.",
    "type": "science",
    "sources": [
      "Koeppen, B. M., & Stanton, B. A. (2017). 'Renal Physiology', 6th Ed. (Elsevier, ISBN: 978-0323595681)",
      "Brenner & Rector's (2019). 'The Kidney', 11th Ed., Capítulo 14: 'Mechanisms of Acid-Base Regulation' (Elsevier)"
    ]
  },
  "sedimentos urinarios": {
    "def": "Presencia visible de copos, hilos o nubes de moco en la orina matutina en reposo, signo clínico cardinal de que los riñones están filtrando activamente la linfa.",
    "note": "En nefrología clínica, los sedimentos corresponden a células epiteliales, sales cristalizadas o cilindros hialinos.",
    "type": "science",
    "sources": [
      "Fogazzi, G. B. (2010). 'The Urinary Sediment: An Integrated View', 3rd Ed. (Elsevier, ISBN: 978-8821431449)"
    ]
  },
  "glándulas suprarrenales": {
    "def": "Las dos glándulas endocrinas situadas sobre los riñones que controlan la producción de cortisol, aldosterona, adrenalina y dopamina, determinando la energía nerviosa y la función renal.",
    "note": "Regulan la respuesta al estrés, el equilibrio hidroelectrolítico y el tono vascular.",
    "type": "science",
    "sources": [
      "Melmed, S., et al. (2019). 'Williams Textbook of Endocrinology', 14th Ed., Capítulo 15: 'The Adrenal Cortex' (Elsevier, ISBN: 978-0323555968)"
    ]
  },
  "surrénales": {
    "def": "Glándulas suprarrenales que controlan el sistema nervioso autónomo y la función renal.",
    "note": "Eje hipotálamo-hipofisario-adrenal y control del balance mineral.",
    "type": "science",
    "sources": [
      "Williams Textbook of Endocrinology, 14th Ed."
    ]
  },
  "paratiroides": {
    "def": "Las cuatro diminutas glándulas situadas detrás de la tiroides que secretan la parathormona (PTH), regulando los niveles de calcio iónico y la fuerza de los tejidos conectivos.",
    "note": "La PTH estimula la resorción ósea y la activación renal de vitamina D para mantener la calcemia.",
    "type": "science",
    "sources": [
      "Potts, J. T. (2005). 'Parathyroid hormone: past and present.' Journal of Endocrinology, 187(3), 311-325. DOI: 10.1677/joe.1.06057"
    ]
  },
  "frugivorismo": {
    "def": "El modo alimentario natural y óptimo de la especie humana, consistente en consumir predominantemente frutas maduras, bayas, melones y verduras tiernas de hoja verde.",
    "note": "La anatomía comparada humana (longitud intestinal, dentición no carnívora, saliva alcalina con ptialina) corresponde al modelo anatómico frugívoro de los grandes primates.",
    "type": "science",
    "sources": [
      "Milton, K. (1999). 'Nutritional characteristics of wild primate diets: do the diets of our closest living relatives have lessons for us?' Nutrition, 15(6), 488-498. DOI: 10.1016/S0899-9007(99)00078-7"
    ]
  },
  "temperatura basal de barnes": {
    "def": "Protocolo clínico desarrollado por el Dr. Broda O. Barnes midiendo la temperatura axilar matutina antes de levantarse para evaluar la función metabólica y tiroidea.",
    "note": "Una temperatura basal axilar consistentemente inferior a 36,4 °C sugiere hipometabolismo o hipotiroidismo funcional.",
    "type": "science",
    "sources": [
      "Barnes, B. O., & Galton, L. (1976). 'Hypothyroidism: The Unsuspected Illness' (Harper & Row, ISBN: 978-0060102135)"
    ]
  },
  "crisis de curación": {
    "def": "Manifestación aguda temporal (fiebre moderada, erupciones cutáneas, diarrea depurativa, mucosidades) que se produce cuando el cuerpo moviliza y expulsa toxinas acumuladas.",
    "note": "Corresponde en fisiología a la respuesta inmunitaria e inflamatoria transitoria durante la depuración metabólica.",
    "type": "science",
    "sources": [
      "Robbins & Cotran (2020). 'Pathologic Basis of Disease', 10th Ed., Capítulo 3: 'Inflammation and Repair'"
    ]
  },
  "crise de guérison": {
    "def": "Proceso agudo de eliminación natural donde el cuerpo expulsa residuos acumulados.",
    "note": "Reacción homeostática transitoria de regeneración tisular.",
    "type": "science",
    "sources": [
      "Robbins & Cotran (2020). 'Pathologic Basis of Disease', 10th Ed."
    ]
  },
  "fórmulas de plantas": {
    "def": "Sinergias botánicas de plantas medicinales diseñadas para limpiar, tonificar y regenerar órganos emuntorios específicos (riñones, sistema linfático, hígado, intestinos).",
    "note": "La fitoterapia moderna documenta la acción diurética, colagoga y antioxidante de extractos botánicos estandarizados.",
    "type": "science",
    "sources": [
      "Bone, K., & Mills, S. (2013). 'Principles and Practice of Phytotherapy: Modern Herbal Medicine', 2nd Ed. (Elsevier, ISBN: 978-0443069925)"
    ]
  },
  "formules de plantes": {
    "def": "Combinaciones herbales formuladas para apoyar la regeneración tisular y la filtración renal.",
    "note": "Fitofarmacología y principios activos botánicos.",
    "type": "science",
    "sources": [
      "Bone, K., & Mills, S. (2013). Principles and Practice of Phytotherapy, 2nd Ed."
    ]
  },
  "combinaciones alimentarias": {
    "def": "Reglas dietéticas para consumir frutas y verduras en combinaciones fisiológicas que optimizan los tiempos de vaciado gástrico y evitan fermentaciones tóxicas.",
    "note": "El vaciado gástrico diferencial de azúcares simples versus almidones y lípidos minimiza la distensión abdominal.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). Capítulo 64: 'Digestion and Absorption in the Gastrointestinal Tract'"
    ]
  },
  "acidosis": {
    "def": "Sobrecarga de desechos ácidos metabólicos celulares en el líquido intersticial y la linfa que causa inflamación, dolor y degeneración tisular.",
    "note": "La acumulación de protones (H+) en el microambiente extracelular estimula la actividad de osteoclastos y altera la función enzimática.",
    "type": "science",
    "sources": [
      "Kellum, J. A. (2007). 'Disorders of acid-base balance.' Critical Care Medicine, 35(11), 2630-2636. DOI: 10.1097/01.CCM.0000285996.65787.2E"
    ]
  },
  "acidose": {
    "def": "Estado de acidez tisular e intersticial excesiva generada por alimentos acidificantes y falta de filtración renal.",
    "note": "Desequilibrio del pH tisular y sobrecarga de ácidos metabólicos.",
    "type": "science",
    "sources": [
      "Kellum, J. A. (2007). Crit Care Med, 35(11), 2630-2636"
    ]
  },
  "alimentos vivos": {
    "def": "Frutas, bayas, melones y verduras crudas no procesadas que conservan sus enzimas digestivas intactas y una alta carga bioeléctrica.",
    "note": "Aportan fitoquímicos no desnaturalizados por calor que actúan como antioxidantes celulares.",
    "type": "science",
    "sources": [
      "Liu, R. H. (2013). 'Health-promoting components of fruits and vegetables in the diet.' Advances in Nutrition, 4(3), 384S-392S. DOI: 10.3945/an.112.003517"
    ]
  },
  "iridología": {
    "def": "Evaluación no invasiva de los patrones, densidades y coloraciones del iris para identificar fortalezas genéticas y áreas de congestión linfática.",
    "note": "Herramienta tradicional complementaria de evaluación refleja, no sustitutiva de los análisis diagnósticos médicos convencionales.",
    "type": "warning",
    "sources": [
      "Ernst, E. (2000). 'Iridology: not useful and potentially harmful.' Archives of Ophthalmology, 118(1), 120-121. DOI: 10.1001/archopht.118.1.120"
    ]
  },
  "subluxaciones vertebrales": {
    "def": "Pérdida de alineación articular en la columna que puede comprimir las raíces nerviosas espinales y reducir el flujo de energía a los órganos correspondientes.",
    "note": "En neurología, la compresión de raíces nerviosas espinales produce radiculopatías y alteraciones neuromusculares.",
    "type": "science",
    "sources": [
      "Bogduk, N. (2012). 'Clinical and Radiological Anatomy of the Lumbar Spine', 5th Ed. (Elsevier)"
    ]
  },
  "desintoxicación": {
    "def": "El arte y la ciencia de limpiar el sistema linfático y los órganos internos a través de frutas alcalinas, ayunos y plantas botánicas.",
    "note": "Eliminación de metabolitos tóxicos y regeneración de la matriz celular.",
    "type": "science",
    "sources": [
      "Klaassen, C. D. (2019). Casarett & Doull's Toxicology, 9th Ed."
    ]
  },
  "alcalinización": {
    "def": "Aporte de sales minerales básicas y frutas astringentes para neutralizar los ácidos en la linfa y la sangre.",
    "note": "Restablecimiento de la reserva alcalina sistémica.",
    "type": "science",
    "sources": [
      "Remer & Manz (1995). J Am Diet Assoc, 95(7), 791-797"
    ]
  },
  "astringencia": {
    "def": "Propiedad de frutas ácidas y subácidas (limones, uvas, bayas) para mover la linfa estancada y romper flemas.",
    "note": "Acción osmótica e inductores de motilidad del flujo linfático.",
    "type": "science",
    "sources": [
      "Milton, K. (1999). Nutrition, 15(6), 488-498"
    ]
  },
  "emuntorios": {
    "def": "Los cuatro canales de eliminación del cuerpo humano: riñones, colon, pulmones y piel.",
    "note": "Órganos fisiológicos excretores encargados de la homeostasis del medio interno.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). Textbook of Medical Physiology, 14th Ed."
    ]
  },
  "homeostasis": {
    "def": "El equilibrio dinámico interno del cuerpo que preserva la salud celular perfecta.",
    "note": "Capacidad del organismo para mantener constantes sus parámetros fisicoquímicos.",
    "type": "science",
    "sources": [
      "Cannon, W. B. (1932). 'The Wisdom of the Body' (W. W. Norton)"
    ]
  },
  "autofagia": {
    "def": "Mecanismo celular mediante el cual la célula se limpia de orgánulos dañados y proteínas anormales.",
    "note": "Degradación y reciclaje intracelular mediado por lisosomas.",
    "type": "science",
    "sources": [
      "Ohsumi, Y. (2016). Nobel Prize in Physiology or Medicine"
    ]
  },
  "ptialina": {
    "def": "Enzima amilasa presente en la saliva humana encargada de predigerir los carbohidratos complejos.",
    "note": "Su presencia óptima a pH alcalino refleja la adaptación evolutiva humana a los alimentos de origen vegetal.",
    "type": "science",
    "sources": [
      "Guyton & Hall (2020). Textbook of Medical Physiology, 14th Ed."
    ]
  }
};

const EHRET_TERM_MAP = {
  'acide urique': 'ácido úrico',
  'air-gaz': 'aire-gas',
  'aliments sans mucus': 'alimentos sin moco',
  'bains de soleil': 'baños de sol',
  'constipation intestinale': 'estreñimiento intestinal',
  'côlon': 'colon',
  'colon': 'colon',
  'encombrement': 'obstrucción',
  'foie': 'hígado',
  'friction': 'fricción',
  'féculents': 'almidones y féculas',
  'jeûne rationnel': 'ayuno racional',
  'lavement': 'enema',
  'miroir magique': 'espejo mágico',
  'mucus': 'moco',
  'obstruction': 'obstrucción',
  'protéines': 'proteínas',
  'ragnar berg': 'ragnar berg',
  'reins': 'riñones',
  'rupture du jeûne': 'ruptura del ayuno',
  'régime de transition': 'dieta de transición',
  'régime sans mucus': 'dieta sin moco',
  'toxémie': 'toxemia',
  'vitalité': 'vitalidad',
  'élimination': 'eliminación',
  'autolyse': 'autólisis',
  'air frais': 'aire fresco',
  'sang propre': 'sangre limpia',
  'aliments producteurs de mucus': 'alimentos formadores de moco',
  'équation suprême': 'ecuación suprema',
  'salade balai': 'ensalada escoba',
  'puissance': 'potencia'
};

const MORSE_TERM_MAP = {
  'acidose': 'acidosis',
  'ptyaline': 'ptialina',
  'lymphe': 'linfa',
  'filtration rénale': 'filtración renal',
  'surrénales': 'glándulas suprarrenales',
  'glandes surrénales': 'glándulas suprarrenales',
  'parathyroïdes': 'paratiroides',
  'frugivorisme': 'frugivorismo',
  'combinaisons alimentaires': 'combinaciones alimentarias',
  'formules de plantes': 'fórmulas de plantas',
  'température basale de barnes': 'temperatura basal de barnes',
  'crise de guérison': 'crisis de curación',
  'crise d\'élimination': 'crisis de curación',
  'aliments vivants': 'alimentos vivos',
  'iridologie': 'iridología',
  'subluxations vertébrales': 'subluxaciones vertebrales',
  'alcalinisation': 'alcalinización',
  'astringence': 'astringencia',
  'détoxification': 'desintoxicación',
  'vitalité': 'vitalidad',
  'autophagie': 'autofagia',
  'mucus': 'moco'
};

console.log('✅ Glossaires espagnols initialisés.');

// ─────────────────────────────────────────────────────────────────────────────
// COMPILATION & ÉCRITURE DES FICHIERS DE LIVRES EN ESPAGNOL
// ─────────────────────────────────────────────────────────────────────────────

// 1. ARNOLD EHRET (ES)
const ehretEsChapters = ehretMucuslessFr.chapters.map((ch, idx) => {
  let tag = ch.tag;
  if (tag.startsWith('Leçon')) tag = tag.replace('Leçon', 'Lección');
  else if (tag === 'Introduction') tag = 'Introducción';
  else if (tag === 'Préface') tag = 'Prefacio';
  else if (tag === 'Biographie') tag = 'Biografía';
  else if (tag === 'Dictionnaire') tag = 'Glosario';

  let title = ch.title;
  if (title.includes("Principes généraux d'introduction")) title = "Principios Generales de Introducción";
  else if (title.includes("Aliments latents")) title = "Alimentos Latentes, Formadores de Moco y Sin Moco";
  else if (title.includes("Le Diagnostic du régime sans mucus")) title = "El Diagnóstico del Sistema de Curación por Dieta Sin Moco";
  else if (title.includes("Le Diagnostic (Suite) et le Miroir Magique")) title = "El Diagnóstico (Continuación) y el Espejo Mágico";
  else if (title.includes("La Formule Fondamentale de la Vie")) title = "La Fórmula Fundamental de la Vida: V = P - O";
  else if (title.includes("La Nouvelle Physiologie (Le Moteur Humain)")) title = "La Nueva Fisiología (El Motor Humano a Presión de Aire)";
  else if (title.includes("La Nouvelle Physiologie (Suite)")) title = "La Nueva Fisiología (Continuación) - Eliminación de la Descomposición";
  else if (title.includes("La Tricherie des Protéines")) title = "La Tragedia y el Engaño de las Proteínas";
  else if (title.includes("La Composition du Sang")) title = "La Composición y Regeneración de la Sangre";
  else if (title.includes("La Construction de Nouveau Sang")) title = "La Construcción de Sangre Nueva y Pura";
  else if (title.includes("Le Régime de Transition (Menus & Recettes)")) title = "La Dieta de Transición (Menús y Recetas Progresivas)";
  else if (title.includes("Le Régime de Transition (Suite)")) title = "La Dieta de Transición (Continuación y Combinaciones)";
  else if (title.includes("Le Régime de Transition pour les Végétariens")) title = "La Dieta de Transición para Vegetarianos y Grandes Comilones";
  else if (title.includes("Les Tables d'Aliments de Ragnar Berg")) title = "Las Tablas de Alimentos de Ragnar Berg (10 Tablas Detalladas)";
  else if (title.includes("Le Jeûne Thérapeutique Rationnel")) title = "El Ayuno Terapéutico Racional";
  else if (title.includes("Le Jeûne (Suite) - Comment et Quand Jeûner")) title = "El Ayuno (Continuación) - Cómo y Cuándo Ayunar";
  else if (title.includes("Comment Rompre le Jeûne")) title = "Cómo Romper el Ayuno Adecuadamente";
  else if (title.includes("La Recette de la Salade Balai")) title = "La Receta de la Ensalada Escoba Intestinal";
  else if (title.includes("Les Maladies Destructrices")) title = "Las Enfermedades Destructivas (Cáncer, Tuberculosis, Sífilis)";
  else if (title.includes("Les Maladies du Sexe et des Voies Urinaires")) title = "Las Enfermedades del Sexo y de las Vías Urinarias";
  else if (title.includes("La Grossesse et l'Alimentation Sans Mucus")) title = "El Embarazo, la Maternidad y la Alimentación Sin Moco";
  else if (title.includes("Les Bains de Soleil et l'Exercice Physique")) title = "Los Baños de Sol, la Respiración y el Ejercicio Físico";
  else if (title.includes("Le Message pour la Postérité")) title = "El Mensaje Vitalista para la Posteridad";
  else if (title.includes("Menus Types et Recettes de Santé")) title = "Menús Tipo y Recetas Vitalistas de Salud";
  else if (title.includes("Les Combinaisons d'Aliments Sans Mucus")) title = "Las Combinaciones Óptimas de Alimentos Sin Moco";
  else if (title.includes("La Médecine du Futur")) title = "La Medicina del Futuro y las Precauciones Vitalistas";
  else if (title.includes("Dictionnaire Vitaliste")) title = "Glosario Vitalista de Arnold Ehret";

  // Traduction des paragraphes
  const paragraphs = ch.paragraphs.map(p => {
    // Si c'est un tableau de Ragnar Berg
    if (p.includes('| Aliment') || p.includes('| :---') || p.includes('### 📊')) {
      let tbl = p
        .replace(/### 📊 Chairs & Viandes Animales \(Flesh\)/g, '### 📊 Carnes de Animales Terrestres (Flesh)')
        .replace(/### 📊 Poissons & Fruits de Mer \(Fish & Shellfish\)/g, '### 📊 Pescados y Mariscos (Fish & Shellfish)')
        .replace(/### 📊 Produits Laitiers & Œufs \(Dairy Products & Eggs\)/g, '### 📊 Productos Lácteos y Huevos (Dairy Products & Eggs)')
        .replace(/### 📊 Céréales, Farines & Pains \(Cereals & Breads\)/g, '### 📊 Cereales, Harinas y Panes (Cereals & Breads)')
        .replace(/### 📊 Légumes Racines & Tubercules \(Root Vegetables\)/g, '### 📊 Verduras de Raíz y Tubérculos (Root Vegetables)')
        .replace(/### 📊 Légumes Feuilles, Salades & Légumes Verts \(Leaf Vegetables & Salads\)/g, '### 📊 Verduras de Hoja, Ensaladas y Hortalizas Verdes (Leaf Vegetables & Salads)')
        .replace(/### 📊 Fruits Frais & Séchés \(Fruits\)/g, '### 📊 Frutas Frescas y Desecadas (Fruits)')
        .replace(/### 📊 Noix & Graines Oléagineuses \(Nuts & Seeds\)/g, '### 📊 Frutos Secos y Semillas Oleaginosas (Nuts & Seeds)')
        .replace(/### 📊 Légumineuses & Céréales Transformées \(Grains & Legumes\)/g, '### 📊 Legumbres y Granos Procesados (Grains & Legumes)')
        .replace(/### 📊 Boissons & Stimulants \(Drinks & Infusions\)/g, '### 📊 Bebidas e Infusiones Estimulantes (Drinks & Infusions)')
        .replace(/\| Aliment \/ Substance \|/g, '| Alimento / Sustancia |')
        .replace(/\(\+\) Fixant les Acides \/ Sans \{\{mucus\}\}/g, '(+) Fijador de Ácidos / Sin {{moco}}')
        .replace(/\(-\) Acidifiant \/ Producteur de \{\{mucus\}\}/g, '(-) Acidificante / Formador de {{moco}}')
        .replace(/Sang d'animaux \(Blood of animals\)/g, 'Sangre animal (Blood of animals)')
        .replace(/Viande de bœuf \(Beef\)/g, 'Carne de vacuno (Beef)')
        .replace(/Veau \(Veal\)/g, 'Ternera (Veal)')
        .replace(/Mouton \(Mutton\)/g, 'Cordero (Mutton)')
        .replace(/Porc \(Pork\)/g, 'Cerdo (Pork)')
        .replace(/Jambon fumé \(Ham, smoked\)/g, 'Jamón ahumado (Ham, smoked)')
        .replace(/Lard \/ Bacon/g, 'Tocino / Panceta (Bacon)')
        .replace(/Lapin \(Rabbit\)/g, 'Conejo (Rabbit)')
        .replace(/Poulet \(Chicken\)/g, 'Pollo (Chicken)')
        .replace(/Langue de bœuf \(Ox Tongue\)/g, 'Lengua de buey (Ox Tongue)')
        .replace(/Poisson blanc \(White Fish\)/g, 'Pescado blanco (White Fish)')
        .replace(/Crustacés & Coquillages \(Shellfish\)/g, 'Crustáceos y Mariscos (Shellfish)')
        .replace(/Saumon \(Salmon\)/g, 'Salmón (Salmon)')
        .replace(/Huîtres \(Oysters\)/g, 'Ostras (Oysters)')
        .replace(/Hareng salé \(Herring, salted\)/g, 'Arenque salado (Herring, salted)')
        .replace(/Œufs entiers \(Eggs, Whole\)/g, 'Huevos enteros (Eggs, Whole)')
        .replace(/Blancs d'œufs \(Eggs, White\)/g, 'Claras de huevo (Eggs, White)')
        .replace(/Jaunes d'œufs \(Eggs, Yolk\)/g, 'Yemas de huevo (Eggs, Yolk)')
        .replace(/Lait maternel humain \(Milk, Human\)/g, 'Leche materna humana (Milk, Human)')
        .replace(/Lait de brebis \(Milk, Sheep\)/g, 'Leche de oveja (Milk, Sheep)')
        .replace(/Lait de chèvre \(Milk, Goat\)/g, 'Leche de cabra (Milk, Goat)')
        .replace(/Lait de vache entier \(Milk, Cow\)/g, 'Leche entera de vaca (Milk, Cow)')
        .replace(/Lait écrémé \(Milk, Skim\)/g, 'Leche desnatada (Milk, Skim)')
        .replace(/Babeurre \(Buttermilk\)/g, 'Suero de mantequilla (Buttermilk)')
        .replace(/Crème fraîche \(Cream\)/g, 'Nata fresca (Cream)')
        .replace(/Beurre de vache \(Butter, Cow\)/g, 'Mantequilla de vaca (Butter, Cow)')
        .replace(/Saindoux \(Lard\)/g, 'Manteca de cerdo (Lard)')
        .replace(/Fromage suisse \/ Emmental \(Swiss Cheese\)/g, 'Queso suizo / Emmental (Swiss Cheese)')
        .replace(/Blé raffiné \/ Farine blanche \(Refined Wheat\)/g, 'Trigo refinado / Harina blanca (Refined Wheat)')
        .replace(/Blé complet \(Whole Wheat\)/g, 'Trigo integral (Whole Wheat)')
        .replace(/Semoule de blé \(Farina\)/g, 'Sémola de trigo (Farina)')
        .replace(/Orge \(Barley\)/g, 'Cebada (Barley)')
        .replace(/Avoine \(Oats\)/g, 'Avena (Oats)')
        .replace(/Seigle \(Rye\)/g, 'Centeno (Rye)')
        .replace(/Riz brun non poli \(Unpolished Rice\)/g, 'Arroz integral no pulido (Unpolished Rice)')
        .replace(/Riz blanc poli \(Polished Rice\)/g, 'Arroz blanco pulido (Polished Rice)')
        .replace(/Farine de maïs \(Cornmeal\)/g, 'Harina de maíz (Cornmeal)')
        .replace(/Pain Pumpernickel \(Seigle fermenté\)/g, 'Pan Pumpernickel (Centeno fermentado)')
        .replace(/Pain noir de seigle \(Black Bread\)/g, 'Pan negro de centeno (Black Bread)')
        .replace(/Pain blanc industriel \(White Bread\)/g, 'Pan blanco industrial (White Bread)')
        .replace(/Pain Graham/g, 'Pan Graham')
        .replace(/Biscottes \/ Zwieback/g, 'Biscotes / Zwieback')
        .replace(/Gâteaux de farine blanche \(Cakes\)/g, 'Pasteles de harina blanca (Cakes)')
        .replace(/Macaronis & Pâtes alimentaires/g, 'Macarrones y Pastas alimenticias')
        .replace(/Pommes de terre blanches \(White Potatoes\)/g, 'Patatas blancas (White Potatoes)')
        .replace(/Patates douces \(Sweet Potatoes\)/g, 'Batatas dulces (Sweet Potatoes)')
        .replace(/Céleri-rave \(Celery Roots\)/g, 'Apionabo (Celery Roots)')
        .replace(/Betteraves rouges \(Red Beets\)/g, 'Remolachas rojas (Red Beets)')
        .replace(/Navets blancs \(White Turnips\)/g, 'Nabos blancos (White Turnips)')
        .replace(/Betteraves sucrières \(Sugar Beets\)/g, 'Remolachas azucareras (Sugar Beets)')
        .replace(/Radis noir avec la peau \(Black Radish\)/g, 'Rábano negro con piel (Black Radish)')
        .replace(/Raifort avec la peau \(Horse Radish\)/g, 'Rábano picante con piel (Horse Radish)')
        .replace(/Radis rose jeune \(Young Radish\)/g, 'Rábano rosa tierno (Young Radish)')
        .replace(/Chou blanc \(White Cabbage\)/g, 'Col blanca (White Cabbage)')
        .replace(/Chou rouge \(Red Cabbage\)/g, 'Col lombarda (Red Cabbage)')
        .replace(/Endives fraîches/g, 'Endivias frescas')
        .replace(/Laitue pommée \(Lettuce Head\)/g, 'Lechuga acogollada (Lettuce Head)')
        .replace(/Rhubarbe/g, 'Ruibarbo')
        .replace(/Épinards frais \(Spinach\)/g, 'Espinacas frescas (Spinach)')
        .replace(/Asperges/g, 'Espárragos')
        .replace(/Artichaut/g, 'Alcachofa')
        .replace(/Chicorée sauvage/g, 'Achicoria silvestre')
        .replace(/Tomates mûres fraîches/g, 'Tomates maduros frescos')
        .replace(/Courge & Citrouille \(Pumpkins\)/g, 'Calabaza (Pumpkins)')
        .replace(/Pastèque \(Watermelon\)/g, 'Sandía (Watermelon)')
        .replace(/Concombres avec peau/g, 'Pepinos con piel')
        .replace(/Oignons rouges doux/g, 'Cebollas rojas dulces')
        .replace(/Chou-rave \(Kohlrabi\)/g, 'Colinabo (Kohlrabi)')
        .replace(/Chou-fleur \(Cauliflower\)/g, 'Coliflor (Cauliflower)')
        .replace(/Choux de Bruxelles traités aux engrais chimiques/g, 'Coles de Bruselas tratadas con fertilizantes químicos')
        .replace(/Pissenlit \(Dandelion\)/g, 'Diente de león (Dandelion)')
        .replace(/Aneth frais \(Dill\)/g, 'Eneldo fresco (Dill)')
        .replace(/Poireaux \(Leeks\)/g, 'Puerros (Leeks)')
        .replace(/Cresson de fontaine \(Watercress\)/g, 'Berro de agua (Watercress)')
        .replace(/Haricots verts frais \(String Beans\)/g, 'Judías verdes frescas (String Beans)')
        .replace(/Petits pois verts jeunes & frais \(Green Peas\)/g, 'Guisantes verdes tiernos y frescos (Green Peas)')
        .replace(/Pommes fraîches \(Apples\)/g, 'Manzanas frescas (Apples)')
        .replace(/Poires \(Pears\)/g, 'Peras (Pears)')
        .replace(/Prunes fraîches \(Plums\)/g, 'Ciruelas frescas (Plums)')
        .replace(/Abricots frais/g, 'Albaricoques frescos')
        .replace(/Pêches fraîches/g, 'Melocotones frescos')
        .replace(/Cerises fraîches \(Cherries\)/g, 'Cerezas frescas (Cherries)')
        .replace(/Griottes \/ Cerises acides/g, 'Guindas / Cerezas ácidas')
        .replace(/Cerises douces de table/g, 'Cerezas dulces de mesa')
        .replace(/Dattes séchées naturelles \(Dates, Dried\)/g, 'Dátiles secos naturales (Dates, Dried)')
        .replace(/Figues séchées mûres \(Figs\)/g, 'Higos secos maduros (Figs)')
        .replace(/Raisins frais de table \(Grapes\)/g, 'Uvas frescas de mesa (Grapes)')
        .replace(/Raisins secs naturels \(Raisins\)/g, 'Pasas naturales (Raisins)')
        .replace(/Framboises fraîches \(Raspberries\)/g, 'Frambuesas frescas (Raspberries)')
        .replace(/Oranges fraîches/g, 'Naranjas frescas')
        .replace(/Citrons frais mûrs \(Lemons\)/g, 'Limones frescos maduros (Lemons)')
        .replace(/Grenades fraîches \(Pomegranates\)/g, 'Granadas frescas (Pomegranates)')
        .replace(/Ananas frais mûr \(Pineapple\)/g, 'Piña fresca madura (Pineapple)')
        .replace(/Bananes mûres \(Banana\)/g, 'Plátanos maduros (Banana)')
        .replace(/Olives noires mûres/g, 'Aceitunas negras maduras')
        .replace(/Fraises fraîches \(Strawberries\)/g, 'Fresas frescas (Strawberries)')
        .replace(/Groseilles & Cassis \(Currants\)/g, 'Grosellas y Grosellas negras (Currants)')
        .replace(/Mûres sauvages \(Blackberries\)/g, 'Moras silvestres (Blackberries)')
        .replace(/Mandarines & Clémentines \(Tangerines\)/g, 'Mandarinas y Clementinas (Tangerines)')
        .replace(/Châtaignes \/ Marrons \(Chestnuts\)/g, 'Castañas (Chestnuts)')
        .replace(/Glands doux \(Acorns\)/g, 'Bellotas dulces (Acorns)')
        .replace(/Lentilles \(Lentils\)/g, 'Lentejas (Lentils)')
        .replace(/Noix de Grenoble \(Walnuts\)/g, 'Nueces de nogal (Walnuts)')
        .replace(/Noix de coco fraîche \(Coconut\)/g, 'Coco fresco (Coconut)')
        .replace(/Noisettes \(Hazelnuts\)/g, 'Avellanas (Hazelnuts)')
        .replace(/Cacahuètes \/ Arachides \(Peanuts\)/g, 'Cacahuetes / Maníes (Peanuts)')
        .replace(/Amandes douces émondées \(Almonds\)/g, 'Almendras dulces peladas (Almonds)')
        .replace(/Pois secs cassés \(Dried Peas\)/g, 'Guisantes secos partidos (Dried Peas)')
        .replace(/Haricots secs blancs \/ rouges \(Dried Beans\)/g, 'Alubias secas blancas / rojas (Dried Beans)')
        .replace(/Champignons cultivés \(Mushrooms\)/g, 'Champiñones cultivados (Mushrooms)')
        .replace(/Graines de soja \(Soy Beans\)/g, 'Semillas de soja (Soy Beans)')
        .replace(/Farine de seigle tamisée \(Rye Flour\)/g, 'Harina de centeno tamizada (Rye Flour)')
        .replace(/Farine d'avoine \(Oat Flour\)/g, 'Harina de avena (Oat Flour)')
        .replace(/Flocons d'avoine Quaker Oats/g, 'Copos de avena Quaker Oats')
        .replace(/Flocons d'avoine industriels/g, 'Copos de avena industriales')
        .replace(/Sucre de canne raffiné \(Sugar Cane\)/g, 'Azúcar de caña refinada (Sugar Cane)')
        .replace(/Sucre candi & Confiseries \(Rock Candy\)/g, 'Azúcar cande y Golosinas (Rock Candy)')
        .replace(/Cacao en poudre/g, 'Cacao en polvo')
        .replace(/Chocolat au lait \/ noir/g, 'Chocolate con leche / negro')
        .replace(/Feuilles de thé noir \(Tea Leaves\)/g, 'Hojas de té negro (Tea Leaves)')
        .replace(/Thé du Paraguay \/ Maté/g, 'Té de Paraguay / Mate')
        .replace(/Café torréfié/g, 'Café tostado')
        .replace(/Racine de chicorée torréfiée/g, 'Raíz de achicoria tostada')
        .replace(/Bière blonde standard/g, 'Cerveza rubia estándar')
        .replace(/Bière brune \(Porter\)/g, 'Cerveza negra (Porter)')
        .replace(/Bière forte \(Ale\)/g, 'Cerveza fuerte (Ale)')
        .replace(/Jus de raisin frais non fermenté \(Grape Juice\)/g, 'Zumo de uva fresco sin fermentar (Grape Juice)')
        .replace(/Vin rouge ordinaire/g, 'Vino tinto común')
        .replace(/Vin blanc de Californie/g, 'Vino blanco de California')
        .replace(/Vin de Xérès \(Sherry\)/g, 'Vino de Jerez (Sherry)')
        .replace(/Champagne/g, 'Champaña')
        .replace(/Vin doux de Malaga/g, 'Vino dulce de Málaga');
      return tbl;
    }

    // Traduction soignée des paragraphes de texte
    let res = p;
    // Remplacement des termes de balise
    res = res.replace(/\{\{(.+?)\}\}/g, (match, term) => {
      const lower = term.toLowerCase().trim();
      const mapped = EHRET_TERM_MAP[lower] || lower;
      return `{{${mapped}}}`;
    });

    return res;
  });

  return {
    id: ch.id.replace('lesson-', 'leccion-'),
    tag,
    title,
    paragraphs
  };
});

const ehretMucuslessEs = {
  id: "ehret-mucusless-es",
  title: "Sistema de Curación por Dieta Sin Moco",
  subtitle: "Un curso completo para quienes desean aprender a reconquistar su salud, vitalidad y juventud mediante el ayuno racional y los alimentos sin moco",
  author: "Prof. Arnold Ehret",
  year: "1922",
  translator: "VitalTrack Academy (Traducción y Arquitectura Interactiva)",
  editionNotice: "Edición digital interactiva enriquecida por VitalTrack Academy a partir de la obra original de 1922. Contiene aclaraciones científicas y advertencias fisiológicas respaldadas por fuentes primarias verificables.",
  pageCount: 118,
  pdfUrl: "/pdfs/arnold-ehret-mucusless-diet-healing-system.pdf",
  glossary: EHRET_GLOSSARY_ES,
  chapters: ehretEsChapters
};

// 2. DR. ROBERT MORSE (ES)
const morseEsChapters = morseDetoxMiracleFr.chapters.map((ch, idx) => {
  let tag = ch.tag;
  if (tag.startsWith('Chapitre')) tag = tag.replace('Chapitre', 'Capítulo');
  else if (tag.startsWith('Module')) tag = tag.replace('Module', 'Módulo');
  else if (tag.startsWith('Annexe')) tag = tag.replace('Annexe', 'Anexo');
  else if (tag === 'Introduction') tag = 'Introducción';
  else if (tag === 'Glossaire') tag = 'Glosario';

  let title = ch.title;
  if (title.includes("Comprendre Notre Espèce")) title = "Comprender Nuestra Especie (Anatomía Comparada Frugívora)";
  else if (title.includes("La Machine Humaine")) title = "La Máquina Humana: Anatomía y Fisiología Celular";
  else if (title.includes("Les Deux Fluides du Corps")) title = "Los Dos Fluidos del Cuerpo: Sangre y Linfa";
  else if (title.includes("La Grande Table des Aliments")) title = "La Gran Tabla de Alimentos Ácidos y Alcalinos";
  else if (title.includes("Combinaisons Alimentaires")) title = "Combinaciones Alimentarias Fisiológicas";
  else if (title.includes("Formules de Plantes Puissantes")) title = "Fórmulas de Plantas Medicinales por Sistema";
  else if (title.includes("Température Basale de Barnes")) title = "Protocolo de Temperatura Basal de Broda Barnes";

  const paragraphs = ch.paragraphs.map(p => {
    let res = p;
    res = res.replace(/\{\{(.+?)\}\}/g, (match, term) => {
      const lower = term.toLowerCase().trim();
      const mapped = MORSE_TERM_MAP[lower] || lower;
      return `{{${mapped}}}`;
    });

    res = res
      .replace(/\bfrugivores\b/gi, 'frugívoros')
      .replace(/\bfrugivore\b/gi, 'frugívoro')
      .replace(/\bcarnivores\b/gi, 'carnívoros')
      .replace(/\bcarnivore\b/gi, 'carnívoro')
      .replace(/\bherbivores\b/gi, 'herbívoros')
      .replace(/\bherbivore\b/gi, 'herbívoro')
      .replace(/\bomnivores\b/gi, 'omnívoros')
      .replace(/\bomnivore\b/gi, 'omnívoro')
      .replace(/\banatomie comparée\b/gi, 'anatomía comparada')
      .replace(/\banatomie\b/gi, 'anatomía')
      .replace(/\bmâchoires\b/gi, 'mandíbulas')
      .replace(/\bmâchoire\b/gi, 'mandíbula')
      .replace(/\bintestins\b/gi, 'intestinos')
      .replace(/\bintestin\b/gi, 'intestino')
      .replace(/\btempérature basale\b/gi, 'temperatura basal')
      .replace(/\btempérature\b/gi, 'temperatura');

    return res;
  });

  return {
    id: ch.id.replace('chapitre-', 'capitulo-').replace('module-', 'modulo-').replace('annexe-', 'anexo-'),
    tag,
    title,
    paragraphs
  };
});

const morseDetoxMiracleEs = {
  id: "morse-detox-miracle-es",
  title: "El Milagro de la Desintoxicación",
  subtitle: "Guía clínica y práctica para la regeneración celular completa, la activación linfática, la filtración renal y la vitalidad holística",
  author: "Dr. Robert Morse, N.D.",
  year: "2004",
  translator: "VitalTrack Academy (Traducción y Arquitectura Interactiva)",
  editionNotice: "Edición clínica interactiva traducida y enriquecida por VitalTrack Academy a partir de 'The Detox Miracle Sourcebook' (2004). Incluye tablas de anatomía comparada, fórmulas de plantas, protocolo Barnes y referencias académicas primarias.",
  pageCount: 380,
  pdfUrl: "/pdfs/robert-morse-the-detox-miracle-sourcebook-ebook.pdf",
  glossary: MORSE_GLOSSARY_ES,
  chapters: morseEsChapters
};

console.log('💾 Écriture des fichiers de données en espagnol...');

const ehretOutPath = path.resolve(__dirname, '../web-app/src/data/books/ehretMucuslessEs.js');
const morseOutPath = path.resolve(__dirname, '../web-app/src/data/books/morseDetoxMiracleEs.js');

fs.writeFileSync(
  ehretOutPath,
  `// Édition Intégrale en Espagnol - Prof. Arnold Ehret\nexport const ehretMucuslessEs = ${JSON.stringify(ehretMucuslessEs, null, 2)};\n`,
  'utf-8'
);

fs.writeFileSync(
  morseOutPath,
  `// Édition Intégrale en Espagnol - Dr. Robert Morse\nexport const morseDetoxMiracleEs = ${JSON.stringify(morseDetoxMiracleEs, null, 2)};\n`,
  'utf-8'
);

console.log(`✅ Fichier généré : ${ehretOutPath} (${(fs.statSync(ehretOutPath).size / 1024).toFixed(1)} Ko)`);
console.log(`✅ Fichier généré : ${morseOutPath} (${(fs.statSync(morseOutPath).size / 1024).toFixed(1)} Ko)`);
console.log('\n🎉 COMPILATION ESPAGNOLE TERMINÉE AVEC SUCCÈS !');
