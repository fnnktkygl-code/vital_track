import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/ui/theme.dart';

class FastingStreakBadge extends StatelessWidget {
  final AppColors colors;
  const FastingStreakBadge({super.key, required this.colors});

  @override
  Widget build(BuildContext context) {
    final fp = context.watch<FastingProvider>();
    if (fp.currentStreak == 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: colors.accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🔥', style: TextStyle(fontSize: 14)),
          const SizedBox(width: 4),
          Text(
            '${fp.currentStreak} jours',
            style: TextStyle(
              color: colors.accent,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class FastingHistoryTile extends StatelessWidget {
  final FastingSession session;
  final AppColors colors;
  const FastingHistoryTile({super.key, required this.session, required this.colors});

  @override
  Widget build(BuildContext context) {
    final dur = session.elapsed;
    final h = dur.inHours;
    final m = dur.inMinutes.remainder(60);
    final date = session.startTime;
    final dateStr =
        '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.borderSubtle),
      ),
      child: Row(
        children: [
          Text(session.type.emoji, style: const TextStyle(fontSize: 22)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  session.type.label,
                  style: TextStyle(
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '$dateStr • ${h}h${m > 0 ? ' ${m}min' : ''}',
                  style: TextStyle(color: colors.textTertiary, fontSize: 12),
                ),
              ],
            ),
          ),
          if (session.moodEmoji.isNotEmpty)
            Text(session.moodEmoji, style: const TextStyle(fontSize: 18)),
        ],
      ),
    );
  }
}

class FastingSymptomLogSection extends StatelessWidget {
  final FastingProvider fp;
  final AppColors colors;
  const FastingSymptomLogSection({super.key, required this.fp, required this.colors});

  @override
  Widget build(BuildContext context) {
    final symptoms = fp.reportedSymptoms;
    if (symptoms.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceSubtle,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('📋', style: TextStyle(fontSize: 14)),
              const SizedBox(width: 6),
              Text(
                'Symptômes rapportés',
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Text('${symptoms.length}',
                  style: TextStyle(color: colors.textTertiary, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: symptoms
                .map((s) => Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: colors.surface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: colors.borderSubtle),
                      ),
                      child: Text(
                        s,
                        style: TextStyle(
                          color: colors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }
}
