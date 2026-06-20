class Category {
  final int id;
  final String name;
  final int? parentId;
  final String? color;

  const Category({
    required this.id,
    required this.name,
    this.parentId,
    this.color,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as int,
        name: json['name'] as String,
        parentId: json['parent_id'] as int?,
        color: json['color'] as String?,
      );
}

class Command {
  final int id;
  final String name;
  final String? description;
  final int? categoryId;
  final String? categoryName;
  final bool isActive;
  final int sortOrder;

  const Command({
    required this.id,
    required this.name,
    this.description,
    this.categoryId,
    this.categoryName,
    required this.isActive,
    this.sortOrder = 0,
  });

  factory Command.fromJson(Map<String, dynamic> json) => Command(
        id: json['id'] as int,
        name: json['name'] as String,
        description: json['description'] as String?,
        categoryId: json['category_id'] as int?,
        categoryName: json['category_name'] as String?,
        isActive: json['is_active'] as bool? ?? true,
        sortOrder: json['sort_order'] as int? ?? 0,
      );
}

class CommandLog {
  final int id;
  final int commandId;
  final String? commandName;
  final String status;
  final String? output;
  final String? error;
  final DateTime executedAt;

  const CommandLog({
    required this.id,
    required this.commandId,
    this.commandName,
    required this.status,
    this.output,
    this.error,
    required this.executedAt,
  });

  factory CommandLog.fromJson(Map<String, dynamic> json) => CommandLog(
        id: json['id'] as int,
        commandId: json['command_id'] as int,
        commandName: json['command_name'] as String?,
        status: json['status'] as String,
        output: json['output'] as String?,
        error: json['error'] as String?,
        executedAt: DateTime.parse(json['executed_at'] as String),
      );

  bool get isSuccess => status == 'success';
}

enum CommandExecutionStatus { idle, loading, success, error }

class CommandExecution {
  final int commandId;
  final CommandExecutionStatus status;
  final String? output;
  final String? error;

  const CommandExecution({
    required this.commandId,
    required this.status,
    this.output,
    this.error,
  });
}
