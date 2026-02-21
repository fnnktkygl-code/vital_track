// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'fasting_session.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class FastingSessionAdapter extends TypeAdapter<FastingSession> {
  @override
  final int typeId = 8;

  @override
  FastingSession read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return FastingSession(
      id: fields[0] as String,
      type: fields[1] as FastingType,
      startTime: fields[2] as DateTime,
      plannedMinutes: fields[3] as int,
      endTime: fields[4] as DateTime?,
      notes: fields[5] as String,
      moodEmoji: fields[6] as String,
      protocol: fields[7] as String,
      preWeight: fields[8] as double?,
      postWeight: fields[9] as double?,
      preEnergy: fields[10] as int?,
      postEnergy: fields[11] as int?,
      preMood: fields[12] as String?,
      postMood: fields[13] as String?,
      programId: fields[14] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, FastingSession obj) {
    writer
      ..writeByte(15)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.type)
      ..writeByte(2)
      ..write(obj.startTime)
      ..writeByte(3)
      ..write(obj.plannedMinutes)
      ..writeByte(4)
      ..write(obj.endTime)
      ..writeByte(5)
      ..write(obj.notes)
      ..writeByte(6)
      ..write(obj.moodEmoji)
      ..writeByte(7)
      ..write(obj.protocol)
      ..writeByte(8)
      ..write(obj.preWeight)
      ..writeByte(9)
      ..write(obj.postWeight)
      ..writeByte(10)
      ..write(obj.preEnergy)
      ..writeByte(11)
      ..write(obj.postEnergy)
      ..writeByte(12)
      ..write(obj.preMood)
      ..writeByte(13)
      ..write(obj.postMood)
      ..writeByte(14)
      ..write(obj.programId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FastingSessionAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class FastingTypeAdapter extends TypeAdapter<FastingType> {
  @override
  final int typeId = 7;

  @override
  FastingType read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return FastingType.waterFast;
      case 1:
        return FastingType.juiceFast;
      case 2:
        return FastingType.fruitFast;
      case 3:
        return FastingType.grapeCure;
      case 4:
        return FastingType.drySunFast;
      case 5:
        return FastingType.intermittent;
      case 6:
        return FastingType.monoFruit;
      default:
        return FastingType.waterFast;
    }
  }

  @override
  void write(BinaryWriter writer, FastingType obj) {
    switch (obj) {
      case FastingType.waterFast:
        writer.writeByte(0);
        break;
      case FastingType.juiceFast:
        writer.writeByte(1);
        break;
      case FastingType.fruitFast:
        writer.writeByte(2);
        break;
      case FastingType.grapeCure:
        writer.writeByte(3);
        break;
      case FastingType.drySunFast:
        writer.writeByte(4);
        break;
      case FastingType.intermittent:
        writer.writeByte(5);
        break;
      case FastingType.monoFruit:
        writer.writeByte(6);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FastingTypeAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
