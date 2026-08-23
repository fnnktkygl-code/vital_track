/**
 * NOVA Food Classification Engine & Vitalist Density
 */

export interface NovaDetails {
  group: 1 | 2 | 3 | 4;
  title: string;
  desc: string;
  color: string;
  badge: string;
}

export function getNovaDetails(nova: 1 | 2 | 3 | 4): NovaDetails {
  switch (nova) {
    case 1:
      return {
        group: 1,
        title: 'Aliment Brut ou Peu Transformé',
        desc: 'Fruits, légumes frais, graines naturelles, feuilles sauvages',
        color: '#10B981',
        badge: 'NOVA 1 · Vivant',
      };
    case 2:
      return {
        group: 2,
        title: 'Ingrédient Culinaire Transformé',
        desc: 'Huiles de première pression à froid, sel brut non raffiné',
        color: '#34D399',
        badge: 'NOVA 2 · Culinaire',
      };
    case 3:
      return {
        group: 3,
        title: 'Aliment Transformé',
        desc: 'Conserves simples, pains au levain naturel, légumes lacto-fermentés',
        color: '#F59E0B',
        badge: 'NOVA 3 · Modéré',
      };
    case 4:
    default:
      return {
        group: 4,
        title: 'Aliment Ultra-Transformé',
        desc: 'Produits industriels, additifs de synthèse, émulsifiants, sucres raffinés',
        color: '#EF4444',
        badge: 'NOVA 4 · Ultra-transformé',
      };
  }
}
