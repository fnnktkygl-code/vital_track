import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/services/knowledge_service.dart';
import 'package:vital_track/ui/theme.dart';

class KnowledgeAdminScreen extends StatefulWidget {
  const KnowledgeAdminScreen({super.key});

  @override
  State<KnowledgeAdminScreen> createState() => _KnowledgeAdminScreenState();
}

class _KnowledgeAdminScreenState extends State<KnowledgeAdminScreen> {
  final KnowledgeService _service = KnowledgeService(HiveService());
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final sources = _service.sources;
    final colors = context.colors;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        slivers: [
          // ── HEADER ─────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 130,
            pinned: true,
            backgroundColor: Theme.of(context).scaffoldBackgroundColor,
            leading: IconButton(
              icon: Icon(Icons.arrow_back_ios_new_rounded,
                  color: colors.textPrimary, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
              title: Text(
                "Mes Sources",
                style: TextStyle(
                  color: colors.textPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 20,
                ),
              ),
            ),
          ),

          // ── BODY ───────────────────────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // ── Explanation banner ────────────────────────────────────
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: colors.accent.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        color: colors.accent.withValues(alpha: 0.15)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.lightbulb_outline_rounded,
                          color: colors.accent, size: 22),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          "Ajoutez des documents, liens ou textes pour enrichir les connaissances de votre assistant. Il pourra s'y référer dans ses réponses.",
                          style: TextStyle(
                              color: colors.textSecondary,
                              fontSize: 12,
                              height: 1.5),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // ── Add source cards ─────────────────────────────────────
                _SectionTitle(
                    label: "Ajouter une source", colors: colors),
                const SizedBox(height: 12),
                _AddSourceGrid(
                  colors: colors,
                  onPdf: _pickPdf,
                  onImage: _pickImage,
                  onVideo: _pickVideo,
                  onUrl: _showAddUrlDialog,
                  onYoutube: _showAddYoutubeDialog,
                  onText: _showAddTextDialog,
                ),
                const SizedBox(height: 28),

