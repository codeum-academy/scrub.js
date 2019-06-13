class Keyboard {
    keys = {};

    keyboardMap = [
        "", // [0]
        "", // [1]
        "", // [2]
        "CANCEL", // [3]
        "", // [4]
        "", // [5]
        "HELP", // [6]
        "", // [7]
        "BACK_SPACE", // [8]
        "TAB", // [9]
        "", // [10]
        "", // [11]
        "CLEAR", // [12]
        "ENTER", // [13]
        "ENTER_SPECIAL", // [14]
        "", // [15]
        "SHIFT", // [16]
        "CONTROL", // [17]
        "ALT", // [18]
        "PAUSE", // [19]
        "CAPS_LOCK", // [20]
        "KANA", // [21]
        "EISU", // [22]
        "JUNJA", // [23]
        "FINAL", // [24]
        "HANJA", // [25]
        "", // [26]
        "ESCAPE", // [27]
        "CONVERT", // [28]
        "NONCONVERT", // [29]
        "ACCEPT", // [30]
        "MODECHANGE", // [31]
        "SPACE", // [32]
        "PAGE_UP", // [33]
        "PAGE_DOWN", // [34]
        "END", // [35]
        "HOME", // [36]
        "LEFT", // [37]
        "UP", // [38]
        "RIGHT", // [39]
        "DOWN", // [40]
        "SELECT", // [41]
        "PRINT", // [42]
        "EXECUTE", // [43]
        "PRINTSCREEN", // [44]
        "INSERT", // [45]
        "DELETE", // [46]
        "", // [47]
        "0", // [48]
        "1", // [49]
        "2", // [50]
        "3", // [51]
        "4", // [52]
        "5", // [53]
        "6", // [54]
        "7", // [55]
        "8", // [56]
        "9", // [57]
        "COLON", // [58]
        "SEMICOLON", // [59]
        "LESS_THAN", // [60]
        "EQUALS", // [61]
        "GREATER_THAN", // [62]
        "QUESTION_MARK", // [63]
        "AT", // [64]
        "A", // [65]
        "B", // [66]
        "C", // [67]
        "D", // [68]
        "E", // [69]
        "F", // [70]
        "G", // [71]
        "H", // [72]
        "I", // [73]
        "J", // [74]
        "K", // [75]
        "L", // [76]
        "M", // [77]
        "N", // [78]
        "O", // [79]
        "P", // [80]
        "Q", // [81]
        "R", // [82]
        "S", // [83]
        "T", // [84]
        "U", // [85]
        "V", // [86]
        "W", // [87]
        "X", // [88]
        "Y", // [89]
        "Z", // [90]
        "OS_KEY", // [91] Windows Key (Windows) or Command Key (Mac)
        "", // [92]
        "CONTEXT_MENU", // [93]
        "", // [94]
        "SLEEP", // [95]
        "NUMPAD0", // [96]
        "NUMPAD1", // [97]
        "NUMPAD2", // [98]
        "NUMPAD3", // [99]
        "NUMPAD4", // [100]
        "NUMPAD5", // [101]
        "NUMPAD6", // [102]
        "NUMPAD7", // [103]
        "NUMPAD8", // [104]
        "NUMPAD9", // [105]
        "MULTIPLY", // [106]
        "ADD", // [107]
        "SEPARATOR", // [108]
        "SUBTRACT", // [109]
        "DECIMAL", // [110]
        "DIVIDE", // [111]
        "F1", // [112]
        "F2", // [113]
        "F3", // [114]
        "F4", // [115]
        "F5", // [116]
        "F6", // [117]
        "F7", // [118]
        "F8", // [119]
        "F9", // [120]
        "F10", // [121]
        "F11", // [122]
        "F12", // [123]
        "F13", // [124]
        "F14", // [125]
        "F15", // [126]
        "F16", // [127]
        "F17", // [128]
        "F18", // [129]
        "F19", // [130]
        "F20", // [131]
        "F21", // [132]
        "F22", // [133]
        "F23", // [134]
        "F24", // [135]
        "", // [136]
        "", // [137]
        "", // [138]
        "", // [139]
        "", // [140]
        "", // [141]
        "", // [142]
        "", // [143]
        "NUM_LOCK", // [144]
        "SCROLL_LOCK", // [145]
        "WIN_OEM_FJ_JISHO", // [146]
        "WIN_OEM_FJ_MASSHOU", // [147]
        "WIN_OEM_FJ_TOUROKU", // [148]
        "WIN_OEM_FJ_LOYA", // [149]
        "WIN_OEM_FJ_ROYA", // [150]
        "", // [151]
        "", // [152]
        "", // [153]
        "", // [154]
        "", // [155]
        "", // [156]
        "", // [157]
        "", // [158]
        "", // [159]
        "CIRCUMFLEX", // [160]
        "EXCLAMATION", // [161]
        "DOUBLE_QUOTE", // [162]
        "HASH", // [163]
        "DOLLAR", // [164]
        "PERCENT", // [165]
        "AMPERSAND", // [166]
        "UNDERSCORE", // [167]
        "OPEN_PAREN", // [168]
        "CLOSE_PAREN", // [169]
        "ASTERISK", // [170]
        "PLUS", // [171]
        "PIPE", // [172]
        "HYPHEN_MINUS", // [173]
        "OPEN_CURLY_BRACKET", // [174]
        "CLOSE_CURLY_BRACKET", // [175]
        "TILDE", // [176]
        "", // [177]
        "", // [178]
        "", // [179]
        "", // [180]
        "VOLUME_MUTE", // [181]
        "VOLUME_DOWN", // [182]
        "VOLUME_UP", // [183]
        "", // [184]
        "", // [185]
        "SEMICOLON", // [186]
        "EQUALS", // [187]
        "COMMA", // [188]
        "MINUS", // [189]
        "PERIOD", // [190]
        "SLASH", // [191]
        "BACK_QUOTE", // [192]
        "", // [193]
        "", // [194]
        "", // [195]
        "", // [196]
        "", // [197]
        "", // [198]
        "", // [199]
        "", // [200]
        "", // [201]
        "", // [202]
        "", // [203]
        "", // [204]
        "", // [205]
        "", // [206]
        "", // [207]
        "", // [208]
        "", // [209]
        "", // [210]
        "", // [211]
        "", // [212]
        "", // [213]
        "", // [214]
        "", // [215]
        "", // [216]
        "", // [217]
        "", // [218]
        "OPEN_BRACKET", // [219]
        "BACK_SLASH", // [220]
        "CLOSE_BRACKET", // [221]
        "QUOTE", // [222]
        "", // [223]
        "META", // [224]
        "ALTGR", // [225]
        "", // [226]
        "WIN_ICO_HELP", // [227]
        "WIN_ICO_00", // [228]
        "", // [229]
        "WIN_ICO_CLEAR", // [230]
        "", // [231]
        "", // [232]
        "WIN_OEM_RESET", // [233]
        "WIN_OEM_JUMP", // [234]
        "WIN_OEM_PA1", // [235]
        "WIN_OEM_PA2", // [236]
        "WIN_OEM_PA3", // [237]
        "WIN_OEM_WSCTRL", // [238]
        "WIN_OEM_CUSEL", // [239]
        "WIN_OEM_ATTN", // [240]
        "WIN_OEM_FINISH", // [241]
        "WIN_OEM_COPY", // [242]
        "WIN_OEM_AUTO", // [243]
        "WIN_OEM_ENLW", // [244]
        "WIN_OEM_BACKTAB", // [245]
        "ATTN", // [246]
        "CRSEL", // [247]
        "EXSEL", // [248]
        "EREOF", // [249]
        "PLAY", // [250]
        "ZOOM", // [251]
        "", // [252]
        "PA1", // [253]
        "WIN_OEM_CLEAR", // [254]
        "" // [255]
    ];

    constructor() {
        document.addEventListener('keydown', (event) => {
            const char = this.keyboardMap[event.keyCode];

            this.keys[char] = true;
        });

        document.addEventListener('keyup', (event) => {
            const char = this.keyboardMap[event.keyCode];

            delete this.keys[char]
        });
    }

    keyPressed(char) {
        return this.keys[char.toUpperCase()] !== undefined;
    }
}

