import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'dart:ui';

class FastingAnalyticsView extends StatefulWidget {
  const FastingAnalyticsView({super.key});

  @override
  State<FastingAnalyticsView> createState() => _FastingAnalyticsViewState();
}

class _FastingAnalyticsViewState extends State<FastingAnalyticsView> with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;
  bool _useDemoData = true;
  
  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    );
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  List<FastingSession> _generateFakeHistory() {
    final now = DateTime.now();
    return List.generate(7, (i) {
      final startTime = now.subtract(Duration(days: 6 - i, hours: 20));
      final durationHours = 14 + (i % 3) * 2 + (i % 2); // 14, 17, 14...
      return FastingSession(
        id: 'fake_$i',
        type: FastingType.waterFast,
        startTime: startTime,
        endTime: startTime.add(Duration(hours: durationHours)),
        plannedMinutes: 16 * 60,
        preWeight: 75.0 - (i * 0.2), // decreasing weight
        postWeight: 75.0 - (i * 0.2) - 0.5,
        preEnergy: 3 + (i % 3),
        postEnergy: 4,
        moodEmoji: ['😊', '🧠', '😊', '😴', '🧠', '😊', '😊'][i],
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final fp = context.watch<FastingProvider>();
    final colors = context.colors;
    final realHistory = fp.history.where((s) => !s.isActive).take(10).toList().reversed.toList();
    final history = _useDemoData ? _generateFakeHistory() : realHistory;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Rapports & Statistiques', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        elevation: 0,
        centerTitle: true,
        actions: [
          Row(
            children: [
              Text('Démo', style: TextStyle(color: colors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
              Switch(
                value: _useDemoData,
                onChanged: (val) => setState(() => _useDemoData = val),
                activeColor: colors.accent,
                activeTrackColor: colors.accent.withValues(alpha: 0.3),
              ),
            ],
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
        children: [
          // ── Weight Evolution ──────────────────────────────────────────────
          _WeightChartCard(history: history, colors: colors),
          const SizedBox(height: 20),

          // ── Fasting Duration & Statistics ──────────────────────────────────
          _StatisticsCard(history: history, colors: colors),
          const SizedBox(height: 20),

          // ── Calendar Plan ─────────────────────────────────────────────────
          _CalendarPlanCard(history: history, colors: colors, useDemoData: _useDemoData),
          const SizedBox(height: 20),

          // ── Mood Evolution ────────────────────────────────────────────────
          _MoodChartCard(history: history, colors: colors),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _WeightChartCard extends StatelessWidget {
  final List<FastingSession> history;
  final AppColors colors;

  const _WeightChartCard({required this.history, required this.colors});

  @override
  Widget build(BuildContext context) {
    final validSessions = history.where((s) => s.postWeight != null || s.preWeight != null).toList();
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        color: colors.surface, 
        borderRadius: BorderRadius.circular(28), 
        boxShadow: [
          BoxShadow(
            color: colors.textPrimary.withValues(alpha: 0.04),
            blurRadius: 24,
            offset: const Offset(0, 8),
          )
        ]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('⚖️ Évolution du poids (kg)', style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 24),
          if (validSessions.isEmpty) ...[
            Center(child: Text('Plus de données nécessaires', style: TextStyle(color: colors.textTertiary, fontSize: 12))),
          ] else AspectRatio(
            aspectRatio: 1.5,
            child: LineChart(
              LineChartData(
                minY: validSessions.map((s) => s.postWeight ?? s.preWeight!).reduce((a, b) => a < b ? a : b) - 2,
                maxY: validSessions.map((s) => s.postWeight ?? s.preWeight!).reduce((a, b) => a > b ? a : b) + 2,
                gridData: const FlGridData(show: false),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 1,
                      reservedSize: 32,
                      getTitlesWidget: (value, meta) {
                        int idx = value.toInt();
                        if (idx >= 0 && idx < validSessions.length) {
                           return Padding(
                             padding: const EdgeInsets.only(top: 12.0),
                             child: Text(DateFormat('dd MMM').format(validSessions[idx].startTime), style: TextStyle(color: colors.textTertiary, fontSize: 11, fontWeight: FontWeight.w600)),
                           );
                        }
                        return const SizedBox();
                      },
                    )
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Text('${value.toInt()} ', style: TextStyle(color: colors.textTertiary, fontSize: 12, fontWeight: FontWeight.w700));
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipColor: (_) => colors.surface, // changed to getTooltipColor
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((spot) => LineTooltipItem('${spot.y} kg', TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold))).toList();
                    },
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: validSessions.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.postWeight ?? e.value.preWeight!)).toList(),
                    isCurved: false,
                    color: colors.accent,
                    barWidth: 5,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: true, getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(radius: 5, color: colors.surface, strokeWidth: 3, strokeColor: colors.accent)),
                    belowBarData: BarAreaData(
                        show: true, 
                        gradient: LinearGradient(
                            colors: [colors.accent.withValues(alpha: 0.3), colors.surface.withValues(alpha: 0.0)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                        )
                    ),
                  ),
                ],
              )
            )
          )
        ]
      )
    );
  }
}

