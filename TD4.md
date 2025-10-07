# TD et TP 4:
__Objectif pédagogique__: Utiliser l'IA pour configurer les SVG générés.

## Utilisation de l'inference gratuit de OpenRouter.
- Créez un compte sur [OpenRouter](https://openrouter.ai/). OpenRouter fournit des modèles avec de l'inférence gratuite.
- Récupérez votre clé d'accès de la même manière que pour HuggingFace.
- Choisissez un modèle gratuit, par exemple : `openai/gpt-oss-20b:free`.
- Modifiez l'URL et la clé dans votre code pour utiliser l'inférence d'OpenRouter à la place de HuggingFace.

## Modification de l'endpoint generateSVG.js

Modifier l'endpoint `generateSVG.js` pour qu'il recoit l'historique de la conversation dans la `request`:

```js
export const POST = async ({ request }) => {
    // Affiche la requête dans la console pour le débogage
    console.log(request);

    // Extraction des message du corps de la requête
    const { messages } = await request.json();
    
    // Initialisation du client OpenAI avec l'URL de base et le token d'API
    const client = new OpenAI({
        baseURL: BASE_URL, // URL de l'API
        apiKey: ACCESS_TOKEN, // Token d'accès pour l'API
    });
    
    // Création du message système pour guider le modèle
    let SystemMessage = 
        {
            role: "system", // Rôle du message
            content: "You are an SVG code generator. Generate SVG code for the following messages. Make sure to include ids for each part of the generated SVG.", // Contenu du message
        };
    
    // Appel à l'API pour générer le code SVG en utilisant le modèle spécifié
    const chatCompletion = await client.chat.completions.create({
        model: "NOM_MODEL", // Nom du modèle à utiliser
        messages: [SystemMessage, ...messages] // Messages envoyés au modèle, incluant le message système et l'historique des messages
    });
    
    // Récupération du message généré par l'API
    const message = chatCompletion.choices[0].message || "";
    
    // Affiche le message généré dans la console pour le débogage
    console.log("Generated SVG:", message);
    
    // Recherche d'un élément SVG dans le message généré
    const svgMatch = message.content.match(/<svg[\s\S]*?<\/svg>/i);
    
    // Si un SVG est trouvé, le remplace dans le message, sinon laisse une chaîne vide
    message.content = svgMatch ? svgMatch[0] : "";
    
    // Retourne une réponse JSON contenant le SVG généré
    return new Response(JSON.stringify({ svg: message }), {
        headers: { "Content-Type": "application/json" }, // Définit le type de contenu de la réponse
    });
};
```

- Dans le script de `generator.astro`, ajoutez une liste qui contiendra l'historique des échanges :
```js
let promptList = [];
```

Cette liste doit contenir les prompts sous la forme suivante :

```js
[
    {
        role: 'user',
        content: PROMPT...
    },
    {
        role: 'assistant',
        content: REPONSE...
    }
]
```

- Mettez à jour la fonction `handleSubmit` pour qu'elle ajoute chaque prompt utilisateur à la liste avant de l'envoyer :
```js
async function handleSubmit() {
    let prompt = "";
    let aiResponse = "";
    const promptElement = document.getElementById("user-prompt");
    prompt = promptElement ? promptElement.value : "";
    console.log("submitted: ", prompt);
    // Réinitialiser la liste des prompts
    promptList.length = 0; 
    promptList.push({ role: "user", content: prompt });
    const svgContainer = document.getElementById("svg-container");
    // Afficher un spinner
    svgContainer.innerHTML = `<span class="loading loading-ring loading-xl"></span>`;
    generateButton.disabled = true;
    editButton.disabled = true;
    let svgOutput = document.getElementById("svg-output");
    // Appeler la fonction pour générer le SVG
    aiResponse = await generateSVG(promptList);
    // Extraire le SVG de la réponse
    const svgMatch = aiResponse.content.match(/<svg[\s\S]*?<\/svg>/i);
    aiResponse.content = svgMatch ? svgMatch[0] : "";
    console.log("svgCode: ", aiResponse.content);
    // Ajouter la réponse de l'IA à la liste des prompts
    promptList.push(aiResponse);
    // Afficher le SVG généré
    svgOutput.textContent = aiResponse.content;
    svgContainer.innerHTML = aiResponse.content;
    // Réactiver les boutons
    generateButton.disabled = false;
    editButton.disabled = false;
}
```

- Réessayez et effectuez un commit. Cela doit fonctionner comme auparavant.

Dans la suite nous allons ajouter une fonctionnalité qui permet d'éditer le svg générer en language naturel.

## Modification du SVG généré

- Ajouter un bouton `edit`.
```html
<button class="btn btn-secondary m-2" id="edit-button">Edit</button>
```

- Ajouter la fonction `handleEdit()`. Cette fonction doit ajouter la requête saisie à la liste `promptList`, envoyer une requête `POST` à l'endpoint `generateSVG` contenant `promptList`, ajouter la réponse dans `promptList`, puis mettre à jour le SVG affiché.

```js
const editButton = document.getElementById("edit-button");

async function handleEdit() {
    let prompt = "";
    let aiResponse = "";
    const promptElement = document.getElementById("user-prompt");
    prompt = promptElement ? promptElement.value : "";
    console.log("Prompt soumis : ", prompt);
    // Ajout du prompt de l'utilisateur à la liste
    promptList.push({ role: "user", content: prompt });
    const svgContainer = document.getElementById("svg-container");
    // Afficher un spinner de chargement
    svgContainer.innerHTML += `<span class="loading loading-ring loading-xl"></span>`;
    generateButton.disabled = true;
    editButton.disabled = true;
    let svgOutput = document.getElementById("svg-output");
    // Appeler la fonction pour générer le SVG
    aiResponse = await generateSVG(promptList);
    // Extraire le SVG de la réponse
    const svgMatch = aiResponse.content.match(/<svg[\s\S]*?<\/svg>/i);
    aiResponse.content = svgMatch ? svgMatch[0] : "";
    console.log("Code SVG généré : ", aiResponse.content);
    // Ajouter la réponse de l'IA à la liste des prompts
    promptList.push(aiResponse);
    // Afficher le SVG généré
    svgOutput.textContent = aiResponse.content;
    svgContainer.innerHTML = aiResponse.content;
    // Réactiver les boutons
    generateButton.disabled = false;
    editButton.disabled = false;
    console.log("Historique des prompts : ", promptList);
}

if (editButton) {
    editButton.addEventListener("click", handleEdit);
}
```

## Sauvgarde du SVG

-  Ajoutez un bouton `Sauvegarder` dans l'interface utilisateur pour permettre l'enregistrement des SVG générés.
- Créez une nouvelle collection dans PocketBase avec les champs suivants : `name`, `code_svg`, `chat_history`.

> ⚠️ N'oubliez pas d'utiliser pocketbase-typegen pour les types.


- Ajouter un endpoint `pages/api/saveSVG.js` qui permet de sauvegarder le SVG dans PocketBase :
```js
import pb from "../../utils/pb";
import { Collections } from "../../utils/pocketbase-types";

export async function POST({ request }) {
  const data = await request.json();
  console.log("Received data to save:", data);
  try {
    const record = await pb
      .collection(Collections.Svg)
      .create(data);
    console.log("SVG saved with ID:", record.id);

    return new Response(JSON.stringify({ success: true, id: record.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error saving SVG:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
```

- Dans le fichier `generator.astro`, ajoutez le gestionnaire d'événements pour le bouton de sauvegarde :
- 
```js
const saveButton = document.getElementById("save-button");
    async function saveSVG(params) {
        const res = await fetch("/api/saveSVG", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        });
        const data = await res.json();
        return data;
    }
    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            const name = prompt("Entrez un nom pour le SVG :");
            const svgOutput = document.getElementById("svg-output")?.textContent;
            console.log("Sauvegarde du SVG : ", JSON.stringify(svgOutput));
            
            const params = {
                nom: name,
                code_svg: svgOutput || "<svg></svg>",
                chat_history: JSON.stringify(promptList),
            };
            await saveSVG(params);
        });
    }
```

Dans le fichier generator.astro, ajoutez le gestionnaire d'événements pour le bouton de sauvegarde :
```js
// Fonction utilitaire pour sauvegarder le SVG
const saveButton = document.getElementById("save-button");

async function saveSVG(params) {
    // Envoi de la requête à notre endpoint
    const res = await fetch("/api/saveSVG", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
    });
    return await res.json();
}

// Gestionnaire d'événements pour le bouton de sauvegarde
if (saveButton) {
    saveButton.addEventListener("click", async () => {
        // Demande du nom du SVG à l'utilisateur
        const name = prompt("Donnez un nom à votre création :");
        const svgOutput = document.getElementById("svg-output")?.textContent;
        console.log("Préparation de la sauvegarde :", JSON.stringify(svgOutput));
        
        // Préparation des données pour la sauvegarde
        const params = {
            nom: name,
            code_svg: svgOutput || "<svg></svg>", // SVG par défaut si vide
            chat_history: JSON.stringify(promptList), // Historique des échanges
        };
        
        // Sauvegarde et gestion de la réponse
        const result = await saveSVG(params);
        if (result.success) {
            alert("SVG sauvegardé avec succès !");
        } else {
            alert("Erreur lors de la sauvegarde : " + result.error);
        }
    });
}
```
Cette implémentation permet de :
1. Capturer le SVG généré
2. Demander un nom à l'utilisateur
3. Sauvegarder l'ensemble dans PocketBase
4. Informer l'utilisateur du résultat de l'opération

- Ajoutez une page `gallery\index.astro` pour afficher les SVG sauvegarder si ce n'est pas encore fait en TD 3.

## Modification des SVG sauvegardés

Dans cette partie, vous allez créer une interface de chat permettant de modifier un SVG déjà généré. L'objectif est de permettre à l'utilisateur de discuter avec l'IA pour affiner ou transformer le SVG, tout en visualisant l'historique des échanges.

### 1. Création d'une route dynamique

Créez une nouvelle page dynamique nommée `gallery/[id].astro`. Cette page affichera un SVG sauvegardé ainsi que l'historique des échanges associés à ce SVG.

### 2. Récupération du SVG et de l'historique

Dans le frontmatter de la page, récupérez le SVG et son historique depuis PocketBase à l'aide de l'identifiant passé dans l'URL :

```astro
---
import Layout from "../../layouts/Layout.astro";
import pb from "../../utils/pb";
import { Collections, type SvgRecord } from "../../utils/pocketbase-types";

const id = Astro.params.id;
const svg: SvgRecord = await pb.collection(Collections.Svg).getOne(id);
---
```

### 3. Construction de l'interface utilisateur

![alt text](image-edit-chat.png)
L'interface doit comporter deux parties principales :

- Une `div` pour afficher le SVG généré.
- Une zone de chat permettant d'afficher l'historique des échanges et d'envoyer de nouveaux prompts à l'IA.

Utilisez les composants `divider` et `chat bubble` de DaisyUI pour structurer l'interface.

#### Exemple de code HTML pour l'historique du chat

```html
<div id="chat-history" class="flex flex-col gap-4 w-full mb-20 overflow-y-auto flex-grow">
    {
        (Array.isArray(svg?.chat_history) && svg.chat_history.length > 0) ? (
            svg.chat_history.map((msg: { role: string; content: string; }) => (
                <div class={`chat ${msg.role === 'user' ? 'chat-start' : 'chat-end'}`}>
                    <div class={`chat-bubble ${msg.role === 'user' ? 'bg-primary text-primary-content' : 'bg-secondary text-secondary-content'}`}>
                        <pre>{msg.content}</pre>
                    </div>
                    <div class="chat-footer opacity-60 text-xs mt-1">{msg.role}</div>
                </div>
            ))
        ) : (
            <span class="text-error">Aucun historique de chat.</span>
        )
    }
</div>
```

### 4. Ajout du formulaire de chat

Sous la conversation, ajoutez un formulaire avec un champ de saisie pour permettre à l'utilisateur d'envoyer de nouveaux prompts à l'IA. À chaque envoi, le prompt et la réponse de l'IA doivent être ajoutés à l'historique et le SVG mis à jour en conséquence.

```html
<form id="input-prompt-form" class="flex flex-col gap-2 w-full absolute bottom-0 left-0 right-0 bg-base-300 p-4" method="POST" autocomplete="off" >
    <input type="hidden" name="history" value={JSON.stringify(svg?.chat_history)} />
    <input type="hidden" name="id" value={svg?.id} />
    <div class="flex items-center gap-2">
        <input id="prompt-input" name="editPrompt" type="text" class="input flex-grow" placeholder="Enter a prompt to edit the SVG..." />
        <button class="btn btn-primary" type="submit">Edit</button>
    </div>
</form>
```

> Les champs de type `hidden` dans un formulaire permettent d'envoyer des informations sans les afficher à l'utilisateur. Cela peut être utile pour transmettre des données supplémentaires, comme des identifiants  tout en gardant l'interface utilisateur propre et simple.


### 5. Gestion de l'evenement

```js
<script>
    //@ts-nocheck
    const form = document.getElementById('...');
    const svgPreview = document.getElementById('...');
    const chatHistory = document.getElementById('...');

    // Fonction pour générer le SVG à partir du prompt
    async function generateSVG(prompt) {
        ...
    }

    // Écouteur d'événement pour le formulaire de soumission
    form?.addEventListener('submit', async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page
        const formData = new FormData(form);
        console.log(JSON.stringify(Object.fromEntries(formData)));

        // Créez un objet pour le prompt de l'utilisateur
        let prompt = {
            role: 'user',
            content: formData.get('editPrompt')
        };

        // Récupérez l'historique des messages
        let history = JSON.parse(formData.get('history'));
        history.push(...); // Ajoutez le nouveau prompt à l'historique

        // Réinitialisez le champ de saisie
        document.getElementById('prompt-input').value = '';

        // Affichez un indicateur de chargement
        svgPreview.innerHTML += `<span class="loading loading-ring loading-xl"></span>`;
        
        // Ajoutez le prompt à l'historique du chat
        chatHistory.innerHTML += `...`;

        // Appelez la fonction pour générer le SVG
        let aiResponse = await generateSVG(prompt);
        history.push({ role: 'assistant', content: aiResponse }); // Ajoutez la réponse de l'IA à l'historique

        // Extraire le SVG de la réponse
        const svgMatch = aiResponse.match(/<svg[\s\S]*?<\/svg>/i);
        aiResponse = svgMatch ? svgMatch[0] : "";

        console.log("svgCode: ", aiResponse);
         // Mettez à jour l'affichage du SVG
        svgPreview. ... = ...;

        // Ajoutez le code SVG à l'historique du chat
        chatHistory.innerHTML += `...`;

        form.reset(); // Réinitialisez le formulaire
    });
</script>
```

### 6. Mettre a jour les données dans pocketbase

- Créez un endpoint `updateSVG.js` pour mettre a jour les données dans pocketbase. Le code est très similaire à `saveSVG.js`, mais à la place de create, on utilise la méthode update de PocketBase pour mettre à jour un enregistrement existant.

- Créer la fonction `update` côté client. Cette fonction envoie les données mises à jour à l’endpoint updateSVG. Le paramètre `updatedData` doit contenir l’`id` de l’enregistrement ainsi que les champs modifiés.

```js
async function update(updatedData) {
        const response = await fetch("/api/updateSVG", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
        });
        return response;
    };
```

- Une fois que vous avez récupéré les données modifiées (nouveau code SVG, nouvel historique), vous pouvez appeler update et gérer la réponse pour informer l’utilisateur.

```js
const response = await update({
    id: formData.get("id"),
    code_svg: ...,
    chat_history: JSON.stringify(...),
});
const data = await response.json();

if (data.success) {
    alert("SVG updated successfully");
} else {
    alert("Failed to update SVG");
}
```

- Faites un commit puis push.