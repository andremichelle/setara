var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Events, Terminator } from "../lib/common.js";
import { PlayerState } from "./player.js";
import { Sound } from "./sounds.js";
import { GameConstants, GameDifficulty } from "./game-context.js";
export class GameState {
    constructor(context) {
        this.context = context;
    }
}
export class GameWaitForPlayersState extends GameState {
    constructor(context) {
        super(context);
        this.terminator = new Terminator();
        this.players = [];
        context.forEachPlayer(player => {
            player.setState(PlayerState.WaitingToJoin);
            player.setAvailablePoints(GameConstants.MAX_SCORE);
            player.setActionName("play");
        });
        this.menu = document.querySelector("div.menu.start");
        this.menu.classList.remove("hidden");
        this.buttonManual = this.menu.querySelector("button.menu-button.manual");
        this.buttonNormal = this.menu.querySelector("button.menu-button.normal");
        this.buttonExpert = this.menu.querySelector("button.menu-button.expert");
        this.buttonStart = this.menu.querySelector("button.menu-button.start");
        this.buttonStart.classList.add("disabled");
        this.terminator.with(Events.bindEventListener(this.buttonManual, "click", event => {
            event.preventDefault();
            this.context.play(Sound.Reject);
        }));
        this.terminator.with(Events.bindEventListener(this.buttonNormal, "click", event => {
            event.preventDefault();
            this.context.play(Sound.Click);
            this.context.difficulty.set(GameDifficulty.Normal);
        }));
        this.terminator.with(Events.bindEventListener(this.buttonExpert, "click", event => {
            event.preventDefault();
            this.context.play(Sound.Click);
            this.context.difficulty.set(GameDifficulty.Expert);
        }));
        this.terminator.with(this.context.difficulty.addObserver(difficulty => {
            if (difficulty === GameDifficulty.Normal) {
                this.buttonNormal.classList.add("active");
                this.buttonExpert.classList.remove("active");
            }
            else if (difficulty === GameDifficulty.Expert) {
                this.buttonExpert.classList.add("active");
                this.buttonNormal.classList.remove("active");
            }
        }, true));
        this.terminator.with(Events.bindEventListener(this.buttonStart, "click", event => {
            event.preventDefault();
            this.context.play(Sound.Click);
            if (this.players.length > 0) {
                this.menu.classList.add("hidden");
                this.context.switchState(new GameStartState(this.context, this.players));
            }
        }));
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
            if (this.players.length > 0) {
                this.buttonStart.classList.remove("disabled");
            }
            else {
                this.buttonStart.classList.add("disabled");
            }
            return Promise.resolve();
        });
    }
    terminate() {
        this.terminator.terminate();
    }
}
export class GameStartState extends GameState {
    constructor(context, players) {
        super(context);
        context.forEachPlayer(player => player.setState(PlayerState.Hiding), players);
        const gameRound = this.context.createGameRound();
        context.forEachPlayer(player => player.setCardsLeft(gameRound.available()));
        gameRound.start().then(() => {
            players.forEach(player => {
                player.setActionName("Set!");
                player.setState(PlayerState.Playing);
            });
            this.context.switchState(new GameSearchState(context, gameRound, players));
        });
    }
    executePlayerAction(player) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    terminate() {
    }
}
export class GameSearchState extends GameState {
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
    terminate() {
        clearInterval(this.interval);
    }
}
export class GameSelectionState extends GameState {
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
    terminate() {
    }
}
export class GameOverState extends GameState {
    constructor(context, gameRound) {
        super(context);
        this.gameRound = gameRound;
        const winner = context.getWinner();
        winner.setState(PlayerState.Winner);
        this.context.play(Sound.GameOver);
        this.context.forEachPlayer(player => player.setState(PlayerState.Hiding), [winner]);
        const menu = document.querySelector("div.menu.start-over");
        menu.classList.remove("hidden");
        this.subscription = Events.bindEventListener(menu.querySelector("button.menu-button.start"), "click", (event) => {
            event.preventDefault();
            menu.classList.add("hidden");
            this.startOver();
        });
    }
    executePlayerAction(player) {
        return Promise.resolve();
    }
    startOver() {
        this.gameRound.terminate();
        this.gameRound = null;
        this.context.forEachPlayer(player => player.reset());
        this.context.switchState(new GameWaitForPlayersState(this.context));
    }
    terminate() {
        this.subscription.terminate();
    }
}
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
//# sourceMappingURL=game-states.js.map