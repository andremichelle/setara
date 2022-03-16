import {Sound, SoundManager} from "./sounds.js"
import {SVGCardFactory} from "./card-design.js"
import {Rules} from "./card.js"
import {GameRound} from "./game-round.js"
import {Random} from "../lib/math.js"
import {Player, PlayerState} from "./player.js"

class CountDown {
    private running: boolean = true
    private currentSecond: number = 0 | 0

    constructor(private readonly onProgress: (progress: number) => void,
                private readonly onSecond: (count: number) => void,
                private readonly onComplete: () => void,
                private secondsTotal: number) {
    }

    start(): void {
        const now = Date.now()
        const execFrame = () => {
            if (!this.running) {
                return
            }
            const elapsed = (Date.now() - now) / 1000.0
            if (elapsed < this.secondsTotal) {
                if (elapsed >= this.currentSecond + 1) {
                    this.onSecond(this.currentSecond++)
                }
                this.onProgress(1.0 - elapsed / this.secondsTotal)
                requestAnimationFrame(execFrame)
            } else {
                this.onProgress(0.0)
                this.onComplete()
            }
        }
        execFrame()
    }

    cancel(): void {
        this.running = false
    }
}

abstract class GameState {
    protected constructor(protected readonly context: GameContext) {
    }

    abstract executePlayerAction(player: Player): Promise<void>

    abstract executeMainAction(): void
}

class GameWaitForPlayersState extends GameState {
    private readonly players: Player[] = []

    constructor(context: GameContext) {
        super(context)

        context.forEachPlayer(player => {
            player.setState(PlayerState.WaitingToJoin)
            player.setActionName("play")
        })

        context.setAction("JOIN")
        context.setActionClickable(false)
    }

    async executePlayerAction(player: Player): Promise<void> {
        const index = this.players.indexOf(player)
        if (index === -1) {
            this.context.play(Sound.Join)
            this.players.push(player)
            player.setState(PlayerState.RequestingToJoin)
        } else {
            this.context.play(Sound.Cancel)
            this.players.splice(index, 1)
            player.setState(PlayerState.WaitingToJoin)
        }
        const canPlay = this.players.length > 0
        this.context.setAction(canPlay ? "START" : "JOIN")
        this.context.setActionClickable(canPlay)
        return Promise.resolve()
    }

    executeMainAction(): void {
        if (this.players.length > 0) {
            this.context.setAction("")
            this.context.setActionClickable(false)
            this.context.switchState(new GameStartState(this.context, this.players))
        }
    }
}

class GameStartState extends GameState {
    constructor(context: GameContext, players: Player[]) {
        super(context)

        context.forEachPlayer(player => player.setState(PlayerState.Hiding), players)
        players.forEach(player => {
            player.setActionName("Set!")
            player.setState(PlayerState.Playing)
        })

        const gameRound: GameRound = this.context.createGameRound()
        context.forEachPlayer(player => player.setCardsLeft(gameRound.available()))
        gameRound.start().then(() => this.context.switchState(new GameSearchState(context, gameRound, players)))
    }

    async executePlayerAction(player: Player): Promise<void> {
        // Nothing to do
        return Promise.resolve()
    }

    executeMainAction(): void {
        // Nothing to do
    }
}

class GameSearchState extends GameState {
    constructor(context: GameContext,
                private readonly gameRound: GameRound,
                private readonly players: Player[]) {
        super(context)

        context.forEachPlayer(player => player.setCardsLeft(gameRound.available()))
    }

    async executePlayerAction(player: Player): Promise<void> {
        this.context.switchState(new GameSelectionState(this.context, this.gameRound, this.players, player))
        return Promise.resolve()
    }

    executeMainAction(): void {
        // Nothing to do
    }
}

class GameSelectionState extends GameState {
    constructor(context: GameContext, gameRound: GameRound, players: Player[], player: Player) {
        super(context)

        this.context.play(Sound.Select)

        ;(async () => {
            players.filter(other => player !== other).forEach(player => player.setState(PlayerState.Hiding))
            player.setState(PlayerState.Selecting)

            const countDown = new CountDown(
                progress => player.setCountDown(progress),
                () => {
                    this.context.play(Sound.Countdown)
                    player.flashCountDown()
                },
                () => {
                    gameRound.cancelTurn()
                    player.addScore(-50)
                }, 5)
            countDown.start()

            const gameOver = await gameRound.waitForTurnComplete((isSet: boolean) => {
                countDown.cancel()
                player.setCountDown(0.0)
                if (isSet) {
                    player.addScore(100)
                } else {
                    player.addScore(-50)
                }
            })
            player.setState(PlayerState.Playing)
            players.filter(other => player !== other).forEach(player => player.setState(PlayerState.Playing))
            if (gameOver) {
                this.context.switchState(new GameOverState(context, gameRound))
            } else {
                this.context.switchState(new GameSearchState(context, gameRound, players))
            }
        })()
    }

    async executePlayerAction(player: Player): Promise<void> {
        // Nothing to do
        return Promise.resolve()
    }

    executeMainAction(): void {
        // Nothing to do
    }
}

class GameOverState extends GameState {
    constructor(context: GameContext, private gameRound: GameRound) {
        super(context)

        const winner = context.getWinner()
        winner.setState(PlayerState.Winner)
        this.context.play(Sound.GameOver)
        this.context.forEachPlayer(player => player.setState(PlayerState.Hiding), [winner])
        this.context.setAction("GAME OVER")
    }

    executePlayerAction(player: Player): Promise<void> {
        return Promise.resolve()
    }

    executeMainAction(): void {
        this.gameRound.terminate()
        this.gameRound = null
        this.context.switchState(new GameWaitForPlayersState(this.context))
    }
}

export type PlayerFactory = { create: (context: GameContext) => Player[] }

export class GameContext {
    private readonly players: Player[]
    private readonly actionButton: HTMLElement = document.querySelector("button.action-button")
    private readonly cardFactory: SVGCardFactory = new SVGCardFactory()

    private state: GameState

    constructor(private readonly soundManager: SoundManager,
                private readonly random: Random,
                playerFactory: PlayerFactory) {
        const actionBegin = (event: MouseEvent | TouchEvent) => {
            event.preventDefault()
            this.state.executeMainAction()
        }
        this.actionButton.addEventListener("mousedown", actionBegin)
        this.actionButton.addEventListener("touchstart", actionBegin)
        this.players = playerFactory.create(this)
        this.switchState(new GameWaitForPlayersState(this))
    }

    createGameRound(): GameRound {
        return new GameRound(new Rules(), this.cardFactory, this.soundManager, this.random)
    }

    forEachPlayer(callback: (player: Player) => void, exclude?: Player[]): void {
        if (exclude === undefined) {
            this.players.forEach(callback)
        } else {
            this.players.filter(player => !exclude.includes(player)).forEach(callback)
        }
    }

    requestPlayerAction(player: Player): Promise<void> {
        return this.state.executePlayerAction(player)
    }

    play(sound: Sound) {
        this.soundManager.play(sound)
    }

    setAction(message: string) {
        this.actionButton.textContent = message
    }

    setActionClickable(clickable: boolean): void {
        this.actionButton.style.cursor = clickable ? "pointer" : "default"
    }

    getWinner(): Player {
        return this.players.slice().sort((a: Player, b: Player) => b.getScore() - a.getScore())[0]
    }

    switchState(state: GameState): void {
        console.debug(`switch to ${state.constructor.name}`)
        this.state = state
    }
}