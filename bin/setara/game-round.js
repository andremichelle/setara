var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CardDeck } from "./card.js";
import { Sound } from "./sounds.js";
import { Options, Waiting } from "../lib/common.js";
class Turn {
    constructor(onSelectionComplete, onTurnComplete) {
        this.onSelectionComplete = onSelectionComplete;
        this.onTurnComplete = onTurnComplete;
    }
}
export class GameRound {
    constructor(rules, cardFactory, soundManager, random) {
        this.rules = rules;
        this.cardFactory = cardFactory;
        this.soundManager = soundManager;
        this.random = random;
        this.rows = [];
        this.deck = CardDeck.create(4, 3);
        this.map = new Map();
        this.selection = [];
        this.turn = Options.None;
        this.started = false;
        this.acceptUserInput = true;
        this.hintIndex = 0;
        this.running = true;
        this.gameOver = false;
        this.rootElement = document.querySelector("div.play-field");
        this.cardsElement = this.rootElement.querySelector("div.cards");
        for (let i = 0; i < rules.numVariations; i++) {
            const row = document.createElement("div");
            row.classList.add("row");
            this.cardsElement.appendChild(row);
            this.rows.push(row);
        }
        this.deck.shuffle();
        this.watchResize();
        this.installUserInput();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.assert(!this.started);
            this.started = true;
            yield this.dealCards(this.rules.numFeatures * this.rules.numVariations);
            while (!this.hasSets()) {
                yield this.dealCards(this.rules.numVariations);
            }
        });
    }
    waitForTurnComplete(onSelectionComplete) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.turn = Options.valueOf(new Turn(onSelectionComplete, resolve));
            });
        });
    }
    cancelTurn() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.selection.length > 0) {
                yield this.deselectAll();
            }
            this.turn.ifPresent((turn) => {
                this.soundManager.play(Sound.Cancel);
                turn.onTurnComplete(false);
            });
            this.turn = Options.None;
            return Promise.resolve();
        });
    }
    available() {
        return this.deck.available();
    }
    showHint() {
        const sets = this.rules.findSets(Array.from(this.map.values()));
        if (sets.length === 0) {
            console.warn("No set available?");
            return;
        }
        const cards = sets[0];
        if (cards.length === 0) {
            console.warn("Set has no cards?");
            return;
        }
        this.findElement(cards[0]).classList.add("hint");
    }
    terminate() {
        console.assert(this.turn.isEmpty());
        this.rows.splice(0, this.rows.length);
        this.selection.splice(0, this.rows.length);
        this.map.clear();
        while (this.cardsElement.lastChild) {
            this.cardsElement.lastChild.remove();
        }
    }
    processCardClick(card, element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.turn.isEmpty()) {
                this.soundManager.play(Sound.Reject);
                return Promise.resolve();
            }
            this.soundManager.play(Sound.Click);
            if (this.selection.includes(card)) {
                this.deselectCard(card, element);
            }
            else {
                this.selectCard(card, element);
                if (this.selection.length === this.rules.numVariations) {
                    const isSet = this.rules.isSet(this.selection);
                    this.turn.ifPresent(turn => turn.onSelectionComplete(isSet));
                    if (isSet) {
                        this.soundManager.play(Sound.Success);
                        yield this.removeSet(this.selection.splice(0, this.selection.length));
                        yield Waiting.forFrame();
                        let ready = this.hasSets() && this.dealtCards() >= this.rules.numVariations * this.rules.numFeatures;
                        if (ready) {
                            this.sortElements();
                        }
                        else {
                            while (!ready) {
                                const hasMoreCards = this.deck.available() >= 3;
                                if (hasMoreCards) {
                                    yield this.dealCards(this.rules.numVariations);
                                }
                                ready = this.hasSets();
                                if (ready || !hasMoreCards) {
                                    break;
                                }
                            }
                            if (!ready) {
                                console.log(`GAME OVER available: ${this.deck.available()}, onTable: ${this.dealtCards()}`);
                                this.gameOver = true;
                                this.acceptUserInput = false;
                                this.running = false;
                            }
                        }
                    }
                    else {
                        const invalidCards = this.selection.slice();
                        yield this.deselectAll();
                        this.soundManager.play(Sound.Failure);
                        yield this.showInvalidAnimation(invalidCards);
                    }
                    this.turn.ifPresent(turn => turn.onTurnComplete(this.gameOver));
                    this.turn = Options.None;
                }
            }
        });
    }
    dealCards(count) {
        return __awaiter(this, void 0, void 0, function* () {
            const cards = this.deck.take(count);
            const elements = [];
            for (const card of cards) {
                const element = this.cardFactory.create(card);
                elements.push(element);
                this.map.set(element, card);
                this.sortElement(element);
            }
            this.soundManager.play(Sound.Appearance);
            for (const element of elements) {
                yield Waiting.forFrames(this.random.nextInt(4, 12));
                element.classList.add("appearing");
                Waiting.forAnimationComplete(element).then(() => {
                    this.soundManager.play(Sound.Docked);
                    element.classList.remove("appearing");
                    element.classList.add("visible");
                });
            }
            return Promise.resolve();
        });
    }
    removeSet(cards) {
        return __awaiter(this, void 0, void 0, function* () {
            const waiting = [];
            const elements = cards.map(card => this.findElement(card));
            const placeholders = [];
            let zIndex = 0;
            for (const element of elements) {
                this.map.delete(element);
                element.classList.remove("selected");
                const elementRect = element.getBoundingClientRect();
                const containerRect = this.cardsElement.getBoundingClientRect();
                if (window.matchMedia("(orientation: portrait)").matches) {
                    element.style.left = `${elementRect.top - containerRect.top}px`;
                    element.style.bottom = `${elementRect.left - containerRect.left}px`;
                }
                else {
                    element.style.top = `${elementRect.top - containerRect.top}px`;
                    element.style.left = `${elementRect.left - containerRect.left}px`;
                }
                element.style.position = "absolute";
                element.style.zIndex = `${1000 - zIndex++}`;
                const placeholder = this.cardFactory.createEmptySVG();
                placeholders.push(placeholder);
                element.parentNode.replaceChild(placeholder, element);
                this.cardsElement.appendChild(element);
                element.classList.add("solved");
                waiting.push(Waiting.forAnimationComplete(element).then(() => element.remove()));
                yield Waiting.forFrames(this.random.nextInt(4, 16));
            }
            yield Promise.all(waiting);
            placeholders.forEach(placeholder => placeholder.remove());
            return Promise.resolve();
        });
    }
    sortElement(element) {
        const sorted = this.rows.slice()
            .sort((a, b) => a.childElementCount - b.childElementCount);
        sorted[0].appendChild(element);
    }
    sortElements() {
        const rows = this.rows.slice();
        while (true) {
            rows.sort((a, b) => a.childElementCount - b.childElementCount);
            const prev = rows[0];
            const next = rows[rows.length - 1];
            if (prev.childElementCount + 2 <= next.childElementCount) {
                const element = next.lastChild;
                element.remove();
                prev.appendChild(element);
            }
            else {
                break;
            }
        }
    }
    findElement(card) {
        return this.cardsElement.querySelector(`svg[indices='${card.serialize()}']`);
    }
    hasSets() {
        return this.rules.findSets(Array.from(this.map.values())).length !== 0;
    }
    dealtCards() {
        return this.map.size;
    }
    selectCard(card, element) {
        console.assert(!this.selection.includes(card));
        this.selection.push(card);
        element.classList.add("selected");
    }
    deselectCard(card, element) {
        console.assert(this.selection.includes(card));
        this.selection.splice(this.selection.indexOf(card), 1);
        element.classList.remove("selected");
    }
    deselectAll() {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.selection.length > 0) {
                const element = this.findElement(this.selection.pop());
                yield Waiting.forEvent(element, "animationiteration");
                element.classList.remove("selected");
            }
            return Promise.resolve();
        });
    }
    showInvalidAnimation(cards) {
        return __awaiter(this, void 0, void 0, function* () {
            const waiting = [];
            cards.forEach(card => {
                const element = this.findElement(card);
                element.classList.add("invalid");
                waiting.push(Waiting.forAnimationComplete(element));
            });
            return Promise.all(waiting).then(() => cards.forEach(card => this.findElement(card).classList.remove("invalid")));
        });
    }
    watchResize() {
        let containerWidth = 0;
        let containerHeight = 0;
        const watchResize = () => {
            if (!this.running)
                return;
            const clientWidth = this.rootElement.clientWidth;
            const clientHeight = this.rootElement.clientHeight;
            if (containerWidth !== clientWidth || containerHeight != clientHeight) {
                containerWidth = clientWidth;
                containerHeight = clientHeight;
                const clientSize = Math.min(clientWidth, clientHeight);
                const padding = 50;
                const cardsGap = getComputedStyle(document.documentElement).getPropertyValue("--card-gap");
                const cardSize = (clientSize - (this.rules.numVariations - 1) * parseInt(cardsGap) - 2 * padding) / this.rules.numVariations;
                document.documentElement.style.setProperty('--card-size', `${cardSize.toFixed(0)}px`);
            }
            requestAnimationFrame(watchResize);
        };
        requestAnimationFrame(watchResize);
    }
    installUserInput() {
        const click = (event) => __awaiter(this, void 0, void 0, function* () {
            if (!this.acceptUserInput)
                return;
            const element = event.target;
            const card = this.map.get(element);
            if (card !== undefined) {
                this.acceptUserInput = false;
                yield this.processCardClick(card, element);
                this.acceptUserInput = true;
            }
            else {
                yield this.deselectAll();
            }
        });
        this.rootElement.addEventListener("mousedown", click);
        this.rootElement.addEventListener("touchstart", (event) => __awaiter(this, void 0, void 0, function* () {
            this.rootElement.removeEventListener("mousedown", click);
            yield click(event);
        }));
        let timeoutId = -1;
        window.addEventListener("keydown", (event) => __awaiter(this, void 0, void 0, function* () {
            if (!this.acceptUserInput)
                return;
            if (event.code === "Escape") {
                event.preventDefault();
                const sets = this.rules.findSets(Array.from(this.map.values()));
                if (sets.length === 0)
                    return;
                const elements = sets[this.hintIndex++ % sets.length].map(card => this.findElement(card));
                const removeHintState = element => element.classList.remove("hint");
                this.cardsElement.querySelectorAll("svg.hint").forEach(removeHintState);
                elements.forEach(element => element.classList.add("hint"));
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => elements.forEach(removeHintState), 1000);
            }
            else if (event.code === "Space" && !event.repeat && event.shiftKey) {
                event.preventDefault();
                this.acceptUserInput = false;
                const sets = this.rules.findSets(Array.from(this.map.values()));
                if (sets.length === 0)
                    return;
                for (const card of sets[0]) {
                    yield Waiting.forFrames(3);
                    yield this.processCardClick(card, this.findElement(card));
                }
                this.acceptUserInput = true;
            }
        }));
    }
}
//# sourceMappingURL=game-round.js.map