import 'package:flutter/material.dart';

class AdminApp extends StatelessWidget {
  const AdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BloodLink Admin',
      debugShowCheckedModeBanner: false,
      home: const Scaffold(
        body: Center(child: Text('BloodLink Admin Web - Bientôt disponible')),
      ),
    );
  }
}
