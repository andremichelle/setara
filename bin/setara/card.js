import { Combinations } from "../lib/common.js";
export class Card {
    constructor(indices) {
        this.indices = indices;
    }
    getIndexAt(index) {
        return this.indices[index];
    }
    toString() {
        return `Card(${this.indices.join(" ")})`;
    }
    serialize() {
        return Array.from(this.indices).join(",");
    }
}
Card.INDEX_NUM_ELEMENTS = 0;
Card.INDEX_SHAPE = 1;
Card.INDEX_COLOR = 2;
Card.INDEX_SHADING = 3;
export class CardDeck {
    constructor(cards) {
        this.cards = cards;
        this.position = 0 | 0;
        console.log(cards.map(c => c.serialize()));
    }
    static create(numFeatures, numVariations) {
        return new CardDeck(Combinations.withRepetitions(numVariations, numFeatures)
            .map(combination => new Card(combination)));
    }
    shuffle() {
        const array = this.cards;
        for (let i = 0; i < array.length; i++) {
            const element = array[i];
            const randomIndex = Math.floor(Math.random() * array.length);
            array[i] = array[randomIndex];
            array[randomIndex] = element;
        }
    }
    take(count) {
        if (this.position + count > this.cards.length) {
            throw new RangeError();
        }
        const subSet = this.cards.slice(this.position, this.position + count);
        this.position += count;
        return subSet;
    }
    available() {
        return this.cards.length - this.position;
    }
}
export class Rules {
    constructor(numFeatures = 4, numVariations = 3) {
        this.numFeatures = numFeatures;
        this.numVariations = numVariations;
    }
    findSets(cards) {
        return Combinations.withoutRepetitions(cards.length, this.numVariations)
            .map(combination => [...combination]
            .map(index => cards[index]))
            .filter(cards => this.isSet(cards));
    }
    isSet(cards) {
        if (cards.length !== this.numVariations) {
            return false;
        }
        for (let i = 0; i < this.numFeatures; ++i) {
            if (!Rules.validateFeature(cards.map(card => card.getIndexAt(i)))) {
                return false;
            }
        }
        return true;
    }
    static validateFeature(variations) {
        let bits = 0 | 0;
        let all = 0 | 0;
        for (let i = 0; i < variations.length; ++i) {
            bits |= 1 << variations[i];
            all |= 1 << i;
        }
        if (bits === all) {
            return true;
        }
        for (let i = 0; i < variations.length; ++i) {
            if ((1 << i) === bits) {
                return true;
            }
        }
        return false;
    }
}
//# sourceMappingURL=card.js.map