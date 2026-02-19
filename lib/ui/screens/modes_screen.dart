import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/providers/mascot_provider.dart';
import 'package:vital_track/ui/theme.dart';

import 'package:vital_track/ui/screens/profile_screen.dart';
import 'package:vital_track/ui/screens/knowledge_admin_screen.dart';

class ModesScreen extends StatelessWidget {
  const ModesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final modeProvider = Provider.of<ModeProvider>(context);
    final currentMode = modeProvider.currentMode;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── SETTINGS ROW ────────────────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: Icon(Icons.person_outline,
                        color: context.colors.icon),
                    onPressed: () => Navigator.push(context,
                        MaterialPageRoute(builder: (_) => const ProfileScreen())),
                    tooltip: "Profil",
                  ),
                  IconButton(
                    icon: Icon(Icons.library_books_outlined,
                        color: context.colors.icon),
                    onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const KnowledgeAdminScreen())),
                    tooltip: "Knowledge Base",
                  ),
                ],
              ),
              
              Text("Protocole",
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(
                "Choisissez votre grille de lecture. L'app adapte le scoring et les alertes à votre approche.",
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(height: 1.6),
              ),
              const SizedBox(height: 20),

              // ── MODE CARDS ──────────────────────────────────────────────
              ...ModeProvider.availableModes.map((m) {
                final isSelected = currentMode.id == m.id;
                return GestureDetector(
                  onTap: () {
                    modeProvider.setMode(m.id);
                    // Trigger mascot
                    context.read<MascotProvider>().onModeChanged(m.id);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeInOut,
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color:
                      isSelected ? m.bg : Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected
                            ? m.color.withValues(alpha: 0.4)
                            : Theme.of(context).dividerColor.withValues(alpha: 0.06),
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 54,
                          height: 54,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: m.color.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                                color: m.color.withValues(alpha: 0.3)),
                          ),
                          child: Text(m.icon,
                              style: const TextStyle(fontSize: 28)),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(m.label,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16)),
                              const SizedBox(height: 4),
                              Text(m.desc,
                                  style:
                                  Theme.of(context).textTheme.bodySmall),
                              const SizedBox(height: 8),
                              // Source badge
                              _SourceBadge(modeId: m.id),
                            ],
                          ),
                        ),
                        if (isSelected)
                          Container(
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(
                              color: m.color,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.check,
                                size: 12, color: Colors.black),
                          ),
                      ],
                    ),
                  ),
                );
              }),

              const SizedBox(height: 28),

              // ── TROPHOLOGIE ─────────────────────────────────────────────
              Text("TROPHOLOGIE · COMBINAISONS",
                  style: Theme.of(context).textTheme.labelSmall),
              const SizedBox(height: 10),
              const _ComboItem(
                icon: "⚠️",
                title: "Amidon + Fruit acide",
                subtitle: "Fermentation intestinale",
                highRisk: true,
              ),
              const SizedBox(height: 8),
              const _ComboItem(
                icon: "⚠️",
                title: "Protéine + Amidon",
                subtitle: "Putréfaction & acidose",
                highRisk: true,
              ),
              const SizedBox(height: 8),
              const _ComboItem(
                icon: "⚠️",
                title: "Melon seul",
                subtitle: "Ne jamais combiner",
                highRisk: true,
              ),
              const SizedBox(height: 8),
              const _ComboItem(
                icon: "✅",
                title: "Fruit doux + Légume vert",
                subtitle: "Combinaison harmonieuse",
                highRisk: false,
              ),
              const SizedBox(height: 8),
              const _ComboItem(
                icon: "✅",
                title: "Avocat + Citron + Légume",
                subtitle: "Trio électrique idéal",
                highRisk: false,
              ),

              const SizedBox(height: 28),

              // ── QUICK REFERENCE ─────────────────────────────────────────
              Text("RÉFÉRENCE RAPIDE",
                  style: Theme.of(context).textTheme.labelSmall),
              const SizedBox(height: 10),
              const _QuickRefCard(
                title: "Dr. Sebi",
                icon: "⚡",
                color: Color(0xFFa78bfa),
                points: [
                  "Seuls les aliments du guide Sebi sont autorisés",
                  "Zéro hybride : brocoli, carotte, maïs interdit",
                  "Fruits avec pépins uniquement",
                  "Grains : Amarante, Fonio, Kamut, Quinoa, Épeautre, Teff",
                  "Eau de source · 1 gallon/jour",
                ],
              ),
              const SizedBox(height: 10),
              const _QuickRefCard(
                title: "Arnold Ehret",
                icon: "🌿",
                color: Color(0xFF4ade80),
                points: [
                  "Régime sans mucus = guérison de toutes maladies",
                  "Fruits crus = aliments les plus proches du soleil",
                  "Céréales tolérées en transition uniquement",
                  "L'amidon est une colle digestive",
                  "Jeûne rationnel = progressif, jamais brutal",
                ],
              ),
              const SizedBox(height: 10),
              const _QuickRefCard(
                title: "Dr. Morse",
                icon: "💧",
                color: Color(0xFF38bdf8),
                points: [
                  "La lymphe est l'océan intérieur du corps",
                  "Reins inactifs = accumulation d'acides",
                  "Melons, baies, raisins = meilleurs drainants lymphatiques",
                  "Les crises de guérison = toxines qui sortent",
                  "Herbes astringentes activent le mouvement lymphatique",
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SourceBadge extends StatelessWidget {
  final String modeId;
  const _SourceBadge({required this.modeId});

  @override
  Widget build(BuildContext context) {
    final labels = {
      "sebi": "Alfonso Austin Bowman · Dr. Sebi",
      "ehret": "Arnold Ehret · 1866–1922",
      "morse": "Dr. Robert Morse · N.D.",
    };
    final colors = {
      "sebi": const Color(0xFFa78bfa),
      "ehret": Theme.of(context).colorScheme.primary,
      "morse": const Color(0xFF38bdf8),
    };
    final label = labels[modeId] ?? "";
    final color = colors[modeId] ?? Theme.of(context).iconTheme.color ?? Theme.of(context).colorScheme.onSurface;
    return Text(
      label,
      style: TextStyle(
        fontFamily: 'SpaceMono',
        fontSize: 9,
        color: color.withValues(alpha: 0.7),
        letterSpacing: 0.5,
      ),
    );
  }
}

class _ComboItem extends StatelessWidget {
  final String icon;
  final String title;
  final String subtitle;
  final bool highRisk;
  const _ComboItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.highRisk,
  });

  @override
  Widget build(BuildContext context) {
    final color = highRisk ? Theme.of(context).colorScheme.error : Theme.of(context).colorScheme.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 13)),
                Text(subtitle,
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickRefCard extends StatelessWidget {
  final String title;
  final String icon;
  final Color color;
  final List<String> points;
  const _QuickRefCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.points,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(icon, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Text(title,
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: color)),
            ],
          ),
          const SizedBox(height: 10),
          ...points.map((p) => Padding(
            padding: const EdgeInsets.only(bottom: 5),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("·  ",
                    style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.bold,
                        fontSize: 13)),
                Expanded(
                  child: Text(p,
                      style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).colorScheme.onSurface,
                          height: 1.4)),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
}