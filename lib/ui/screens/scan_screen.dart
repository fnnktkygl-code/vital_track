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
import 'package:vital_track/ui/widgets/ai_loading_animation.dart';

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
      builder: (ctx) {
        final dlgColors = ctx.colors;
        return AlertDialog(
          backgroundColor: dlgColors.sheetBg,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: dlgColors.accent.withValues(alpha: 0.2))),
          title: Text("Utiliser l'IA ?",
              style: TextStyle(color: dlgColors.textPrimary, fontSize: 18)),
          content: Text(
              "L'analyse visuelle consomme 1 crédit par requête. Voulez-vous continuer ?",
              style: TextStyle(color: dlgColors.textSecondary)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text("Annuler",
                  style: TextStyle(color: dlgColors.textSecondary)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text("Analyser",
                  style: TextStyle(
                      color: dlgColors.accent, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
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
      backgroundColor: error ? context.colors.error : context.colors.surface,
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
                            fontSize: 15),
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
                        style: TextStyle(color: Colors.white70, fontSize: 14),
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
            fontSize: 14,
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
  Widget build(BuildContext context) {
    final accent = context.colors.accent;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.black.withValues(alpha: 0.5),
          border: Border.all(
            color: active
                ? accent.withValues(alpha: 0.6)
                : Colors.white.withValues(alpha: 0.2),
          ),
        ),
        child: Icon(icon,
            color: active ? accent : Colors.white, size: 18),
      ),
    );
  }
}

// ── PROCESSING OVERLAY ────────────────────────────────────────────────────────
class _ProcessingOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withValues(alpha: 0.72),
      child: const Center(
        child: AiLoadingAnimation(
          initialTitle: "Analyse en cours...",
          darkMode: true,
        ),
      ),
    );
  }
}

// ── SCAN RESULTS SHEET ────────────────────────────────────────────────────────
class _ScanResultsSheet extends StatefulWidget {
  final List<Food> foods;
  final int confidence;
  const _ScanResultsSheet({
    required this.foods,
    required this.confidence,
  });

  @override
  State<_ScanResultsSheet> createState() => _ScanResultsSheetState();
}

