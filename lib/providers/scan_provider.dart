import 'dart:async';
import 'package:flutter/material.dart';

class ScanProvider with ChangeNotifier {
  bool _isScanning = false;
  bool _isScanned = false;
  double _progress = 0.0;
  String _statusMessage = "Pointez vers un aliment";
  Timer? _progressTimer;

  bool get isScanning => _isScanning;
  bool get isScanned => _isScanned;
  double get progress => _progress;
  String get statusMessage => _statusMessage;

  void startScan() {
    // Cancel any existing timer to prevent concurrent timers
    _progressTimer?.cancel();

    _isScanning = true;
    _isScanned = false;
    _progress = 0.0;
    _statusMessage = "Initialisation...";
    notifyListeners();

    _progressTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      _progress += 2 + (DateTime.now().millisecond % 5);
      if (_progress >= 100) {
        _progress = 100;
        _isScanning = false;
        _isScanned = true;
        _statusMessage = "Analyse terminée";
        timer.cancel();
        _progressTimer = null;
      } else {
        if (_progress < 30) {
          _statusMessage = "Détection morphologique...";
        } else if (_progress < 60) {
          _statusMessage = "Analyse spectrale...";
        } else if (_progress < 85) {
          _statusMessage = "Classification vitaliste...";
        } else {
          _statusMessage = "Finalisation...";
        }
      }
      notifyListeners();
    });
  }

  void finishScan() {
    _progressTimer?.cancel();
    _progressTimer = null;
    _isScanning = false;
    _isScanned = true;
    _progress = 100.0;
    _statusMessage = "Analyse terminée";
    notifyListeners();
  }

  void resetScan() {
    _progressTimer?.cancel();
    _progressTimer = null;
    _isScanning = false;
    _isScanned = false;
    _progress = 0.0;
    _statusMessage = "Pointez vers un aliment";
    notifyListeners();
  }

  @override
  void dispose() {
    _progressTimer?.cancel();
    super.dispose();
  }
}
