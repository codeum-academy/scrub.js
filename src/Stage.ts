type DrawingCallbackFunction = (context: CanvasRenderingContext2D) => void;

class Stage {
    id: Symbol;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    collisionSystem: CollisionSystem;
    backgroundColor;

    private game: Game;
    private background = null;
    private backgroundIndex = null;
    private backgrounds = [];
    private sprites = new Map<number, Sprite[]>();
    private drawings = new Map<number, DrawingCallbackFunction[]>();
    private topEdge: Polygon;
    private rightEdge: Polygon;
    private bottomEdge: Polygon;
    private leftEdge: Polygon;
    private addedSprites = 0;
    private loadedSprites = 0;
    private loadedBackgrounds = 0;
    private pendingRun = false;
    private onReadyCallbacks = [];
    private onStartCallbacks = [];
    private onReadyPending = true;
    private _stopped = false;
    private _padding: number;
    private _running = false;

    constructor(background: string = null, padding = 0) {
        this.id = Symbol();

        if (!Registry.getInstance().has('game')) {
            this.game.throwError('You need create Game instance before Stage instance.');
        }
        this.game = Registry.getInstance().get('game');

        this.collisionSystem = new CollisionSystem();
        this.canvas = this.game.canvas;
        this.context = this.game.context;

        if (background) {
            this.addBackground(background);
        }

        this.padding = padding;
        this.addListeners();

        this.game.addStage(this);
    }

    set padding(padding: number) {
        this._padding = padding;

        this.topEdge = this.collisionSystem.createPolygon(0, 0, [[padding, padding], [this.width - padding, padding]]);
        this.rightEdge = this.collisionSystem.createPolygon(0, 0, [[this.width - padding, padding], [this.width - padding, this.height - padding]]);
        this.bottomEdge = this.collisionSystem.createPolygon(0, 0, [[this.width - padding, this.height - padding], [padding, this.height - padding]]);
        this.leftEdge = this.collisionSystem.createPolygon(0, 0, [[padding, this.height - padding], [padding, padding]]);
    }

    get padding(): number {
        return this._padding;
    }

    get width(): number {
        return this.canvas.width;
    }

    get height(): number {
        return this.canvas.height;
    }

    get running(): boolean {
        return this._running;
    }

    get stopped(): boolean {
        return this._stopped;
    }

    addSprite(sprite: Sprite): void {
        let layerSprites: Sprite[];

        if (this.sprites.has(sprite.layer)) {
            layerSprites = this.sprites.get(sprite.layer);

        } else {
            layerSprites = [];
            this.sprites.set(sprite.layer, layerSprites);
            this.sprites = new Map([...this.sprites.entries()].sort((a, b) => a[0] - b[0]));
        }

        layerSprites.push(sprite);
        this.addedSprites++;
    }

    removeSprite(sprite: Sprite): void {
        if (!this.sprites.has(sprite.layer)) {
            this.game.throwError('The layer "' + sprite.layer + '" not defined in the stage.');
        }

        const layerSprites = this.sprites.get(sprite.layer);
        layerSprites.splice(layerSprites.indexOf(sprite), 1);

        if (!layerSprites.length) {
            this.sprites.delete(sprite.layer);
        }

        if (sprite.isReady()) {
            this.loadedSprites--;
        }
        this.addedSprites--;
    }

    addBackground(backgroundPath: string): void {
        const background = new Image();
        background.src = backgroundPath;

        this.backgrounds.push(background);

        background.addEventListener('load', () => {
            event = new CustomEvent(STAGE_BACKGROUND_READY_EVENT, {
                detail: {
                    background: background,
                    stageId: this.id
                }
            });

            document.dispatchEvent(event);
        });

        background.addEventListener('error', () => {
            this.game.throwError('Background image "' + backgroundPath + '" was not loaded. Check that the path is correct.');
        });
    }

    switchBackground(backgroundIndex: number): void {
        this.backgroundIndex = backgroundIndex;
        const background = this.backgrounds[backgroundIndex];

        if (background) {
            this.background = background;
        }
    }

    drawSprite(sprite: Sprite): void {
        const costume = sprite.getCostume();
        const image = costume.image;
        const dstX = sprite.x - sprite.width / 2;
        const dstY = sprite.y - sprite.height / 2;
        const dstWidth = sprite.width;
        const dstHeight = sprite.height;
        const direction = sprite.direction;
        const rotateStyle = sprite.rotateStyle;

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

            // mirror image
            this.context.drawImage(
                image,
                costume.x,
                costume.y,
                costume.width,
                costume.height,
                -dstWidth / 2,
                dstY,
                dstWidth,
                dstHeight
            );

        } else {
            // usual image
            this.context.drawImage(
                image,
                costume.x,
                costume.y,
                costume.width,
                costume.height,
                dstX,
                dstY,
                dstWidth,
                dstHeight
            );
        }

