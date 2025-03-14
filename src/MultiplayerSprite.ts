/// <reference path="./Sprite.ts" />

class MultiplayerSprite extends Sprite implements SyncObjectInterface {
  private multiplayerName: string;
  private syncId: number;
  private reservedProps: string[];
  private syncCallback: CallableFunction;

  constructor(multiplayerName: string, stage: Stage = null, layer = 1, costumePaths = [], soundPaths = []) {
    super(stage, layer, costumePaths, soundPaths)

    this.multiplayerName = 'sprite_' + multiplayerName;
    this.syncId = 1;

    this.reservedProps = Object.keys(this);
    this.reservedProps.push('body');
    this.reservedProps.push('reservedProps');
  }

  generateUniqueId(): string {
    return Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
  }

  getCustomerProperties() {
    const data = {};

    for (const key of Object.keys(this)) {
      if (this.reservedProps.includes(key)) {
        continue;
      }

      data[key] = this[key];
    }

    return data;
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
    return Object.assign({}, this.getCustomerProperties(), {
      size: this.size,
      rotateStyle: this.rotateStyle,
      costumeIndex: this.costumeIndex,
      deleted: this.deleted,
      x: this.x,
      y: this.y,
      direction: this.direction,
      hidden: this.hidden,
      stopped: this.stopped,
    });
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
