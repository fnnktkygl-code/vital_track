import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/diet_plan_provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/ui/screens/diet_plan_calendar_screen.dart';
import 'package:vital_track/ui/theme.dart';

/// A short Q&A wizard that collects the user's goal, preferred protocol
/// (Arnold Ehret / Dr. Sebi / Dr. Morse / a personalized blend), the
/// duration, and any restrictions — then builds an editable calendar
/// preview the user can activate or tweak before committing.
class DietPlanBuilderScreen extends StatefulWidget {
  const DietPlanBuilderScreen({super.key});

  @override
  State<DietPlanBuilderScreen> createState() => _DietPlanBuilderScreenState();
}

class _ObjectiveOption {
  final String emoji;
  final String label;
  const _ObjectiveOption(this.emoji, this.label);
}

class _ProtocolOption {
  final String id;
  final String emoji;
  final String label;
  final String tagline;
  const _ProtocolOption(this.id, this.emoji, this.label, this.tagline);
}

class _DietPlanBuilderScreenState extends State<DietPlanBuilderScreen> {
  int _step = 0;
  static const int _totalSteps = 4;

  String? _objective;
  String? _protocol;
  int _numDays = 7;
  final _restrictionsCtrl = TextEditingController();
  bool _generating = false;

  static const _objectives = [
    _ObjectiveOption('🧹', 'Détox & nettoyage'),
    _ObjectiveOption('⚖️', 'Perte de poids'),
    _ObjectiveOption('⚡', 'Énergie & vitalité'),
    _ObjectiveOption('🌱', 'Transition en douceur'),
  ];

  static const _protocols = [
    _ProtocolOption('ehret', '🌿', 'Arnold Ehret',
        'Transition progressive, sans mucus, fruits en base'),
    _ProtocolOption('sebi', '⚡', 'Dr. Sebi',
        'Guide nutritionnel alcalin strict, zéro hybride'),
    _ProtocolOption('morse', '💧', 'Dr. Morse',
        'Fruits le matin, détox et drainage lymphatique'),
    _ProtocolOption('personalized', '🤝', 'Personnalisé',
        'Un mélange des trois, à ton rythme'),
  ];

  static const _durations = [3, 7, 14, 21];

  @override
  void initState() {
    super.initState();
    // Nudge towards whatever protocol the user is already using elsewhere
    // in the app (Modes screen), as a sensible default.
    final currentModeId = context.read<ModeProvider>().currentMode.id;
    if (['ehret', 'sebi', 'morse'].contains(currentModeId)) {
      _protocol = currentModeId;
    }
  }

  @override
  void dispose() {
    _restrictionsCtrl.dispose();
    super.dispose();
  }

  bool get _canProceed {
    switch (_step) {
      case 0:
        return _objective != null;
      case 1:
        return _protocol != null;
      case 2:
        return true; // duration always has a default
      case 3:
        return true; // restrictions optional
      default:
        return false;
    }
  }

