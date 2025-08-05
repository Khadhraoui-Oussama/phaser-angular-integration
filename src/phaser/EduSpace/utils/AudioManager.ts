/**
 * AudioManager - Centralized audio preference management for EduSpace game
 * Handles loading, saving, and applying audio preferences across all scenes
 */
export class AudioManager {
    private static readonly STORAGE_KEY = 'gameVolume';
    private static readonly REGISTRY_KEY = 'gameVolume';
    private static readonly DEFAULT_VOLUME = 1.0;

    static loadVolume(scene: Phaser.Scene): number {
        try {
            // Priority: Registry first (current session), then localStorage (persistent)
            const registryVolume = scene.registry.get(this.REGISTRY_KEY);
            const localStorageVolume = parseFloat(localStorage.getItem(this.STORAGE_KEY) || this.DEFAULT_VOLUME.toString());
            
            // Use registry if available, otherwise localStorage
            const savedVolume = registryVolume !== null && registryVolume !== undefined 
                ? registryVolume 
                : localStorageVolume;
            
            // Validate and clamp volume range
            const clampedVolume = Math.max(0, Math.min(1, savedVolume));
            
            console.log(`AudioManager: Loaded volume ${Math.round(clampedVolume * 100)}% in scene ${scene.scene.key}`);
            
            return clampedVolume;
        } catch (error) {
            console.error('AudioManager: Failed to load volume settings:', error);
            return this.DEFAULT_VOLUME;
        }
    }

  
    static saveVolume(scene: Phaser.Scene, volume: number): void {
        try {
            // Validate volume range
            const clampedVolume = Math.max(0, Math.min(1, volume));
            
           scene.registry.set(this.REGISTRY_KEY, clampedVolume);
            
            localStorage.setItem(this.STORAGE_KEY, clampedVolume.toString());
            
            console.log(`AudioManager: Saved volume ${Math.round(clampedVolume * 100)}% in scene ${scene.scene.key}`);
        } catch (error) {
            console.error('AudioManager: Failed to save volume settings:', error);
            // fallback
            const clampedVolume = Math.max(0, Math.min(1, volume));
            scene.registry.set(this.REGISTRY_KEY, clampedVolume);
        }
    }

    static applyVolume(scene: Phaser.Scene, volume: number): void {
        try {
            const clampedVolume = Math.max(0, Math.min(1, volume));
            scene.sound.setVolume(clampedVolume);
            console.log(`AudioManager: Applied volume ${Math.round(clampedVolume * 100)}% to scene ${scene.scene.key}`);
        } catch (error) {
            console.error('AudioManager: Failed to apply volume:', error);
        }
    }

    /**
     * Load and apply volume settings in one call
     * Convenience method for scene initialization
     */
    static loadAndApplyVolume(scene: Phaser.Scene): number {
        const volume = this.loadVolume(scene);
        this.applyVolume(scene, volume);
        this.saveVolume(scene, volume);
        return volume;
    }

    /**
     * Update volume and save preferences
     * Use this when volume is changed by user interaction
     */
    static updateVolume(scene: Phaser.Scene, newVolume: number): void {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        
        // Apply to current scene
        this.applyVolume(scene, clampedVolume);
        
        // Save to both storage methods
        this.saveVolume(scene, clampedVolume);
    }

    /**
     * Get current volume without applying it
     */
    static getCurrentVolume(scene: Phaser.Scene): number {
        return this.loadVolume(scene);
    }

    /**
     * Reset volume to default value
     */
    static resetVolume(scene: Phaser.Scene): void {
        this.updateVolume(scene, this.DEFAULT_VOLUME);
    }

    
    static hasStoredPreferences(): boolean {
        try {
            return localStorage.getItem(this.STORAGE_KEY) !== null;
        } catch (error) {
            return false;
        }
    }

    static clearPreferences(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('AudioManager: Cleared all audio preferences');
        } catch (error) {
            console.error('AudioManager: Failed to clear audio preferences:', error);
        }
    }
}
