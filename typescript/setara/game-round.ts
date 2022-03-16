import {Card, CardDeck, Rules} from "./card.js"
import {Sound, SoundManager} from "./sounds.js"
import {Random} from "../lib/math.js"
import {Option, Options, Waiting} from "../lib/common.js"
import {SVGCardFactory} from "./card-design.js"

class Turn {
    constructor(readonly onSelectionComplete: (isSet: boolean) => void,
                readonly onTurnComplete: (isGameOver: boolean) => void) {
    }
}

export class GameRound {
    private readonly rootElement: Element
    private readonly cardsElement: Element
    private readonly rows: Element[] = []
    private readonly deck: CardDeck = CardDeck.create(4, 3)
    private readonly map: Map<Element, Card> = new Map()
    private readonly selection: Card[] = []

    private turn: Option<Turn> = Options.None

    private started: boolean = false
    private acceptUserInput: boolean = true
    private hintIndex: number = 0
    private running: boolean = true
    private gameOver: boolean = false

    constructor(private readonly rules: Rules,
                private readonly cardFactory: SVGCardFactory,
                private readonly soundManager: SoundManager,
                private readonly random: Random) {
        this.rootElement = document.querySelector("div.play-field")
        this.cardsElement = this.rootElement.querySelector("div.cards")
        for (let i = 0; i < rules.numVariations; i++) {
            const row = document.createElement("div")
            row.classList.add("row")
            this.cardsElement.appendChild(row)
            this.rows.push(row)
        }
        this.deck.shuffle()

        this.watchResize()
        this.installUserInput()
    }

    async start(): Promise<void> {
        console.assert(!this.started)
        this.started = true
        await this.dealCards(this.rules.numFeatures * this.rules.numVariations)
        while (!this.hasSets()) {
            await this.dealCards(this.rules.numVariations)
        }
    }

    async waitForTurnComplete(onSelectionComplete: (isSet: boolean) => void): Promise<boolean> {
        return new Promise((resolve) => {
            this.turn = Options.valueOf(new Turn(onSelectionComplete, resolve))
        })
    }

    async cancelTurn(): Promise<void> {
        if (this.selection.length > 0) {
            await this.deselectAll()
        }
        this.turn.ifPresent((turn: Turn) => {
            this.soundManager.play(Sound.Cancel)
            turn.onTurnComplete(false)
        })
        this.turn = Options.None
        return Promise.resolve()
    }

    available(): number {
        return this.deck.available()
    }

    showHint() {
        const sets = this.rules.findSets(Array.from(this.map.values()))
        if (sets.length === 0) {
            console.warn("No set available?")
            return
        }
        const cards = sets[0]
        if (cards.length === 0) {
            console.warn("Set has no cards?")
            return
        }
        this.findElement(cards[0]).classList.add("hint")
    }

    terminate() {
        console.assert(this.turn.isEmpty())
        this.rows.splice(0, this.rows.length)
        this.selection.splice(0, this.rows.length)
        this.map.clear()
        while (this.cardsElement.lastChild) {
            this.cardsElement.lastChild.remove()
        }
    }

    private async processCardClick(card: Card, element: Element): Promise<void> {
        if (this.turn.isEmpty()) {
            this.soundManager.play(Sound.Reject)
            return Promise.resolve()
        }
        this.soundManager.play(Sound.Click)
        if (this.selection.includes(card)) {
            this.deselectCard(card, element)
        } else {
            this.selectCard(card, element)
            if (this.selection.length === this.rules.numVariations) {
                const isSet = this.rules.isSet(this.selection)
                this.turn.ifPresent(turn => turn.onSelectionComplete(isSet))
                if (isSet) {
                    this.soundManager.play(Sound.Success)
                    await this.removeSet(this.selection.splice(0, this.selection.length))
                    await Waiting.forFrame()
                    let ready = this.hasSets() && this.dealtCards() >= this.rules.numVariations * this.rules.numFeatures
                    if (ready) {
                        this.sortElements()
                    } else {
                        while (!ready) {
                            const hasMoreCards = this.deck.available() >= 3
                            if (hasMoreCards) {
                                await this.dealCards(this.rules.numVariations)
                            }
                            ready = this.hasSets()
                            if (ready || !hasMoreCards) {
                                break
                            }
                        }
                        if (!ready) {
                            console.log(`GAME OVER available: ${this.deck.available()}, onTable: ${this.dealtCards()}`)
                            this.gameOver = true
                            this.acceptUserInput = false
                            this.running = false
                        }
                    }
                } else {
                    const invalidCards = this.selection.slice()
                    await this.deselectAll()
                    this.soundManager.play(Sound.Failure)
                    await this.showInvalidAnimation(invalidCards)
                }
                this.turn.ifPresent(turn => turn.onTurnComplete(this.gameOver))
                this.turn = Options.None
            }
        }
    }

    private async dealCards(count: number): Promise<void> {
        const cards = this.deck.take(count)
        const elements = []
        for (const card of cards) {
            const element = this.cardFactory.create(card)
            elements.push(element)
            this.map.set(element, card)
            this.sortElement(element)
        }
        this.soundManager.play(Sound.Appearance)
        for (const element of elements) {
            await Waiting.forFrames(this.random.nextInt(4, 12))
            element.classList.add("appearing")
            Waiting.forAnimationComplete(element).then(() => {
                this.soundManager.play(Sound.Docked)
                element.classList.remove("appearing")
                element.classList.add("visible")
            })
        }
        return Promise.resolve()
    }

