import 'package:flutter/material.dart';

import 'theme.dart';

class BloodLinkApp extends StatelessWidget {
  const BloodLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BloodLink',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const Scaffold(
        body: Center(
          child: Text('BloodLink Mobile'),
        ),
      ),
    );
  }
}
