import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/theme_provider.dart';
import 'package:vital_track/providers/meal_provider.dart';
import 'package:vital_track/providers/scan_provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/providers/mascot_provider.dart';
import 'package:vital_track/providers/profile_provider.dart';
import 'package:vital_track/providers/favorites_provider.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/providers/breathing_provider.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/services/knowledge_service.dart';
import 'package:vital_track/services/vital_rules_engine.dart';
import 'package:vital_track/ui/widgets/mascot_widget.dart';
import 'package:vital_track/ui/screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final hiveService = HiveService();
  try {
    await hiveService.init();
  } catch (e) {
    debugPrint("Hive init failed: $e. Attempting recovery...");
    try {
      await hiveService.deleteAll();
      await hiveService.init();
    } catch (_) {
      debugPrint("Hive recovery failed. App may not persist data.");
    }
  }

  await VitalRulesEngine.loadRules();

  // Seed default knowledge base on first launch
  final knowledgeService = KnowledgeService(hiveService);
  await knowledgeService.seedDefaultSources();

  // Re-upload expired Gemini files in background (non-blocking)
  knowledgeService.refreshExpiredFiles().catchError((e) {
    debugPrint("File refresh failed: $e");
  });

  runApp(VitalTrackApp(hiveService: hiveService));
}

class VitalTrackApp extends StatelessWidget {
  final HiveService hiveService;
  const VitalTrackApp({super.key, required this.hiveService});

  static final navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => MascotProvider()),
        ChangeNotifierProxyProvider<MascotProvider, MealProvider>(
          create: (_) => MealProvider(),
          update: (_, mascot, meal) => meal!..setMascotProvider(mascot),
        ),
        ChangeNotifierProvider(create: (_) => ModeProvider(hiveService)),
        ChangeNotifierProvider(create: (_) => ThemeProvider(hiveService)),
        ChangeNotifierProvider(create: (_) => ScanProvider()),
        ChangeNotifierProvider(create: (_) => ProfileProvider()),
        ChangeNotifierProvider(create: (_) => FavoritesProvider()),
        ChangeNotifierProvider(create: (_) => FastingProvider(hiveService)),
        ChangeNotifierProvider(create: (_) => BreathingProvider(hiveService)),
      ],
      child: Consumer<ThemeProvider>(
        builder: (ctx, themeProv, child) {
          return MaterialApp(
            title: 'VitalTrack',
            navigatorKey: navigatorKey,
            theme: themeProv.themeData,
            debugShowCheckedModeBanner: false,
            builder: (context, child) {
              return Stack(
                children: [
                  // ignore: use_null_aware_elements
                  if (child != null) child,
                  MascotOverlay(navigatorKey: navigatorKey),
                ],
              );
            },
            home: const HomeScreen(),
          );
        },
      ),
    );
  }
}
