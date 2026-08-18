import 'package:flutter/material.dart';
import 'package:vital_track/models/diet_plan.dart';
import 'package:vital_track/ui/theme.dart';

class DietPlanProposalCard extends StatefulWidget {
  final DietPlan plan;
  final Future<void> Function(DietPlan)? onAccept;

  const DietPlanProposalCard({super.key, required this.plan, this.onAccept});

  @override
  State<DietPlanProposalCard> createState() => _DietPlanProposalCardState();
}

class _DietPlanProposalCardState extends State<DietPlanProposalCard> {
  bool _accepted = false;
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final plan = widget.plan;
    final preview = plan.days.take(2).toList();

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
                  child: Text(plan.protocol.dietProtocolEmoji,
                      style: const TextStyle(fontSize: 18)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        plan.name,
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.calendar_month_rounded,
                              size: 12, color: colors.accent),
                          const SizedBox(width: 4),
                          Text(
                            '${plan.protocol.dietProtocolLabel} · ${plan.totalDays} jours',
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
          if (plan.objective.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
              child: Text(
                '🎯 ${plan.objective}',
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
              'Aperçu du calendrier',
              style: TextStyle(
                color: colors.textTertiary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ),
          ...preview.map((day) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: colors.surface.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Jour ${day.dayIndex + 1} · ${day.phaseLabel}',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    ...day.meals.take(3).map((m) => Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            '${m.slot} : ${m.items.join(', ')}',
                            style: TextStyle(
                              color: colors.textSecondary,
                              fontSize: 12.5,
                              height: 1.4,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        )),
                  ],
                ),
              ),
            );
          }),
          if (plan.totalDays > preview.length)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Text(
                '+ ${plan.totalDays - preview.length} autres jours, modifiables après activation.',
                style: TextStyle(
                  color: colors.textTertiary,
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: _accepted
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle, color: colors.accent, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Plan activé !',
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
                              await widget.onAccept?.call(widget.plan);
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
                          : const Icon(Icons.calendar_month_rounded, size: 20),
                      label: Text(_loading
                          ? 'Activation...'
                          : 'Activer et remplir mon calendrier'),
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
