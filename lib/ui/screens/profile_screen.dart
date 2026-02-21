import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/profile_provider.dart';
import 'package:vital_track/providers/theme_provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/providers/mascot_provider.dart';
import 'package:vital_track/ui/screens/knowledge_admin_screen.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/services/update_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<MascotProvider>().setContext("profile");
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final pp = context.watch<ProfileProvider>();
    final tp = context.watch<ThemeProvider>();
    final mp = context.watch<ModeProvider>();
    final profile = pp.profile;
    final colors = context.colors;
    final currentMode = mp.currentMode;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 100,
            pinned: true,
            leading: IconButton(
              icon: Icon(Icons.arrow_back_rounded, color: colors.textPrimary),
              onPressed: () => Navigator.pop(context),
            ),
            backgroundColor: Theme.of(context).scaffoldBackgroundColor,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.only(left: 56, bottom: 14),
              title: Text("Réglages",
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 22)),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // ═══════════════════════════════════════════════════════════
                // 1. APPARENCE
                // ═══════════════════════════════════════════════════════════
                _Section(
                  icon: "🎨",
                  title: "Apparence",
                  subtitle: "Thème et couleur",
                  colors: colors,
                ),
                const SizedBox(height: 10),
                _Card(
                  colors: colors,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _MiniLabel("THÈME", colors),
                      const SizedBox(height: 10),
                      _ThemePills(tp: tp, colors: colors),
                      const SizedBox(height: 18),
                      _MiniLabel("COULEUR", colors),
                      const SizedBox(height: 10),
                      _AccentDots(tp: tp, colors: colors),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // ═══════════════════════════════════════════════════════════
                // 2. PROTOCOLE
                // ═══════════════════════════════════════════════════════════
                _Section(
                  icon: "⚡",
                  title: "Mon Protocole",
                  subtitle: "Grille de lecture active",
                  colors: colors,
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 72,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: ModeProvider.availableModes.map((m) {
                      final sel = currentMode.id == m.id;
                      return GestureDetector(
                        onTap: () {
                          mp.setMode(m.id);
                          context.read<MascotProvider>().onModeChanged(m.id);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.only(right: 10),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: sel ? m.resolveBg(colors.isDark) : colors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: sel
                                  ? m.resolveColor(colors.isDark).withValues(alpha: 0.5)
                                  : colors.border,
                              width: sel ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Text(m.icon,
                                  style: const TextStyle(fontSize: 26)),
                              const SizedBox(width: 10),
                              Column(
                                crossAxisAlignment:
                                CrossAxisAlignment.start,
                                mainAxisAlignment:
                                MainAxisAlignment.center,
                                children: [
                                  Text(m.label,
                                      style: TextStyle(
                                          color: sel
                                              ? m.resolveColor(colors.isDark)
                                              : colors.textPrimary,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 14)),
                                  Text(
                                    m.id == "sebi"
                                        ? "Dr. Sebi"
                                        : m.id == "ehret"
                                        ? "Arnold Ehret"
                                        : "Dr. Morse",
                                    style: TextStyle(
                                        color: colors.textTertiary,
                                        fontSize: 12),
                                  ),
                                ],
                              ),
                              if (sel) ...[
                                const SizedBox(width: 8),
                                Icon(Icons.check_circle_rounded,
                                    color: m.resolveColor(colors.isDark), size: 18),
                              ],
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),

                const SizedBox(height: 28),

                // ═══════════════════════════════════════════════════════════
                // 2. PROFIL
                // ═══════════════════════════════════════════════════════════
                _Section(
                  icon: "👤",
                  title: "Mon Profil",
                  subtitle: "Personnalisation",
                  colors: colors,
                ),
                const SizedBox(height: 10),
                _Card(
                  colors: colors,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Name
                      _NameInputRow(
                        initialName: profile.name,
                        onChanged: (v) => pp.updateProfile(name: v),
                        colors: colors,
                      ),
                      Divider(color: colors.borderSubtle, height: 24),

                      // Goals
                      _MiniLabel("Objectifs", colors),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: {
                          "Perte de poids 🏃": "Weight Loss",
                          "Muscle 💪": "Muscle Gain",
                          "Détox 🧹": "Detox / Healing",
                          "Maintien ⚖️": "Maintenance",
                          "Transition 🌱": "Transition",
                        }.entries.map((e) => _Chip(
                          label: e.key,
                          selected: profile.goals.contains(e.value),
                          colors: colors,
                          onTap: () => pp.toggleGoal(e.value),
                        )).toList(),
                      ),
                      const SizedBox(height: 16),

                      // Restrictions
                      _MiniLabel("Restrictions", colors),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: {
                          "Sans gluten 🌾": "Gluten Free",
                          "Sans amidon 🥔": "No Starch",
                          "Non-mucogène 💧": "Mucusless Diet",
                          "Sebi strict 🌿": "Sebi Strict",
                          "Frugivore 🍇": "Fruitarian",
                          "Cru 🥬": "Raw Only",
                        }.entries.map((e) => _Chip(
                          label: e.key,
                          selected:
                          profile.restrictions.contains(e.value),
                          colors: colors,
                          onTap: () => pp.toggleRestriction(e.value),
                        )).toList(),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 28),

                // ═══════════════════════════════════════════════════════════
                // 3. NOTIFICATIONS
                // ═══════════════════════════════════════════════════════════
                _Section(
                  icon: "🔔",
                  title: "Notifications",
                  subtitle: "Coaching & rappels",
                  colors: colors,
                ),
                const SizedBox(height: 10),
                _Card(
                  colors: colors,
                  child: Column(
                    children: [
                      _Toggle(
                        icon: Icons.tips_and_updates_outlined,
                        label: "Conseil du jour",
                        subtitle:
                        "Citation ou tip de Sebi, Ehret ou Morse",
                        value: profile.notifyDailyTip,
                        colors: colors,
                        onChanged: (_) => pp.toggleNotifyDailyTip(),
                      ),
                      Divider(color: colors.borderSubtle, height: 8),
                      _Toggle(
                        icon: Icons.restaurant_outlined,
                        label: "Rappel de repas",
                        subtitle: "Rappel pour enregistrer vos repas",
                        value: profile.notifyMealReminder,
                        colors: colors,
                        onChanged: (_) => pp.toggleNotifyMealReminder(),
                      ),
                      Divider(color: colors.borderSubtle, height: 8),
                      _Toggle(
                        icon: Icons.warning_amber_rounded,
                        label: "Alerte aliment",
                        subtitle:
                        "Prévient si un aliment est hybride ou nocif",
                        value: profile.notifyFoodWarning,
                        colors: colors,
                        onChanged: (_) => pp.toggleNotifyFoodWarning(),
                      ),
                      Divider(color: colors.borderSubtle, height: 8),
                      _Toggle(
                        icon: Icons.water_drop_outlined,
                        label: "Hydratation",
                        subtitle: "Rappel de boire de l'eau de source",
                        value: profile.notifyHydration,
                        colors: colors,
                        onChanged: (_) => pp.toggleNotifyHydration(),
                      ),
                      Divider(color: colors.borderSubtle, height: 20),

                      // Frequency
                      Row(
                        children: [
                          Icon(Icons.schedule_rounded,
                              color: colors.accent, size: 18),
                          const SizedBox(width: 10),
                          Text("Fréquence",
                              style: TextStyle(
                                  color: colors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14)),
                          const Spacer(),
                          _FreqPills(
                            current: profile.notifyFrequency,
                            colors: colors,
                            onChanged: (f) => pp.setNotifyFrequency(f),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 28),

                // ═══════════════════════════════════════════════════════════
                // 5. SOURCES / CONNAISSANCES
                // ═══════════════════════════════════════════════════════════
                _Section(
                  icon: "📚",
                  title: "Base de connaissances",
                  subtitle: "Ressources pour l'assistant & le coaching",
                  colors: colors,
                ),
                const SizedBox(height: 10),
                _Card(
                  colors: colors,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const KnowledgeAdminScreen()),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: colors.accent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.menu_book_rounded,
                              color: colors.accent, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Gérer mes sources",
                                  style: TextStyle(
                                      color: colors.textPrimary,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14)),
                              const SizedBox(height: 2),
                              Text(
                                  "PDF, vidéos YouTube, liens, textes",
                                  style: TextStyle(
                                      color: colors.textTertiary,
                                      fontSize: 12)),
                            ],
                          ),
                        ),
                        Icon(Icons.chevron_right_rounded,
                            color: colors.iconMuted, size: 22),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // ═══════════════════════════════════════════════════════════
                // 6. CLÉ API
                // ═══════════════════════════════════════════════════════════
                _Section(
                  icon: "🤖",
                  title: "Intelligence artificielle",
                  subtitle: "Clé API pour l'assistant",
                  colors: colors,
                ),
                const SizedBox(height: 10),
                _Card(
                  colors: colors,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.vpn_key_rounded,
                              color: colors.accent, size: 18),
                          const SizedBox(width: 10),
                          Text("Google Gemini",
                              style: TextStyle(
                                  color: colors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14)),
                          const Spacer(),
                          SizedBox(
                            width: 150,
                            child: TextField(
                              controller: TextEditingController(
                                  text: pp.geminiApiKey)
                                ..selection =
                                TextSelection.fromPosition(
                                    TextPosition(
                                        offset:
                                        pp.geminiApiKey.length)),
                              style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 12,
                                  fontFamily: 'monospace'),
                              obscureText: true,
                              textAlign: TextAlign.right,
                              decoration: InputDecoration(
                                hintText: "Collez la clé",
                                hintStyle: TextStyle(
                                    color: colors.textTertiary),
                                border: InputBorder.none,
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                              onSubmitted: (v) => pp.updateApiKey(v),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Gratuit sur aistudio.google.com · Requis pour le scan et le chat.",
                        style: TextStyle(
                            color: colors.textTertiary,
                            fontSize: 12,
                            fontStyle: FontStyle.italic),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 28),

                // ═══════════════════════════════════════════════════════════
                // 7. MASCOTTE
                // ═══════════════════════════════════════════════════════════
                _Section(
                  icon: "🐦",
                  title: "Mascotte",
                  subtitle: "Pigeon coach IA",
                  colors: colors,
                ),
                const SizedBox(height: 10),
                Consumer<MascotProvider>(
                  builder: (ctx, mascotProv, _) => _Card(
                    colors: colors,
                    child: Row(
                      children: [
                        Icon(mascotProv.isVisible ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                            color: colors.accent, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Afficher la mascotte",
                                  style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
                              const SizedBox(height: 2),
                              Text(mascotProv.isVisible ? "Active — affiche des conseils" : "Masquée & muette",
                                  style: TextStyle(color: colors.textTertiary, fontSize: 12)),
                            ],
                          ),
                        ),
                        Switch.adaptive(
                          value: mascotProv.isVisible,
                          activeColor: colors.accent,
                          onChanged: (_) => mascotProv.toggleVisibility(),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // ═══════════════════════════════════════════════════════════
                // 8. MISES À JOUR
                // ═══════════════════════════════════════════════════════════
                _Section(
                  icon: "🔄",
                  title: "Mises à jour",
                  subtitle: "Vérifiez les nouvelles versions",
                  colors: colors,
                ),
                const SizedBox(height: 10),
                _Card(
                  colors: colors,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      UpdateService.checkForUpdates(context, forceShow: true);
                    },
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: colors.accent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.system_update_rounded, color: colors.accent, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Vérifier les mises à jour",
                                  style: TextStyle(
                                      color: colors.textPrimary,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14)),
                              const SizedBox(height: 2),
                              Text("Version actuelle : v1.0.1",
                                  style: TextStyle(color: colors.textTertiary, fontSize: 12)),
                            ],
                          ),
                        ),
                        Icon(Icons.chevron_right_rounded, color: colors.textTertiary),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // ═══════════════════════════════════════════════════════════
                // 9. ZONE DE DANGER
                // ═══════════════════════════════════════════════════════════
                _Section(
                  icon: "⚠️",
                  title: "Zone de danger",
                  subtitle: "Actions irréversibles",
                  colors: colors,
                ),
                const SizedBox(height: 10),
                _Card(
                  colors: colors,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => _showResetDialog(context, pp, colors),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.redAccent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.delete_forever_rounded, color: Colors.redAccent, size: 20),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Réinitialiser l'application",
                                  style: TextStyle(
                                      color: Colors.redAccent,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14)),
                              SizedBox(height: 2),
                              Text("Supprime toutes les données",
                                  style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 40),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

void _showResetDialog(BuildContext context, ProfileProvider pp, AppColors colors) {
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: colors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.redAccent),
          const SizedBox(width: 10),
          Text("Tout effacer ?", style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
      content: Text(
        "Êtes-vous sûr de vouloir réinitialiser l'application ? Cette action supprimera tout votre historique de repas, vos données de jeûne, et vos préférences. Cette action est irréversible.",
        style: TextStyle(color: colors.textSecondary, fontSize: 14, height: 1.5),
      ),
      actionsPadding: const EdgeInsets.only(right: 16, bottom: 16),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: Text("Annuler", style: TextStyle(color: colors.textTertiary)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.redAccent,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: () async {
            Navigator.pop(ctx); // Close dialog
            await pp.resetAllData();
            if (context.mounted) {
              // Pop everything to get back to the home/dashboard view with a fresh state
              Navigator.of(context).popUntil((route) => route.isFirst);
            }
          },
          child: const Text("Oui, effacer", style: TextStyle(fontWeight: FontWeight.w600)),
        ),
      ],
    ),
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED WIDGETS
// ═══════════════════════════════════════════════════════════════════════════════

class _Section extends StatelessWidget {
  final String icon, title, subtitle;
  final AppColors colors;
  const _Section(
      {required this.icon,
        required this.title,
        required this.subtitle,
        required this.colors});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Text(icon, style: const TextStyle(fontSize: 18)),
      const SizedBox(width: 8),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: TextStyle(
                  color: colors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 15)),
          Text(subtitle,
              style:
              TextStyle(color: colors.textTertiary, fontSize: 12)),
        ],
      ),
    ],
  );
}

