# TD et TP 5: Internationalisation:

 Objectifs: Ajouter la possibilité de changer la langue de votre site. Sauvegarder la préférence de l’utilisateur dans un cookie.

1. Ajoutez un sélecteur de langue dans le layout. Vous pouvez créer un formulaire dans votre fichier de layout qui permettra à l’utilisateur de choisir sa langue préférée.

```html
     <form method="POST" action={Astro.url.pathname}">
        <select name="language" class="select" onchange="this.form.submit()">
            <option disabled selected="true">{ui[locale].nav.language}</option>
            <option value="en" >English</option>
            <option value="fr" >Français</option>
        </select>
    </form>
```

Ici :
- L’attribut onchange="this.form.submit()" permet de soumettre automatiquement le formulaire dès que l’utilisateur change de langue.
- La valeur sélectionnée sera envoyée au serveur, qui pourra alors la sauvegarder dans un cookie.

2. Créer un nouveau fichier: `src/i18n/ui.js`. Ce fichier contiendra toutes les chaînes de caractères de votre site, traduites dans les langues que vous souhaitez supporter.

3. Dans ui.js, exportez un objet ui qui contient le texte du site en plusieurs langues. Exemple avec anglais et français :

```js

export const ui = {
  en: {
    nav: {
      home: 'Home',
      generator: 'Generator',
      gallery: 'Gallery',
      language: 'Language',
    },
    index: {
        title: 'Welcome to SVG Generator',
        description: 'Create and render SVGs from prompts.',
        button: 'Go to SVG Generator',
    },
    generator: {
        title: 'SVG Generator',
        contentPlaceholder: 'SVG content will be displayed here',
        codePlaceholder: 'SVG code will be displayed here',
        promptLabel: 'Enter your prompt:',
        generateButton: 'Generate SVG',
        editButton: 'Edit',
        viewButton: 'View',
    },
    gallery: {
        title: 'SVG Gallery',
        viewDetails: 'View Details',
    }
  },
  fr: {
    nav: {
      home: 'Accueil',
      generator: 'Générateur',
      gallery: 'Galerie',
      language: 'Langue',
    },
    index: {
        title: 'Bienvenue sur le générateur SVG',
        description: 'Créez et affichez des SVG à partir d\'invites.',
        button: 'Aller au générateur SVG',
    },
    generator: {
        title: 'Générateur SVG',
        contentPlaceholder: 'Le contenu SVG sera affiché ici',
        codePlaceholder: 'Le code SVG sera affiché ici',
        promptLabel: 'Entrez votre invite :',
        generateButton: 'Générer le SVG',
        editButton: 'Éditer',
        viewButton: 'Voir',
    },
    gallery: {
        title: 'Galerie SVG',
        viewDetails: 'Voir les détails',
    }
  },
} 
```

Avantage : vous centralisez toutes vos traductions dans un seul fichier. Ajouter une nouvelle langue ne demandera qu’à compléter cet objet.

4. Créer un fichier `src\middleware\index.js`. Ce fichier definie le . Un middleware [(Voir la documentation Astro)](https://docs.astro.build/fr/guides/middleware/) est un code qui s’exécute avant qu’Astro ne traite la requête et ne renvoie la page à l’utilisateur.
Il agit comme un intermédiaire entre le navigateur et votre application : il peut lire, modifier ou compléter les informations de la requête (cookies, en-têtes, URL…), puis décider de la manière dont la réponse doit être construite.

Dans notre cas, le middleware servira à :
- Vérifier si l’utilisateur possède déjà un cookie indiquant sa langue préférée.
- Appliquer cette langue automatiquement si le cookie existe.
- Sinon, choisir la langue par défaut du navigateur.

Voici le code du middleware:

```js
export const onRequest = async (context, next) => {
  // Cette fonction middleware s'exécute à chaque requête.
  // context = infos de la requête (URL, cookies, méthode...)
  // next() = continue le traitement normal (afficher la page demandée)
  if (context.url.pathname.startsWith('/api/')) {
    return next();
  }
  // ✅ Si la requête est un POST (soumission du formulaire de langue) :
  if (context.request.method === 'POST') {
    // Lire les données du formulaire
    const form = await context.request.formData().catch(() => null);
    const lang = form?.get('language'); // Récupérer la langue choisie

    // Vérifier que la langue est bien 'en' ou 'fr'
    if (lang === 'en' || lang === 'fr') {
      // Enregistrer la préférence dans un cookie nommé 'locale'
      // - path: '/' → cookie disponible sur tout le site
      // - maxAge: 1 an
      context.cookies.set('locale', String(lang), { path: '/', maxAge: 60 * 60 * 24 * 365 });

      // Rediriger avec un code 303 (See Other) vers la même page en GET
      // Cela évite que le formulaire soit renvoyé si l'utilisateur recharge la page
      return Response.redirect(new URL(context.url.pathname + context.url.search, context.url), 303);
    }
  }

  // Déterminer la langue pour cette requête
  const cookieLocale = context.cookies.get('locale')?.value; // Lire la langue depuis le cookie

  // Choisir la langue finale :
  // - Si cookie valide → utiliser la valeur du cookie
  // - Sinon → essayer d'utiliser la langue préférée du navigateur
  // - Si rien n'est défini → utiliser 'en' par défaut
  context.locals.lang = (cookieLocale === 'fr' || cookieLocale === 'en')
    ? cookieLocale
    : (context.preferredLocale) ?? 'en';

  // Continuer le traitement normal (afficher la page demandée)
  return next();
};
```

`context.locals.lang` contient la langue à utiliser pour la page, accessible dans toutes les pages Astro. Example d'utilisation dans la page d'acceuil:

```html
---
import Layout from "../layouts/Layout.astro";
import { ui } from "../i18n/ui.js";

const locale = Astro.locals.lang as 'en' | 'fr' ?? 'en';
console.log('Locale in index:', locale);
---

<Layout title="{ui[locale].index.title}">
  <div class="flex flex-col h-full items-center justify-center glass bg-primary">
    <h1 class="text-4xl font-bold mb-4 text-primary-content">{ui[locale].index.title}</h1>
    <p class="mb-6 text-lg text-primary-content">{ui[locale].index.description}</p>
    <a href="generator" class="btn btn-secondary">{ui[locale].index.button}</a>
  </div>
</Layout>
```

5. Faites de même pour toutes vos pages.

6. Vérifez que le changement de langue fonctionne dans toutes vos pages. Puis, faites un commit et push.
