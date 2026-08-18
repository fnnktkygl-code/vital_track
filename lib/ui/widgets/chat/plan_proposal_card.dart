import 'package:flutter/material.dart';
import 'package:vital_track/models/fasting_program.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/ui/theme.dart';

class PlanProposalCard extends StatefulWidget {
  final FastingProgram program;
  final Future<void> Function(FastingProgram)? onAccept;

  const PlanProposalCard({super.key, required this.program, this.onAccept});

  @override
  State<PlanProposalCard> createState() => _PlanProposalCardState();
}

class _PlanProposalCardState extends State<PlanProposalCard> {
  bool _accepted = false;
  bool _loading = false;

  String _protocolLabel(String? p) {
    switch (p) {
      case 'sebi':
        return 'Dr. Sebi';
      case 'ehret':
        return 'Arnold Ehret';
      case 'morse':
        return 'Dr. Morse';
      default:
        return 'Vitaliste Intégré';
    }
  }

  String _formatDuration(int minutes) {
    if (minutes < 60) return '$minutes min';
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return m == 0 ? '${h}h' : '${h}h${m}min';
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final program = widget.program;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            colors.accent.withValues(alpha: 0.12),
            colors.accentSubtle.withValues(alpha: 0.06),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border:
            Border.all(color: colors.accent.withValues(alpha: 0.3), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: colors.accent.withValues(alpha: 0.12),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: colors.accent.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Text('📋', style: TextStyle(fontSize: 18)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        program.name,
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.science_outlined,
                              size: 12, color: colors.accent),
                          const SizedBox(width: 4),
                          Text(
                            _protocolLabel(program.protocol),
                            style: TextStyle(
                                color: colors.accent,
                                fontSize: 12,
                                fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
            child: Text(
              '🎯 ${program.targetObjective}',
              style: TextStyle(
                color: colors.textSecondary,
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
            child: Text(
              'Programme (${program.configs.length} étapes)',
              style: TextStyle(
                color: colors.textTertiary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ),
          ...program.configs.asMap().entries.map((entry) {
            final i = entry.key;
            final config = entry.value;
            final isLast = i == program.configs.length - 1;
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 2, 16, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: colors.accent.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            config.type.emoji,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      ),
                      if (!isLast)
                        Container(
                          width: 1.5,
                          height: 20,
                          color: colors.accent.withValues(alpha: 0.2),
                        ),
                    ],
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(top: 3, bottom: isLast ? 8 : 0),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              config.type.label,
                              style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500),
                            ),
                          ),
                          Text(
                            _formatDuration(config.durationMinutes),
                            style: TextStyle(
                                color: colors.accent,
                                fontSize: 13,
                                fontWeight: FontWeight.w700),
                          ),
                          if (config.breakHours > 0) ...[
                            const SizedBox(width: 4),
                            Text(
                              '+ ${config.breakHours}h pause',
                              style: TextStyle(
                                  color: colors.textTertiary, fontSize: 11),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: _accepted
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle, color: colors.accent, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Programme activé !',
                        style: TextStyle(
                            color: colors.accent,
                            fontWeight: FontWeight.w700,
                            fontSize: 15),
                      ),
                    ],
                  )
                : SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _loading
                          ? null
                          : () async {
                              setState(() => _loading = true);
                              await widget.onAccept?.call(widget.program);
                              if (mounted) {
                                setState(() {
                                  _accepted = true;
                                  _loading = false;
                                });
                              }
                            },
                      icon: _loading
                          ? SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: colors.accentOnPrimary),
                            )
                          : const Icon(Icons.play_arrow_rounded, size: 20),
                      label: Text(_loading
                          ? 'Activation...'
                          : 'Accepter ce programme'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colors.accent,
                        foregroundColor: colors.accentOnPrimary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                        textStyle: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 15),
                        elevation: 0,
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
