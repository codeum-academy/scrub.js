/// <reference path="./Sprite.ts" />

class MultiplayerGame extends Game {
  connection: any;

  private autoSyncGameTimeout: number = 0;
  private onConnectionCallback: (connection: JetcodeSocketConnection) => void;
  private onReceiveCallback: (data: any, parameters: any, isMe: boolean) => void;
  private onMemberJoinedCallback: (parameters: any, isMe: boolean) => void;
  private onMemberLeftCallback: (parameters: any, isMe: boolean) => void;
  private onGameStartedCallback: (players: Player[], parameters: any) => void;
  private onGameStoppedCallback: (parameters: any) => void;
  private onMultiplayerErrorCallback: (parameters: any) => void;
  private players: Player[] = [];
  private sharedObjects: SharedData[] = [];
  private isHost: boolean;

  constructor(
    socketUrl: string,
    gameToken: string,
    width: number,
    height: number,
    canvasId: string = null,
    lobbyId: string | number = 0,
    autoSyncGame: number = 0,
    multiplayerOptions: any = {}
  ) {
    super(width, height, canvasId);

    this.autoSyncGameTimeout = autoSyncGame;

    this.initializeConnection(socketUrl, gameToken, lobbyId, multiplayerOptions);
  }

  send(userData: any, parameters: any = {}, syncPackName: string, syncData: SyncObjectInterface[] = []): void {
    if (!this.connection) {
      throw new Error('Connection to the server is not established.');
    }

    const data = {
      'data': userData,
      'sync': this.packSyncData(syncPackName, syncData)
    }

    this.connection.sendData(JSON.stringify(data), parameters);
  }

  sync(syncPackName: string, syncData: SyncObjectInterface[] = [], parameters: any = {}): void {
    if (!syncData.length) {
      return;
    }

    parameters.SyncGame = 'true';
    const data = this.packSyncData(syncPackName, syncData);

    this.sendData(JSON.stringify(data), parameters);
  }

  syncGame() {
    const syncObjects = this.getSyncObjects();
    const syncData = this.packSyncData('game', syncObjects);

    this.sendData(JSON.stringify(syncData), {
      SyncGame: "true"
    });
  }

  onConnection(callback): void {
    this.onConnectionCallback = callback;
  }

  removeConnectionHandler(callback): void {
    this.onConnectionCallback = null;
  }

  onReceive(callback): void {
    this.onReceiveCallback = callback;
  }

  removeReceiveHandler(callback): void {
    this.onReceiveCallback = null;
  }

  onMemberJoined(callback): void {
    this.onMemberJoinedCallback = callback;
  }

  removeMemberJoinedHandler(callback): void {
    this.onMemberJoinedCallback = null;
  }

  onMemberLeft(callback): void {
    this.onMemberLeftCallback = callback;
  }

  removeMemberLeftHandler(callback): void {
    this.onMemberLeftCallback = null;
  }

  onGameStarted(callback): void {
    this.onGameStartedCallback = callback;
  }

  removeGameStartedHandler(callback): void {
    this.onGameStartedCallback = null;
  }

  onGameStopped(callback): void {
    this.onGameStoppedCallback = callback;
  }

  removeGameStoppedHandler(callback): void {
    this.onGameStoppedCallback = null;
  }

  onMultiplayerError(callback): void {
    this.onMultiplayerErrorCallback = callback;
  }

  removeMultiplayerErrorHandler(callback): void {
    this.onMultiplayerErrorCallback = null;
  }

  run() {
    super.run();

    if (this.isHost && this.autoSyncGameTimeout) {
      this.autoSyncGame(this.autoSyncGameTimeout);
    }
  }

  stop(): void {
    super.stop();

    for (const player of this.players) {
      player.delete();
    }

    this.players = [];
  }

  getPlayers(): Player[] {
    return this.players;
  }

  addSharedObject(sharedObject: SharedData): void {
    this.sharedObjects.push(sharedObject);
  }

  removeSharedObject(sharedObject: SharedData): void {
    const index = this.sharedObjects.indexOf(sharedObject);

    if (index > -1) {
      this.sharedObjects.splice(index, 1);
    }
  }

  getSharedObjects(): SharedData[] {
    return this.sharedObjects;
  }

  getMultiplayerSprites(): MultiplayerSprite[] {
    if (!this.getActiveStage()) {
      return [];
    }

    return this.getActiveStage().getSprites().filter((sprite) => {
      return sprite instanceof MultiplayerSprite;
    }) as MultiplayerSprite[];
  }

