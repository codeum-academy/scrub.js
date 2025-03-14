interface SyncObjectInterface {
  getSyncId(): number;
  increaseSyncId(): number;
  getMultiplayerName(): string;
  getSyncData(): any;
  setSyncData(packName: string, data: any, deltaTime: number): void;
  onSync(callback: CallableFunction): void;
  removeSyncHandler(): void;
  only(...properties): OrphanSharedData;
}
