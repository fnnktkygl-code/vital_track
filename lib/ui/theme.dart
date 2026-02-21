import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ─── ENUMS ────────────────────────────────────────────────────────────────────

enum AppBaseTheme { light, sepia, dark, oled }

enum AppAccentColor { vitalist, amber, clay, plum, sand, rose, ocean, peach, sunflower, coral }

// ─── ACCENT DATA ──────────────────────────────────────────────────────────────

class AppAccentData {
  final Color primary;
  final Color darkPrimary;     // Official Notion dark variant
  final Color onPrimary;       // text/icon on primary-colored surfaces
  final Color primaryMuted;    // tinted muted bg
  final Color darkMuted;       // official Notion dark-bg variant
  final Color primarySubtle;   // very light tint
  final Color darkSubtle;      // official Notion dark-border variant
  final Color secondary;       // companion color
  final Color darkSecondary;   // companion color dark
  final String label;
  final String emoji;

  const AppAccentData({
    required this.primary,
    required this.darkPrimary,
    required this.onPrimary,
    required this.primaryMuted,
    required this.darkMuted,
    required this.primarySubtle,
    required this.darkSubtle,
    required this.secondary,
    required this.darkSecondary,
    required this.label,
    required this.emoji,
  });

  Color resolvePrimary(bool isDark) => isDark ? darkPrimary : primary;
  Color resolveMuted(bool isDark) => isDark ? darkMuted : primaryMuted;
  Color resolveSubtle(bool isDark) => isDark ? darkSubtle : primarySubtle;
  Color resolveSecondary(bool isDark) => isDark ? darkSecondary : secondary;
}

/// All six warm Notion-like accent options.
const Map<AppAccentColor, AppAccentData> kAccents = {
  AppAccentColor.vitalist: AppAccentData(
    primary: Color(0xFF1E5128), // Deep Forest (Light)
    darkPrimary: Color(0xFF4DAB9A), // Notion Green (Dark)
    onPrimary: Colors.white,
    primaryMuted: Color(0x1A1E5128),
    darkMuted: Color(0xFF1F3529), // Notion Green dark bg
    primarySubtle: Color(0x0D1E5128),
    darkSubtle: Color(0xFF2B3E34),
    secondary: Color(0xFFD8B669),
    darkSecondary: Color(0xFFB7C7BF),
    label: 'Vitalist',
    emoji: '🌿',
  ),
  AppAccentColor.peach: AppAccentData(
    primary: Color(0xFFF28B82),
    darkPrimary: Color(0xFFFFB4AB),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1AF28B82),
    darkMuted: Color(0xFF5A2A25),
    primarySubtle: Color(0x0DF28B82),
    darkSubtle: Color(0xFF451E19),
    secondary: Color(0xFFF6B5AF),
    darkSecondary: Color(0xFFE5A199),
    label: 'Peach',
    emoji: '🍑',
  ),
  AppAccentColor.sunflower: AppAccentData(
    primary: Color(0xFFE5A910),
    darkPrimary: Color(0xFFFFCC33),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1AE5A910),
    darkMuted: Color(0xFF5E4300),
    primarySubtle: Color(0x0DE5A910),
    darkSubtle: Color(0xFF4D3600),
    secondary: Color(0xFFEDC95E),
    darkSecondary: Color(0xFFDAB34A),
    label: 'Sunflower',
    emoji: '🌻',
  ),
  AppAccentColor.amber: AppAccentData(
    primary: Color(0xFFD9730D),
    darkPrimary: Color(0xFFFFA344),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1AD9730D),
    darkMuted: Color(0xFF592E12),
    primarySubtle: Color(0x0DD9730D),
    darkSubtle: Color(0xFF633D1F),
    secondary: Color(0xFFF0B375),
    darkSecondary: Color(0xFFE5A880),
    label: 'Amber',
    emoji: '🌅',
  ),
  AppAccentColor.clay: AppAccentData(
    primary: Color(0xFF976D57),
    darkPrimary: Color(0xFF937264),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1A976D57),
    darkMuted: Color(0xFF3C2B24),
    primarySubtle: Color(0x0D976D57),
    darkSubtle: Color(0xFF4D3B34),
    secondary: Color(0xFFC7B1A5),
    darkSecondary: Color(0xFFB08F7E),
    label: 'Clay',
    emoji: '🏺',
  ),
  AppAccentColor.plum: AppAccentData(
    primary: Color(0xFF9065B0),
    darkPrimary: Color(0xFF9A6DD7),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1A9065B0),
    darkMuted: Color(0xFF2B1E3E), // Notion Purple dark bg
    primarySubtle: Color(0x0D9065B0),
    darkSubtle: Color(0xFF3E2B4D),
    secondary: Color(0xFFC4ADDE),
    darkSecondary: Color(0xFFB496D1),
    label: 'Plum',
    emoji: '🫐',
  ),
  AppAccentColor.sand: AppAccentData(
    primary: Color(0xFFD9971C),
    darkPrimary: Color(0xFFFFCA80),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1AD9971C),
    darkMuted: Color(0xFF5C471A), 
    primarySubtle: Color(0x0DD9971C),
    darkSubtle: Color(0xFF4A3815),
    secondary: Color(0xFFF2C87A),
    darkSecondary: Color(0xFFE5B55E),
    label: 'Sand',
    emoji: '🏜️',
  ),
  AppAccentColor.rose: AppAccentData(
    primary: Color(0xFFE03E3E),
    darkPrimary: Color(0xFFFF7369),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1AE03E3E),
    darkMuted: Color(0xFF592222),
    primarySubtle: Color(0x0DE03E3E),
    darkSubtle: Color(0xFF451A1A),
    secondary: Color(0xFFEFA5A5),
    darkSecondary: Color(0xFFE58787),
    label: 'Rose',
    emoji: '🌹',
  ),
  AppAccentColor.ocean: AppAccentData(
    primary: Color(0xFF0B6E99),
    darkPrimary: Color(0xFF529CCA),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1A0B6E99),
    darkMuted: Color(0xFF143A4D),
    primarySubtle: Color(0x0D0B6E99),
    darkSubtle: Color(0xFF0F2C3A),
    secondary: Color(0xFF8AC7E6),
    darkSecondary: Color(0xFF6EB4D7),
    label: 'Ocean',
    emoji: '🌊',
  ),
  AppAccentColor.coral: AppAccentData(
    primary: Color(0xFFF06A57),
    darkPrimary: Color(0xFFFF9583),
    onPrimary: Colors.white,
    primaryMuted: Color(0x1AF06A57),
    darkMuted: Color(0xFF4D241D),
    primarySubtle: Color(0x0DF06A57),
    darkSubtle: Color(0xFF3B1A14),
    secondary: Color(0xFFF4998C),
    darkSecondary: Color(0xFFE58071),
    label: 'Coral',
    emoji: '🪸',
  ),
};

