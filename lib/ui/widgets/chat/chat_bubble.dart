import 'package:flutter/material.dart';
import 'package:vital_track/models/chat_message.dart';
import 'package:vital_track/models/diet_plan.dart';
import 'package:vital_track/models/fasting_program.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/providers/mascot_knowledge_base.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/animated_pigeon.dart';
import 'package:vital_track/ui/widgets/chat/diet_plan_proposal_card.dart';
import 'package:vital_track/ui/widgets/chat/food_suggestion_chips.dart';
import 'package:vital_track/ui/widgets/chat/markdown_body.dart';
import 'package:vital_track/ui/widgets/chat/plan_proposal_card.dart';

class ChatBubble extends StatelessWidget {
  final ChatMessage msg;
  final Future<void> Function(FastingProgram)? onAcceptProgram;
  final Future<void> Function(DietPlan)? onAcceptDietPlan;
  final Future<bool> Function(String)? onAddFood;

  const ChatBubble({
    super.key,
    required this.msg,
    this.onAcceptProgram,
    this.onAcceptDietPlan,
    this.onAddFood,
  });

  @override
  Widget build(BuildContext context) {
    if (msg.isUser) return _buildUserBubble(context);
    return _buildAiBubble(context);
  }

  Widget _buildUserBubble(BuildContext context) {
    final colors = context.colors;
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        constraints:
            BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        margin: const EdgeInsets.only(top: 16, bottom: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: colors.accent,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(20),
            bottomRight: Radius.circular(4),
          ),
        ),
        child: Text(
          msg.text,
          style: TextStyle(
            color: colors.accentOnPrimary,
            fontSize: 16,
            height: 1.55,
          ),
        ),
      ),
    );
  }

  Widget _buildAiBubble(BuildContext context) {
    final colors = context.colors;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8, bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: colors.accentSubtle,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                    child: StaticPigeonPortrait(
                        mood: MascotMood.talking, size: 24)),
              ),
              const SizedBox(width: 8),
              Text(
                'VitalTrack',
                style: TextStyle(
                  color: colors.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (msg.isStreaming) ...[
                const SizedBox(width: 8),
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    color: colors.accent,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 36),
            child: msg.text.isEmpty
                ? Text('...', style: TextStyle(color: colors.textTertiary))
                : MarkdownBody(text: msg.text, colors: colors),
          ),
          if (msg.proposedProgram != null && !msg.isStreaming)
            Padding(
              padding: const EdgeInsets.only(left: 36, top: 16),
              child: PlanProposalCard(
                program: msg.proposedProgram!,
                onAccept: onAcceptProgram,
              ),
            ),
          if (msg.proposedDietPlan != null && !msg.isStreaming)
            Padding(
              padding: const EdgeInsets.only(left: 36, top: 16),
              child: DietPlanProposalCard(
                plan: msg.proposedDietPlan!,
                onAccept: onAcceptDietPlan,
              ),
            ),
          if (msg.suggestedFoods.isNotEmpty && !msg.isStreaming)
            Padding(
              padding: const EdgeInsets.only(left: 36, top: 12),
              child: FoodSuggestionChips(
                foods: msg.suggestedFoods,
                onAdd: onAddFood,
              ),
            ),
          if (!msg.isUser && msg.sources.isNotEmpty && !msg.isStreaming)
            Padding(
              padding: const EdgeInsets.only(left: 36, top: 10),
              child: Wrap(
                spacing: 6,
                runSpacing: 4,
                children: msg.sources.map((s) {
                  final icon = switch (s.type) {
                    KnowledgeType.pdf => Icons.picture_as_pdf,
                    KnowledgeType.url => Icons.link,
                    KnowledgeType.youtube => Icons.video_library,
                    KnowledgeType.text => Icons.description,
                    KnowledgeType.image => Icons.image,
                    KnowledgeType.video => Icons.movie,
                  };
                  return Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: colors.surfaceSubtle,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: colors.borderSubtle),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(icon, size: 12, color: colors.textTertiary),
                        const SizedBox(width: 4),
                        Text(
                          s.title.length > 30
                              ? '${s.title.substring(0, 30)}...'
                              : s.title,
                          style: TextStyle(
                              color: colors.textTertiary, fontSize: 12),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }
}
