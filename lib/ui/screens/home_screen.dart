import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/services/update_service.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/bottom_nav_bar.dart';
import 'package:vital_track/ui/widgets/add_meal_sheet.dart';
import 'package:vital_track/providers/mode_provider.dart';

import 'package:vital_track/providers/mascot_provider.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/providers/profile_provider.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/ui/screens/dashboard_view.dart';
import 'package:vital_track/ui/screens/search_screen.dart';
import 'package:vital_track/ui/screens/profile_screen.dart';
import 'package:vital_track/ui/screens/favorites_screen.dart';
import 'package:vital_track/ui/screens/fasting_screen.dart';
import 'package:vital_track/ui/screens/knowledge_admin_screen.dart';
import 'package:vital_track/providers/breathing_provider.dart';
import 'package:vital_track/models/breathing_session.dart';
import 'package:vital_track/ui/screens/breathing_screen.dart';
import 'package:vital_track/ui/screens/chat_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  bool _mascotInitialized = false;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  late final List<Widget> _screens = [
    DashboardView(onOpenDrawer: openDrawer),
    const SizedBox(), // Placeholder – Ajouter opens modal
    const SearchScreen(),
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_mascotInitialized) {
      _mascotInitialized = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        // Show health disclaimer on first launch
        _showDisclaimerIfNeeded();
        // Check for updates
        UpdateService.checkForUpdates(context);
        
        final modeId = context.read<ModeProvider>().currentMode.id;
        context.read<MascotProvider>().onAppLaunch(modeId);
      });

      // Listen for fasting check-ins and symptom responses
      final fp = context.read<FastingProvider>();
      fp.addListener(() => _onFastingUpdate(fp));
    }
  }

  void _showDisclaimerIfNeeded() {
    final hive = HiveService();
    final accepted = hive.settingsBox.get('disclaimer_accepted', defaultValue: false);
    if (accepted == true) return;
    if (!mounted) return;

    final colors = context.colors;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.health_and_safety, color: Colors.redAccent, size: 28),
            const SizedBox(width: 10),
            Expanded(
              child: Text('Avertissement santé',
                style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18)),
            ),
          ],
        ),
        content: Text(
          'Cette application ne remplace pas un avis médical.\n\n'
          'Consultez un professionnel de santé avant de modifier votre alimentation '
          'ou de pratiquer le jeûne.\n\n'
          'Les approches présentées sont à titre informatif et éducatif uniquement.',
          style: TextStyle(color: colors.textSecondary, height: 1.45),
        ),
        actions: [
          TextButton(
            onPressed: () {
              hive.settingsBox.put('disclaimer_accepted', true);
              Navigator.of(ctx).pop();
            },
            child: Text("J'ai compris", style: TextStyle(color: colors.accent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _onFastingUpdate(FastingProvider fp) {
    if (!mounted) return;

    // Show pending check-in via mascot
    final checkIn = fp.pendingCheckIn;
    if (checkIn != null) {
      final mascot = context.read<MascotProvider>();
      mascot.onFastingCheckIn(checkIn, (reply) {
        fp.reportSymptom(reply);
      });
      fp.dismissCheckIn(); // Mark as triggered
    }

    // Show symptom advice after user replies
    final symptom = fp.lastSymptomResponse;
    if (symptom != null) {
      final profile = context.read<ProfileProvider>();
      final advice = fp.getAdviceForLastSymptom(
        bodyType: profile.profile.bodyType.isNotEmpty ? profile.profile.bodyType : null,
      );
      if (advice != null) {
        // Delay slightly so the mascot dismiss animation completes
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) {
            context.read<MascotProvider>().onFastingSymptomAdvice(advice);
          }
        });
      }
      fp.clearSymptomResponse();
    }
  }

  void openDrawer() {
    _scaffoldKey.currentState?.openDrawer();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      extendBody: true,
      drawer: const _AppDrawer(),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          if (index == 1) {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (context) => const AddMealSheet(),
            );
            return;
          }
          setState(() => _currentIndex = index);

          final mascot = context.read<MascotProvider>();
          
          if (index == 0) {
            mascot.setContext("dashboard");
          } else if (index == 2) {
            mascot.setContext("search");
            Future.delayed(const Duration(milliseconds: 400), () {
              mascot.showRandomTip();
            });
          }
        },
      ),
    );
  }
}

// ── APP DRAWER ───────────────────────────────────────────────────────────────

class _AppDrawer extends StatelessWidget {
  const _AppDrawer();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final fp = context.watch<FastingProvider>();
    final bp = context.watch<BreathingProvider>();
    final pp = context.watch<ProfileProvider>();
    final profile = pp.profile;
    final userName = profile.name.trim().isEmpty ? "Utilisateur" : profile.name;
    final userLabel = "@${userName.toLowerCase().replaceAll(' ', '')}";

