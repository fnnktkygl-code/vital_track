import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/meal_provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/providers/profile_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/circadian_clock_card.dart';
import 'package:vital_track/ui/widgets/dashboard/breathing_dash_card.dart';
import 'package:vital_track/ui/widgets/dashboard/dashboard_header.dart';
import 'package:vital_track/ui/widgets/dashboard/diet_plan_dash_card.dart';
import 'package:vital_track/ui/widgets/dashboard/fasting_dash_card.dart';
import 'package:vital_track/ui/widgets/dashboard/smart_insight_card.dart';
import 'package:vital_track/ui/widgets/dashboard/tracked_today_section.dart';
import 'package:vital_track/ui/widgets/dashboard/vitality_arc_card.dart';

class DashboardView extends StatelessWidget {
  final VoidCallback? onOpenDrawer;
  const DashboardView({super.key, this.onOpenDrawer});

  @override
  Widget build(BuildContext context) {
    final modeProvider = Provider.of<ModeProvider>(context);
    final mealProvider = Provider.of<MealProvider>(context);
    final profileProvider = Provider.of<ProfileProvider>(context);
    final mode = modeProvider.currentMode;
    final mealScore = mealProvider.mealScore?.toDouble() ?? 0;
    final colors = context.colors;

    return Scaffold(
      floatingActionButton: const AddFab(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ProfileHeader(
              mode: mode,
              userName: profileProvider.profile.name,
              onOpenDrawer: onOpenDrawer,
            ),
            const Padding(
              padding: AppSpacing.screenH,
              child: WeekStrip(),
            ),
            const SizedBox(height: AppSpacing.xl),
            Padding(
              padding: AppSpacing.screenH,
              child: VitalityArcCard(score: mealScore, mode: mode),
            ),
            const SizedBox(height: AppSpacing.lg),
            const Padding(
              padding: AppSpacing.screenH,
              child: FastingDashCard(),
            ),
            const SizedBox(height: AppSpacing.lg),
            const Padding(
              padding: AppSpacing.screenH,
              child: DietPlanDashCard(),
            ),
            const SizedBox(height: AppSpacing.lg),
            const Padding(
              padding: AppSpacing.screenH,
              child: BreathingDashCard(),
            ),
            const SizedBox(height: AppSpacing.lg),
            Padding(
              padding: AppSpacing.screenH,
              child: SmartInsightCard(
                modeId: mode.id,
                mealItems: mealProvider.mealItems,
                mealScore: mealProvider.mealScore,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            if (mealProvider.mealItems.isNotEmpty)
              Padding(
                padding: AppSpacing.screenH,
                child: AxisDonutRow(items: mealProvider.mealItems),
              ),
            if (mealProvider.mealItems.isNotEmpty)
              const SizedBox(height: AppSpacing.xl),
            Padding(
              padding: AppSpacing.screenH,
              child: CircadianClockCard(colors: colors),
            ),
            const SizedBox(height: AppSpacing.xl),
            Padding(
              padding: AppSpacing.screenH,
              child: TrackedTodaySection(
                items: mealProvider.mealItems,
                mode: mode,
              ),
            ),
          ],
        ),
      ),
    );
  }
}