import { Sound, SoundManager } from "./sounds.js";
import { GameRound } from "./game-round.js";
import { Random } from "../lib/math.js";
import { Player } from "./player.js";
declare abstract class GameState {
    protected readonly context: GameContext;
    protected constructor(context: GameContext);
    abstract executePlayerAction(player: Player): Promise<void>;
    abstract executeMainAction(): void;
}
export declare type PlayerFactory = {
    create: (context: GameContext) => Player[];
};
export declare class GameContext {
    private readonly soundManager;
    private readonly random;
    private readonly players;
    private readonly actionButton;
    private state;
    constructor(soundManager: SoundManager, random: Random, playerFactory: PlayerFactory);
    createGameRound(): GameRound;
    forEachPlayer(callback: (player: Player) => void, exclude?: Player[]): void;
    requestPlayerAction(player: Player): Promise<void>;
    play(sound: Sound): void;
    setAction(message: string): void;
    setActionClickable(clickable: boolean): void;
    getWinner(): Player;
    switchState(state: GameState): void;
}
export {};
