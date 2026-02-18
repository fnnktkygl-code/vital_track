import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/ui/widgets/bottom_nav_bar.dart';
import 'package:vital_track/ui/widgets/mascot_widget.dart';
import 'package:vital_track/ui/widgets/add_meal_sheet.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/providers/mascot_provider.dart';
import 'package:vital_track/ui/screens/dashboard_view.dart';
import 'package:vital_track/ui/screens/search_screen.dart';

import 'package:vital_track/ui/screens/modes_screen.dart';
import 'package:vital_track/ui/screens/favorites_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  bool _mascotInitialized = false;

  final List<Widget> _screens = const [
    DashboardView(),
    SearchScreen(),
    SizedBox(), // Placeholder for 'Ajouter' which opens modal
    FavoritesScreen(),
    ModesScreen(),
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_mascotInitialized) {
      _mascotInitialized = true;
      // Fire welcome message after first frame
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final modeId =
            context.read<ModeProvider>().currentMode.id;
        context.read<MascotProvider>().onAppLaunch(modeId);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          // Screens
          IndexedStack(
            index: _currentIndex,
            children: _screens,
          ),

          // ── MASCOT OVERLAY (on all screens) ───────────────────────────
          const MascotOverlay(),
        ],
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          if (index == 2) {
             // Open Add Meal Sheet
             // Triggering it from here
             // We don't change _currentIndex to 2 immediately or maybe we do?
             // Usually FAB actions don't change Tab.
             // But user asked for it to be a Nav Bar item.
             // Let's just open the sheet and NOT change index.
             // Or change index? If we change index, we need a screen.
             // Let's open the sheet.
             
             // Dynamic import if needed? No, need to import widget at top.
             // Assume AddMealSheet is imported or needs import.
             // I need to add import.
             showModalBottomSheet(
               context: context,
               isScrollControlled: true,
               backgroundColor: Colors.transparent,
               builder: (context) => const AddMealSheet(),
             );
             return;
          }
          setState(() => _currentIndex = index);

          // Trigger mode-screen mascot tip
          if (index == 4) {
            final mascot = context.read<MascotProvider>();
            Future.delayed(const Duration(milliseconds: 400), () {
              mascot.showRandomTip();
            });
          }
        },
      ),
    );
  }
}