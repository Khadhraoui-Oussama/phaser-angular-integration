import { translations, TranslationKeys } from './Translations';

export type SupportedLanguage = 'en' | 'fr' | 'ar';

export class LanguageManager {
    private static instance: LanguageManager;
    private currentLanguage: SupportedLanguage = 'en';
    private onLanguageChangeCallbacks: ((language: SupportedLanguage) => void)[] = [];

    private constructor() {
        // Load saved language from localStorage
        const savedLanguage = localStorage.getItem('gameLanguage') as SupportedLanguage;
        if (savedLanguage && this.isValidLanguage(savedLanguage)) {
            this.currentLanguage = savedLanguage;
        }
    }

    public static getInstance(): LanguageManager {
        if (!LanguageManager.instance) {
            LanguageManager.instance = new LanguageManager();
        }
        return LanguageManager.instance;
    }

    public getCurrentLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }

    public setLanguage(language: SupportedLanguage): void {
        if (!this.isValidLanguage(language)) {
            console.warn(`Unsupported language: ${language}`);
            return;
        }

        const previousLanguage = this.currentLanguage;
        this.currentLanguage = language;
        
        // Save to localStorage
        localStorage.setItem('gameLanguage', language);

        // Notify all subscribers if language actually changed
        if (previousLanguage !== language) {
            // Filter out callbacks that might reference destroyed scenes
            this.onLanguageChangeCallbacks = this.onLanguageChangeCallbacks.filter(callback => {
                try {
                    callback(language);
                    return true; // Keep callback if it executed successfully
                } catch (error) {
                    console.warn('Removing invalid language change callback:', error);
                    return false; // Remove callback if it failed
                }
            });
        }
    }

    public getText(key: keyof TranslationKeys): string {
        const langTranslations = translations[this.currentLanguage];
        if (!langTranslations) {
            console.warn(`No translations found for language: ${this.currentLanguage}`);
            return String(key);
        }

        const translation = langTranslations[key];
        if (!translation) {
            console.warn(`Translation key "${String(key)}" not found for language: ${this.currentLanguage}`);
            // Fallback to English if current language doesn't have the key
            const fallback = translations['en'][key];
            return fallback || String(key);
        }

        return translation;
    }

    public getFormattedText(key: keyof TranslationKeys, ...params: string[]): string {
        let text = this.getText(key);
        
        // Replace placeholders like {0}, {1}, etc. with provided parameters
        params.forEach((param, index) => {
            text = text.replace(`{${index}}`, param);
        });
        
        return text;
    }

    // Helper method to safely check if a scene is valid and active
    private isSceneValid(scene: any): boolean {
        return scene && scene.scene && scene.scene.manager && scene.scene.isActive();
    }

    public onLanguageChange(callback: (language: SupportedLanguage) => void): () => void {
        this.onLanguageChangeCallbacks.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.onLanguageChangeCallbacks.indexOf(callback);
            if (index > -1) {
                this.onLanguageChangeCallbacks.splice(index, 1);
            }
        };
    }

    // Enhanced version that includes scene safety checks
    public onLanguageChangeWithSceneCheck(scene: any, callback: (language: SupportedLanguage) => void): () => void {
        const safeCallback = (language: SupportedLanguage) => {
            if (this.isSceneValid(scene)) {
                callback(language);
            }
        };
        
        return this.onLanguageChange(safeCallback);
    }

    public getSupportedLanguages(): SupportedLanguage[] {
        return Object.keys(translations) as SupportedLanguage[];
    }

    public getLanguageDisplayName(language: SupportedLanguage): string {
        const displayNames: Record<SupportedLanguage, string> = {
            en: 'English',
            fr: 'Français',
            ar: 'العربية'
        };
        return displayNames[language] || language;
    }

    private isValidLanguage(language: string): language is SupportedLanguage {
        return Object.keys(translations).includes(language);
    }

    // Helper method to get text direction for RTL languages
    public getTextDirection(): 'ltr' | 'rtl' {
        return this.currentLanguage === 'ar' ? 'rtl' : 'ltr';
    }

    // Helper method to get text alignment for RTL languages
    public getTextAlign(): 'left' | 'right' | 'center' {
        return this.currentLanguage === 'ar' ? 'right' : 'left';
    }
}

// Export singleton instance for easy access
export const languageManager = LanguageManager.getInstance();
