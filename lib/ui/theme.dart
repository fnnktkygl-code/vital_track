import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ─── ENUMS ────────────────────────────────────────────────────────────────────

enum AppBaseTheme { light, sepia, dark, oled }

enum AppAccentColor { vitalist, sage, amber, clay, walnut, plum }

// ─── ACCENT DATA ──────────────────────────────────────────────────────────────

class AppAccentData {
  final Color primary;
  final Color onPrimary;       // text/icon on primary-colored surfaces
  final Color primaryMuted;    // tinted muted bg (chips, badges, etc.)
  final Color primarySubtle;   // very light tint for borders, hover
  final Color secondary;       // gold/warm companion
  final String label;
  final String emoji;

  const AppAccentData({
    required this.primary,
    required this.onPrimary,
    required this.primaryMuted,
    required this.primarySubtle,
    required this.secondary,
    required this.label,
    required this.emoji,
  });
}

/// All six warm Notion-like accent options.
const Map<AppAccentColor, AppAccentData> kAccents = {
  AppAccentColor.vitalist: AppAccentData(
    primary: Color(0xFF1E5128),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1A1E5128),
    primarySubtle: Color(0x0D1E5128),
    secondary: Color(0xFFD8B669),
    label: 'Vitalist',
    emoji: '🌿',
  ),
  AppAccentColor.sage: AppAccentData(
    primary: Color(0xFF52796F),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1A52796F),
    primarySubtle: Color(0x0D52796F),
    secondary: Color(0xFFB7C9C1),
    label: 'Sage',
    emoji: '🍃',
  ),
  AppAccentColor.amber: AppAccentData(
    primary: Color(0xFF92400E),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1A92400E),
    primarySubtle: Color(0x0D92400E),
    secondary: Color(0xFFD97706),
    label: 'Amber',
    emoji: '🌅',
  ),
  AppAccentColor.clay: AppAccentData(
    primary: Color(0xFF9B4521),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1A9B4521),
    primarySubtle: Color(0x0D9B4521),
    secondary: Color(0xFFE5A880),
    label: 'Clay',
    emoji: '🏺',
  ),
  AppAccentColor.walnut: AppAccentData(
    primary: Color(0xFF78350F),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1A78350F),
    primarySubtle: Color(0x0D78350F),
    secondary: Color(0xFFC8975A),
    label: 'Walnut',
    emoji: '🪵',
  ),
  AppAccentColor.plum: AppAccentData(
    primary: Color(0xFF6B21A8),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1A6B21A8),
    primarySubtle: Color(0x0D6B21A8),
    secondary: Color(0xFFB87DD6),
    label: 'Plum',
    emoji: '🫐',
  ),
};

// ─── SEMANTIC COLOR TOKENS (ThemeExtension) ───────────────────────────────────

/// Adaptive color tokens that every widget should use instead of hardcoded colors.
/// Access via: `context.colors.surface`, `context.colors.border`, etc.
class AppColors extends ThemeExtension<AppColors> {
  // ── Surface hierarchy ──────────────────────────────────────────────────────
  final Color surface;        // Card / widget backgrounds
  final Color surfaceRaised;  // Elevated surfaces (e.g., header on card)
  final Color surfaceSubtle;  // Input fills, chip fills, tags
  final Color surfaceMuted;   // Empty-state containers, very faint tint

  // ── Borders ────────────────────────────────────────────────────────────────
  final Color border;         // Standard dividers & outlines
  final Color borderSubtle;   // Hair-line, barely visible borders

  // ── Text ───────────────────────────────────────────────────────────────────
  final Color textPrimary;    // Body / headings
  final Color textSecondary;  // Labels, secondary content
  final Color textTertiary;   // Hints, placeholders, captions

  // ── Icons ──────────────────────────────────────────────────────────────────
  final Color icon;           // Default icons
  final Color iconMuted;      // Secondary / inactive icons

  // ── Sheets & overlays ─────────────────────────────────────────────────────
  final Color sheetBg;        // Bottom sheet / modal background
  final Color sheetBorder;    // Top border line of sheets

  // ── Status ─────────────────────────────────────────────────────────────────
  final Color error;
  final Color errorMuted;

  // ── Accent (resolved from user's accent choice) ────────────────────────────
  final Color accent;         // == primary
  final Color accentOnPrimary;
  final Color accentMuted;
  final Color accentSubtle;
  final Color accentSecondary; // companion gold/warm

  // ── Meta ───────────────────────────────────────────────────────────────────
  final bool isDark;

  const AppColors({
    required this.surface,
    required this.surfaceRaised,
    required this.surfaceSubtle,
    required this.surfaceMuted,
    required this.border,
    required this.borderSubtle,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.icon,
    required this.iconMuted,
    required this.sheetBg,
    required this.sheetBorder,
    required this.error,
    required this.errorMuted,
    required this.accent,
    required this.accentOnPrimary,
    required this.accentMuted,
    required this.accentSubtle,
    required this.accentSecondary,
    required this.isDark,
  });