    return Drawer(
      backgroundColor: colors.sheetBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // ── Header
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  final nav = Navigator.of(context);
                  nav.pop(); // close drawer
                  nav.push(MaterialPageRoute(builder: (_) => const ProfileScreen()));
                },
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: colors.surfaceSubtle,
                        shape: BoxShape.circle,
                        border: Border.all(color: colors.borderSubtle, width: 1.5),
                        boxShadow: [
                           BoxShadow(color: colors.shadowBase.withValues(alpha: 0.1), blurRadius: 4, offset: const Offset(0, 2))
                        ],
                      ),
                      child: Icon(Icons.person_rounded, color: colors.iconMuted, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(userName,
                              style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(height: 2),
                          Text(userLabel,
                              style: TextStyle(
                                  color: colors.textTertiary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded, color: colors.iconMuted, size: 22),
                  ],
                ),
              ),
            ),

            Divider(color: colors.borderSubtle, indent: 24, endIndent: 24),

            const SizedBox(height: 8),

            // ── Menu Items (scrollable to prevent overflow)
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _DrawerItem(
                      emoji: '❤️',
                      label: 'Favoris',
                      subtitle: 'Aliments enregistrés',
                      colors: colors,
                      onTap: () {
                        final nav = Navigator.of(context);
                        nav.pop();
                        nav.push(MaterialPageRoute(builder: (_) => const FavoritesScreen()));
                      },
                    ),

                    _DrawerItem(
                      emoji: '🌿',
                      label: 'Jeûne',
                      subtitle: fp.isFasting
                          ? '${fp.activeFast!.type.label} en cours'
                          : 'Planifier un jeûne',
                      colors: colors,
                      badge: fp.isFasting ? fp.phaseLabel : null,
                      onTap: () {
                        final nav = Navigator.of(context);
                        nav.pop();
                        nav.push(MaterialPageRoute(builder: (_) => const FastingScreen()));
                      },
                    ),

                    _DrawerItem(
                      emoji: '🌬️',
                      label: 'Respiration',
                      subtitle: bp.isBreathing
                          ? '${bp.activeSession!.type.label} en cours'
                          : 'Exercices de respiration',
                      colors: colors,
                      badge: bp.isBreathing ? bp.phaseLabel : null,
                      onTap: () {
                        final nav = Navigator.of(context);
                        nav.pop();
                        nav.push(MaterialPageRoute(builder: (_) => const BreathingScreen()));
                      },
                    ),

                    _DrawerItem(
                      emoji: '🐦',
                      label: 'Chat IA',
                      subtitle: 'Discuter avec l\'assistant',
                      colors: colors,
                      onTap: () {
                        final nav = Navigator.of(context);
                        nav.pop();
                        nav.push(MaterialPageRoute(builder: (_) => const ChatScreen()));
                      },
                    ),

                    _DrawerItem(
                      emoji: '📚',
                      label: 'Base de connaissances',
                      subtitle: 'Sources & documents',
                      colors: colors,
                      onTap: () {
                        final nav = Navigator.of(context);
                        nav.pop();
                        nav.push(MaterialPageRoute(
                            builder: (_) => const KnowledgeAdminScreen()));
                      },
                    ),

                    _DrawerItem(
                      emoji: '⚙️',
                      label: 'Réglages',
                      subtitle: 'Thème, profil, notifications',
                      colors: colors,
                      onTap: () {
                        final nav = Navigator.of(context);
                        nav.pop();
                        nav.push(MaterialPageRoute(builder: (_) => const ProfileScreen()));
                      },
                    ),
                  ],
                ),
              ),
            ),

            // ── Footer
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
              child: Row(
                children: [
                  Text('🌱',
                      style: TextStyle(
                          fontSize: 14, color: colors.textTertiary)),
                  const SizedBox(width: 8),
                  Text('VitalTrack v1.0',
                      style: TextStyle(
                          color: colors.textTertiary,
                          fontSize: 12,
                          fontWeight: FontWeight.w500)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final String emoji;
  final String label;
  final String subtitle;
  final AppColors colors;
  final String? badge;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.emoji,
    required this.label,
    required this.subtitle,
    required this.colors,
    this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            child: Row(
              children: [
                Text(emoji, style: const TextStyle(fontSize: 22)),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(label,
                          style: TextStyle(
                              color: colors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text(subtitle,
                          style: TextStyle(
                              color: colors.textTertiary, fontSize: 12)),
                    ],
                  ),
                ),
                if (badge != null) ...[
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: colors.accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(badge!,
                        style: TextStyle(
                            color: colors.accent,
                            fontSize: 11,
                            fontWeight: FontWeight.w600)),
                  ),
                ] else
                  Icon(Icons.chevron_right_rounded,
                      color: colors.iconMuted, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}