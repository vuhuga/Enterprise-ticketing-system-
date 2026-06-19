import { Pipe, PipeTransform, OnDestroy, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  pure: false, // Make it impure so it updates when language changes
  standalone: true
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);

  private languageSubscription: Subscription;
  private currentLanguage = 'en';

  constructor() {
    this.languageSubscription = this.translationService.currentLanguage$.subscribe(
      language => {
        this.currentLanguage = language;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  transform(key: string): string {
    return this.translationService.translate(key as never);
  }
}