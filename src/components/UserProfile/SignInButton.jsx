import React from 'react'
import PropTypes from 'prop-types'

const imageDefaultStyle = {
	height: 20,
	width: 20,
}
const textDefaultStyle = {
	fontSize: 12,
	fontFamily: '"Source Code Pro", monospace',
	paddingLeft: 5,
	verticalAlign: 'top',
	top: 3,
	position: 'relative',
	color: '#fff',
}

const BlockstackSignInButton = props => {
	const {
		renderNothing,
		signOutBtnText,
		signInBtnText,
		includeBlockstackLogo,
		signInStyle,
		signOutStyle,
		isSignedIn,
		imageStyle,
		textStyle,
		style,
		img,
	} = props

	let { defaultStyle } = props

	if (renderNothing) {
		return null
	}

	// If style isn't set then render default styling.
	if (!defaultStyle) {
		defaultStyle = {
			display: 'inline-block',
			backgroundColor: '#270F34',
			border: '1px solid #270F34',
			paddingTop: 5,
			paddingBottom: 5,
			paddingLeft: 15,
			paddingRight: 15,
			borderRadius: 2,
		}
	}

	const imageInlineStyle = Object.assign({}, imageDefaultStyle, imageStyle)
	let altImg = null
	if (img) {
		altImg = img
	}

	const image = includeBlockstackLogo ? (
		<img src="blockstack.png" alt="Blockstack Logo" style={imageInlineStyle} />
	) : (
		altImg
	)

	const textInlineStyle = Object.assign({}, textDefaultStyle, textStyle)

	const signOutInlineStyle = Object.assign(
		{},
		defaultStyle,
		style,
		signOutStyle
	)
	if (isSignedIn) {
		return (
			<button onClick={props.signOut} style={signOutInlineStyle}>
				{image}
				<span style={textInlineStyle}>{signOutBtnText}</span>
			</button>
		)
	}

	const signInInlineStyle = Object.assign({}, defaultStyle, style, signInStyle)
	return (
		<button onClick={props.signIn} style={signInInlineStyle}>
			{image}
			<span style={textInlineStyle}>{signInBtnText}</span>
		</button>
	)
}

BlockstackSignInButton.propTypes = {
	renderNothing: PropTypes.bool,
	signOutBtnText: PropTypes.string,
	signInBtnText: PropTypes.string,
	includeBlockstackLogo: PropTypes.bool,
	// eslint-disable-next-line react/forbid-prop-types
	style: PropTypes.object,
	// eslint-disable-next-line react/forbid-prop-types
	defaultStyle: PropTypes.object,
	// eslint-disable-next-line react/forbid-prop-types
	imageStyle: PropTypes.object,
	// eslint-disable-next-line react/forbid-prop-types
	textStyle: PropTypes.object,
	// eslint-disable-next-line react/forbid-prop-types
	signInStyle: PropTypes.object,
	// eslint-disable-next-line react/forbid-prop-types
	signOutStyle: PropTypes.object,
	isSignedIn: PropTypes.bool.isRequired,
	signOut: PropTypes.func.isRequired,
	signIn: PropTypes.func.isRequired,
	img: PropTypes.object,
}

BlockstackSignInButton.defaultProps = {
	renderNothing: false,
	signOutBtnText: 'Logout',
	signInBtnText: 'Use your own calendar',
	includeBlockstackLogo: true,
	defaultStyle: null,
	style: { padding: '8.5px' },
	signInStyle: {},
	signOutStyle: {},
	imageStyle: {},
	textStyle: {},
	img: null,
}

export default BlockstackSignInButton