class Mouse {
    x = 0;
    y = 0;
    isDown = false;

    constructor() {
        document.addEventListener('mousedown', () => {
            this.isDown = true;
        });

        document.addEventListener('mouseup', () => {
            this.isDown = false;
        });

        document.addEventListener('mousemove', (e) => {
            this.x = e.clientX;
            this.y = e.clientY;
        });
    }
}

class Styles {
    canvas;

    constructor(canvas, width, height) {
        this.canvas = canvas;

        this.setEnvironmentStyles();

        this.setCanvasSize(width, height);
        window.addEventListener('resize', () => {
            this.setCanvasSize(width, height);
        });
    }

    setEnvironmentStyles() {
        document.body.style.margin = 0;
        document.body.style.height = 100 + "vh";
        document.body.style.padding = 0;
        document.body.style.overflow = 'hidden';
    }

    setCanvasSize(width, height) {
        this.canvas.width = width ? width : document.body.clientWidth;
        this.canvas.height = height ? height : document.body.clientHeight;
    }
}

class Registry {
    instance = null;
    data = {};

    static getInstance() {
        if (!this.instance) {
            this.instance = new Registry();
        }

        return this.instance;
    }

    set(name, value) {
        this.data[name] = value;
    }

    has(name) {
        return this.data[name] !== undefined;
    }