// ─── DESIGN TOKENS (SPACING, RADIUS, SHADOWS) ───────────────────────────────

class AppSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;
  
  static const EdgeInsets screenH = EdgeInsets.symmetric(horizontal: xl);
  static const EdgeInsets screenV = EdgeInsets.symmetric(vertical: xl);
}

class AppRadius {
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  
  static final BorderRadius brSm = BorderRadius.circular(sm);
  static final BorderRadius brMd = BorderRadius.circular(md);
  static final BorderRadius brLg = BorderRadius.circular(lg);
  static final BorderRadius brXl = BorderRadius.circular(xl);
  static const BorderRadius brSheet = BorderRadius.vertical(top: Radius.circular(28));
}

class AppShadows {
  static List<BoxShadow> soft(Color shadowBase) => [
        BoxShadow(color: shadowBase.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        BoxShadow(color: shadowBase.withValues(alpha: 0.02), blurRadius: 2, offset: const Offset(0, 1)),
      ];
      
  static List<BoxShadow> float(Color shadowBase) => [
        BoxShadow(color: shadowBase.withValues(alpha: 0.08), blurRadius: 24, offset: const Offset(0, 8)),
        BoxShadow(color: shadowBase.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 4)),
      ];
}

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

  // ── Semantic category colors ─────────────────────────────────────────────
  final Color info;           // hydration, knowledge, neutral info
  final Color discovery;      // education, learning, protocol insights
  final Color movement;       // exercise, movement, activity
  final Color rest;           // sleep, relaxation, wind-down

  // ── Shadows ──────────────────────────────────────────────────────────────
  final Color shadowBase;     // base color for all box shadows

  // ── Accent (resolved from user's accent choice) ────────────────────────────
  final Color accent;         // == primary
  final Color accentOnPrimary;
  final Color accentMuted;
  final Color accentSubtle;
  final Color accentSecondary; // companion gold/warm

  // ── Meta ───────────────────────────────────────────────────────────────────
  final bool isDark;

  /// Adapt a data-driven color for use as text/badge to ensure readability.
  /// On light themes, darkens bright/pastel colors.
  /// On dark themes, lightens overly dark colors.
  Color adaptForText(Color c) {
    final hsl = HSLColor.fromColor(c);
    if (isDark) {
      // Lighten for dark themes (target lightness >= 0.65 for better contrast)
      return hsl.lightness < 0.65
          ? hsl.withLightness(0.65).toColor()
          : c;
    } else {
      // Darken for light themes (target lightness <= 0.32 for better contrast)
      return hsl.lightness > 0.32
          ? hsl.withLightness(0.32).toColor()
          : c;
    }
  }

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
    required this.info,
    required this.discovery,
    required this.movement,
    required this.rest,
    required this.shadowBase,
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
    Color? info,
    Color? discovery,
    Color? movement,
    Color? rest,
    Color? shadowBase,
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
      info: info ?? this.info,
      discovery: discovery ?? this.discovery,
      movement: movement ?? this.movement,
      rest: rest ?? this.rest,
      shadowBase: shadowBase ?? this.shadowBase,
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
      info: Color.lerp(info, other.info, t)!,
      discovery: Color.lerp(discovery, other.discovery, t)!,
      movement: Color.lerp(movement, other.movement, t)!,
      rest: Color.lerp(rest, other.rest, t)!,
      shadowBase: Color.lerp(shadowBase, other.shadowBase, t)!,
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
    surfaceRaised: const Color(0xFFF7F6F3),
    surfaceSubtle: const Color(0xFFF1F0EC),
    surfaceMuted: const Color(0xFFF7F6F3),
    border: const Color(0xFFDFDFDE),
    borderSubtle: const Color(0xFFEEEEEE),
    textPrimary: const Color(0xFF37352F),
    textSecondary: const Color(0xFF5A574E),
    textTertiary: const Color(0xFF9B9A93),
    icon: const Color(0xFF37352F),
    iconMuted: const Color(0xFF91918E),
    sheetBg: const Color(0xFFFFFFFF),
    sheetBorder: const Color(0xFFDFDFDE),
    error: const Color(0xFFEB5757),
    errorMuted: const Color(0x1AEB5757),
    info: const Color(0xFF0284C7),
    discovery: const Color(0xFF7C3AED),
    movement: const Color(0xFF16A34A),
    rest: const Color(0xFF4F46E5),
    shadowBase: const Color(0x0A000000),
    accent: a.resolvePrimary(false),
    accentOnPrimary: a.onPrimary,
    accentMuted: a.resolveMuted(false),
    accentSubtle: a.resolveSubtle(false),
    accentSecondary: a.resolveSecondary(false),
    isDark: false,
  );

  factory AppColors.sepia(AppAccentData a) => AppColors(
    surface: const Color(0xFFFBF9F5),
    surfaceRaised: const Color(0xFFF1EFEA),
    surfaceSubtle: const Color(0xFFF1F0E8),
    surfaceMuted: const Color(0xFFFDFCFB),
    border: const Color(0xFFE9E5E0),
    borderSubtle: const Color(0xFFF0EDE9),
    textPrimary: const Color(0xFF37352F),
    textSecondary: const Color(0xFF5A574E),
    textTertiary: const Color(0xFF8E8B83),
    icon: const Color(0xFF37352F),
    iconMuted: const Color(0xFF8E8B83),
    sheetBg: const Color(0xFFFBF9F5),
    sheetBorder: const Color(0xFFE9E5E0),
    error: const Color(0xFFD44333),
    errorMuted: const Color(0x1AD44333),
    info: const Color(0xFF0369A1),
    discovery: const Color(0xFF6D28D9),
    movement: const Color(0xFF15803D),
    rest: const Color(0xFF4338CA),
    shadowBase: const Color(0x08000000),
    accent: a.resolvePrimary(false),
    accentOnPrimary: a.onPrimary,
    accentMuted: a.resolveMuted(false),
    accentSubtle: a.resolveSubtle(false),
    accentSecondary: a.resolveSecondary(false),
    isDark: false,
  );

  factory AppColors.dark(AppAccentData a) => AppColors(
    surface: const Color(0xFF1C1C1E),
    surfaceRaised: const Color(0xFF2C2C2E),
    surfaceSubtle: const Color(0xFF3A3A3C),
    surfaceMuted: const Color(0xFF141414),
    border: const Color(0xFF3A3A3C),
    borderSubtle: const Color(0xFF2C2C2E),
    textPrimary: const Color(0xFFD4D4D8),
    textSecondary: const Color(0xFFA1A1AA),
    textTertiary: const Color(0xFF71717A),
    icon: const Color(0xFFD4D4D8),
    iconMuted: const Color(0xFF71717A),
    sheetBg: const Color(0xFF1C1C1E),
    sheetBorder: const Color(0xFF3A3A3C),
    error: const Color(0xFFF87171),
    errorMuted: const Color(0x1AF87171),
    info: const Color(0xFF7DD3FC),
    discovery: const Color(0xFFC4B5FD),
    movement: const Color(0xFF86EFAC),
    rest: const Color(0xFFA5B4FC),
    shadowBase: const Color(0x4D000000),
    accent: a.resolvePrimary(true),
    accentOnPrimary: a.onPrimary,
    accentMuted: a.resolveMuted(true),
    accentSubtle: a.resolveSubtle(true),
    accentSecondary: a.resolveSecondary(true),
    isDark: true,
  );

  factory AppColors.oled(AppAccentData a) => AppColors(
    surface: const Color(0xFF0A0A0A),
    surfaceRaised: const Color(0xFF141414),
    surfaceSubtle: const Color(0xFF1E1E1E),
    surfaceMuted: const Color(0xFF050505),
    border: const Color(0xFF2A2A2A),
    borderSubtle: const Color(0xFF141414),
    textPrimary: const Color(0xFFE4E4E7),
    textSecondary: const Color(0xFFA1A1AA),
    textTertiary: const Color(0xFF52525B),
    icon: const Color(0xFFE4E4E7),
    iconMuted: const Color(0xFF52525B),
    sheetBg: const Color(0xFF0A0A0A),
    sheetBorder: const Color(0xFF2A2A2A),
    error: const Color(0xFFF87171),
    errorMuted: const Color(0x1AF87171),
    info: const Color(0xFF7DD3FC),
    discovery: const Color(0xFFC4B5FD),
    movement: const Color(0xFF86EFAC),
    rest: const Color(0xFFA5B4FC),
    shadowBase: const Color(0x66000000),
    accent: a.resolvePrimary(true),
    accentOnPrimary: a.onPrimary,
    accentMuted: a.resolveMuted(true),
    accentSubtle: a.resolveSubtle(true),
    accentSecondary: a.resolveSecondary(true),
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
        fontSize: 38, fontWeight: FontWeight.w800, color: text, height: 1.1),
    displayMedium: GoogleFonts.outfit(
        fontSize: 30, fontWeight: FontWeight.w700, color: text, height: 1.2),
    // Title — section headings
    titleLarge: GoogleFonts.outfit(
        fontSize: 24, fontWeight: FontWeight.w700, color: text),
    titleMedium: GoogleFonts.outfit(
        fontSize: 20, fontWeight: FontWeight.w600, color: text),
    titleSmall: GoogleFonts.outfit(
        fontSize: 16, fontWeight: FontWeight.w600, color: text),
    // Body — all readable content, optimised for low fatigue
    bodyLarge: GoogleFonts.inter(
        fontSize: 17, fontWeight: FontWeight.w400, color: text, height: 1.7),
    bodyMedium: GoogleFonts.inter(
        fontSize: 16, fontWeight: FontWeight.w400, color: text, height: 1.65),
    bodySmall: GoogleFonts.inter(
        fontSize: 14, fontWeight: FontWeight.w400, color: muted, height: 1.55),
    // Label — chips, tags, nav labels
    labelLarge: GoogleFonts.inter(
        fontSize: 15, fontWeight: FontWeight.w600, color: text),
    labelMedium: GoogleFonts.inter(
        fontSize: 13, fontWeight: FontWeight.w600, color: muted),
    labelSmall: GoogleFonts.inter(
        fontSize: 12,
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
        ? const Color(0xFFFAF9F6) // Notion background
        : base == AppBaseTheme.sepia
        ? const Color(0xFFF1EDE4) // Notion warm background
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