class Player implements SyncObjectInterface {
  control: MultiplayerControl;
  id: string;

  private _isMe: boolean;
  private game: MultiplayerGame;
  private deleted = false;
  private reservedProps: string[];
  private multiplayerName: string;
  private syncId: number;
  private syncCallback: CallableFunction;

  constructor(id: string, isMe: boolean, game: MultiplayerGame) {
    this.id = id;
    this._isMe = isMe;
    this.game = game;
    this.multiplayerName = 'player_' + id;
    this.syncId = 1;

    this.control = new MultiplayerControl(this, this.game, game.connection, isMe);

    this.reservedProps = Object.keys(this);
    this.reservedProps.push('reservedProps');
  }

  keyDown(char: string, callback: CallableFunction, syncPackName: string, syncData: SyncObjectInterface[] = []): void {
    this.control.keyDown(char, callback, syncPackName, syncData);
  }

  removeKeyDownHandler(char) {
    this.control.removeKeyDownHandler(char);
  }

  mouseDown(callback: CallableFunction, syncPackName: string, syncData: SyncObjectInterface[] = []): void {
    this.control.mouseDown(callback, syncPackName, syncData);
  }

  removeMouseDownHandler() {
    this.control.removeMouseDownHandler();
  }

  isMe() {
    return this._isMe;
  }

  delete(): void {
    if (this.deleted) {
      return;
    }

    this.control.stop();

    let props = Object.keys(this);
    for (let i = 0; i < props.length; i++) {
      delete this[props[i]];
    }

    this.deleted = true;
  }

  repeat(i: number, callback: CallableFunction, timeout, finishCallback: CallableFunction) {
    if (this.deleted) {
      finishCallback();

      return;
    }

    if (i < 1) {
      finishCallback();

      return;
    }

    const result = callback(this);
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

    setTimeout(() => {
      requestAnimationFrame(() => this.repeat(i, callback, timeout, finishCallback));
    }, timeout);
  }

  forever(callback, timeout = null): void {
    if (this.deleted) {
      return;
    }

    const result = callback(this);
    if (result === false) {
      return;
    }

    if (result > 0) {
      timeout = result;
    }

    if (timeout) {
      setTimeout(() => {
        requestAnimationFrame(() => this.forever(callback, timeout));
      }, timeout);

    } else {
      requestAnimationFrame(() => this.forever(callback));
    }
  }

  timeout(callback, timeout: number): void {
    setTimeout(() => {
      if (this.deleted) {
        return;
      }

      requestAnimationFrame(() => callback(this));
    }, timeout);
  }

  getMultiplayerName(): string {
    return this.multiplayerName;
  }

  getSyncId(): number {
    return this.syncId;
  }

  increaseSyncId(): number {
    this.syncId++;

    return this.syncId;
  }

  getSyncData() {
    const data = {};

    for (const key of Object.keys(this)) {
      if (this.reservedProps.includes(key)) {
        continue;
      }

      data[key] = this[key];
    }

    return data;
  }

  setSyncData(packName: string, data: any, deltaTime: number) {
    const oldData = {};

    for (const key in data) {
      if (data.hasOwnProperty(key) && !this.reservedProps.includes(key)) {
        oldData[key] = this[key];

        this[key] = data[key];
      }
    }

    if (this.syncCallback) {
      this.syncCallback(this, packName, data, oldData, deltaTime);
    }
  }

  onSync(callback: CallableFunction): void {
    this.syncCallback = callback;
  }

  removeSyncHandler(): void {
    this.syncCallback = null;
  }

  only(...properties): OrphanSharedData {
    return new OrphanSharedData(this, properties);
  }
}
