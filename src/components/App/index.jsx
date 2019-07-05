import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Route } from 'react-router-dom'

// Views
import Footer from '../Footer'
import Header from '../Header'

// Routes
import { routes } from '../../routes'

// Styles
import './App.css'
import { ConnectedRouter } from 'connected-react-router'
import { ArkaneConnect } from '@arkane-network/arkane-connect'
import Arkane from '../Arkane'

export class App extends Component {
	// componentDidMount() {
	//   import('./LazyLoaded').then(({ initializeLazy }) => {
	//     initializeLazy(store)
	//   })
	// }
	arkaneConnect
	state = {}
	constructor() {
		super()
		this.arkaneConnect = new ArkaneConnect('Arketype', {
			environment: 'staging',
		})
	}

	async componentWillMount() {
		this.props.initializeLazyActions()(this.props.dispatch)

		try {
			const authenticationResult = await this.arkaneConnect.checkAuthenticated()
			authenticationResult
				.authenticated(auth => {
					this.setState({ auth })
					console.log(
						'This user is authenticated',
						auth,
						auth.idTokenParsed.name
					)
				})
				.notAuthenticated(auth => {
					this.setState({ auth })
					console.log('This user is not authenticated', auth)
				})
		} catch (reason) {
			console.error(reason)
		}
	}

	render() {
		const { auth } = this.state
		return (
			<ConnectedRouter history={this.props.history}>
				<div className="App">
					<Header />
					<Arkane arkaneConnect={this.arkaneConnect} auth={auth} />
					{routes.map(route => (
						<Route key={route.path} {...route} />
					))}

					<Footer />
				</div>
			</ConnectedRouter>
		)
	}
}

App.propTypes = {
	history: PropTypes.object.isRequired,
}

export default App
