import { AUTH_SIGN_IN, AUTH_SIGN_OUT } from '../ActionTypes'
import { UserSession } from 'blockstack'
import { AppConfig, makeAuthRequest } from 'blockstack/lib/auth'
import { Contact } from 'blockstack-collections'

export function redirectedToSignIn() {
  return { type: AUTH_SIGN_IN }
}

export function signUserIn(store) {
  return async (dispatch, getState) => {
    const scopes = ['store_write', Contact.scope]
    const userSession = new UserSession(
      new AppConfig(
        scopes,
        `${window.location.origin}`,
        `${window.location}`,
        `${window.location.origin}/manifest.json`
      )
    )

    try {
      const authRequest = makeAuthRequest(
        undefined,
        undefined,
        undefined,
        scopes,
        undefined,
        undefined,
        {
          solicitGaiaHubUrl: true,
          recommendedGaiaHubUrl: 'https://staging-hub.blockstack.xyz',
        }
      )

      userSession.redirectToSignInWithAuthRequest(authRequest)

      dispatch(redirectedToSignIn())
    } catch (e) {
      console.error(e)
    }
  }
}

export function signUserOut() {
  const userSession = new UserSession(
    new AppConfig(
      ['store_write', 'publish_data', Contact.scope],
      `${window.location.origin}`,
      `${window.location}`,
      `${window.location.origin}/manifest.json`
    )
  )
  try {
    userSession.signUserOut()
    return { type: AUTH_SIGN_OUT }
  } catch (e) {
    console.error(e)
  }
}
