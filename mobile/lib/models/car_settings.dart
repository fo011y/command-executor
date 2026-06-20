enum CarModel {
  fordFocus3,
  fordKuga2,
}

enum ButtonsPosition {
  above, // над машиной
  below, // под машиной
}

class CarSettings {
  final CarModel model;
  final int colorValue; // ARGB int
  final ButtonsPosition buttonsPosition;

  const CarSettings({
    this.model = CarModel.fordFocus3,
    this.colorValue = 0xFF1a1a2e,
    this.buttonsPosition = ButtonsPosition.below,
  });

  String get modelName {
    switch (model) {
      case CarModel.fordFocus3:
        return 'Ford Focus 3';
      case CarModel.fordKuga2:
        return 'Ford Kuga 2';
    }
  }

  CarSettings copyWith({
    CarModel? model,
    int? colorValue,
    ButtonsPosition? buttonsPosition,
  }) =>
      CarSettings(
        model: model ?? this.model,
        colorValue: colorValue ?? this.colorValue,
        buttonsPosition: buttonsPosition ?? this.buttonsPosition,
      );

  Map<String, dynamic> toJson() => {
        'model': model.index,
        'colorValue': colorValue,
        'buttonsPosition': buttonsPosition.index,
      };

  factory CarSettings.fromJson(Map<String, dynamic> json) => CarSettings(
        model: CarModel.values[json['model'] as int? ?? 0],
        colorValue: json['colorValue'] as int? ?? 0xFF1a1a2e,
        buttonsPosition:
            ButtonsPosition.values[json['buttonsPosition'] as int? ?? 1],
      );
}
