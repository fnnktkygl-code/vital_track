import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:image_picker/image_picker.dart';
import 'package:vital_track/providers/scan_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/food_modal.dart';
import 'package:vital_track/utils/food_mapper.dart';
import 'package:vital_track/services/open_food_facts_service.dart';
import 'package:vital_track/services/ai_service.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/providers/meal_provider.dart';

enum _ScanMode { food, barcode }

class ScanScreen extends StatefulWidget {
  final List<Food>? initialFoods;
  const ScanScreen({super.key, this.initialFoods});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen>
    with TickerProviderStateMixin {
  final MobileScannerController _controller = MobileScannerController();
  final OpenFoodFactsService _apiService = OpenFoodFactsService();
  final HiveService _hiveService = HiveService();
  final ImagePicker _picker = ImagePicker();

  _ScanMode _mode = _ScanMode.food;
  bool _isProcessing = false;
  bool _torchOn = false;

  // Floating ingredient labels (populated after AI detects)
  List<_IngredientLabel> _labels = [];
  late AnimationController _labelAnim;
  late AnimationController _shutterAnim;

  @override
  void initState() {
    super.initState();
    _labelAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _shutterAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      lowerBound: 0.88,
      upperBound: 1.0,
      value: 1.0,
    );
    
    // Handle passed results
    if (widget.initialFoods != null && widget.initialFoods!.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showScanResults(widget.initialFoods!, confidence: 90);
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _labelAnim.dispose();
    _shutterAnim.dispose();
    super.dispose();
  }

  // ── BARCODE DETECT ──────────────────────────────────────────────────────────
  void _onDetect(BarcodeCapture capture) async {
    if (_mode != _ScanMode.barcode || _isProcessing) return;
    final code = capture.barcodes.firstOrNull?.rawValue;
    if (code == null) return;

    setState(() => _isProcessing = true);
    Provider.of<ScanProvider>(context, listen: false).startScan();

    final productData = await _apiService.fetchProduct(code);

    if (!mounted) return;
    Provider.of<ScanProvider>(context, listen: false).finishScan();

    if (productData != null) {
      final food = FoodMapper.fromOpenFoodFacts(productData);
      await _hiveService.addToHistory(food);
      _showScanResults([food], confidence: 95);
    } else {
      _showSnack("Produit non trouvé : $code", error: true);
      setState(() => _isProcessing = false);
      Provider.of<ScanProvider>(context, listen: false).resetScan();
    }
  }

  // ── PHOTO CAPTURE ───────────────────────────────────────────────────────────
  Future<void> _capturePhoto() async {
    // 1. Confirm AI usage
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0D1410),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: AppTheme.primary.withValues(alpha: 0.2))),
        title: const Text("Utiliser l'IA ?",
            style: TextStyle(color: Colors.white, fontSize: 18)),
        content: const Text(
            "L'analyse visuelle consomme 1 crédit par requête. Voulez-vous continuer ?",
            style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("Annuler",
                style: TextStyle(color: AppTheme.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Analyser",
                style: TextStyle(
                    color: AppTheme.primary, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    await _shutterAnim.reverse();
    await _shutterAnim.forward();

    try {
      final XFile? img = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 70,
      );
      if (img == null) return;

      setState(() {
        _isProcessing = true;
        _labels = [];
      });

      final data = await AIService.analyzeImage(img);
      if (!mounted) return;

      if (data != null) {
        final foods = FoodMapper.fromAIJsonList(data);
        if (foods.isNotEmpty) {
          for (final f in foods) {
            await _hiveService.addToHistory(f);
          }

          // Generate floating labels from first detected food
          _labels = _buildLabels(foods.first);
          _labelAnim.forward(from: 0);

          // After labels animate in, show results
          await Future.delayed(const Duration(milliseconds: 1200));
          if (mounted) {
            setState(() => _isProcessing = false);
            _showScanResults(foods, confidence: 89);
          }
          return;
        }
      }

      setState(() => _isProcessing = false);
      _showSnack("Impossible d'identifier l'aliment.");
    } catch (_) {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  // ── GALLERY ──────────────────────────────────────────────────────────────────
  Future<void> _pickGallery() async {
    final XFile? img = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 70,
    );
    if (img == null) return;

    setState(() => _isProcessing = true);
    final data = await AIService.analyzeImage(img);
    if (!mounted) return;
    setState(() => _isProcessing = false);

    if (data != null) {
      final foods = FoodMapper.fromAIJsonList(data);
      if (foods.isNotEmpty) {
        for (final f in foods) {
          await _hiveService.addToHistory(f);
        }
        _showScanResults(foods, confidence: 87);
        return;
      }
    }
    _showSnack("Impossible d'analyser l'image.");
  }

  List<_IngredientLabel> _buildLabels(Food food) {
    final rng = math.Random(food.name.hashCode);
    final raw = <String>[food.name, food.family, ...food.tags.take(2)];
    return raw.asMap().entries.map((e) {
      return _IngredientLabel(
        text: e.value,
        dx: 0.1 + rng.nextDouble() * 0.75,
        dy: 0.15 + (e.key * 0.2),
        delay: e.key * 0.12,
      );
    }).toList();
  }

  void _showScanResults(List<Food> foods, {required int confidence}) {
    setState(() {
      _isProcessing = false;
      _labels = [];
    });
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ScanResultsSheet(foods: foods, confidence: confidence),
    ).whenComplete(() {
      if (mounted) {
        Provider.of<ScanProvider>(context, listen: false).resetScan();
      }
    });
  }

  void _showSnack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? AppTheme.error : AppTheme.surface,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // ── CAMERA FEED ────────────────────────────────────────────────
          Positioned.fill(
            child: MobileScanner(controller: _controller, onDetect: _onDetect),
          ),

          // ── FLOATING INGREDIENT LABELS ──────────────────────────────────
          if (_labels.isNotEmpty)
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _labelAnim,
                builder: (context, child) => Stack(
                  children: _labels.map((l) {
                    final progress = (((_labelAnim.value - l.delay) / 0.4)
                        .clamp(0.0, 1.0));
                    return Positioned(
                      left: MediaQuery.of(context).size.width * l.dx,
                      top: MediaQuery.of(context).size.height * l.dy,
                      child: Opacity(
                        opacity: progress,
                        child: Transform.translate(
                          offset: Offset(0, 10 * (1 - progress)),
                          child: _FloatingLabel(text: l.text),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

          // ── TOP BAR ──────────────────────────────────────────────────────
          Positioned(
            top: 0, left: 0, right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Row(
                  children: [
                    _CircleBtn(
                      icon: Icons.close,
                      onTap: () => Navigator.of(context).pop(),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _mode == _ScanMode.food
                            ? "Scanning food"
                            : "Code-barres",
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14),
                      ),
                    ),
                    const Spacer(),
                    _CircleBtn(
                      icon: _torchOn
                          ? Icons.flashlight_on
                          : Icons.flashlight_off,
                      onTap: () {
                        _controller.toggleTorch();
                        setState(() => _torchOn = !_torchOn);
                      },
                      active: _torchOn,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── BARCODE FRAME (barcode mode) ──────────────────────────────────
          if (_mode == _ScanMode.barcode)
            Center(child: _BarcodeFrame()),

          // ── BOTTOM CONTROLS ───────────────────────────────────────────────
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: Column(
              children: [
                // Hint text
                if (_mode == _ScanMode.food && !_isProcessing)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        "Centrez votre aliment dans le cadre",
                        style: TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                    ),
                  ),

                // Shutter row: gallery · shutter · flip
                Padding(
                  padding: EdgeInsets.only(
                    bottom: MediaQuery.of(context).padding.bottom + 24,
                    left: 60,
                    right: 60,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Gallery
                      _CircleBtn(
                        icon: Icons.photo_library_outlined,
                        onTap: _pickGallery,
                        size: 44,
                      ),

                      // Main shutter
                      ScaleTransition(
                        scale: _shutterAnim,
                        child: GestureDetector(
                          onTap: _mode == _ScanMode.food ? _capturePhoto : null,
                          child: Container(
                            width: 76,
                            height: 76,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.15),
                              border: Border.all(
                                  color: Colors.white, width: 3.5),
                            ),
                            padding: const EdgeInsets.all(4),
                            child: Container(
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Flip camera
                      _CircleBtn(
                        icon: Icons.flip_camera_ios_outlined,
                        onTap: () => _controller.switchCamera(),
                        size: 44,
                      ),
                    ],
                  ),
                ),

                // Mode toggle strip
                _ModeStrip(
                  current: _mode,
                  onChanged: (m) => setState(() => _mode = m),
                ),
              ],
            ),
          ),

          // ── PROCESSING OVERLAY ────────────────────────────────────────────
          if (_isProcessing) _ProcessingOverlay(),
        ],
      ),
    );
  }
}

// ── FLOATING INGREDIENT LABEL ─────────────────────────────────────────────────
class _IngredientLabel {
  final String text;
  final double dx, dy, delay;
  const _IngredientLabel(
      {required this.text,
        required this.dx,
        required this.dy,
        required this.delay});
}

class _FloatingLabel extends StatelessWidget {
  final String text;
  const _FloatingLabel({required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding:
          const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Text(
            text,
            style: const TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}

// ── MODE STRIP ────────────────────────────────────────────────────────────────
class _ModeStrip extends StatelessWidget {
  final _ScanMode current;
  final ValueChanged<_ScanMode> onChanged;
  const _ModeStrip({required this.current, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom + 8,
        top: 8,
        left: 20,
        right: 20,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _ModeChip(
            label: "Aliment",
            selected: current == _ScanMode.food,
            onTap: () => onChanged(_ScanMode.food),
          ),
          const SizedBox(width: 12),
          _ModeChip(
            label: "Code-barres",
            selected: current == _ScanMode.barcode,
            onTap: () => onChanged(_ScanMode.barcode),
          ),
        ],
      ),
    );
  }
}

class _ModeChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _ModeChip(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding:
        const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
        decoration: BoxDecoration(
          color: selected
              ? Colors.white
              : Colors.black.withValues(alpha: 0.45),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.black : Colors.white70,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

// ── BARCODE FRAME ─────────────────────────────────────────────────────────────
class _BarcodeFrame extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 260,
      height: 200,
      child: Stack(
        children: [
          _corner(true, true),
          _corner(true, false),
          _corner(false, true),
          _corner(false, false),
        ],
      ),
    );
  }

  Widget _corner(bool top, bool left) => Positioned(
    top: top ? 0 : null,
    bottom: top ? null : 0,
    left: left ? 0 : null,
    right: left ? null : 0,
    child: Container(
      width: 26,
      height: 26,
      decoration: BoxDecoration(
        border: Border(
          top: top
              ? const BorderSide(color: Colors.white, width: 3)
              : BorderSide.none,
          bottom: !top
              ? const BorderSide(color: Colors.white, width: 3)
              : BorderSide.none,
          left: left
              ? const BorderSide(color: Colors.white, width: 3)
              : BorderSide.none,
          right: !left
              ? const BorderSide(color: Colors.white, width: 3)
              : BorderSide.none,
        ),
        borderRadius: BorderRadius.only(
          topLeft: top && left ? const Radius.circular(6) : Radius.zero,
          topRight:
          top && !left ? const Radius.circular(6) : Radius.zero,
          bottomLeft:
          !top && left ? const Radius.circular(6) : Radius.zero,
          bottomRight:
          !top && !left ? const Radius.circular(6) : Radius.zero,
        ),
      ),
    ),
  );
}

// ── CIRCLE BUTTON ─────────────────────────────────────────────────────────────
class _CircleBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool active;
  final double size;
  const _CircleBtn(
      {required this.icon,
        required this.onTap,
        this.active = false,
        this.size = 42});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.black.withValues(alpha: 0.5),
        border: Border.all(
          color: active
              ? AppTheme.primary.withValues(alpha: 0.6)
              : Colors.white.withValues(alpha: 0.2),
        ),
      ),
      child: Icon(icon,
          color: active ? AppTheme.primary : Colors.white, size: 18),
    ),
  );
}

