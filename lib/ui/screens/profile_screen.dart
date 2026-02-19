import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/profile_provider.dart';
import 'package:vital_track/providers/theme_provider.dart';
import 'package:vital_track/ui/theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final profileProvider = context.watch<ProfileProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final profile = profileProvider.profile;
    final colors = context.colors;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text("Préférences"),
        backgroundColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: [

          // ── BASE THEME ─────────────────────────────────────────────────────
          _SectionLabel(label: "APPARENCE", colors: colors),
          const SizedBox(height: 12),
          _BaseThemeSelector(themeProvider: themeProvider, colors: colors),
          const SizedBox(height: 28),

          // ── ACCENT COLOR ──────────────────────────────────────────────────
          _SectionLabel(label: "COULEUR D'ACCENT", colors: colors),
          const SizedBox(height: 12),
          _AccentSelector(themeProvider: themeProvider, colors: colors),
          const SizedBox(height: 28),

          // ── NAME ──────────────────────────────────────────────────────────
          _SectionLabel(label: "PROFIL", colors: colors),
          const SizedBox(height: 12),
          TextField(
            controller: TextEditingController(text: profile.name)
              ..selection = TextSelection.fromPosition(
                  TextPosition(offset: profile.name.length)),
            style: TextStyle(color: colors.textPrimary),
            decoration: const InputDecoration(
              hintText: "Votre prénom",
            ),
            onSubmitted: (val) => profileProvider.updateProfile(name: val),
          ),
          const SizedBox(height: 24),

          // ── GOALS ─────────────────────────────────────────────────────────
          _SectionLabel(label: "OBJECTIFS", colors: colors),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              "Weight Loss",
              "Muscle Gain",
              "Detox / Healing",
              "Maintenance",
              "Transition",
            ].map((goal) {
              final isSelected = profile.goals.contains(goal);
              return _Chip(
                label: goal,
                isSelected: isSelected,
                colors: colors,
                onTap: () => profileProvider.toggleGoal(goal),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),

          // ── RESTRICTIONS ──────────────────────────────────────────────────
          _SectionLabel(label: "RESTRICTIONS", colors: colors),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              "Gluten Free",
              "No Starch",
              "Mucusless Diet",
              "Sebi Strict",
              "Fruitarian",
              "Raw Only",
            ].map((r) {
              final isSelected = profile.restrictions.contains(r);
              return _Chip(
                label: r,
                isSelected: isSelected,
                colors: colors,
                onTap: () => profileProvider.toggleRestriction(r),
                useSecondary: true,
               );
             }).toList(),
           ),
           const SizedBox(height: 24),
 
           // ── API KEY ───────────────────────────────────────────────────────
           _SectionLabel(label: "CONFIGURATION AI (GOOGLE GEMINI)", colors: colors),
           const SizedBox(height: 12),
           TextField(
             controller: TextEditingController(text: profileProvider.geminiApiKey)
               ..selection = TextSelection.fromPosition(
                   TextPosition(offset: profileProvider.geminiApiKey.length)),
             style: TextStyle(color: colors.textPrimary, fontSize: 13, fontFamily: 'monospace'),
             obscureText: true,
             decoration: InputDecoration(
               hintText: "Collez votre clé API ici",
               helperText: "Nécessaire pour le scan et le chat mascot.",
               helperStyle: TextStyle(color: colors.textTertiary, fontSize: 11),
               suffixIcon: Icon(Icons.vpn_key, color: colors.iconMuted, size: 18),
             ),
             onSubmitted: (val) => profileProvider.updateApiKey(val),
           ),
           const SizedBox(height: 12),
           Text(
             "Vous pouvez obtenir une clé gratuite sur aistudio.google.com",
             style: TextStyle(color: colors.textTertiary, fontSize: 10, fontStyle: FontStyle.italic),
           ),
         ],
       ),
     );
  }
}

// ── SECTION LABEL ─────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String label;
  final AppColors colors;
  const _SectionLabel({required this.label, required this.colors});

  @override
  Widget build(BuildContext context) => Text(
    label,
    style: Theme.of(context).textTheme.labelSmall?.copyWith(
      color: colors.textTertiary,
      letterSpacing: 1.2,
    ),
  );
}

// ── BASE THEME GRID ──────────────────────────────────────────────────────────