class _Card extends StatelessWidget {
  final AppColors colors;
  final Widget child;
  const _Card({required this.colors, required this.child});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: colors.surface,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: colors.border),
    ),
    child: child,
  );
}

class _MiniLabel extends StatelessWidget {
  final String text;
  final AppColors colors;
  const _MiniLabel(this.text, this.colors);

  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    style: TextStyle(
        color: colors.textTertiary,
        fontSize: 12,
        letterSpacing: 1.2,
        fontWeight: FontWeight.w700),
  );
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final AppColors colors;
  final VoidCallback onTap;
  const _Chip({
    required this.label,
    required this.selected,
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = colors.accent;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: selected
              ? c.withValues(alpha: colors.isDark ? 0.22 : 0.12)
              : colors.surfaceSubtle,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? c.withValues(alpha: colors.isDark ? 0.65 : 0.4) : colors.border,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(label,
            style: TextStyle(
                color: selected ? c : colors.textSecondary,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                fontSize: 12)),
      ),
    );
  }
}

class _Toggle extends StatelessWidget {
  final IconData icon;
  final String label, subtitle;
  final bool value;
  final AppColors colors;
  final ValueChanged<bool> onChanged;

  const _Toggle({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.value,
    required this.colors,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      children: [
        Icon(icon, color: colors.accent, size: 18),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 13)),
              Text(subtitle,
                  style: TextStyle(
                      color: colors.textTertiary, fontSize: 12)),
            ],
          ),
        ),
        Switch.adaptive(
          value: value,
          onChanged: onChanged,
          activeTrackColor: colors.accent,
        ),
      ],
    ),
  );
}