    get(name) {
        return this.data[name];
    }
}

class Costume {
    image;
    width;
    height;
}

class Sprite {
    name = 'No name';
    x = 0;
    y = 0;
    dir = 0;
    size = 100;
    // 'normal', 'leftRight', 'none'
    rotateStyle = 'normal';
    hidden = false;
    costumeIndex = null;
    costume = null;
    stage;
    costumes = [];
    costumeNames = [];
    sounds = [];
    deleted = false;

    phrase;
    phraseLiveTime = null;

    constructor(costumePaths = [], soundPaths = []) {
        if (!Registry.getInstance().has('stage')) {
            throw new Error('You need create stage before sprite.');
        }

        this.stage = Registry.getInstance().get('stage');
        this.stage.addSprite(this);

        this.x = this.stage.width / 2;
        this.y = this.stage.height / 2;

        for (const costumePath of costumePaths) {
            this.addCostume(costumePath);
        }

        for (const soundPath of soundPaths) {
            this.addSound(soundPath);
        }
    }

    addCostume(costumePath, name = null) {
        const costume = new Costume();

        const image = new Image();
        image.src = costumePath;

        costume.image = image;
        image.onload = function() {
            costume.width = this.width;
            costume.height = this.height;
        };

        this.costumes.push(costume);

        if (!name) {
            const costumeIndex = this.costumes.length - 1;
            name = 'no name ' + costumeIndex;
        }

        this.costumeNames.push(name);

        if (this.costume === null) {
            this.switchCostume(0);
        }
    }

    switchCostume(costumeIndex) {
        this.costumeIndex = costumeIndex;
        const costume = this.costumes[costumeIndex];

        if (costume instanceof Costume) {
            this.costume = costume;
        }
    }

    switchCostumeByName(costumeName) {
        const costumeIndex = this.costumeNames.indexOf(costumeName);

        if (costumeIndex > -1) {
            this.switchCostume(costumeIndex);

        } else {
            throw new Error('Name ' + costumeName +  'not found.');
        }
    }

    nextCostume() {
        let nextCostume = this.costumeIndex + 1;

        if (nextCostume > this.costumes.length - 1) {
            nextCostume = 0;
        }

        this.switchCostume(nextCostume);
    }

    createSound(soundPath) {
        const sound = new Audio();
        sound.src = soundPath;

        this.sounds.push(sound);
    }

    playSound(soundIndex) {
        const sound = this.sounds[soundIndex];

        if (sound instanceof Audio) {
            sound.play();
        }
    }

    move(steps) {
        this.x += (steps * Math.sin(this.direction * Math.PI / 180));
        this.y -= (steps * Math.cos(this.direction * Math.PI / 180));
    }

    bounceOnEdge() {
        if(this.realY < 0 + this.stage.padding || this.realY + this.height > this.stage.height - this.stage.padding) {
            this.direction = 180 - this.direction;
        }
        if (this.realX < 0 + this.stage.padding || this.realX + this.width > this.stage.width - this.stage.padding) {
            this.direction *= -1;
        }
    }

