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
  settings_reset_progress: string;
  settings_quit_level: string;
  settings_close: string;
  
  // Information
  information_title: string;
  information_how_to_play: string;
  information_objective: string;
  information_objective_text: string;
  information_controls: string;
  information_controls_text: string;
  information_gameplay: string;
  information_gameplay_text: string;
  information_tips: string;
  information_tips_text: string;
  
  // Review Attempts
  review_attempts_title: string;
  review_attempts_button: string;
  attempt_number: string;
  question_text: string;
  your_answer: string;
  correct_answer: string;
  
  // General
  back: string;
  level: string;
  score: string;
  
  // Wrong Answer Messages
  wrong_answer_try_again: string;
  try_again: string;
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
    settings_reset_progress: 'Reset Progress',
    settings_quit_level: 'Quit Level',
    settings_close: 'Close',
    
    information_title: 'How to Play',
    information_how_to_play: 'How to Play EDUSPACE',
    information_objective: 'Objective',
    information_objective_text: 'Navigate through space while avoiding enemy bullets and asteroids. Answer questions correctly by steering your spaceship towards the correct answer objects to score points and progress through levels.',
    information_controls: 'Controls',
    information_controls_text: 'Use Up and Down KEYS or your mouse to move your spaceship. On mobile devices, use touch controls to steer and tap once to shoot',
    information_gameplay: 'Gameplay',
    information_gameplay_text: 'Each level presents multiple-choice questions. Steer towards answer objects to select your response. Correct answers give you points and energy. Wrong answers cost energy. Avoid enemy bullets and obstacles!, if your energy reaches 0, you lose and must retry the level' ,
    information_tips: 'Tips',
    information_tips_text: 'Stay alert for enemy spacehips bullets.\nRead questions carefully before choosing answers.',
    
    review_attempts_title: 'Review Attempts',
    review_attempts_button: 'Review',
    attempt_number: 'Attempt',
    question_text: 'Question',
    your_answer: 'Your Answer',
    correct_answer: 'Correct Answer',
    
    back: 'Back',
    level: 'Level',
    score: 'Score',
    
    wrong_answer_try_again: 'Wrong Answer! Try Again in',
    try_again: 'Try Again!'
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
    settings_reset_progress: 'Réinitialiser les progrès',
    settings_quit_level: 'Quitter le niveau',
    settings_close: 'Fermer',
    
    information_title: 'Comment Jouer',
    information_how_to_play: 'Comment Jouer EDUSPACE',
    information_objective: 'Objectif',
    information_objective_text: 'Naviguez dans l\'espace en évitant les balles ennemies et les astéroïdes. Répondez correctement aux questions en dirigeant votre vaisseau spatial vers les objets correspondants pour marquer des points et progresser dans les niveaux.',
    information_controls: 'Contrôles',
    information_controls_text: 'Utilisez les touches Haut et Bas ou la souris pour déplacer votre vaisseau. Sur mobile, utilisez les commandes tactiles pour piloter et appuyez une fois pour tirer.',
    information_gameplay: 'Gameplay',
    information_gameplay_text: 'Chaque niveau propose des questions à choix multiples. Dirigez-vous vers les objets de réponse pour choisir votre réponse. Les bonnes réponses vous rapportent des points et de l\'énergie. Les mauvaises réponses coûtent de l\'énergie. Évitez les balles ennemies et les obstacles ! Si votre énergie atteint 0, vous perdez et devez recommencer le niveau.',
    information_tips: 'Conseils',
    information_tips_text: 'Restez vigilant face aux balles des vaisseaux spatiaux ennemis.\nLisez attentivement les questions avant de choisir les réponses.',
    
    review_attempts_title: 'Réviser les Tentatives',
    review_attempts_button: 'Réviser',
    attempt_number: 'Tentative',
    question_text: 'Question',
    your_answer: 'Votre Réponse',
    correct_answer: 'Bonne Réponse',
    
    back: 'Retour',
    level: 'Niveau',
    score: 'Score',
    
    wrong_answer_try_again: 'Mauvaise réponse ! Réessayez dans',
    try_again: 'Réessayez !'
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
    settings_reset_progress: 'إعادة تعيين التقدم',
    settings_quit_level: 'ترك المستوى',
    settings_close: 'إغلاق',
    
    information_title: 'كيفية اللعب',
    information_how_to_play: 'كيفية لعب EDUSPACE',
    information_objective: 'الهدف',
    information_objective_text: 'انطلق في الفضاء متجنبًا رصاصات العدو والكويكبات. أجب عن الأسئلة بشكل صحيح بتوجيه مركبتك الفضائية نحو العناصر المطلوبة لكسب النقاط والتقدم في المستويات',
    information_controls: 'التحكم',
    information_controls_text: 'استخدم مفاتيح الأعلى والأسفل أو الماوس لتحريك مركبتك الفضائية. على الأجهزة المحمولة، استخدم أزرار التحكم باللمس للتوجيه، وانقر مرة واحدة لإطلاق النار.',
    information_gameplay: 'طريقة اللعب',
    information_gameplay_text: 'يقدم كل مستوى أسئلة اختيار من متعدد. توجه نحو العناصر المطلوبة لاختيار إجابتك. تمنحك الإجابات الصحيحة نقاطًا وطاقة. أما الإجابات الخاطئة فتكلفك طاقة. تجنب رصاصات العدو والعقبات! إذا وصلت طاقتك إلى صفر، فستخسر ويجب عليك إعادة محاولة إكمال المستوى.',
    information_tips: 'نصائح',
    information_tips_text: 'كن متيقظًا لرصاصات سفن الفضاء المعادية.\nاقرأ الأسئلة بعناية قبل اختيار الإجابات.',
    
    review_attempts_title: 'مراجعة المحاولات',
    review_attempts_button: 'مراجعة',
    attempt_number: 'محاولة',
    question_text: 'السؤال',
    your_answer: 'إجابتك',
    correct_answer: 'الإجابة الصحيحة',
    
    back: 'رجوع',
    level: 'مستوى',
    score: 'النقاط',
    
    wrong_answer_try_again: 'إجابة خاطئة! حاول مرة أخرى خلال',
    try_again: 'حاول مرة أخرى!'
  }
};