  @override
  AppColors copyWith({
    Color? surface,
    Color? surfaceRaised,
    Color? surfaceSubtle,
    Color? surfaceMuted,
    Color? border,
    Color? borderSubtle,
    Color? textPrimary,
    Color? textSecondary,
    Color? textTertiary,
    Color? icon,
    Color? iconMuted,
    Color? sheetBg,
    Color? sheetBorder,
    Color? error,
    Color? errorMuted,
    Color? accent,
    Color? accentOnPrimary,
    Color? accentMuted,
    Color? accentSubtle,
    Color? accentSecondary,
    bool? isDark,
  }) {
    return AppColors(
      surface: surface ?? this.surface,
      surfaceRaised: surfaceRaised ?? this.surfaceRaised,
      surfaceSubtle: surfaceSubtle ?? this.surfaceSubtle,
      surfaceMuted: surfaceMuted ?? this.surfaceMuted,
      border: border ?? this.border,
      borderSubtle: borderSubtle ?? this.borderSubtle,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      icon: icon ?? this.icon,
      iconMuted: iconMuted ?? this.iconMuted,
      sheetBg: sheetBg ?? this.sheetBg,
      sheetBorder: sheetBorder ?? this.sheetBorder,
      error: error ?? this.error,
      errorMuted: errorMuted ?? this.errorMuted,
      accent: accent ?? this.accent,
      accentOnPrimary: accentOnPrimary ?? this.accentOnPrimary,
      accentMuted: accentMuted ?? this.accentMuted,
      accentSubtle: accentSubtle ?? this.accentSubtle,
      accentSecondary: accentSecondary ?? this.accentSecondary,
      isDark: isDark ?? this.isDark,
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceRaised: Color.lerp(surfaceRaised, other.surfaceRaised, t)!,
      surfaceSubtle: Color.lerp(surfaceSubtle, other.surfaceSubtle, t)!,
      surfaceMuted: Color.lerp(surfaceMuted, other.surfaceMuted, t)!,
      border: Color.lerp(border, other.border, t)!,
      borderSubtle: Color.lerp(borderSubtle, other.borderSubtle, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      icon: Color.lerp(icon, other.icon, t)!,
      iconMuted: Color.lerp(iconMuted, other.iconMuted, t)!,
      sheetBg: Color.lerp(sheetBg, other.sheetBg, t)!,
      sheetBorder: Color.lerp(sheetBorder, other.sheetBorder, t)!,
      error: Color.lerp(error, other.error, t)!,
      errorMuted: Color.lerp(errorMuted, other.errorMuted, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentOnPrimary: Color.lerp(accentOnPrimary, other.accentOnPrimary, t)!,
      accentMuted: Color.lerp(accentMuted, other.accentMuted, t)!,
      accentSubtle: Color.lerp(accentSubtle, other.accentSubtle, t)!,
      accentSecondary: Color.lerp(accentSecondary, other.accentSecondary, t)!,
      isDark: t < 0.5 ? isDark : other.isDark,
    );
  }

  // ── Factory builders per theme ─────────────────────────────────────────────

  factory AppColors.light(AppAccentData a) => AppColors(
    surface: const Color(0xFFFFFFFF),
    surfaceRaised: const Color(0xFFF4F4F5),
    surfaceSubtle: const Color(0xFFEEEEF0),
    surfaceMuted: const Color(0xFFF8F8F9),
    border: const Color(0xFFE4E4E7),
    borderSubtle: const Color(0xFFF0F0F2),
    textPrimary: const Color(0xFF18181B),
    textSecondary: const Color(0xFF52525B),
    textTertiary: const Color(0xFF8F8F9A),
    icon: const Color(0xFF3F3F46),
    iconMuted: const Color(0xFF8F8F9A),
    sheetBg: const Color(0xFFFFFFFF),
    sheetBorder: const Color(0xFFE4E4E7),
    error: const Color(0xFFDC2626),
    errorMuted: const Color(0x1ADC2626),
    accent: a.primary,
    accentOnPrimary: a.onPrimary,
    accentMuted: a.primaryMuted,
    accentSubtle: a.primarySubtle,
    accentSecondary: a.secondary,
    isDark: false,
  );

  factory AppColors.sepia(AppAccentData a) => AppColors(
    // Warm parchment — very easy on the eyes for long reading sessions
    surface: const Color(0xFFFAF6EF),
    surfaceRaised: const Color(0xFFF5EFE3),
    surfaceSubtle: const Color(0xFFEFE7D6),
    surfaceMuted: const Color(0xFFFCF9F4),
    border: const Color(0xFFDDD3C0),
    borderSubtle: const Color(0xFFEDE7D8),
    textPrimary: const Color(0xFF2C2416),
    textSecondary: const Color(0xFF6B5C3E),
    textTertiary: const Color(0xFF9E8B6D),
    icon: const Color(0xFF4A3B26),
    iconMuted: const Color(0xFF9E8B6D),
    sheetBg: const Color(0xFFF5EFE3),
    sheetBorder: const Color(0xFFDDD3C0),
    error: const Color(0xFFB91C1C),
    errorMuted: const Color(0x1AB91C1C),
    accent: a.primary,
    accentOnPrimary: a.onPrimary,
    accentMuted: a.primaryMuted,
    accentSubtle: a.primarySubtle,
    accentSecondary: a.secondary,
    isDark: false,
  );

  factory AppColors.dark(AppAccentData a) => AppColors(
    // True dark with visible surface elevation
    surface: const Color(0xFF1C1C1E),
    surfaceRaised: const Color(0xFF2C2C2E),
    surfaceSubtle: const Color(0xFF3A3A3C),
    surfaceMuted: const Color(0xFF141414),
    border: const Color(0xFF3A3A3C),
    borderSubtle: const Color(0xFF2C2C2E),
    textPrimary: const Color(0xFFE4E4E7),
    textSecondary: const Color(0xFFA1A1AA),
    textTertiary: const Color(0xFF71717A),
    icon: const Color(0xFFD4D4D8),
    iconMuted: const Color(0xFF71717A),
    sheetBg: const Color(0xFF1C1C1E),
    sheetBorder: const Color(0xFF3A3A3C),
    error: const Color(0xFFF87171),
    errorMuted: const Color(0x1AF87171),
    accent: a.primary,
    accentOnPrimary: a.onPrimary,
    accentMuted: a.primaryMuted,
    accentSubtle: a.primarySubtle,
    accentSecondary: a.secondary,
    isDark: true,
  );

  factory AppColors.oled(AppAccentData a) => AppColors(
    // Pure black OLED — maximum battery on AMOLED, maximum contrast
    surface: const Color(0xFF0A0A0A),
    surfaceRaised: const Color(0xFF141414),
    surfaceSubtle: const Color(0xFF1E1E1E),
    surfaceMuted: const Color(0xFF050505),
    border: const Color(0xFF2A2A2A),
    borderSubtle: const Color(0xFF141414),
    textPrimary: const Color(0xFFF4F4F5),
    textSecondary: const Color(0xFFA1A1AA),
    textTertiary: const Color(0xFF52525B),
    icon: const Color(0xFFE4E4E7),
    iconMuted: const Color(0xFF52525B),
    sheetBg: const Color(0xFF0A0A0A),
    sheetBorder: const Color(0xFF2A2A2A),
    error: const Color(0xFFF87171),
    errorMuted: const Color(0x1AF87171),
    accent: a.primary,
    accentOnPrimary: a.onPrimary,
    accentMuted: a.primaryMuted,
    accentSubtle: a.primarySubtle,
    accentSecondary: a.secondary,
    isDark: true,
  );

  static AppColors forTheme(AppBaseTheme base, AppAccentData accent) {
    switch (base) {
      case AppBaseTheme.light: return AppColors.light(accent);
      case AppBaseTheme.sepia: return AppColors.sepia(accent);
      case AppBaseTheme.dark:  return AppColors.dark(accent);
      case AppBaseTheme.oled:  return AppColors.oled(accent);
    }
  }
}

// ─── EASY ACCESS EXTENSION ───────────────────────────────────────────────────

extension AppColorsX on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
}

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────

TextTheme _buildTextTheme(Color text, Color muted) {
  return TextTheme(
    // Display — bold, used for score numbers, big heroes
    displayLarge: GoogleFonts.outfit(
        fontSize: 36, fontWeight: FontWeight.w800, color: text, height: 1.1),
    displayMedium: GoogleFonts.outfit(
        fontSize: 28, fontWeight: FontWeight.w700, color: text, height: 1.2),
    // Title — section headings
    titleLarge: GoogleFonts.outfit(
        fontSize: 22, fontWeight: FontWeight.w700, color: text),
    titleMedium: GoogleFonts.outfit(
        fontSize: 18, fontWeight: FontWeight.w600, color: text),
    titleSmall: GoogleFonts.outfit(
        fontSize: 15, fontWeight: FontWeight.w600, color: text),
    // Body — all readable content, optimised for low fatigue
    bodyLarge: GoogleFonts.inter(
        fontSize: 16, fontWeight: FontWeight.w400, color: text, height: 1.65),
    bodyMedium: GoogleFonts.inter(
        fontSize: 15, fontWeight: FontWeight.w400, color: text, height: 1.6),
    bodySmall: GoogleFonts.inter(
        fontSize: 13, fontWeight: FontWeight.w400, color: muted, height: 1.5),
    // Label — chips, tags, nav labels
    labelLarge: GoogleFonts.inter(
        fontSize: 14, fontWeight: FontWeight.w600, color: text),
    labelMedium: GoogleFonts.inter(
        fontSize: 12, fontWeight: FontWeight.w600, color: muted),
    labelSmall: GoogleFonts.inter(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        color: muted,
        letterSpacing: 0.8),
  );
}

// ─── MAIN THEME BUILDER ───────────────────────────────────────────────────────

class AppTheme {
  // ── Legacy static constants (kept for files not yet migrated) ──────────────
  // Prefer context.colors.xxx in new/updated code.
  static const Color primary = Color(0xFF1E5128);
  static const Color secondary = Color(0xFFD8B669);
  static const Color accent = secondary;
  static const Color error = Color(0xFFDC2626);
  static const Color background = Color(0xFFF8F9FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF18181B);
  static const Color textSecondary = Color(0xFF52525B);

