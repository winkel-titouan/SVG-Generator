# Locale Utilities Usage Guide

## Best Practices for Locale Management in Your Astro Project

Your locale logic has been centralized into `src/utils/locale.ts` with the following utilities:

### Available Functions

1. **`getLocale(context: APIContext): Promise<SupportedLocale>`**
   - Main function for determining locale
   - Handles POST form submissions for language switching
   - Falls back to URL → Cookie → Browser preference → Default

2. **`getLangFromUrl(url: URL): SupportedLocale | null`**
   - Extracts locale from URL pathname
   - Returns null if no locale found in URL

3. **`getLocaleSync(cookieLocale, preferredLocale): SupportedLocale`**
   - Synchronous version when you already have cookie/preference data

4. **`isSupportedLocale(locale: string): locale is SupportedLocale`**
   - Type guard for checking if a string is a valid locale

## Usage Examples

### In Layout Components (Your current case)
```astro
---
// src/layouts/Layout.astro
import { getLocale } from '../utils/locale';

const locale = await getLocale(Astro);
---
```

### In API Routes
```ts
// src/pages/api/example.ts
import type { APIRoute } from 'astro';
import { getLocale } from '../../utils/locale';

export const POST: APIRoute = async (context) => {
  const locale = await getLocale(context);
  // Your logic here
  return new Response(JSON.stringify({ locale }));
};
```

### In Page Components
```astro
---
// src/pages/example.astro
import { getLocale } from '../utils/locale';

const locale = await getLocale(Astro);
---

<h1>{locale === 'fr' ? 'Bonjour' : 'Hello'}</h1>
```

### In Middleware (Optional)
```ts
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { getLangFromUrl } from './utils/locale';

export const onRequest = defineMiddleware(async (context, next) => {
  const locale = getLangFromUrl(context.url) || 'en';
  context.locals.locale = locale;
  return next();
});
```

## Migration from Your Original Code

**Before:**
```ts
let locale: 'en' | 'fr';
const cookieLocale = Astro.cookies.get('locale')?.value;
if (cookieLocale === "en" || cookieLocale === "fr") {
  locale = cookieLocale;
} else {
  locale = (Astro.preferredLocale as 'en' | 'fr') ?? 'en';
}

if (Astro.request.method === "POST") {
  const formData = await Astro.request.formData();
  const selectedLanguage = formData.get("language");
  if (selectedLanguage === "en" || selectedLanguage === "fr") {
    locale = selectedLanguage;
    Astro.cookies.set('locale', String(locale))
  }
}
```

**After:**
```ts
import { getLocale } from '../utils/locale';
const locale = await getLocale(Astro);
```

## Alternative: Use Astro's Built-in i18n (Recommended)

Since you already have i18n configured in `astro.config.mjs`, consider using Astro's built-in functions:

```astro
---
import { getRelativeLocaleUrl } from 'astro:i18n';

// For URL-based locale detection
const segments = Astro.url.pathname.split('/');
const locale = (segments[1] === 'fr' || segments[1] === 'en') ? segments[1] : 'en';
---

<a href={getRelativeLocaleUrl('fr', 'about')}>À propos</a>
<a href={getRelativeLocaleUrl('en', 'about')}>About</a>
```

## Benefits of This Approach

1. **DRY Principle**: Write once, use everywhere
2. **Type Safety**: TypeScript ensures locale values are correct
3. **Consistent Behavior**: Same logic across all components
4. **Easy Maintenance**: Change locale logic in one place
5. **Better Testing**: Isolated functions are easier to test

## Configuration Requirements

Ensure your `astro.config.mjs` has i18n configured:

```js
export default defineConfig({
  i18n: {
    locales: ["en", "fr"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```