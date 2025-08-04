# Language System Implementation

This document explains how to use the language changing system implemented in your Phaser game.

## Overview

The language system consists of:
- **LanguageManager**: Singleton class that manages language switching and translation
- **Translations.ts**: Contains all translation strings for supported languages  
- **LanguageSelectionScene**: UI for users to select their preferred language
- Language integration in various scenes

## Supported Languages

- English (`en`)
- French (`fr`) 
- Arabic (`ar`)

## How to Use

### Basic Usage

```typescript
import { languageManager } from '../utils/LanguageManager';

// Get translated text
const text = languageManager.getText('table_selection_scene_title');

// Get formatted text with parameters (e.g., "Your Score: 100")
const scoreText = languageManager.getFormattedText('victory_score', '100');

// Change language
languageManager.setLanguage('fr');
```

### In Scene Implementation

1. **Import the language manager**:
```typescript
import { languageManager } from '../utils/LanguageManager';
```

2. **Create text elements using translations**:
```typescript
const titleText = this.add.text(x, y, languageManager.getText('some_key'), {
    fontSize: '24px',
    color: '#ffffff'
});
```

3. **Subscribe to language changes** (in `create()` method):
```typescript
this.languageChangeUnsubscribe = languageManager.onLanguageChange(() => {
    this.updateTexts();
});
```

4. **Update texts when language changes**:
```typescript
private updateTexts() {
    if (this.titleText) {
        this.titleText.setText(languageManager.getText('some_key'));
    }
}
```

5. **Clean up subscription** (in `destroy()` method):
```typescript
destroy() {
    if (this.languageChangeUnsubscribe) {
        this.languageChangeUnsubscribe();
    }
}
```

## How to Add New Languages

1. **Add language to supported types** in `LanguageManager.ts`:
```typescript
export type SupportedLanguage = 'en' | 'fr' | 'ar' | 'es'; // Add 'es' for Spanish
```

2. **Add translation keys** in `Translations.ts`:
```typescript
export const translations: Record<string, TranslationKeys> = {
  // ... existing languages
  es: {
    table_selection_scene_title: 'Elige tablas para revisar',
    // ... all other keys
  }
};
```

3. **Update display names** in `LanguageManager.ts`:
```typescript
public getLanguageDisplayName(language: SupportedLanguage): string {
    const displayNames: Record<SupportedLanguage, string> = {
        en: 'English',
        fr: 'Français', 
        ar: 'العربية',
        es: 'Español' // Add Spanish
    };
    return displayNames[language] || language;
}
```

## How to Add New Translation Keys

1. **Add to the interface** in `Translations.ts`:
```typescript
export interface TranslationKeys {
    // ... existing keys
    new_feature_title: string;
    new_feature_description: string;
}
```

2. **Add translations for all languages**:
```typescript
export const translations: Record<string, TranslationKeys> = {
  en: {
    // ... existing translations
    new_feature_title: 'New Feature',
    new_feature_description: 'This is a new feature',
  },
  fr: {
    // ... existing translations
    new_feature_title: 'Nouvelle Fonctionnalité',
    new_feature_description: 'Ceci est une nouvelle fonctionnalité',
  },
  ar: {
    // ... existing translations
    new_feature_title: 'ميزة جديدة',
    new_feature_description: 'هذه ميزة جديدة',
  }
};
```

## Features

### Language Persistence
The selected language is automatically saved to `localStorage` and restored when the game loads.

### Language Button in Main Menu
A language selection button (🌐) appears in the top-right corner of the main menu. Clicking it opens the language selection scene.

### Formatted Text Support
Use `getFormattedText()` for strings with placeholders:
```typescript
// Translation: "Your Score: {0}"
const text = languageManager.getFormattedText('victory_score', '150');
// Result: "Your Score: 150"
```

### RTL Language Support
Arabic text direction is automatically handled:
```typescript
const direction = languageManager.getTextDirection(); // 'rtl' for Arabic
const align = languageManager.getTextAlign(); // 'right' for Arabic
```

## Current Implementation Status

✅ **Implemented Scenes:**
- MainMenu (with language button)
- TableSelectScene (fully translated)
- VictoryScene (with formatted text example)
- LanguageSelectionScene (dedicated language picker)

🔄 **Scenes to Update:**
- Game scene (in-game UI elements)
- ReviewMistakesScene
- Other game scenes

## Tips

1. Always use translation keys instead of hardcoded strings
2. Test with all supported languages to ensure UI layout works
3. Consider text length differences between languages when designing UI
4. Use the `getFormattedText()` method for dynamic content
5. Always clean up language change subscriptions in scene destroy methods

## Best Practices for Scene Integration

### Proper Scene Lifecycle Management

When integrating the language system into scenes, follow these best practices to avoid errors:

```typescript
export default class YourScene extends Phaser.Scene {
    private languageChangeUnsubscribe?: () => void;

    create() {
        // Your scene creation logic...

        // Subscribe to language changes with scene activity check
        this.languageChangeUnsubscribe = languageManager.onLanguageChange(() => {
            // Only update if this scene is active and manager exists
            if (this.scene && this.scene.manager && this.scene.isActive()) {
                this.updateTexts();
            }
        });

        // Clean up on scene shutdown
        this.events.on('shutdown', () => {
            this.cleanup();
        });
    }

    private updateTexts() {
        // Only update if scene is active and text objects exist
        if (!this.scene || !this.scene.manager || !this.scene.isActive()) return;
        
        if (this.someText && this.someText.active) {
            this.someText.setText(languageManager.getText('some_key'));
        }
    }

    private cleanup() {
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
    }

    destroy() {
        this.cleanup();
    }
}
```

### Key Safety Checks

1. **Scene Validity Check**: Always check `this.scene && this.scene.manager && this.scene.isActive()` before updating text objects
2. **Object Existence Check**: Verify text objects exist and are active before updating them
3. **Proper Cleanup**: Unsubscribe from language changes when scenes are destroyed or shut down
4. **Input Handler Reset**: Re-setup input handlers when scenes resume (for scenes that pause/resume)
5. **Null Manager Check**: Ensure the scene manager exists before calling isActive()

### Enhanced Safety Features

The LanguageManager now includes automatic cleanup of invalid callbacks:
- Failed callbacks are automatically removed from the subscriber list
- This prevents memory leaks from destroyed scenes
- Invalid scene references are safely handled

### Common Pitfalls to Avoid

- ❌ Don't update text objects in inactive scenes
- ❌ Don't forget to unsubscribe from language changes
- ❌ Don't use `once` event handlers without re-registering them on resume
- ❌ Don't access text properties without checking if the object is active
- ❌ Don't assume scene.manager exists - always check for null
- ❌ Don't call scene.isActive() without first checking if scene and manager exist

## Example: Complete Scene Implementation

```typescript
import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';

export default class ExampleScene extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private languageChangeUnsubscribe?: () => void;

    constructor() {
        super('ExampleScene');
    }

    create() {
        // Create translated text
        this.titleText = this.add.text(
            this.scale.width / 2,
            100,
            languageManager.getText('example_title'),
            { fontSize: '32px', color: '#ffffff' }
        ).setOrigin(0.5);

        // Subscribe to language changes
        this.languageChangeUnsubscribe = languageManager.onLanguageChange(() => {
            this.updateTexts();
        });
    }

    private updateTexts() {
        if (this.titleText) {
            this.titleText.setText(languageManager.getText('example_title'));
        }
    }

    destroy() {
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
        }
    }
}
```

if 80% pass the player, else replay the level again 
parallex in the main game
TODO : Add player bullet and enemy bullet collision and start 4th epic
disable player bullet after collision