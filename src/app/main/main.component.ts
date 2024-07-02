import { Component, computed, model } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageComponent } from './language/language.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterLink, LanguageComponent, FormsModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  wordLength = model(5);
  knownCharacters = model<string[]>();

  // TODO: Support other word lengths
  correctCharacter1 = model('');
  correctCharacter2 = model('');
  correctCharacter3 = model('');
  correctCharacter4 = model('');
  correctCharacter5 = model('');

  presentButWrongAtPosition1 = model('');
  presentButWrongAtPosition2 = model('');
  presentButWrongAtPosition3 = model('');
  presentButWrongAtPosition4 = model('');
  presentButWrongAtPosition5 = model('');

  knownNotPresentInput = model('');

  knownNotPresent = computed<string>(() => {
    return this.knownNotPresentInput().toLocaleUpperCase().trim();
  });

  correctCharacters = computed<string>(() => {
    return [
      this.correctCharacter1().length > 0 ? this.correctCharacter1() : ' ',
      this.correctCharacter2().length > 0 ? this.correctCharacter2() : ' ',
      this.correctCharacter3().length > 0 ? this.correctCharacter3() : ' ',
      this.correctCharacter4().length > 0 ? this.correctCharacter4() : ' ',
      this.correctCharacter5().length > 0 ? this.correctCharacter5() : ' ',
    ].join('').toLocaleUpperCase();
  });

  presentButWrongAtPosition = computed<string[]>(() => {
    return [
      this.presentButWrongAtPosition1(),
      this.presentButWrongAtPosition2(),
      this.presentButWrongAtPosition3(),
      this.presentButWrongAtPosition4(),
      this.presentButWrongAtPosition5(),
    ].map(c => c.toLocaleUpperCase().trim());
  });
}
