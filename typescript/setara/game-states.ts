import {Events, Terminable, Terminator} from "../lib/common.js"
import {GameContext, GameDifficulty} from "./game-context.js"
import {GameRound} from "./game-round.js"
import {Player, PlayerState} from "./player.js"
import {Sound} from "./sounds.js"

export abstract class GameState implements Terminable {
    protected constructor(protected readonly context: GameContext) {
    }

    abstract executePlayerAction(player: Player): Promise<void>

    abstract terminate(): void
}

export class GameWaitForPlayersState extends GameState {
    private readonly terminator: Terminator = new Terminator()
    private readonly players: Player[] = []

    private readonly menu: HTMLElement
    private readonly buttonManual: HTMLElement
    private readonly buttonNormal: HTMLElement
    private readonly buttonExpert: HTMLElement
    private readonly buttonStart: HTMLElement

    private manual: Element

    constructor(context: GameContext) {
        super(context)

        context.forEachPlayer(player => {
            player.setState(PlayerState.WaitingToJoin)
            player.setActionName("join")
        })

        this.menu = document.querySelector("div.menu.start")
        this.menu.classList.remove("hidden")
        this.manual = document.querySelector("div.menu.manual")
        this.buttonManual = this.menu.querySelector("button.menu-button.manual")
        this.buttonNormal = this.menu.querySelector("button.menu-button.normal")
        this.buttonExpert = this.menu.querySelector("button.menu-button.expert")
        this.buttonStart = this.menu.querySelector("button.menu-button.start")
        this.buttonStart.classList.add("disabled")

        this.terminator.with(Events.bindEventListener(this.buttonManual, "pointerdown", event => {
            event.preventDefault()
            this.menu.classList.add("hidden")
            this.manual.classList.remove("hidden")
            this.manual.querySelector("button").addEventListener("pointerdown", () => {
                this.menu.classList.remove("hidden")
                this.manual.classList.add("hidden")
            }, {once: true})
        }))

        this.terminator.with(Events.bindEventListener(this.buttonNormal, "pointerdown", event => {
            event.preventDefault()
            this.context.play(Sound.Click)
            this.context.difficulty.set(GameDifficulty.Normal)
            this.context.forEachPlayer(player => player.setCardsLeft(this.context.getCardsAvailable()))
        }))
        this.terminator.with(Events.bindEventListener(this.buttonExpert, "pointerdown", event => {
            event.preventDefault()
            this.context.play(Sound.Click)
            this.context.difficulty.set(GameDifficulty.Expert)
            this.context.forEachPlayer(player => player.setCardsLeft(this.context.getCardsAvailable()))
        }))
        this.context.forEachPlayer(player => player.setCardsLeft(this.context.getCardsAvailable()))
        this.terminator.with(this.context.difficulty.addObserver(difficulty => {
            if (difficulty === GameDifficulty.Normal) {
                this.buttonNormal.classList.add("active")
                this.buttonExpert.classList.remove("active")
            } else if (difficulty === GameDifficulty.Expert) {
                this.buttonExpert.classList.add("active")
                this.buttonNormal.classList.remove("active")
            }
        }, true))

        this.terminator.with(Events.bindEventListener(this.buttonStart, "pointerdown", event => {
            event.preventDefault()
            this.context.play(Sound.Click)
            if (this.players.length > 0) {
                this.menu.classList.add("hidden")
                this.context.switchState(new GameStartState(this.context, this.players))
            }
        }))
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
        if (this.players.length > 0) {
            this.buttonStart.classList.remove("disabled")
        } else {
            this.buttonStart.classList.add("disabled")
        }
        return Promise.resolve()
    }

    terminate(): void {
        this.terminator.terminate()
    }
}

export class GameStartState extends GameState {
    constructor(context: GameContext, players: Player[]) {
        super(context)

        context.forEachPlayer(player => player.setState(PlayerState.Hiding), players)

        const gameRound: GameRound = this.context.createGameRound()
        context.forEachPlayer(player => player.setCardsLeft(gameRound.available()))
        gameRound.start().then(() => {
            players.forEach(player => {
                player.setActionName("Set!")
                player.setState(PlayerState.Playing)
            })
            this.context.switchState(new GameSearchState(context, gameRound, players))
        })
    }

    async executePlayerAction(player: Player): Promise<void> {
        // Nothing to do
        return Promise.resolve()
    }

    terminate(): void {
    }
}

export class GameSearchState extends GameState {
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

    terminate(): void {
    }
}

export class GameSelectionState extends GameState {
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
                    player.addScore(-1)
                }, players.length > 1 ? 5 : 30)
            countDown.start()

            const gameOver = await gameRound.waitForTurnComplete((isSet: boolean) => {
                countDown.cancel()
                player.setCountDown(0.0)
                if (isSet) {
                    player.addScore(1)
                } else {
                    player.addScore(-1)
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

    terminate(): void {
    }
}

export class GameOverState extends GameState {
    private readonly subscription: Terminable

    constructor(context: GameContext, private gameRound: GameRound) {
        super(context)

        const winner = context.getWinner()
        winner.setState(PlayerState.Winner)
        this.context.play(Sound.GameOver)

        const menu = document.querySelector("div.menu.start-over")
        menu.classList.remove("hidden")
        const button = menu.querySelector("button.menu-button.restart")
        this.subscription = Events.bindEventListener(button, "pointerdown", (event: Event) => {
            event.preventDefault()
            menu.classList.add("hidden")
            this.startOver()
        })
    }

    executePlayerAction(player: Player): Promise<void> {
        return Promise.resolve()
    }

    startOver(): void {
        this.gameRound.terminate()
        this.gameRound = null
        this.context.forEachPlayer(player => player.reset())
        this.context.switchState(new GameWaitForPlayersState(this.context))
    }

    terminate(): void {
        this.subscription.terminate()
    }
}

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