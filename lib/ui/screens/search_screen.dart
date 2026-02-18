import 'package:flutter/material.dart';
import 'dart:async';

import 'package:vital_track/data/mock_data.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/services/vital_rules_engine.dart';
import 'package:vital_track/services/open_food_facts_service.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/utils/food_mapper.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/food_modal.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final OpenFoodFactsService _offService = OpenFoodFactsService();

  List<Food> _results = [];
  bool _isLoading = false;

  final HiveService _hiveService = HiveService();
  List<Food> _history = [];
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  void _loadHistory() {
    setState(() {
      _history = _hiveService.loadHistory();
      if (_history.isEmpty) {
        _results = MockData.foods.take(5).toList();
      } else {
        _results = _history;
      }
    });
  }

  Future<void> _addToHistory(Food food) async {
    await _hiveService.addToHistory(food);
    if (_searchController.text.isEmpty) _loadHistory();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query) async {
    if (_debounce?.isActive ?? false) _debounce!.cancel();

    _debounce = Timer(const Duration(milliseconds: 500), () async {
      if (query.trim().isEmpty) {
        _loadHistory();
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      if (mounted) setState(() => _isLoading = true);

      try {
        List<Food> expertResults = [];
        try {
          expertResults = VitalRulesEngine.searchExpertDb(query);
        } catch (_) {}

        final offRawResults = await _offService.searchProducts(query);
        final offResults = offRawResults
            .map((json) => FoodMapper.fromOpenFoodFacts(json))
            .toList();

        bool hasExpertMatch = expertResults.any((e) =>
        e.name.toLowerCase() == query.toLowerCase() ||
            e.name.toLowerCase().contains(query.toLowerCase()));

        final expertIds =
        expertResults.map((e) => e.name.toLowerCase()).toSet();

        final filteredOffResults = offResults.where((f) {
          final nameLower = f.name.toLowerCase();
          final queryLower = query.toLowerCase();
          if (expertIds.contains(nameLower)) return false;
          if (hasExpertMatch) {
            final junkTerms = [
              'muesli', 'yaourt', 'compote', 'dessert', 'gâteau', 'biscuit', 'tarte'
            ];
            for (final junk in junkTerms) {
              if (nameLower.contains(junk) && !queryLower.contains(junk))
                return false;
            }
            if (f.vitality.nova >= 3) return false;
          }
          return nameLower.contains(queryLower);
        }).toList();

        if (mounted) {
          setState(() {
            _results = [...expertResults, ...filteredOffResults];
            _isLoading = false;
          });
        }
      } catch (_) {
        if (mounted) setState(() {
          _results = [];
          _isLoading = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 14, 24, 0),
              child: Row(
                children: [
                  Text("Recherche Vitaliste",
                      style: Theme.of(context).textTheme.titleLarge),
                  const Spacer(),
                  if (_isLoading)
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: colors.accent,
                      ),
                    ),
                ],
              ),
            ),

            // Search field
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: Container(
                decoration: BoxDecoration(
                  color: colors.surfaceSubtle,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: colors.border),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  children: [
                    const SizedBox(width: 8),
                    Icon(Icons.search, color: colors.iconMuted, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) {
                          if (val.length > 2) _performSearch(val);
                          if (val.isEmpty) _loadHistory();
                        },
                        style: TextStyle(color: colors.textPrimary),
                        decoration: InputDecoration(
                          hintText: "Aliment, marque...",
                          hintStyle: TextStyle(color: colors.textTertiary),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 14),
                          // Override to remove filled/border from inputDecorationTheme inside this custom container
                          fillColor: Colors.transparent,
                          filled: false,
                        ),
                      ),
                    ),
                    if (_searchController.text.isNotEmpty)
                      GestureDetector(
                        onTap: () {
                          _searchController.clear();
                          _loadHistory();
                        },
                        child: Icon(Icons.close, color: colors.iconMuted, size: 18),
                      ),
                  ],
                ),
              ),
            ),

            // Result count
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "${_results.length} RÉSULTATS",
                  style: Theme.of(context).textTheme.labelSmall,
                ),
              ),
            ),

            // Results list
            Expanded(
              child: _results.isEmpty
                  ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text("🔍", style: TextStyle(fontSize: 36)),
                    const SizedBox(height: 12),
                    Text("Aucun résultat",
                        style: TextStyle(color: colors.textSecondary)),
                  ],
                ),
              )
                  : ListView.builder(
                padding: const EdgeInsets.symmetric(
                    horizontal: 24, vertical: 8),
                itemCount: _results.length,
                itemBuilder: (context, index) {
                  final f = _results[index];
                  return GestureDetector(
                    onTap: () {
                      _addToHistory(f);
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (context) => FoodModal(food: f),
                      );
                    },
                    child: _buildFoodCard(context, f, colors),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFoodCard(BuildContext context, Food f, AppColors colors) {
    final c = f.approved ? colors.accent : colors.error;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: c.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: c.withValues(alpha: 0.2)),
            ),
            child: Text(f.emoji, style: const TextStyle(fontSize: 28)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(f.name,
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    )),
                const SizedBox(height: 2),
                Text(f.family,
                    style: TextStyle(color: colors.textTertiary, fontSize: 12)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    if (f.tags.contains("Expert Verified"))
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: Icon(Icons.verified,
                            size: 14, color: colors.accent),
                      ),
                    _buildTag(f.scientific.label, f.scientific.color),
                    const SizedBox(width: 6),
                    _buildTag(f.specific.label, f.specific.color),
                  ],
                ),
              ],
            ),
          ),
          Text(f.approved ? "✅" : "⚠️",
              style: const TextStyle(fontSize: 18)),
        ],
      ),
    );
  }

  Widget _buildTag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 10, color: color, fontWeight: FontWeight.bold),
      ),
    );
  }
}