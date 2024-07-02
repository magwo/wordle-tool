import { HttpClient } from '@angular/common/http';
import { Component, computed, input, model, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

type LowerCaseString = string;
type SingleCharacter = string;
export type Language = 'swedish' | 'english';

@Component({
  selector: 'app-language',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './language.component.html',
  styleUrl: './language.component.scss'
})
export class LanguageComponent {
  language = input.required<Language>();
  wordLength = input.required<number>();
  rawWordBuffer = signal<string | undefined>(undefined);

  allWords = computed<LowerCaseString[]>(() => {
    const rawWordBuffer = this.rawWordBuffer();
    if (rawWordBuffer) {
      return rawWordBuffer.split(',').map(w => w.toLocaleLowerCase());
    }
    return [];
  });

  relevantWords = computed<LowerCaseString[]>(() => {
    const allWords = this.allWords();
    const wordLength = this.wordLength();
    return allWords.filter(word => word.length === wordLength && !word.match(/[^a-zåäö]/));
  });

  characterFrequencies = computed<{[key: SingleCharacter]: number}>(() => {
    const relevantWords = this.relevantWords();
    const counts: {[key: SingleCharacter]: number} = {};
    for (const word of relevantWords) {
      for (const character of word) {
        counts[character] = (counts[character] ?? 0) + 1;
      }
    }
    return counts;
  });

  characterFrequenciesList = computed<[SingleCharacter, number][]>(() => {
    const counts = this.characterFrequencies();
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  });

  topTenStartWords = computed<{word: LowerCaseString, score: number}[]>(() => {
    const relevantWordsList = this.relevantWords();
    const characterFrequencies = this.characterFrequencies();

    const wordsWithScores: {word: LowerCaseString, score: number}[] = relevantWordsList.map(w => {
      let score = 0;
      const seen: {[key: string]: boolean} = {};
      for(const char of w) {
        if (seen[char] !== true) {
          score += characterFrequencies[char];
          seen[char] = true;
        }
      }
      return {word: w, score};
    });
    
    return wordsWithScores.sort((wws1, wws2) => wws2.score - wws1.score).slice(0, 10);
  });

  constructor(private httpClient: HttpClient) {

  }

  ngOnInit() {
    const path = this.language() === 'swedish' ? 'Swedish.txt' : 'English.txt';
    this.httpClient.get(path, {responseType: 'text'}).subscribe((resp) => {
      this.rawWordBuffer.set(resp);
    });
  }
}