class _StatisticsCard extends StatefulWidget {
  final List<FastingSession> history;
  final AppColors colors;

  const _StatisticsCard({required this.history, required this.colors});

  @override
  State<_StatisticsCard> createState() => _StatisticsCardState();
}

class _StatisticsCardState extends State<_StatisticsCard> {
  int _selectedTab = 0; // 0: by days, 1: fasting hours, 2: by month

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    
    // Create a 7 day window based on current week (Mon-Sun)
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    final weekDays = List.generate(7, (i) => monday.add(Duration(days: i)));
    double maxBarHeight = 0.0;
    for (int i = 0; i < 7; i++) {
        final dt = weekDays[i];
        double dayTotal = 0.0;
        double dayPlanned = 0.0;
        for (var s in widget.history) {
            if (s.startTime.year == dt.year && s.startTime.month == dt.month && s.startTime.day == dt.day) {
                dayTotal += s.elapsed.inMinutes / 60.0;
                dayPlanned += s.plannedMinutes / 60.0;
            }
        }
        double dayMax = dayTotal > dayPlanned ? dayTotal : dayPlanned;
        if (dayMax > maxBarHeight) maxBarHeight = dayMax;
    }
    double finalMaxY = maxBarHeight > 0 ? ((maxBarHeight / 4).ceil() * 4).toDouble() : 16.0;
    if (finalMaxY < 16.0) finalMaxY = 16.0;

    return Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        decoration: BoxDecoration(
          color: colors.surface, 
          borderRadius: BorderRadius.circular(28), 
          boxShadow: [
            BoxShadow(
              color: colors.textPrimary.withValues(alpha: 0.04),
              blurRadius: 24,
              offset: const Offset(0, 8),
            )
          ]
        ),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.bar_chart_rounded, color: colors.textPrimary, size: 24),
                  const SizedBox(width: 8),
                  Text('Statistiques', style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
                ],
              ),
              const SizedBox(height: 16),
              // Segmented Tabs
              Container(
                decoration: BoxDecoration(
                  color: colors.surfaceSubtle,
                  borderRadius: BorderRadius.circular(20),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    _buildTab(0, 'Par jours', colors),
                    _buildTab(1, 'Heures', colors),
                    _buildTab(2, 'Par mois', colors),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              AspectRatio(
                  aspectRatio: 1.3,
                  child: BarChart(
                    BarChartData(
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        getDrawingHorizontalLine: (value) => FlLine(
                          color: colors.borderSubtle,
                          strokeWidth: 1.5,
                          dashArray: [6, 6]
                        ),
                        horizontalInterval: 4,
                      ),
                      minY: 0,
                      maxY: finalMaxY,
                      titlesData: FlTitlesData(
                          bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                interval: 1,
                                reservedSize: 56,
                                getTitlesWidget: (value, meta) {
                                  int idx = value.toInt();
                                  if (idx >= 0 && idx < 7) {
                                    final dt = weekDays[idx];
                                    
                                    // Search for history on this day
                                    var dayTotalElapsed = 0.0;
                                    for (var s in widget.history) {
                                      if (s.startTime.year == dt.year && s.startTime.month == dt.month && s.startTime.day == dt.day) {
                                        dayTotalElapsed += s.elapsed.inMinutes / 60.0;
                                      }
                                    }
                                    
                                    final bool isEmpty = dayTotalElapsed == 0.0;
                                    
                                    return Column(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        if (isEmpty)
                                           SizedBox(
                                              width: 16,
                                              height: 16,
                                              child: CustomPaint(
                                                painter: _DashedCirclePainter(color: colors.textTertiary.withValues(alpha: 0.4)),
                                              )
                                           ),
                                        const SizedBox(height: 6),
                                        Text(DateFormat('E').format(dt).substring(0, 3), style: TextStyle(color: colors.textTertiary, fontSize: 11, fontWeight: FontWeight.w600)),
                                      ],
                                    );
                                  }
                                  return const SizedBox();
                                },
                              )
                          ),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              interval: 4,
                              reservedSize: 36,
                              getTitlesWidget: (value, meta) {
                                if (value == 0) return const SizedBox();
                                return Text('${value.toInt()}h', style: TextStyle(color: colors.textTertiary, fontSize: 11, fontWeight: FontWeight.w600));
                              },
                            )
                          ),
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      borderData: FlBorderData(show: false),
                      barTouchData: BarTouchData(
                        touchTooltipData: BarTouchTooltipData(
                          getTooltipColor: (_) => colors.surface,
                          getTooltipItem: (group, groupIndex, rod, rodIndex) => BarTooltipItem('${rod.toY.toStringAsFixed(1)} h', TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      barGroups: List.generate(7, (i) {
                        final dt = weekDays[i];
                        var dayTotalElapsed = 0.0;
                        var dayTotalPlanned = 0.0;
                        for (var s in widget.history) {
                          if (s.startTime.year == dt.year && s.startTime.month == dt.month && s.startTime.day == dt.day) {
                            dayTotalElapsed += s.elapsed.inMinutes / 60.0;
                            dayTotalPlanned += s.plannedMinutes / 60.0;
                          }
                        }
                        return BarChartGroupData(
                            x: i,
                            barRods: [
                              BarChartRodData(
                                toY: dayTotalPlanned > dayTotalElapsed ? dayTotalPlanned : dayTotalElapsed,
                                color: Colors.transparent,
                                width: 22,
                                borderRadius: BorderRadius.circular(22),
                                rodStackItems: [
                                  if (dayTotalElapsed > 0)
                                      BarChartRodStackItem(0, dayTotalElapsed, colors.accent),
                                  if (dayTotalPlanned > dayTotalElapsed)
                                      BarChartRodStackItem(dayTotalElapsed, dayTotalPlanned, colors.accentMuted),
                                ],
                              ),
                            ],
                        );
                      }),
                    ),
                  ),
              )
            ]
        )
    );
  }

  Widget _buildTab(int index, String label, AppColors colors) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? colors.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: isSelected ? Border.all(color: colors.borderSubtle, width: 1) : Border.all(color: Colors.transparent, width: 1),
          ),
          alignment: Alignment.center,
          child: Text(
            label, 
            style: TextStyle(
              fontSize: 13, 
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? colors.textPrimary : colors.textTertiary
            )
          ),
        ),
      ),
    );
  }
}

