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
      geminiFileUri: fields[7] as String?,
      geminiFileName: fields[8] as String?,
      uploadedAt: fields[9] as DateTime?,
      localFilePath: fields[10] as String?,
      uploadStatus: fields[11] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, KnowledgeSource obj) {
    writer
      ..writeByte(12)
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
      ..write(obj.chunks)
      ..writeByte(7)
      ..write(obj.geminiFileUri)
      ..writeByte(8)
      ..write(obj.geminiFileName)
      ..writeByte(9)
      ..write(obj.uploadedAt)
      ..writeByte(10)
      ..write(obj.localFilePath)
      ..writeByte(11)
      ..write(obj.uploadStatus);
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
      case 4:
        return KnowledgeType.image;
      case 5:
        return KnowledgeType.video;
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
      case KnowledgeType.image:
        writer.writeByte(4);
        break;
      case KnowledgeType.video:
        writer.writeByte(5);
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
