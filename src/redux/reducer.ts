export enum USER_ACTIONS {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  JOIN_LOBBY = "JOIN_LOBBY",
  LEAVE_LOBBY = "LEAVE_LOBBY",
}


const initialState = {
  user: null,
  lobby: null,
}

export const reducer = (state = initialState, action: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  switch (action.type) {
    case USER_ACTIONS.LOGIN:
      return {
        ...state,
        user: action.user,
      }

    case USER_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        lobby: null, // Just in case
      }

    case USER_ACTIONS.JOIN_LOBBY:
      return {
        ...state,
        lobby: action.lobby,
      }

    case USER_ACTIONS.LEAVE_LOBBY:
      return {
        ...state,
        lobby: null,
      }

    default:
      return state;
  }
}