    touchSprite(sprite) {
        if (sprite.hidden) {
            return false;
        }

        const touch =
            this.realX + this.width > sprite.realX && this.realX < sprite.realX + sprite.width &&
            this.realY + this.height > sprite.realY && this.realY < sprite.realY + sprite.height
        ;

        return touch;
    }

    touchEdge() {
        const touch =
            this.realX < 0 + this.stage.padding ||
            this.realX + this.width > this.stage.width - this.stage.padding - this.stage.padding ||
            this.realY < 0 + this.stage.padding ||
            this.realY + this.height > this.stage.height - this.stage.padding - this.stage.padding
        ;

        return touch;
    }

    touchMouse() {
        const touch =
            this.stage.mouse.x > this.realX &&
            this.stage.mouse.x < this.realX + this.width &&
            this.stage.mouse.y > this.realY &&
            this.stage.mouse.y < this.realY + this.height
        ;

        return touch;
    }

    pointForward(sprite) {
        this.direction = (Math.atan2(this.y - sprite.y , this.x - sprite.x) / Math.PI * 180) - 90
    }

    getDistanceTo(sprite) {
        return Math.sqrt((Math.abs(this.x - sprite.x)) + (Math.abs(this.y - sprite.y)));
    }

    say(text, time = null) {
        this.phrase = this.name + ': ' + text;

        this.phraseLiveTime = null;
        if (time) {
            const currentTime = (new Date()).getTime();
            this.phraseLiveTime = currentTime + time;
        }
    }

    getPhrase() {
        if (this.phrase) {
            if (this.phraseLiveTime === null) {
                return this.phrase;
            }

            const currentTime = (new Date()).getTime();
            if (this.phraseLiveTime > currentTime) {
                return this.phrase;

            } else {
                this.phrase = null;
                this.phraseLiveTime = null;
            }
        }

        return null;
    }

    // TODO Переделать клонирование
    cloneSprite() {
        const clone = new Sprite();

        clone.x = this.x;
        clone.y = this.y;
        clone.direction = this.direction;
        clone.size = this.size;
        clone.hidden = this.hidden;
        clone.costume = this.costume;
        clone.costumeIndex = this.costumeIndex;
        clone.costumes = this.costumes;

        return clone;
    }

    forever(callback, timeout = null) {
        const result = callback(this);

        if (result !== false && !this.deleted) {
            if (timeout) {
                setTimeout(() => {
                    requestAnimationFrame(() => this.forever(callback, timeout));
                }, timeout);

            } else {
                requestAnimationFrame(() => this.forever(callback));
            }
        }
    }

    delete() {
        this.stage.deleteSprite(this);
        this.deleted = true;
    }

    set direction (d) {
        if ((d * 0) !== 0) return; // d is +/-Infinity or NaN
        d = d % 360;
        if (d < 0) d += 360;
        this.dir = (d > 360) ? d - 360 : d;
    }

    get direction() {
        return this.dir;
    }

    get width() {
        if (this.costume) {
            return this.costume.width * this.size / 100;
        }

        return null;
    }

    get height() {
        if (this.costume) {
            return this.costume.height * this.size / 100;
        }

        return null;
    }

    get realX() {
        return this.x - this.width / 2;
    }

    get realY() {
        return this.y - this.height / 2;
    }
}

class Stage {
    canvas;
    context;
    backgroundColor;
    background = null;
    backgroundIndex = null;
    backgrounds = [];
    sprites = [];
    drawing;
    keyboard;
    mouse;
    styles;
    padding = 0;
    // none, hover, forever;
    debugMode = "none";

    constructor(canvasId = null, width = null, height = null, background = null) {
        this.keyboard = new Keyboard();
        this.mouse = new Mouse();

        if (canvasId) {
            this.canvas = document.getElementById(canvasId);

        } else {
            this.canvas = document.createElement('canvas');
            document.body.appendChild(this.canvas);
        }

        this.canvas.width  = width;
        this.canvas.height = height;

        this.styles = new Styles(this.canvas, width, height);

        this.context = this.canvas.getContext('2d');

        if (background) {
            this.addBackground(background);
        }

        Registry.getInstance().set('stage', this);
    }

