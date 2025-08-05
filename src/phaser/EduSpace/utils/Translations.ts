export interface TranslationKeys {
  // Main Menu
  main_menu_play: string;
  main_menu_select_level: string;
  main_menu_quit: string;
  
  // Game Over
  mission_failed: string;
  energy_depleted: string;
  final_score: string;
  high_score: string;
  new_high_score: string;
  restart_level: string;
  main_menu: string;
  
  // Victory Screen
  victory_congratulations: string;
  victory_all_levels_completed: string;
  victory_level_select: string;
  
  // Language Selection
  language_selection_title: string;
  
  // Level Progression
  next_level_unlocked: string;
  level_unlock_requirement: string;
  
  // Settings
  settings_title: string;
  settings_volume: string;
  settings_skin_selection: string;
  settings_quit_level: string;
  settings_close: string;
  
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
    high_score: 'High Score',
    new_high_score: 'NEW HIGH SCORE!',
    restart_level: 'RESTART LEVEL',
    main_menu: 'MAIN MENU',
    
    victory_congratulations: 'CONGRATULATIONS!',
    victory_all_levels_completed: 'ALL LEVELS COMPLETED!',
    victory_level_select: 'LEVEL SELECT',
    
    language_selection_title: 'Select Language',
    
    next_level_unlocked: 'Next Level Unlocked!',
    level_unlock_requirement: 'Answer all questions correctly to auto-advance',
    
    settings_title: 'Settings',
    settings_volume: 'Volume',
    settings_skin_selection: 'Skin Selection',
    settings_quit_level: 'Quit Level',
    settings_close: 'Close',
    
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
    high_score: 'Meilleur Score',
    new_high_score: 'NOUVEAU RECORD !',
    restart_level: 'RECOMMENCER NIVEAU',
    main_menu: 'MENU PRINCIPAL',
    
    victory_congratulations: 'FÉLICITATIONS !',
    victory_all_levels_completed: 'TOUS LES NIVEAUX TERMINÉS !',
    victory_level_select: 'SÉLECTION DE NIVEAU',
    
    language_selection_title: 'Sélectionner la langue',
    
    next_level_unlocked: 'Niveau Suivant Débloqué !',
    level_unlock_requirement: 'Répondez correctement à toutes les questions pour avancer automatiquement',
    
    settings_title: 'Paramètres',
    settings_volume: 'Volume',
    settings_skin_selection: 'Sélection de skin',
    settings_quit_level: 'Quitter le niveau',
    settings_close: 'Fermer',
    
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
    high_score: 'أعلى نقاط',
    new_high_score: 'رقم قياسي جديد!',
    restart_level: 'إعادة تشغيل المستوى',
    main_menu: 'القائمة الرئيسية',
    
    victory_congratulations: '! تهانينا',
    victory_all_levels_completed: '! جميع المستويات مكتملة',
    victory_level_select: 'اختيار المستوى',
    
    language_selection_title: 'اختر اللغة',
    
    next_level_unlocked: '! تم فتح المستوى التالي',
    level_unlock_requirement: 'أجب على جميع الأسئلة بشكل صحيح للتقدم التلقائي',
    
    settings_title: 'الإعدادات',
    settings_volume: 'مستوى الصوت',
    settings_skin_selection: 'اختيار الشكل',
    settings_quit_level: 'ترك المستوى',
    settings_close: 'إغلاق',
    
    back: 'رجوع',
    level: 'مستوى',
    score: 'النقاط'
  }
};
