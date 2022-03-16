import { Card } from "./card.js";
import { Terminable } from "../lib/common";
export declare class SVGCardFactory implements Terminable {
    readonly numVariations: number;
    readonly padding: number;
    static COLORS: string[];
    private readonly width;
    private readonly height;
    private readonly centerX;
    private readonly centerY;
    private readonly size;
    constructor(numVariations?: number, padding?: number);
    create(card: Card): HTMLElement;
    createEmptySVG(): HTMLElement;
    terminate(): void;
    private elementFactoryFor;
    private shadingFor;
    private getCenterX;
    private getCenterY;
    private installSVGAssets;
    private createPattern;
}