    get width() {
        return this.canvas.width;
    }

    get height() {
        return this.canvas.height;
    }

    addSprite(sprite) {
        this.sprites.push(sprite);
    }

    deleteSprite(sprite) {
        this.sprites.splice(this.sprites.indexOf(sprite), 1);
    }

    addBackground(backgroundPath) {
        const background = new Image();
        background.src = backgroundPath;

        this.backgrounds.push(background);

        if (this.backgroundIndex === null) {
            this.switchBackground(0);
        }
    }

    switchBackground(backgroundIndex) {
        this.backgroundIndex = backgroundIndex;
        const background = this.backgrounds[backgroundIndex];

        if (background) {
            this.background = background;
        }
    }

    drawImage(image, x, y, w, h, direction, rotateStyle){
        if (rotateStyle === 'normal' && direction !== 0) {
            this.context.save();
            this.context.translate(x+w/2, y+h/2);
            this.context.rotate(direction * Math.PI / 180);
            this.context.translate(-x-w/2, -y-h/2);
        }

        if (rotateStyle === 'leftRight' && direction > 180) {
            this.context.save();
            this.context.translate(x + w / 2, 0);
            this.context.scale(-1, 1);

            // mirror image
            this.context.drawImage(image, -w / 2, y, w, h);

        } else {
            // usual image
            this.context.drawImage(image, x, y, w, h);
        }

        if (rotateStyle === 'normal' && direction !== 0 || rotateStyle === 'leftRight' && direction > 180) {
            this.context.restore();
        }
    }

    pen(callback) {
        this.drawing = callback;
    }

    keyPressed(char) {
        return this.keyboard.keyPressed(char);
    }

    mouseDown() {
        return this.mouse.isDown;
    }

    getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    render() {
        this.context.clearRect(0, 0, this.width, this.height);

        if (this.backgroundColor) {
            this.context.fillStyle = this.backgroundColor;
            this.context.fillRect(0, 0, this.width, this.height);
        }

        if (this.background) {
            this.context.drawImage(this.background, 0, 0, this.width, this.height);
        }

        if (this.drawing) {
            this.drawing(this.context);
        }

        for (const sprite of this.sprites) {
            if (sprite.hidden || !sprite.costume) {
                continue;
            }

            if (this.debugMode !== 'none') {
                const fn = () => {
                    const x = sprite.x - (this.context.measureText(sprite.name).width / 2);
                    let y = sprite.realY + sprite.height + 20;

                    this.context.font = '16px Arial';
                    this.context.fillStyle = 'black';
                    this.context.fillText(sprite.name, x, y);
                    y += 20;

                    this.context.font = '14px Arial';
                    this.context.fillText("x: " + sprite.x, x, y);
                    y += 20;
                    this.context.fillText("y: " + sprite.y, x, y);
                    y += 20;
                    this.context.fillText("direction: " + sprite.direction, x, y);
                    y += 20;
                    this.context.fillText("costume: " + sprite.costumeNames[sprite.costumeIndex], x, y);
                };

                if (this.debugMode === 'hover') {
                    if (sprite.touchMouse()) {
                        fn();
                    }
                }

                if (this.debugMode === 'forever') {
                    fn();
                }
            }


            let phrase = sprite.getPhrase();
            if (phrase) {
                this.context.font = '20px Arial';
                this.context.fillStyle = 'black';
                this.context.fillText(phrase, 40, this.canvas.height - 40);
            }

            this.drawImage(
                sprite.costume.image,
                sprite.x - sprite.width / 2,
                sprite.y - sprite.height / 2,
                sprite.width,
                sprite.height,
                sprite.direction,
                sprite.rotateStyle
            );
        }
    }

    forever(callback, timeout = null) {
        const result = callback(this);

        if (result !== false) {
            if (timeout) {
                setTimeout(() => {
                    requestAnimationFrame(() => this.forever(callback, timeout));
                }, timeout);

            } else {
                requestAnimationFrame(() => this.forever(callback));
            }
        }
    }

    run() {
        this.forever(() => {
            this.render();
        });
    }
}
