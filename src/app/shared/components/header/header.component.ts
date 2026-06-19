import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Sun, Moon } from 'lucide-angular';
import { TranslationService } from '../../../core/services/translation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);

  currentUser = {
    name: 'Sys Admin',
    greeting: 'Good Afternoon Sys!',
    language: 'English',
    languageCode: 'en',
    flag: '🇬🇧',
    email: ''
  };

  availableLanguages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' }
  ];

  showProfileDropdown = false;
  showLanguageDropdown = false;
  isDarkMode = false;
  private languageSubscription: Subscription = new Subscription();

  // Lucide icons
  readonly Sun = Sun;
  readonly Moon = Moon;

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUser.email = user.email;
        // Use the actual user's name from localStorage
        this.currentUser.name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Subscribe to language changes
    this.languageSubscription = this.translationService.currentLanguage$.subscribe(languageCode => {
      this.updateLanguageDisplay(languageCode);
      this.updateGreeting();
    });

    // Load saved language preference
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      const language = this.availableLanguages.find(lang => lang.code === savedLanguage);
      if (language) {
        this.setLanguage(language);
      }
    }

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
  }

  ngOnDestroy(): void {
    this.languageSubscription.unsubscribe();
  }

  private updateLanguageDisplay(languageCode: string): void {
    const language = this.availableLanguages.find(lang => lang.code === languageCode);
    if (language) {
      this.currentUser.languageCode = language.code;
      this.currentUser.language = language.name;
      this.currentUser.flag = language.flag;
    }
  }

  private updateGreeting(): void {
    const firstName = this.currentUser.name.split(' ')[0];
    this.currentUser.greeting = this.translationService.getGreeting(firstName);
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
    this.showLanguageDropdown = false;
  }

  toggleLanguageDropdown(): void {
    this.showLanguageDropdown = !this.showLanguageDropdown;
    this.showProfileDropdown = false;
  }

  setLanguage(language: Language): void {
    // Update translation service
    this.translationService.setLanguage(language.code);
    
    // Update current user display
    this.currentUser.language = language.name;
    this.currentUser.languageCode = language.code;
    this.currentUser.flag = language.flag;
    
    // Close dropdown
    this.showLanguageDropdown = false;
    
    console.log(`Language changed to: ${language.name} (${language.code})`);
  }

  // Translation helper method for templates
  translate(key: string): string {
    return this.translationService.translate(key as never);
  }

  getCurrentLanguage(): Language {
    return this.availableLanguages.find(lang => lang.code === this.currentUser.languageCode) || this.availableLanguages[0];
  }

  // Check if current user can access settings (admin/staff only)
  canAccessSettings(): boolean {
    return this.authService.canAccessSettings();
  }

  onProfile(): void {
    this.showProfileDropdown = false;
    this.router.navigate(['/profile']);
  }

  onSettings(): void {
    this.showProfileDropdown = false;
    this.router.navigate(['/settings']);
  }

  onLogout(): void {
    localStorage.removeItem('user');
    this.showProfileDropdown = false;
    this.router.navigate(['/auth/login']);
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }
}
