import React from 'react'
import PropTypes from 'prop-types'
import {} from 'react-jdenticon'

// Components
import BlockstackSignInButton from './SignInButton'

const UserProfile = props => {
	const {
		isSignedIn,
		isConnecting,
		name,
		avatarUrl,
		message,
		identityAddress,
	} = props

	if (isSignedIn) {
		const image = avatarUrl ? (
			<img src={avatarUrl} alt={name} className="authUserProfile-Avatar" />
		) : (
			<svg width="20" height="20" data-jdenticon-value={identityAddress} />
		)

		return (
			<div className="authUserProfile-Root">
				<BlockstackSignInButton
					signIn={props.userSignIn}
					signOut={props.userSignOut}
					isSignedIn={props.isSignedIn}
					img={image}
					includeBlockstackLogo={false}
				/>
			</div>
		)
	}

	if (isConnecting) {
		return <div>{message}</div>
	}

	return (
		<div className="authUserProfile-Root">
			<BlockstackSignInButton
				signIn={props.userSignIn}
				signOut={props.userSignOut}
				isSignedIn={props.isSignedIn}
				includeBlockstackLogo={false}
			/>
		</div>
	)
}

UserProfile.propTypes = {
	isSignedIn: PropTypes.bool,
	isConnecting: PropTypes.bool,
	name: PropTypes.string,
	avatarUrl: PropTypes.string,
	identityAddress: PropTypes.string,
	message: PropTypes.string,
	userSignIn: PropTypes.func,
	userSignOut: PropTypes.func,
}

export default UserProfile
