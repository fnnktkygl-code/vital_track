// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'food.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ScientificDataAdapter extends TypeAdapter<ScientificData> {
  @override
  final int typeId = 1;

  @override
  ScientificData read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ScientificData(
      pral: fields[0] as double,
      density: fields[1] as int,
      label: fields[2] as String,
      colorValue: fields[3] as int,
    );
  }

  @override
  void write(BinaryWriter writer, ScientificData obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.pral)
      ..writeByte(1)
      ..write(obj.density)
      ..writeByte(2)
      ..write(obj.label)
      ..writeByte(3)
      ..write(obj.colorValue);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScientificDataAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class VitalityDataAdapter extends TypeAdapter<VitalityData> {
  @override
  final int typeId = 2;

  @override
  VitalityData read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return VitalityData(
      nova: fields[0] as int,
      freshness: fields[1] as int,
      label: fields[2] as String,
      colorValue: fields[3] as int,
    );
  }

  @override
  void write(BinaryWriter writer, VitalityData obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.nova)
      ..writeByte(1)
      ..write(obj.freshness)
      ..writeByte(2)
      ..write(obj.label)
      ..writeByte(3)
      ..write(obj.colorValue);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is VitalityDataAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class SpecificDataAdapter extends TypeAdapter<SpecificData> {
  @override
  final int typeId = 3;

  @override
  SpecificData read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return SpecificData(
      mucus: fields[0] as String,
      hybrid: fields[1] as bool,
      electric: fields[2] as bool,
      label: fields[3] as String,
      colorValue: fields[4] as int,
    );
  }

  @override
  void write(BinaryWriter writer, SpecificData obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.mucus)
      ..writeByte(1)
      ..write(obj.hybrid)
      ..writeByte(2)
      ..write(obj.electric)
      ..writeByte(3)
      ..write(obj.label)
      ..writeByte(4)
      ..write(obj.colorValue);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SpecificDataAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class FoodAdapter extends TypeAdapter<Food> {
  @override
  final int typeId = 0;

  @override
  Food read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Food(
      id: fields[0] as String,
      name: fields[1] as String,
      emoji: fields[2] as String,
      family: fields[3] as String,
      origin: fields[4] as String,
      approved: fields[5] as bool,
      scientific: fields[6] as ScientificData,
      vitality: fields[7] as VitalityData,
      specific: fields[8] as SpecificData,
      tags: (fields[9] as List).cast<String>(),
      note: fields[10] as String,
      addedAt: fields[11] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, Food obj) {
    writer
      ..writeByte(12)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.emoji)
      ..writeByte(3)
      ..write(obj.family)
      ..writeByte(4)
      ..write(obj.origin)
      ..writeByte(5)
      ..write(obj.approved)
      ..writeByte(6)
      ..write(obj.scientific)
      ..writeByte(7)
      ..write(obj.vitality)
      ..writeByte(8)
      ..write(obj.specific)
      ..writeByte(9)
      ..write(obj.tags)
      ..writeByte(10)
      ..write(obj.note)
      ..writeByte(11)
      ..write(obj.addedAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FoodAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
