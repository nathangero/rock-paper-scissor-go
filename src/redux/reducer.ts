export const USER_ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
}


const initialState = {
  user: null,
}

export const reducer = (state = initialState, action: any) => {
  switch (action.type) {
    case USER_ACTIONS.LOGIN:
      console.log("@user login");
      console.log("action.user:", action.user);
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