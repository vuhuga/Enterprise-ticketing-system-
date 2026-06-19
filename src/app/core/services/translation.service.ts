import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Translation {
  // Common UI elements
  'dashboard': string;
  'tickets': string;
  'notes': string;
  'customers': string;
  'contacts': string;
  'organizations': string;
  'settings': string;
  'profile': string;
  'logout': string;
  
  // Greetings
  'good_morning': string;
  'good_afternoon': string;
  'good_evening': string;
  
  // Dashboard
  'welcome_back': string;
  'loading_dashboard': string;
  'new_tickets': string;
  'open_tickets': string;
  'closed_tickets': string;
  'total_tickets': string;
  'my_tickets': string;
  'create_new_ticket': string;
  'view_my_tickets': string;
  'my_notes': string;
  
  // Tickets
  'search': string;
  'reset': string;
  'export': string;
  'import': string;
  'new_ticket': string;
  'filter_ticket_by': string;
  'type': string;
  'department': string;
  'priority': string;
  'status': string;
  'subject': string;
  'date': string;
  'updated': string;
  'no_ticket_found': string;
  
  // General
  'loading': string;
  'save': string;
  'cancel': string;
  'submit': string;
  'delete': string;
  'edit': string;
  'view': string;
  'home': string;
  'english': string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = new BehaviorSubject<string>('en');
  public currentLanguage$ = this.currentLanguage.asObservable();

  private translations: Record<string, Translation> = {
    'en': {
      // Common UI elements
      'dashboard': 'Dashboard',
      'tickets': 'Tickets',
      'notes': 'Notes',
      'customers': 'Customers',
      'contacts': 'Contacts',
      'organizations': 'Organizations',
      'settings': 'Settings',
      'profile': 'Profile',
      'logout': 'Logout',
      
      // Greetings
      'good_morning': 'Good Morning',
      'good_afternoon': 'Good Afternoon',
      'good_evening': 'Good Evening',
      
      // Dashboard
      'welcome_back': 'Welcome back',
      'loading_dashboard': 'Loading dashboard data...',
      'new_tickets': 'NEW TICKETS',
      'open_tickets': 'OPEN TICKETS',
      'closed_tickets': 'CLOSED TICKETS',
      'total_tickets': 'TOTAL TICKETS',
      'my_tickets': 'MY TICKETS',
      'create_new_ticket': 'Create New Ticket',
      'view_my_tickets': 'View My Tickets',
      'my_notes': 'My Notes',
      
      // Tickets
      'search': 'Search...',
      'reset': 'Reset',
      'export': 'EXPORT',
      'import': 'IMPORT',
      'new_ticket': 'New Ticket',
      'filter_ticket_by': 'Filter Ticket By:',
      'type': 'Type',
      'department': 'Department',
      'priority': 'Priority',
      'status': 'Status',
      'subject': 'Subject',
      'date': 'Date',
      'updated': 'Updated',
      'no_ticket_found': 'No ticket found.',
      
      // General
      'loading': 'Loading...',
      'save': 'Save',
      'cancel': 'Cancel',
      'submit': 'Submit',
      'delete': 'Delete',
      'edit': 'Edit',
      'view': 'View',
      'home': 'Home',
      'english': 'English'
    },
    
    'fr': {
      // Common UI elements
      'dashboard': 'Tableau de bord',
      'tickets': 'Tickets',
      'notes': 'Notes',
      'customers': 'Clients',
      'contacts': 'Contacts',
      'organizations': 'Organisations',
      'settings': 'Paramètres',
      'profile': 'Profil',
      'logout': 'Déconnexion',
      
      // Greetings
      'good_morning': 'Bonjour',
      'good_afternoon': 'Bon après-midi',
      'good_evening': 'Bonsoir',
      
      // Dashboard
      'welcome_back': 'Bon retour',
      'loading_dashboard': 'Chargement des données du tableau de bord...',
      'new_tickets': 'NOUVEAUX TICKETS',
      'open_tickets': 'TICKETS OUVERTS',
      'closed_tickets': 'TICKETS FERMÉS',
      'total_tickets': 'TOTAL TICKETS',
      'my_tickets': 'MES TICKETS',
      'create_new_ticket': 'Créer un nouveau ticket',
      'view_my_tickets': 'Voir mes tickets',
      'my_notes': 'Mes notes',
      
      // Tickets
      'search': 'Rechercher...',
      'reset': 'Réinitialiser',
      'export': 'EXPORTER',
      'import': 'IMPORTER',
      'new_ticket': 'Nouveau ticket',
      'filter_ticket_by': 'Filtrer les tickets par :',
      'type': 'Type',
      'department': 'Département',
      'priority': 'Priorité',
      'status': 'Statut',
      'subject': 'Sujet',
      'date': 'Date',
      'updated': 'Mis à jour',
      'no_ticket_found': 'Aucun ticket trouvé.',
      
      // General
      'loading': 'Chargement...',
      'save': 'Enregistrer',
      'cancel': 'Annuler',
      'submit': 'Soumettre',
      'delete': 'Supprimer',
      'edit': 'Modifier',
      'view': 'Voir',
      'home': 'Accueil',
      'english': 'Anglais'
    },
    
    'es': {
      // Common UI elements
      'dashboard': 'Panel de control',
      'tickets': 'Tickets',
      'notes': 'Notas',
      'customers': 'Clientes',
      'contacts': 'Contactos',
      'organizations': 'Organizaciones',
      'settings': 'Configuración',
      'profile': 'Perfil',
      'logout': 'Cerrar sesión',
      
      // Greetings
      'good_morning': 'Buenos días',
      'good_afternoon': 'Buenas tardes',
      'good_evening': 'Buenas noches',
      
      // Dashboard
      'welcome_back': 'Bienvenido de nuevo',
      'loading_dashboard': 'Cargando datos del panel...',
      'new_tickets': 'TICKETS NUEVOS',
      'open_tickets': 'TICKETS ABIERTOS',
      'closed_tickets': 'TICKETS CERRADOS',
      'total_tickets': 'TOTAL TICKETS',
      'my_tickets': 'MIS TICKETS',
      'create_new_ticket': 'Crear nuevo ticket',
      'view_my_tickets': 'Ver mis tickets',
      'my_notes': 'Mis notas',
      
      // Tickets
      'search': 'Buscar...',
      'reset': 'Restablecer',
      'export': 'EXPORTAR',
      'import': 'IMPORTAR',
      'new_ticket': 'Nuevo ticket',
      'filter_ticket_by': 'Filtrar tickets por:',
      'type': 'Tipo',
      'department': 'Departamento',
      'priority': 'Prioridad',
      'status': 'Estado',
      'subject': 'Asunto',
      'date': 'Fecha',
      'updated': 'Actualizado',
      'no_ticket_found': 'No se encontraron tickets.',
      
      // General
      'loading': 'Cargando...',
      'save': 'Guardar',
      'cancel': 'Cancelar',
      'submit': 'Enviar',
      'delete': 'Eliminar',
      'edit': 'Editar',
      'view': 'Ver',
      'home': 'Inicio',
      'english': 'Inglés'
    },
    
    'ja': {
      // Common UI elements
      'dashboard': 'ダッシュボード',
      'tickets': 'チケット',
      'notes': 'ノート',
      'customers': '顧客',
      'contacts': '連絡先',
      'organizations': '組織',
      'settings': '設定',
      'profile': 'プロフィール',
      'logout': 'ログアウト',
      
      // Greetings
      'good_morning': 'おはようございます',
      'good_afternoon': 'こんにちは',
      'good_evening': 'こんばんは',
      
      // Dashboard
      'welcome_back': 'おかえりなさい',
      'loading_dashboard': 'ダッシュボードデータを読み込み中...',
      'new_tickets': '新しいチケット',
      'open_tickets': '開いているチケット',
      'closed_tickets': '閉じたチケット',
      'total_tickets': '総チケット数',
      'my_tickets': '私のチケット',
      'create_new_ticket': '新しいチケットを作成',
      'view_my_tickets': '私のチケットを表示',
      'my_notes': '私のノート',
      
      // Tickets
      'search': '検索...',
      'reset': 'リセット',
      'export': 'エクスポート',
      'import': 'インポート',
      'new_ticket': '新しいチケット',
      'filter_ticket_by': 'チケットをフィルター:',
      'type': 'タイプ',
      'department': '部署',
      'priority': '優先度',
      'status': 'ステータス',
      'subject': '件名',
      'date': '日付',
      'updated': '更新日',
      'no_ticket_found': 'チケットが見つかりません。',
      
      // General
      'loading': '読み込み中...',
      'save': '保存',
      'cancel': 'キャンセル',
      'submit': '送信',
      'delete': '削除',
      'edit': '編集',
      'view': '表示',
      'home': 'ホーム',
      'english': '英語'
    }
  };

  constructor() {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    this.setLanguage(savedLanguage);
  }

  setLanguage(languageCode: string): void {
    if (this.translations[languageCode]) {
      this.currentLanguage.next(languageCode);
      localStorage.setItem('selectedLanguage', languageCode);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }

  translate(key: keyof Translation): string {
    const currentLang = this.getCurrentLanguage();
    const translation = this.translations[currentLang];
    
    if (translation && translation[key]) {
      return translation[key];
    }
    
    // Fallback to English if translation not found
    const fallback = this.translations['en'];
    return fallback[key] || key as string;
  }

  getGreeting(firstName: string): string {
    const hour = new Date().getHours();
    let greetingKey: keyof Translation = 'good_morning';

    if (hour >= 12 && hour < 17) {
      greetingKey = 'good_afternoon';
    } else if (hour >= 17) {
      greetingKey = 'good_evening';
    }

    const greeting = this.translate(greetingKey);
    return `${greeting} ${firstName}!`;
  }
}