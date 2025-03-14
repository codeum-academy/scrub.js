class JetcodeSocket {
    static JOIN_LOBBY = 'JOIN_LOBBY';
    static LEAVE_LOBBY = 'LEAVE_LOBBY';
    static SEND_DATA = 'SEND_DATA';

    static JOINED = 'JOINED';
    static RECEIVE_DATA = 'RECEIVE_DATA';
    static MEMBER_JOINED = 'MEMBER_JOINED';
    static MEMBER_LEFT = 'MEMBER_LEFT';
    static GAME_STARTED = 'GAME_STARTED';
    static GAME_STOPPED = 'GAME_STOPPED';
    static ERROR = 'ERROR';

    private socketUrl: string;
    private socket: WebSocket;
    private defaultParameters: JetcodeSocketParameters;

    constructor(socketUrl = 'ws://localhost:17500') {
        this.socketUrl = socketUrl;
        this.socket = null;

        this.defaultParameters = {
            'LobbyAutoCreate': true,
            'MaxMembers': 2,
            'MinMembers': 2,
            'StartGameWithMembers' : 2
        }
    }

    connect(gameToken, lobbyId = null, inParameters = {}) {
        const parameters = { ...this.defaultParameters, ...inParameters};

        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(this.socketUrl);

            this.socket.onopen = () => {
                const connection = new JetcodeSocketConnection(
                    this.socket,
                    gameToken,
                    lobbyId
                );

                connection.joinLobby(gameToken, lobbyId, parameters)
                    .then(() => {
                        resolve(connection);
                    })
                    .catch(reject);
            };

            this.socket.onerror = (error) => {
                reject(error);
            };
        });
    }
}
