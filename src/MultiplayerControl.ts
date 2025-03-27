/// <reference path="./utils/KeyboardMap.ts" />

class MultiplayerControl {
    private game: MultiplayerGame;
    private connection: JetcodeSocketConnection;
    private trackedKeys = [];
    private receiveDataConnections: CallableFunction[] = [];
    private keydownCallback: (event: KeyboardEvent) => void;
    private mousedownCallback: (event: MouseEvent) => void;
    private userKeydownCallbacks = new Map<string, [CallableFunction, string, SyncObjectInterface[]]>();
    private systemLockedChars = {};
    private userLockedChars = {};
    private userMousedownCallback: [CallableFunction, string, SyncObjectInterface[]];
    private systemMouseLocked: boolean = false;
    private userMouseLocked: boolean = false;

    constructor(player: Player, game: MultiplayerGame, connection: JetcodeSocketConnection, isMe: boolean) {
        this.game = game;
        this.connection = connection;

        if (isMe) {
            this.defineListeners();
        }

        const keydownConnection = connection.connect(JetcodeSocket.RECEIVE_DATA, (dataJson: any, parameters) => {
            const data = JSON.parse(dataJson);
            const char = data['char'];

            if (!parameters.SendTime || parameters.Keydown != 'true' || parameters.MemberId != player.id || !this.trackedKeys.includes(char)) {
                return;
            }

            if (this.userKeydownCallbacks.has(char)) {
                const callback = this.userKeydownCallbacks.get(char)[0];

                const block = (isBlock: boolean, chars = [char], mouse = false) => {
                    if (mouse) {
                        this.userMouseLocked = isBlock;
                    }

                    for (const char of chars) {
                        this.userLockedChars[char.toUpperCase()] = isBlock;
                    }
                };

                let attempts = 0;
                const handler = () => {
                    if (this.userLockedChars[char] !== true || attempts > 999) {
                        const syncData = data['sync'];
                        if (syncData) {
                            game.syncObjects(syncData, this.game.calcDeltaTime(parameters.SendTime));
                        }

                        callback(player, block);

                    } else {
                        attempts++;
                        setTimeout(handler, 50);
                    }
                };

                handler();
            }

            this.systemLockedChars[char] = false;
        });
        this.receiveDataConnections.push(keydownConnection);

        const mousedownConnection = connection.connect(JetcodeSocket.RECEIVE_DATA, (dataJson: any, parameters) => {
            if (!parameters.SendTime || parameters.Mousedown != 'true' || parameters.MemberId != player.id) {
                return;
            }

            if (this.userMousedownCallback) {
                const callback = this.userMousedownCallback[0];
                const data = JSON.parse(dataJson);
                const mouseX = data['mouseX'];
                const mouseY = data['mouseY'];
                const syncData = data['sync'];

                const block = (isBlock: boolean, chars = [], mouse = true) => {
                    if (mouse) {
                        this.userMouseLocked = isBlock;
                    }

                    for (const char of chars) {
                        this.userLockedChars[char.toUpperCase()] = isBlock;
                    }
                };

                let attempts = 0;
                const handler = () => {
                    if (this.userMouseLocked !== true || attempts > 999) {
                        if (syncData) {
                            game.syncObjects(syncData, this.game.calcDeltaTime(parameters.SendTime));
                        }

                        const mousePoint = new PointCollider(mouseX, mouseY);
                        callback(mousePoint, player, block);

                    } else {
                        attempts++;
                        setTimeout(handler, 50);
                    }
                };

                handler();
            }

            this.systemMouseLocked = false;
        });
        this.receiveDataConnections.push(mousedownConnection);
    }

    private defineListeners() {
        this.keydownCallback = (event: KeyboardEvent) => {
            const char = KeyboardMap.getChar(event.keyCode);

            if (
              !this.userKeydownCallbacks.has(char) ||
              this.systemLockedChars[char] === true ||
              this.userLockedChars[char] === true ||
              !this.trackedKeys.includes(char)
            ) {
                return;
            }

            this.systemLockedChars[char] = true;

            const syncPackName = this.userKeydownCallbacks.get(char)[1];
            const syncData = this.userKeydownCallbacks.get(char)[2];
            const syncDataPacked = this.game.packSyncData(syncPackName, syncData);

            this.connection.sendData(JSON.stringify({
                'char': char,
                'sync': syncDataPacked
            }), {
                Keydown: 'true'
            });
        };

        this.mousedownCallback = (event: MouseEvent) => {
            if (!this.userMousedownCallback || this.systemMouseLocked || this.userMouseLocked) {
                return;
            }

            const mouseX = this.game.correctMouseX(event.clientX);
            const mouseY = this.game.correctMouseY(event.clientY);

            if (!this.game.isInsideGame(mouseX, mouseY)) {
                return;
            }

            this.systemMouseLocked = true;

            const syncPackName = this.userMousedownCallback[1];
            const syncData = this.userMousedownCallback[2];
            const syncDataPacked = this.game.packSyncData(syncPackName, syncData);

            this.connection.sendData(JSON.stringify({
                'mouseX': mouseX,
                'mouseY': mouseY,
                'sync': syncDataPacked
            }), {
                Mousedown: 'true'
            });
        };

        document.addEventListener('keydown', this.keydownCallback);
        document.addEventListener('mousedown', this.mousedownCallback);
    }

    stop() {
        if (this.keydownCallback) {
            document.removeEventListener('keydown', this.keydownCallback);
        }

        for (const connection of this.receiveDataConnections) {
            this.connection.disconnect(JetcodeSocket.RECEIVE_DATA, connection);
        }
    }

    keyDown(char: string, callback, syncPackName: string, syncData: SyncObjectInterface[] = []) {
        char = char.toUpperCase();

        if (!this.trackedKeys.includes(char)) {
            this.trackedKeys.push(char);
        }

        this.userKeydownCallbacks.set(char, [callback, syncPackName, syncData]);
    }

    removeKeyDownHandler(char) {
        char = char.toUpperCase();

        this.userKeydownCallbacks.delete(char);
    }

    mouseDown(callback: CallableFunction, syncPackName: string, syncData: SyncObjectInterface[] = []): void {
        this.userMousedownCallback = [callback, syncPackName, syncData];
    }

    removeMouseDownHandler() {
        this.userMousedownCallback = null;
    }
}
