import { connect } from "react-redux";
import { signUserIn, signUserOut } from "../../flow/store/auth/authAction";

export default connect(
  (state, redux) => {
    const user = state.auth.user;
    const profile = user != null ? state.auth.user.profile : null;
    return {
      isSignedIn: user != null,
      isConnecting: user == null && state.auth.userMessage === "Connecting",
      name: profile != null ? profile.name : null,
      avatarUrl:
        profile != null && "image" in profile && profile.image.length > 0
          ? profile.image[0].contentUrl
          : null,
      message: state.auth.userMessage
    };
  },
  dispatch => {
    return {
      userSignIn: () => dispatch(signUserIn()),
      userSignOut: () => dispatch(signUserOut())
    };
  }
);
