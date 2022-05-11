import {ObservableValue, ObservableValueImpl} from "../lib/common.js"
import {Random} from "../lib/math.js"
import {GameRound} from "./game-round.js"
import {GameState, GameWaitForPlayersState} from "./game-states.js"
import {Player} from "./player.js"
import {Sound, SoundManager} from "./sounds.js"

export enum GameDifficulty {
    Normal, Expert
}

export type PlayerFactory = { create: (context: GameContext) => Player[] }

export class GameContext {
    private readonly players: Player[]

    private state: GameState = null

    readonly difficulty: ObservableValue<GameDifficulty> = new ObservableValueImpl<GameDifficulty>(GameDifficulty.Normal)

    constructor(private readonly soundManager: SoundManager,
                private readonly random: Random,
                playerFactory: PlayerFactory) {
        this.players = playerFactory.create(this)
        this.switchState(new GameWaitForPlayersState(this))
    }

    createGameRound(): GameRound {
        const difficulty = this.difficulty.get()
        if (difficulty === GameDifficulty.Normal) {
            return new GameRound(this.soundManager, this.random, 4, 3)
        } else if (difficulty === GameDifficulty.Expert) {
            return new GameRound(this.soundManager, this.random, 4, 4)
        }
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

    getWinner(): Player {
        return this.players.slice().sort((a: Player, b: Player) => b.getScore() - a.getScore())[0]
    }

    getCardsAvailable(): number {
        return this.difficulty.get() === GameDifficulty.Normal ? Math.pow(3, 4) : Math.pow(4, 4)
    }

    switchState(state: GameState): void {
        if (this.state !== null) {
            this.state.terminate()
        }
        console.debug(`switch to ${state.constructor.name}`)
        this.state = state
    }
}