                // ── Sources list ─────────────────────────────────────────
                if (_isLoading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (sources.isEmpty)
                  _EmptySourceState(colors: colors)
                else ...[
                  _SectionTitle(
                      label:
                          "Sources actives (${sources.length})",
                      colors: colors),
                  const SizedBox(height: 12),
                  ...sources.map((s) => _SourceCard(
                        source: s,
                        colors: colors,
                        onDelete: () => _deleteSource(s),
                        onReupload: () => _reuploadSource(s),
                      )),
                ],
              ]),
            ),
          ),
        ],
      ),
    );
  }

  // ── FILE PICKERS ────────────────────────────────────────────────────────────

  Future<void> _pickPdf() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );
      if (result != null && result.files.single.path != null) {
        final path = result.files.single.path!;
        final name = result.files.single.name;
        setState(() => _isLoading = true);
        await _service.addPdfSource(name, path);
        if (mounted) {
          setState(() => _isLoading = false);
          _showSuccessSnackbar("PDF ajouté avec succès !");
        }
      }
    } catch (e) {
      _handleError(e);
    }
  }

  Future<void> _pickImage() async {
    try {
      final result = await FilePicker.platform.pickFiles(type: FileType.image);
      if (result != null && result.files.single.path != null) {
        final path = result.files.single.path!;
        final name = result.files.single.name;
        setState(() => _isLoading = true);
        await _service.addImageSource(name, path);
        if (mounted) {
          setState(() => _isLoading = false);
          _showSuccessSnackbar("Image ajoutée avec succès !");
        }
      }
    } catch (e) {
      _handleError(e);
    }
  }

  Future<void> _pickVideo() async {
    try {
      final result = await FilePicker.platform.pickFiles(type: FileType.video);
      if (result != null && result.files.single.path != null) {
        final path = result.files.single.path!;
        final name = result.files.single.name;
        setState(() => _isLoading = true);
        await _service.addVideoSource(name, path);
        if (mounted) {
          setState(() => _isLoading = false);
          _showSuccessSnackbar("Vidéo ajoutée avec succès !");
        }
      }
    } catch (e) {
      _handleError(e);
    }
  }

  Future<void> _reuploadSource(KnowledgeSource source) async {
    setState(() => _isLoading = true);
    try {
      await _service.reuploadSource(source);
      if (mounted) {
        setState(() => _isLoading = false);
        _showSuccessSnackbar("Re-upload réussi !");
      }
    } catch (e) {
      _handleError(e);
    }
  }

  Future<void> _deleteSource(KnowledgeSource source) async {
    final colors = context.colors;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text("Supprimer cette source ?",
            style: TextStyle(color: colors.textPrimary)),
        content: Text(
          "\"${source.title}\" sera supprimée définitivement.",
          style: TextStyle(color: colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text("Annuler",
                style: TextStyle(color: colors.textTertiary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text("Supprimer",
                style: TextStyle(
                    color: colors.error, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await _service.deleteSource(source.key);
      setState(() {});
    }
  }

  void _handleError(dynamic e) {
    if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text("Erreur : $e"),
        backgroundColor: context.colors.error,
      ));
    }
  }

  void _showSuccessSnackbar(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(
        children: [
          const Icon(Icons.check_circle_rounded,
              color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Text(msg),
        ],
      ),
      backgroundColor: context.colors.accent,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
    ));
  }

  // ── DIALOGS ─────────────────────────────────────────────────────────────────

  void _showAddUrlDialog() {
    final urlCtrl = TextEditingController();
    final titleCtrl = TextEditingController();
    final colors = context.colors;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: colors.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text("🔗  Ajouter un lien web",
                style: TextStyle(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 18)),
            const SizedBox(height: 16),
            TextField(
              controller: titleCtrl,
              style: TextStyle(color: colors.textPrimary),
              decoration: const InputDecoration(
                labelText: "Titre de la source",
                hintText: "ex: Article sur le jeûne",
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: urlCtrl,
              style: TextStyle(color: colors.textPrimary),
              decoration: const InputDecoration(
                labelText: "Adresse URL",
                hintText: "https://...",
              ),
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (urlCtrl.text.isNotEmpty && titleCtrl.text.isNotEmpty) {
                    Navigator.pop(ctx);
                    setState(() => _isLoading = true);
                    try {
                      await _service.addUrlSource(
                          titleCtrl.text, urlCtrl.text);
                      if (mounted) {
                        _showSuccessSnackbar("Lien ajouté avec succès !");
                      }
                    } catch (e) {
                      _handleError(e);
                    } finally {
                      if (mounted) setState(() => _isLoading = false);
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.accent,
                  foregroundColor: colors.accentOnPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text("Ajouter",
                    style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddYoutubeDialog() {
    final urlCtrl = TextEditingController();
    final titleCtrl = TextEditingController();
    final colors = context.colors;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: colors.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text("🎬  Ajouter une vidéo YouTube",
                style: TextStyle(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 18)),
            const SizedBox(height: 6),
            Text("Les sous-titres seront extraits automatiquement.",
                style: TextStyle(color: colors.textTertiary, fontSize: 12)),
            const SizedBox(height: 16),
            TextField(
              controller: titleCtrl,
              style: TextStyle(color: colors.textPrimary),
              decoration: const InputDecoration(
                labelText: "Titre",
                hintText: "ex: Conférence Dr. Sebi",
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: urlCtrl,
              style: TextStyle(color: colors.textPrimary),
              decoration: const InputDecoration(
                labelText: "URL YouTube",
                hintText: "https://youtube.com/watch?v=...",
              ),
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (urlCtrl.text.isNotEmpty && titleCtrl.text.isNotEmpty) {
                    Navigator.pop(ctx);
                    setState(() => _isLoading = true);
                    try {
                      await _service.addYoutubeSource(
                          titleCtrl.text, urlCtrl.text);
                      if (mounted) {
                        _showSuccessSnackbar("Vidéo YouTube ajoutée !");
                      }
                    } catch (e) {
                      _handleError(e);
                    } finally {
                      if (mounted) setState(() => _isLoading = false);
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.accent,
                  foregroundColor: colors.accentOnPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text("Ajouter",
                    style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddTextDialog() {
    final textCtrl = TextEditingController();
    final titleCtrl = TextEditingController();
    final colors = context.colors;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: colors.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text("📝  Ajouter du texte",
                style: TextStyle(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 18)),
            const SizedBox(height: 6),
            Text("Collez des notes, extraits de livres ou résumés.",
                style: TextStyle(color: colors.textTertiary, fontSize: 12)),
            const SizedBox(height: 16),
            TextField(
              controller: titleCtrl,
              style: TextStyle(color: colors.textPrimary),
              decoration: const InputDecoration(
                labelText: "Titre",
                hintText: "ex: Notes sur l'alimentation vivante",
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: textCtrl,
              style: TextStyle(color: colors.textPrimary),
              decoration: const InputDecoration(
                labelText: "Contenu",
                hintText: "Collez ou tapez votre texte ici...",
              ),
              maxLines: 5,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (textCtrl.text.isNotEmpty && titleCtrl.text.isNotEmpty) {
                    Navigator.pop(ctx);
                    setState(() => _isLoading = true);
                    try {
                      await _service.addTextSource(
                          titleCtrl.text, textCtrl.text);
                      if (mounted) {
                        _showSuccessSnackbar("Texte ajouté avec succès !");
                      }
                    } catch (e) {
                      _handleError(e);
                    } finally {
                      if (mounted) setState(() => _isLoading = false);
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.accent,
                  foregroundColor: colors.accentOnPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text("Ajouter",
                    style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGETS
// ═══════════════════════════════════════════════════════════════════════════════

class _SectionTitle extends StatelessWidget {
  final String label;
  final AppColors colors;
  const _SectionTitle({required this.label, required this.colors});

  @override
  Widget build(BuildContext context) => Text(
        label.toUpperCase(),
        style: TextStyle(
          color: colors.textTertiary,
          fontSize: 11,
          letterSpacing: 1.2,
          fontWeight: FontWeight.w700,
        ),
      );
}

// ── ADD SOURCE GRID ──────────────────────────────────────────────────────────
class _AddSourceGrid extends StatelessWidget {
  final AppColors colors;
  final VoidCallback onPdf;
  final VoidCallback onImage;
  final VoidCallback onVideo;
  final VoidCallback onUrl;
  final VoidCallback onYoutube;
  final VoidCallback onText;

  const _AddSourceGrid({
    required this.colors,
    required this.onPdf,
    required this.onImage,
    required this.onVideo,
    required this.onUrl,
    required this.onYoutube,
    required this.onText,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.0,
      children: [
        _AddCard(
          emoji: "📄",
          label: "PDF",
          subtitle: "Document",
          color: const Color(0xFFEF4444),
          colors: colors,
          onTap: onPdf,
        ),
        _AddCard(
          emoji: "🖼️",
          label: "Image",
          subtitle: "Photo / Scan",
          color: const Color(0xFF14B8A6),
          colors: colors,
          onTap: onImage,
        ),
        _AddCard(
          emoji: "🎥",
          label: "Vidéo",
          subtitle: "MP4 / MOV",
          color: const Color(0xFF8B5CF6),
          colors: colors,
          onTap: onVideo,
        ),
        _AddCard(
          emoji: "🔗",
          label: "Lien",
          subtitle: "Page web",
          color: const Color(0xFF3B82F6),
          colors: colors,
          onTap: onUrl,
        ),
        _AddCard(
          emoji: "🎬",
          label: "YouTube",
          subtitle: "Sous-titres",
          color: const Color(0xFFEF4444),
          colors: colors,
          onTap: onYoutube,
        ),
        _AddCard(
          emoji: "📝",
          label: "Texte",
          subtitle: "Notes libres",
          color: const Color(0xFFF59E0B),
          colors: colors,
          onTap: onText,
        ),
      ],
    );
  }
}

class _AddCard extends StatelessWidget {
  final String emoji;
  final String label;
  final String subtitle;
  final Color color;
  final AppColors colors;
  final VoidCallback onTap;

  const _AddCard({
    required this.emoji,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                    child: Text(emoji, style: const TextStyle(fontSize: 20))),
              ),
              const SizedBox(height: 6),
              Text(label,
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 12)),
              Text(subtitle,
                  style: TextStyle(
                      color: colors.textTertiary, fontSize: 10)),
            ],
          ),
        ),
      );
}

// ── EMPTY STATE ──────────────────────────────────────────────────────────────
class _EmptySourceState extends StatelessWidget {
  final AppColors colors;
  const _EmptySourceState({required this.colors});

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
        decoration: BoxDecoration(
          color: colors.surfaceMuted,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: colors.borderSubtle),
        ),
        child: Column(
          children: [
            const Text("📚", style: TextStyle(fontSize: 40)),
            const SizedBox(height: 12),
            Text("Aucune source ajoutée",
                style: TextStyle(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 16)),
            const SizedBox(height: 6),
            Text(
              "Utilisez les boutons ci-dessus pour\nenrichir les connaissances de votre assistant.",
              textAlign: TextAlign.center,
              style:
                  TextStyle(color: colors.textTertiary, fontSize: 13),
            ),
          ],
        ),
      );
}

// ── SOURCE CARD ──────────────────────────────────────────────────────────────
class _SourceCard extends StatelessWidget {
  final KnowledgeSource source;
  final AppColors colors;
  final VoidCallback onDelete;
  final VoidCallback onReupload;

  const _SourceCard({
    required this.source,
    required this.colors,
    required this.onDelete,
    required this.onReupload,
  });

  (String, Color) get _typeInfo => switch (source.type) {
        KnowledgeType.pdf => ("📄", const Color(0xFFEF4444)),
        KnowledgeType.url => ("🔗", const Color(0xFF3B82F6)),
        KnowledgeType.youtube => ("🎬", const Color(0xFFEF4444)),
        KnowledgeType.text => ("📝", const Color(0xFFF59E0B)),
        KnowledgeType.image => ("🖼️", const Color(0xFF14B8A6)),
        KnowledgeType.video => ("🎥", const Color(0xFF8B5CF6)),
      };

  String get _typeLabel => switch (source.type) {
        KnowledgeType.pdf => "PDF",
        KnowledgeType.url => "Lien web",
        KnowledgeType.youtube => "YouTube",
        KnowledgeType.text => "Texte",
        KnowledgeType.image => "Image",
        KnowledgeType.video => "Vidéo",
      };

  @override
  Widget build(BuildContext context) {
    final (emoji, color) = _typeInfo;
    final needsReupload = source.isFileBased &&
        (source.uploadStatus == 'expired' || source.uploadStatus == 'error');

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child:
                Center(child: Text(emoji, style: const TextStyle(fontSize: 22))),
          ),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(source.title,
                    style: TextStyle(
                        color: colors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(
                      "$_typeLabel • ${source.addedDate.day}/${source.addedDate.month}/${source.addedDate.year}",
                      style: TextStyle(
                          color: colors.textTertiary, fontSize: 11),
                    ),
                    if (source.isFileBased &&
                        source.uploadStatus != null) ...[
                      const SizedBox(width: 8),
                      _StatusDot(
                          status: source.uploadStatus!, colors: colors),
                    ],
                  ],
                ),
              ],
            ),
          ),
          // Actions
          if (needsReupload)
            IconButton(
              icon:
                  Icon(Icons.refresh_rounded, color: colors.accent, size: 20),
              tooltip: "Ré-uploader",
              onPressed: onReupload,
            ),
          IconButton(
            icon: Icon(Icons.delete_outline_rounded,
                color: colors.error.withValues(alpha: 0.7), size: 20),
            tooltip: "Supprimer",
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

class _StatusDot extends StatelessWidget {
  final String status;
  final AppColors colors;
  const _StatusDot({required this.status, required this.colors});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'uploading' => ('En cours…', colors.accent),
      'ready' => ('Prêt', const Color(0xFF22C55E)),
      'expired' => ('Expiré', const Color(0xFFF97316)),
      'error' => ('Erreur', colors.error),
      _ => (status, colors.textTertiary),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: TextStyle(
              color: colors.adaptForText(color),
              fontSize: 9,
              fontWeight: FontWeight.w700)),
    );
  }
}
