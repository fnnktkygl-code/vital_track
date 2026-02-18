// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'knowledge_source.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class KnowledgeSourceAdapter extends TypeAdapter<KnowledgeSource> {
  @override
  final int typeId = 6;

  @override
  KnowledgeSource read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return KnowledgeSource(
      id: fields[0] as String,
      title: fields[1] as String,
      content: fields[2] as String,
      type: fields[3] as KnowledgeType,
      sourceUrl: fields[4] as String?,
      addedDate: fields[5] as DateTime,
      chunks: (fields[6] as List).cast<String>(),
    );
  }

  @override
  void write(BinaryWriter writer, KnowledgeSource obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.title)
      ..writeByte(2)
      ..write(obj.content)
      ..writeByte(3)
      ..write(obj.type)
      ..writeByte(4)
      ..write(obj.sourceUrl)
      ..writeByte(5)
      ..write(obj.addedDate)
      ..writeByte(6)
      ..write(obj.chunks);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is KnowledgeSourceAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class KnowledgeTypeAdapter extends TypeAdapter<KnowledgeType> {
  @override
  final int typeId = 5;

  @override
  KnowledgeType read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return KnowledgeType.text;
      case 1:
        return KnowledgeType.pdf;
      case 2:
        return KnowledgeType.url;
      case 3:
        return KnowledgeType.youtube;
      default:
        return KnowledgeType.text;
    }
  }

  @override
  void write(BinaryWriter writer, KnowledgeType obj) {
    switch (obj) {
      case KnowledgeType.text:
        writer.writeByte(0);
        break;
      case KnowledgeType.pdf:
        writer.writeByte(1);
        break;
      case KnowledgeType.url:
        writer.writeByte(2);
        break;
      case KnowledgeType.youtube:
        writer.writeByte(3);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is KnowledgeTypeAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
