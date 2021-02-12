import { connect } from 'react-redux'

// Components
import AppMenu from '../components/AppMenu'

const mapStateToProps = state => {
  const { events, auth } = state
  const { user } = auth
  let username = null
  let signedIn = false

  if (user) {
    username = user.username
    signedIn = true
  }

  let page = events.showPage
  if (!page) {
    page = 'all'
  }

  return { username, signedIn, page }
}

const AppMenuContainer = connect(mapStateToProps, null)(AppMenu)

export default AppMenuContainer
