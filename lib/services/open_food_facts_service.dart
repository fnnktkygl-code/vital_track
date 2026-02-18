import 'dart:convert';
import 'package:http/http.dart' as http;

class OpenFoodFactsService {
  static const String _baseUrl = 'https://world.openfoodfacts.org/api/v0/product/';

  Future<Map<String, dynamic>?> fetchProduct(String barcode) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl$barcode.json'),
        headers: {
          'User-Agent': 'VitalTrack/1.0 (contact@vitaltrack.app)', // Best practice for OFF API
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes)); // Ensure UTF-8
        if (data['status'] == 1) {
          return data['product'];
        }
      }
    } catch (e) {
       // print('Error fetching product: $e');
    }
    return null; // Product not found or error
  }
  Future<List<dynamic>> searchProducts(String query) async {
    if (query.isEmpty) return [];
    try {
      // General search but ask for specific fields to help filtering later if needed
      final url = Uri.parse('https://world.openfoodfacts.org/cgi/search.pl?search_terms=${Uri.encodeQueryComponent(query)}&search_simple=1&action=process&json=1&page_size=25&fields=code,product_name,brands,nutriments,image_url,categories_tags,ingredients_text,nova_group');
      final response = await http.get(
        url,
        headers: {
          'User-Agent': 'VitalTrack/1.0 (contact@vitaltrack.app)',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        if (data['products'] != null) {
          return data['products'];
        }
      }
    } catch (e) {
       // print('Error searching products: $e');
    }
    return [];
  }
}
