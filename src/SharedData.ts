class SharedData implements SyncObjectInterface {
  private multiplayerName: string;
  private syncId: number;
  private syncCallback: CallableFunction;

  constructor(multiplayerName: string) {
    this.multiplayerName = 'data_' + multiplayerName;
    this.syncId = 1;

    if (!Registry.getInstance().has('game')) {
      throw new Error('You need create Game instance before Sprite instance.');
    }

    const game = Registry.getInstance().get('game');
    game.addSharedObject(this);
  }

  generateUniqueId(): string {
    return Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
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
      data[key] = this[key];
    }

    return data;
  }

  setSyncData(packName: string, data: any, deltaTime: number) {
    const oldData = {};

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
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