  // ── Theme builder ──────────────────────────────────────────────────────────

  static ThemeData build({
    required AppBaseTheme base,
    required AppAccentColor accentColor,
  }) {
    final a = kAccents[accentColor]!;
    final colors = AppColors.forTheme(base, a);

    final brightness =
    (base == AppBaseTheme.light || base == AppBaseTheme.sepia)
        ? Brightness.light
        : Brightness.dark;

    final bg = base == AppBaseTheme.light
        ? const Color(0xFFF8F9FA)
        : base == AppBaseTheme.sepia
        ? const Color(0xFFF0E9DB)
        : base == AppBaseTheme.dark
        ? const Color(0xFF111111)
        : const Color(0xFF000000);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: bg,
      primaryColor: a.primary,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: a.primary,
        onPrimary: a.onPrimary,
        primaryContainer: Color.alphaBlend(a.primaryMuted, colors.surface),
        onPrimaryContainer: a.primary,
        secondary: a.secondary,
        onSecondary: brightness == Brightness.light ? Colors.black87 : Colors.white,
        secondaryContainer: Color.alphaBlend(
            a.secondary.withValues(alpha: 0.15), colors.surface),
        onSecondaryContainer: a.secondary,
        error: colors.error,
        onError: Colors.white,
        surface: colors.surface,
        onSurface: colors.textPrimary,
        surfaceContainerHighest: colors.surfaceSubtle,
        outline: colors.border,
        outlineVariant: colors.borderSubtle,
      ),
      textTheme: _buildTextTheme(colors.textPrimary, colors.textSecondary),
      cardColor: colors.surface,
      cardTheme: CardThemeData(
        color: colors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: colors.border),
        ),
      ),
      dividerColor: colors.border,
      dividerTheme: DividerThemeData(color: colors.border, space: 1, thickness: 1),
      iconTheme: IconThemeData(color: colors.icon),
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: IconThemeData(color: colors.icon),
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: colors.textPrimary,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surfaceSubtle,
        contentPadding:
        const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: a.primary, width: 1.5),
        ),
        hintStyle: TextStyle(color: colors.textTertiary),
        labelStyle: TextStyle(color: colors.textSecondary),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: colors.surfaceSubtle,
        selectedColor: Color.alphaBlend(a.primaryMuted, colors.surface),
        side: BorderSide(color: colors.border),
        labelStyle: TextStyle(color: colors.textSecondary, fontSize: 13),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colors.sheetBg,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        elevation: 0,
      ),
      extensions: [colors],
    );
  }

  // ── Shorthand getters (for ThemeProvider) ──────────────────────────────────
  static ThemeData light({AppAccentColor accent = AppAccentColor.vitalist}) =>
      build(base: AppBaseTheme.light, accentColor: accent);

  static ThemeData sepia({AppAccentColor accent = AppAccentColor.vitalist}) =>
      build(base: AppBaseTheme.sepia, accentColor: accent);

  static ThemeData dark({AppAccentColor accent = AppAccentColor.vitalist}) =>
      build(base: AppBaseTheme.dark, accentColor: accent);

  static ThemeData oled({AppAccentColor accent = AppAccentColor.vitalist}) =>
      build(base: AppBaseTheme.oled, accentColor: accent);

  // ── Legacy aliases kept for files still importing these directly ───────────
  static ThemeData get cozyTheme => light();
  static ThemeData get freshTheme => sepia();
  static ThemeData get darkTheme => dark();

  // ── Deprecated static colors — migrate to context.colors.xxx ──────────────
  // Keeping them so the app still compiles; remove once all screens are updated.
  @Deprecated('Use context.colors.accent')
  static const Color kPrimary = primary;
}