import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/providers/mascot_provider.dart';
import 'package:vital_track/services/fasting_coach_knowledge.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/fasting/active_fast_view.dart';
import 'package:vital_track/ui/widgets/fasting/fasting_setup_view.dart';

class FastingScreen extends StatefulWidget {
  const FastingScreen({super.key});

  @override
  State<FastingScreen> createState() => _FastingScreenState();
}

class _FastingScreenState extends State<FastingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<MascotProvider>().setContext("fasting");
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final fp = context.watch<FastingProvider>();
    final colors = context.colors;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(
          'Jeûne',
          style: TextStyle(
            color: colors.textPrimary,
            fontWeight: FontWeight.w800,
          ),
        ),
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        elevation: 0,
        iconTheme: IconThemeData(color: colors.textPrimary),
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: fp.isFasting
            ? ActiveFastView(
                key: const ValueKey('active'),
                fp: fp,
                colors: colors,
                onShowMetricLog: _showMetricLogSheet,
                onCompletion: _showCompletionSheet,
                onShowQA: _showCoachQA,
                onCancel: _showCancelDialog,
              )
            : FastingSetupView(
                key: const ValueKey('setup'),
                colors: colors,
                onShowMetricLog: _showMetricLogSheet,
              ),
      ),
    );
  }

  void _showCancelDialog(
      BuildContext context, FastingProvider fp, AppColors colors) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.sheetBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title:
            Text('Annuler le jeûne ?', style: TextStyle(color: colors.textPrimary)),
        content: Text('Cette session ne sera pas enregistrée.',
            style: TextStyle(color: colors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Retour', style: TextStyle(color: colors.textTertiary)),
          ),
          TextButton(
            onPressed: () {
              fp.cancelFast();
              Navigator.pop(ctx);
            },
            child: Text('Annuler le jeûne',
                style: TextStyle(
                    color: colors.error, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  void _showCompletionSheet(BuildContext context, AppColors colors) {
    final fp = context.read<FastingProvider>();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: colors.sheetBg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🎉', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 12),
              Text('Jeûne terminé !',
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 22,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text('Bravo pour ton engagement. Ton corps te remercie. 🌿',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 14,
                      height: 1.5)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _completionStat(
                      colors, '🔥', '${fp.currentStreak}', 'Série actuelle'),
                  const SizedBox(width: 24),
                  _completionStat(colors, '🏆', '${fp.longestStreak}', 'Record'),
                  const SizedBox(width: 24),
                  _completionStat(colors, '📊', '${fp.history.length}', 'Total'),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colors.accent,
                    foregroundColor: colors.accentOnPrimary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Continuer',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
              SizedBox(height: MediaQuery.of(ctx).padding.bottom + 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _completionStat(
      AppColors colors, String emoji, String value, String label) {
    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 20)),
        const SizedBox(height: 4),
        Text(value,
            style: TextStyle(
                color: colors.textPrimary,
                fontSize: 22,
                fontWeight: FontWeight.w800)),
        Text(label, style: TextStyle(color: colors.textTertiary, fontSize: 11)),
      ],
    );
  }

  void _showMetricLogSheet(
      BuildContext context,
      AppColors colors,
      String title,
      String buttonLabel,
      void Function(double?, int?, String) onConfirm) {
    double? tempWeight;
    int tempEnergy = 3;
    String tempMood = '😊';
    DateTime selectedDate = DateTime.now();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => Container(
          padding: EdgeInsets.fromLTRB(
              28, 28, 28, MediaQuery.of(ctx).viewInsets.bottom + 42),
          decoration: BoxDecoration(
            color: colors.sheetBg,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 24,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Date de la mesure',
                        style: TextStyle(
                            color: colors.textSecondary,
                            fontSize: 14,
                            fontWeight: FontWeight.w500)),
                    InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: ctx,
                          initialDate: selectedDate,
                          firstDate: DateTime(2020),
                          lastDate: DateTime.now(),
                          builder: (context, child) {
                            return Theme(
                              data: Theme.of(context).copyWith(
                                colorScheme: ColorScheme.dark(
                                  primary: colors.accent,
                                  onPrimary: colors.accentOnPrimary,
                                  surface: colors.sheetBg,
                                  onSurface: colors.textPrimary,
                                ),
                              ),
                              child: child!,
                            );
                          },
                        );
                        if (picked != null) {
                          setState(() => selectedDate = picked);
                        }
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: colors.surfaceMuted,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: colors.borderSubtle),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.calendar_today,
                                size: 14, color: colors.accent),
                            const SizedBox(width: 6),
                            Text(
                              "${selectedDate.day.toString().padLeft(2, '0')}/${selectedDate.month.toString().padLeft(2, '0')}/${selectedDate.year}",
                              style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text('Ton poids actuel',
                    style: TextStyle(
                        color: colors.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 12),
                TextField(
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  style: TextStyle(color: colors.textPrimary, fontSize: 18),
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(
                        vertical: 16, horizontal: 16),
                    hintText: 'Poids en kg (optionnel)',
                    hintStyle: TextStyle(
                        color: colors.textTertiary,
                        fontSize: 16,
                        fontWeight: FontWeight.w400),
                    prefixIcon: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Icon(Icons.assignment_ind_outlined,
                          color: colors.accent, size: 28),
                    ),
                    filled: true,
                    fillColor: colors.surfaceMuted.withValues(alpha: 0.5),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: colors.borderSubtle)),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide:
                            BorderSide(color: colors.accent, width: 2)),
                  ),
                  onChanged: (v) => tempWeight = double.tryParse(v),
                ),
                const SizedBox(height: 32),
                Text('Énergie',
                    style: TextStyle(
                        color: colors.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(5, (i) {
                    final val = i + 1;
                    final selected = tempEnergy == val;
                    final labels = [
                      'Épuisé',
                      'Faible',
                      'Moyen',
                      'En forme',
                      'Top !'
                    ];
                    return GestureDetector(
                      onTap: () => setState(() => tempEnergy = val),
                      behavior: HitTestBehavior.opaque,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                              selected
                                  ? Icons.flash_on_rounded
                                  : Icons.flash_off_rounded,
                              color: selected
                                  ? colors.accent
                                  : colors.textTertiary
                                      .withValues(alpha: 0.5),
                              size: 32),
                          const SizedBox(height: 8),
                          Text(labels[i],
                              style: TextStyle(
                                  fontSize: 10,
                                  color: selected
                                      ? colors.textPrimary
                                      : colors.textTertiary,
                                  fontWeight: selected
                                      ? FontWeight.w700
                                      : FontWeight.w500)),
                        ],
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 32),
                Text('Humeur',
                    style: TextStyle(
                        color: colors.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    {'emoji': '😊', 'label': 'Joyeux'},
                    {'emoji': '😴', 'label': 'Fatigué'},
                    {'emoji': '🧠', 'label': 'Focus'},
                    {'emoji': '😵‍💫', 'label': 'Confus'},
                    {'emoji': '🤢', 'label': 'Nausée'},
                  ].map((item) {
                    final e = item['emoji']!;
                    final label = item['label']!;
                    final selected = tempMood == e;
                    return GestureDetector(
                      onTap: () => setState(() => tempMood = e),
                      behavior: HitTestBehavior.opaque,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: selected
                                  ? colors.accent.withValues(alpha: 0.1)
                                  : Colors.transparent,
                              shape: BoxShape.circle,
                              border: Border.all(
                                  color: selected
                                      ? colors.accent
                                      : Colors.transparent,
                                  width: 2),
                            ),
                            child: Text(e,
                                style: TextStyle(
                                    fontSize: 28,
                                    color: selected
                                        ? null
                                        : colors.textTertiary)),
                          ),
                          const SizedBox(height: 8),
                          Text(label,
                              style: TextStyle(
                                  fontSize: 11,
                                  color: selected
                                      ? colors.textPrimary
                                      : colors.textTertiary,
                                  fontWeight: selected
                                      ? FontWeight.w700
                                      : FontWeight.w500)),
                        ],
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  height: 60,
                  child: ElevatedButton(
                    onPressed: () {
                      onConfirm(tempWeight, tempEnergy, tempMood);
                      Navigator.pop(ctx);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colors.accent,
                      foregroundColor: colors.accentOnPrimary,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text(buttonLabel,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 16)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showCoachQA(
      BuildContext context, FastingProvider fp, AppColors colors) {
    final protocol = fp.activeFast?.protocol ?? 'morse';
    final questions = FastingCoachKnowledge.qaForProtocol(protocol);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints:
            BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.7),
        decoration: BoxDecoration(
          color: Theme.of(ctx).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: colors.borderSubtle,
                    borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Text('Demander conseil',
                style: TextStyle(
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(
                'Questions fréquentes — ${protocol == 'morse' ? 'Dr. Morse' : protocol == 'ehret' ? 'Ehret' : 'Dr. Sebi'}',
                style:
                    TextStyle(color: colors.textTertiary, fontSize: 12)),
            const SizedBox(height: 16),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: questions.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final qa = questions[i];
                  return ExpansionTile(
                    leading:
                        Text(qa.emoji, style: const TextStyle(fontSize: 18)),
                    title: Text(qa.question,
                        style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 13,
                            fontWeight: FontWeight.w600)),
                    tilePadding:
                        const EdgeInsets.symmetric(horizontal: 8),
                    childrenPadding:
                        const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    children: [
                      Text(qa.answer,
                          style: TextStyle(
                              color: colors.textSecondary,
                              fontSize: 13,
                              height: 1.5)),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}