class _DashedCirclePainter extends CustomPainter {
  final Color color;
  _DashedCirclePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
      
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    // Draw dashed circle logic by drawing small arcs
    final path = Path()..addOval(rect);
    final dashedPath = _createDashedPath(path, 4.0, 4.0);
    // To cleanly clear the container background if needed:
    canvas.drawPath(dashedPath, paint);
  }
  
  Path _createDashedPath(Path source, double dashLength, double dashSpace) {
    final Path dest = Path();
    for (final PathMetric metric in source.computeMetrics()) {
      double distance = 0.0;
      bool draw = true;
      while (distance < metric.length) {
        final double len = draw ? dashLength : dashSpace;
        if (draw) {
          dest.addPath(metric.extractPath(distance, distance + len), Offset.zero);
        }
        distance += len;
        draw = !draw;
      }
    }
    return dest;
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _MoodChartCard extends StatelessWidget {
  final List<FastingSession> history;
  final AppColors colors;

  const _MoodChartCard({required this.history, required this.colors});

  int moodToValue(String mood) {
    switch (mood) {
      case '🤢': return 1;
      case '😵‍💫': return 2;
      case '😴': return 3;
      case '🧠': return 4;
      case '😊': return 5;
      default: return 3;
    }
  }

  String valueToMood(int v) {
    switch (v) {
      case 1: return '🤢';
      case 2: return '😵‍💫';
      case 3: return '😴';
      case 4: return '🧠';
      case 5: return '😊';
      default: return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final validSessions = history.where((s) => s.moodEmoji.isNotEmpty).toList();

    return Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        decoration: BoxDecoration(
          color: colors.surface, 
          borderRadius: BorderRadius.circular(28), 
          boxShadow: [
            BoxShadow(
              color: colors.textPrimary.withValues(alpha: 0.04),
              blurRadius: 24,
              offset: const Offset(0, 8),
            )
          ]
        ),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('🧠 Évolution de l\'humeur', style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 24),
              if (validSessions.isEmpty) ...[
                 Center(child: Text('Plus de données nécessaires', style: TextStyle(color: colors.textTertiary, fontSize: 12))),
              ] else AspectRatio(
                  aspectRatio: 1.5,
                  child: LineChart(
                      LineChartData(
                        gridData: const FlGridData(show: false),
                        minY: 0.5,
                        maxY: 5.5,
                        titlesData: FlTitlesData(
                          bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                interval: 1,
                                reservedSize: 32,
                                getTitlesWidget: (value, meta) {
                                  int idx = value.toInt();
                                  if (idx >= 0 && idx < validSessions.length) {
                                    return Padding(
                                      padding: const EdgeInsets.only(top: 12.0),
                                      child: Text(DateFormat('E').format(validSessions[idx].startTime), style: TextStyle(color: colors.textTertiary, fontSize: 13, fontWeight: FontWeight.w600)),
                                    );
                                  }
                                  return const SizedBox();
                                },
                              )
                          ),
                          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        ),
                        borderData: FlBorderData(show: false),
                        lineTouchData: LineTouchData(
                          touchTooltipData: LineTouchTooltipData(
                            getTooltipColor: (_) => colors.surface, // changed to getTooltipColor
                            getTooltipItems: (touchedSpots) {
                              return touchedSpots.map((spot) => LineTooltipItem(valueToMood(spot.y.toInt()), const TextStyle(fontSize: 24))).toList();
                            },
                          ),
                        ),
                        lineBarsData: [
                          LineChartBarData(
                            spots: validSessions.asMap().entries.map((e) => FlSpot(e.key.toDouble(), moodToValue(e.value.moodEmoji).toDouble())).toList(),
                            isCurved: true,
                            curveSmoothness: 0.4,
                            color: Colors.purpleAccent,
                            barWidth: 5,
                            isStrokeCapRound: true,
                            dotData: FlDotData(show: true, getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(radius: 6, color: colors.surface, strokeWidth: 3, strokeColor: Colors.purpleAccent)),
                            belowBarData: BarAreaData(
                                show: true,
                                gradient: LinearGradient(
                                    colors: [Colors.purpleAccent.withValues(alpha: 0.3), colors.surface.withValues(alpha: 0.0)],
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                )
                            ),
                          ),
                        ],
                      )
                  )
              )
            ]
        )
    );
  }
}

