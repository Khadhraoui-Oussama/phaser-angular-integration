export interface TranslationKeys {
  // Main Menu
  main_menu_play: string;
  main_menu_select_level: string;
  main_menu_quit: string;
  
  // Game Over
  mission_failed: string;
  energy_depleted: string;
  final_score: string;
  restart_level: string;
  main_menu: string;
  
  // Victory Screen
  victory_congratulations: string;
  victory_all_levels_completed: string;
  victory_level_select: string;
  
  // Language Selection
  language_selection_title: string;
  
  // General
  back: string;
  level: string;
  score: string;
}

export const translations: Record<string, TranslationKeys> = {
  en: {
    main_menu_play: 'Play',
    main_menu_select_level: 'Select level',
    main_menu_quit: 'Quit',
    
    mission_failed: 'MISSION FAILED',
    energy_depleted: 'Energy Depleted',
    final_score: 'Final Score',
    restart_level: 'RESTART LEVEL',
    main_menu: 'MAIN MENU',
    
    victory_congratulations: 'CONGRATULATIONS!',
    victory_all_levels_completed: 'ALL LEVELS COMPLETED!',
    victory_level_select: 'LEVEL SELECT',
    
    language_selection_title: 'Select Language',
    
    back: 'Back',
    level: 'Level',
    score: 'Score'
  },
  fr: {
    main_menu_play: 'Jouer',
    main_menu_select_level: 'Sélectionner niveau',
    main_menu_quit: 'Quitter',
    
    mission_failed: 'MISSION ÉCHOUÉE',
    energy_depleted: 'Énergie Épuisée',
    final_score: 'Score Final',
    restart_level: 'RECOMMENCER NIVEAU',
    main_menu: 'MENU PRINCIPAL',
    
    victory_congratulations: 'FÉLICITATIONS !',
    victory_all_levels_completed: 'TOUS LES NIVEAUX TERMINÉS !',
    victory_level_select: 'SÉLECTION DE NIVEAU',
    
    language_selection_title: 'Sélectionner la langue',
    
    back: 'Retour',
    level: 'Niveau',
    score: 'Score'
  },
  ar: {
    main_menu_play: 'لعب',
    main_menu_select_level: 'اختر المستوى',
    main_menu_quit: 'خروج',
    
    mission_failed: 'فشلت المهمة',
    energy_depleted: 'نفدت الطاقة',
    final_score: 'النقاط النهائية',
    restart_level: 'إعادة تشغيل المستوى',
    main_menu: 'القائمة الرئيسية',
    
    victory_congratulations: '! تهانينا',
    victory_all_levels_completed: '! جميع المستويات مكتملة',
    victory_level_select: 'اختيار المستوى',
    
    language_selection_title: 'اختر اللغة',
    
    back: 'رجوع',
    level: 'مستوى',
    score: 'النقاط'
  }
};