  Future<void> _generate() async {
    setState(() => _generating = true);
    final provider = context.read<DietPlanProvider>();
    final plan = provider.buildPreview(
      protocol: _protocol!,
      numDays: _numDays,
      objective: _objective ?? '',
      restrictions: _restrictionsCtrl.text,
      source: 'wizard',
    );
    if (!mounted) return;
    setState(() => _generating = false);
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => DietPlanCalendarScreen(previewPlan: plan)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        title: const Text('Créer mon plan'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildProgressBar(colors),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Padding(
                  key: ValueKey(_step),
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                  child: _buildStep(colors),
                ),
              ),
            ),
            _buildFooter(colors),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBar(AppColors colors) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 4),
      child: Row(
        children: List.generate(_totalSteps, (i) {
          final active = i <= _step;
          return Expanded(
            child: Container(
              height: 4,
              margin: EdgeInsets.only(right: i == _totalSteps - 1 ? 0 : 6),
              decoration: BoxDecoration(
                color: active ? colors.accent : colors.surfaceSubtle,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStep(AppColors colors) {
    switch (_step) {
      case 0:
        return _buildObjectiveStep(colors);
      case 1:
        return _buildProtocolStep(colors);
      case 2:
        return _buildDurationStep(colors);
      case 3:
        return _buildRestrictionsStep(colors);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildObjectiveStep(AppColors colors) {
    return ListView(
      children: [
        Text('Quel est ton objectif ?',
            style: TextStyle(
                fontSize: 22, fontWeight: FontWeight.w800, color: colors.textPrimary)),
        const SizedBox(height: 8),
        Text('Ça guide le rythme et l\'accent du plan.',
            style: TextStyle(color: colors.textSecondary, fontSize: 14, height: 1.5)),
        const SizedBox(height: 24),
        ..._objectives.map((o) => _OptionCard(
              emoji: o.emoji,
              title: o.label,
              selected: _objective == o.label,
              onTap: () => setState(() => _objective = o.label),
            )),
      ],
    );
  }

  Widget _buildProtocolStep(AppColors colors) {
    return ListView(
      children: [
        Text('Quelle approche t\'inspire ?',
            style: TextStyle(
                fontSize: 22, fontWeight: FontWeight.w800, color: colors.textPrimary)),
        const SizedBox(height: 8),
        Text('Pas sûr ? Choisis Personnalisé, on ajustera plus tard.',
            style: TextStyle(color: colors.textSecondary, fontSize: 14, height: 1.5)),
        const SizedBox(height: 24),
        ..._protocols.map((p) => _OptionCard(
              emoji: p.emoji,
              title: p.label,
              subtitle: p.tagline,
              selected: _protocol == p.id,
              onTap: () => setState(() => _protocol = p.id),
            )),
      ],
    );
  }

  Widget _buildDurationStep(AppColors colors) {
    return ListView(
      children: [
        Text('Sur combien de jours ?',
            style: TextStyle(
                fontSize: 22, fontWeight: FontWeight.w800, color: colors.textPrimary)),
        const SizedBox(height: 8),
        Text('Tu pourras toujours prolonger ou en refaire un après.',
            style: TextStyle(color: colors.textSecondary, fontSize: 14, height: 1.5)),
        const SizedBox(height: 24),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: _durations.map((d) {
            final selected = _numDays == d;
            return GestureDetector(
              onTap: () => setState(() => _numDays = d),
              child: Container(
                width: 78,
                height: 78,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: selected ? colors.accent : colors.surfaceSubtle,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: selected ? colors.accent : colors.border,
                    width: 1.5,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$d',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: selected ? colors.accentOnPrimary : colors.textPrimary,
                      ),
                    ),
                    Text(
                      'jours',
                      style: TextStyle(
                        fontSize: 11,
                        color: selected
                            ? colors.accentOnPrimary.withValues(alpha: 0.85)
                            : colors.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildRestrictionsStep(AppColors colors) {
    return ListView(
      children: [
        Text('Des allergies ou aliments à éviter ?',
            style: TextStyle(
                fontSize: 22, fontWeight: FontWeight.w800, color: colors.textPrimary)),
        const SizedBox(height: 8),
        Text('Facultatif — laisse vide si aucune restriction.',
            style: TextStyle(color: colors.textSecondary, fontSize: 14, height: 1.5)),
        const SizedBox(height: 24),
        Container(
          decoration: BoxDecoration(
            color: colors.surfaceSubtle,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border),
          ),
          child: TextField(
            controller: _restrictionsCtrl,
            maxLines: 3,
            style: TextStyle(color: colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Ex : noix, gluten, nightshades...',
              hintStyle: TextStyle(color: colors.textTertiary),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFooter(AppColors colors) {
    final isLast = _step == _totalSteps - 1;
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: colors.sheetBorder)),
      ),
      child: Row(
        children: [
          if (_step > 0)
            TextButton(
              onPressed: () => setState(() => _step -= 1),
              child: Text('Précédent', style: TextStyle(color: colors.textSecondary)),
            ),
          const Spacer(),
          ElevatedButton.icon(
            onPressed: !_canProceed || _generating
                ? null
                : () {
                    if (isLast) {
                      _generate();
                    } else {
                      setState(() => _step += 1);
                    }
                  },
            icon: _generating
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: colors.accentOnPrimary),
                  )
                : Icon(isLast ? Icons.auto_awesome_rounded : Icons.arrow_forward_rounded,
                    size: 18),
            label: Text(_generating
                ? 'Génération...'
                : (isLast ? 'Générer mon plan' : 'Suivant')),
            style: ElevatedButton.styleFrom(
              backgroundColor: colors.accent,
              foregroundColor: colors.accentOnPrimary,
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }
}

class _OptionCard extends StatelessWidget {
  final String emoji;
  final String title;
  final String? subtitle;
  final bool selected;
  final VoidCallback onTap;

  const _OptionCard({
    required this.emoji,
    required this.title,
    this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? colors.accent.withValues(alpha: 0.12) : colors.surfaceRaised,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? colors.accent.withValues(alpha: 0.5) : colors.border,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: colors.accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(emoji, style: const TextStyle(fontSize: 22)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: colors.textPrimary)),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(subtitle!,
                        style: TextStyle(color: colors.textSecondary, fontSize: 12.5)),
                  ],
                ],
              ),
            ),
            if (selected)
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(color: colors.accent, shape: BoxShape.circle),
                child: Icon(Icons.check, size: 14, color: colors.accentOnPrimary),
              ),
          ],
        ),
      ),
    );
  }
}
