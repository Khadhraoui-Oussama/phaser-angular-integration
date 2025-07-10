export interface TranslationKeys {
  // Table Selection Scene
  table_selection_scene_title: string;
  table_selection_scene_start: string;
  table_selection_scene_random: string;
  
  // Main Menu
  main_menu_start: string;
  main_menu_click_to_start: string;
  
  // Game UI
  game_score: string;
  game_high_score: string;
  game_question: string;
  game_paused: string;
  game_resume: string;
  
  // Victory Scene
  victory_title: string;
  victory_score: string;
  victory_new_high_score: string;
  victory_play_again: string;
  victory_menu: string;
  
  // Review Mistakes Scene
  review_mistakes_title: string;
  review_mistakes_question: string;
  review_mistakes_your_answer: string;
  review_mistakes_correct_answer: string;
  review_mistakes_continue: string;
  review_mistakes_menu: string;
  
  // Language Selection
  language_selection_title: string;
  language_english: string;
  language_french: string;
  language_arabic: string;
  
  // General
  back: string;
  next: string;
  previous: string;
  close: string;
}

export const translations: Record<string, TranslationKeys> = {
  en: {
    table_selection_scene_title: 'Choose tables to review',
    table_selection_scene_start: '▶ Start',
    table_selection_scene_random: 'Random Table',
    
    main_menu_start: 'Press SPACE to start',
    main_menu_click_to_start: 'Click to start',
    
    game_score: 'Score',
    game_high_score: 'High Score',
    game_question: 'Question',
    game_paused: 'Game Paused',
    game_resume: 'Press any key to resume',
    
    victory_title: 'Victory!',
    victory_score: 'Your Score: {0}',
    victory_new_high_score: 'New High Score!',
    victory_play_again: 'Play Again',
    victory_menu: 'Main Menu',
    
    review_mistakes_title: 'Review Your Mistakes',
    review_mistakes_question: 'Question: {0}',
    review_mistakes_your_answer: 'Your Answer: {0}',
    review_mistakes_correct_answer: 'Correct Answer: {0}',
    review_mistakes_continue: 'Continue',
    review_mistakes_menu: 'Main Menu',
    
    language_selection_title: 'Select Language',
    language_english: 'English',
    language_french: 'Français',
    language_arabic: 'العربية',
    
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close'
  },
  fr: {
    table_selection_scene_title: 'Choisissez les tables à réviser',
    table_selection_scene_start: '▶ Commencer',
    table_selection_scene_random: 'Table Aléatoire',
    
    main_menu_start: 'Appuyez sur ESPACE pour commencer',
    main_menu_click_to_start: 'Cliquez pour commencer',
    
    game_score: 'Score',
    game_high_score: 'Meilleur Score',
    game_question: 'Question',
    game_paused: 'Jeu en Pause',
    game_resume: 'Appuyez sur une touche pour reprendre',
    
    victory_title: 'Victoire !',
    victory_score: 'Votre Score : {0}',
    victory_new_high_score: 'Nouveau Record !',
    victory_play_again: 'Rejouer',
    victory_menu: 'Menu Principal',
    
    review_mistakes_title: 'Révision de vos erreurs',
    review_mistakes_question: 'Question : {0}',
    review_mistakes_your_answer: 'Votre Réponse : {0}',
    review_mistakes_correct_answer: 'Bonne Réponse : {0}',
    review_mistakes_continue: 'Continuer',
    review_mistakes_menu: 'Menu Principal',
    
    language_selection_title: 'Sélectionner la langue',
    language_english: 'English',
    language_french: 'Français',
    language_arabic: 'العربية',
    
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    close: 'Fermer'
  },
  ar: {
    table_selection_scene_title: 'اختر الجداول للمراجعة',
    table_selection_scene_start: '▶ ابدأ',
    table_selection_scene_random: 'جدول عشوائي',
    
    main_menu_start: 'اضغط على مفتاح المسافة للبدء',
    main_menu_click_to_start: 'انقر للبدء',
    
    game_score: 'النقاط',
    game_high_score: 'أعلى نقاط',
    game_question: 'السؤال',
    game_paused: 'اللعبة متوقفة',
    game_resume: 'اضغط أي مفتاح للمتابعة',
    
    victory_title: 'انتصار!',
    victory_score: 'نقاطك: {0}',
    victory_new_high_score: 'رقم قياسي جديد!',
    victory_play_again: 'العب مرة أخرى',
    victory_menu: 'القائمة الرئيسية',
    
    review_mistakes_title: 'مراجعة أخطائك',
    review_mistakes_question: 'السؤال: {0}',
    review_mistakes_your_answer: 'إجابتك: {0}',
    review_mistakes_correct_answer: 'الإجابة الصحيحة: {0}',
    review_mistakes_continue: 'متابعة',
    review_mistakes_menu: 'القائمة الرئيسية',
    
    language_selection_title: 'اختر اللغة',
    language_english: 'English',
    language_french: 'Français',
    language_arabic: 'العربية',
    
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    close: 'إغلاق'
  }
};
