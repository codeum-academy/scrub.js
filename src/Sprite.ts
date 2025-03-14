class Sprite {
    id: Symbol;
    name = 'No name';
    size = 100;
    rotateStyle = 'normal'; // 'normal', 'leftRight', 'none'
    singleBody = true;

    private game: Game;
    private body: Polygon;
    protected costumeIndex = null;
    private costume: Costume = null;
    protected stage;
    private costumes = [];
    private costumeNames = [];
    private sounds = [];
    private soundNames = [];
    protected deleted = false;
    private phrase;
    private phraseLiveTime = null;
    private _x = 0;
    private _y = 0;
    private _direction = 0;
    private _hidden = false;
    private _stopped = true;
    private _layer: number;
    private loadedCostumes = 0;
    private loadedSounds = 0;
    private onReadyCallbacks = [];
    private onReadyPending = true;

    constructor(stage: Stage = null, layer = 1, costumePaths = [], soundPaths = []) {
        this.id = Symbol();

        if (!Registry.getInstance().has('game')) {
            this.game.throwError('You need create Game instance before Sprite instance.');
        }
        this.game = Registry.getInstance().get('game');

        this.stage = stage;
        if (!this.stage) {
            this.stage = this.game.getLastStage();
        }

        if (!this.stage) {
            this.game.throwError('You need create Stage instance before Sprite instance.');
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
        
        this.addListeners();
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

        image.addEventListener('load', () => {
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
        }, false);

        image.addEventListener('error', () => {
            this.game.throwError('Costume image "' + costumePath + '" was not loaded. Check that the path is correct.');
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

        event = new CustomEvent(Game.SPRITE_COSTUME_READY_EVENT, {
            detail: {
                costume: costume,
                spriteId: this.id
            }
        });
        document.dispatchEvent(event);
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

        image.addEventListener('load', () => {
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
                    if (offset !== null ) {
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

        }, false);
    }

    switchCostume(costumeIndex): void {
        const costume = this.costumes[costumeIndex];

        if (costume instanceof Costume && costume.ready) {
            this.costumeIndex = costumeIndex;
            this.costume = costume;

            if (this.singleBody) {
                if (!(this.body instanceof Polygon)) {
                    this.createBody(costume);
                }

                costume.image.addEventListener('load', () => {
                    this.createBody(costume);
                }, false);

            } else {
                if (this.body instanceof Polygon) {
                    this.removeBody();
                }

                if (costume.body instanceof Polygon) {
                    this.createBody(costume);
                }

                // Fix bug when costume.body is undefined
                costume.image.addEventListener('load', () => {
                    this.createBody(costume);
                }, false);
            }
        }
    }

    switchCostumeByName(costumeName): void {
        const costumeIndex = this.costumeNames.indexOf(costumeName);

        if (costumeIndex > -1) {
            this.switchCostume(costumeIndex);

        } else {
            this.game.throwError('Name ' + costumeName +  'not found.');
        }
    }

    nextCostume(): void {
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
        sound.addEventListener('loadedmetadata', () => {
            event = new CustomEvent(Game.SPRITE_SOUND_READY_EVENT, {
                detail: {
                    sound: sound,
                    spriteId: this.id
                }
            });

            document.dispatchEvent(event);
        }, false);
    }

    private cloneSound(sound, name) {
        this.sounds.push(sound);
        this.soundNames.push(name);

        event = new CustomEvent(Game.SPRITE_SOUND_READY_EVENT, {
            detail: {
                sound: sound,
                spriteId: this.id
            }
        });

        document.dispatchEvent(event);
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
            this.game.throwError('Sound with index "' + soundIndex +  '" not found.');
        }
    }

    pauseSound(soundIndex): void {
        const sound = this.sounds[soundIndex];

        if (sound instanceof Audio) {
            sound.pause();

        } else {
            this.game.throwError('Sound with index "' + soundIndex +  '" not found.');
        }
    }

    playSoundByName(soundName, volume: number = null, currentTime: number = null): void {
        const soundIndex = this.soundNames.indexOf(soundName);

        if (soundIndex > -1) {
            this.playSound(soundIndex, volume, currentTime);

        } else {
            this.game.throwError('Name ' + soundName +  'not found.');
        }
    }

    pauseSoundByName(soundName): void {
        const soundIndex = this.soundNames.indexOf(soundName);

        if (soundIndex > -1) {
            this.pauseSound(soundIndex);

        } else {
            this.game.throwError('Name ' + soundName +  'not found.');
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
            !(sprite.getBody() instanceof Body) ||
            !(this.body instanceof Body)
        ) {
            return false;
        }

        return this.body.collides(sprite.getBody(), result);
    }

    touchSprites(sprites: Sprite[], result: CollisionResult = null): boolean {
        for (const sprite of sprites) {
            if (this.touchSprite(sprite, result)) {
                return true;
            }
        }

        return false;
    }

    touchPotentialSprites(sprites: Sprite[], result: CollisionResult = null): boolean {
        if (!(this.body instanceof Polygon)) {
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
        if (!(this.body instanceof Body)) {
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
        if (!(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getTopEdge(), result);
    }

    touchLeftEdge(result: CollisionResult = null): boolean {
        if (!(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getLeftEdge(), result);
    }

    touchRightEdge(result: CollisionResult = null): boolean {
        if (!(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getRightEdge(), result);
    }

    touchBottomEdge(result: CollisionResult = null): boolean {
        if (!(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getBottomEdge(), result);
    }

    touchMouse(result: CollisionResult = null): boolean {
        return this.touchMousePoint(this.game.getMousePoint(), result);
    }

    touchMousePoint(mousePoint: Point, result: CollisionResult = null): boolean {
        if (!(this.body instanceof Body)) {
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
            this.game.throwError('Sprite cannot be cloned because one is not ready.');
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

        for (const costume of this.costumes) {
            clone.cloneCostume(costume, this.getCostumeName());
        }
        clone.switchCostume(this.costumeIndex);

        for (let [soundIndex, sound] of this.sounds.entries()) {
            clone.cloneSound(sound, this.soundNames[soundIndex]);
        }

        clone.deleted = this.deleted;
        clone._stopped = this.stopped;

        return clone;
    }

    timeout(callback, timeout: number): void {
        setTimeout(() => {
            if (this.deleted || this.stopped) {
                return;
            }

            requestAnimationFrame(() => callback(this));
        }, timeout);
    }

    repeat(i: number, callback: CallableFunction, timeout = null, finishCallback: CallableFunction = null) {
        if (this.deleted || this.stopped) {
            finishCallback();

            return;
        }

        if (i < 1) {
            finishCallback();

            return;
        }

        if (this.isReady()) {
            const result = callback(this);
            if (result === false) {
                finishCallback();

                return;
            }

            if (result > 0) {
                timeout = result;
            }
        }

        i--;
        if (i < 1) {
            finishCallback();

            return;
        }

        if (timeout) {
            setTimeout(() => {
                requestAnimationFrame(() => this.repeat(i, callback, timeout, finishCallback));
            }, timeout);

        } else {
            requestAnimationFrame(() => this.repeat(i, callback, timeout, finishCallback));
        }
    }

    forever(callback, timeout = null): void {
        if (this.deleted || this.stopped) {
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

    delete(): void {
        if (this.deleted) {
            return;
        }

        this.stage.removeSprite(this);

        let props = Object.keys(this);
        for (let i = 0; i < props.length; i++) {
            delete this[props[i]];
        }

        this.deleted = true;
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
        document.addEventListener(Game.SPRITE_COSTUME_READY_EVENT, (event: CustomEvent) => {
            if (this.id == event.detail.spriteId) {
                this.loadedCostumes++;
                this.tryDoOnReady();

                if (this.loadedCostumes == this.costumes.length && this.costume === null) {
                    this.switchCostume(0);
                }
            }
        });

        document.addEventListener(Game.SPRITE_SOUND_READY_EVENT, (event: CustomEvent) => {
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

            let event = new CustomEvent(Game.SPRITE_READY_EVENT, {
                detail: {
                    sprite: this,
                    stageId: this.stage.id
                }
            });
            document.dispatchEvent(event);
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
