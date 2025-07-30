export interface TranslationKeys {
  // Table Selection Scene
  table_selection_scene_title: string;
  table_selection_scene_start: string;
  table_selection_scene_random: string;
  
  // Main Menu
  main_menu_play: string;
  main_menu_select_level: string;
  main_menu_quit: string;
  
  // Game UI
  game_start_button: string;
  game_throw_button: string;
  
  // Language Selection
  language_selection_title: string;
  
  // General
  back: string;
  level: string;
}

export const translations: Record<string, TranslationKeys> = {
  en: {
    table_selection_scene_title: 'Choose tables to review',
    table_selection_scene_start: '▶ Start',
    table_selection_scene_random: 'Random Table',
    
    main_menu_play: 'Play',
    main_menu_select_level: 'Select level',
    main_menu_quit: 'Quit',
    
    game_start_button: 'START',
    game_throw_button: 'THROW',
    
    language_selection_title: 'Select Language',
    
    back: 'Back',
    level: 'Level'
  },
  fr: {
    table_selection_scene_title: 'Choisissez les tables à réviser',
    table_selection_scene_start: '▶ Commencer',
    table_selection_scene_random: 'Table Aléatoire',
    
    main_menu_play: 'Jouer',
    main_menu_select_level: 'Sélectionner niveau',
    main_menu_quit: 'Quitter',
    
    game_start_button: 'COMMENCER',
    game_throw_button: 'LANCER',
    
    language_selection_title: 'Sélectionner la langue',
    
    back: 'Retour',
    level: 'Niveau'
  },
  ar: {
    table_selection_scene_title: 'اختر الجداول للمراجعة',
    table_selection_scene_start: '▶ ابدأ',
    table_selection_scene_random: 'جدول عشوائي',
    
    main_menu_play: 'لعب',
    main_menu_select_level: 'اختر المستوى',
    main_menu_quit: 'خروج',
    
    game_start_button: 'ابدأ',
    game_throw_button: 'ارمي',
    
    language_selection_title: 'اختر اللغة',
    
    back: 'رجوع',
    level: 'مستوى'
  }
};
