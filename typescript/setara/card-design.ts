import {createElement} from "../lib/svg.js"
import {Card} from "./card.js"

type ElementFactory = (index: number, numElements: number) => SVGElement
type ShadingFactory = (element: SVGElement, colorIndex: number) => void

export class SVGCardFactory {
    static COLORS = ["#7958AC", "#F789AE", "#49E3DA"]

    private readonly centerX: number
    private readonly centerY: Float32Array[]
    private readonly size

    constructor(readonly width: number = 66.0, readonly height: number = 100.0, readonly numVariations: number = 3, readonly padding: number = 0.1) {
        console.assert(height > width, "Card are Portrait")
        console.assert(0.0 <= padding && padding < 1.0, "padding is in percentage of height (0..1)")
        console.assert(3 >= numVariations, "numVariations must be less or equal three.")

        const innerHeight = this.height - this.height * padding
        this.size = (innerHeight - (innerHeight + innerHeight * numVariations) * padding) / numVariations
        this.centerX = this.width * 0.5
        this.centerY = []
        for (let numElements = 0; numElements < numVariations; numElements++) {
            this.centerY[numElements] = new Float32Array(numElements + 1)
            for (let index = 0; index <= numElements; index++) {
                this.centerY[numElements][index] = this.height * 0.5 - (numElements * 0.5 - index) * (this.size + innerHeight * padding)
            }
        }

        if (document.querySelector("svg[svg-assets='true']") === null) {
            this.installSVGAssets()
        }
    }

    create(card: Card): HTMLElement {
        const colorIndex = card.getIndexAt(Card.INDEX_COLOR)
        const svg = this.createEmptySVG()
        svg.setAttribute("indices", card.serialize())
        const numElements = card.getIndexAt(Card.INDEX_NUM_ELEMENTS) + 1
        const elementFactory: ElementFactory = this.elementFactoryFor(card.getIndexAt(Card.INDEX_SHAPE))
        const shadingFactory: ShadingFactory = this.shadingFor(card.getIndexAt(Card.INDEX_SHADING))
        for (let index = 0; index < numElements; index++) {
            const element = elementFactory(index, numElements)
            shadingFactory(element, colorIndex)
            svg.appendChild(element)
        }
        return svg as unknown as HTMLElement
    }

    createEmptySVG(): HTMLElement {
        const svg = createElement("svg")
        svg.classList.add("card")
        svg.setAttribute("version", "1.1")
        svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`)
        return svg as unknown as HTMLElement
    }

    elementFactoryFor(index: number): ElementFactory {
        switch (index) {
            case 0:
                return (index: number, numElements: number): SVGElement => {
                    const element = createElement("circle")
                    element.cx.baseVal.value = this.getCenterX()
                    element.cy.baseVal.value = this.getCenterY(index, numElements)
                    element.r.baseVal.value = this.size / 2
                    return element
                }
            case 1:
                return (index: number, numElements: number): SVGElement => {
                    const element = createElement("rect")
                    const edge = this.size * Math.sin(Math.PI / 3)
                    element.x.baseVal.value = this.getCenterX() - edge * 0.5
                    element.y.baseVal.value = this.getCenterY(index, numElements) - edge * 0.5
                    element.width.baseVal.value = edge
                    element.height.baseVal.value = edge
                    return element
                }
            case 2:
                return (index: number, numElements: number): SVGElement => {
                    const element = createElement("polygon")
                    const radius = this.size * 0.6
                    const points = []
                    for (let i = 0; i < 3; i++) {
                        const a = i / 3 * (Math.PI * 2.0)
                        const px = Math.sin(a) * radius + this.getCenterX()
                        const py = radius * 0.2 - Math.cos(a) * radius + this.getCenterY(index, numElements)
                        points[i] = `${px.toFixed(1)} ${py.toFixed(1)}`
                    }
                    element.setAttribute("points", points.join(" "))
                    return element
                }
        }
    }

    shadingFor(index: number): ShadingFactory {
        switch (index) {
            case 0:
                return (element: SVGElement, colorIndex) => {
                    element.setAttribute("fill", SVGCardFactory.COLORS[colorIndex])
                    element.setAttribute("stroke", "none")
                }
            case 1:
                return (element: SVGElement, colorIndex) => {
                    element.setAttribute("fill", "rgba(255, 255, 255, 0.2)")
                    element.setAttribute("stroke", SVGCardFactory.COLORS[colorIndex])
                    element.setAttribute("stroke-width", "2")
                }
            case 2:
                return (element: SVGElement, colorIndex) => {
                    element.setAttribute("fill", `url(#pattern-${colorIndex})`)
                    element.setAttribute("stroke", SVGCardFactory.COLORS[colorIndex])
                    element.setAttribute("stroke-width", "0.5")
                }
        }
    }

    private getCenterX(): number {
        return this.centerX
    }

    private getCenterY(index: number, numElements: number): number {
        return this.centerY[numElements - 1][index]
    }

    private installSVGAssets() {
        const svg = createElement("svg")
        svg.setAttribute("svg-assets", "true")
        svg.setAttribute("version", "1.1")
        svg.setAttribute("width", "0")
        svg.setAttribute("height", "0")
        const defsElement = createElement("defs")
        const patternSize = 3
        for (let index = 0; index < this.numVariations; index++) {
            const pattern = createElement("pattern")
            pattern.id = `pattern-${index}`
            pattern.x.baseVal.value = 0
            pattern.y.baseVal.value = 0
            pattern.width.baseVal.value = patternSize
            pattern.height.baseVal.value = patternSize
            pattern.setAttribute("patternUnits", "userSpaceOnUse")
            const color = SVGCardFactory.COLORS[index]
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    const px = x * patternSize
                    const py = y * patternSize
                    const line = createElement("line")
                    line.x1.baseVal.value = px - 1
                    line.y1.baseVal.value = py - 1
                    line.x2.baseVal.value = px + patternSize
                    line.y2.baseVal.value = py + patternSize
                    line.setAttribute("stroke", color)
                    line.setAttribute("stroke-width", "1")
                    pattern.appendChild(line)
                }
            }
            defsElement.appendChild(pattern)
        }
        svg.appendChild(defsElement)
        document.body.appendChild(svg)
    }
}