class _ScanResultsSheetState extends State<_ScanResultsSheet> {
  late List<Food> _currentFoods;
  late Set<int> _selectedIndices;
  bool _isEditing = false;
  bool _isAddingItem = false;
  final TextEditingController _addController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _currentFoods = List.from(widget.foods);
    // Auto-select all by default
    _selectedIndices = Set.from(Iterable.generate(_currentFoods.length));
  }

  @override
  void dispose() {
    _addController.dispose();
    super.dispose();
  }

  Future<void> _addIngredient(String text) async {
    if (text.trim().isEmpty) return;
    setState(() => _isAddingItem = true);
    try {
      final json = await AIService.analyzeText(text.trim());
      if (!mounted) return;
      if (json != null) {
        final foods = FoodMapper.fromAIJsonList(json);
        if (foods.isNotEmpty) {
          setState(() {
            final startIdx = _currentFoods.length;
            _currentFoods.addAll(foods);
            for (int i = startIdx; i < _currentFoods.length; i++) {
              _selectedIndices.add(i);
            }
            _addController.clear();
          });
        }
      }
    } finally {
      if (mounted) setState(() => _isAddingItem = false);
    }
  }

  void _removeItem(int index) {
    setState(() {
      _currentFoods.removeAt(index);
      // Rebuild selection indices
      _selectedIndices = Set.from(
        _selectedIndices
            .where((i) => i != index)
            .map((i) => i > index ? i - 1 : i),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: BoxDecoration(
        color: colors.sheetBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: colors.accent.withValues(alpha: 0.15)),
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
                color: colors.borderSubtle,
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
                color: colors.accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: colors.accent.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: colors.accent,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text("Scan Complet",
                      style: TextStyle(
                          color: colors.accent,
                          fontWeight: FontWeight.w600,
                          fontSize: 13)),
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
                    color: colors.accentSecondary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text("${widget.confidence}% CONFIANCE",
                      style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: colors.accentSecondary,
                          letterSpacing: 0.5)),
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
                    ?.copyWith(fontSize: 13)),
          ),

          const SizedBox(height: 16),

          // ── Edit mode: add ingredient field ──
          if (_isEditing)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _addController,
                      style: TextStyle(color: colors.textPrimary, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: "Ex: riz, œufs, avocat...",
                        hintStyle: TextStyle(color: colors.textTertiary, fontSize: 13),
                        helperText: "Séparez par des virgules pour l'IA",
                        helperStyle: TextStyle(color: colors.accent.withValues(alpha: 0.7), fontSize: 11),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        filled: true,
                        fillColor: colors.surface,
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
                          borderSide: BorderSide(color: colors.accent),
                        ),
                      ),
                      onSubmitted: (val) => _addIngredient(val),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _isAddingItem
                        ? null
                        : () => _addIngredient(_addController.text),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: colors.accent,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: _isAddingItem
                          ? Padding(
                              padding: const EdgeInsets.all(12),
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: colors.accentOnPrimary,
                              ),
                            )
                          : Icon(Icons.add_rounded,
                              color: colors.accentOnPrimary, size: 22),
                    ),
                  ),
                ],
              ),
            ),

          // Detected items list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: _currentFoods.length,
              itemBuilder: (ctx, i) {
                final f = _currentFoods[i];
                final isSelected = _selectedIndices.contains(i);
                final c = isSelected ? (f.approved ? colors.accent : colors.error) : colors.border;
                return Dismissible(
                  key: ValueKey(f.id),
                  direction: DismissDirection.endToStart,
                  onDismissed: (_) => _removeItem(i),
                  background: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    decoration: BoxDecoration(
                      color: colors.error,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(Icons.delete_outline, color: Colors.white),
                  ),
                  child: GestureDetector(
                    onTap: _isEditing
                        ? null
                        : () {
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
                        color: isSelected
                            ? colors.surfaceSubtle.withValues(alpha: 0.5)
                            : colors.surface,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                            color: isSelected ? c.withValues(alpha: 0.5) : colors.borderSubtle),
                      ),
                      child: Row(
                        children: [
                          if (!_isEditing)
                            GestureDetector(
                              onTap: () {
                                setState(() {
                                  if (isSelected) {
                                    _selectedIndices.remove(i);
                                  } else {
                                    _selectedIndices.add(i);
                                  }
                                });
                              },
                              child: Container(
                                width: 24,
                                height: 24,
                                margin: const EdgeInsets.only(right: 14),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isSelected ? colors.accent : Colors.transparent,
                                  border: Border.all(
                                    color: isSelected ? colors.accent : colors.iconMuted,
                                    width: 2,
                                  ),
                                ),
                                child: isSelected
                                    ? Icon(Icons.check, size: 16, color: colors.accentOnPrimary)
                                    : null,
                              ),
                            ),
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: c.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Center(
                              child: Text(f.emoji,
                                  style: const TextStyle(fontSize: 22)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(f.name,
                                    style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 15,
                                        color: isSelected ? colors.textPrimary : colors.textSecondary)),
                                const SizedBox(height: 2),
                                Text(
                                  "${f.vitality.label} · ${f.scientific.label}",
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: isSelected ? colors.textSecondary : colors.textTertiary),
                                ),
                              ],
                            ),
                          ),
                          if (_isEditing)
                            GestureDetector(
                              onTap: () => _removeItem(i),
                              child: Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: colors.error.withValues(alpha: 0.1),
                                ),
                                child: Icon(Icons.remove_circle_rounded,
                                    color: colors.error, size: 20),
                              ),
                            )
                          else
                            Icon(Icons.edit_outlined,
                                color: colors.textTertiary, size: 16),
                        ],
                      ),
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
                    onTap: () {
                      if (_isAddingItem) return;
                      setState(() => _isEditing = !_isEditing);
                    },
                    behavior: HitTestBehavior.opaque, // Ensure it catches all taps
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      decoration: BoxDecoration(
                        color: _isEditing
                            ? colors.accent.withValues(alpha: 0.15)
                            : colors.surfaceSubtle,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _isEditing ? colors.accent : colors.border,
                          width: _isEditing ? 2 : 1,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          _isEditing ? "Terminé" : "✦ Corriger",
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: _isEditing
                                ? colors.accent
                                : colors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: GestureDetector(
                    onTap: () {
                      if (_selectedIndices.isEmpty || _isEditing) return;
                      final mealProvider = Provider.of<MealProvider>(context, listen: false);
                      for (final index in _selectedIndices) {
                        mealProvider.addFood(_currentFoods[index]);
                      }
                      Navigator.pop(context);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      decoration: BoxDecoration(
                        color: (_selectedIndices.isEmpty || _isEditing)
                            ? colors.surfaceSubtle
                            : colors.accent,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Center(
                        child: Text(
                          _selectedIndices.isEmpty
                              ? "Sélectionnez des éléments"
                              : "Ajouter (${_selectedIndices.length}) au repas",
                            style: TextStyle(
                                color: (_selectedIndices.isEmpty || _isEditing)
                                    ? colors.textTertiary
                                    : colors.accentOnPrimary,
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