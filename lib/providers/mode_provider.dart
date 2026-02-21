import 'package:flutter/material.dart';
import 'package:vital_track/services/hive_service.dart';

class ProtocolMode {
  final String id;
  final String label;
  final String icon;
  final Color color;
  final Color darkColor;
  final String desc;

  const ProtocolMode({
    required this.id,
    required this.label,
    required this.icon,
    required this.color,
    required this.darkColor,
    required this.desc,
  });

  Color resolveColor(bool isDark) => isDark ? darkColor : color;
  Color resolveBg(bool isDark) => (isDark ? darkColor : color).withValues(alpha: 0.12);
}

class ModeProvider with ChangeNotifier {
  final HiveService _hiveService;

  static const List<ProtocolMode> availableModes = [
    ProtocolMode(
      id: "sebi",
      label: "Dr. Sebi Strict",
      icon: "⚡",
      color: Color(0xFF9065B0), // Notion Purple (Light)
      darkColor: Color(0xFF9A6DD7), // Notion Purple (Dark)
      desc: "Tolérance zéro hybrides & amidon",
    ),
    ProtocolMode(
      id: "ehret",
      label: "Transition Ehret",
      icon: "🌿",
      color: Color(0xFF448361), // Notion Green (Light)
      darkColor: Color(0xFF4DAB9A), // Notion Green (Dark)
      desc: "Réduction progressive du mucus",
    ),
    ProtocolMode(
      id: "morse",
      label: "Protocole Morse",
      icon: "💧",
      color: Color(0xFF337EA9), // Notion Blue (Light)
      darkColor: Color(0xFF529CCA), // Notion Blue (Dark)
      desc: "Astringence & régénération lymphatique",
    ),
  ];

  ProtocolMode _currentMode = availableModes[0];

  ProtocolMode get currentMode => _currentMode;

  ModeProvider(this._hiveService) {
    _loadMode();
  }

  void _loadMode() {
    final savedId = _hiveService.loadMode();
    if (savedId != null) {
      _currentMode = availableModes.firstWhere(
        (m) => m.id == savedId,
        orElse: () => availableModes[0],
      );
      notifyListeners();
    }
  }

  void setMode(String id) {
    _currentMode = availableModes.firstWhere(
      (element) => element.id == id,
      orElse: () => availableModes[0],
    );
    _hiveService.saveMode(id);
    notifyListeners();
  }
}
