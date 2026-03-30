export class BoxData {
    static readonly MAX_STICKER_COUNT: number = 3;
    private _word: string;
    private _filledLetters: string;

    public get word(): string {
        return this._word;
    }

    public get filledLetters(): string {
        return this._filledLetters;
    }

    private set word(value: string) {
        this._word = value;
        this._filledLetters = value.replace(/./g, '_');
    }

    constructor(word: string) {
        this.word = word;
    }

    public addLetter(letter: string): void
    {
        for (let i = 0; i < this._word.length; i++) {
            if (this._word[i] === letter && this._filledLetters[i] === '_') {
                this._filledLetters =
                    this._filledLetters.substring(0, i) +
                    letter +
                    this._filledLetters.substring(i + 1);
                break;
            }
        }
    }

    public reset(word : string): void 
    {
        this.word = word;
    }

    public isFull(): boolean {
        return this._filledLetters === this._word;
    }

    public getEmptySlotCount(): number {
        return this._filledLetters.split('').filter(c => c === '_').length;
    }

    public getFittingLetterSlot(letter: string): number {
        for (let i = 0; i < this._word.length; i++) {
            if (this._word[i] === letter && this._filledLetters[i] === '_') {
                return i;
            }
        }
        return -1;
    }

    public hasEmptySlotForLetter(letter: string): boolean {
        return this.getFittingLetterSlot(letter) !== -1;
    }

    public getRemainingLetters(): string[] {
        const remainingLetters: string[] = [];
        for (let i = 0; i < this._word.length; i++) {
            if (this._filledLetters[i] === '_') {
                remainingLetters.push(this._word[i]);
            }
        }
        return remainingLetters;
    }
}


