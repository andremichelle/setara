export const TerminableVoid = {
    terminate() {
    }
};
export class Terminator {
    constructor() {
        this.terminables = [];
    }
    with(terminable) {
        this.terminables.push(terminable);
        return terminable;
    }
    terminate() {
        while (this.terminables.length) {
            this.terminables.pop().terminate();
        }
    }
}
export class Options {
    static valueOf(value) {
        return null === value || undefined === value ? Options.None : new Options.Some(value);
    }
}
Options.Some = class {
    constructor(value) {
        this.value = value;
        this.get = () => this.value;
        this.contains = (value) => value === this.value;
        this.ifPresent = (callback) => callback(this.value);
        this.isEmpty = () => false;
        this.nonEmpty = () => true;
        console.assert(null !== value && undefined !== value, "Cannot be null or undefined");
    }
    toString() {
        return `Options.Some(${this.value})`;
    }
};
Options.None = new class {
    constructor() {
        this.get = () => {
            throw new Error("Option has no value");
        };
        this.contains = (_) => false;
        this.ifPresent = (_) => {
        };
        this.isEmpty = () => true;
        this.nonEmpty = () => false;
    }
    toString() {
        return `Options.None`;
    }
};
export class ObservableImpl {
    constructor() {
        this.observers = [];
    }
    notify(value) {
        this.observers.forEach(observer => observer(value));
    }
    addObserver(observer) {
        this.observers.push(observer);
        return { terminate: () => this.removeObserver(observer) };
    }
    removeObserver(observer) {
        let index = this.observers.indexOf(observer);
        if (-1 < index) {
            this.observers.splice(index, 1);
            return true;
        }
        return false;
    }
    terminate() {
        this.observers.splice(0, this.observers.length);
    }
}
export class ObservableValueImpl {
    constructor(value) {
        this.value = value;
        this.observable = new ObservableImpl();
    }
    get() {
        return this.value;
    }
    set(value) {
        if (this.value === value) {
            return false;
        }
        this.value = value;
        this.observable.notify(value);
        return true;
    }
    addObserver(observer, notify = false) {
        if (notify)
            observer(this.value);
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
}
export class Parameter {
    constructor(valueMapping, printMapping, value) {
        this.valueMapping = valueMapping;
        this.printMapping = printMapping;
        this.value = value;
        this.observable = new ObservableImpl();
    }
    getUnipolar() {
        return this.valueMapping.x(this.value);
    }
    setUnipolar(value) {
        this.set(this.valueMapping.y(value));
    }
    print() {
        return this.printMapping.print(this.value);
    }
    get() {
        return this.value;
    }
    set(value) {
        if (value === this.value) {
            return;
        }
        this.value = value;
        this.observable.notify(value);
        return true;
    }
    addObserver(observer, notify = false) {
        if (notify)
            observer(this.value);
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
}
export class PrintMapping {
    constructor(parser, printer, preUnit = "", postUnit = "") {
        this.parser = parser;
        this.printer = printer;
        this.preUnit = preUnit;
        this.postUnit = postUnit;
    }
    static createBoolean(trueValue, falseValue) {
        return new PrintMapping(text => {
            return trueValue.toLowerCase() === text.toLowerCase();
        }, value => value ? trueValue : falseValue);
    }
    static integer(postUnit) {
        return new PrintMapping(text => {
            const value = parseInt(text, 10);
            if (isNaN(value))
                return null;
            return Math.round(value) | 0;
        }, value => String(value), "", postUnit);
    }
    static float(numPrecision, preUnit, postUnit) {
        return new PrintMapping(text => {
            const value = parseFloat(text);
            if (isNaN(value))
                return null;
            return value;
        }, value => {
            if (isNaN(value)) {
                return "N/A";
            }
            if (!isFinite(value)) {
                return value < 0.0 ? "-∞" : "∞";
            }
            return value.toFixed(numPrecision);
        }, preUnit, postUnit);
    }
    static smallFloat(numPrecision, postUnit) {
        return new PrintMapping(text => {
            const value = parseFloat(text);
            if (isNaN(value))
                return null;
            return text.toLowerCase().includes("k") ? value * 1000.0 : value;
        }, value => {
            if (value >= 1000.0) {
                return `${(value / 1000.0).toFixed(numPrecision)}k`;
            }
            return value.toFixed(numPrecision);
        }, "", postUnit);
    }
    parse(text) {
        return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""));
    }
    print(value) {
        return undefined === value ? "" : `${this.preUnit}${this.printer(value)}${this.postUnit}`;
    }
}
PrintMapping.INTEGER = PrintMapping.integer("");
PrintMapping.FLOAT_ONE = PrintMapping.float(1, "", "");
PrintMapping.UnipolarPercent = new PrintMapping(text => {
    const value = parseFloat(text);
    if (isNaN(value))
        return null;
    return value / 100.0;
}, value => (value * 100.0).toFixed(1), "", "%");
PrintMapping.RGB = new PrintMapping(text => {
    if (3 === text.length) {
        text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2);
    }
    if (6 === text.length) {
        return parseInt(text, 16);
    }
    else {
        return null;
    }
}, value => value.toString(16).padStart(6, "0").toUpperCase(), "#", "");
export class NumericStepper {
    constructor(step = 1) {
        this.step = step;
    }
    decrease(value) {
        value.set(Math.round((value.get() - this.step) / this.step) * this.step);
    }
    increase(value) {
        value.set(Math.round((value.get() + this.step) / this.step) * this.step);
    }
}
NumericStepper.Integer = new NumericStepper(1);
NumericStepper.Hundredth = new NumericStepper(0.01);
export class ArrayUtils {
    constructor() {
    }
    static fill(n, factory) {
        const array = [];
        for (let i = 0; i < n; i++) {
            array[i] = factory(i);
        }
        return array;
    }
    static shuffle(array, n, random) {
        for (let i = 0; i < n; i++) {
            const element = array[i];
            const randomIndex = random.nextInt(0, n - 1);
            array[i] = array[randomIndex];
            array[randomIndex] = element;
        }
    }
}
ArrayUtils.binarySearch = (array, length, key) => {
    let low = 0 | 0;
    let high = (length - 1) | 0;
    while (low <= high) {
        const mid = (low + high) >>> 1;
        const midVal = array[mid];
        if (midVal < key)
            low = mid + 1;
        else if (midVal > key)
            high = mid - 1;
        else {
            if (midVal === key)
                return mid;
            else if (midVal < key)
                low = mid + 1;
            else
                high = mid - 1;
        }
    }
    return high;
};
export class Settings {
    constructor() {
        this.terminator = new Terminator();
        this.observable = new ObservableImpl();
    }
    pack(data) {
        return {
            class: this.constructor.name,
            data: data
        };
    }
    unpack(format) {
        console.assert(this.constructor.name === format.class);
        return format.data;
    }
    bindValue(property) {
        this.terminator.with(property.addObserver(() => this.observable.notify(this), false));
        return this.terminator.with(property);
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.terminator.terminate();
    }
}
export class Combinations {
    static withRepetitions(n, k) {
        const nc = Math.pow(n, k);
        const combinations = [];
        for (let i = 0; i < nc; ++i) {
            const combination = new Uint8Array(k);
            for (let j = 0, m = 1; j < k; ++j) {
                combination[j] = Math.floor(i / m) % n;
                m *= n;
            }
            combinations[i] = combination;
        }
        return combinations;
    }
    static withoutRepetitions(n, k) {
        const combinations = [];
        const bits = new Uint8Array(k + 1);
        let i;
        let e;
        for (i = 0; i <= k; i++) {
            bits[i] = i;
        }
        if (n > 0) {
            e = 1;
        }
        while (!((e == 0) || (k > n))) {
            const combination = new Uint8Array(k);
            for (i = 1; i <= k; ++i) {
                if (n > 0) {
                    combination[i - 1] = bits[i] - 1;
                }
            }
            combinations.push(combination);
            e = k;
            while (bits[e] == n - k + e) {
                e--;
                if (e === 0) {
                    break;
                }
            }
            bits[e]++;
            for (i = e + 1; i <= k; i++) {
                bits[i] = bits[i - 1] + 1;
            }
        }
        return combinations;
    }
}
export class Waiting {
    static forFrame() {
        return new Promise(resolve => requestAnimationFrame(() => resolve()));
    }
    static forFrames(count) {
        return new Promise(resolve => {
            const callback = () => {
                if (--count <= 0)
                    resolve();
                else
                    requestAnimationFrame(callback);
            };
            requestAnimationFrame(callback);
        });
    }
    static forAnimationComplete(element) {
        return Waiting.forEvents(element, "animationstart", "animationend");
    }
    static forTransitionComplete(element) {
        return Waiting.forEvents(element, "transitionstart", "transitionend");
    }
    static forEvent(element, type) {
        return new Promise((resolve) => element.addEventListener(type, () => resolve(), { once: true }));
    }
    static forEvents(element, startType, endType) {
        let numProperties = 0;
        element.addEventListener(startType, event => {
            if (event.target === element) {
                numProperties++;
            }
        });
        return new Promise((resolve) => element.addEventListener(endType, event => {
            if (event.target === element) {
                if (--numProperties === 0) {
                    resolve();
                }
                console.assert(numProperties >= 0);
            }
        }));
    }
}
//# sourceMappingURL=common.js.map