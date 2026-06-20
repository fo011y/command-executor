import 'package:socket_io_client/socket_io_client.dart' as io;
import '../api/client.dart';

typedef CommandResultCallback = void Function(Map<String, dynamic> data);

class SocketService {
  io.Socket? _socket;
  final List<CommandResultCallback> _listeners = [];

  void connect(String token) {
    _socket = io.io(
      kApiBase,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .build(),
    );

    _socket!.on('connect', (_) {
      // connected
    });

    _socket!.on('command:result', (data) {
      for (final cb in _listeners) {
        cb(data as Map<String, dynamic>);
      }
    });

    _socket!.on('disconnect', (_) {
      // disconnected
    });

    _socket!.connect();
  }

  void addResultListener(CommandResultCallback cb) => _listeners.add(cb);

  void removeResultListener(CommandResultCallback cb) =>
      _listeners.remove(cb);

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _listeners.clear();
  }

  bool get isConnected => _socket?.connected ?? false;
}