class _CalendarPlanCard extends StatelessWidget {
  final List<FastingSession> history;
  final AppColors colors;
  final bool useDemoData;

  const _CalendarPlanCard({required this.history, required this.colors, required this.useDemoData});

  @override
  Widget build(BuildContext context) {
    // 30 days logic: Assume current plan is 30 days starting 30 days ago, or just 1..30 corresponding to the month
    final now = DateTime.now();
    final int daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final int remainingDays = daysInMonth - now.day;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        color: colors.surfaceSubtle,
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.calendar_today_rounded, color: colors.textPrimary, size: 24),
              const SizedBox(width: 8),
              Text('Ton planning', style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
            ),
            itemCount: 30, // Show 30 days as requested in the design
            itemBuilder: (context, index) {
              final day = index + 1;
              final isPast = day < now.day;
              final isToday = day == now.day;
              
              // Find if there was a fast that day (for simplicity, checking only current month)
              bool hasFast = history.any((s) => s.startTime.day == day && s.startTime.month == now.month && s.startTime.year == now.year);
              // For demonstration purposes, if fake history is used, random ones might be lit up. The fake generator covers the last 7 days.
              if (isPast && useDemoData && now.day - day <= 7 && now.day - day > 0) {
                 hasFast = true; // ensure fake data reflects on the calendar too
              }

              Color bgColor;
              Color textColor;
              BoxBorder? border;

              if (hasFast) {
                  bgColor = colors.accent;
                  textColor = colors.surface;
              } else if (isPast) {
                  bgColor = colors.surfaceMuted;
                  textColor = colors.textSecondary;
              } else {
                  bgColor = Colors.transparent;
                  border = Border.all(color: isToday ? colors.accent : colors.borderSubtle);
                  textColor = isToday ? colors.accent : colors.textSecondary;
              }

              return Container(
                decoration: BoxDecoration(
                  color: bgColor,
                  shape: BoxShape.circle,
                  border: border,
                ),
                alignment: Alignment.center,
                child: Text(
                  '$day',
                  style: TextStyle(
                    color: textColor,
                    fontSize: 13,
                    fontWeight: hasFast || isToday ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('🙂', style: TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Text(
                'encore $remainingDays jours !',
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          )
        ],
      ),
    );
  }
}