        if (rotateStyle === 'normal' && direction !== 0 || rotateStyle === 'leftRight' && direction > 180) {
            this.context.restore();
        }
    }

    pen(callback: DrawingCallbackFunction, layer = 0): void {
        let layerDrawings: DrawingCallbackFunction[];

        if (this.drawings.has(layer)) {
            layerDrawings = this.drawings.get(layer);

        } else {
            layerDrawings = [];
            this.drawings.set(layer, layerDrawings);
            this.drawings = new Map([...this.drawings.entries()].sort((a, b) => a[0] - b[0]));
        }

        layerDrawings.push(callback);
    }

    render(): void {
        this.context.clearRect(0, 0, this.width, this.height);

        if (this.backgroundColor) {
            this.context.fillStyle = this.backgroundColor;
            this.context.fillRect(0, 0, this.width, this.height);
        }

        if (this.background) {
            this.context.drawImage(this.background, 0, 0, this.width, this.height);
        }

        this.collisionSystem.update();

        if (this.game.debugBody) {
            this.collisionSystem.draw(this.context);
            this.context.stroke();
        }

        let layers = Array.from(this.sprites.keys()).concat(Array.from(this.drawings.keys()));
        layers = layers.filter((item, pos) => layers.indexOf(item) === pos);
        layers = layers.sort((a, b) => a - b);

        for(const layer of layers) {
            if (this.drawings.has(layer)) {
                const layerDrawings = this.drawings.get(layer);

                for (const drawing of layerDrawings) {
                    drawing(this.context);
                }
            }

            if (this.sprites.has(layer)) {
                const layerSprites = this.sprites.get(layer);

                for (const sprite of layerSprites) {
                    if (sprite.hidden) {
                        continue;
                    }

                    if (this.game.debugMode !== 'none') {
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
                            this.context.fillText("costume: " + sprite.getCostumeName(), x, y);
                        };

                        if (this.game.debugMode === 'hover') {
                            if (sprite.touchMouse()) {
                                fn();
                            }
                        }

                        if (this.game.debugMode === 'forever') {
                            fn();
                        }
                    }

                    let phrase = sprite.getPhrase();
                    if (phrase) {
                        this.context.font = '20px Arial';
                        this.context.fillStyle = 'black';
                        this.context.fillText(phrase, 40, this.canvas.height - 40);
                    }

                    if (sprite.getCostume()) {
                        this.drawSprite(sprite);
                    }
                }
            }
        }
    }

    timeout(callback, timeout: number): void {
        setTimeout(() => {
            if (this._stopped) {
                return;
            }

            requestAnimationFrame(() => callback(this));
        }, timeout);
    }

    forever(callback, timeout = null): void {
        if (this._stopped) {
            return;
        }

        if (this.isReady()) {
            const result = callback(this);
            if (result === false) {
                return;
            }

            if (result > 0) {
                timeout = result;
            }
        }

        if (timeout) {
            setTimeout(() => {
                requestAnimationFrame(() => this.forever(callback, timeout));
            }, timeout);

        } else {
            requestAnimationFrame(() => this.forever(callback));
        }
    }

    isReady() {
        return this.addedSprites == this.loadedSprites && this.loadedBackgrounds == this.backgrounds.length;
    }

    run(): void {
        this._running = true;
        this._stopped = false;

        for(const layerSprites of this.sprites.values()) {
            for (const sprite of layerSprites) {
                sprite.run();
            }
        }

        this.pendingRun = true;
        this.tryDoRun();
    }

    onStart(onStartCallback) {
        this.onStartCallbacks.push(onStartCallback);
    }

    onReady(callback) {
        this.onReadyCallbacks.push(callback);
    }

    stop(): void {
        this._running = false;
        this._stopped = true;

        for(const layerSprites of this.sprites.values()) {
            for (const sprite of layerSprites) {
                sprite.stop();
            }
        }
    }

    getTopEdge(): Polygon {
        return this.topEdge;
    }

    getRightEdge(): Polygon {
        return this.rightEdge;
    }

    getBottomEdge(): Polygon {
        return this.bottomEdge;
    }

    getLeftEdge(): Polygon {
        return this.leftEdge;
    }

    private addListeners() {
        document.addEventListener(SPRITE_READY_EVENT, (event: CustomEvent) => {
            if (this.id == event.detail.stageId) {
                this.loadedSprites++;
                this.tryDoOnReady();
                this.tryDoRun();
            }
        });

        document.addEventListener(STAGE_BACKGROUND_READY_EVENT, (event: CustomEvent) => {
            if (this.id == event.detail.stageId) {
                this.loadedBackgrounds++;
                this.tryDoOnReady();
                this.tryDoRun();

                if (this.loadedBackgrounds == this.backgrounds.length && this.backgroundIndex === null) {
                    this.switchBackground(0);
                }
            }
        });
    }

    private tryDoOnReady() {
        if (this.isReady() && this.onReadyPending) {
            this.onReadyPending = false;

            if (this.onReadyCallbacks.length) {
                for (const callback of this.onReadyCallbacks) {
                    callback();
                }
                this.onReadyCallbacks = [];
            }

            let event = new CustomEvent(STAGE_READY_EVENT, {
                detail: {
                    stage: this
                }
            });
            document.dispatchEvent(event);
        }
    }

    private doOnStart() {
        for (const callback of this.onStartCallbacks) {
            setTimeout(() => {
                callback();
            });
        }
    }

    private tryDoRun() {
        if (this.pendingRun && this.isReady()) {
            this._running = true;
            this.pendingRun = false;

            this.doOnStart();

            this.forever(() => {
                this.render();
            });
        }
    }
}
