# La Boutique de Joséphine — Site statique (GitHub Pages)

Site statique avec intégration **Google Sheets → Cartes produits** (CSV public).

## Déploiement GitHub Pages
- **Settings → Pages** : Source = *Deploy from a branch*, Branch = `main`, Folder = `/ (root)`.
- `index.html` est la page d’accueil. `404.html` gère les URLs invalides.

## Données produits (Google Sheets)
Le site lit :
`https://docs.google.com/spreadsheets/d/e/2PACX-1vSl5rtBY94kiWBeL5yMK9uoKLbRsirFc9XNFHqPEbN_0JGaTJzxWkdVX1Gjb7bC2YguiNXYo5nu15df/pub?gid=0&single=true&output=csv`

### En-têtes attendus (ligne 1)
- `emoji` (optionnel si `image` existe)
- `titre` *(requis)*
- `description`
- `prix`
- `image` (URL absolue: ex. `https://okette.github.io/josephine-boutique/assets/img/xxx.webp`)
- `alt` (texte alternatif image)
- `fit` (`cover` par défaut, ou `contain`)
- `badge` (`nouveau` / `nouveauté` / `new`)

## Images
- Mettre vos fichiers dans `assets/img/`.
- Formats conseillés : **WebP** (idéal), sinon JPEG (80–85 %).
- Dimensions : **1200×900 px** (4:3), **< 200 Ko**.
- Nommage : *kebab-case* sans accents ni espaces.

## Dev local
Ouvrir `index.html` directement ou servir via un petit serveur (ex. VS Code Live Server).
