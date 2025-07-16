import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime, startWith } from 'rxjs/operators';

export enum ScreenSize {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

export interface GameDimensions {
  width: number;
  height: number;
  assetScale: number;
  uiScale: number;
  assetFolder: string;
  screenSize: ScreenSize;
}

export interface ResponsiveGameConfig {
  desktop: GameDimensions;
  tablet: GameDimensions;
  mobile: GameDimensions;
}

@Injectable({
  providedIn: 'root'
})
export class ScreenDetectionService {
  private currentScreenSizeSubject = new BehaviorSubject<ScreenSize>(ScreenSize.DESKTOP);
  private currentDimensionsSubject = new BehaviorSubject<GameDimensions>(this.getDefaultDimensions());

  public readonly currentScreenSize$ = this.currentScreenSizeSubject.asObservable();
  public readonly currentDimensions$ = this.currentDimensionsSubject.asObservable();

  // Screen size breakpoints (in pixels)
  private readonly breakpoints = {
    mobile: 768,
    tablet: 1200
  };

  // Responsive game configurations
  private readonly responsiveConfig: ResponsiveGameConfig = {
    desktop: {
      width: 1024,
      height: 768,
      assetScale: 1,
      uiScale: 1,
      assetFolder: 'desktop',
      screenSize: ScreenSize.DESKTOP
    },
    tablet: {
      width: 768,
      height: 576,
      assetScale: 0.6,    // Reverted back from 0.45 to original 0.6
      uiScale: 0.7,       // Reverted back from 0.6 to original 0.7
      assetFolder: 'tablet',
      screenSize: ScreenSize.TABLET
    },
    mobile: {
      width: 375,         // Keep width for small devices
      height: 320,        // Increased from 280 to make it more squared (375:320 ≈ 1.17:1)
      assetScale: 0.35,   
      uiScale: 0.5,       
      assetFolder: 'mobile',
      screenSize: ScreenSize.MOBILE
    }
  };

  constructor() {
    // Ensure responsiveConfig is properly initialized before proceeding
    if (!this.responsiveConfig) {
      console.error('ResponsiveConfig failed to initialize');
      return;
    }
    
    this.initializeScreenDetection();
    this.setupResizeListener();
  }

  private initializeScreenDetection(): void {
    const screenSize = this.detectScreenSize();
    this.currentScreenSizeSubject.next(screenSize);
    this.currentDimensionsSubject.next(this.getDimensionsForScreenSize(screenSize));
  }

  private setupResizeListener(): void {
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(250),
        startWith(null)
      )
      .subscribe(() => {
        const newScreenSize = this.detectScreenSize();
        if (newScreenSize !== this.currentScreenSizeSubject.value) {
          this.currentScreenSizeSubject.next(newScreenSize);
          this.currentDimensionsSubject.next(this.getDimensionsForScreenSize(newScreenSize));
        }
      });
  }

  private detectScreenSize(): ScreenSize {
    const screenWidth = window.innerWidth;
    
    if (screenWidth < this.breakpoints.mobile) {
      return ScreenSize.MOBILE;
    } else if (screenWidth < this.breakpoints.tablet) {
      return ScreenSize.TABLET;
    } else {
      return ScreenSize.DESKTOP;
    }
  }

  public getDimensionsForScreenSize(screenSize: ScreenSize): GameDimensions {
    // Add safety check for responsiveConfig
    if (!this.responsiveConfig) {
      console.warn('ResponsiveConfig not initialized, returning default desktop config');
      return {
        width: 1024,
        height: 768,
        assetScale: 1,
        uiScale: 1,
        assetFolder: 'desktop',
        screenSize: ScreenSize.DESKTOP
      };
    }
    
    const baseConfig = this.responsiveConfig[screenSize];
    
    // For mobile devices, adjust dimensions based on actual screen size to support smaller devices
    if (screenSize === ScreenSize.MOBILE) {
      const actualWidth = window.innerWidth;
      const actualHeight = window.innerHeight;
      
      // Calculate optimal game dimensions with better aspect ratio
      const minMobileWidth = 375;
      const gameWidth = Math.max(actualWidth * 0.95, minMobileWidth);
      
      // Make height more proportional to width for better squared aspect ratio
      // Target aspect ratio of ~1.2:1 instead of elongated ratios
      const targetAspectRatio = 1.2;
      const gameHeight = Math.max(gameWidth / targetAspectRatio, 300); // Minimum 300px height
      
      return {
        ...baseConfig,
        width: gameWidth,
        height: gameHeight,
      };
    }
    
    return baseConfig;
  }

  public getCurrentDimensions(): GameDimensions {
    // Add safety check
    if (!this.currentDimensionsSubject.value) {
      return this.getDefaultDimensions();
    }
    return this.currentDimensionsSubject.value;
  }

  public getCurrentScreenSize(): ScreenSize {
    // Add safety check
    if (!this.currentScreenSizeSubject.value) {
      return ScreenSize.DESKTOP;
    }
    return this.currentScreenSizeSubject.value;
  }

  private getDefaultDimensions(): GameDimensions {
    // Return a hard-coded default instead of relying on responsiveConfig
    return {
      width: 1024,
      height: 768,
      assetScale: 1,
      uiScale: 1,
      assetFolder: 'desktop',
      screenSize: ScreenSize.DESKTOP
    };
  }

  public getResponsiveConfig(): ResponsiveGameConfig {
    return this.responsiveConfig;
  }

  // Utility method to get viewport dimensions
  public getViewportDimensions() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
}
