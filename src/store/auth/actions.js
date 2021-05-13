import { AUTH_SIGN_IN, AUTH_SIGN_OUT } from '../ActionTypes'
import { UserSession, AppConfig, showConnect } from '@stacks/connect'
import { authenticatedAction } from '../../store/event/eventActionLazy'
import { UserOwnedStorage } from '../../core/event'
export function redirectedToSignIn() {
  return { type: AUTH_SIGN_IN }
}

export function signUserIn(store) {
  return async (dispatch, getState) => {
    const userSession = new UserSession(
      new AppConfig(
        ['store_write'],
        `${window.location.origin}`,
        `${window.location}`,
        `${window.location.origin}/manifest.json`
      )
    )
    try {
      showConnect({
        userSession,
        appDetails: {
          name: 'OI Calendar',
          icon: 'https://cal.openintents.org/android-chrome-192x192.png',
        },
        onFinish: ({ userSession }) => {
          const userData = userSession.loadUserData()
          dispatch(
            authenticatedAction(
              userData,
              userSession,
              new UserOwnedStorage(userSession)
            )
          )
        },
      })
      dispatch(redirectedToSignIn())
    } catch (e) {
      console.error(e)
    }
  }
}

export function signUserOut() {
  const userSession = new UserSession(
    new AppConfig(
      ['store_write', 'publish_data'],
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
