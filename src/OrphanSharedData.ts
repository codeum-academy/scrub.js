class OrphanSharedData implements SyncObjectInterface {
  private parent: SyncObjectInterface;
  private properties: string[];

  constructor(parent: SyncObjectInterface, properties: string[]) {
    this.parent = parent;
    this.properties = properties;
  }

  getMultiplayerName(): string {
    return this.parent.getMultiplayerName();
  }

  getSyncId(): number {
    return this.parent.getSyncId();
  }

  increaseSyncId(): number {
    return this.parent.increaseSyncId();
  }

  getSyncData() {
    const syncData = {};
    for (const property of this.properties) {
      if (this.parent[property]) {
        syncData[property] = this.parent[property];
      }
    }

    return syncData;
  }

  setSyncData(packName: string, data: any, deltaTime: number) {
    this.parent.setSyncData(packName, data, deltaTime);
  }

  onSync(callback: CallableFunction) {
    throw new Error('Not implemented.')
  }

  removeSyncHandler() {
    throw new Error('Not implemented.')
  }

  only(...properties): OrphanSharedData {
    throw new Error('Not implemented.')
  }
}
