export declare class Card {
    private readonly indices;
    static INDEX_NUM_ELEMENTS: number;
    static INDEX_SHAPE: number;
    static INDEX_SHADING: number;
    static INDEX_COLOR: number;
    constructor(indices: Uint8Array);
    getIndexAt(index: number): number;
    toString(): string;
    serialize(): string;
}
export declare class CardDeck {
    private readonly cards;
    static create(numFeatures: number, numVariations: number): CardDeck;
    private position;
    private constructor();
    shuffle(): void;
    take(count: number): Card[];
    available(): number;
}
export declare class Rules {
    readonly numFeatures: number;
    readonly numVariations: number;
    constructor(numFeatures?: number, numVariations?: number);
    findSets(cards: Card[]): Card[][];
    isSet(cards: Card[]): boolean;
    private static validateFeature;
}
