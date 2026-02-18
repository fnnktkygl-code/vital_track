import 'package:flutter/material.dart';
import 'package:vital_track/services/hive_service.dart';

class ProtocolMode {
  final String id;
  final String label;
  final String icon;
  final Color color;
  final Color bg;
  final String desc;

  const ProtocolMode({
    required this.id,
    required this.label,
    required this.icon,
    required this.color,
    required this.bg,
    required this.desc,
  });
}

class ModeProvider with ChangeNotifier {
  final HiveService _hiveService;

  static const List<ProtocolMode> availableModes = [
    ProtocolMode(
      id: "sebi",
      label: "Dr. Sebi Strict",
      icon: "⚡",
      color: Color(0xFFa78bfa),
      bg: Color(0x1Aa78bfa),
      desc: "Tolérance zéro hybrides & amidon",
    ),
    ProtocolMode(
      id: "ehret",
      label: "Transition Ehret",
      icon: "🌿",
      color: Color(0xFF4ade80),
      bg: Color(0x1A4ade80),
      desc: "Réduction progressive du mucus",
    ),
    ProtocolMode(
      id: "morse",
      label: "Protocole Morse",
      icon: "💧",
      color: Color(0xFF38bdf8),
      bg: Color(0x1A38bdf8),
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
