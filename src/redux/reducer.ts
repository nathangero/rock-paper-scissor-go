export const USER_ACTIONS = {
  LOGIN: "LOGIN",
  SIGNUP: "SIGNUP",
  LOGOUT: "LOGOUT",
}


const initialState = {
  user: null,
}

export const reducer = (state = initialState, action: any) => {
  switch (action.type) {
    case USER_ACTIONS.LOGIN:
      return {
        ...state,
        user: action.user
      }

    case USER_ACTIONS.SIGNUP:
      console.log("@user signup");
      return {
        ...state,
        user: action.user
      }

    case USER_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null
      }

    default:
      return state;
  }
}