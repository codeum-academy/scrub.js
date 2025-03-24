var Costume = (function () {
    function Costume() {
        this.x = 0;
        this.y = 0;
        this.ready = false;
    }
    return Costume;
}());
var EventEmitter = (function () {
    function EventEmitter() {
        this.callbacksMap = new Map();
        this.eventTarget = new EventTarget();
    }
    EventEmitter.prototype.once = function (name, type, callback) {
        var _this = this;
        if (this.callbacksMap.get(name)) {
            return false;
        }
        var wrapper = function (event) {
            if (typeof callback === 'function') {
                callback(event);
            }
            else {
                callback.handleEvent(event);
            }
            _this.eventTarget.removeEventListener(type, wrapper);
            _this.remove(name);
        };
        this.eventTarget.addEventListener(type, wrapper);
        this.callbacksMap.set(name, { type: type, callback: wrapper });
        return true;
    };
    EventEmitter.prototype.on = function (name, type, callback) {
        if (this.callbacksMap.get(name)) {
            return false;
        }
        this.eventTarget.addEventListener(type, callback);
        this.callbacksMap.set(name, { type: type, callback: callback });
        return true;
    };
    EventEmitter.prototype.emit = function (type, detail) {
        this.eventTarget.dispatchEvent(new CustomEvent(type, { detail: detail }));
    };
    EventEmitter.prototype.remove = function (name) {
        var item = this.callbacksMap.get(name);
        if (!item) {
            return false;
        }
        this.eventTarget.removeEventListener(item.type, item.callback);
        this.callbacksMap.delete(name);
        return true;
    };
    EventEmitter.prototype.removeByType = function (type) {
        var _this = this;
        this.callbacksMap.forEach(function (item, itemName) {
            if (type === item.type) {
                _this.eventTarget.removeEventListener(item.type, item.callback);
                _this.callbacksMap.delete(itemName);
            }
        });
    };
    EventEmitter.prototype.clearAll = function () {
        var _this = this;
        this.callbacksMap.forEach(function (item) {
            _this.eventTarget.removeEventListener(item.type, item.callback);
        });
        this.callbacksMap.clear();
    };
    return EventEmitter;
}());
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var Game = (function () {
    function Game(width, height, canvasId, displayErrors, locale) {
        if (width === void 0) { width = null; }
        if (height === void 0) { height = null; }
        if (canvasId === void 0) { canvasId = null; }
        if (displayErrors === void 0) { displayErrors = true; }
        if (locale === void 0) { locale = 'ru'; }
        this.debugMode = 'none';
        this.debugBody = false;
        this.stages = [];
        this.activeStage = null;
        this.styles = null;
        this.loadedStages = 0;
        this.onReadyCallbacks = [];
        this.onReadyPending = true;
        this.running = false;
        this.pendingRun = false;
        this.reportedError = false;
        this._displayErrors = true;
        this._locale = 'ru';
        this._displayErrors = displayErrors;
        this._locale = locale;
        this.validatorFactory = new ValidatorFactory(this);
        var game = this;
        if (this.displayErrors) {
            game = this.validatorFactory.createValidator(this, 'Game');
        }
        window.onerror = function () {
            game.reportError(ErrorMessages.getMessage(ErrorMessages.SCRIPT_ERROR, game._locale));
        };
        game.id = Symbol();
        game.eventEmitter = new EventEmitter();
        game.keyboard = new Keyboard();
        if (canvasId) {
            var element = document.getElementById(canvasId);
            if (element instanceof HTMLCanvasElement) {
                game.canvas = element;
            }
        }
        else {
            game.canvas = document.createElement('canvas');
            document.body.appendChild(game.canvas);
        }
        game.canvas.width = width;
        game.canvas.height = height;
        game.styles = new Styles(game.canvas, width, height);
        game.mouse = new Mouse(game);
        game.context = game.canvas.getContext('2d');
        Registry.getInstance().set('game', game);
        game.addListeners();
        return game;
    }
    Game.prototype.addStage = function (stage) {
        this.stages.push(stage);
    };
    Game.prototype.getLastStage = function () {
        if (!this.stages.length) {
            return null;
        }
        return this.stages[this.stages.length - 1];
    };
    Game.prototype.getActiveStage = function () {
        if (this.activeStage) {
            return this.activeStage;
        }
        return null;
    };
    Game.prototype.run = function (stage) {
        var e_1, _a;
        if (stage === void 0) { stage = null; }
        if (!stage && this.stages.length) {
            stage = this.stages[0];
        }
        if (!stage) {
            this.throwError(ErrorMessages.NEED_STAGE_BEFORE_RUN_GAME);
        }
        if (!this.running) {
            try {
                for (var _b = __values(this.stages), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var inStage = _c.value;
                    inStage.ready();
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        if (this.activeStage && this.activeStage.running) {
            this.activeStage.stop();
        }
        this.running = false;
        this.pendingRun = true;
        this.activeStage = stage;
        this.tryDoRun();
    };
    Game.prototype.isReady = function () {
        return this.loadedStages == this.stages.length;
    };
    Game.prototype.onReady = function (callback) {
        this.onReadyCallbacks.push(callback);
    };
    Game.prototype.stop = function () {
        if (this.activeStage && this.activeStage.running) {
            this.activeStage.stop();
        }
        this.running = false;
    };
    Object.defineProperty(Game.prototype, "displayErrors", {
        get: function () {
            return this._displayErrors;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "locale", {
        get: function () {
            return this._locale;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "width", {
        get: function () {
            return this.canvas.width;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "height", {
        get: function () {
            return this.canvas.height;
        },
        enumerable: false,
        configurable: true
    });
    Game.prototype.isInsideGame = function (x, y) {
        return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
    };
    Game.prototype.correctMouseX = function (mouseX) {
        return mouseX - this.styles.canvasRect.left;
    };
    Game.prototype.correctMouseY = function (mouseY) {
        return mouseY - this.styles.canvasRect.top;
    };
    Game.prototype.keyPressed = function (char) {
        return this.keyboard.keyPressed(char);
    };
    Game.prototype.keyDown = function (char, callback) {
        this.keyboard.keyDown(char, callback);
    };
    Game.prototype.keyUp = function (char, callback) {
        this.keyboard.keyUp(char, callback);
    };
    Game.prototype.mouseDown = function () {
        return this.mouse.isMouseDown(this.activeStage);
    };
    Game.prototype.mouseDownOnce = function () {
        var isMouseDown = this.mouse.isMouseDown(this.activeStage);
        this.mouse.clearMouseDown();
        return isMouseDown;
    };
    Game.prototype.getMousePoint = function () {
        return this.mouse.getPoint();
    };
    Game.prototype.getRandom = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    Game.prototype.throwError = function (messageId, variables) {
        if (variables === void 0) { variables = null; }
        var message = ErrorMessages.getMessage(messageId, this.locale, variables);
        this.throwErrorRaw(message);
    };
    Game.prototype.throwErrorRaw = function (message) {
        this.reportError(message);
        throw new Error(message);
    };
    Game.prototype.reportError = function (message) {
        if (this._displayErrors && !this.reportedError) {
            alert(message);
            this.reportedError = true;
        }
    };
    Game.prototype.addListeners = function () {
        var _this = this;
        this.eventEmitter.on(Game.STAGE_READY_EVENT, Game.STAGE_READY_EVENT, function (event) {
            _this.loadedStages++;
            _this.tryDoOnReady();
        });
    };
    Game.prototype.tryDoOnReady = function () {
        var e_2, _a;
        if (this.isReady() && this.onReadyPending) {
            this.onReadyPending = false;
            if (this.onReadyCallbacks.length) {
                try {
                    for (var _b = __values(this.onReadyCallbacks), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var callback = _c.value;
                        callback();
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                this.onReadyCallbacks = [];
            }
            this.tryDoRun();
        }
    };
    Game.prototype.tryDoRun = function () {
        if (this.pendingRun && !this.running && this.isReady()) {
            this.running = true;
            this.pendingRun = false;
            this.activeStage.run();
        }
    };
    Game.STAGE_READY_EVENT = 'scrubjs.stage.ready';
    Game.STAGE_BACKGROUND_READY_EVENT = 'scrubjs.stage.background_ready';
    Game.SPRITE_READY_EVENT = 'scrubjs.sprite.ready';
    Game.SPRITE_COSTUME_READY_EVENT = 'scrubjs.sprite.costume_ready';
    Game.SPRITE_SOUND_READY_EVENT = 'scrubjs.sprite.sound_ready';
    return Game;
}());
var KeyboardMap = (function () {
    function KeyboardMap() {
    }
    KeyboardMap.getChar = function (keyCode) {
        return KeyboardMap.map[keyCode];
    };
    KeyboardMap.map = [
        "",
        "",
        "",
        "CANCEL",
        "",
        "",
        "HELP",
        "",
        "BACK_SPACE",
        "TAB",
        "",
        "",
        "CLEAR",
        "ENTER",
        "ENTER_SPECIAL",
        "",
        "SHIFT",
        "CONTROL",
        "ALT",
        "PAUSE",
        "CAPS_LOCK",
        "KANA",
        "EISU",
        "JUNJA",
        "FINAL",
        "HANJA",
        "",
        "ESCAPE",
        "CONVERT",
        "NONCONVERT",
        "ACCEPT",
        "MODECHANGE",
        "SPACE",
        "PAGE_UP",
        "PAGE_DOWN",
        "END",
        "HOME",
        "LEFT",
        "UP",
        "RIGHT",
        "DOWN",
        "SELECT",
        "PRINT",
        "EXECUTE",
        "PRINTSCREEN",
        "INSERT",
        "DELETE",
        "",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "COLON",
        "SEMICOLON",
        "LESS_THAN",
        "EQUALS",
        "GREATER_THAN",
        "QUESTION_MARK",
        "AT",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        "OS_KEY",
        "",
        "CONTEXT_MENU",
        "",
        "SLEEP",
        "NUMPAD0",
        "NUMPAD1",
        "NUMPAD2",
        "NUMPAD3",
        "NUMPAD4",
        "NUMPAD5",
        "NUMPAD6",
        "NUMPAD7",
        "NUMPAD8",
        "NUMPAD9",
        "MULTIPLY",
        "ADD",
        "SEPARATOR",
        "SUBTRACT",
        "DECIMAL",
        "DIVIDE",
        "F1",
        "F2",
        "F3",
        "F4",
        "F5",
        "F6",
        "F7",
        "F8",
        "F9",
        "F10",
        "F11",
        "F12",
        "F13",
        "F14",
        "F15",
        "F16",
        "F17",
        "F18",
        "F19",
        "F20",
        "F21",
        "F22",
        "F23",
        "F24",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "NUM_LOCK",
        "SCROLL_LOCK",
        "WIN_OEM_FJ_JISHO",
        "WIN_OEM_FJ_MASSHOU",
        "WIN_OEM_FJ_TOUROKU",
        "WIN_OEM_FJ_LOYA",
        "WIN_OEM_FJ_ROYA",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "CIRCUMFLEX",
        "EXCLAMATION",
        "DOUBLE_QUOTE",
        "HASH",
        "DOLLAR",
        "PERCENT",
        "AMPERSAND",
        "UNDERSCORE",
        "OPEN_PAREN",
        "CLOSE_PAREN",
        "ASTERISK",
        "PLUS",
        "PIPE",
        "HYPHEN_MINUS",
        "OPEN_CURLY_BRACKET",
        "CLOSE_CURLY_BRACKET",
        "TILDE",
        "",
        "",
        "",
        "",
        "VOLUME_MUTE",
        "VOLUME_DOWN",
        "VOLUME_UP",
        "",
        "",
        "SEMICOLON",
        "EQUALS",
        "COMMA",
        "MINUS",
        "PERIOD",
        "SLASH",
        "BACK_QUOTE",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "OPEN_BRACKET",
        "BACK_SLASH",
        "CLOSE_BRACKET",
        "QUOTE",
        "",
        "META",
        "ALTGR",
        "",
        "WIN_ICO_HELP",
        "WIN_ICO_00",
        "",
        "WIN_ICO_CLEAR",
        "",
        "",
        "WIN_OEM_RESET",
        "WIN_OEM_JUMP",
        "WIN_OEM_PA1",
        "WIN_OEM_PA2",
        "WIN_OEM_PA3",
        "WIN_OEM_WSCTRL",
        "WIN_OEM_CUSEL",
        "WIN_OEM_ATTN",
        "WIN_OEM_FINISH",
        "WIN_OEM_COPY",
        "WIN_OEM_AUTO",
        "WIN_OEM_ENLW",
        "WIN_OEM_BACKTAB",
        "ATTN",
        "CRSEL",
        "EXSEL",
        "EREOF",
        "PLAY",
        "ZOOM",
        "",
        "PA1",
        "WIN_OEM_CLEAR",
        ""
    ];
    return KeyboardMap;
}());
var MultiplayerControl = (function () {
    function MultiplayerControl(player, game, connection, isMe) {
        var _this = this;
        this.trackedKeys = [];
        this.receiveDataConnections = [];
        this.userKeydownCallbacks = new Map();
        this.systemLockedChars = {};
        this.userLockedChars = {};
        this.systemMouseLocked = false;
        this.userMouseLocked = false;
        this.game = game;
        this.connection = connection;
        if (isMe) {
            this.defineListeners();
        }
        var keydownConnection = connection.connect(JetcodeSocket.RECEIVE_DATA, function (dataJson, parameters) {
            var data = JSON.parse(dataJson);
            var char = data['char'];
            if (!parameters.SendTime || parameters.Keydown != 'true' || parameters.MemberId != player.id || !_this.trackedKeys.includes(char)) {
                return;
            }
            if (_this.userKeydownCallbacks.has(char)) {
                var callback_1 = _this.userKeydownCallbacks.get(char)[0];
                var block_1 = function (isBlock, chars, mouse) {
                    var e_3, _a;
                    if (chars === void 0) { chars = [char]; }
                    if (mouse === void 0) { mouse = false; }
                    if (mouse) {
                        _this.userMouseLocked = isBlock;
                    }
                    try {
                        for (var chars_1 = __values(chars), chars_1_1 = chars_1.next(); !chars_1_1.done; chars_1_1 = chars_1.next()) {
                            var char_1 = chars_1_1.value;
                            _this.userLockedChars[char_1.toUpperCase()] = isBlock;
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (chars_1_1 && !chars_1_1.done && (_a = chars_1.return)) _a.call(chars_1);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                };
                var attempts_1 = 0;
                var handler_1 = function () {
                    if (_this.userLockedChars[char] !== true || attempts_1 > 999) {
                        var syncData = data['sync'];
                        if (syncData) {
                            game.syncObjects(syncData, _this.game.calcDeltaTime(parameters.SendTime));
                        }
                        callback_1(player, block_1);
                    }
                    else {
                        attempts_1++;
                        setTimeout(handler_1, 50);
                    }
                };
                handler_1();
            }
            _this.systemLockedChars[char] = false;
        });
        this.receiveDataConnections.push(keydownConnection);
        var mousedownConnection = connection.connect(JetcodeSocket.RECEIVE_DATA, function (dataJson, parameters) {
            if (!parameters.SendTime || parameters.Mousedown != 'true' || parameters.MemberId != player.id) {
                return;
            }
            if (_this.userMousedownCallback) {
                var callback_2 = _this.userMousedownCallback[0];
                var data = JSON.parse(dataJson);
                var mouseX_1 = data['mouseX'];
                var mouseY_1 = data['mouseY'];
                var syncData_1 = data['sync'];
                var block_2 = function (isBlock, chars, mouse) {
                    var e_4, _a;
                    if (chars === void 0) { chars = []; }
                    if (mouse === void 0) { mouse = true; }
                    if (mouse) {
                        _this.userMouseLocked = isBlock;
                    }
                    try {
                        for (var chars_2 = __values(chars), chars_2_1 = chars_2.next(); !chars_2_1.done; chars_2_1 = chars_2.next()) {
                            var char = chars_2_1.value;
                            _this.userLockedChars[char.toUpperCase()] = isBlock;
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (chars_2_1 && !chars_2_1.done && (_a = chars_2.return)) _a.call(chars_2);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                };
                var attempts_2 = 0;
                var handler_2 = function () {
                    if (_this.userMouseLocked !== true || attempts_2 > 999) {
                        if (syncData_1) {
                            game.syncObjects(syncData_1, _this.game.calcDeltaTime(parameters.SendTime));
                        }
                        var mousePoint = new Point(mouseX_1, mouseY_1);
                        callback_2(mousePoint, player, block_2);
                    }
                    else {
                        attempts_2++;
                        setTimeout(handler_2, 50);
                    }
                };
                handler_2();
            }
            _this.systemMouseLocked = false;
        });
        this.receiveDataConnections.push(mousedownConnection);
    }
    MultiplayerControl.prototype.defineListeners = function () {
        var _this = this;
        this.keydownCallback = function (event) {
            var char = KeyboardMap.getChar(event.keyCode);
            if (!_this.userKeydownCallbacks.has(char) ||
                _this.systemLockedChars[char] === true ||
                _this.userLockedChars[char] === true ||
                !_this.trackedKeys.includes(char)) {
                return;
            }
            _this.systemLockedChars[char] = true;
            var syncPackName = _this.userKeydownCallbacks.get(char)[1];
            var syncData = _this.userKeydownCallbacks.get(char)[2];
            var syncDataPacked = _this.game.packSyncData(syncPackName, syncData);
            _this.connection.sendData(JSON.stringify({
                'char': char,
                'sync': syncDataPacked
            }), {
                Keydown: 'true'
            });
        };
        this.mousedownCallback = function (event) {
            if (!_this.userMousedownCallback || _this.systemMouseLocked || _this.userMouseLocked) {
                return;
            }
            var mouseX = _this.game.correctMouseX(event.clientX);
            var mouseY = _this.game.correctMouseY(event.clientY);
            if (!_this.game.isInsideGame(mouseX, mouseY)) {
                return;
            }
            _this.systemMouseLocked = true;
            var syncPackName = _this.userMousedownCallback[1];
            var syncData = _this.userMousedownCallback[2];
            var syncDataPacked = _this.game.packSyncData(syncPackName, syncData);
            _this.connection.sendData(JSON.stringify({
                'mouseX': mouseX,
                'mouseY': mouseY,
                'sync': syncDataPacked
            }), {
                Mousedown: 'true'
            });
        };
        document.addEventListener('keydown', this.keydownCallback);
        document.addEventListener('mousedown', this.mousedownCallback);
    };
    MultiplayerControl.prototype.stop = function () {
        var e_5, _a;
        if (this.keydownCallback) {
            document.removeEventListener('keydown', this.keydownCallback);
        }
        try {
            for (var _b = __values(this.receiveDataConnections), _c = _b.next(); !_c.done; _c = _b.next()) {
                var connection = _c.value;
                this.connection.disconnect(JetcodeSocket.RECEIVE_DATA, connection);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    MultiplayerControl.prototype.keyDown = function (char, callback, syncPackName, syncData) {
        if (syncData === void 0) { syncData = []; }
        char = char.toUpperCase();
        if (!this.trackedKeys.includes(char)) {
            this.trackedKeys.push(char);
        }
        this.userKeydownCallbacks.set(char, [callback, syncPackName, syncData]);
    };
    MultiplayerControl.prototype.removeKeyDownHandler = function (char) {
        char = char.toUpperCase();
        this.userKeydownCallbacks.delete(char);
    };
    MultiplayerControl.prototype.mouseDown = function (callback, syncPackName, syncData) {
        if (syncData === void 0) { syncData = []; }
        this.userMousedownCallback = [callback, syncPackName, syncData];
    };
    MultiplayerControl.prototype.removeMouseDownHandler = function () {
        this.userMousedownCallback = null;
    };
    return MultiplayerControl;
}());
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var Sprite = (function () {
    function Sprite(stage, layer, costumePaths, soundPaths) {
        var e_6, _a, e_7, _b;
        if (stage === void 0) { stage = null; }
        if (layer === void 0) { layer = 1; }
        if (costumePaths === void 0) { costumePaths = []; }
        if (soundPaths === void 0) { soundPaths = []; }
        this.name = 'No name';
        this.rotateStyle = 'normal';
        this.singleBody = true;
        this.game = null;
        this.body = null;
        this.costumeIndex = null;
        this.costume = null;
        this.stage = null;
        this.costumes = [];
        this.costumeNames = [];
        this.sounds = [];
        this.soundNames = [];
        this.phrase = null;
        this.phraseLiveTime = null;
        this._x = 0;
        this._y = 0;
        this._direction = 0;
        this._size = 100;
        this._hidden = false;
        this._deleted = false;
        this._stopped = true;
        this.loadedCostumes = 0;
        this.loadedSounds = 0;
        this.onReadyCallbacks = [];
        this.onReadyPending = true;
        this.scheduledCallbacks = [];
        if (!Registry.getInstance().has('game')) {
            throw new Error('You need create Game instance before Stage instance.');
        }
        this.game = Registry.getInstance().get('game');
        var sprite = this;
        if (this.game.displayErrors) {
            sprite = this.game.validatorFactory.createValidator(this, 'Sprite');
        }
        sprite.id = Symbol();
        sprite.eventEmitter = new EventEmitter();
        sprite.collisionResult = new CollisionResult();
        sprite.stage = stage;
        if (!this.stage) {
            sprite.stage = this.game.getLastStage();
        }
        if (!sprite.stage) {
            sprite.game.throwError(ErrorMessages.NEED_CREATE_STAGE_BEFORE_SPRITE);
        }
        sprite._layer = layer;
        sprite._x = sprite.game.width / 2;
        sprite._y = sprite.game.height / 2;
        try {
            for (var costumePaths_1 = __values(costumePaths), costumePaths_1_1 = costumePaths_1.next(); !costumePaths_1_1.done; costumePaths_1_1 = costumePaths_1.next()) {
                var costumePath = costumePaths_1_1.value;
                sprite.addCostume(costumePath);
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (costumePaths_1_1 && !costumePaths_1_1.done && (_a = costumePaths_1.return)) _a.call(costumePaths_1);
            }
            finally { if (e_6) throw e_6.error; }
        }
        try {
            for (var soundPaths_1 = __values(soundPaths), soundPaths_1_1 = soundPaths_1.next(); !soundPaths_1_1.done; soundPaths_1_1 = soundPaths_1.next()) {
                var soundPath = soundPaths_1_1.value;
                sprite.addSound(soundPath);
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (soundPaths_1_1 && !soundPaths_1_1.done && (_b = soundPaths_1.return)) _b.call(soundPaths_1);
            }
            finally { if (e_7) throw e_7.error; }
        }
        sprite.scheduledCallbackExecutor = new ScheduledCallbackExecutor(sprite);
        sprite.stage.addSprite(sprite);
        sprite.addListeners();
        return sprite;
    }
    Sprite.prototype.isReady = function () {
        return this.loadedCostumes == this.costumes.length && this.loadedSounds == this.sounds.length;
    };
    Sprite.prototype.onReady = function (callback) {
        this.onReadyCallbacks.push(callback);
    };
    Sprite.prototype.addCostume = function (costumePath, name, x, y, width, height, paddingTop, paddingRight, paddingBottom, paddingLeft) {
        var _this = this;
        if (name === void 0) { name = null; }
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (width === void 0) { width = null; }
        if (height === void 0) { height = null; }
        if (paddingTop === void 0) { paddingTop = 0; }
        if (paddingRight === void 0) { paddingRight = 0; }
        if (paddingBottom === void 0) { paddingBottom = 0; }
        if (paddingLeft === void 0) { paddingLeft = 0; }
        var costume = new Costume();
        if (!name) {
            var costumeIndex = this.costumes.length;
            name = 'No name ' + costumeIndex;
        }
        this.costumes.push(costume);
        this.costumeNames.push(name);
        var image = new Image();
        image.src = costumePath;
        var onLoadImage = function () {
            if (_this.deleted) {
                return;
            }
            _this.addCostumeByImage(costume, image, x, y, width, height, paddingTop, paddingRight, paddingBottom, paddingLeft);
            image.removeEventListener('load', onLoadImage);
        };
        image.addEventListener('load', onLoadImage);
        image.addEventListener('error', function () {
            _this.game.throwError(ErrorMessages.COSTUME_NOT_LOADED, { costumePath: costumePath });
        });
    };
    Sprite.prototype.cloneCostume = function (costume, name) {
        costume.body = null;
        this.costumes.push(costume);
        this.costumeNames.push(name);
        this.addCostumeByImage(costume, costume.image, costume.x, costume.y, costume.width, costume.height);
    };
    Sprite.prototype.addCostumeByImage = function (costume, image, x, y, width, height, paddingTop, paddingRight, paddingBottom, paddingLeft) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (width === void 0) { width = null; }
        if (height === void 0) { height = null; }
        if (paddingTop === void 0) { paddingTop = 0; }
        if (paddingRight === void 0) { paddingRight = 0; }
        if (paddingBottom === void 0) { paddingBottom = 0; }
        if (paddingLeft === void 0) { paddingLeft = 0; }
        if (width === null) {
            width = image.naturalWidth;
        }
        if (height === null) {
            height = image.naturalHeight;
        }
        costume.image = image;
        costume.x = x;
        costume.y = y;
        costume.width = width;
        costume.height = height;
        costume.body = new Polygon(this.x, this.y, [
            [(costume.width / 2) * -1 + paddingLeft * -1, (costume.height / 2) * -1 + paddingTop * -1],
            [costume.width / 2 + paddingRight, (costume.height / 2) * -1 + paddingTop * -1],
            [costume.width / 2 + paddingRight, costume.height / 2 + paddingBottom],
            [(costume.width / 2) * -1 + paddingLeft * -1, costume.height / 2 + paddingBottom]
        ]);
        costume.ready = true;
        this.eventEmitter.emit(Game.SPRITE_COSTUME_READY_EVENT, {
            costume: costume,
            spriteId: this.id
        });
    };
    Sprite.prototype.addCostumes = function (costumePath, name, cols, rows, limit, offset, paddingTop, paddingRight, paddingBottom, paddingLeft) {
        var _this = this;
        if (name === void 0) { name = null; }
        if (rows === void 0) { rows = 1; }
        if (limit === void 0) { limit = null; }
        if (offset === void 0) { offset = null; }
        if (paddingTop === void 0) { paddingTop = 0; }
        if (paddingRight === void 0) { paddingRight = 0; }
        if (paddingBottom === void 0) { paddingBottom = 0; }
        if (paddingLeft === void 0) { paddingLeft = 0; }
        var image = new Image();
        image.src = costumePath;
        if (!name) {
            name = 'No name';
        }
        var onLoadImage = function () {
            image.naturalWidth;
            image.naturalHeight;
            var chunkWidth = image.naturalWidth / cols;
            var chunkHeight = image.naturalHeight / rows;
            var skip = false;
            var costumeIndex = 0;
            var x = 0;
            var y = 0;
            for (var i = 0; i < rows; i++) {
                for (var t = 0; t < cols; t++) {
                    skip = false;
                    if (offset !== null) {
                        if (offset > 0) {
                            offset--;
                            skip = true;
                        }
                    }
                    if (!skip) {
                        if (limit !== null) {
                            if (limit == 0) {
                                break;
                            }
                            if (limit > 0) {
                                limit--;
                            }
                        }
                        var costume = new Costume();
                        var costumeName = name;
                        if (costumeName !== null) {
                            costumeName += ' ' + costumeIndex;
                        }
                        _this.costumes.push(costume);
                        _this.costumeNames.push(name);
                        _this.addCostumeByImage(costume, image, x, y, chunkWidth, chunkHeight, paddingTop, paddingRight, paddingBottom, paddingLeft);
                        costumeIndex++;
                    }
                    x += chunkWidth;
                }
                x = 0;
                y += chunkHeight;
            }
            image.removeEventListener('load', onLoadImage);
        };
        image.addEventListener('load', onLoadImage);
    };
    Sprite.prototype.switchCostume = function (costumeIndex) {
        if (this.deleted) {
            return;
        }
        var costume = this.costumes[costumeIndex];
        if (costume instanceof Costume && costume.ready) {
            this.costumeIndex = costumeIndex;
            this.costume = costume;
            if (!(this.body instanceof Polygon)) {
                this.createBody(costume);
            }
        }
    };
    Sprite.prototype.switchCostumeByName = function (costumeName) {
        var costumeIndex = this.costumeNames.indexOf(costumeName);
        if (costumeIndex > -1) {
            this.switchCostume(costumeIndex);
        }
        else {
            this.game.throwError(ErrorMessages.COSTUME_NAME_NOT_FOUND, { costumeName: costumeName });
        }
    };
    Sprite.prototype.nextCostume = function () {
        if (this.deleted) {
            return;
        }
        var nextCostume = this.costumeIndex + 1;
        if (nextCostume > this.costumes.length - 1) {
            nextCostume = 0;
        }
        this.switchCostume(nextCostume);
    };
    Sprite.prototype.addSound = function (soundPath, name) {
        var _this = this;
        if (name === void 0) { name = null; }
        if (!name) {
            name = 'No name ' + this.sounds.length;
        }
        var sound = new Audio();
        sound.src = soundPath;
        this.sounds.push(sound);
        this.soundNames.push(name);
        sound.load();
        var onLoadSound = function () {
            _this.eventEmitter.emit(Game.SPRITE_SOUND_READY_EVENT, {
                sound: sound,
                spriteId: _this.id
            });
            sound.removeEventListener('loadedmetadata', onLoadSound);
        };
        sound.addEventListener('loadedmetadata', onLoadSound);
    };
    Sprite.prototype.cloneSound = function (sound, name) {
        this.sounds.push(sound);
        this.soundNames.push(name);
        this.eventEmitter.emit(Game.SPRITE_SOUND_READY_EVENT, {
            sound: sound,
            spriteId: this.id
        });
    };
    Sprite.prototype.playSound = function (soundIndex, volume, currentTime) {
        if (volume === void 0) { volume = null; }
        if (currentTime === void 0) { currentTime = null; }
        var sound = this.sounds[soundIndex];
        if (sound instanceof Audio) {
            sound.play();
            if (volume !== null) {
                sound.volume = volume;
            }
            if (currentTime !== null) {
                sound.currentTime = currentTime;
            }
        }
        else {
            this.game.throwError(ErrorMessages.SOUND_INDEX_NOT_FOUND, { soundIndex: soundIndex });
        }
    };
    Sprite.prototype.pauseSound = function (soundIndex) {
        var sound = this.sounds[soundIndex];
        if (sound instanceof Audio) {
            sound.pause();
        }
        else {
            this.game.throwError(ErrorMessages.SOUND_INDEX_NOT_FOUND, { soundIndex: soundIndex });
        }
    };
    Sprite.prototype.playSoundByName = function (soundName, volume, currentTime) {
        if (volume === void 0) { volume = null; }
        if (currentTime === void 0) { currentTime = null; }
        var soundIndex = this.soundNames.indexOf(soundName);
        if (soundIndex > -1) {
            this.playSound(soundIndex, volume, currentTime);
        }
        else {
            this.game.throwError(ErrorMessages.SOUND_NAME_NOT_FOUND, { soundName: soundName });
        }
    };
    Sprite.prototype.pauseSoundByName = function (soundName) {
        var soundIndex = this.soundNames.indexOf(soundName);
        if (soundIndex > -1) {
            this.pauseSound(soundIndex);
        }
        else {
            this.game.throwError(ErrorMessages.SOUND_NAME_NOT_FOUND, { soundName: soundName });
        }
    };
    Sprite.prototype.move = function (steps) {
        this.x += (steps * Math.sin(this.direction * Math.PI / 180));
        this.y -= (steps * Math.cos(this.direction * Math.PI / 180));
    };
    Sprite.prototype.bounceOnEdge = function () {
        if (this.touchTopEdge() || this.touchBottomEdge()) {
            this.direction = 180 - this.direction;
        }
        if (this.touchLeftEdge() || this.touchRightEdge()) {
            this.direction *= -1;
        }
    };
    Sprite.prototype.touchSprite = function (sprite) {
        if (sprite.hidden ||
            this.hidden ||
            sprite.stopped ||
            this.stopped ||
            sprite.deleted ||
            this.deleted ||
            !(sprite.getBody() instanceof Body) ||
            !(this.body instanceof Body)) {
            return false;
        }
        return this.body.collides(sprite.getBody(), this.collisionResult);
    };
    Sprite.prototype.touchSprites = function (sprites) {
        var e_8, _a;
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }
        try {
            for (var sprites_1 = __values(sprites), sprites_1_1 = sprites_1.next(); !sprites_1_1.done; sprites_1_1 = sprites_1.next()) {
                var sprite = sprites_1_1.value;
                if (this.touchSprite(sprite)) {
                    return true;
                }
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (sprites_1_1 && !sprites_1_1.done && (_a = sprites_1.return)) _a.call(sprites_1);
            }
            finally { if (e_8) throw e_8.error; }
        }
        return false;
    };
    Sprite.prototype.touchPotentialSprites = function (sprites) {
        var e_9, _a, e_10, _b;
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }
        var potentials = this.body.potentials();
        if (!potentials.length) {
            return false;
        }
        var potentialSprites = [];
        try {
            for (var sprites_2 = __values(sprites), sprites_2_1 = sprites_2.next(); !sprites_2_1.done; sprites_2_1 = sprites_2.next()) {
                var sprite = sprites_2_1.value;
                if (potentials.indexOf(sprite.getBody()) > -1) {
                    potentialSprites.push(sprite);
                }
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (sprites_2_1 && !sprites_2_1.done && (_a = sprites_2.return)) _a.call(sprites_2);
            }
            finally { if (e_9) throw e_9.error; }
        }
        try {
            for (var potentialSprites_1 = __values(potentialSprites), potentialSprites_1_1 = potentialSprites_1.next(); !potentialSprites_1_1.done; potentialSprites_1_1 = potentialSprites_1.next()) {
                var potentialSprite = potentialSprites_1_1.value;
                if (this.touchSprite(potentialSprite)) {
                    return true;
                }
            }
        }
        catch (e_10_1) { e_10 = { error: e_10_1 }; }
        finally {
            try {
                if (potentialSprites_1_1 && !potentialSprites_1_1.done && (_b = potentialSprites_1.return)) _b.call(potentialSprites_1);
            }
            finally { if (e_10) throw e_10.error; }
        }
        return false;
    };
    Sprite.prototype.touchEdge = function () {
        var result = this.getPureCollisionResult();
        var gameWidth = this.game.width;
        var gameHeight = this.game.height;
        if (this.topY < 0) {
            result.collision = true;
            result.overlap = -this.topY;
            result.overlap_y = -1;
            return true;
        }
        if (this.bottomY > gameHeight) {
            result.collision = true;
            result.overlap = this.bottomY - gameHeight;
            result.overlap_y = 1;
            return true;
        }
        if (this.leftX < 0) {
            result.collision = true;
            result.overlap = -this.leftX;
            result.overlap_x = -1;
            return true;
        }
        if (this.rightX > gameWidth) {
            result.collision = true;
            result.overlap = this.rightX - gameWidth;
            result.overlap_x = 1;
            return true;
        }
        return false;
    };
    Sprite.prototype.touchTopEdge = function () {
        this.clearCollisionResult();
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }
        if (this.topY < 0) {
            this.collisionResult.collision = true;
            this.collisionResult.overlap = -this.topY;
            this.collisionResult.overlap_y = -1;
            return true;
        }
        return false;
    };
    Sprite.prototype.touchBottomEdge = function () {
        this.clearCollisionResult();
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }
        if (this.bottomY > this.game.height) {
            this.collisionResult.collision = true;
            this.collisionResult.overlap = this.bottomY - this.game.height;
            this.collisionResult.overlap_y = 1;
            return true;
        }
        return false;
    };
    Sprite.prototype.touchLeftEdge = function () {
        this.clearCollisionResult();
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }
        if (this.leftX < 0) {
            this.collisionResult.collision = true;
            this.collisionResult.overlap = -this.leftX;
            this.collisionResult.overlap_x = -1;
            return true;
        }
        return false;
    };
    Sprite.prototype.touchRightEdge = function () {
        this.clearCollisionResult();
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }
        if (this.rightX > this.game.width) {
            this.collisionResult.collision = true;
            this.collisionResult.overlap = this.rightX - this.game.width;
            this.collisionResult.overlap_x = 1;
            return true;
        }
        return false;
    };
    Object.defineProperty(Sprite.prototype, "overlap", {
        get: function () {
            if (!this.collisionResult.collision) {
                return 0;
            }
            return this.collisionResult.overlap;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "overlapX", {
        get: function () {
            if (!this.collisionResult.collision) {
                return 0;
            }
            return this.collisionResult.overlap_x * this.collisionResult.overlap;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "overlapY", {
        get: function () {
            if (!this.collisionResult.collision) {
                return 0;
            }
            return this.collisionResult.overlap_y * this.collisionResult.overlap;
        },
        enumerable: false,
        configurable: true
    });
    Sprite.prototype.clearCollisionResult = function () {
        this.collisionResult.collision = false;
        this.collisionResult.a = null;
        this.collisionResult.b = null;
        this.collisionResult.a_in_b = false;
        this.collisionResult.b_in_a = false;
        this.collisionResult.overlap = 0;
        this.collisionResult.overlap_x = 0;
        this.collisionResult.overlap_y = 0;
    };
    Sprite.prototype.getPureCollisionResult = function () {
        this.clearCollisionResult();
        return this.collisionResult;
    };
    Sprite.prototype.touchMouse = function () {
        return this.touchMousePoint(this.game.getMousePoint());
    };
    Sprite.prototype.touchMousePoint = function (mousePoint) {
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }
        return this.body.collides(mousePoint, this.collisionResult);
    };
    Sprite.prototype.pointForward = function (sprite) {
        this.direction = (Math.atan2(this.y - sprite.y, this.x - sprite.x) / Math.PI * 180) - 90;
    };
    Sprite.prototype.getDistanceToSprite = function (sprite) {
        return Math.sqrt((Math.abs(this.x - sprite.x)) + (Math.abs(this.y - sprite.y)));
    };
    Sprite.prototype.getDistanceToMouse = function (mouse) {
        return Math.sqrt((Math.abs(this.x - mouse.x)) + (Math.abs(this.y - mouse.y)));
    };
    Sprite.prototype.say = function (text, time) {
        if (time === void 0) { time = null; }
        this.phrase = this.name + ': ' + text;
        this.phraseLiveTime = null;
        if (time) {
            var currentTime = (new Date()).getTime();
            this.phraseLiveTime = currentTime + time;
        }
    };
    Sprite.prototype.getPhrase = function () {
        if (this.phrase) {
            if (this.phraseLiveTime === null) {
                return this.phrase;
            }
            var currentTime = (new Date()).getTime();
            if (this.phraseLiveTime > currentTime) {
                return this.phrase;
            }
            else {
                this.phrase = null;
                this.phraseLiveTime = null;
            }
        }
        return null;
    };
    Sprite.prototype.createClone = function (stage) {
        var e_11, _a, e_12, _b;
        if (stage === void 0) { stage = null; }
        if (!this.isReady()) {
            this.game.throwError(ErrorMessages.CLONED_NOT_READY);
        }
        if (!stage) {
            stage = this.stage;
        }
        var clone = new Sprite(stage, this.layer);
        clone.name = this.name;
        clone.rotateStyle = this.rotateStyle;
        clone.singleBody = this.singleBody;
        clone.x = this.x;
        clone.y = this.y;
        clone.direction = this.direction;
        clone.size = this.size;
        clone.hidden = this.hidden;
        clone._deleted = this.deleted;
        clone._stopped = this.stopped;
        try {
            for (var _c = __values(this.costumes), _d = _c.next(); !_d.done; _d = _c.next()) {
                var costume = _d.value;
                clone.cloneCostume(costume, this.getCostumeName());
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_11) throw e_11.error; }
        }
        clone.switchCostume(this.costumeIndex);
        try {
            for (var _e = __values(this.sounds.entries()), _f = _e.next(); !_f.done; _f = _e.next()) {
                var _g = __read(_f.value, 2), soundIndex = _g[0], sound = _g[1];
                clone.cloneSound(sound, this.soundNames[soundIndex]);
            }
        }
        catch (e_12_1) { e_12 = { error: e_12_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_12) throw e_12.error; }
        }
        return clone;
    };
    Sprite.prototype.timeout = function (callback, timeout) {
        this.repeat(callback, 1, null, timeout, undefined);
    };
    Sprite.prototype.repeat = function (callback, repeat, interval, timeout, finishCallback) {
        if (interval === void 0) { interval = null; }
        if (timeout === void 0) { timeout = null; }
        var state = new ScheduledState(interval, repeat, 0);
        if (timeout) {
            timeout = Date.now() + timeout;
        }
        this.scheduledCallbacks.push(new ScheduledCallbackItem(callback, state, timeout, finishCallback));
    };
    Sprite.prototype.forever = function (callback, interval, timeout, finishCallback) {
        if (interval === void 0) { interval = null; }
        if (timeout === void 0) { timeout = null; }
        var state = new ScheduledState(interval);
        if (timeout) {
            timeout = Date.now() + timeout;
        }
        this.scheduledCallbacks.push(new ScheduledCallbackItem(callback, state, timeout, finishCallback));
    };
    Sprite.prototype.update = function (diffTime) {
        if (this.deleted) {
            return;
        }
        this.scheduledCallbacks = this.scheduledCallbacks.filter(this.scheduledCallbackExecutor.execute(Date.now(), diffTime));
    };
    Sprite.prototype.delete = function () {
        if (this.deleted) {
            return;
        }
        this.stage.removeSprite(this, this.layer);
        this.eventEmitter.clearAll();
        this.removeBody();
        this.scheduledCallbackExecutor = null;
        var props = Object.keys(this);
        for (var i = 0; i < props.length; i++) {
            delete this[props[i]];
        }
        this.costumes = [];
        this.costumeNames = [];
        this.sounds = [];
        this.soundNames = [];
        this.onReadyCallbacks = [];
        this.scheduledCallbacks = [];
        this._deleted = true;
    };
    Sprite.prototype.run = function () {
        this._stopped = false;
    };
    Sprite.prototype.stop = function () {
        this._stopped = true;
    };
    Sprite.prototype.getBody = function () {
        return this.body;
    };
    Sprite.prototype.getCostume = function () {
        return this.costume;
    };
    Sprite.prototype.getCostumeName = function () {
        return this.costumeNames[this.costumeIndex];
    };
    Object.defineProperty(Sprite.prototype, "direction", {
        get: function () {
            return this._direction;
        },
        set: function (direction) {
            if ((direction * 0) !== 0) {
                return;
            }
            direction = direction % 360;
            if (direction < 0) {
                direction += 360;
            }
            this._direction = (direction > 360) ? direction - 360 : direction;
            if (this.body instanceof Polygon) {
                if (this.rotateStyle == 'leftRight') {
                    this.body.angle = 0;
                }
                else {
                    this.body.angle = this._direction * 3.14 / 180;
                }
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "width", {
        get: function () {
            if (this.costume) {
                return this.costume.width * this.size / 100;
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "height", {
        get: function () {
            if (this.costume) {
                return this.costume.height * this.size / 100;
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "x", {
        get: function () {
            return this._x;
        },
        set: function (value) {
            this._x = value;
            if (this.body instanceof Polygon) {
                this.body.x = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "y", {
        get: function () {
            return this._y;
        },
        set: function (value) {
            this._y = value;
            if (this.body instanceof Polygon) {
                this.body.y = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "realX", {
        get: function () {
            return this.x - this.width / 2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "realY", {
        get: function () {
            return this.y - this.height / 2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "rightX", {
        get: function () {
            return this.x + this.width / 2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "leftX", {
        get: function () {
            return this.x - this.width / 2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "topY", {
        get: function () {
            return this.y - this.height / 2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "bottomY", {
        get: function () {
            return this.y + this.height / 2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "size", {
        get: function () {
            return this._size;
        },
        set: function (value) {
            this._size = value;
            if (this.body) {
                this.body.scale_x = this._size / 100;
                this.body.scale_y = this._size / 100;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "hidden", {
        get: function () {
            return this._hidden;
        },
        set: function (value) {
            this._hidden = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "deleted", {
        get: function () {
            return this._deleted;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "stopped", {
        get: function () {
            return this._stopped;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "layer", {
        get: function () {
            return this._layer;
        },
        set: function (value) {
            this.stage.removeSprite(this, this._layer);
            this._layer = value;
            this.stage.addSprite(this, value);
        },
        enumerable: false,
        configurable: true
    });
    Sprite.prototype.addListeners = function () {
        var _this = this;
        this.eventEmitter.on(Game.SPRITE_COSTUME_READY_EVENT, Game.SPRITE_COSTUME_READY_EVENT, function (event) {
            if (_this.id == event.detail.spriteId) {
                _this.loadedCostumes++;
                _this.tryDoOnReady();
                if (_this.loadedCostumes == _this.costumes.length && _this.costume === null) {
                    _this.switchCostume(0);
                }
            }
        });
        this.eventEmitter.on(Game.SPRITE_SOUND_READY_EVENT, Game.SPRITE_SOUND_READY_EVENT, function (event) {
            if (_this.id == event.detail.spriteId) {
                _this.loadedSounds++;
                _this.tryDoOnReady();
            }
        });
    };
    Sprite.prototype.tryDoOnReady = function () {
        var e_13, _a;
        if (this.isReady() && this.onReadyPending) {
            this.onReadyPending = false;
            if (this.onReadyCallbacks.length) {
                try {
                    for (var _b = __values(this.onReadyCallbacks), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var callback = _c.value;
                        callback();
                    }
                }
                catch (e_13_1) { e_13 = { error: e_13_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_13) throw e_13.error; }
                }
                this.onReadyCallbacks = [];
            }
            this.stage.eventEmitter.emit(Game.SPRITE_READY_EVENT, {
                sprite: this,
                stageId: this.stage.id
            });
        }
    };
    Sprite.prototype.removeBody = function () {
        if (this.body instanceof Polygon) {
            this.stage.collisionSystem.remove(this.body);
            this.body = null;
        }
    };
    Sprite.prototype.createBody = function (costume) {
        this.body = costume.body;
        this.body.scale_x = this.size / 100;
        this.body.scale_y = this.size / 100;
        this.stage.collisionSystem.insert(this.body);
    };
    return Sprite;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var MultiplayerGame = (function (_super) {
    __extends(MultiplayerGame, _super);
    function MultiplayerGame(socketUrl, gameToken, width, height, canvasId, displayErrors, locale, lobbyId, autoSyncGame, multiplayerOptions) {
        if (canvasId === void 0) { canvasId = null; }
        if (displayErrors === void 0) { displayErrors = true; }
        if (locale === void 0) { locale = 'ru'; }
        if (lobbyId === void 0) { lobbyId = 0; }
        if (autoSyncGame === void 0) { autoSyncGame = 0; }
        if (multiplayerOptions === void 0) { multiplayerOptions = {}; }
        var _this = _super.call(this, width, height, canvasId, displayErrors, locale) || this;
        _this.autoSyncGameTimeout = 0;
        _this.players = [];
        _this.sharedObjects = [];
        _this.autoSyncGameTimeout = autoSyncGame;
        _this.initializeConnection(socketUrl, gameToken, lobbyId, multiplayerOptions);
        return _this;
    }
    MultiplayerGame.prototype.send = function (userData, parameters, syncPackName, syncData) {
        if (parameters === void 0) { parameters = {}; }
        if (syncData === void 0) { syncData = []; }
        if (!this.connection) {
            throw new Error('Connection to the server is not established.');
        }
        var data = {
            'data': userData,
            'sync': this.packSyncData(syncPackName, syncData)
        };
        this.connection.sendData(JSON.stringify(data), parameters);
    };
    MultiplayerGame.prototype.sync = function (syncPackName, syncData, parameters) {
        if (syncData === void 0) { syncData = []; }
        if (parameters === void 0) { parameters = {}; }
        if (!syncData.length) {
            return;
        }
        parameters.SyncGame = 'true';
        var data = this.packSyncData(syncPackName, syncData);
        this.sendData(JSON.stringify(data), parameters);
    };
    MultiplayerGame.prototype.syncGame = function () {
        var syncObjects = this.getSyncObjects();
        var syncData = this.packSyncData('game', syncObjects);
        this.sendData(JSON.stringify(syncData), {
            SyncGame: "true"
        });
    };
    MultiplayerGame.prototype.onConnection = function (callback) {
        this.onConnectionCallback = callback;
    };
    MultiplayerGame.prototype.removeConnectionHandler = function (callback) {
        this.onConnectionCallback = null;
    };
    MultiplayerGame.prototype.onReceive = function (callback) {
        this.onReceiveCallback = callback;
    };
    MultiplayerGame.prototype.removeReceiveHandler = function (callback) {
        this.onReceiveCallback = null;
    };
    MultiplayerGame.prototype.onMemberJoined = function (callback) {
        this.onMemberJoinedCallback = callback;
    };
    MultiplayerGame.prototype.removeMemberJoinedHandler = function (callback) {
        this.onMemberJoinedCallback = null;
    };
    MultiplayerGame.prototype.onMemberLeft = function (callback) {
        this.onMemberLeftCallback = callback;
    };
    MultiplayerGame.prototype.removeMemberLeftHandler = function (callback) {
        this.onMemberLeftCallback = null;
    };
    MultiplayerGame.prototype.onGameStarted = function (callback) {
        this.onGameStartedCallback = callback;
    };
    MultiplayerGame.prototype.removeGameStartedHandler = function (callback) {
        this.onGameStartedCallback = null;
    };
    MultiplayerGame.prototype.onGameStopped = function (callback) {
        this.onGameStoppedCallback = callback;
    };
    MultiplayerGame.prototype.removeGameStoppedHandler = function (callback) {
        this.onGameStoppedCallback = null;
    };
    MultiplayerGame.prototype.onMultiplayerError = function (callback) {
        this.onMultiplayerErrorCallback = callback;
    };
    MultiplayerGame.prototype.removeMultiplayerErrorHandler = function (callback) {
        this.onMultiplayerErrorCallback = null;
    };
    MultiplayerGame.prototype.run = function () {
        _super.prototype.run.call(this);
        if (this.isHost && this.autoSyncGameTimeout) {
            this.autoSyncGame(this.autoSyncGameTimeout);
        }
    };
    MultiplayerGame.prototype.stop = function () {
        var e_14, _a;
        _super.prototype.stop.call(this);
        try {
            for (var _b = __values(this.players), _c = _b.next(); !_c.done; _c = _b.next()) {
                var player = _c.value;
                player.delete();
            }
        }
        catch (e_14_1) { e_14 = { error: e_14_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_14) throw e_14.error; }
        }
        this.players = [];
    };
    MultiplayerGame.prototype.getPlayers = function () {
        return this.players;
    };
    MultiplayerGame.prototype.addSharedObject = function (sharedObject) {
        this.sharedObjects.push(sharedObject);
    };
    MultiplayerGame.prototype.removeSharedObject = function (sharedObject) {
        var index = this.sharedObjects.indexOf(sharedObject);
        if (index > -1) {
            this.sharedObjects.splice(index, 1);
        }
    };
    MultiplayerGame.prototype.getSharedObjects = function () {
        return this.sharedObjects;
    };
    MultiplayerGame.prototype.getMultiplayerSprites = function () {
        if (!this.getActiveStage()) {
            return [];
        }
        return this.getActiveStage().getSprites().filter(function (sprite) {
            return sprite instanceof MultiplayerSprite;
        });
    };
    MultiplayerGame.prototype.getSyncObjects = function () {
        var multiplayerSprites = this.getMultiplayerSprites();
        var players = this.getPlayers();
        var sharedObjects = this.getSharedObjects();
        return __spreadArray(__spreadArray(__spreadArray([], __read(multiplayerSprites), false), __read(players), false), __read(sharedObjects), false);
    };
    MultiplayerGame.prototype.syncObjects = function (syncData, deltaTime) {
        var e_15, _a, e_16, _b;
        var gameAllSyncObjects = this.getSyncObjects();
        try {
            for (var _c = __values(Object.entries(syncData)), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), syncPackName = _e[0], syncObjectsData = _e[1];
                try {
                    for (var gameAllSyncObjects_1 = (e_16 = void 0, __values(gameAllSyncObjects)), gameAllSyncObjects_1_1 = gameAllSyncObjects_1.next(); !gameAllSyncObjects_1_1.done; gameAllSyncObjects_1_1 = gameAllSyncObjects_1.next()) {
                        var syncObject = gameAllSyncObjects_1_1.value;
                        if (syncObjectsData[syncObject.getMultiplayerName()]) {
                            var syncPackData = syncObjectsData[syncObject.getMultiplayerName()];
                            syncObject.setSyncData(syncPackName, syncPackData, deltaTime);
                        }
                    }
                }
                catch (e_16_1) { e_16 = { error: e_16_1 }; }
                finally {
                    try {
                        if (gameAllSyncObjects_1_1 && !gameAllSyncObjects_1_1.done && (_b = gameAllSyncObjects_1.return)) _b.call(gameAllSyncObjects_1);
                    }
                    finally { if (e_16) throw e_16.error; }
                }
            }
        }
        catch (e_15_1) { e_15 = { error: e_15_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_15) throw e_15.error; }
        }
    };
    MultiplayerGame.prototype.packSyncData = function (packName, syncObjects) {
        var e_17, _a;
        var syncObjectsData = {};
        try {
            for (var syncObjects_1 = __values(syncObjects), syncObjects_1_1 = syncObjects_1.next(); !syncObjects_1_1.done; syncObjects_1_1 = syncObjects_1.next()) {
                var syncObject = syncObjects_1_1.value;
                syncObjectsData[syncObject.getMultiplayerName()] = syncObject.getSyncData();
                syncObjectsData[syncObject.getMultiplayerName()]['syncId'] = syncObject.increaseSyncId();
            }
        }
        catch (e_17_1) { e_17 = { error: e_17_1 }; }
        finally {
            try {
                if (syncObjects_1_1 && !syncObjects_1_1.done && (_a = syncObjects_1.return)) _a.call(syncObjects_1);
            }
            finally { if (e_17) throw e_17.error; }
        }
        var result = {};
        result[packName] = syncObjectsData;
        return result;
    };
    MultiplayerGame.prototype.sendData = function (data, parameters) {
        if (parameters === void 0) { parameters = {}; }
        if (!this.connection) {
            throw new Error('Connection to the server is not established.');
        }
        this.connection.sendData(data, parameters);
    };
    MultiplayerGame.prototype.calcDeltaTime = function (sendTime) {
        return Date.now() - sendTime - this.connection.deltaTime;
    };
    MultiplayerGame.prototype.extrapolate = function (callback, deltaTime, timeout) {
        var times = Math.round((deltaTime / timeout) * 0.75);
        for (var i = 0; i < times; i++) {
            callback();
        }
    };
    MultiplayerGame.prototype.initializeConnection = function (socketUrl_1, gameToken_1, lobbyId_1) {
        return __awaiter(this, arguments, void 0, function (socketUrl, gameToken, lobbyId, multiplayerOptions) {
            var socket, _a, error_1;
            var _this = this;
            if (multiplayerOptions === void 0) { multiplayerOptions = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        socket = new JetcodeSocket(socketUrl);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        _a = this;
                        return [4, socket.connect(gameToken, lobbyId, multiplayerOptions)];
                    case 2:
                        _a.connection = _b.sent();
                        if (this.onConnectionCallback) {
                            this.onConnectionCallback(this.connection);
                        }
                        this.connection.connect(JetcodeSocket.RECEIVE_DATA, function (data, parameters, isMe) {
                            if (!data || !_this.running || !parameters.SendTime) {
                                return;
                            }
                            if (parameters.SyncGame === "true") {
                                var syncObjectsData = JSON.parse(data);
                                _this.syncObjects(syncObjectsData, _this.calcDeltaTime(parameters.SendTime));
                            }
                            else if (parameters.Keydown !== "true" && parameters.Mousedown !== "true" && _this.onReceiveCallback) {
                                data = JSON.parse(data);
                                var userData = data['userData'];
                                var syncSpritesData = data['sync'];
                                _this.syncObjects(syncSpritesData, _this.calcDeltaTime(parameters.SendTime));
                                _this.onReceiveCallback(userData, parameters, isMe);
                            }
                        });
                        this.connection.connect(JetcodeSocket.MEMBER_JOINED, function (parameters, isMe) {
                            if (_this.onMemberJoinedCallback) {
                                _this.onMemberJoinedCallback(parameters, isMe);
                            }
                        });
                        this.connection.connect(JetcodeSocket.MEMBER_LEFT, function (parameters, isMe) {
                            if (_this.onMemberLeftCallback) {
                                _this.onMemberLeftCallback(parameters, isMe);
                            }
                        });
                        this.connection.connect(JetcodeSocket.GAME_STARTED, function (parameters) {
                            var _a, _b;
                            var hostId = parameters.HostId;
                            var playerIds = (_b = (_a = parameters.Members) === null || _a === void 0 ? void 0 : _a.split(',')) !== null && _b !== void 0 ? _b : [];
                            _this.players = playerIds.map(function (playerId) {
                                return new Player(playerId, playerId === _this.connection.memberId, _this);
                            });
                            _this.isHost = hostId === _this.connection.memberId;
                            if (_this.onGameStartedCallback) {
                                _this.onGameStartedCallback(_this.players, parameters);
                            }
                        });
                        this.connection.connect(JetcodeSocket.GAME_STOPPED, function (parameters) {
                            if (_this.onGameStoppedCallback) {
                                _this.onGameStoppedCallback(parameters);
                            }
                        });
                        this.connection.connect(JetcodeSocket.ERROR, function (parameters) {
                            if (_this.onMultiplayerError) {
                                _this.onMultiplayerError(parameters);
                            }
                        });
                        return [3, 4];
                    case 3:
                        error_1 = _b.sent();
                        console.error(error_1);
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    };
    MultiplayerGame.prototype.autoSyncGame = function (timeout) {
        var _this = this;
        var hander = function () {
            _this.syncGame();
        };
        setInterval(hander, timeout);
    };
    return MultiplayerGame;
}(Game));
var MultiplayerSprite = (function (_super) {
    __extends(MultiplayerSprite, _super);
    function MultiplayerSprite(multiplayerName, stage, layer, costumePaths, soundPaths) {
        if (stage === void 0) { stage = null; }
        if (layer === void 0) { layer = 1; }
        if (costumePaths === void 0) { costumePaths = []; }
        if (soundPaths === void 0) { soundPaths = []; }
        var _this = _super.call(this, stage, layer, costumePaths, soundPaths) || this;
        _this.multiplayerName = 'sprite_' + multiplayerName;
        _this.syncId = 1;
        _this.reservedProps = Object.keys(_this);
        _this.reservedProps.push('body');
        _this.reservedProps.push('reservedProps');
        return _this;
    }
    MultiplayerSprite.prototype.generateUniqueId = function () {
        return Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
    };
    MultiplayerSprite.prototype.getCustomerProperties = function () {
        var e_18, _a;
        var data = {};
        try {
            for (var _b = __values(Object.keys(this)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                if (this.reservedProps.includes(key)) {
                    continue;
                }
                data[key] = this[key];
            }
        }
        catch (e_18_1) { e_18 = { error: e_18_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_18) throw e_18.error; }
        }
        return data;
    };
    MultiplayerSprite.prototype.getMultiplayerName = function () {
        return this.multiplayerName;
    };
    MultiplayerSprite.prototype.getSyncId = function () {
        return this.syncId;
    };
    MultiplayerSprite.prototype.increaseSyncId = function () {
        this.syncId++;
        return this.syncId;
    };
    MultiplayerSprite.prototype.getSyncData = function () {
        return Object.assign({}, this.getCustomerProperties(), {
            size: this.size,
            rotateStyle: this.rotateStyle,
            costumeIndex: this.costumeIndex,
            deleted: this._deleted,
            x: this.x,
            y: this.y,
            direction: this.direction,
            hidden: this.hidden,
            stopped: this.stopped,
        });
    };
    MultiplayerSprite.prototype.setSyncData = function (packName, data, deltaTime) {
        var oldData = {};
        for (var key in data) {
            if (data.hasOwnProperty(key) && !this.reservedProps.includes(key)) {
                oldData[key] = this[key];
                this[key] = data[key];
            }
        }
        if (this.syncCallback) {
            this.syncCallback(this, packName, data, oldData, deltaTime);
        }
    };
    MultiplayerSprite.prototype.onSync = function (callback) {
        this.syncCallback = callback;
    };
    MultiplayerSprite.prototype.removeSyncHandler = function () {
        this.syncCallback = null;
    };
    MultiplayerSprite.prototype.only = function () {
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        return new OrphanSharedData(this, properties);
    };
    return MultiplayerSprite;
}(Sprite));
var OrphanSharedData = (function () {
    function OrphanSharedData(parent, properties) {
        this.parent = parent;
        this.properties = properties;
    }
    OrphanSharedData.prototype.getMultiplayerName = function () {
        return this.parent.getMultiplayerName();
    };
    OrphanSharedData.prototype.getSyncId = function () {
        return this.parent.getSyncId();
    };
    OrphanSharedData.prototype.increaseSyncId = function () {
        return this.parent.increaseSyncId();
    };
    OrphanSharedData.prototype.getSyncData = function () {
        var e_19, _a;
        var syncData = {};
        try {
            for (var _b = __values(this.properties), _c = _b.next(); !_c.done; _c = _b.next()) {
                var property = _c.value;
                if (this.parent[property]) {
                    syncData[property] = this.parent[property];
                }
            }
        }
        catch (e_19_1) { e_19 = { error: e_19_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_19) throw e_19.error; }
        }
        return syncData;
    };
    OrphanSharedData.prototype.setSyncData = function (packName, data, deltaTime) {
        this.parent.setSyncData(packName, data, deltaTime);
    };
    OrphanSharedData.prototype.onSync = function (callback) {
        throw new Error('Not implemented.');
    };
    OrphanSharedData.prototype.removeSyncHandler = function () {
        throw new Error('Not implemented.');
    };
    OrphanSharedData.prototype.only = function () {
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        throw new Error('Not implemented.');
    };
    return OrphanSharedData;
}());
var Player = (function () {
    function Player(id, isMe, game) {
        this.deleted = false;
        this.id = id;
        this._isMe = isMe;
        this.game = game;
        this.multiplayerName = 'player_' + id;
        this.syncId = 1;
        this.control = new MultiplayerControl(this, this.game, game.connection, isMe);
        this.reservedProps = Object.keys(this);
        this.reservedProps.push('reservedProps');
    }
    Player.prototype.keyDown = function (char, callback, syncPackName, syncData) {
        if (syncData === void 0) { syncData = []; }
        this.control.keyDown(char, callback, syncPackName, syncData);
    };
    Player.prototype.removeKeyDownHandler = function (char) {
        this.control.removeKeyDownHandler(char);
    };
    Player.prototype.mouseDown = function (callback, syncPackName, syncData) {
        if (syncData === void 0) { syncData = []; }
        this.control.mouseDown(callback, syncPackName, syncData);
    };
    Player.prototype.removeMouseDownHandler = function () {
        this.control.removeMouseDownHandler();
    };
    Player.prototype.isMe = function () {
        return this._isMe;
    };
    Player.prototype.delete = function () {
        if (this.deleted) {
            return;
        }
        this.control.stop();
        var props = Object.keys(this);
        for (var i = 0; i < props.length; i++) {
            delete this[props[i]];
        }
        this.deleted = true;
    };
    Player.prototype.repeat = function (i, callback, timeout, finishCallback) {
        var _this = this;
        if (this.deleted) {
            finishCallback();
            return;
        }
        if (i < 1) {
            finishCallback();
            return;
        }
        var result = callback(this);
        if (result === false) {
            finishCallback();
            return;
        }
        if (result > 0) {
            timeout = result;
        }
        i--;
        if (i < 1) {
            finishCallback();
            return;
        }
        setTimeout(function () {
            requestAnimationFrame(function () { return _this.repeat(i, callback, timeout, finishCallback); });
        }, timeout);
    };
    Player.prototype.forever = function (callback, timeout) {
        var _this = this;
        if (timeout === void 0) { timeout = null; }
        if (this.deleted) {
            return;
        }
        var result = callback(this);
        if (result === false) {
            return;
        }
        if (result > 0) {
            timeout = result;
        }
        if (timeout) {
            setTimeout(function () {
                requestAnimationFrame(function () { return _this.forever(callback, timeout); });
            }, timeout);
        }
        else {
            requestAnimationFrame(function () { return _this.forever(callback); });
        }
    };
    Player.prototype.timeout = function (callback, timeout) {
        var _this = this;
        setTimeout(function () {
            if (_this.deleted) {
                return;
            }
            requestAnimationFrame(function () { return callback(_this); });
        }, timeout);
    };
    Player.prototype.getMultiplayerName = function () {
        return this.multiplayerName;
    };
    Player.prototype.getSyncId = function () {
        return this.syncId;
    };
    Player.prototype.increaseSyncId = function () {
        this.syncId++;
        return this.syncId;
    };
    Player.prototype.getSyncData = function () {
        var e_20, _a;
        var data = {};
        try {
            for (var _b = __values(Object.keys(this)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                if (this.reservedProps.includes(key)) {
                    continue;
                }
                data[key] = this[key];
            }
        }
        catch (e_20_1) { e_20 = { error: e_20_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_20) throw e_20.error; }
        }
        return data;
    };
    Player.prototype.setSyncData = function (packName, data, deltaTime) {
        var oldData = {};
        for (var key in data) {
            if (data.hasOwnProperty(key) && !this.reservedProps.includes(key)) {
                oldData[key] = this[key];
                this[key] = data[key];
            }
        }
        if (this.syncCallback) {
            this.syncCallback(this, packName, data, oldData, deltaTime);
        }
    };
    Player.prototype.onSync = function (callback) {
        this.syncCallback = callback;
    };
    Player.prototype.removeSyncHandler = function () {
        this.syncCallback = null;
    };
    Player.prototype.only = function () {
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        return new OrphanSharedData(this, properties);
    };
    return Player;
}());
var ScheduledCallbackExecutor = (function () {
    function ScheduledCallbackExecutor(context) {
        this.context = context;
    }
    ScheduledCallbackExecutor.prototype.execute = function (now, diffTime) {
        var _this = this;
        return function (item) {
            var state = item.state;
            if (_this.context instanceof Sprite) {
                if (_this.context.deleted) {
                    return false;
                }
                if (_this.context.stopped) {
                    return true;
                }
            }
            if (item.timeout && diffTime) {
                item.timeout += diffTime;
            }
            if (!item.timeout || item.timeout <= now) {
                var result = item.callback(_this.context, state);
                if (state.maxIterations) {
                    state.currentIteration++;
                }
                var isFinished = result === false ||
                    (item.timeout && !state.interval && !state.maxIterations) ||
                    (state.maxIterations && state.currentIteration >= state.maxIterations);
                if (isFinished) {
                    if (item.finishCallback) {
                        item.finishCallback(_this.context, state);
                    }
                    return false;
                }
                if (state.interval) {
                    item.timeout = now + state.interval;
                }
            }
            return true;
        };
    };
    return ScheduledCallbackExecutor;
}());
var ScheduledCallbackItem = (function () {
    function ScheduledCallbackItem(callback, state, timeout, finishCallback) {
        this.callback = callback;
        this.state = state;
        this.timeout = timeout;
        this.finishCallback = finishCallback;
    }
    return ScheduledCallbackItem;
}());
var ScheduledState = (function () {
    function ScheduledState(interval, maxIterations, currentIteration) {
        this.interval = interval;
        this.maxIterations = maxIterations;
        this.currentIteration = currentIteration;
    }
    return ScheduledState;
}());
var SharedData = (function () {
    function SharedData(multiplayerName) {
        this.multiplayerName = 'data_' + multiplayerName;
        this.syncId = 1;
        if (!Registry.getInstance().has('game')) {
            throw new Error('You need create Game instance before Sprite instance.');
        }
        var game = Registry.getInstance().get('game');
        game.addSharedObject(this);
    }
    SharedData.prototype.generateUniqueId = function () {
        return Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
    };
    SharedData.prototype.getMultiplayerName = function () {
        return this.multiplayerName;
    };
    SharedData.prototype.getSyncId = function () {
        return this.syncId;
    };
    SharedData.prototype.increaseSyncId = function () {
        this.syncId++;
        return this.syncId;
    };
    SharedData.prototype.getSyncData = function () {
        var e_21, _a;
        var data = {};
        try {
            for (var _b = __values(Object.keys(this)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                data[key] = this[key];
            }
        }
        catch (e_21_1) { e_21 = { error: e_21_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_21) throw e_21.error; }
        }
        return data;
    };
    SharedData.prototype.setSyncData = function (packName, data, deltaTime) {
        var oldData = {};
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                oldData[key] = this[key];
                this[key] = data[key];
            }
        }
        if (this.syncCallback) {
            this.syncCallback(this, packName, data, oldData, deltaTime);
        }
    };
    SharedData.prototype.onSync = function (callback) {
        this.syncCallback = callback;
    };
    SharedData.prototype.removeSyncHandler = function () {
        this.syncCallback = null;
    };
    SharedData.prototype.only = function () {
        var properties = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            properties[_i] = arguments[_i];
        }
        return new OrphanSharedData(this, properties);
    };
    return SharedData;
}());
var Stage = (function () {
    function Stage(background) {
        if (background === void 0) { background = null; }
        this.backgroundColor = null;
        this.background = null;
        this.backgroundIndex = null;
        this.backgrounds = [];
        this.sprites = new Map();
        this.drawings = new Map();
        this.addedSprites = 0;
        this.loadedSprites = 0;
        this.loadedBackgrounds = 0;
        this.pendingRun = false;
        this.onReadyCallbacks = [];
        this.onStartCallbacks = [];
        this.onReadyPending = true;
        this.scheduledCallbacks = [];
        this._stopped = true;
        this._running = false;
        this.stoppedTime = null;
        this.diffTime = null;
        if (!Registry.getInstance().has('game')) {
            throw new Error('You need create Game instance before Stage instance.');
        }
        this.game = Registry.getInstance().get('game');
        var stage = this;
        if (this.game.displayErrors) {
            stage = this.game.validatorFactory.createValidator(this, 'Stage');
        }
        stage.id = Symbol();
        stage.eventEmitter = new EventEmitter();
        stage.collisionSystem = new CollisionSystem();
        stage.canvas = stage.game.canvas;
        stage.context = stage.game.context;
        if (background) {
            stage.addBackground(background);
        }
        stage.addListeners();
        stage.game.addStage(stage);
        stage.scheduledCallbackExecutor = new ScheduledCallbackExecutor(stage);
        stage.stoppedTime = Date.now();
        return stage;
    }
    Object.defineProperty(Stage.prototype, "width", {
        get: function () {
            return this.canvas.width;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "height", {
        get: function () {
            return this.canvas.height;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "running", {
        get: function () {
            return this._running;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "stopped", {
        get: function () {
            return this._stopped;
        },
        enumerable: false,
        configurable: true
    });
    Stage.prototype.addSprite = function (sprite) {
        var layerSprites;
        if (this.sprites.has(sprite.layer)) {
            layerSprites = this.sprites.get(sprite.layer);
        }
        else {
            layerSprites = [];
            this.sprites.set(sprite.layer, layerSprites);
        }
        layerSprites.push(sprite);
        this.addedSprites++;
    };
    Stage.prototype.removeSprite = function (sprite, layer) {
        if (!this.sprites.has(layer)) {
            this.game.throwErrorRaw('The layer "' + layer + '" not defined in the stage.');
        }
        var layerSprites = this.sprites.get(layer);
        layerSprites.splice(layerSprites.indexOf(sprite), 1);
        if (!layerSprites.length) {
            this.sprites.delete(layer);
        }
        if (sprite.deleted || sprite.isReady()) {
            this.loadedSprites--;
        }
        this.addedSprites--;
    };
    Stage.prototype.addBackground = function (backgroundPath) {
        var _this = this;
        var background = new Image();
        background.src = backgroundPath;
        this.backgrounds.push(background);
        var onLoad = function () {
            _this.eventEmitter.emit(Game.STAGE_BACKGROUND_READY_EVENT, {
                background: background,
                stageId: _this.id
            });
            background.removeEventListener('load', onLoad);
        };
        background.addEventListener('load', onLoad);
        background.addEventListener('error', function () {
            _this.game.throwError(ErrorMessages.BACKGROUND_NOT_LOADED, { backgroundPath: backgroundPath });
        });
    };
    Stage.prototype.switchBackground = function (backgroundIndex) {
        this.backgroundIndex = backgroundIndex;
        var background = this.backgrounds[backgroundIndex];
        if (background) {
            this.background = background;
        }
    };
    Stage.prototype.drawSprite = function (sprite) {
        var costume = sprite.getCostume();
        var image = costume.image;
        var dstX = sprite.x - sprite.width / 2;
        var dstY = sprite.y - sprite.height / 2;
        var dstWidth = sprite.width;
        var dstHeight = sprite.height;
        var direction = sprite.direction;
        var rotateStyle = sprite.rotateStyle;
        if (rotateStyle === 'normal' && direction !== 0) {
            this.context.save();
            this.context.translate(dstX + dstWidth / 2, dstY + dstHeight / 2);
            this.context.rotate(direction * Math.PI / 180);
            this.context.translate(-dstX - dstWidth / 2, -dstY - dstHeight / 2);
        }
        if (rotateStyle === 'leftRight' && direction > 180) {
            this.context.save();
            this.context.translate(dstX + dstWidth / 2, 0);
            this.context.scale(-1, 1);
            this.context.drawImage(image, costume.x, costume.y, costume.width, costume.height, -dstWidth / 2, dstY, dstWidth, dstHeight);
        }
        else {
            this.context.drawImage(image, costume.x, costume.y, costume.width, costume.height, dstX, dstY, dstWidth, dstHeight);
        }
        if (rotateStyle === 'normal' && direction !== 0 || rotateStyle === 'leftRight' && direction > 180) {
            this.context.restore();
        }
    };
    Stage.prototype.pen = function (callback, layer) {
        if (layer === void 0) { layer = 0; }
        var layerDrawings;
        if (this.drawings.has(layer)) {
            layerDrawings = this.drawings.get(layer);
        }
        else {
            layerDrawings = [];
            this.drawings.set(layer, layerDrawings);
        }
        layerDrawings.push(callback);
    };
    Stage.prototype.render = function () {
        var e_22, _a, e_23, _b, e_24, _c;
        var _this = this;
        this.update();
        this.collisionSystem.update();
        this.context.clearRect(0, 0, this.width, this.height);
        if (this.backgroundColor) {
            this.context.fillStyle = this.backgroundColor;
            this.context.fillRect(0, 0, this.width, this.height);
        }
        if (this.background) {
            this.context.drawImage(this.background, 0, 0, this.width, this.height);
        }
        if (this.game.debugBody) {
            this.collisionSystem.draw(this.context);
            this.context.stroke();
        }
        var layers = Array.from(this.sprites.keys()).concat(Array.from(this.drawings.keys()));
        layers = layers.filter(function (item, pos) { return layers.indexOf(item) === pos; });
        layers = layers.sort(function (a, b) { return a - b; });
        try {
            for (var layers_1 = __values(layers), layers_1_1 = layers_1.next(); !layers_1_1.done; layers_1_1 = layers_1.next()) {
                var layer = layers_1_1.value;
                if (this.drawings.has(layer)) {
                    var layerDrawings = this.drawings.get(layer);
                    try {
                        for (var layerDrawings_1 = (e_23 = void 0, __values(layerDrawings)), layerDrawings_1_1 = layerDrawings_1.next(); !layerDrawings_1_1.done; layerDrawings_1_1 = layerDrawings_1.next()) {
                            var drawing = layerDrawings_1_1.value;
                            drawing(this.context);
                        }
                    }
                    catch (e_23_1) { e_23 = { error: e_23_1 }; }
                    finally {
                        try {
                            if (layerDrawings_1_1 && !layerDrawings_1_1.done && (_b = layerDrawings_1.return)) _b.call(layerDrawings_1);
                        }
                        finally { if (e_23) throw e_23.error; }
                    }
                }
                if (this.sprites.has(layer)) {
                    var layerSprites = this.sprites.get(layer);
                    var _loop_1 = function (sprite) {
                        if (sprite.hidden) {
                            return "continue";
                        }
                        if (this_1.game.debugMode !== 'none') {
                            var fn = function () {
                                var x = sprite.x - (_this.context.measureText(sprite.name).width / 2);
                                var y = sprite.realY + sprite.height + 20;
                                _this.context.font = '16px Arial';
                                _this.context.fillStyle = 'black';
                                _this.context.fillText(sprite.name, x, y);
                                y += 20;
                                _this.context.font = '14px Arial';
                                _this.context.fillText("x: " + sprite.x, x, y);
                                y += 20;
                                _this.context.fillText("y: " + sprite.y, x, y);
                                y += 20;
                                _this.context.fillText("direction: " + sprite.direction, x, y);
                                y += 20;
                                _this.context.fillText("costume: " + sprite.getCostumeName(), x, y);
                            };
                            if (this_1.game.debugMode === 'hover') {
                                if (sprite.touchMouse()) {
                                    fn();
                                }
                            }
                            if (this_1.game.debugMode === 'forever') {
                                fn();
                            }
                        }
                        var phrase = sprite.getPhrase();
                        if (phrase) {
                            this_1.context.font = '20px Arial';
                            this_1.context.fillStyle = 'black';
                            this_1.context.fillText(phrase, 40, this_1.canvas.height - 40);
                        }
                        if (sprite.getCostume()) {
                            this_1.drawSprite(sprite);
                        }
                    };
                    var this_1 = this;
                    try {
                        for (var layerSprites_1 = (e_24 = void 0, __values(layerSprites)), layerSprites_1_1 = layerSprites_1.next(); !layerSprites_1_1.done; layerSprites_1_1 = layerSprites_1.next()) {
                            var sprite = layerSprites_1_1.value;
                            _loop_1(sprite);
                        }
                    }
                    catch (e_24_1) { e_24 = { error: e_24_1 }; }
                    finally {
                        try {
                            if (layerSprites_1_1 && !layerSprites_1_1.done && (_c = layerSprites_1.return)) _c.call(layerSprites_1);
                        }
                        finally { if (e_24) throw e_24.error; }
                    }
                }
            }
        }
        catch (e_22_1) { e_22 = { error: e_22_1 }; }
        finally {
            try {
                if (layers_1_1 && !layers_1_1.done && (_a = layers_1.return)) _a.call(layers_1);
            }
            finally { if (e_22) throw e_22.error; }
        }
    };
    Stage.prototype.timeout = function (callback, timeout) {
        this.repeat(callback, 1, null, timeout, undefined);
    };
    Stage.prototype.repeat = function (callback, repeat, interval, timeout, finishCallback) {
        if (interval === void 0) { interval = null; }
        if (timeout === void 0) { timeout = null; }
        var state = new ScheduledState(interval, repeat, 0);
        if (timeout) {
            timeout = Date.now() + timeout;
        }
        this.scheduledCallbacks.push(new ScheduledCallbackItem(callback, state, timeout, finishCallback));
    };
    Stage.prototype.forever = function (callback, interval, timeout, finishCallback) {
        if (interval === void 0) { interval = null; }
        if (timeout === void 0) { timeout = null; }
        var state = new ScheduledState(interval);
        if (timeout) {
            timeout = Date.now() + timeout;
        }
        this.scheduledCallbacks.push(new ScheduledCallbackItem(callback, state, timeout, finishCallback));
    };
    Stage.prototype.isReady = function () {
        return this.addedSprites == this.loadedSprites && this.loadedBackgrounds == this.backgrounds.length;
    };
    Stage.prototype.run = function () {
        var e_25, _a, e_26, _b;
        this._stopped = false;
        try {
            for (var _c = __values(this.sprites.values()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var layerSprites = _d.value;
                try {
                    for (var layerSprites_2 = (e_26 = void 0, __values(layerSprites)), layerSprites_2_1 = layerSprites_2.next(); !layerSprites_2_1.done; layerSprites_2_1 = layerSprites_2.next()) {
                        var sprite = layerSprites_2_1.value;
                        sprite.run();
                    }
                }
                catch (e_26_1) { e_26 = { error: e_26_1 }; }
                finally {
                    try {
                        if (layerSprites_2_1 && !layerSprites_2_1.done && (_b = layerSprites_2.return)) _b.call(layerSprites_2);
                    }
                    finally { if (e_26) throw e_26.error; }
                }
            }
        }
        catch (e_25_1) { e_25 = { error: e_25_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_25) throw e_25.error; }
        }
        this.pendingRun = true;
        this.tryDoRun();
    };
    Stage.prototype.ready = function () {
        this.tryDoOnReady();
        this.tryDoRun();
    };
    Stage.prototype.onStart = function (onStartCallback) {
        this.onStartCallbacks.push(onStartCallback);
    };
    Stage.prototype.onReady = function (callback) {
        this.onReadyCallbacks.push(callback);
    };
    Stage.prototype.stop = function () {
        var e_27, _a, e_28, _b;
        this._running = false;
        this._stopped = true;
        try {
            for (var _c = __values(this.sprites.values()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var layerSprites = _d.value;
                try {
                    for (var layerSprites_3 = (e_28 = void 0, __values(layerSprites)), layerSprites_3_1 = layerSprites_3.next(); !layerSprites_3_1.done; layerSprites_3_1 = layerSprites_3.next()) {
                        var sprite = layerSprites_3_1.value;
                        sprite.stop();
                    }
                }
                catch (e_28_1) { e_28 = { error: e_28_1 }; }
                finally {
                    try {
                        if (layerSprites_3_1 && !layerSprites_3_1.done && (_b = layerSprites_3.return)) _b.call(layerSprites_3);
                    }
                    finally { if (e_28) throw e_28.error; }
                }
            }
        }
        catch (e_27_1) { e_27 = { error: e_27_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_27) throw e_27.error; }
        }
        this.stoppedTime = Date.now();
    };
    Stage.prototype.getSprites = function () {
        return Array.from(this.sprites.values()).reduce(function (accumulator, currentValue) { return accumulator.concat(currentValue); }, []);
    };
    Stage.prototype.addListeners = function () {
        var _this = this;
        this.eventEmitter.on(Game.SPRITE_READY_EVENT, Game.SPRITE_READY_EVENT, function (event) {
            if (_this.id == event.detail.stageId) {
                _this.loadedSprites++;
                _this.tryDoOnReady();
                _this.tryDoRun();
            }
        });
        this.eventEmitter.on(Game.STAGE_BACKGROUND_READY_EVENT, Game.STAGE_BACKGROUND_READY_EVENT, function (event) {
            if (_this.id == event.detail.stageId) {
                _this.loadedBackgrounds++;
                _this.tryDoOnReady();
                _this.tryDoRun();
                if (_this.loadedBackgrounds == _this.backgrounds.length && _this.backgroundIndex === null) {
                    _this.switchBackground(0);
                }
            }
        });
    };
    Stage.prototype.tryDoOnReady = function () {
        var e_29, _a;
        if (this.isReady() && this.onReadyPending) {
            this.onReadyPending = false;
            if (this.onReadyCallbacks.length) {
                try {
                    for (var _b = __values(this.onReadyCallbacks), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var callback = _c.value;
                        callback();
                    }
                }
                catch (e_29_1) { e_29 = { error: e_29_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_29) throw e_29.error; }
                }
                this.onReadyCallbacks = [];
            }
            this.game.eventEmitter.emit(Game.STAGE_READY_EVENT, {
                stage: this
            });
        }
    };
    Stage.prototype.doOnStart = function () {
        var e_30, _a;
        var _loop_2 = function (callback) {
            setTimeout(function () {
                callback();
            });
        };
        try {
            for (var _b = __values(this.onStartCallbacks), _c = _b.next(); !_c.done; _c = _b.next()) {
                var callback = _c.value;
                _loop_2(callback);
            }
        }
        catch (e_30_1) { e_30 = { error: e_30_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_30) throw e_30.error; }
        }
    };
    Stage.prototype.tryDoRun = function () {
        var _this = this;
        if (this.pendingRun && !this._running && this.isReady()) {
            this._running = true;
            this.pendingRun = false;
            this.doOnStart();
            this.diffTime = Date.now() - this.stoppedTime;
            setTimeout(function () {
                var stoppedTime = _this.stoppedTime;
                var loop = function () {
                    if (_this._stopped || stoppedTime !== _this.stoppedTime) {
                        return;
                    }
                    _this.render();
                    requestAnimationFrame(loop);
                };
                loop();
            });
        }
    };
    Stage.prototype.update = function () {
        var _this = this;
        this.scheduledCallbacks = this.scheduledCallbacks.filter(this.scheduledCallbackExecutor.execute(Date.now(), this.diffTime));
        this.sprites.forEach(function (layerSprites, layer) {
            var e_31, _a;
            try {
                for (var layerSprites_4 = __values(layerSprites), layerSprites_4_1 = layerSprites_4.next(); !layerSprites_4_1.done; layerSprites_4_1 = layerSprites_4.next()) {
                    var sprite = layerSprites_4_1.value;
                    if (sprite.deleted) {
                        _this.removeSprite(sprite, layer);
                        return;
                    }
                    sprite.update(_this.diffTime);
                }
            }
            catch (e_31_1) { e_31 = { error: e_31_1 }; }
            finally {
                try {
                    if (layerSprites_4_1 && !layerSprites_4_1.done && (_a = layerSprites_4.return)) _a.call(layerSprites_4);
                }
                finally { if (e_31) throw e_31.error; }
            }
        });
        this.diffTime = 0;
    };
    return Stage;
}());
var BVH = (function () {
    function BVH() {
        this._hierarchy = null;
        this._bodies = [];
        this._dirty_branches = [];
    }
    BVH.prototype.insert = function (body, updating) {
        if (updating === void 0) { updating = false; }
        if (!updating) {
            var bvh = body._bvh;
            if (bvh && bvh !== this) {
                throw new Error('Body belongs to another collision system');
            }
            body._bvh = this;
            this._bodies.push(body);
        }
        var polygon = body._polygon;
        var body_x = body.x;
        var body_y = body.y;
        if (polygon) {
            if (body._dirty_coords ||
                body.x !== body._x ||
                body.y !== body._y ||
                body.angle !== body._angle ||
                body.scale_x !== body._scale_x ||
                body.scale_y !== body._scale_y) {
                body._calculateCoords();
            }
        }
        var padding = body._bvh_padding;
        var radius = polygon ? 0 : body.radius * body.scale;
        var body_min_x = (polygon ? body._min_x : body_x - radius) - padding;
        var body_min_y = (polygon ? body._min_y : body_y - radius) - padding;
        var body_max_x = (polygon ? body._max_x : body_x + radius) + padding;
        var body_max_y = (polygon ? body._max_y : body_y + radius) + padding;
        body._bvh_min_x = body_min_x;
        body._bvh_min_y = body_min_y;
        body._bvh_max_x = body_max_x;
        body._bvh_max_y = body_max_y;
        var current = this._hierarchy;
        var sort = 0;
        if (!current) {
            this._hierarchy = body;
        }
        else {
            var depth = 0;
            while (depth++ < BVH.MAX_DEPTH) {
                if (current._bvh_branch) {
                    var left = current._bvh_left;
                    var left_min_y = left._bvh_min_y;
                    var left_max_x = left._bvh_max_x;
                    var left_max_y = left._bvh_max_y;
                    var left_new_min_x = body_min_x < left._bvh_min_x ? body_min_x : left._bvh_min_x;
                    var left_new_min_y = body_min_y < left_min_y ? body_min_y : left_min_y;
                    var left_new_max_x = body_max_x > left_max_x ? body_max_x : left_max_x;
                    var left_new_max_y = body_max_y > left_max_y ? body_max_y : left_max_y;
                    var left_volume = (left_max_x - left._bvh_min_x) * (left_max_y - left_min_y);
                    var left_new_volume = (left_new_max_x - left_new_min_x) * (left_new_max_y - left_new_min_y);
                    var left_difference = left_new_volume - left_volume;
                    var right = current._bvh_right;
                    var right_min_x = right._bvh_min_x;
                    var right_min_y = right._bvh_min_y;
                    var right_max_x = right._bvh_max_x;
                    var right_max_y = right._bvh_max_y;
                    var right_new_min_x = body_min_x < right_min_x ? body_min_x : right_min_x;
                    var right_new_min_y = body_min_y < right_min_y ? body_min_y : right_min_y;
                    var right_new_max_x = body_max_x > right_max_x ? body_max_x : right_max_x;
                    var right_new_max_y = body_max_y > right_max_y ? body_max_y : right_max_y;
                    var right_volume = (right_max_x - right_min_x) * (right_max_y - right_min_y);
                    var right_new_volume = (right_new_max_x - right_new_min_x) * (right_new_max_y - right_new_min_y);
                    var right_difference = right_new_volume - right_volume;
                    current._bvh_sort = sort++;
                    current._bvh_min_x = left_new_min_x < right_new_min_x ? left_new_min_x : right_new_min_x;
                    current._bvh_min_y = left_new_min_y < right_new_min_y ? left_new_min_y : right_new_min_y;
                    current._bvh_max_x = left_new_max_x > right_new_max_x ? left_new_max_x : right_new_max_x;
                    current._bvh_max_y = left_new_max_y > right_new_max_y ? left_new_max_y : right_new_max_y;
                    current = left_difference <= right_difference ? left : right;
                }
                else {
                    var grandparent = current._bvh_parent;
                    var parent_min_x = current._bvh_min_x;
                    var parent_min_y = current._bvh_min_y;
                    var parent_max_x = current._bvh_max_x;
                    var parent_max_y = current._bvh_max_y;
                    var new_parent = current._bvh_parent = body._bvh_parent = BVHBranch.getBranch();
                    new_parent._bvh_parent = grandparent;
                    new_parent._bvh_left = current;
                    new_parent._bvh_right = body;
                    new_parent._bvh_sort = sort++;
                    new_parent._bvh_min_x = body_min_x < parent_min_x ? body_min_x : parent_min_x;
                    new_parent._bvh_min_y = body_min_y < parent_min_y ? body_min_y : parent_min_y;
                    new_parent._bvh_max_x = body_max_x > parent_max_x ? body_max_x : parent_max_x;
                    new_parent._bvh_max_y = body_max_y > parent_max_y ? body_max_y : parent_max_y;
                    if (!grandparent) {
                        this._hierarchy = new_parent;
                    }
                    else if (grandparent._bvh_left === current) {
                        grandparent._bvh_left = new_parent;
                    }
                    else {
                        grandparent._bvh_right = new_parent;
                    }
                    break;
                }
            }
        }
    };
    BVH.prototype.remove = function (body, updating) {
        if (updating === void 0) { updating = false; }
        if (!updating) {
            var bvh = body._bvh;
            if (bvh && bvh !== this) {
                throw new Error('Body belongs to another collision system');
            }
            body._bvh = null;
            this._bodies.splice(this._bodies.indexOf(body), 1);
        }
        if (this._hierarchy === body) {
            this._hierarchy = null;
            return;
        }
        var parent = body._bvh_parent;
        if (!parent) {
            console.error('The parent is not defined in the collision system.');
            return;
        }
        var grandparent = parent._bvh_parent;
        var parent_left = parent._bvh_left;
        var sibling = parent_left === body ? parent._bvh_right : parent_left;
        sibling._bvh_parent = grandparent;
        if (sibling._bvh_branch) {
            sibling._bvh_sort = parent._bvh_sort;
        }
        if (grandparent) {
            if (grandparent._bvh_left === parent) {
                grandparent._bvh_left = sibling;
            }
            else {
                grandparent._bvh_right = sibling;
            }
            var branch = grandparent;
            var depth = 0;
            while (branch && depth++ < BVH.MAX_DEPTH) {
                var left = branch._bvh_left;
                var left_min_x = left._bvh_min_x;
                var left_min_y = left._bvh_min_y;
                var left_max_x = left._bvh_max_x;
                var left_max_y = left._bvh_max_y;
                var right = branch._bvh_right;
                var right_min_x = right._bvh_min_x;
                var right_min_y = right._bvh_min_y;
                var right_max_x = right._bvh_max_x;
                var right_max_y = right._bvh_max_y;
                branch._bvh_min_x = left_min_x < right_min_x ? left_min_x : right_min_x;
                branch._bvh_min_y = left_min_y < right_min_y ? left_min_y : right_min_y;
                branch._bvh_max_x = left_max_x > right_max_x ? left_max_x : right_max_x;
                branch._bvh_max_y = left_max_y > right_max_y ? left_max_y : right_max_y;
                branch = branch._bvh_parent;
            }
        }
        else {
            this._hierarchy = sibling;
        }
        BVHBranch.releaseBranch(parent);
    };
    BVH.prototype.update = function () {
        var bodies = this._bodies;
        var count = bodies.length;
        for (var i = 0; i < count; ++i) {
            var body = bodies[i];
            var update = false;
            if (!update && body.padding !== body._bvh_padding) {
                body._bvh_padding = body.padding;
                update = true;
            }
            if (!update) {
                var polygon = body._polygon;
                if (polygon) {
                    if (body._dirty_coords ||
                        body.x !== body._x ||
                        body.y !== body._y ||
                        body.angle !== body._angle ||
                        body.scale_x !== body._scale_x ||
                        body.scale_y !== body._scale_y) {
                        body._calculateCoords();
                    }
                }
                var x = body.x;
                var y = body.y;
                var radius = polygon ? 0 : body.radius * body.scale;
                var min_x = polygon ? body._min_x : x - radius;
                var min_y = polygon ? body._min_y : y - radius;
                var max_x = polygon ? body._max_x : x + radius;
                var max_y = polygon ? body._max_y : y + radius;
                update = min_x < body._bvh_min_x || min_y < body._bvh_min_y || max_x > body._bvh_max_x || max_y > body._bvh_max_y;
            }
            if (update) {
                this.remove(body, true);
                this.insert(body, true);
            }
        }
    };
    BVH.prototype.potentials = function (body) {
        var results = [];
        var min_x = body._bvh_min_x;
        var min_y = body._bvh_min_y;
        var max_x = body._bvh_max_x;
        var max_y = body._bvh_max_y;
        var current = this._hierarchy;
        var traverse_left = true;
        if (!current || !current._bvh_branch) {
            return results;
        }
        var depth = 0;
        while (current && depth++ < BVH.MAX_DEPTH) {
            if (traverse_left) {
                traverse_left = false;
                var left = current._bvh_branch ? current._bvh_left : null;
                while (left &&
                    left._bvh_max_x >= min_x &&
                    left._bvh_max_y >= min_y &&
                    left._bvh_min_x <= max_x &&
                    left._bvh_min_y <= max_y) {
                    current = left;
                    left = current._bvh_branch ? current._bvh_left : null;
                }
            }
            var branch = current._bvh_branch;
            var right = branch ? current._bvh_right : null;
            if (right &&
                right._bvh_max_x > min_x &&
                right._bvh_max_y > min_y &&
                right._bvh_min_x < max_x &&
                right._bvh_min_y < max_y) {
                current = right;
                traverse_left = true;
            }
            else {
                if (!branch && current !== body) {
                    results.push(current);
                }
                var parent_1 = current._bvh_parent;
                if (parent_1) {
                    while (parent_1 && parent_1._bvh_right === current) {
                        current = parent_1;
                        parent_1 = current._bvh_parent;
                    }
                    current = parent_1;
                }
                else {
                    break;
                }
            }
        }
        return results;
    };
    BVH.prototype.draw = function (context) {
        var bodies = this._bodies;
        var count = bodies.length;
        for (var i = 0; i < count; ++i) {
            bodies[i].draw(context);
        }
    };
    BVH.prototype.drawBVH = function (context) {
        var current = this._hierarchy;
        var traverse_left = true;
        while (current) {
            if (traverse_left) {
                traverse_left = false;
                var left = current._bvh_branch ? current._bvh_left : null;
                while (left) {
                    current = left;
                    left = current._bvh_branch ? current._bvh_left : null;
                }
            }
            var branch = current._bvh_branch;
            var min_x = current._bvh_min_x;
            var min_y = current._bvh_min_y;
            var max_x = current._bvh_max_x;
            var max_y = current._bvh_max_y;
            var right = branch ? current._bvh_right : null;
            context.moveTo(min_x, min_y);
            context.lineTo(max_x, min_y);
            context.lineTo(max_x, max_y);
            context.lineTo(min_x, max_y);
            context.lineTo(min_x, min_y);
            if (right) {
                current = right;
                traverse_left = true;
            }
            else {
                var parent_2 = current._bvh_parent;
                if (parent_2) {
                    while (parent_2 && parent_2._bvh_right === current) {
                        current = parent_2;
                        parent_2 = current._bvh_parent;
                    }
                    current = parent_2;
                }
                else {
                    break;
                }
            }
        }
    };
    BVH.MAX_DEPTH = 10000;
    return BVH;
}());
var branch_pool = [];
var BVHBranch = (function () {
    function BVHBranch() {
        this._bvh_parent = null;
        this._bvh_branch = true;
        this._bvh_left = null;
        this._bvh_right = null;
        this._bvh_sort = 0;
        this._bvh_min_x = 0;
        this._bvh_min_y = 0;
        this._bvh_max_x = 0;
        this._bvh_max_y = 0;
    }
    BVHBranch.getBranch = function () {
        if (branch_pool.length) {
            return branch_pool.pop();
        }
        return new BVHBranch();
    };
    BVHBranch.releaseBranch = function (branch) {
        branch_pool.push(branch);
    };
    BVHBranch.sortBranches = function (a, b) {
        return a.sort > b.sort ? -1 : 1;
    };
    return BVHBranch;
}());
var Body = (function () {
    function Body(x, y, padding) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (padding === void 0) { padding = 0; }
        this._circle = false;
        this._polygon = false;
        this._point = false;
        this._bvh = null;
        this._bvh_parent = null;
        this._bvh_branch = false;
        this._bvh_min_x = 0;
        this._bvh_min_y = 0;
        this._bvh_max_x = 0;
        this._bvh_max_y = 0;
        this.x = x;
        this.y = y;
        this.padding = padding;
        this._bvh_padding = padding;
    }
    Body.prototype.collides = function (target, result, aabb) {
        if (result === void 0) { result = null; }
        if (aabb === void 0) { aabb = true; }
        return SAT(this, target, result, aabb);
    };
    Body.prototype.potentials = function () {
        var bvh = this._bvh;
        if (bvh === null) {
            throw new Error('Body does not belong to a collision system');
        }
        return bvh.potentials(this);
    };
    Body.prototype.remove = function () {
        var bvh = this._bvh;
        if (bvh) {
            bvh.remove(this, false);
        }
    };
    Body.prototype.createResult = function () {
        return new CollisionResult();
    };
    Body.createResult = function () {
        return new CollisionResult();
    };
    return Body;
}());
var Circle = (function (_super) {
    __extends(Circle, _super);
    function Circle(x, y, radius, scale, padding) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (radius === void 0) { radius = 0; }
        if (scale === void 0) { scale = 1; }
        if (padding === void 0) { padding = 0; }
        var _this = _super.call(this, x, y, padding) || this;
        _this.radius = radius;
        _this.scale = scale;
        return _this;
    }
    Circle.prototype.draw = function (context) {
        var x = this.x;
        var y = this.y;
        var radius = this.radius * this.scale;
        context.moveTo(x + radius, y);
        context.arc(x, y, radius, 0, Math.PI * 2);
    };
    return Circle;
}(Body));
var CollisionResult = (function () {
    function CollisionResult() {
        this.collision = false;
        this.a = null;
        this.b = null;
        this.a_in_b = false;
        this.b_in_a = false;
        this.overlap = 0;
        this.overlap_x = 0;
        this.overlap_y = 0;
    }
    return CollisionResult;
}());
var CollisionSystem = (function () {
    function CollisionSystem() {
        this._bvh = new BVH();
    }
    CollisionSystem.prototype.createCircle = function (x, y, radius, scale, padding) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (radius === void 0) { radius = 0; }
        if (scale === void 0) { scale = 1; }
        if (padding === void 0) { padding = 0; }
        var body = new Circle(x, y, radius, scale, padding);
        this._bvh.insert(body);
        return body;
    };
    CollisionSystem.prototype.createPolygon = function (x, y, points, angle, scale_x, scale_y, padding) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (points === void 0) { points = [[0, 0]]; }
        if (angle === void 0) { angle = 0; }
        if (scale_x === void 0) { scale_x = 1; }
        if (scale_y === void 0) { scale_y = 1; }
        if (padding === void 0) { padding = 0; }
        var body = new Polygon(x, y, points, angle, scale_x, scale_y, padding);
        this._bvh.insert(body);
        return body;
    };
    CollisionSystem.prototype.createPoint = function (x, y, padding) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (padding === void 0) { padding = 0; }
        var body = new Point(x, y, padding);
        this._bvh.insert(body);
        return body;
    };
    CollisionSystem.prototype.createResult = function () {
        return new CollisionResult();
    };
    CollisionSystem.createResult = function () {
        return new CollisionResult();
    };
    CollisionSystem.prototype.insert = function () {
        var e_32, _a;
        var bodies = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            bodies[_i] = arguments[_i];
        }
        try {
            for (var bodies_1 = __values(bodies), bodies_1_1 = bodies_1.next(); !bodies_1_1.done; bodies_1_1 = bodies_1.next()) {
                var body = bodies_1_1.value;
                this._bvh.insert(body, false);
            }
        }
        catch (e_32_1) { e_32 = { error: e_32_1 }; }
        finally {
            try {
                if (bodies_1_1 && !bodies_1_1.done && (_a = bodies_1.return)) _a.call(bodies_1);
            }
            finally { if (e_32) throw e_32.error; }
        }
        return this;
    };
    CollisionSystem.prototype.remove = function () {
        var e_33, _a;
        var bodies = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            bodies[_i] = arguments[_i];
        }
        try {
            for (var bodies_2 = __values(bodies), bodies_2_1 = bodies_2.next(); !bodies_2_1.done; bodies_2_1 = bodies_2.next()) {
                var body = bodies_2_1.value;
                this._bvh.remove(body, false);
            }
        }
        catch (e_33_1) { e_33 = { error: e_33_1 }; }
        finally {
            try {
                if (bodies_2_1 && !bodies_2_1.done && (_a = bodies_2.return)) _a.call(bodies_2);
            }
            finally { if (e_33) throw e_33.error; }
        }
        return this;
    };
    CollisionSystem.prototype.update = function () {
        this._bvh.update();
        return this;
    };
    CollisionSystem.prototype.draw = function (context) {
        return this._bvh.draw(context);
    };
    CollisionSystem.prototype.drawBVH = function (context) {
        return this._bvh.drawBVH(context);
    };
    CollisionSystem.prototype.potentials = function (body) {
        return this._bvh.potentials(body);
    };
    CollisionSystem.prototype.collides = function (source, target, result, aabb) {
        if (result === void 0) { result = null; }
        if (aabb === void 0) { aabb = true; }
        return SAT(source, target, result, aabb);
    };
    return CollisionSystem;
}());
var Polygon = (function (_super) {
    __extends(Polygon, _super);
    function Polygon(x, y, points, angle, scale_x, scale_y, padding) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (points === void 0) { points = []; }
        if (angle === void 0) { angle = 0; }
        if (scale_x === void 0) { scale_x = 1; }
        if (scale_y === void 0) { scale_y = 1; }
        if (padding === void 0) { padding = 0; }
        var _this = _super.call(this, x, y, padding) || this;
        _this._min_x = 0;
        _this._min_y = 0;
        _this._max_x = 0;
        _this._max_y = 0;
        _this._points = null;
        _this._coords = null;
        _this._edges = null;
        _this._normals = null;
        _this._dirty_coords = true;
        _this._dirty_normals = true;
        _this.angle = angle;
        _this.scale_x = scale_x;
        _this.scale_y = scale_y;
        _this._polygon = true;
        _this._x = x;
        _this._y = y;
        _this._angle = angle;
        _this._scale_x = scale_x;
        _this._scale_y = scale_y;
        Polygon.prototype.setPoints.call(_this, points);
        return _this;
    }
    Polygon.prototype.draw = function (context) {
        if (this._dirty_coords ||
            this.x !== this._x ||
            this.y !== this._y ||
            this.angle !== this._angle ||
            this.scale_x !== this._scale_x ||
            this.scale_y !== this._scale_y) {
            this._calculateCoords();
        }
        var coords = this._coords;
        if (coords.length === 2) {
            context.moveTo(coords[0], coords[1]);
            context.arc(coords[0], coords[1], 1, 0, Math.PI * 2);
        }
        else {
            context.moveTo(coords[0], coords[1]);
            for (var i = 2; i < coords.length; i += 2) {
                context.lineTo(coords[i], coords[i + 1]);
            }
            if (coords.length > 4) {
                context.lineTo(coords[0], coords[1]);
            }
        }
    };
    Polygon.prototype.setPoints = function (new_points) {
        var count = new_points.length;
        this._points = new Float64Array(count * 2);
        this._coords = new Float64Array(count * 2);
        this._edges = new Float64Array(count * 2);
        this._normals = new Float64Array(count * 2);
        var points = this._points;
        for (var i = 0, ix = 0, iy = 1; i < count; ++i, ix += 2, iy += 2) {
            var new_point = new_points[i];
            points[ix] = new_point[0];
            points[iy] = new_point[1];
        }
        this._dirty_coords = true;
    };
    Polygon.prototype._calculateCoords = function () {
        var x = this.x;
        var y = this.y;
        var angle = this.angle;
        var scale_x = this.scale_x;
        var scale_y = this.scale_y;
        var points = this._points;
        var coords = this._coords;
        var count = points.length;
        var min_x;
        var max_x;
        var min_y;
        var max_y;
        for (var ix = 0, iy = 1; ix < count; ix += 2, iy += 2) {
            var coord_x = points[ix] * scale_x;
            var coord_y = points[iy] * scale_y;
            if (angle) {
                var cos = Math.cos(angle);
                var sin = Math.sin(angle);
                var tmp_x = coord_x;
                var tmp_y = coord_y;
                coord_x = tmp_x * cos - tmp_y * sin;
                coord_y = tmp_x * sin + tmp_y * cos;
            }
            coord_x += x;
            coord_y += y;
            coords[ix] = coord_x;
            coords[iy] = coord_y;
            if (ix === 0) {
                min_x = max_x = coord_x;
                min_y = max_y = coord_y;
            }
            else {
                if (coord_x < min_x) {
                    min_x = coord_x;
                }
                else if (coord_x > max_x) {
                    max_x = coord_x;
                }
                if (coord_y < min_y) {
                    min_y = coord_y;
                }
                else if (coord_y > max_y) {
                    max_y = coord_y;
                }
            }
        }
        this._x = x;
        this._y = y;
        this._angle = angle;
        this._scale_x = scale_x;
        this._scale_y = scale_y;
        this._min_x = min_x;
        this._min_y = min_y;
        this._max_x = max_x;
        this._max_y = max_y;
        this._dirty_coords = false;
        this._dirty_normals = true;
    };
    Polygon.prototype._calculateNormals = function () {
        var coords = this._coords;
        var edges = this._edges;
        var normals = this._normals;
        var count = coords.length;
        for (var ix = 0, iy = 1; ix < count; ix += 2, iy += 2) {
            var next = ix + 2 < count ? ix + 2 : 0;
            var x = coords[next] - coords[ix];
            var y = coords[next + 1] - coords[iy];
            var length_1 = x || y ? Math.sqrt(x * x + y * y) : 0;
            edges[ix] = x;
            edges[iy] = y;
            normals[ix] = length_1 ? y / length_1 : 0;
            normals[iy] = length_1 ? -x / length_1 : 0;
        }
        this._dirty_normals = false;
    };
    return Polygon;
}(Body));
var Point = (function (_super) {
    __extends(Point, _super);
    function Point(x, y, padding) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (padding === void 0) { padding = 0; }
        var _this = _super.call(this, x, y, [[0, 0]], 0, 1, 1, padding) || this;
        _this._point = true;
        return _this;
    }
    return Point;
}(Polygon));
Point.prototype.setPoints = undefined;
function SAT(a, b, result, aabb) {
    if (result === void 0) { result = null; }
    if (aabb === void 0) { aabb = true; }
    var a_polygon = a._polygon;
    var b_polygon = b._polygon;
    var collision = false;
    if (result) {
        result.a = a;
        result.b = b;
        result.a_in_b = true;
        result.b_in_a = true;
        result.overlap = null;
        result.overlap_x = 0;
        result.overlap_y = 0;
    }
    if (a_polygon) {
        if (a._dirty_coords ||
            a.x !== a._x ||
            a.y !== a._y ||
            a.angle !== a._angle ||
            a.scale_x !== a._scale_x ||
            a.scale_y !== a._scale_y) {
            a._calculateCoords();
        }
    }
    if (b_polygon) {
        if (b._dirty_coords ||
            b.x !== b._x ||
            b.y !== b._y ||
            b.angle !== b._angle ||
            b.scale_x !== b._scale_x ||
            b.scale_y !== b._scale_y) {
            b._calculateCoords();
        }
    }
    if (!aabb || aabbAABB(a, b)) {
        if (a_polygon && a._dirty_normals) {
            a._calculateNormals();
        }
        if (b_polygon && b._dirty_normals) {
            b._calculateNormals();
        }
        collision = (a_polygon && b_polygon ? polygonPolygon(a, b, result) :
            a_polygon ? polygonCircle(a, b, result, false) :
                b_polygon ? polygonCircle(b, a, result, true) :
                    circleCircle(a, b, result));
    }
    if (result) {
        result.collision = collision;
    }
    return collision;
}
;
function aabbAABB(a, b) {
    var a_polygon = a._polygon;
    var a_x = a_polygon ? 0 : a.x;
    var a_y = a_polygon ? 0 : a.y;
    var a_radius = a_polygon ? 0 : a.radius * a.scale;
    var a_min_x = a_polygon ? a._min_x : a_x - a_radius;
    var a_min_y = a_polygon ? a._min_y : a_y - a_radius;
    var a_max_x = a_polygon ? a._max_x : a_x + a_radius;
    var a_max_y = a_polygon ? a._max_y : a_y + a_radius;
    var b_polygon = b._polygon;
    var b_x = b_polygon ? 0 : b.x;
    var b_y = b_polygon ? 0 : b.y;
    var b_radius = b_polygon ? 0 : b.radius * b.scale;
    var b_min_x = b_polygon ? b._min_x : b_x - b_radius;
    var b_min_y = b_polygon ? b._min_y : b_y - b_radius;
    var b_max_x = b_polygon ? b._max_x : b_x + b_radius;
    var b_max_y = b_polygon ? b._max_y : b_y + b_radius;
    return a_min_x < b_max_x && a_min_y < b_max_y && a_max_x > b_min_x && a_max_y > b_min_y;
}
function polygonPolygon(a, b, result) {
    if (result === void 0) { result = null; }
    var a_count = a._coords.length;
    var b_count = b._coords.length;
    if (a_count === 2 && b_count === 2) {
        var a_coords_1 = a._coords;
        var b_coords_1 = b._coords;
        if (result) {
            result.overlap = 0;
        }
        return a_coords_1[0] === b_coords_1[0] && a_coords_1[1] === b_coords_1[1];
    }
    var a_coords = a._coords;
    var b_coords = b._coords;
    var a_normals = a._normals;
    var b_normals = b._normals;
    if (a_count > 2) {
        for (var ix = 0, iy = 1; ix < a_count; ix += 2, iy += 2) {
            if (separatingAxis(a_coords, b_coords, a_normals[ix], a_normals[iy], result)) {
                return false;
            }
        }
    }
    if (b_count > 2) {
        for (var ix = 0, iy = 1; ix < b_count; ix += 2, iy += 2) {
            if (separatingAxis(a_coords, b_coords, b_normals[ix], b_normals[iy], result)) {
                return false;
            }
        }
    }
    return true;
}
function polygonCircle(a, b, result, reverse) {
    if (result === void 0) { result = null; }
    if (reverse === void 0) { reverse = false; }
    var a_coords = a._coords;
    var a_edges = a._edges;
    var a_normals = a._normals;
    var b_x = b.x;
    var b_y = b.y;
    var b_radius = b.radius * b.scale;
    var b_radius2 = b_radius * 2;
    var radius_squared = b_radius * b_radius;
    var count = a_coords.length;
    var a_in_b = true;
    var b_in_a = true;
    var overlap = null;
    var overlap_x = 0;
    var overlap_y = 0;
    if (count === 2) {
        var coord_x = b_x - a_coords[0];
        var coord_y = b_y - a_coords[1];
        var length_squared = coord_x * coord_x + coord_y * coord_y;
        if (length_squared > radius_squared) {
            return false;
        }
        if (result) {
            var length_2 = Math.sqrt(length_squared);
            overlap = b_radius - length_2;
            overlap_x = coord_x / length_2;
            overlap_y = coord_y / length_2;
            b_in_a = false;
        }
    }
    else {
        for (var ix = 0, iy = 1; ix < count; ix += 2, iy += 2) {
            var coord_x = b_x - a_coords[ix];
            var coord_y = b_y - a_coords[iy];
            var edge_x = a_edges[ix];
            var edge_y = a_edges[iy];
            var dot = coord_x * edge_x + coord_y * edge_y;
            var region = dot < 0 ? -1 : dot > edge_x * edge_x + edge_y * edge_y ? 1 : 0;
            var tmp_overlapping = false;
            var tmp_overlap = 0;
            var tmp_overlap_x = 0;
            var tmp_overlap_y = 0;
            if (result && a_in_b && coord_x * coord_x + coord_y * coord_y > radius_squared) {
                a_in_b = false;
            }
            if (region) {
                var left = region === -1;
                var other_x = left ? (ix === 0 ? count - 2 : ix - 2) : (ix === count - 2 ? 0 : ix + 2);
                var other_y = other_x + 1;
                var coord2_x = b_x - a_coords[other_x];
                var coord2_y = b_y - a_coords[other_y];
                var edge2_x = a_edges[other_x];
                var edge2_y = a_edges[other_y];
                var dot2 = coord2_x * edge2_x + coord2_y * edge2_y;
                var region2 = dot2 < 0 ? -1 : dot2 > edge2_x * edge2_x + edge2_y * edge2_y ? 1 : 0;
                if (region2 === -region) {
                    var target_x = left ? coord_x : coord2_x;
                    var target_y = left ? coord_y : coord2_y;
                    var length_squared = target_x * target_x + target_y * target_y;
                    if (length_squared > radius_squared) {
                        return false;
                    }
                    if (result) {
                        var length_3 = Math.sqrt(length_squared);
                        tmp_overlapping = true;
                        tmp_overlap = b_radius - length_3;
                        tmp_overlap_x = target_x / length_3;
                        tmp_overlap_y = target_y / length_3;
                        b_in_a = false;
                    }
                }
            }
            else {
                var normal_x = a_normals[ix];
                var normal_y = a_normals[iy];
                var length_4 = coord_x * normal_x + coord_y * normal_y;
                var absolute_length = length_4 < 0 ? -length_4 : length_4;
                if (length_4 > 0 && absolute_length > b_radius) {
                    return false;
                }
                if (result) {
                    tmp_overlapping = true;
                    tmp_overlap = b_radius - length_4;
                    tmp_overlap_x = normal_x;
                    tmp_overlap_y = normal_y;
                    if (b_in_a && length_4 >= 0 || tmp_overlap < b_radius2) {
                        b_in_a = false;
                    }
                }
            }
            if (tmp_overlapping && (overlap === null || overlap > tmp_overlap)) {
                overlap = tmp_overlap;
                overlap_x = tmp_overlap_x;
                overlap_y = tmp_overlap_y;
            }
        }
    }
    if (result) {
        result.a_in_b = reverse ? b_in_a : a_in_b;
        result.b_in_a = reverse ? a_in_b : b_in_a;
        result.overlap = overlap;
        result.overlap_x = reverse ? -overlap_x : overlap_x;
        result.overlap_y = reverse ? -overlap_y : overlap_y;
    }
    return true;
}
function circleCircle(a, b, result) {
    if (result === void 0) { result = null; }
    var a_radius = a.radius * a.scale;
    var b_radius = b.radius * b.scale;
    var difference_x = b.x - a.x;
    var difference_y = b.y - a.y;
    var radius_sum = a_radius + b_radius;
    var length_squared = difference_x * difference_x + difference_y * difference_y;
    if (length_squared > radius_sum * radius_sum) {
        return false;
    }
    if (result) {
        var length_5 = Math.sqrt(length_squared);
        result.a_in_b = a_radius <= b_radius && length_5 <= b_radius - a_radius;
        result.b_in_a = b_radius <= a_radius && length_5 <= a_radius - b_radius;
        result.overlap = radius_sum - length_5;
        result.overlap_x = difference_x / length_5;
        result.overlap_y = difference_y / length_5;
    }
    return true;
}
function separatingAxis(a_coords, b_coords, x, y, result) {
    if (result === void 0) { result = null; }
    var a_count = a_coords.length;
    var b_count = b_coords.length;
    if (!a_count || !b_count) {
        return true;
    }
    var a_start = null;
    var a_end = null;
    var b_start = null;
    var b_end = null;
    for (var ix = 0, iy = 1; ix < a_count; ix += 2, iy += 2) {
        var dot = a_coords[ix] * x + a_coords[iy] * y;
        if (a_start === null || a_start > dot) {
            a_start = dot;
        }
        if (a_end === null || a_end < dot) {
            a_end = dot;
        }
    }
    for (var ix = 0, iy = 1; ix < b_count; ix += 2, iy += 2) {
        var dot = b_coords[ix] * x + b_coords[iy] * y;
        if (b_start === null || b_start > dot) {
            b_start = dot;
        }
        if (b_end === null || b_end < dot) {
            b_end = dot;
        }
    }
    if (a_start > b_end || a_end < b_start) {
        return true;
    }
    if (result) {
        var overlap = 0;
        if (a_start < b_start) {
            result.a_in_b = false;
            if (a_end < b_end) {
                overlap = a_end - b_start;
                result.b_in_a = false;
            }
            else {
                var option1 = a_end - b_start;
                var option2 = b_end - a_start;
                overlap = option1 < option2 ? option1 : -option2;
            }
        }
        else {
            result.b_in_a = false;
            if (a_end > b_end) {
                overlap = a_start - b_end;
                result.a_in_b = false;
            }
            else {
                var option1 = a_end - b_start;
                var option2 = b_end - a_start;
                overlap = option1 < option2 ? option1 : -option2;
            }
        }
        var current_overlap = result.overlap;
        var absolute_overlap = overlap < 0 ? -overlap : overlap;
        if (current_overlap === null || current_overlap > absolute_overlap) {
            var sign = overlap < 0 ? -1 : 1;
            result.overlap = absolute_overlap;
            result.overlap_x = x * sign;
            result.overlap_y = y * sign;
        }
    }
    return false;
}
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var JetcodeSocket = (function () {
    function JetcodeSocket(socketUrl) {
        if (socketUrl === void 0) { socketUrl = 'ws://localhost:17500'; }
        this.socketUrl = socketUrl;
        this.socket = null;
        this.defaultParameters = {
            'LobbyAutoCreate': true,
            'MaxMembers': 2,
            'MinMembers': 2,
            'StartGameWithMembers': 2
        };
    }
    JetcodeSocket.prototype.connect = function (gameToken, lobbyId, inParameters) {
        var _this = this;
        if (lobbyId === void 0) { lobbyId = null; }
        if (inParameters === void 0) { inParameters = {}; }
        var parameters = __assign(__assign({}, this.defaultParameters), inParameters);
        return new Promise(function (resolve, reject) {
            _this.socket = new WebSocket(_this.socketUrl);
            _this.socket.onopen = function () {
                var connection = new JetcodeSocketConnection(_this.socket, gameToken, lobbyId);
                connection.joinLobby(gameToken, lobbyId, parameters)
                    .then(function () {
                    resolve(connection);
                })
                    .catch(reject);
            };
            _this.socket.onerror = function (error) {
                reject(error);
            };
        });
    };
    JetcodeSocket.JOIN_LOBBY = 'JOIN_LOBBY';
    JetcodeSocket.LEAVE_LOBBY = 'LEAVE_LOBBY';
    JetcodeSocket.SEND_DATA = 'SEND_DATA';
    JetcodeSocket.JOINED = 'JOINED';
    JetcodeSocket.RECEIVE_DATA = 'RECEIVE_DATA';
    JetcodeSocket.MEMBER_JOINED = 'MEMBER_JOINED';
    JetcodeSocket.MEMBER_LEFT = 'MEMBER_LEFT';
    JetcodeSocket.GAME_STARTED = 'GAME_STARTED';
    JetcodeSocket.GAME_STOPPED = 'GAME_STOPPED';
    JetcodeSocket.ERROR = 'ERROR';
    return JetcodeSocket;
}());
var JetcodeSocketConnection = (function () {
    function JetcodeSocketConnection(socket, gameToken, lobbyId) {
        if (lobbyId === void 0) { lobbyId = 0; }
        this.connectActions = [
            JetcodeSocket.JOINED,
            JetcodeSocket.RECEIVE_DATA,
            JetcodeSocket.MEMBER_JOINED,
            JetcodeSocket.MEMBER_LEFT,
            JetcodeSocket.GAME_STARTED,
            JetcodeSocket.GAME_STOPPED,
            JetcodeSocket.ERROR
        ];
        this.socket = socket;
        this.lobbyId = lobbyId;
        this.memberId = null;
        this.connects = {};
        this._listenSocket();
    }
    JetcodeSocketConnection.prototype._listenSocket = function () {
        var _this = this;
        this.socket.onmessage = function (event) {
            var _a = __read(_this._parse(event.data), 3), action = _a[0], parameters = _a[1], value = _a[2];
            if (action === JetcodeSocket.RECEIVE_DATA) {
                _this.emit(JetcodeSocket.RECEIVE_DATA, [value, parameters, (parameters === null || parameters === void 0 ? void 0 : parameters.MemberId) === _this.memberId]);
            }
            else if (action === JetcodeSocket.MEMBER_JOINED) {
                _this.emit(JetcodeSocket.MEMBER_JOINED, [parameters, (parameters === null || parameters === void 0 ? void 0 : parameters.MemberId) === _this.memberId]);
            }
            else if (action === JetcodeSocket.MEMBER_LEFT) {
                _this.emit(JetcodeSocket.MEMBER_LEFT, [parameters, (parameters === null || parameters === void 0 ? void 0 : parameters.MemberId) === _this.memberId]);
            }
            else if (_this.connects[action]) {
                _this.emit(action, [parameters]);
            }
        };
    };
    JetcodeSocketConnection.prototype.emit = function (action, args) {
        if (this.connects[action]) {
            this.connects[action].forEach(function (callback) {
                callback.apply(void 0, __spreadArray([], __read(args), false));
            });
        }
    };
    JetcodeSocketConnection.prototype.connect = function (action, callback) {
        if (!this.connectActions.includes(action)) {
            throw new Error('This actions is not defined.');
        }
        if (!this.connects[action]) {
            this.connects[action] = [];
        }
        this.connects[action].push(callback);
        return callback;
    };
    JetcodeSocketConnection.prototype.disconnect = function (action, callback) {
        if (!this.connectActions.includes(action)) {
            throw new Error('This action is not defined.');
        }
        if (!this.connects[action]) {
            return;
        }
        this.connects[action] = this.connects[action].filter(function (cb) { return cb !== callback; });
    };
    JetcodeSocketConnection.prototype.sendData = function (value, parameters) {
        var e_34, _a;
        if (parameters === void 0) { parameters = {}; }
        if (!this.lobbyId) {
            throw new Error('You are not in the lobby!');
        }
        var request = "".concat(JetcodeSocket.SEND_DATA, "\n");
        try {
            for (var _b = __values(Object.entries(parameters)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value_1 = _d[1];
                request += key + '=' + value_1 + '\n';
            }
        }
        catch (e_34_1) { e_34 = { error: e_34_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_34) throw e_34.error; }
        }
        request += "SendTime=".concat(Date.now(), "\n");
        request += '\n' + value;
        this.socket.send(request);
    };
    JetcodeSocketConnection.prototype.joinLobby = function (gameToken, lobbyId, parameters) {
        var _this = this;
        if (parameters === void 0) { parameters = {}; }
        return new Promise(function (resolve, reject) {
            var e_35, _a;
            if (!lobbyId) {
                lobbyId = 0;
            }
            var request = "".concat(JetcodeSocket.JOIN_LOBBY, "\n");
            request += "GameToken=".concat(gameToken, "\n");
            request += "LobbyId=".concat(lobbyId, "\n");
            try {
                for (var _b = __values(Object.entries(parameters)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                    request += "".concat(key, "=").concat(value, "\n");
                }
            }
            catch (e_35_1) { e_35 = { error: e_35_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_35) throw e_35.error; }
            }
            _this.socket.send(request);
            _this.connect(JetcodeSocket.JOINED, function (responseParams) {
                if (responseParams.LobbyId && responseParams.MemberId && responseParams.CurrentTime) {
                    _this.lobbyId = responseParams.LobbyId;
                    _this.memberId = responseParams.MemberId;
                    var currentTimeMs = Date.now();
                    _this.deltaTime = currentTimeMs - Number(responseParams.CurrentTime);
                    resolve(_this.lobbyId);
                }
                else {
                    reject(new Error("Couldn't join the lobby"));
                }
            });
        });
    };
    JetcodeSocketConnection.prototype.leaveLobby = function () {
        if (!this.lobbyId) {
            return;
        }
        var request = "".concat(JetcodeSocket.LEAVE_LOBBY, "\nLobbyId=").concat(this.lobbyId, "\n");
        this.socket.send(request);
        this.lobbyId = null;
    };
    JetcodeSocketConnection.prototype._parse = function (data) {
        var parsable = data.split('\n');
        var action = parsable[0];
        var value = '';
        var parameters = [];
        var nextIs = 'parameters';
        for (var i = 1; i < parsable.length; i++) {
            var line = parsable[i];
            if (line === '' && nextIs === 'parameters') {
                nextIs = 'value';
            }
            else if (nextIs === 'parameters') {
                var splitted = line.split('=');
                var parameter = splitted[0];
                parameters[parameter] = splitted.length > 1 ? splitted[1] : null;
            }
            else if (nextIs === 'value') {
                value = value + line + "\n";
            }
        }
        if (value) {
            value = value.slice(0, -1);
        }
        return [action, parameters, value];
    };
    return JetcodeSocketConnection;
}());
var ErrorMessages = (function () {
    function ErrorMessages() {
    }
    ErrorMessages.getMessage = function (messageId, locale, variables) {
        if (variables === void 0) { variables = null; }
        if (!ErrorMessages.messages[messageId]) {
            throw new Error('Message is not defined.');
        }
        if (!ErrorMessages.messages[messageId][locale]) {
            throw new Error('Message for this locale is not defined.');
        }
        var message = ErrorMessages.messages[messageId][locale];
        if (variables) {
            message = ErrorMessages.replaceVariables(message, variables);
        }
        return message;
    };
    ErrorMessages.replaceVariables = function (message, variables) {
        return message.replace(/\${([^}]+)}/g, function (match, key) {
            return variables[key] || '';
        });
    };
    ErrorMessages.SCRIPT_ERROR = 'script_error';
    ErrorMessages.MISTAKE_METHOD = 'mistake_method';
    ErrorMessages.MISTAKE_METHOD_WITH_CLOSEST = 'mistake_method_with_closest';
    ErrorMessages.NEED_STAGE_BEFORE_RUN_GAME = 'need_stage_before_run_game';
    ErrorMessages.NEED_CREATE_STAGE_BEFORE_SPRITE = 'need_create_stage_before_sprite';
    ErrorMessages.COSTUME_NOT_LOADED = 'costume_not_loaded';
    ErrorMessages.BACKGROUND_NOT_LOADED = 'background_not_loaded';
    ErrorMessages.CLONED_NOT_READY = 'cloned_not_ready';
    ErrorMessages.SOUND_INDEX_NOT_FOUND = 'sound_index_not_found';
    ErrorMessages.SOUND_NAME_NOT_FOUND = 'sound_name_not_found';
    ErrorMessages.COSTUME_NAME_NOT_FOUND = 'costume_name_not_found';
    ErrorMessages.messages = {
        script_error: {
            'ru': 'Произошла ошибка, ознакомьтесь с подробной информацией в консоли.',
            'en': 'An error has occurred, take a look at the details in the console.'
        },
        mistake_method: {
            'ru': '${className}: Метод или свойство "${prop}" не найдено',
            'en': '${className}: Method "${prop}" not found'
        },
        mistake_method_with_closest: {
            'ru': '${className}: Метод или свойство "${prop}" не найдено. Возможно вы имели ввиду: ${closestString}?',
            'en': '${className}: Method "${prop}" not found. Did you mean: ${closestString}?'
        },
        need_stage_before_run_game: {
            'ru': 'Вам нужно создать экземпляр Stage перед запуском игры.',
            'en': 'You need create Stage instance before run game.'
        },
        need_create_stage_before_sprite: {
            'ru': 'Вам нужно создать экземпляр класса Stage перед экземпляром класса Sprite.',
            'en': 'You need create Stage instance before Sprite instance.'
        },
        costume_not_loaded: {
            'ru': 'Изображение для костюма "${costumePath}" не было загружено. Проверьте правильность пути.',
            'en': 'Costume image "${costumePath}" was not loaded. Check that the path is correct.'
        },
        background_not_loaded: {
            'ru': 'Изображение для фона "${backgroundPath}" не было загружено. Проверьте правильность пути.',
            'en': 'Background image "${backgroundPath}" was not loaded. Check that the path is correct.'
        },
        cloned_not_ready: {
            'ru': 'Спрайт не может быть клонирован, потому что он еще не готов. Попробуйте использовать метод sprite.onReady()',
            'en': 'Sprite cannot be cloned because one is not ready. Try using the sprite.onReady() method.'
        },
        sound_index_not_found: {
            'ru': 'Звук с индексом "${soundIndex}" не найден.',
            'en': 'Sound with index "${soundIndex}" not found.'
        },
        sound_name_not_found: {
            'ru': 'Звук с именем "${soundName}" не найден.',
            'en': 'Sound with name "${soundName}" not found.'
        },
        costume_name_not_found: {
            'ru': 'Костуюм с именем "${costumeName}" не найден.',
            'en': 'Costume with name "${costumeName}" not found.'
        }
    };
    return ErrorMessages;
}());
var Keyboard = (function () {
    function Keyboard() {
        var _this = this;
        this.keys = {};
        document.addEventListener('keydown', function (event) {
            var char = KeyboardMap.getChar(event.keyCode);
            _this.keys[char] = true;
        });
        document.addEventListener('keyup', function (event) {
            var char = KeyboardMap.getChar(event.keyCode);
            delete _this.keys[char];
        });
    }
    Keyboard.prototype.keyPressed = function (char) {
        return this.keys[char.toUpperCase()] !== undefined;
    };
    Keyboard.prototype.keyDown = function (char, callback) {
        document.addEventListener('keydown', function (event) {
            var pressedChar = KeyboardMap.getChar(event.keyCode);
            if (char.toUpperCase() == pressedChar) {
                callback(event);
            }
        });
    };
    Keyboard.prototype.keyUp = function (char, callback) {
        document.addEventListener('keyup', function (event) {
            var pressedChar = KeyboardMap.getChar(event.keyCode);
            if (char.toUpperCase() == pressedChar) {
                callback(event);
            }
        });
    };
    return Keyboard;
}());
var Mouse = (function () {
    function Mouse(game) {
        var _this = this;
        this.x = 0;
        this.y = 0;
        this.isDown = false;
        document.addEventListener('mousedown', function () {
            _this.isDown = true;
            _this.lastStage = game.getActiveStage();
        });
        document.addEventListener('mouseup', function () {
            _this.isDown = false;
        });
        document.addEventListener('mousemove', function (e) {
            _this.x = game.correctMouseX(e.clientX);
            _this.y = game.correctMouseY(e.clientY);
        });
        this.point = new Point(this.x, this.y);
    }
    Mouse.prototype.getPoint = function () {
        this.point.x = this.x;
        this.point.y = this.y;
        return this.point;
    };
    Mouse.prototype.isMouseDown = function (stage) {
        return this.isDown && stage === this.lastStage;
    };
    Mouse.prototype.clearMouseDown = function () {
        this.isDown = false;
    };
    return Mouse;
}());
var Registry = (function () {
    function Registry() {
        this.data = {};
    }
    Registry.getInstance = function () {
        if (!this.instance) {
            this.instance = new Registry();
        }
        return this.instance;
    };
    Registry.prototype.set = function (name, value) {
        this.data[name] = value;
    };
    Registry.prototype.has = function (name) {
        return this.data[name] !== undefined;
    };
    Registry.prototype.get = function (name) {
        return this.data[name];
    };
    return Registry;
}());
var Styles = (function () {
    function Styles(canvas, width, height) {
        var _this = this;
        this.canvas = canvas;
        this.setEnvironmentStyles();
        this.setCanvasSize(width, height);
        this.canvasRect = canvas.getBoundingClientRect();
        window.addEventListener('resize', function () {
            _this.setCanvasSize(width, height);
            _this.canvasRect = canvas.getBoundingClientRect();
        });
    }
    Styles.prototype.setEnvironmentStyles = function () {
        document.body.style.margin = '0';
        document.body.style.height = '100' + 'vh';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
    };
    Styles.prototype.setCanvasSize = function (width, height) {
        this.canvas.width = width ? width : document.body.clientWidth;
        this.canvas.height = height ? height : document.body.clientHeight;
    };
    return Styles;
}());
var ValidatorFactory = (function () {
    function ValidatorFactory(game) {
        this.game = game;
    }
    ValidatorFactory.prototype.createValidator = function (target, className) {
        var game = this.game;
        return new Proxy(target, {
            get: function (obj, prop) {
                if (prop in obj) {
                    return obj[prop];
                }
                if (typeof prop === 'symbol' || prop.startsWith('_')) {
                    return undefined;
                }
                var methods = Object.getOwnPropertyNames(Object.getPrototypeOf(obj))
                    .filter(function (m) { return m !== 'constructor'; });
                var closest = ValidatorFactory.findClosestMethods(prop.toString(), methods);
                if (closest.length) {
                    var closestString = closest.join(', ');
                    game.throwError(ErrorMessages.MISTAKE_METHOD_WITH_CLOSEST, { className: className, prop: prop, closestString: closestString });
                }
                else {
                    game.throwError(ErrorMessages.MISTAKE_METHOD, { className: className, prop: prop });
                }
            }
        });
    };
    ValidatorFactory.findClosestMethods = function (input, methods, maxDistance) {
        if (maxDistance === void 0) { maxDistance = 2; }
        return methods
            .map(function (method) { return ({
            name: method,
            distance: ValidatorFactory.levenshteinDistance(input.toLowerCase(), method.toLowerCase())
        }); })
            .filter(function (_a) {
            var distance = _a.distance;
            return distance <= maxDistance;
        })
            .sort(function (a, b) { return a.distance - b.distance; })
            .map(function (_a) {
            var name = _a.name;
            return name;
        })
            .slice(0, 3);
    };
    ValidatorFactory.levenshteinDistance = function (a, b) {
        var matrix = Array(a.length + 1)
            .fill(null)
            .map(function () { return Array(b.length + 1).fill(0); });
        for (var i = 0; i <= a.length; i++)
            matrix[i][0] = i;
        for (var j = 0; j <= b.length; j++)
            matrix[0][j] = j;
        for (var i = 1; i <= a.length; i++) {
            for (var j = 1; j <= b.length; j++) {
                var cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
            }
        }
        return matrix[a.length][b.length];
    };
    return ValidatorFactory;
}());
//# sourceMappingURL=scrub.js.map