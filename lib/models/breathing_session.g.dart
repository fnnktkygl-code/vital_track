// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'breathing_session.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class BreathingSessionAdapter extends TypeAdapter<BreathingSession> {
  @override
  final int typeId = 12;

  @override
  BreathingSession read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return BreathingSession(
      id: fields[0] as String,
      type: fields[1] as BreathingType,
      startTime: fields[2] as DateTime,
      rounds: fields[3] as int,
      totalSeconds: fields[4] as int,
      retentionTimes: (fields[5] as List?)?.cast<int>(),
      endTime: fields[6] as DateTime?,
      moodEmoji: fields[7] as String,
      notes: fields[8] as String,
      protocol: fields[9] as String,
    );
  }

  @override
  void write(BinaryWriter writer, BreathingSession obj) {
    writer
      ..writeByte(10)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.type)
      ..writeByte(2)
      ..write(obj.startTime)
      ..writeByte(3)
      ..write(obj.rounds)
      ..writeByte(4)
      ..write(obj.totalSeconds)
      ..writeByte(5)
      ..write(obj.retentionTimes)
      ..writeByte(6)
      ..write(obj.endTime)
      ..writeByte(7)
      ..write(obj.moodEmoji)
      ..writeByte(8)
      ..write(obj.notes)
      ..writeByte(9)
      ..write(obj.protocol);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BreathingSessionAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class BreathingTypeAdapter extends TypeAdapter<BreathingType> {
  @override
  final int typeId = 11;

  @override
  BreathingType read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return BreathingType.whm;
      case 1:
        return BreathingType.relaxation;
      case 2:
        return BreathingType.box;
      case 3:
        return BreathingType.coherence;
      default:
        return BreathingType.whm;
    }
  }

  @override
  void write(BinaryWriter writer, BreathingType obj) {
    switch (obj) {
      case BreathingType.whm:
        writer.writeByte(0);
        break;
      case BreathingType.relaxation:
        writer.writeByte(1);
        break;
      case BreathingType.box:
        writer.writeByte(2);
        break;
      case BreathingType.coherence:
        writer.writeByte(3);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BreathingTypeAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
