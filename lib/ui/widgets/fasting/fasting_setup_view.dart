import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/ui/screens/fasting_analytics_view.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/fasting/fasting_history_tile.dart';
import 'package:vital_track/ui/widgets/fasting/fasting_programs_section.dart';

class FastingSetupView extends StatefulWidget {
  final AppColors colors;
  final Function(BuildContext, AppColors, String, String,
      void Function(double?, int?, String)) onShowMetricLog;

  const FastingSetupView({
    super.key,
    required this.colors,
    required this.onShowMetricLog,
  });

  @override
  State<FastingSetupView> createState() => _FastingSetupViewState();
}

class _FastingSetupViewState extends State<FastingSetupView> {
  String _getMotivationalQuote(String modeId) {
    final day = DateTime.now().day;
    if (modeId == 'morse') {
      const quotes = [
        'Le jeûne active la filtration rénale et le drainage lymphatique. — Dr. Morse',
        'Bounce sur un rebounder chaque jour. C\'est le meilleur exercice lymphatique. — Morse',
        'Les fruits sont vos nettoyeurs, les légumes vos bâtisseurs. — Dr. Morse',
        'Sans surrénales fortes, pas de filtration. Sans filtration, pas de guérison. — Morse',
        'Donnez-vous le temps de guérir. Rome ne s\'est pas construite en un jour. — Morse',
      ];
      return quotes[day % quotes.length];
    } else if (modeId == 'ehret') {
      const quotes = [
        'Le jeûne est la clé de la cuisine de Dieu. — Arnold Ehret',
        'V = P − O. Moins d\'obstruction = plus de vitalité. — Ehret',
        'Le jeûne rationnel : commencer doucement, augmenter progressivement. — Ehret',
        'L\'homme sain ne se fatigue pas — il est mouvement perpétuel. — Ehret',
        'La Nature guérit, pas le médecin. Le médecin ne fait qu\'assister la Nature. — Ehret',
      ];
      return quotes[day % quotes.length];
    } else {
      const quotes = [
        'Quand tu arrêtes de mettre des ordures dedans, le corps peut enfin les sortir. — Dr. Sebi',
        'Il n\'y a qu\'une seule maladie : la compromission de la muqueuse. — Dr. Sebi',
        'Le corps est fait de minéraux. Nourris-le de minéraux et il se guérit. — Dr. Sebi',
        'L\'eau est le premier médicament. Mais elle doit être VIVANTE. — Dr. Sebi',
        'Le fer est l\'étincelle de la vie. Sans lui, le corps ne peut fonctionner. — Dr. Sebi',
      ];
      return quotes[day % quotes.length];
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: colors.accent.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: colors.accent.withValues(alpha: 0.15)),
          ),
          child: Row(
            children: [
              Text('🌿', style: TextStyle(fontSize: 20, color: colors.accent)),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _getMotivationalQuote(
                      context.read<ModeProvider>().currentMode.id),
                  style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 13,
                      fontStyle: FontStyle.italic,
                      height: 1.4),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        FastingProgramsSection(
          colors: colors,
          onStartSession: (type, duration, protocol, programId) {
            widget.onShowMetricLog(
              context,
              colors,
              'Avant le jeûne',
              'Commencer',
              (weight, energy, mood) {
                context.read<FastingProvider>().startFast(
                  type: type,
                  plannedMinutes: duration,
                  protocol: protocol,
                  programId: programId,
                ).then((_) {
                  if (context.mounted) {
                    context.read<FastingProvider>().updatePreMetrics(
                          weight: weight,
                          energy: energy,
                          mood: mood,
                        );
                  }
                });
              },
            );
          },
        ),
        const SizedBox(height: 36),
        Row(
          children: [
            Text(
              'Historique',
              style: TextStyle(
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const Spacer(),
            TextButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const FastingAnalyticsView()),
                );
              },
              icon: Icon(Icons.analytics_outlined,
                  color: colors.accent, size: 18),
              label: Text(
                context.read<FastingProvider>().history.isEmpty
                    ? 'Aperçu Analyses'
                    : 'Analyses',
                style: TextStyle(
                  color: colors.accent,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
            if (context.read<FastingProvider>().history.isNotEmpty) ...[
              const SizedBox(width: 8),
              FastingStreakBadge(colors: colors),
            ]
          ],
        ),
        const SizedBox(height: 12),
        if (context.read<FastingProvider>().history.isNotEmpty) ...[
          ...context.read<FastingProvider>().history.take(10).map(
                (s) => FastingHistoryTile(session: s, colors: colors),
              ),
        ] else ...[
          Container(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: BoxDecoration(
              color: colors.surfaceSubtle,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                'Aucun jeûne enregistré. Clique sur Aperçu Analyses pour voir le potentiel !',
                textAlign: TextAlign.center,
                style: TextStyle(color: colors.textTertiary, fontSize: 13),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
