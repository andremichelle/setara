import {Combinations} from "../lib/common.js"

export class Card {
    static INDEX_NUM_ELEMENTS = 0
    static INDEX_SHAPE = 1
    static INDEX_COLOR = 2
    static INDEX_SHADING = 3

    constructor(private readonly indices: Uint8Array) {
    }

    getIndexAt(index: number): number {
        return this.indices[index]
    }

    toString(): string {
        return `Card(${this.indices.join(" ")})`
    }

    serialize() {
        return Array.from(this.indices).join(",")
    }
}

export class CardDeck {
    /*
        https://en.wikipedia.org/wiki/Set_(card_game)
        The deck consists of 81 unique cards that vary in four features across three possibilities for each kind of feature:
        number of shapes (one, two, or three)
        shape (diamond, squiggle, oval)
        shading (solid, striped, or open)
        color (red, green, or purple)
        Each possible combination of features (e.g. a card with three striped green diamonds) appears as a card precisely once in the deck.
     */
    static create(numFeatures: number, numVariations: number): CardDeck {
        return new CardDeck(Combinations.withRepetitions(numVariations, numFeatures)
            .map(combination => new Card(combination)))
    }

    private position: number = 0 | 0

    private constructor(private readonly cards: Card[]) {
        console.log(cards.map(c => c.serialize()))
    }

    shuffle(): void {
        const array = this.cards
        for (let i = 0; i < array.length; i++) {
            const element = array[i]
            const randomIndex = Math.floor(Math.random() * array.length)
            array[i] = array[randomIndex]
            array[randomIndex] = element
        }
    }

    take(count: number): Card[] {
        if (this.position + count > this.cards.length) {
            throw new RangeError()
        }
        const subSet: Card[] = this.cards.slice(this.position, this.position + count)
        this.position += count
        return subSet
    }

    available(): number {
        return this.cards.length - this.position
    }
}

export class Rules {
    constructor(readonly numFeatures: number = 4, readonly numVariations: number = 3) {
    }

    findSets(cards: Card[]): Card[][] {
        return Combinations.withoutRepetitions(cards.length, this.numVariations)
            .map(combination => [...combination] // TypedArray.map unfortunately only returns same type
                .map(index => cards[index]))
            .filter(cards => this.isSet(cards))
    }

    /**
     * Evaluates a set.
     *
     * @param cards Cards to be validated
     * @return true, if the set is valid and can be removed.
     */
    isSet(cards: Card[]): boolean {
        if (cards.length !== this.numVariations) {
            return false
        }
        for (let i = 0; i < this.numFeatures; ++i) {
            if (!Rules.validateFeature(cards.map(card => card.getIndexAt(i)))) {
                return false
            }
        }
        return true
    }

    /**
     * Evaluates a single feature.
     * Either all values are the same or all values are equal.
     * Since we do not want to check all possible sequences, we use a bitSet.
     * Example for 3 different features:
     * X00
     * X00
     * X00
     * ---
     * X00 = 0x1 > OKAY (similar for second and third bit)
     *
     * X00
     * 0X0
     * 00X
     * ---
     * XXX = 0x7 > OKAY
     *
     * X00
     * 0X0
     * 0X0
     * ---
     * XX0 = 0x3 > WRONG
     *
     * @param variations The variations of the feature.
     * @return true, if the set is valid for this feature.
     */
    private static validateFeature(variations: number[]): boolean {
        let bits = 0 | 0
        let all = 0 | 0
        for (let i: number = 0; i < variations.length; ++i) {
            bits |= 1 << variations[i]
            all |= 1 << i
        }
        if (bits === all) { // all different (meaning all bits set)
            return true
        }
        for (let i: number = 0; i < variations.length; ++i) {
            if ((1 << i) === bits) { // all the same (only one bit set)
                return true
            }
        }
        return false
    }
}