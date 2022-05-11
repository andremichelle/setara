import { ObservableValue } from "../lib/common.js";
import { Random } from "../lib/math.js";
import { GameRound } from "./game-round.js";
import { GameState } from "./game-states.js";
import { Player } from "./player.js";
import { Sound, SoundManager } from "./sounds.js";
export declare enum GameDifficulty {
    Normal = 0,
    Expert = 1
}
export declare type PlayerFactory = {
    create: (context: GameContext) => Player[];
};
export declare class GameContext {
    private readonly soundManager;
    private readonly random;
    private readonly players;
    private state;
    readonly difficulty: ObservableValue<GameDifficulty>;
    constructor(soundManager: SoundManager, random: Random, playerFactory: PlayerFactory);
    createGameRound(): GameRound;
    forEachPlayer(callback: (player: Player) => void, exclude?: Player[]): void;
    requestPlayerAction(player: Player): Promise<void>;
    play(sound: Sound): void;
    getWinner(): Player;
    getCardsAvailable(): number;
    switchState(state: GameState): void;
}
