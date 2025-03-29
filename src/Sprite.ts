class Sprite {
    id: Symbol;
    eventEmitter: EventEmitter;
    collisionResult: CollisionResult;
    name = 'No name';
    rotateStyle = 'normal'; // 'normal', 'leftRight', 'none'

    private game: Game = null;
    private collider: Collider = null
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
    private _xCenterOffset = 0;
    private _yCenterOffset = 0;
    private _width = 0;
    private _height = 0;
    private _colliderNone = false;
    private _direction = 0;
    private _size = 100;
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
    private _drawings:  DrawingCallbackFunction[] = [];
    private pendingCostumeGrids = 0;
    private _centerDistance = 0;
    private _centerAngle = 0;

    constructor(stage: Stage = null, layer = 1, costumePaths = [], soundPaths = []) {
        if (!Registry.getInstance().has('game')) {
            throw new Error('You need create Game instance before Stage instance.');
        }
        this.game = Registry.getInstance().get('game');

        let sprite = this;
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

        for (const costumePath of costumePaths) {
            sprite.addCostume(costumePath);
        }

        for (const soundPath of soundPaths) {
            sprite.addSound(soundPath);
        }

        sprite.scheduledCallbackExecutor = new ScheduledCallbackExecutor(sprite);
        sprite.stage.addSprite(sprite);

        sprite.addListeners();

        return sprite;
    }

    isReady() {
        return this.loadedCostumes == this.costumes.length && this.pendingCostumeGrids === 0 && this.loadedSounds == this.sounds.length;
    }

    onReady(callback) {
        this.onReadyCallbacks.push(callback);
    }

    addCostume(
        costumePath: string,
        options?: CostumeOptions
    ): void {
        const costume = new Costume();
        const costumeIndex = this.costumes.length;
        const costumeName = (options?.name ?? 'Costume') + costumeIndex;

        this.costumes.push(costume);
        this.costumeNames.push(costumeName);

        const image = new Image();
        image.src = costumePath;

        const onLoadImage = () => {
            if (this.deleted) {
                return;
            }

            this.addCostumeByImage(costume, image, options);
            image.removeEventListener('load', onLoadImage);
        };
        image.addEventListener('load', onLoadImage);

        image.addEventListener('error', () => {
            this.game.throwError(ErrorMessages.COSTUME_NOT_LOADED, {costumePath});
        });
    }

    private cloneCostume(costume: Costume, name: string) {
        this.costumes.push(costume);
        this.costumeNames.push(name);
        this.loadedCostumes++;
    }

    private addCostumeByImage(
        costume: Costume,
        image: HTMLImageElement,
        options?: CostumeOptions
    ): void {
        const x = options?.imageX ?? 0;
        const y = options?.imageY ?? 0;
        const width = options?.imageWidth ?? image.naturalWidth;
        const height = options?.imageHeight ?? image.naturalHeight;

        const colliderPadding= options?.colliderPadding ?? 0;
        const colliderPaddingTop = (options?.colliderPaddingTop ?? 0) + colliderPadding;
        const colliderPaddingRight = (options?.colliderPaddingRight ?? 0) + colliderPadding;
        const colliderPaddingBottom = (options?.colliderPaddingBottom ?? 0) + colliderPadding;
        const colliderPaddingLeft = (options?.colliderPaddingLeft ?? 0) + colliderPadding;

        costume.image = image;
        costume.x = x;
        costume.y = y;
        costume.width = width;
        costume.height = height;
        costume.colliderPaddingTop = colliderPaddingTop;
        costume.colliderPaddingRight = colliderPaddingRight;
        costume.colliderPaddingLeft = colliderPaddingLeft;
        costume.colliderPaddingBottom = colliderPaddingBottom
        costume.ready = true;

        this.eventEmitter.emit(Game.SPRITE_COSTUME_READY_EVENT, {
            costume: costume,
            spriteId: this.id
        });
    }

    addCostumeGrid(
        costumePath: string,
        options: GridCostumeOptions
    ) {
        const image = new Image();
        image.src = costumePath;

        let costumeName = options?.name ?? 'Costume';
        this.pendingCostumeGrids++;

        const onLoadImage = () => {
            image.naturalWidth;
            image.naturalHeight;

            let cols = options.cols;
            let rows = options.rows;
            let limit = options.limit;
            let offset = options.offset;

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

                        this.costumes.push(costume);
                        this.costumeNames.push(costumeName + costumeIndex);

                        this.addCostumeByImage(
                            costume,
                            image,
                            {
                                imageX: x + (options?.imageX ?? 0),
                                imageY: y + (options?.imageY ?? 0),
                                imageWidth: (options?.imageWidth ?? chunkWidth),
                                imageHeight: (options?.imageHeight ?? chunkHeight),
                                colliderPadding: options.colliderPadding,
                                colliderPaddingBottom: options.colliderPaddingBottom,
                                colliderPaddingTop: options.colliderPaddingTop,
                                colliderPaddingRight: options.colliderPaddingRight,
                                colliderPaddingLeft: options.colliderPaddingLeft
                            }
                        );

                        costumeIndex++;
                    }

                    x += chunkWidth;
                }

                x = 0;
                y += chunkHeight;
            }

            this.pendingCostumeGrids--;
            this.tryDoOnReady();
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

        this.loadedSounds++;
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
        const angleRadians = this.angleRadians;

        this.x += (steps * Math.sin(angleRadians));
        this.y -= (steps * Math.cos(angleRadians));
    }

    bounceOnEdge(): void {
        if (this.touchTopEdge() || this.touchBottomEdge()) {
            this.direction = 180 - this.direction;
        }

        if (this.touchLeftEdge() || this.touchRightEdge()) {
            this.direction *= -1;
        }
    }

    touchSprite(sprite: Sprite): boolean {
        if (
            sprite.hidden ||
            this.hidden ||
            sprite.stopped ||
            this.stopped ||
            sprite.deleted ||
            this.deleted ||
            !sprite.getCollider() ||
            !this.collider
        ) {
            return false;
        }

        return this.collider.collides(sprite.getCollider(), this.collisionResult);
    }

    touchSprites(sprites: Sprite[]): boolean {
        if (this.hidden || this.stopped || this.deleted || !this.collider) {
            return false;
        }

        for (const sprite of sprites) {
            if (this.touchSprite(sprite)) {
                return true;
            }
        }

        return false;
    }

    touchPotentialSprites(sprites: Sprite[]): boolean {
        if (this.hidden || this.stopped || this.deleted || !this.collider) {
            return false;
        }

        const potentials = this.collider.potentials();
        if (!potentials.length) {
            return false;
        }

        const potentialSprites = [];
        for (const sprite of sprites) {
            if (potentials.indexOf(sprite.getCollider()) > -1) {
                potentialSprites.push(sprite);
            }
        }

        for (const potentialSprite of potentialSprites) {
            if (this.touchSprite(potentialSprite)) {
                return true;
            }
        }

        return false;
    }

    touchEdge(): boolean {
        if (this.hidden || this.stopped || this.deleted || !this.collider) {
            return false;
        }

        const result = this.getPureCollisionResult();
        const gameWidth = this.game.width;
        const gameHeight = this.game.height;

        // top edge
        if (this.topY < 0) {
            result.collision = true;
            result.overlap = -this.topY;
            result.overlap_y = -1;

            return true;
        }

        // bottom edge
        if (this.bottomY > gameHeight) {
            result.collision = true;
            result.overlap = this.bottomY - gameHeight;
            result.overlap_y = 1;

            return true;
        }

        // left edge
        if (this.leftX < 0) {
            result.collision = true;
            result.overlap = -this.leftX;
            result.overlap_x = -1;

            return true;
        }

        // right edge
        if (this.rightX > gameWidth) {
            result.collision = true;
            result.overlap = this.rightX - gameWidth;
            result.overlap_x = 1;

            return true;
        }

        return false;
    }

    touchTopEdge(): boolean {
        this.clearCollisionResult();

        if (this.hidden || this.stopped || this.deleted || !this.collider) {
            return false;
        }

        if (this.topY < 0) {
            this.collisionResult.collision = true;
            this.collisionResult.overlap = -this.topY;
            this.collisionResult.overlap_y = -1;

            return true;
        }

        return false;
    }

    touchBottomEdge(): boolean {
        this.clearCollisionResult();

        if (this.hidden || this.stopped || this.deleted || !this.collider) {
            return false;
        }

        if (this.bottomY > this.game.height) {
            this.collisionResult.collision = true;
            this.collisionResult.overlap = this.bottomY - this.game.height;
            this.collisionResult.overlap_y = 1;

            return true;
        }

        return false;
    }

    touchLeftEdge(): boolean {
        this.clearCollisionResult();

        if (this.hidden || this.stopped || this.deleted || !this.collider) {
            return false;
        }

        if (this.leftX < 0) {
            this.collisionResult.collision = true;
            this.collisionResult.overlap = -this.leftX;
            this.collisionResult.overlap_x = -1;

            return true;
        }

        return false;
    }

    touchRightEdge(): boolean {
        this.clearCollisionResult();

        if (this.hidden || this.stopped || this.deleted || !this.collider) {
            return false;
        }

        if (this.rightX > this.game.width) {
            this.collisionResult.collision = true;
            this.collisionResult.overlap = this.rightX - this.game.width;
            this.collisionResult.overlap_x = 1;

            return true;
        }

        return false;
    }

    get overlap() {
        if (!this.collisionResult.collision) {
            return 0;
        }

        return this.collisionResult.overlap;
    }

    get overlapX() {
        if (!this.collisionResult.collision) {
            return 0;
        }

        return this.collisionResult.overlap_x * this.collisionResult.overlap;
    }

    get overlapY() {
        if (!this.collisionResult.collision) {
            return 0;
        }

        return this.collisionResult.overlap_y * this.collisionResult.overlap;
    }

    get drawings(): DrawingCallbackFunction[] {
        return this._drawings;
    }

    clearCollisionResult(): void {
        this.collisionResult.collision = false;
        this.collisionResult.a = null;
        this.collisionResult.b = null;
        this.collisionResult.a_in_b = false;
        this.collisionResult.b_in_a = false;
        this.collisionResult.overlap = 0;
        this.collisionResult.overlap_x = 0;
        this.collisionResult.overlap_y = 0;
    }

    getPureCollisionResult(): CollisionResult {
        this.clearCollisionResult();

        return this.collisionResult;
    }

    touchMouse(): boolean {
        return this.touchMousePoint(this.game.getMousePoint());
    }

    touchMousePoint(mousePoint: PointCollider): boolean {
        if (this.hidden || this.stopped || this.deleted || !this.collider) {
            return false;
        }

        return this.collider.collides(mousePoint, this.collisionResult);
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
        clone.rotateStyle = this.rotateStyle;

        clone.x = this.x;
        clone.y = this.y;
        clone.xCenterOffset = this.xCenterOffset;
        clone.yCenterOffset = this.yCenterOffset;
        clone.direction = this.direction;
        clone.size = this.size;
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

        clone.cloneCollider(this)

        clone.ready();

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

    pen(callback: DrawingCallbackFunction): void {
        this._drawings.push(callback);
    }

    update(diffTime: number) {
        if (this.deleted) {
            return;
        }

        this.scheduledCallbacks = this.scheduledCallbacks.filter(
          this.scheduledCallbackExecutor.execute(Date.now(), diffTime)
        );
    }

    delete(): void {
        if (this.deleted) {
            return;
        }

        this.stage.removeSprite(this, this.layer);

        this.eventEmitter.clearAll();
        this.removeCollider();
        this.scheduledCallbackExecutor = null;

        let props = Object.keys(this);
        for (let i = 0; i < props.length; i++) {
            delete this[props[i]];
        }

        this.costumes = [];
        this.costumeNames = [];
        this.sounds = [];
        this.soundNames = [];
        this.onReadyCallbacks = [];
        this.scheduledCallbacks = [];

        this._deleted = true;
    }

    run(): void {
        this._stopped = false;
    }

    stop(): void {
        this._stopped = true;
    }

    getCollider(): Collider {
        return this.collider;
    }

    setCollider(collider: Collider): void {
        this.collider = collider;
        this.stage.collisionSystem.insert(this.collider);
    }

    removeCollider() {
        if (this.collider) {
            this.stage.collisionSystem.remove(this.collider);
            this.collider = null;
        }
    }

    setRectCollider(width: number, height: number) {
        let angle = 0;
        if (this.rotateStyle != 'leftRight') {
            angle = this.direction * 3.14 / 180; // to radian
        }

        this.collider = new PolygonCollider(this.x, this.y, [
            [(width / 2) * -1, (height / 2) * -1],
            [width / 2, (height / 2) * -1],
            [width / 2, height / 2],
            [(width / 2) * -1, height / 2]
        ], angle, this.size / 100, this.size / 100);
        this._width = width;
        this._height = height;

        this.stage.collisionSystem.insert(this.collider);
        this.updateColliderPosition()
    }

    setPolygonCollider(points: [number, number][] = []) {
        let angleRadians = 0;
        if (this.rotateStyle != 'leftRight') {
            angleRadians = this.angleRadians;
        }

        const centroid = this.calculateCentroid(points);

        const centeredPoints: [number, number][] = points.map(point => [
            point[0] - centroid.x,
            point[1] - centroid.y
        ]);

        this.collider = new PolygonCollider(this.x, this.y, centeredPoints, angleRadians, this.size / 100, this.size / 100);

        const { width, height } = this.calculatePolygonSize(centeredPoints);
        this._width = width;
        this._height = height;

        this.stage.collisionSystem.insert(this.collider);
        this.updateColliderPosition()
    }

    setCircleCollider(radius: number) {
        this.collider = new CircleCollider(this.x, this.y, radius, this.size / 100);
        this._width = radius * 2;
        this._height = radius * 2;

        this.stage.collisionSystem.insert(this.collider);
        this.updateColliderPosition()
    }

    getCostume(): Costume {
        return this.costume;
    }

    getCostumeName(): string {
        return this.costumeNames[this.costumeIndex];
    }

    getCostumeIndex(): string {
        return this.costumeIndex;
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

        if (this.collider instanceof PolygonCollider) {
            if (this.rotateStyle == 'leftRight') {
                this.collider.angle = 0; // to radian

            } else {
                this.collider.angle = this._direction * 3.14 / 180; // to radian
            }

        }

        if (this.collider) {
            this.updateColliderPosition();
        }

    }

    get direction(): number {
        return this._direction;
    }

    set colliderNone (colliderNone: boolean) {
        this._colliderNone = colliderNone;

        this.removeCollider();
    }

    get colliderNone(): boolean {
        return this._colliderNone;
    }

    get angleRadians(): number {
        return this._direction * Math.PI / 180;
    }

    get sourceWidth(): number {
        return this._width * this.size / 100;
    }

    get sourceHeight(): number {
        return this._height * this.size / 100;
    }

    get width(): number {
        const angleRadians = this.angleRadians;

        return Math.abs(this.sourceWidth * Math.cos(angleRadians)) + Math.abs(this.sourceHeight * Math.sin(angleRadians));
    }

    get height(): number {
        const angleRadians = this.angleRadians;

        return Math.abs(this.sourceWidth * Math.sin(angleRadians)) + Math.abs(this.sourceHeight * Math.cos(angleRadians));
    }

    set x(value: number) {
        this._x = value

        if (this.collider instanceof Collider) {
            this.updateColliderPosition();
        }
    }

    get x(): number {
        return this._x;
    }

    set y(value: number) {
        this._y = value;

        if (this.collider instanceof Collider) {
            this.updateColliderPosition();
        }
    }

    get y(): number {
        return this._y;
    }

    get sourceX() {
        if (this.rotateStyle === 'leftRight' || this.rotateStyle === 'none') {
            const leftRightMultiplier = this._direction > 180 && this.rotateStyle === 'leftRight' ? -1 : 1;
            return this._x - this._xCenterOffset * leftRightMultiplier;
        }
        return this._x + Math.cos(this._centerAngle - this.angleRadians) * this._centerDistance;
    }

    get sourceY() {
        if (this.rotateStyle === 'leftRight' || this.rotateStyle === 'none') {
            return this._y - this._yCenterOffset;
        }
        return this._y - Math.sin(this._centerAngle - this.angleRadians) * this._centerDistance;
    }

    get realX(): number {
        return this.x - this.width / 2;
    }

    get realY(): number {
        return this.y - this.height / 2;
    }

    get rightX(): number {
        return this.sourceX + this.width / 2;
    }

    get leftX(): number {
        return this.sourceX - this.width / 2;
    }

    get topY(): number {
        return this.sourceY - this.height / 2;
    }

    get bottomY(): number {
        return this.sourceY + this.height / 2;
    }

    set size(value: number) {
        this._size = value;

        if (this.collider instanceof PolygonCollider) {
            this.collider.scale_x = this._size / 100;
            this.collider.scale_y = this._size / 100;

        } else if (this.collider instanceof CircleCollider) {
            this.collider.scale = this._size / 100;
        }
    }

    get size(): number {
        return this._size;
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

    set xCenterOffset(value:number) {
        const prevX = this.x;
        this._xCenterOffset = value;
        this.calculateCenterParams()
        this.x = prevX;
    }

    get xCenterOffset() {
        return this._xCenterOffset;
    }

    set yCenterOffset(value:number) {
        const prevY = this.y;
        this._yCenterOffset = value;
        this.calculateCenterParams()
        this.y = prevY;
    }

    get yCenterOffset() {
        return this._yCenterOffset;
    }

    set layer(newLayer: number) {
        this.stage.changeSpriteLayer(this, this._layer, newLayer);
        this._layer = newLayer;
    }

    get layer(): number {
        return this._layer;
    }

    ready(): void {
        this.tryDoOnReady();
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
        if (this.onReadyPending && this.isReady()) {
            this.onReadyPending = false;

            if (this.onReadyCallbacks.length) {
                for (const callback of this.onReadyCallbacks) {
                    callback();
                }
                this.onReadyCallbacks = [];
            }

            if (!this.collider && !this.colliderNone && this.costumes.length) {
                this.createColliderFromCostume(this.costumes[0]);
            }

            this.stage.eventEmitter.emit(Game.SPRITE_READY_EVENT, {
                sprite: this,
                stageId: this.stage.id
            });
        }
    }

    private createColliderFromCostume(costume: Costume) {
        this.setRectCollider(
          costume.width + costume.colliderPaddingLeft + costume.colliderPaddingRight,
          costume.height + costume.colliderPaddingTop + costume.colliderPaddingBottom
        );
        this.updateColliderPosition();
    }

    private calculateCentroid(points: [number, number][]): { x: number; y: number } {
        let xSum = 0;
        let ySum = 0;

        for (const point of points) {
            xSum += point[0];
            ySum += point[1];
        }

        const x = xSum / points.length;
        const y = ySum / points.length;

        return { x, y };
    }

    private calculatePolygonSize(points: [number, number][]): { width: number; height: number } {
        let minX = points[0][0];
        let minY = points[0][1];
        let maxX = points[0][0];
        let maxY = points[0][1];

        for (const vertex of points) {
            if (vertex[0] < minX) minX = vertex[0];
            if (vertex[0] > maxX) maxX = vertex[0];
            if (vertex[1] < minY) minY = vertex[1];
            if (vertex[1] > maxY) maxY = vertex[1];
        }

        const width = maxX - minX;
        const height = maxY - minY;

        return {width, height};
    }

    private calculateCenterParams() {
        this._centerDistance = Math.hypot(this._xCenterOffset, this._yCenterOffset);
        this._centerAngle = -Math.atan2(-this._yCenterOffset , -this._xCenterOffset);
    }

    private updateColliderPosition() {
            this.collider.x = this.sourceX;
            this.collider.y = this.sourceY;
    }

    cloneCollider(sprite) {
        // if (!sprite.getCollider() && !sprite.colliderNone) {
            if (sprite.getCollider() instanceof CircleCollider) {
                this.setCircleCollider(sprite.getCollider().radius);
            }
            else {
                this.setPolygonCollider(sprite.getCollider().points);
            }
        // }
    }
}
