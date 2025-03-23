class Sprite {
    id: Symbol;
    eventEmitter: EventEmitter;
    name = 'No name';
    size = 100;
    rotateStyle = 'normal'; // 'normal', 'leftRight', 'none'
    singleBody = true;

    private game: Game = null;
    private body: Polygon = null
    protected costumeIndex = null;
    private costume: Costume = null;
    protected stage = null
    private costumes = [];
    private costumeNames = [];
    private sounds = [];
    private soundNames = [];
    private phrase = null;
    private phraseLiveTime = null;
    private _x = 0;
    private _y = 0;
    private _direction = 0;
    private _hidden = false;
    protected _deleted = false;
    private _stopped = true;
    private _layer: number;
    private loadedCostumes = 0;
    private loadedSounds = 0;
    private onReadyCallbacks = [];
    private onReadyPending = true;
    private scheduledCallbacks: Array<ScheduledCallbackItem> = [];
    private scheduledCallbackExecutor: ScheduledCallbackExecutor;

    constructor(stage: Stage = null, layer = 1, costumePaths = [], soundPaths = []) {
        this.id = Symbol();
        this.eventEmitter = new EventEmitter();

        if (!Registry.getInstance().has('game')) {
            this.game.throwError(ErrorMessages.NEED_CREATE_GAME_BEFORE_SPRITE);
        }
        this.game = Registry.getInstance().get('game');

        this.stage = stage;
        if (!this.stage) {
            this.stage = this.game.getLastStage();
        }

        if (!this.stage) {
            this.game.throwError(ErrorMessages.NEED_CREATE_STAGE_BEFORE_SPRITE);
        }

        this._layer = layer;
        this.stage.addSprite(this);

        this._x = this.game.width / 2;
        this._y = this.game.height / 2;

        for (const costumePath of costumePaths) {
            this.addCostume(costumePath);
        }

        for (const soundPath of soundPaths) {
            this.addSound(soundPath);
        }

        this.scheduledCallbackExecutor = new ScheduledCallbackExecutor(this);
        this.addListeners();

        if (this.game.displayErrors) {
            return this.game.validatorFactory.createValidator(this, 'Sprite');
        }
    }

    isReady() {
        return this.loadedCostumes == this.costumes.length && this.loadedSounds == this.sounds.length;
    }

    onReady(callback) {
        this.onReadyCallbacks.push(callback);
    }

    addCostume(
        costumePath: string,
        name: string = null,
        x: number = 0,
        y: number = 0,
        width: number = null,
        height: number = null,
        paddingTop: number = 0,
        paddingRight: number = 0,
        paddingBottom: number = 0,
        paddingLeft: number = 0
    ): void {
        const costume = new Costume();

        if (!name) {
            const costumeIndex = this.costumes.length;
            name = 'No name ' + costumeIndex;
        }

        this.costumes.push(costume);
        this.costumeNames.push(name);

        const image = new Image();
        image.src = costumePath;

        const onLoadImage = () => {
            if (this.deleted) {
                return;
            }

            this.addCostumeByImage(
              costume,
              image,
              x,
              y,
              width,
              height,
              paddingTop,
              paddingRight,
              paddingBottom,
              paddingLeft
            );

            image.removeEventListener('load', onLoadImage);
        };
        image.addEventListener('load', onLoadImage);

        image.addEventListener('error', () => {
            this.game.throwError(ErrorMessages.COSTUME_NOT_LOADED, {costumePath});
        });
    }

    private cloneCostume(costume: Costume, name: string) {
        costume.body = null;

        this.costumes.push(costume);
        this.costumeNames.push(name);

        this.addCostumeByImage(
            costume,
            costume.image,
            costume.x,
            costume.y,
            costume.width,
            costume.height
        );
    }

    private addCostumeByImage(
        costume: Costume,
        image: HTMLImageElement,
        x: number = 0,
        y: number = 0,
        width: number = null,
        height: number = null,
        paddingTop: number = 0,
        paddingRight: number = 0,
        paddingBottom: number = 0,
        paddingLeft: number = 0
    ): void {
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
            [costume.width / 2 + paddingRight, costume.height / 2  + paddingBottom],
            [(costume.width / 2) * -1 + paddingLeft * -1, costume.height / 2  + paddingBottom]
        ]);

        costume.ready = true;

        this.eventEmitter.emit(Game.SPRITE_COSTUME_READY_EVENT, {
            costume: costume,
            spriteId: this.id
        });
    }

    addCostumes(
        costumePath: string,
        name: string = null,
        cols: number,
        rows: number = 1,
        limit: number = null,
        offset: number = null,
        paddingTop: number = 0,
        paddingRight: number = 0,
        paddingBottom: number = 0,
        paddingLeft: number = 0
    ) {
        const image = new Image();
        image.src = costumePath;

        if (!name) {
            name = 'No name';
        }

        const onLoadImage = () => {
            image.naturalWidth;
            image.naturalHeight;

            const chunkWidth = image.naturalWidth / cols;
            const chunkHeight = image.naturalHeight / rows;
            let skip = false;

            let costumeIndex = 0;
            let x = 0;
            let y = 0;
            for (let i = 0; i < rows; i++) {
                for (let t = 0; t < cols; t++) {
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

                        const costume = new Costume();

                        let costumeName = name;
                        if (costumeName !== null) {
                            costumeName += ' ' + costumeIndex;
                        }

                        this.costumes.push(costume);
                        this.costumeNames.push(name);

                        this.addCostumeByImage(
                          costume,
                          image,
                          x,
                          y,
                          chunkWidth,
                          chunkHeight,
                          paddingTop,
                          paddingRight,
                          paddingBottom,
                          paddingLeft
                        );
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
    }


    switchCostume(costumeIndex): void {
        if (this.deleted) {
            return;
        }

        const costume = this.costumes[costumeIndex];

        if (costume instanceof Costume && costume.ready) {
            this.costumeIndex = costumeIndex;
            this.costume = costume;

            if (!(this.body instanceof Polygon)) {
                this.createBody(costume);
            }
        }
    }

    switchCostumeByName(costumeName): void {
        const costumeIndex = this.costumeNames.indexOf(costumeName);

        if (costumeIndex > -1) {
            this.switchCostume(costumeIndex);

        } else {
            this.game.throwError(ErrorMessages.COSTUME_NAME_NOT_FOUND, {costumeName});
        }
    }

    nextCostume(): void {
        if (this.deleted) {
            return;
        }

        let nextCostume = this.costumeIndex + 1;

        if (nextCostume > this.costumes.length - 1) {
            nextCostume = 0;
        }

        this.switchCostume(nextCostume);
    }

    addSound(soundPath, name: string = null): void {
        if (!name) {
            name = 'No name ' + this.sounds.length;
        }

        const sound = new Audio();
        sound.src = soundPath;

        this.sounds.push(sound);
        this.soundNames.push(name);

        sound.load();

        const onLoadSound =  () => {
            this.eventEmitter.emit(Game.SPRITE_SOUND_READY_EVENT, {
                sound: sound,
                spriteId: this.id
            });

            sound.removeEventListener('loadedmetadata', onLoadSound);
        };
        sound.addEventListener('loadedmetadata', onLoadSound);
    }

    private cloneSound(sound, name) {
        this.sounds.push(sound);
        this.soundNames.push(name);

        this.eventEmitter.emit(Game.SPRITE_SOUND_READY_EVENT, {
            sound: sound,
            spriteId: this.id
        });
    }

    playSound(soundIndex, volume: number = null, currentTime: number = null): void {
        const sound = this.sounds[soundIndex];

        if (sound instanceof Audio) {
            sound.play();

            if (volume !== null) {
                sound.volume = volume;
            }

            if (currentTime !== null) {
                sound.currentTime = currentTime;
            }

        } else {
            this.game.throwError(ErrorMessages.SOUND_INDEX_NOT_FOUND, {soundIndex});
        }
    }

    pauseSound(soundIndex): void {
        const sound = this.sounds[soundIndex];

        if (sound instanceof Audio) {
            sound.pause();

        } else {
            this.game.throwError(ErrorMessages.SOUND_INDEX_NOT_FOUND, {soundIndex});
        }
    }

    playSoundByName(soundName, volume: number = null, currentTime: number = null): void {
        const soundIndex = this.soundNames.indexOf(soundName);

        if (soundIndex > -1) {
            this.playSound(soundIndex, volume, currentTime);

        } else {
            this.game.throwError(ErrorMessages.SOUND_NAME_NOT_FOUND, {soundName});
        }
    }

    pauseSoundByName(soundName): void {
        const soundIndex = this.soundNames.indexOf(soundName);

        if (soundIndex > -1) {
            this.pauseSound(soundIndex);

        } else {
            this.game.throwError(ErrorMessages.SOUND_NAME_NOT_FOUND, {soundName});
        }
    }

    move(steps): void {
        this.x += (steps * Math.sin(this.direction * Math.PI / 180));
        this.y -= (steps * Math.cos(this.direction * Math.PI / 180));
    }

    bounceOnEdge(): void {
        if (this.touchTopEdge() || this.touchBottomEdge()) {
            this.direction = 180 - this.direction;
        }

        if (this.touchLeftEdge() || this.touchRightEdge()) {
            this.direction *= -1;
        }
    }

    touchSprite(sprite: Sprite, result: CollisionResult = null): boolean {
        if (
            sprite.hidden ||
            this.hidden ||
            sprite.stopped ||
            this.stopped ||
            sprite.deleted ||
            this.deleted ||
            !(sprite.getBody() instanceof Body) ||
            !(this.body instanceof Body)
        ) {
            return false;
        }

        return this.body.collides(sprite.getBody(), result);
    }

    touchSprites(sprites: Sprite[], result: CollisionResult = null): boolean {
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }

        for (const sprite of sprites) {
            if (this.touchSprite(sprite, result)) {
                return true;
            }
        }

        return false;
    }

    touchPotentialSprites(sprites: Sprite[], result: CollisionResult = null): boolean {
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }

        const potentials = this.body.potentials();
        if (!potentials.length) {
            return false;
        }

        const potentialSprites = [];
        for (const sprite of sprites) {
            if (potentials.indexOf(sprite.getBody()) > -1) {
                potentialSprites.push(sprite);
            }
        }

        for (const potentialSprite of potentialSprites) {
            if (this.touchSprite(potentialSprite, result)) {
                return true;
            }
        }

        return false;
    }

    touchEdge(result: CollisionResult = null): boolean {
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }

        if (this.body.collides(this.stage.getTopEdge(), result)) {
            return true;

        } else if (this.body.collides(this.stage.getRightEdge(), result)) {
            return true;

        } else if (this.body.collides(this.stage.getBottomEdge(), result)) {
            return true;

        } else if (this.body.collides(this.stage.getLeftEdge(), result)) {
            return true;
        }

        return false;
    }

    touchTopEdge(result: CollisionResult = null): boolean {
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getTopEdge(), result);
    }

    touchLeftEdge(result: CollisionResult = null): boolean {
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getLeftEdge(), result);
    }

    touchRightEdge(result: CollisionResult = null): boolean {
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getRightEdge(), result);
    }

    touchBottomEdge(result: CollisionResult = null): boolean {
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getBottomEdge(), result);
    }

    touchMouse(result: CollisionResult = null): boolean {
        return this.touchMousePoint(this.game.getMousePoint(), result);
    }

    touchMousePoint(mousePoint: Point, result: CollisionResult = null): boolean {
        if (this.hidden || this.stopped || this.deleted || !(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(mousePoint, result);
    }

    pointForward(sprite): void {
        this.direction = (Math.atan2(this.y - sprite.y , this.x - sprite.x) / Math.PI * 180) - 90
    }

    getDistanceToSprite(sprite: Sprite): number {
        return Math.sqrt((Math.abs(this.x - sprite.x)) + (Math.abs(this.y - sprite.y)));
    }

    getDistanceToMouse(mouse: Mouse): number {
        return Math.sqrt((Math.abs(this.x - mouse.x)) + (Math.abs(this.y - mouse.y)));
    }

    say(text, time = null): void {
        this.phrase = this.name + ': ' + text;

        this.phraseLiveTime = null;
        if (time) {
            const currentTime = (new Date()).getTime();
            this.phraseLiveTime = currentTime + time;
        }
    }

    getPhrase(): string|null {
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

    createClone(stage: Stage = null): Sprite {
        if (!this.isReady()) {
            this.game.throwError(ErrorMessages.CLONED_NOT_READY);
        }

        if (!stage) {
            stage = this.stage;
        }

        const clone = new Sprite(stage, this.layer);

        clone.name = this.name;
        clone.size = this.size;
        clone.rotateStyle = this.rotateStyle;
        clone.singleBody = this.singleBody;
        clone.x = this.x;
        clone.y = this.y;
        clone.direction = this.direction;
        clone.hidden = this.hidden;
        clone._deleted = this.deleted;
        clone._stopped = this.stopped;

        for (const costume of this.costumes) {
            clone.cloneCostume(costume, this.getCostumeName());
        }
        clone.switchCostume(this.costumeIndex);

        for (let [soundIndex, sound] of this.sounds.entries()) {
            clone.cloneSound(sound, this.soundNames[soundIndex]);
        }

        return clone;
    }

    timeout(callback: ScheduledCallbackFunction, timeout: number): void {
        this.repeat(callback, 1, null, timeout, undefined);
    }

    repeat(callback: ScheduledCallbackFunction, repeat: number, interval: number = null, timeout: number = null, finishCallback: ScheduledCallbackFunction) {
        const state = new ScheduledState(interval, repeat, 0);

        if (timeout) {
            timeout = Date.now() + timeout;
        }

        this.scheduledCallbacks.push(new ScheduledCallbackItem(callback, state, timeout, finishCallback));
    }

    forever(callback: ScheduledCallbackFunction, interval: number = null, timeout: number = null, finishCallback: ScheduledCallbackFunction): void {
        const state = new ScheduledState(interval);

        if (timeout) {
            timeout = Date.now() + timeout;
        }

        this.scheduledCallbacks.push(new ScheduledCallbackItem(callback, state, timeout, finishCallback));
    }

    update(diffTime: number) {
        this.scheduledCallbacks = this.scheduledCallbacks.filter(
          this.scheduledCallbackExecutor.execute(Date.now(), diffTime)
        );
    }

    delete(): void {
        if (this.deleted) {
            return;
        }

        this.eventEmitter.clearAll();
        this.removeBody();
        this.stage.removeSprite(this);
        this.scheduledCallbackExecutor = null;
        this.scheduledCallbacks = [];

        let props = Object.keys(this);
        for (let i = 0; i < props.length; i++) {
            delete this[props[i]];
        }

        this._deleted = true;
    }

    run(): void {
        this._stopped = false;
    }

    stop(): void {
        this._stopped = true;
    }

    getBody(): Polygon {
        return this.body;
    }

    getCostume(): Costume {
        return this.costume;
    }

    getCostumeName(): string {
        return this.costumeNames[this.costumeIndex];
    }

    set direction (direction: number) {
        if ((direction * 0) !== 0) { // d is +/-Infinity or NaN
            return;
        }

        direction = direction % 360;

        if (direction < 0) {
            direction += 360;
        }

        this._direction = (direction > 360) ? direction - 360 : direction;

        if (this.body instanceof Polygon) {
            if (this.rotateStyle == 'leftRight') {
                this.body.angle = 0; // to radian

            } else {
                this.body.angle = this._direction * 3.14 / 180; // to radian
            }

        }
    }

    get direction(): number {
        return this._direction;
    }

    get width(): number|null {
        if (this.costume) {
            return this.costume.width * this.size / 100;
        }

        return null;
    }

    get height(): number|null {
        if (this.costume) {
            return this.costume.height * this.size / 100;
        }

        return null;
    }

    set x(value: number) {
        this._x = value;

        if (this.body instanceof Polygon) {
            this.body.x = value;
        }
    }

    get x(): number {
        return this._x;
    }

    set y(value: number) {
        this._y = value;

        if (this.body instanceof Polygon) {
            this.body.y = value;
        }
    }

    get y(): number {
        return this._y;
    }

    get realX(): number {
        return this.x - this.width / 2;
    }

    get realY(): number {
        return this.y - this.height / 2;
    }

    set hidden(value: boolean) {
        this._hidden = value;

        // TODO need test
        // if (value) {
        //     this.removeBody();
        //
        // } else {
        //     if (this.costume instanceof Costume) {
        //         this.createBody(this.costume);
        //     }
        // }
    }

    get hidden(): boolean {
        return this._hidden;
    }

    get deleted(): boolean {
        return this._deleted;
    }

    get stopped(): boolean {
        return this._stopped;
    }

    set layer(value: number) {
        this.stage.removeSprite(this);
        this._layer = value;
        this.stage.addSprite(this);
    }

    get layer(): number {
        return this._layer;
    }

    private addListeners() {
        this.eventEmitter.on(Game.SPRITE_COSTUME_READY_EVENT, Game.SPRITE_COSTUME_READY_EVENT, (event: CustomEvent) => {
            if (this.id == event.detail.spriteId) {
                this.loadedCostumes++;
                this.tryDoOnReady();

                if (this.loadedCostumes == this.costumes.length && this.costume === null) {
                    this.switchCostume(0);
                }
            }
        });

        this.eventEmitter.on(Game.SPRITE_SOUND_READY_EVENT, Game.SPRITE_SOUND_READY_EVENT, (event: CustomEvent) => {
            if (this.id == event.detail.spriteId) {
                this.loadedSounds++;
                this.tryDoOnReady();
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

            this.stage.eventEmitter.emit(Game.SPRITE_READY_EVENT, {
                sprite: this,
                stageId: this.stage.id
            });
        }
    }

    private removeBody() {
        if (this.body instanceof Polygon) {
            this.stage.collisionSystem.remove(this.body);
            this.body = null;
        }
    }

    private createBody(costume: Costume) {
        this.body = costume.body;
        this.body.scale_x = this.size / 100;
        this.body.scale_y = this.size / 100;

        this.stage.collisionSystem.insert(this.body);
    }
}
