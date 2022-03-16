import { Card } from "./card.js";
declare type ElementFactory = (index: number, numElements: number) => SVGElement;
declare type ShadingFactory = (element: SVGElement, colorIndex: number) => void;
export declare class SVGCardFactory {
    readonly width: number;
    readonly height: number;
    readonly numVariations: number;
    readonly padding: number;
    static COLORS: string[];
    private readonly centerX;
    private readonly centerY;
    private readonly size;
    constructor(width?: number, height?: number, numVariations?: number, padding?: number);
    create(card: Card): HTMLElement;
    createEmptySVG(): HTMLElement;
    elementFactoryFor(index: number): ElementFactory;
    shadingFor(index: number): ShadingFactory;
    private getCenterX;
    private getCenterY;
    private installSVGAssets;
}
export {};
