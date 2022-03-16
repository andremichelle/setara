var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Sound } from "./sounds.js";
import { SVGCardFactory } from "./card-design.js";
import { Rules } from "./card.js";
import { GameRound } from "./game-round.js";
import { PlayerState } from "./player.js";
class CountDown {
    constructor(onProgress, onSecond, onComplete, secondsTotal) {
        this.onProgress = onProgress;
        this.onSecond = onSecond;
        this.onComplete = onComplete;
        this.secondsTotal = secondsTotal;
        this.running = true;
        this.currentSecond = 0 | 0;
    }
    start() {
        const now = Date.now();
        const execFrame = () => {
            if (!this.running) {
                return;
            }
            const elapsed = (Date.now() - now) / 1000.0;
            if (elapsed < this.secondsTotal) {
                if (elapsed >= this.currentSecond + 1) {
                    this.onSecond(this.currentSecond++);
                }
                this.onProgress(1.0 - elapsed / this.secondsTotal);
                requestAnimationFrame(execFrame);
            }
            else {
                this.onProgress(0.0);
                this.onComplete();
            }
        };
        execFrame();
    }
    cancel() {
        this.running = false;
    }
}
class GameConstants {
}
GameConstants.MAX_SCORE = 1000;
GameConstants.MIN_SCORE = 100;
GameConstants.SCORE_DECAY = 100;
GameConstants.SCORE_DECAY_INTERVAL = 10000;
class GameState {
    constructor(context) {
        this.context = context;
    }
}
class GameWaitForPlayersState extends GameState {
    constructor(context) {
        super(context);
        this.players = [];
        context.forEachPlayer(player => {
            player.setState(PlayerState.WaitingToJoin);
            player.setAvailablePoints(GameConstants.MAX_SCORE);
            player.setActionName("play");
        });
        context.setAction("JOIN");
        context.setActionClickable(false);
    }
    executePlayerAction(player) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.players.indexOf(player);
            if (index === -1) {
                this.context.play(Sound.Join);
                this.players.push(player);
                player.setState(PlayerState.RequestingToJoin);
            }
            else {
                this.context.play(Sound.Cancel);
                this.players.splice(index, 1);
                player.setState(PlayerState.WaitingToJoin);
            }
            const canPlay = this.players.length > 0;
            this.context.setAction(canPlay ? "START" : "JOIN");
            this.context.setActionClickable(canPlay);
            return Promise.resolve();
        });
    }
    executeMainAction() {
        if (this.players.length > 0) {
            this.context.setAction("");
            this.context.setActionClickable(false);
            this.context.switchState(new GameStartState(this.context, this.players));
        }
    }
}
class GameStartState extends GameState {
    constructor(context, players) {
        super(context);
        context.forEachPlayer(player => player.setState(PlayerState.Hiding), players);
        players.forEach(player => {
            player.setActionName("Set!");
            player.setState(PlayerState.Playing);
        });
        const gameRound = this.context.createGameRound();
        context.forEachPlayer(player => player.setCardsLeft(gameRound.available()));
        gameRound.start().then(() => this.context.switchState(new GameSearchState(context, gameRound, players)));
    }
    executePlayerAction(player) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    executeMainAction() {
    }
}
class GameSearchState extends GameState {
    constructor(context, gameRound, players) {
        super(context);
        this.gameRound = gameRound;
        this.players = players;
        this.points = GameConstants.MAX_SCORE;
        this.interval = -1;
        this.decreasePoints = () => {
            this.context.play(Sound.PointDecay);
            if (this.points > GameConstants.MIN_SCORE) {
                this.points -= GameConstants.SCORE_DECAY;
                this.context.forEachPlayer(player => player.setAvailablePoints(this.points));
            }
            else if (-1 !== this.interval) {
                clearInterval(this.interval);
                this.interval = -1;
                this.gameRound.showHint();
            }
        };
        this.interval = setInterval(this.decreasePoints, GameConstants.SCORE_DECAY_INTERVAL);
        context.forEachPlayer(player => {
            player.setCardsLeft(gameRound.available());
            player.setAvailablePoints(this.points);
        });
    }
    executePlayerAction(player) {
        return __awaiter(this, void 0, void 0, function* () {
            if (-1 !== this.interval) {
                clearInterval(this.interval);
                this.interval = -1;
            }
            this.context.switchState(new GameSelectionState(this.context, this.gameRound, this.players, player, this.points));
            return Promise.resolve();
        });
    }
    executeMainAction() {
    }
}
class GameSelectionState extends GameState {
    constructor(context, gameRound, players, player, possibleScore) {
        super(context);
        this.context.play(Sound.Select);
        (() => __awaiter(this, void 0, void 0, function* () {
            players.filter(other => player !== other).forEach(player => player.setState(PlayerState.Hiding));
            player.setState(PlayerState.Selecting);
            const countDown = new CountDown(progress => player.setCountDown(progress), () => {
                this.context.play(Sound.Countdown);
                player.flashCountDown();
            }, () => {
                gameRound.cancelTurn();
                player.addScore(-possibleScore);
            }, 5);
            countDown.start();
            const gameOver = yield gameRound.waitForTurnComplete((isSet) => {
                countDown.cancel();
                player.setCountDown(0.0);
                if (isSet) {
                    player.addScore(possibleScore);
                }
                else {
                    player.addScore(-possibleScore);
                }
            });
            player.setState(PlayerState.Playing);
            players.filter(other => player !== other).forEach(player => player.setState(PlayerState.Playing));
            if (gameOver) {
                this.context.switchState(new GameOverState(context, gameRound));
            }
            else {
                this.context.switchState(new GameSearchState(context, gameRound, players));
            }
        }))();
    }
    executePlayerAction(player) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    executeMainAction() {
    }
}
class GameOverState extends GameState {
    constructor(context, gameRound) {
        super(context);
        this.gameRound = gameRound;
        const winner = context.getWinner();
        winner.setState(PlayerState.Winner);
        this.context.play(Sound.GameOver);
        this.context.forEachPlayer(player => player.setState(PlayerState.Hiding), [winner]);
        this.context.setAction("GAME OVER");
    }
    executePlayerAction(player) {
        return Promise.resolve();
    }
    executeMainAction() {
        this.gameRound.terminate();
        this.gameRound = null;
        this.context.switchState(new GameWaitForPlayersState(this.context));
    }
}
export class GameContext {
    constructor(soundManager, random, playerFactory) {
        this.soundManager = soundManager;
        this.random = random;
        this.actionButton = document.querySelector("button.action-button");
        this.cardFactory = new SVGCardFactory();
        const actionBegin = (event) => {
            event.preventDefault();
            this.state.executeMainAction();
        };
        this.actionButton.addEventListener("mousedown", actionBegin);
        this.actionButton.addEventListener("touchstart", actionBegin);
        this.players = playerFactory.create(this);
        this.switchState(new GameWaitForPlayersState(this));
    }
    createGameRound() {
        return new GameRound(new Rules(), this.cardFactory, this.soundManager, this.random);
    }
    forEachPlayer(callback, exclude) {
        if (exclude === undefined) {
            this.players.forEach(callback);
        }
        else {
            this.players.filter(player => !exclude.includes(player)).forEach(callback);
        }
    }
    requestPlayerAction(player) {
        return this.state.executePlayerAction(player);
    }
    play(sound) {
        this.soundManager.play(sound);
    }
    setAction(message) {
        this.actionButton.textContent = message;
    }
    setActionClickable(clickable) {
        this.actionButton.style.cursor = clickable ? "pointer" : "default";
    }
    getWinner() {
        return this.players.slice().sort((a, b) => b.getScore() - a.getScore())[0];
    }
    switchState(state) {
        console.debug(`switch to ${state.constructor.name}`);
        this.state = state;
    }
}
//# sourceMappingURL=game-context.js.map