class JetcodeSocketConnection {
    socket: WebSocket;
    lobbyId: string|number;
    memberId: string;
    deltaTime: number;

    private connects: {};
    private connectActions = [
        JetcodeSocket.JOINED,
        JetcodeSocket.RECEIVE_DATA,
        JetcodeSocket.MEMBER_JOINED,
        JetcodeSocket.MEMBER_LEFT,
        JetcodeSocket.GAME_STARTED,
        JetcodeSocket.GAME_STOPPED,
        JetcodeSocket.ERROR
    ];

    constructor(socket: WebSocket, gameToken, lobbyId = 0) {
        this.socket = socket;
        this.lobbyId = lobbyId;
        this.memberId = null;
        this.connects = {};

        this._listenSocket();
    }

    _listenSocket() {
        this.socket.onmessage = (event) => {
            const [action, parameters, value] = this._parse(event.data)

            if (action === JetcodeSocket.RECEIVE_DATA) {
                this.emit(JetcodeSocket.RECEIVE_DATA, [value, parameters, parameters?.MemberId === this.memberId]);

            } else if (action === JetcodeSocket.MEMBER_JOINED) {
                this.emit(JetcodeSocket.MEMBER_JOINED, [parameters, parameters?.MemberId === this.memberId]);

            } else if (action === JetcodeSocket.MEMBER_LEFT) {
                this.emit(JetcodeSocket.MEMBER_LEFT, [parameters, parameters?.MemberId === this.memberId]);

            } else if (this.connects[action]) {
                this.emit(action, [parameters]);
            }
        }
    }

    emit(action: string, args: any[]): void {
        if (this.connects[action]) {
            this.connects[action].forEach(callback => {
                callback(...args);
            });
        }
    }

    connect(action, callback): CallableFunction {
        if (!this.connectActions.includes(action)) {
            throw new Error('This actions is not defined.');
        }

        if (!this.connects[action]) {
            this.connects[action] = [];
        }

        this.connects[action].push(callback);

        return callback;
    }

    disconnect(action: string, callback: Function): void {
        if (!this.connectActions.includes(action)) {
            throw new Error('This action is not defined.');
        }

        if (!this.connects[action]) {
            return;
        }

        this.connects[action] = this.connects[action].filter(cb => cb !== callback);
    }

    sendData(value, parameters={}) {
        if (!this.lobbyId) {
            throw new Error('You are not in the lobby!');
        }

        let request = `${JetcodeSocket.SEND_DATA}\n`;

        for (const [key, value] of Object.entries(parameters)) {
            request += key + '=' + value + '\n';
        }

        request += `SendTime=${Date.now()}\n`;
        request += '\n' + value;

        this.socket.send(request);
    }

    joinLobby(gameToken, lobbyId, parameters = {}) {
        return new Promise((resolve, reject) => {
            if (!lobbyId) {
                lobbyId = 0;
            }

            let request = `${JetcodeSocket.JOIN_LOBBY}\n`;
            request += `GameToken=${gameToken}\n`;
            request += `LobbyId=${lobbyId}\n`;

            for (const [key, value] of Object.entries(parameters)) {
                request += `${key}=${value}\n`;
            }

            this.socket.send(request);

            this.connect(JetcodeSocket.JOINED, (responseParams) => {
                if (responseParams.LobbyId && responseParams.MemberId && responseParams.CurrentTime) {
                    this.lobbyId = responseParams.LobbyId;
                    this.memberId = responseParams.MemberId;

                    let currentTimeMs = Date.now();
                    this.deltaTime = currentTimeMs - Number(responseParams.CurrentTime);

                    resolve(this.lobbyId);

                } else {
                    reject(new Error("Couldn't join the lobby"));
                }
            });
        });
    }

    leaveLobby() {
        if (!this.lobbyId) {
            return;
        }

        let request = `${JetcodeSocket.LEAVE_LOBBY}\nLobbyId=${this.lobbyId}\n`;
        this.socket.send(request);

        this.lobbyId = null;
    }

    _parse(data) {
        let parsable = data.split('\n');
        let action = parsable[0];
        let value = '';
        let parameters = [];

        let nextIs = 'parameters';
        for (let i = 1; i < parsable.length; i++) {
            const line = parsable[i];

            if (line === '' && nextIs === 'parameters') {
                nextIs = 'value';

            } else if (nextIs === 'parameters') {
                const splitted = line.split('=');

                const parameter = splitted[0];
                parameters[parameter] = splitted.length > 1 ? splitted[1] : null;

            } else if (nextIs === 'value') {
                value = value + line + "\n";
            }
        }

        if (value) {
            value = value.slice(0, -1);
        }

        return [action, parameters, value];
    }
}