  getSyncObjects(): SyncObjectInterface[] {
    const multiplayerSprites = this.getMultiplayerSprites();
    const players = this.getPlayers();
    const sharedObjects = this.getSharedObjects();

    return [...multiplayerSprites, ...players, ...sharedObjects];
  }

  syncObjects(syncData: any, deltaTime: number) {
    const gameAllSyncObjects = this.getSyncObjects();

    for (const [syncPackName, syncObjectsData] of Object.entries(syncData)) {
      for (const syncObject of gameAllSyncObjects) {
        if (syncObjectsData[syncObject.getMultiplayerName()]) {
          const syncPackData = syncObjectsData[syncObject.getMultiplayerName()];
          syncObject.setSyncData(syncPackName, syncPackData, deltaTime);
        }
      }
    }
  }

  packSyncData(packName: string, syncObjects: SyncObjectInterface[]): any{
    const syncObjectsData = {};

    for (const syncObject of syncObjects) {
      syncObjectsData[syncObject.getMultiplayerName()] = syncObject.getSyncData();
      syncObjectsData[syncObject.getMultiplayerName()]['syncId'] = syncObject.increaseSyncId();
    }

    const result = {};
    result[packName] = syncObjectsData;

    return result;
  }

  private sendData(data: any, parameters: any = {}): void {
    if (!this.connection) {
      throw new Error('Connection to the server is not established.');
    }

    this.connection.sendData(data, parameters);
  }

  calcDeltaTime(sendTime: number): number {
    return Date.now() - sendTime - this.connection.deltaTime;
  }

  extrapolate(callback: CallableFunction, deltaTime: number, timeout: number): void {
    const times = Math.round((deltaTime / timeout) * 0.75);

    for (let i = 0; i < times; i++) {
      callback();
    }
  }

  private async initializeConnection(socketUrl: string, gameToken: string, lobbyId: string | number, multiplayerOptions: any = {}) {
    const socket = new JetcodeSocket(socketUrl);

    try {
      this.connection = await socket.connect(gameToken, lobbyId, multiplayerOptions);

      if (this.onConnectionCallback) {
        this.onConnectionCallback(this.connection);
      }

      this.connection.connect(JetcodeSocket.RECEIVE_DATA, (data: any, parameters: any, isMe: boolean) => {
        if (!data || !this.running || !parameters.SendTime) {
          return;
        }

        if (parameters.SyncGame === "true") {
          const syncObjectsData = JSON.parse(data);
          this.syncObjects(syncObjectsData, this.calcDeltaTime(parameters.SendTime));

        } else if (parameters.Keydown !== "true" && parameters.Mousedown !== "true" && this.onReceiveCallback) {
          data = JSON.parse(data);

          const userData = data['userData'];
          const syncSpritesData = data['sync'];

          this.syncObjects(syncSpritesData, this.calcDeltaTime(parameters.SendTime));

          this.onReceiveCallback(userData, parameters, isMe);
        }
      });

      this.connection.connect(JetcodeSocket.MEMBER_JOINED, (parameters: any, isMe: boolean) => {
        if (this.onMemberJoinedCallback) {
          this.onMemberJoinedCallback(parameters, isMe);
        }
      });

      this.connection.connect(JetcodeSocket.MEMBER_LEFT, (parameters: any, isMe: boolean) => {
        if (this.onMemberLeftCallback) {
          this.onMemberLeftCallback(parameters, isMe);
        }
      });

      this.connection.connect(JetcodeSocket.GAME_STARTED, (parameters: any) => {
        const hostId = parameters.HostId;
        const playerIds = parameters.Members?.split(',') ?? [];

        this.players = playerIds.map((playerId) => {
          return new Player(playerId, playerId === this.connection.memberId, this);
        });

        this.isHost = hostId === this.connection.memberId;

        if (this.onGameStartedCallback) {
          this.onGameStartedCallback(this.players, parameters);
        }

        // if (this.isHost) {
        //   this.syncGame();
        // }
      });

      this.connection.connect(JetcodeSocket.GAME_STOPPED, (parameters: any) => {
        if (this.onGameStoppedCallback) {
          this.onGameStoppedCallback(parameters);
        }
      });

      this.connection.connect(JetcodeSocket.ERROR, (parameters: any) => {
        if (this.onMultiplayerError) {
          this.onMultiplayerError(parameters);
        }
      });

    } catch (error) {
      console.error(error);
    }
  }

  private autoSyncGame(timeout: number) {
    const hander = () => {
      this.syncGame();
    };

    setInterval(hander, timeout);
  }
}
