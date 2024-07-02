import { HttpClient } from '@angular/common/http';
import { Component, computed, input, model, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

type UpperCaseString = string;
type SingleCharacter = string;
export type Language = 'swedish' | 'english';
type WordWithScore = {word: UpperCaseString, score: number};
interface WordWithScoreAndGuessInfo extends WordWithScore {
  isValidGuess: boolean;
};


function getWordsWithScores(words: UpperCaseString[], characterFrequencies: {[key: SingleCharacter]: number}, forbiddenCharacters: UpperCaseString): WordWithScore[] {
  const wordsWithScores: {word: UpperCaseString, score: number}[] = words.map(w => {
    let score = 0;
    const seen: {[key: string]: boolean} = {};
    for(const char of w) {
      if (seen[char] !== true && !forbiddenCharacters.includes(char)) {
        score += characterFrequencies[char];
        seen[char] = true;
      }
    }
    return {word: w, score};
  });
  
  return wordsWithScores;
}

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
  correctCharacters = input.required<string>();
  presentButWrongAtPosition = input.required<string[]>();
  knownNotPresent = input.required<string>();
  rawWordBuffer = signal<string | undefined>(undefined);

  allWords = computed<UpperCaseString[]>(() => {
    const rawWordBuffer = this.rawWordBuffer();
    if (rawWordBuffer) {
      return rawWordBuffer.split(',').map(w => w.toLocaleUpperCase());
    }
    return [];
  });

  relevantWords = computed<UpperCaseString[]>(() => {
    const allWords = this.allWords();
    const wordLength = this.wordLength();
    return allWords.filter(word => word.length === wordLength && !word.match(/[^A-ZÅÄÖ]/));
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

  topStartWords = computed<WordWithScore[]>(() => {
    const relevantWords = this.relevantWords();
    const characterFrequencies = this.characterFrequencies();

    const wordsWithScores = getWordsWithScores(relevantWords, characterFrequencies, '');
    return wordsWithScores.sort((wws1, wws2) => wws2.score - wws1.score).slice(0, 10);
  });

  topSecondDiscoveryWords = computed<WordWithScore[]>(() => {
    const relevantWords = this.relevantWords();
    const characterFrequencies = this.characterFrequencies();
    const characterFrequenciesList = this.characterFrequenciesList();

    const forbiddenCharacters = characterFrequenciesList.slice(0, 5).map(entry => entry[0]).join('');
    console.log("Forbidden characters", forbiddenCharacters);

    const wordsWithScores = getWordsWithScores(relevantWords, characterFrequencies, forbiddenCharacters);
    return wordsWithScores.sort((wws1, wws2) => wws2.score - wws1.score).slice(0, 10);
  });

  topGuesses = computed<string[]>(() => {
    // TODO: Add discovery scores to guesses
    const correctCharacters = this.correctCharacters();
    const knownNotPresent = this.knownNotPresent();
    const presentButWrongAtPosition = this.presentButWrongAtPosition();
    const relevantWords = this.relevantWords();
    const allKnownPresentCharacters = presentButWrongAtPosition.join('');

    const guesses = relevantWords.filter((word) => {
      // Remove any word that doesn't have the known present characters
      for (const char of allKnownPresentCharacters) {
        if (!word.includes(char)) {
          return false;
        }
      }

      // Remove any word that doesn't fit the correct characters, or includes known not-present characters
      for (let i=0; i<word.length; i++) {
        const char = word[i];
        if (correctCharacters[i] !== ' ' && correctCharacters[i] !== char) {
          return false;
        }
        if (knownNotPresent.includes(char)) {
          return false;
        }
        if (presentButWrongAtPosition[i].includes(char)) {
          return false;
        }
      }

      return true;
    });

    return guesses;
  });

  topTenGuesses = computed<string[]>(() => {
    return this.topGuesses().slice(0, 10);
  });

  topDiscoveryWords = computed<WordWithScoreAndGuessInfo[]>(() => {
    const correctCharacters = this.correctCharacters();
    const characterFrequencies = this.characterFrequencies();
    const knownNotPresent = this.knownNotPresent();
    const presentButWrongAtPosition = this.presentButWrongAtPosition();
    const relevantWords = this.relevantWords();
    const allKnownPresentCharacters = presentButWrongAtPosition.join('');
    const guesses = this.topGuesses();

    const uninterestingCharacters = [correctCharacters, knownNotPresent, allKnownPresentCharacters].join('');

    const discoveries = relevantWords.map((word) => {
      let score = 0;
      let isValidGuess = false;
      const seen: {[key: string]: boolean} = {};
      for (let i=0; i<word.length; i++) {
        const char = word[i];
        if (uninterestingCharacters.includes(char)) {
          continue;
        } else if(seen[char] !== true) {
          score += characterFrequencies[char];
          seen[char] = true;
        }
      }
      if (guesses.length < 1000 && guesses.includes(word)) {
        // Possible guess - increase discovery score
        if (guesses.length < 300) {
          score *= 1.3;
        } else if (guesses.length < 20) {
          score *= 4;
        } else if (guesses.length < 6) {
          score *= 10;
        }
        isValidGuess = true;
      }
      return {word, score: Math.round(score), isValidGuess};
    });
    return discoveries.sort((wws1, wws2) => wws2.score - wws1.score);
  });

  topTenDiscoveryWords = computed<WordWithScoreAndGuessInfo[]>(() => {
    return this.topDiscoveryWords().slice(0, 10);
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