class _FreqPills extends StatelessWidget {
  final String current;
  final AppColors colors;
  final ValueChanged<String> onChanged;
  const _FreqPills(
      {required this.current,
        required this.colors,
        required this.onChanged});

  @override
  Widget build(BuildContext context) {
    const items = [
      ("low", "Discret"),
      ("medium", "Normal"),
      ("high", "Fréquent"),
    ];
    return Row(
      children: items.map((item) {
        final sel = current == item.$1;
        return GestureDetector(
          onTap: () => onChanged(item.$1),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            margin: const EdgeInsets.only(left: 6),
            padding:
            const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: sel
                  ? colors.accent.withValues(alpha: 0.12)
                  : colors.surfaceSubtle,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: sel
                    ? colors.accent.withValues(alpha: 0.4)
                    : colors.border,
              ),
            ),
            child: Text(item.$2,
                style: TextStyle(
                    color: sel ? colors.accent : colors.textSecondary,
                    fontWeight: sel ? FontWeight.w700 : FontWeight.w400,
                    fontSize: 12)),
          ),
        );
      }).toList(),
    );
  }
}

// ── THEME PILLS ──────────────────────────────────────────────────────────────
class _ThemePills extends StatelessWidget {
  final ThemeProvider tp;
  final AppColors colors;
  const _ThemePills({required this.tp, required this.colors});

