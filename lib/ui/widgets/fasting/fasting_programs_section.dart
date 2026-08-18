import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/fasting_program.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/ui/theme.dart';

class FastingProgramsSection extends StatelessWidget {
  final AppColors colors;
  final Function(FastingType type, int durationMinutes, String protocol, String? programId)? onStartSession;

  const FastingProgramsSection({
    super.key,
    required this.colors,
    this.onStartSession,
  });

  static List<FastingProgram> _templatesForMode(String modeId) {
    switch (modeId) {
      case 'morse':
        return [
          FastingProgram(
            id: 'morse_grape_3',
            name: '🍇 Cure de Raisin',
            targetObjective: 'Nettoyage lymphatique par le raisin noir. Idéal pour activer la filtration.',
            startDate: DateTime.now(),
            configs: List.generate(3, (_) => const FastingSessionConfig(
              type: FastingType.grapeCure,
              durationMinutes: 24 * 60,
              breakHours: 8,
            )),
          ),
          FastingProgram(
            id: 'morse_lymph_5',
            name: '💧 Détox Lymphatique',
            targetObjective: 'Activer la filtration rénale et drainer les toxines tissulaires.',
            startDate: DateTime.now(),
            configs: List.generate(5, (_) => const FastingSessionConfig(
              type: FastingType.fruitFast,
              durationMinutes: 20 * 60,
              breakHours: 4,
            )),
          ),
        ];
      case 'ehret':
        return [
          FastingProgram(
            id: 'ehret_transition_7',
            name: '🌿 Transition Ehret',
            targetObjective: 'Alternance douce pour réduire l\'obstruction. (V = P - O)',
            startDate: DateTime.now(),
            configs: List.generate(7, (i) => FastingSessionConfig(
              type: i.isEven ? FastingType.intermittent : FastingType.fruitFast,
              durationMinutes: i.isEven ? 16 * 60 : 20 * 60,
              breakHours: 8,
            )),
          ),
          FastingProgram(
            id: 'ehret_rational_3',
            name: '🔑 Jeûne Rationnel',
            targetObjective: 'Progression calibrée 16h → 20h → 24h. Laisse la Nature opérer.',
            startDate: DateTime.now(),
            configs: const [
              FastingSessionConfig(type: FastingType.waterFast, durationMinutes: 16 * 60, breakHours: 8),
              FastingSessionConfig(type: FastingType.waterFast, durationMinutes: 20 * 60, breakHours: 8),
              FastingSessionConfig(type: FastingType.waterFast, durationMinutes: 24 * 60, breakHours: 0),
            ],
          ),
        ];
      case 'sebi':
      default:
        return [
          FastingProgram(
            id: 'sebi_alkaline_3',
            name: '⚡ Nettoyage Alcalin',
            targetObjective: 'Jus alcalins pour dissoudre le mucus et nettoyer les membranes.',
            startDate: DateTime.now(),
            configs: List.generate(3, (_) => const FastingSessionConfig(
              type: FastingType.juiceFast,
              durationMinutes: 24 * 60,
              breakHours: 6,
            )),
          ),
          FastingProgram(
            id: 'sebi_mineral_5',
            name: '🧬 Cure Minérale',
            targetObjective: 'Fruits électriques (gorgés de soleil) pour nourrir la paroi cellulaire.',
            startDate: DateTime.now(),
            configs: List.generate(5, (_) => const FastingSessionConfig(
              type: FastingType.fruitFast,
              durationMinutes: 20 * 60,
              breakHours: 4,
            )),
          ),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final fp = context.watch<FastingProvider>();
    final active = fp.activeProgram;
    final modeId = context.watch<ModeProvider>().currentMode.id;
    final modeLabel = modeId == 'morse' ? 'Dr. Morse' : modeId == 'ehret' ? 'Ehret' : 'Dr. Sebi';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Programmes $modeLabel',
              style: TextStyle(
                color: colors.textPrimary,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            if (active != null)
              TextButton(
                onPressed: () => fp.endActiveProgram(),
                child: Text('Réinitialiser',
                    style: TextStyle(
                        color: colors.error,
                        fontSize: 13,
                        fontWeight: FontWeight.w600)),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (active != null)
          ActiveProgramCard(
            program: active,
            colors: colors,
            onStartSession: () {
              if (onStartSession == null) return;
              final config = active.currentConfig;
              if (config != null) {
                onStartSession!(config.type, config.durationMinutes, modeId, active.id);
              }
            },
          )
        else
          Column(
            children: _templatesForMode(modeId)
                .map((t) => ProgramTemplateCard(
                      template: t,
                      colors: colors,
                      onStart: () {
                        fp.startProgram(t);
                      },
                    ))
                .toList(),
          ),
      ],
    );
  }
}

class ActiveProgramCard extends StatelessWidget {
  final FastingProgram program;
  final AppColors colors;
  final VoidCallback onStartSession;
  const ActiveProgramCard({
    super.key,
    required this.program,
    required this.colors,
    required this.onStartSession,
  });

  @override
  Widget build(BuildContext context) {
    final config = program.currentConfig;
    if (config == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                program.name,
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            program.targetObjective,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: colors.textSecondary,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: colors.accent.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.accent.withValues(alpha: 0.15)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Prochaine séance',
                        style: TextStyle(
                            color: colors.textTertiary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    Text(
                        'Étape ${program.currentConfigIndex + 1}/${program.configs.length}',
                        style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 12,
                            fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Text(config.type.emoji, style: const TextStyle(fontSize: 32)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(config.type.label,
                              style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700)),
                          Text(
                              'Objectif: ${(config.durationMinutes / 60).round()} heures',
                              style: TextStyle(
                                  color: colors.accent,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: onStartSession,
              style: ElevatedButton.styleFrom(
                backgroundColor: colors.accent,
                foregroundColor: colors.accentOnPrimary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                elevation: 4,
                shadowColor: colors.accent.withValues(alpha: 0.4),
              ),
              child: const Text('Démarrer la séance',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}

class ProgramTemplateCard extends StatelessWidget {
  final FastingProgram template;
  final AppColors colors;
  final VoidCallback onStart;

  const ProgramTemplateCard({
    super.key,
    required this.template,
    required this.colors,
    required this.onStart,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onStart,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: colors.borderSubtle),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colors.accent.withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                  ),
                  child: Text(template.configs.first.type.emoji,
                      style: const TextStyle(fontSize: 24)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(template.name,
                          style: TextStyle(
                              color: colors.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.w800)),
                      const SizedBox(height: 4),
                      Text(
                          '${template.configs.length} sessions • ${template.configs.first.type.label}',
                          style: TextStyle(
                              color: colors.textSecondary,
                              fontSize: 13,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(template.targetObjective,
                style: TextStyle(
                    color: colors.textSecondary, fontSize: 14, height: 1.4)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onStart,
                style: OutlinedButton.styleFrom(
                  foregroundColor: colors.accent,
                  side: BorderSide(color: colors.borderSubtle),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Sélectionner',
                    style:
                        TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
