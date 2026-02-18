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
      appBar: AppBar(
        title: const Text("Base de Connaissances"),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : sources.isEmpty
              ? _buildEmptyState(colors)
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: sources.length,
                  itemBuilder: (ctx, i) => _buildSourceCard(sources[i], colors),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddMenu,
        icon: const Icon(Icons.add),
        label: const Text("Ajouter"),
        backgroundColor: colors.accent,
        foregroundColor: colors.accentOnPrimary,
      ),
    );
  }

  Widget _buildEmptyState(AppColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.library_books_outlined,
              size: 64, color: colors.textTertiary),
          const SizedBox(height: 16),
          Text(
            "Aucune source définie",
            style: TextStyle(color: colors.textSecondary, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            "Ajoutez des PDF, liens ou textes pour\nanrichir les connaissances du Mascotte.",
            textAlign: TextAlign.center,
            style: TextStyle(color: colors.textTertiary),
          ),
        ],
      ),
    );
  }

  Widget _buildSourceCard(KnowledgeSource source, AppColors colors) {
    IconData icon;
    Color iconColor;

    switch (source.type) {
      case KnowledgeType.pdf:
        icon = Icons.picture_as_pdf;
        iconColor = Colors.redAccent;
        break;
      case KnowledgeType.url:
        icon = Icons.link;
        iconColor = Colors.blueAccent;
        break;
      case KnowledgeType.youtube:
        icon = Icons.video_library;
        iconColor = Colors.red;
        break;
      case KnowledgeType.text:
      default:
        icon = Icons.description;
        iconColor = colors.textSecondary;
        break;
    }

    return Card(
      color: colors.surface,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: colors.border)),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: iconColor),
        ),
        title: Text(source.title,
            style: TextStyle(
                color: colors.textPrimary, fontWeight: FontWeight.bold)),
        subtitle: Text(
          "${source.type.name.toUpperCase()} • ${source.addedDate.toString().split(' ')[0]}",
          style: TextStyle(color: colors.textTertiary, fontSize: 12),
        ),
        trailing: IconButton(
          icon: Icon(Icons.delete_outline, color: colors.error),
          onPressed: () => _deleteSource(source),
        ),
      ),
    );
  }

  Future<void> _deleteSource(KnowledgeSource source) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Supprimer cette source ?"),
        content: Text("Voulez-vous vraiment supprimer '${source.title}' ?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("Annuler"),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Supprimer", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _service.deleteSource(source.key);
      setState(() {});
    }
  }

  void _showAddMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: context.colors.sheetBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text("Lien Web / Article"),
              onTap: () {
                Navigator.pop(ctx);
                _showAddUrlDialog();
              },
            ),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf),
              title: const Text("Document PDF"),
              onTap: () {
                Navigator.pop(ctx);
                _pickPdf();
              },
            ),
            ListTile(
              leading: const Icon(Icons.text_fields),
              title: const Text("Texte Brut"),
              onTap: () {
                Navigator.pop(ctx);
                _showAddTextDialog();
              },
            ),
          ],
        ),
      ),
    );
  }

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
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(content: Text("PDF ajouté avec succès !"))
           );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Erreur: $e"), backgroundColor: Colors.red));
      }
    }
  }

  void _showAddUrlDialog() {
    final urlCtrl = TextEditingController();
    final titleCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Ajouter un lien"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleCtrl,
              decoration: const InputDecoration(labelText: "Titre"),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: urlCtrl,
              decoration: const InputDecoration(labelText: "URL (https://...)"),
              keyboardType: TextInputType.url,
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text("Annuler")),
          ElevatedButton(
            onPressed: () async {
              if (urlCtrl.text.isNotEmpty && titleCtrl.text.isNotEmpty) {
                Navigator.pop(ctx);
                setState(() => _isLoading = true);
                try {
                  await _service.addUrlSource(titleCtrl.text, urlCtrl.text);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text("Lien ajouté et analysé !")));
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content: Text("Erreur: $e"),
                        backgroundColor: Colors.red));
                  }
                } finally {
                  if (mounted) setState(() => _isLoading = false);
                }
              }
            },
            child: const Text("Ajouter"),
          ),
        ],
      ),
    );
  }
  
  void _showAddTextDialog() {
    final textCtrl = TextEditingController();
    final titleCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Ajouter du texte"),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: "Titre"),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: textCtrl,
                decoration: const InputDecoration(labelText: "Contenu"),
                maxLines: 5,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text("Annuler")),
          ElevatedButton(
            onPressed: () async {
              if (textCtrl.text.isNotEmpty && titleCtrl.text.isNotEmpty) {
                Navigator.pop(ctx);
                setState(() => _isLoading = true);
                try {
                  await _service.addTextSource(titleCtrl.text, textCtrl.text);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text("Texte ajouté !")));
                  }
                } catch (e) {
                   // Error handling
                } finally {
                  if (mounted) setState(() => _isLoading = false);
                }
              }
            },
            child: const Text("Ajouter"),
          ),
        ],
      ),
    );
  }
}