import 'package:vital_track/services/ai_service.dart';
import 'package:vital_track/services/hive_service.dart';

class ProfileProvider with ChangeNotifier {
  final HiveService _hiveService = HiveService();
  static const String _boxName = 'profileBox';
  static const String _key = 'userProfile';
  late Box _box;

  Profile _profile = const Profile();
  Profile get profile => _profile;

  String get geminiApiKey => _hiveService.loadApiKey() ?? '';

  bool _isInitialized = false;

  ProfileProvider() {
    _init();
  }

  Future<void> _init() async {
    _box = await Hive.openBox(_boxName);
    final data = _box.get(_key);
    if (data != null) {
      // Hive stores Map<dynamic, dynamic>, need to cast for JSON
      final jsonMap = jsonDecode(jsonEncode(data)); 
      _profile = Profile.fromJson(jsonMap);
    }
    _isInitialized = true;
    notifyListeners();
  }

  Future<void> updateProfile({
    String? name,
    List<String>? goals,
    List<String>? restrictions,
    Map<String, dynamic>? vitalMetrics,
  }) async {
    _profile = _profile.copyWith(
      name: name,
      goals: goals,
      restrictions: restrictions,
      vitalMetrics: vitalMetrics,
    );
    notifyListeners();
    await _save();
  }

  Future<void> _save() async {
    if (!_isInitialized) return;
    await _box.put(_key, _profile.toJson());
  }

  // Helpers to toggle specific items
  Future<void> toggleGoal(String goal) async {
    final current = List<String>.from(_profile.goals);
    if (current.contains(goal)) {
      current.remove(goal);
    } else {
      current.add(goal);
    }
    await updateProfile(goals: current);
  }

  Future<void> toggleRestriction(String restriction) async {
    final current = List<String>.from(_profile.restrictions);
    if (current.contains(restriction)) {
      current.remove(restriction);
    } else {
      current.add(restriction);
    }
    await updateProfile(restrictions: current);
  }

  Future<void> updateApiKey(String key) async {
    await _hiveService.saveApiKey(key);
    AIService.resetKeyCache();
    notifyListeners();
  }
}
