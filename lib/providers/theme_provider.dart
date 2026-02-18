import 'package:flutter/material.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/ui/theme.dart';

class ThemeProvider extends ChangeNotifier {
  final HiveService _hiveService;

  AppBaseTheme _baseTheme = AppBaseTheme.light;
  AppAccentColor _accentColor = AppAccentColor.vitalist;

  ThemeProvider(this._hiveService) {
    _loadPreferences();
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  AppBaseTheme get baseTheme => _baseTheme;
  AppAccentColor get accentColor => _accentColor;

  // Legacy getter — kept for backward compat with old code using currentTheme
  AppBaseTheme get currentTheme => _baseTheme;

  ThemeData get themeData =>
      AppTheme.build(base: _baseTheme, accentColor: _accentColor);

  // ── Persistence ──────────────────────────────────────────────────────────

  void _loadPreferences() {
    final storedBase = _hiveService.settingsBox.get('baseTheme');
    if (storedBase != null) {
      _baseTheme = AppBaseTheme.values.firstWhere(
            (e) => e.name == storedBase,
        orElse: () => AppBaseTheme.light,
      );
    }

    final storedAccent = _hiveService.settingsBox.get('accentColor');
    if (storedAccent != null) {
      _accentColor = AppAccentColor.values.firstWhere(
            (e) => e.name == storedAccent,
        orElse: () => AppAccentColor.vitalist,
      );
    }

    notifyListeners();
  }

  Future<void> setBaseTheme(AppBaseTheme base) async {
    _baseTheme = base;
    await _hiveService.settingsBox.put('baseTheme', base.name);
    notifyListeners();
  }

  Future<void> setAccentColor(AppAccentColor accent) async {
    _accentColor = accent;
    await _hiveService.settingsBox.put('accentColor', accent.name);
    notifyListeners();
  }

  // ── Legacy compat (for code still calling setTheme with AppThemeType) ────

  Future<void> setTheme(dynamic theme) async {
    // Accept old AppThemeType or new AppBaseTheme
    if (theme is AppBaseTheme) {
      await setBaseTheme(theme);
    }
  }
}