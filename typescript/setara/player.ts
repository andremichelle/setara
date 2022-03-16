import {GameContext} from "./game-context.js"

export enum PlayerState {
    WaitingToJoin, RequestingToJoin, Playing, Selecting, Hiding, Winner
}

export class Player {
    private readonly button: HTMLElement
    private readonly scoreLabel: HTMLElement
    private readonly countdownBar: HTMLElement
    private readonly cardsLeftLabel: HTMLElement
    private readonly cardsAvailablePoints: HTMLElement
    private readonly crown: HTMLElement

    private score: number = 0 | 0

    constructor(private readonly gameContext: GameContext,
                private readonly element: Element) {
        this.button = element.querySelector("button")
        const clickHandler = async (event: Event) => {
            event.preventDefault()
            await this.gameContext.requestPlayerAction(this)
        }
        this.button.addEventListener("mousedown", clickHandler)
        this.button.addEventListener("touchstart", clickHandler)
        this.scoreLabel = element.querySelector("div.display.score span")
        this.countdownBar = element.querySelector("div.display.countdown div span")
        this.cardsLeftLabel = element.querySelector("[data-info='cards-left']")
        this.cardsAvailablePoints = element.querySelector("[data-info='available-points']")
        this.crown = this.element.querySelector("div.crown")
        this.setCountDown(0.0)
        this.setCardsLeft(0)
        this.updateScoreLabel()
    }

    setState(state: PlayerState): void {
        this.element.classList.remove("waiting")
        this.element.classList.remove("requesting")
        this.element.classList.remove("playing")
        this.element.classList.remove("selecting")
        this.element.classList.remove("hide")
        this.element.classList.remove("winner")
        switch (state) {
            case PlayerState.WaitingToJoin: {
                this.element.classList.add("waiting")
                break
            }
            case PlayerState.RequestingToJoin: {
                this.element.classList.add("requesting")
                break
            }
            case PlayerState.Playing: {
                this.element.classList.add("playing")
                break
            }
            case PlayerState.Selecting: {
                this.element.classList.add("selecting")
                break
            }
            case PlayerState.Hiding: {
                this.element.classList.add("hide")
                break
            }
            case PlayerState.Winner: {
                this.element.classList.add("winner")
                break
            }
        }
    }

    setCardsLeft(count: number): void {
        this.cardsLeftLabel.textContent = `${count}`
    }

    setAvailablePoints(points: number): void {
        this.cardsAvailablePoints.textContent = `${points}`
        this.cardsAvailablePoints.classList.add("flash")
        this.cardsAvailablePoints.addEventListener("animationend", () =>
            this.cardsAvailablePoints.classList.remove("flash"), {once: true})
    }

    setActionName(text: string): void {
        this.button.textContent = text
    }

    setCountDown(progress: number): void {
        this.countdownBar.style.width = `${progress * 100}%`
    }

    flashCountDown() {
        this.countdownBar.classList.add("flash")
        this.countdownBar.addEventListener("animationend", () =>
            this.countdownBar.classList.remove("flash"))
    }

    addScore(points: number): void {
        this.score += points
        this.updateScoreLabel()
    }

    getScore(): number {
        return this.score
    }

    private updateScoreLabel() {
        if (this.score < 0) this.scoreLabel.classList.add("negative")
        else this.scoreLabel.classList.remove("negative")
        this.scoreLabel.textContent = `${Math.abs(this.score).toString(10).padStart(4, "0")}`
    }
}