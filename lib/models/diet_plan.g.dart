// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'diet_plan.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PlannedMealAdapter extends TypeAdapter<PlannedMeal> {
  @override
  final int typeId = 16;

  @override
  PlannedMeal read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PlannedMeal(
      slot: fields[0] as String,
      items: (fields[1] as List).cast<String>(),
      note: fields[2] as String,
      done: fields[3] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, PlannedMeal obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.slot)
      ..writeByte(1)
      ..write(obj.items)
      ..writeByte(2)
      ..write(obj.note)
      ..writeByte(3)
      ..write(obj.done);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PlannedMealAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class DietDayAdapter extends TypeAdapter<DietDay> {
  @override
  final int typeId = 15;

  @override
  DietDay read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return DietDay(
      dayIndex: fields[0] as int,
      date: fields[1] as DateTime,
      phaseLabel: fields[2] as String,
      meals: (fields[3] as List).cast<PlannedMeal>(),
      dayNote: fields[4] as String,
    );
  }

  @override
  void write(BinaryWriter writer, DietDay obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.dayIndex)
      ..writeByte(1)
      ..write(obj.date)
      ..writeByte(2)
      ..write(obj.phaseLabel)
      ..writeByte(3)
      ..write(obj.meals)
      ..writeByte(4)
      ..write(obj.dayNote);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DietDayAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class DietPlanAdapter extends TypeAdapter<DietPlan> {
  @override
  final int typeId = 14;

  @override
  DietPlan read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return DietPlan(
      id: fields[0] as String,
      name: fields[1] as String,
      protocol: fields[2] as String,
      objective: fields[3] as String,
      startDate: fields[4] as DateTime,
      days: (fields[5] as List).cast<DietDay>(),
      isActive: fields[6] as bool,
      endDate: fields[7] as DateTime?,
      source: fields[8] as String,
      restrictions: fields[9] as String,
    );
  }

  @override
  void write(BinaryWriter writer, DietPlan obj) {
    writer
      ..writeByte(10)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.protocol)
      ..writeByte(3)
      ..write(obj.objective)
      ..writeByte(4)
      ..write(obj.startDate)
      ..writeByte(5)
      ..write(obj.days)
      ..writeByte(6)
      ..write(obj.isActive)
      ..writeByte(7)
      ..write(obj.endDate)
      ..writeByte(8)
      ..write(obj.source)
      ..writeByte(9)
      ..write(obj.restrictions);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DietPlanAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