    private async removeSet(cards: Card[]): Promise<void> {
        const waiting = []
        const elements = cards.map(card => this.findElement(card))
        const placeholders: Element[] = []
        let zIndex = 0
        for (const element of elements) {
            this.map.delete(element)

            const elementRect = element.getBoundingClientRect()
            const containerRect = this.cardsElement.getBoundingClientRect()
            element.style.top = `${elementRect.top - containerRect.top}px`
            element.style.left = `${elementRect.left - containerRect.left}px`
            element.style.height = `${elementRect.height}px`
            element.style.position = "absolute"
            element.style.zIndex = `${1000 - zIndex++}`

            const placeholder = this.cardFactory.createEmptySVG()
            placeholders.push(placeholder)
            element.parentNode.replaceChild(placeholder, element)

            this.cardsElement.appendChild(element)
            element.classList.add("solved")
            waiting.push(Waiting.forAnimationComplete(element).then(() => element.remove()))
            await Waiting.forFrames(this.random.nextInt(4, 16))
        }
        await Promise.all(waiting)
        this.soundManager.play(Sound.Fly)
        placeholders.forEach(placeholder => placeholder.remove())
        await Waiting.forFrames(30)
        return Promise.resolve()
    }

    private sortElement(element: SVGSVGElement) {
        const sorted: Element[] = this.rows.slice()
            .sort((a: Element, b: Element): number => a.childElementCount - b.childElementCount)
        sorted[0].appendChild(element)
    }

    private sortElements() {
        const rows: Element[] = this.rows.slice()
        while (true) {
            rows.sort((a: Element, b: Element): number => a.childElementCount - b.childElementCount)
            const prev = rows[0]
            const next = rows[rows.length - 1]
            if (prev.childElementCount + 2 <= next.childElementCount) {
                const element = next.lastChild
                element.remove()
                prev.appendChild(element)
            } else {
                break
            }
        }
    }

    private findElement(card: Card): SVGSVGElement {
        return this.cardsElement.querySelector(`svg[indices='${card.serialize()}']`)
    }

    private hasSets(): boolean {
        return this.rules.findSets(Array.from(this.map.values())).length !== 0
    }

    private dealtCards(): number {
        return this.map.size
    }

    private selectCard(card: Card, element: Element): void {
        console.assert(!this.selection.includes(card))
        this.selection.push(card)
        element.classList.add("selected")
    }

    private deselectCard(card: Card, element: Element): void {
        console.assert(this.selection.includes(card))
        this.selection.splice(this.selection.indexOf(card), 1)
        element.classList.remove("selected")
    }

    private async deselectAll(): Promise<void> {
        while (this.selection.length > 0) {
            const element = this.findElement(this.selection.pop())
            await Waiting.forEvent(element, "animationiteration")
            element.classList.remove("selected")
        }
        return Promise.resolve()
    }

    private async showInvalidAnimation(cards: Card[]): Promise<void> {
        const waiting = []
        cards.forEach(card => {
            const element = this.findElement(card)
            element.classList.add("invalid")
            waiting.push(Waiting.forAnimationComplete(element))
        })
        return Promise.all(waiting).then(() =>
            cards.forEach(card => this.findElement(card).classList.remove("invalid")))
    }

    private watchResize(): void {
        let containerWidth = 0
        let containerHeight = 0
        const watchResize = () => {
            if (!this.running) return
            const clientWidth = this.rootElement.clientWidth
            const clientHeight = this.rootElement.clientHeight
            if (containerWidth !== clientWidth || containerHeight != clientHeight) {
                containerWidth = clientWidth
                containerHeight = clientHeight
                const clientSize = Math.min(clientWidth, clientHeight)
                const padding = 50
                const cardsGap = getComputedStyle(document.documentElement).getPropertyValue("--card-gap")
                const cardSize = (clientSize - (this.rules.numVariations - 1) * parseInt(cardsGap) - 2 * padding) / this.rules.numVariations
                document.documentElement.style.setProperty('--card-size', `${cardSize.toFixed(0)}px`)
            }
            requestAnimationFrame(watchResize)
        }
        requestAnimationFrame(watchResize)
    }

    private installUserInput(): void {
        const click = async (event: Event) => {
            if (!this.acceptUserInput) return
            const element = event.target as Element
            const card = this.map.get(element)
            if (card !== undefined) {
                this.acceptUserInput = false
                await this.processCardClick(card, element)
                this.acceptUserInput = true
            } else {
                await this.deselectAll()
            }
        }
        this.rootElement.addEventListener("mousedown", click)
        this.rootElement.addEventListener("touchstart", async event => {
            this.rootElement.removeEventListener("mousedown", click)
            await click(event)
        })

        let timeoutId: number = -1
        window.addEventListener("keydown", async (event: KeyboardEvent) => {
            if (!this.acceptUserInput) return
            if (event.code === "Escape") {
                event.preventDefault()
                const sets = this.rules.findSets(Array.from(this.map.values()))
                if (sets.length === 0) return
                const elements = sets[this.hintIndex++ % sets.length].map(card => this.findElement(card))
                const removeHintState = element => element.classList.remove("hint")
                this.cardsElement.querySelectorAll("svg.hint").forEach(removeHintState)
                elements.forEach(element => element.classList.add("hint"))
                clearTimeout(timeoutId)
                timeoutId = setTimeout(() => elements.forEach(removeHintState), 1000)
            } else if (event.code === "Space" && !event.repeat && event.shiftKey) {
                event.preventDefault()
                this.acceptUserInput = false
                const sets = this.rules.findSets(Array.from(this.map.values()))
                if (sets.length === 0) return
                for (const card of sets[0]) {
                    await Waiting.forFrames(3)
                    await this.processCardClick(card, this.findElement(card))
                }
                this.acceptUserInput = true
            }
        })
    }
}