  @override
  Widget build(BuildContext context) {
    final themes = [
      (AppBaseTheme.light, "☀️", "Clair", const Color(0xFFFFFFFF),
      const Color(0xFF18181B)),
      (AppBaseTheme.sepia, "📜", "Sépia", const Color(0xFFFAF6EF),
      const Color(0xFF2C2416)),
      (AppBaseTheme.dark, "🌙", "Sombre", const Color(0xFF1C1C1E),
      const Color(0xFFE4E4E7)),
      (AppBaseTheme.oled, "⚫", "OLED", const Color(0xFF000000),
      const Color(0xFFF4F4F5)),
    ];

    return Row(
      children: themes.map((t) {
        final sel = tp.baseTheme == t.$1;
        return Expanded(
          child: GestureDetector(
            onTap: () => tp.setBaseTheme(t.$1),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: t.$4,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: sel ? colors.accent : t.$4 == const Color(0xFFFFFFFF) ? const Color(0xFFE4E4E7) : t.$4.withValues(alpha: 0.3),
                  width: sel ? 2 : 1,
                ),
                boxShadow: sel
                    ? [BoxShadow(color: colors.accent.withValues(alpha: 0.25), blurRadius: 8)]
                    : [],
              ),
              child: Column(
                children: [
                  Text(t.$2, style: const TextStyle(fontSize: 16)),
                  const SizedBox(height: 3),
                  Text(t.$3,
                      style: TextStyle(
                          color: t.$5,
                          fontSize: 12,
                          fontWeight:
                          sel ? FontWeight.w700 : FontWeight.w500)),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── ACCENT DOTS ──────────────────────────────────────────────────────────────
class _AccentDots extends StatelessWidget {
  final ThemeProvider tp;
  final AppColors colors;
  const _AccentDots({required this.tp, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: kAccents.entries.map((e) {
        final sel = tp.accentColor == e.key;
        final d = e.value;
        return GestureDetector(
          onTap: () => tp.setAccentColor(e.key),
          child: Column(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: d.resolvePrimary(colors.isDark),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: sel ? colors.textPrimary : Colors.transparent,
                    width: sel ? 3 : 0,
                  ),
                  boxShadow: sel
                      ? [BoxShadow(
                      color: d.primary.withValues(alpha: 0.4),
                      blurRadius: 10)]
                      : [],
                ),
                child: sel
                    ? const Icon(Icons.check, size: 16, color: Colors.white)
                    : null,
              ),
              const SizedBox(height: 4),
              Text(d.emoji, style: const TextStyle(fontSize: 12)),
            ],
          ),
        );
      }).toList(),
    );
  }
}

// ── NAME INPUT ───────────────────────────────────────────────────────────────
class _NameInputRow extends StatefulWidget {
  final String initialName;
  final ValueChanged<String> onChanged;
  final AppColors colors;

  const _NameInputRow({
    required this.initialName,
    required this.onChanged,
    required this.colors,
  });

  @override
  State<_NameInputRow> createState() => _NameInputRowState();
}

class _NameInputRowState extends State<_NameInputRow> {
  late TextEditingController _controller;
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialName);
    _focusNode = FocusNode();
    _focusNode.addListener(() {
      if (mounted) setState(() {});
      if (!_focusNode.hasFocus) {
        if (_controller.text.trim().isNotEmpty) {
          widget.onChanged(_controller.text.trim());
        } else {
          _controller.text = widget.initialName;
        }
      }
    });
  }

  @override
  void didUpdateWidget(_NameInputRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialName != oldWidget.initialName && !_focusNode.hasFocus) {
      _controller.text = widget.initialName;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("Ton prénom",
            style: TextStyle(
                color: widget.colors.textSecondary,
                fontWeight: FontWeight.w600,
                fontSize: 12)),
        const SizedBox(height: 8),
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 48,
          decoration: BoxDecoration(
            color: _focusNode.hasFocus ? widget.colors.surface : widget.colors.surfaceSubtle,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
                color: _focusNode.hasFocus
                    ? widget.colors.accent
                    : widget.colors.borderSubtle,
                width: _focusNode.hasFocus ? 1.5 : 1.0),
            boxShadow: _focusNode.hasFocus
                ? [BoxShadow(color: widget.colors.accent.withValues(alpha: 0.1), blurRadius: 8)]
                : [],
          ),
          child: Row(
            children: [
              const SizedBox(width: 16),
              Icon(Icons.person_rounded, color: widget.colors.iconMuted, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _controller,
                  focusNode: _focusNode,
                  style: TextStyle(
                      color: widget.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 15),
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                    hintText: "Comment t'appelles-tu ?",
                    hintStyle: TextStyle(
                        color: widget.colors.textTertiary,
                        fontWeight: FontWeight.w400),
                  ),
                ),
              ),
              if (_focusNode.hasFocus)
                IconButton(
                  icon: Icon(Icons.check_circle_rounded, color: widget.colors.accent, size: 22),
                  onPressed: () {
                    _focusNode.unfocus();
                  },
                ),
            ],
          ),
        ),
      ],
    );
  }
}