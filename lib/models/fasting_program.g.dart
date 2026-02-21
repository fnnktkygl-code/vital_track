// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'fasting_program.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class FastingProgramAdapter extends TypeAdapter<FastingProgram> {
  @override
  final int typeId = 9;

  @override
  FastingProgram read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return FastingProgram(
      id: fields[0] as String,
      name: fields[1] as String,
      targetObjective: fields[2] as String,
      startDate: fields[3] as DateTime,
      endDate: fields[4] as DateTime?,
      configs: (fields[5] as List).cast<FastingSessionConfig>(),
      protocol: fields[6] as String?,
      isActive: fields[7] as bool,
      currentConfigIndex: fields[8] as int,
    );
  }

  @override
  void write(BinaryWriter writer, FastingProgram obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.targetObjective)
      ..writeByte(3)
      ..write(obj.startDate)
      ..writeByte(4)
      ..write(obj.endDate)
      ..writeByte(5)
      ..write(obj.configs)
      ..writeByte(6)
      ..write(obj.protocol)
      ..writeByte(7)
      ..write(obj.isActive)
      ..writeByte(8)
      ..write(obj.currentConfigIndex);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FastingProgramAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class FastingSessionConfigAdapter extends TypeAdapter<FastingSessionConfig> {
  @override
  final int typeId = 10;

  @override
  FastingSessionConfig read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return FastingSessionConfig(
      type: fields[0] as FastingType,
      durationMinutes: fields[1] as int,
      breakHours: fields[2] as int,
    );
  }

  @override
  void write(BinaryWriter writer, FastingSessionConfig obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.type)
      ..writeByte(1)
      ..write(obj.durationMinutes)
      ..writeByte(2)
      ..write(obj.breakHours);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FastingSessionConfigAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
