import 'package:flutter/material.dart';
import 'package:hive/hive.dart';

part 'food.g.dart';

@HiveType(typeId: 1)
class ScientificData {
  @HiveField(0)
  final double pral;
  @HiveField(1)
  final int density;
  @HiveField(2)
  final String label;
  @HiveField(3)
  final int colorValue;

  Color get color => Color(colorValue);

  const ScientificData({
    required this.pral,
    required this.density,
    required this.label,
    required this.colorValue,
  });
}

@HiveType(typeId: 2)
class VitalityData {
  @HiveField(0)
  final int nova;
  @HiveField(1)
  final int freshness;
  @HiveField(2)
  final String label;
  @HiveField(3)
  final int colorValue;

  Color get color => Color(colorValue);

  const VitalityData({
    required this.nova,
    required this.freshness,
    required this.label,
    required this.colorValue,
  });
}

@HiveType(typeId: 3)
class SpecificData {
  @HiveField(0)
  final String mucus; // "Mucogène", "Neutre", "Dissolvant"
  @HiveField(1)
  final bool hybrid;
  @HiveField(2)
  final bool electric;
  @HiveField(3)
  final String label;
  @HiveField(4)
  final int colorValue;

  Color get color => Color(colorValue);

  const SpecificData({
    required this.mucus,
    required this.hybrid,
    required this.electric,
    required this.label,
    required this.colorValue,
  });
}

@HiveType(typeId: 0)
class Food {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String name;
  @HiveField(2)
  final String emoji;
  @HiveField(3)
  final String family;
  @HiveField(4)
  final String origin;
  @HiveField(5)
  final bool approved;
  @HiveField(6)
  final ScientificData scientific;
  @HiveField(7)
  final VitalityData vitality;
  @HiveField(8)
  final SpecificData specific;
  @HiveField(9)
  final List<String> tags;
  @HiveField(10)
  final String note;
  @HiveField(11)
  final DateTime addedAt;

  Food({
    required this.id,
    required this.name,
    required this.emoji,
    required this.family,
    required this.origin,
    required this.approved,
    required this.scientific,
    required this.vitality,
    required this.specific,
    required this.tags,
    required this.note,
    DateTime? addedAt,
  }) : addedAt = addedAt ?? DateTime.now();
}
