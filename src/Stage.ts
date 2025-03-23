type DrawingCallbackFunction = (context: CanvasRenderingContext2D) => void;
type ScheduledCallbackFunction = (context: Stage|Sprite, state: ScheduledState) => boolean | void;

class Stage {
    id: Symbol;
    eventEmitter: EventEmitter;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    collisionSystem: CollisionSystem;
    backgroundColor = null;

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
    private scheduledCallbacks: Array<ScheduledCallbackItem> = [];
    private _stopped = true;
    private _padding = 0;
    private _running = false;
    private stoppedTime = null;
    private diffTime = null;
    private scheduledCallbackExecutor: ScheduledCallbackExecutor;

    constructor(background: string = null, padding = 0) {
        if (!Registry.getInstance().has('game')) {
            throw new Error('You need create Game instance before Stage instance.');
        }
        this.game = Registry.getInstance().get('game');

        let stage = this;
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

        stage.padding = padding;
        stage.addListeners();

        stage.game.addStage(stage);

        stage.scheduledCallbackExecutor = new ScheduledCallbackExecutor(stage);
        stage.stoppedTime = Date.now();

        return stage;
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
        }

        layerSprites.push(sprite);
        this.addedSprites++;
    }

    removeSprite(sprite: Sprite, layer: number): void {
        if (!this.sprites.has(layer)) {
            this.game.throwErrorRaw('The layer "' + layer + '" not defined in the stage.');
        }

        const layerSprites = this.sprites.get(layer);
        layerSprites.splice(layerSprites.indexOf(sprite), 1);

        if (!layerSprites.length) {
            this.sprites.delete(layer);
        }

        if (sprite.deleted || sprite.isReady()) {
            this.loadedSprites--;
        }

        this.addedSprites--;
    }

    addBackground(backgroundPath: string): void {
        const background = new Image();
        background.src = backgroundPath;

        this.backgrounds.push(background);

        const onLoad = () => {
            this.eventEmitter.emit(Game.STAGE_BACKGROUND_READY_EVENT, {
                background: background,
                stageId: this.id
            });

            background.removeEventListener('load', onLoad);
        };
        background.addEventListener('load', onLoad);

        background.addEventListener('error', () => {
            this.game.throwError(ErrorMessages.BACKGROUND_NOT_LOADED, {backgroundPath});
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
        }

        layerDrawings.push(callback);
    }

    render(): void {
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

    timeout(callback: ScheduledCallbackFunction, timeout: number): void {
        this.repeat(callback, 1, null, timeout, undefined);
    }

    repeat(callback: ScheduledCallbackFunction, repeat: number, interval: number = null, timeout: number = null, finishCallback?: ScheduledCallbackFunction): void {
        const state = new ScheduledState(interval, repeat, 0);

        if (timeout) {
            timeout = Date.now() + timeout;
        }

        this.scheduledCallbacks.push(new ScheduledCallbackItem(callback, state, timeout, finishCallback));
    }

    forever(callback: ScheduledCallbackFunction, interval: number = null, timeout: number = null, finishCallback?: ScheduledCallbackFunction): void {
        const state = new ScheduledState(interval);

        if (timeout) {
            timeout = Date.now() + timeout;
        }

        this.scheduledCallbacks.push(new ScheduledCallbackItem(callback, state, timeout, finishCallback));
    }

    isReady() {
        return this.addedSprites == this.loadedSprites && this.loadedBackgrounds == this.backgrounds.length;
    }

    run(): void {
        this._stopped = false;

        for(const layerSprites of this.sprites.values()) {
            for (const sprite of layerSprites) {
                sprite.run();
            }
        }

        this.pendingRun = true;
        this.tryDoRun();
    }

    ready(): void {
        this.tryDoOnReady();
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

        this.stoppedTime = Date.now();
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

    getSprites() {
        return Array.from(this.sprites.values()).reduce((accumulator, currentValue) => accumulator.concat(currentValue), []);
    }

    private addListeners() {
        this.eventEmitter.on(Game.SPRITE_READY_EVENT, Game.SPRITE_READY_EVENT, (event: CustomEvent) => {
            if (this.id == event.detail.stageId) {
                this.loadedSprites++;
                this.tryDoOnReady();
                this.tryDoRun();
            }
        });

        this.eventEmitter.on(Game.STAGE_BACKGROUND_READY_EVENT, Game.STAGE_BACKGROUND_READY_EVENT, (event: CustomEvent) => {
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

            this.game.eventEmitter.emit(Game.STAGE_READY_EVENT, {
                stage: this
            });
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
        if (this.pendingRun && !this._running && this.isReady()) {
            this._running = true;
            this.pendingRun = false;

            this.doOnStart();
            this.diffTime = Date.now() - this.stoppedTime;

            setTimeout(() => { // Fix bug with "The parent is not defined in the collision system".
                const stoppedTime = this.stoppedTime;
                const loop = () => {
                    if (this._stopped || stoppedTime !== this.stoppedTime) {
                        return;
                    }

                    this.render();
                    requestAnimationFrame(loop);
                };

                loop();
            });
        }
    }

    private update() {
        this.scheduledCallbacks = this.scheduledCallbacks.filter(
          this.scheduledCallbackExecutor.execute(Date.now(), this.diffTime)
        );

        this.sprites.forEach((layerSprites, layer) => {
            for (const sprite of layerSprites) {
                if (sprite.deleted) {
                    this.removeSprite(sprite, layer);
                    return;
                }

                sprite.update(this.diffTime);
            }
        });

        this.diffTime = 0;
    }
}