class _BaseThemeSelector extends StatelessWidget {
  final ThemeProvider themeProvider;
  final AppColors colors;
  const _BaseThemeSelector({required this.themeProvider, required this.colors});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.4,
      children: AppBaseTheme.values.map((base) {
        final isSelected = themeProvider.baseTheme == base;
        final meta = _themeMetadata(base);
        return GestureDetector(
          onTap: () => themeProvider.setBaseTheme(base),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
            decoration: BoxDecoration(
              color: meta.bgColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected
                    ? colors.accent
                    : meta.borderColor,
                width: isSelected ? 2 : 1,
              ),
              boxShadow: isSelected
                  ? [BoxShadow(
                color: colors.accent.withValues(alpha: 0.25),
                blurRadius: 10,
                offset: const Offset(0, 3),
              )]
                  : [],
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
              child: Row(
                children: [
                  Text(meta.emoji, style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          meta.label,
                          style: TextStyle(
                            color: meta.textColor,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          meta.subtitle,
                          style: TextStyle(
                            color: meta.textColor.withValues(alpha: 0.6),
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isSelected)
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: colors.accent,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.check, size: 11, color: colors.accentOnPrimary),
                    ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  _ThemeMeta _themeMetadata(AppBaseTheme base) {
    switch (base) {
      case AppBaseTheme.light:
        return const _ThemeMeta(
          label: 'Light',
          subtitle: 'Blanc & clair',
          emoji: '☀️',
          bgColor: Color(0xFFFFFFFF),
          borderColor: Color(0xFFE4E4E7),
          textColor: Color(0xFF18181B),
        );
      case AppBaseTheme.sepia:
        return const _ThemeMeta(
          label: 'Sepia',
          subtitle: 'Chaud & doux',
          emoji: '📜',
          bgColor: Color(0xFFFAF6EF),
          borderColor: Color(0xFFDDD3C0),
          textColor: Color(0xFF2C2416),
        );
      case AppBaseTheme.dark:
        return const _ThemeMeta(
          label: 'Dark',
          subtitle: 'Sombre & élégant',
          emoji: '🌙',
          bgColor: Color(0xFF1C1C1E),
          borderColor: Color(0xFF3A3A3C),
          textColor: Color(0xFFE4E4E7),
        );
      case AppBaseTheme.oled:
        return const _ThemeMeta(
          label: 'OLED',
          subtitle: 'Noir absolu',
          emoji: '⚫',
          bgColor: Color(0xFF000000),
          borderColor: Color(0xFF2A2A2A),
          textColor: Color(0xFFF4F4F5),
        );
    }
  }
}

class _ThemeMeta {
  final String label;
  final String subtitle;
  final String emoji;
  final Color bgColor;
  final Color borderColor;
  final Color textColor;
  const _ThemeMeta({
    required this.label,
    required this.subtitle,
    required this.emoji,
    required this.bgColor,
    required this.borderColor,
    required this.textColor,
  });
}

// ── ACCENT COLOR ROW ─────────────────────────────────────────────────────────

class _AccentSelector extends StatelessWidget {
  final ThemeProvider themeProvider;
  final AppColors colors;
  const _AccentSelector({required this.themeProvider, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        children: kAccents.entries.map((entry) {
          final accent = entry.key;
          final data = entry.value;
          final isSelected = themeProvider.accentColor == accent;
          return GestureDetector(
            onTap: () => themeProvider.setAccentColor(accent),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isSelected
                    ? Color.alphaBlend(data.primaryMuted, colors.surface)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected
                      ? data.primary.withValues(alpha: 0.35)
                      : Colors.transparent,
                ),
              ),
              child: Row(
                children: [
                  // Color swatch
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: data.primary,
                      shape: BoxShape.circle,
                      boxShadow: isSelected
                          ? [BoxShadow(
                        color: data.primary.withValues(alpha: 0.4),
                        blurRadius: 8,
                      )]
                          : [],
                    ),
                  ),
                  const SizedBox(width: 14),
                  // Labels
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              '${data.emoji}  ${data.label}',
                              style: TextStyle(
                                color: isSelected ? data.primary : colors.textPrimary,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        // Companion color preview strip
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            _ColorDot(color: data.primary, size: 10),
                            const SizedBox(width: 4),
                            _ColorDot(color: data.secondary, size: 10),
                            const SizedBox(width: 6),
                            Text(
                              '#${data.primary.value.toRadixString(16).substring(2).toUpperCase()}',
                              style: TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 9,
                                color: colors.textTertiary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (isSelected)
                    Icon(Icons.check_circle_rounded,
                        color: data.primary, size: 20),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _ColorDot extends StatelessWidget {
  final Color color;
  final double size;
  const _ColorDot({required this.color, required this.size});

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
  );
}

// ── ADAPTIVE CHIP ─────────────────────────────────────────────────────────────

class _Chip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final AppColors colors;
  final VoidCallback onTap;
  final bool useSecondary;
  const _Chip({
    required this.label,
    required this.isSelected,
    required this.colors,
    required this.onTap,
    this.useSecondary = false,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor =
    useSecondary ? colors.accentSecondary : colors.accent;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? Color.alphaBlend(
              activeColor.withValues(alpha: 0.12), colors.surface)
              : colors.surfaceSubtle,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected
                ? activeColor.withValues(alpha: 0.4)
                : colors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? activeColor : colors.textSecondary,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}