// ── PROCESSING OVERLAY ────────────────────────────────────────────────────────
class _ProcessingOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    color: Colors.black.withValues(alpha: 0.72),
    child: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
              width: 48,
              height: 48,
              child: CircularProgressIndicator(
                  color: AppTheme.primary, strokeWidth: 3)),
          const SizedBox(height: 18),
          Text("Analyse en cours...",
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(color: Colors.white)),
          const SizedBox(height: 4),
          const Text("VitalTrack AI",
              style: TextStyle(
                  fontFamily: 'SpaceMono',
                  fontSize: 11,
                  color: AppTheme.primary)),
        ],
      ),
    ),
  );
}

// ── SCAN RESULTS SHEET ────────────────────────────────────────────────────────
class _ScanResultsSheet extends StatelessWidget {
  final List<Food> foods;
  final int confidence;
  const _ScanResultsSheet(
      {required this.foods, required this.confidence});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Color(0xFF0D1410),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: Color(0x264ADE80)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // "Scan Complete" badge
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppTheme.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text("Scan Complet",
                      style: TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w600,
                          fontSize: 12)),
                ],
              ),
            ),
          ),

          // Title + confidence
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Éléments détectés",
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontSize: 20)),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.secondary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text("$confidence% CONFIANCE",
                      style: const TextStyle(
                          fontFamily: 'SpaceMono',
                          fontSize: 9,
                          color: AppTheme.secondary,
                          fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),

          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text("Vérifiez les résultats ci-dessous",
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(fontSize: 12)),
          ),

          const SizedBox(height: 16),

          // Detected items list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: foods.length,
              itemBuilder: (_, i) {
                final f = foods[i];
                final c = f.approved ? AppTheme.primary : AppTheme.error;
                return GestureDetector(
                  onTap: () {
                    Navigator.pop(context);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => FoodModal(food: f),
                    );
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: c.withValues(alpha: 0.15)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: c.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Center(
                            child: Text(f.emoji,
                                style: const TextStyle(fontSize: 24)),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(f.name,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14)),
                              const SizedBox(height: 2),
                              Text(
                                "${f.vitality.label} · ${f.scientific.label}",
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.edit_outlined,
                            color: AppTheme.textSecondary, size: 16),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Action buttons
          Padding(
            padding: EdgeInsets.fromLTRB(
                20, 8, 20, MediaQuery.of(context).padding.bottom + 16),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.1)),
                      ),
                      child: const Center(
                        child: Text("✦ Corriger",
                            style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: GestureDetector(
                    onTap: () {
                      final mealProvider = Provider.of<MealProvider>(context, listen: false);
                      for (final food in foods) {
                        mealProvider.addFood(food);
                      }
                      Navigator.pop(context);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
                        child: Text("Ajouter au repas",
                            style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}