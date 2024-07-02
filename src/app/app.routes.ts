import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { LanguageComponent } from './main/language/language.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', component: MainComponent, },
    { path: 'language/:lang', component: LanguageComponent, },
];
