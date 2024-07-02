import { Component, model } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageComponent } from './language/language.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterLink, LanguageComponent, FormsModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  wordLength = model(5);
  knownCharacters = model<string[]>();
}
