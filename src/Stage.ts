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
    private addedSprites = 0;
    private loadedSprites = 0;
    private loadedBackgrounds = 0;
    private pendingRun = false;
    private onReadyCallbacks = [];
    private onStartCallbacks = [];
    private onReadyPending = true;
    private scheduledCallbacks: Array<ScheduledCallbackItem> = [];
    private _stopped = true;
    private _running = false;
    private stoppedTime = null;
    private diffTime = null;
    private scheduledCallbackExecutor: ScheduledCallbackExecutor;

    constructor(background: string = null) {
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

        stage.addListeners();

        stage.game.addStage(stage);

        stage.scheduledCallbackExecutor = new ScheduledCallbackExecutor(stage);
        stage.stoppedTime = Date.now();

        return stage;
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

    changeSpriteLayer(sprite: Sprite, fromLayer: number, toLayer: number): void {
        if (!this.sprites.has(fromLayer)) {
            this.game.throwErrorRaw('The layer "' + fromLayer + '" not defined in the stage.');
        }

        const fromLayerSprites = this.sprites.get(fromLayer);
        fromLayerSprites.splice(fromLayerSprites.indexOf(sprite), 1);

        if (!fromLayerSprites.length) {
            this.sprites.delete(fromLayer);
        }

        let toLayerSprites = [];
        if (this.sprites.has(toLayer)) {
            toLayerSprites = this.sprites.get(toLayer);

        } else {
            this.sprites.set(toLayer, toLayerSprites);
        }

        toLayerSprites.push(sprite);
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
            this    .background = background;
        }
    }

    drawSprite(sprite: Sprite): void {
        const costume = sprite.getCostume();
        const image = costume.image;
        const dstX = sprite.sourceX - sprite.sourceWidth / 2;
        const dstY = sprite.sourceY - sprite.sourceHeight / 2;
        const dstWidth = sprite.sourceWidth;
        const dstHeight = sprite.sourceHeight;
        const direction = sprite.direction;
        const rotateStyle = sprite.rotateStyle;
        const xOffset = sprite.xCenterOffset;
        const yOffset = sprite.yCenterOffset;
        let radius = 0
        let radiusOffsetX = 0;
        let radiusOffsetY = 0;

        if (sprite.getCollider() instanceof CircleCollider) {
            radius = sprite.getCollider().radius;
            radiusOffsetX = (radius - (costume.width / 2)) * sprite.size / 100;
            radiusOffsetY = (radius - (costume.height / 2)) * sprite.size / 100;
        }


        if (rotateStyle === 'normal' && direction !== 0) {
            this.context.save();
            this.context.translate(dstX + dstWidth / 2, dstY + dstHeight / 2);
            this.context.rotate(sprite.angleRadians);
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
                (-dstWidth / 2) + (costume.colliderPaddingLeft * sprite.size / 100) + radiusOffsetX,
                dstY + (costume.colliderPaddingTop * sprite.size / 100) + radiusOffsetY,
                costume.width * sprite.size / 100,
                costume.height * sprite.size / 100
            );

        } else {
            // usual image
            this.context.drawImage(
                image,
                costume.x,
                costume.y,
                costume.width,
                costume.height,
                dstX + (costume.colliderPaddingLeft * sprite.size / 100) + radiusOffsetX,
                dstY + (costume.colliderPaddingTop * sprite.size / 100) + radiusOffsetY,
                costume.width * sprite.size / 100,
                costume.height * sprite.size / 100
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

        let layers = Array.from(this.sprites.keys()).concat(Array.from(this.drawings.keys()));
        layers = layers.filter((item, pos) => layers.indexOf(item) === pos);
        layers = layers.sort((a, b) => a - b);

        for(const layer of layers) {
            if (this.drawings.has(layer)) {
                const layerDrawings = this.drawings.get(layer);

                for (const drawing of layerDrawings) {
                    drawing(this.context, this);
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

                            this.context.fillStyle = this.game.debugColor;

                            this.context.font = '16px Arial';
                            this.context.fillText(sprite.name, x, y);
                            y += 20;

                            this.context.font = '14px Arial';
                            this.context.fillText("x: " + sprite.x, x, y);
                            y += 20;
                            this.context.fillText("y: " + sprite.y, x, y);
                            y += 20;
                            this.context.fillText("direction: " + sprite.direction, x, y);
                            y += 20;
                            this.context.fillText("costume: " + sprite.getCostumeIndex(), x, y);
                            y += 20;
                            this.context.fillText("xOffset: " + sprite.xCenterOffset, x, y);
                            y += 20;
                            this.context.fillText("yOffset: " + sprite.yCenterOffset, x, y);
                            // this.context.font = '40px Arial';
                            this.context.beginPath();
                            this.context.moveTo(sprite.x - 2, sprite.y);
                            this.context.lineTo(sprite.x + 2, sprite.y);
                            this.context.moveTo(sprite.x, sprite.y - 2);
                            this.context.lineTo(sprite.x, sprite.y + 2);
                            this.context.stroke()
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

                    for (const drawing of sprite.drawings) {
                        drawing(this.context, sprite);
                    }
                }
            }
        }

        if (this.game.debugCollider) {
            this.context.strokeStyle = this.game.debugColor;
            this.context.beginPath();
            this.collisionSystem.draw(this.context);
            this.context.stroke();
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

        for(const layerSprites of this.sprites.values()) {
            for (const sprite of layerSprites) {
                sprite.ready();
            }
        }
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
        if (this.onReadyPending && this.isReady()) {
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
