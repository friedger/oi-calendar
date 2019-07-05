import React, { Component } from 'react'

class Arkane extends Component {
	state = {
		donateTo: 'friedger@gmail.com',
		donateValue: 1,
	}

	componentDidMount() {
		this.loadWallets(this.props)
	}

	componentWillReceiveProps(nextProps) {
		this.loadWallets(nextProps)
	}

	async loadWallets(props) {
		console.log('loadWallets')
		try {
			const wallets = await props.arkaneConnect.api.getWallets()
			console.log('wallets', wallets)
			if (wallets.length > 0) {
				const walletsOptions = []
				wallets.forEach(wallet => {
					walletsOptions.push(
						<option value={wallet.id}>
							{wallet.secretType} - {wallet.address}
						</option>
					)
				})

				this.setState({ walletsOptions, wallets })
			} else {
				props.arkaneConnect.manageWallets('ETHEREUM')
			}
		} catch (err) {
			console.error(
				"Something went wrong while fetching the user's wallets",
				err
			)
		}
	}

	async authenticate() {
		console.log(this.props)
		this.props.arkaneConnect.authenticate().then(authenticationResult => {
			authenticationResult
				.authenticated(auth => {
					console.log(
						'This user is authenticated',
						auth,
						auth.idTokenParsed.name
					)
				})
				.notAuthenticated(auth => {
					console.log('This user is not authenticated', auth)
				})
		})
	}

	async donate(e) {
		e.preventDefault()

		const signer = this.props.arkaneConnect.createSigner()
		console.log('donate wallets', this.state.wallets)
		try {
			const t = {
				walletId: this.state.wallet.id,
				to: this.state.donateTo,
				value: this.state.donateValue,
				secretType: this.state.wallet.balance.secretType,
			}
			console.log(t)
			const transactionResult = await signer.executeTransaction(t)
			console.log(transactionResult.result.transactionHash)
		} catch (reason) {
			console.error(reason)
		}
	}

	async onWalletChange(event) {
		console.log('onWalletChange', event, event.target.value, this.state.wallets)
		event.preventDefault()
		if (event.target.value) {
			const wallets = this.state.wallets
			const wallet = wallets.filter(w => w.id === event.target.value)[0]
			console.log(
				wallet.address,
				wallet.balance.balance,
				wallet.balance.symbol,
				wallet.balance.gasBalance,
				wallet.balance.gasSymbol
			)

			const tokenBalances = await this.props.arkaneConnect.api.getTokenBalances(
				wallet.id
			)
			console.log(tokenBalances)
			const tokenValueArray = tokenBalances.map(tokenBalance => (
				<>
					{tokenBalance.balance} {tokenBalance.symbol}
					<br />
				</>
			))
			this.setState({ tokenValueArray, wallet })
		}
	}

	onAmountChange(event) {
		event.preventDefault()
		console.log(event.target.value)
		this.setState({ donateValue: event.target.value })
	}

	render() {
		const props = this.props
		const { tokenValueArray, wallet, donateValue } = this.state
		const enableDonate = !!wallet
		var btn
		console.log('in Arkane', props.auth)
		if (!props.auth) {
			btn = <button onClick={e => this.authenticate()}>Login</button>
		} else {
			btn = (
				<button onClick={e => props.arkaneConnect.logout()}>
					Logout {props.auth.idTokenParsed.name}
				</button>
			)
		}
		return (
			<>
				{btn}
				<form id="transaction-form" onSubmit={e => this.donate(e)}>
					<div id="wallets">
						<h1>Wallets</h1>

						<div id="wallets-manage">
							<a
								id="manage-eth-wallets"
								className="btn"
								onClick={() => props.arkaneConnect.manageWallets('ETHEREUM')}
							>
								<span>Manage Ethereum Wallets</span>
							</a>
							<a
								id="manage-vechain-wallets"
								className="btn"
								onClick={() => props.arkaneConnect.manageWallets('VECHAIN')}
							>
								<span>Manage VeChain Wallets</span>
							</a>
						</div>

						<select
							id="wallets-select"
							name="from"
							onChange={e => this.onWalletChange(e)}
						>
							<option value="">Please select a wallet</option>
							{this.state.walletsOptions}
						</select>

						<div id="selected-wallet" className="hidden">
							<div id="wallet-details">
								<h2>Details</h2>
								<table>
									<tr>
										<td>Address</td>
										<td id="wallet-address">{wallet && wallet.address}</td>
									</tr>
									<tr>
										<td>Balance</td>
										<td id="wallet-balance">
											{wallet && (
												<>
													{wallet.balance.balance} {wallet.balance.symbol}
												</>
											)}
										</td>
									</tr>
									<tr>
										<td>Gas Balance</td>
										<td id="wallet-gas-balance">
											{wallet && (
												<>
													{wallet.balance.gasBalance} {wallet.balance.gasSymbol}
												</>
											)}
										</td>
									</tr>
									<tr>
										<td>Tokens</td>
										<td id="wallet-tokens">{tokenValueArray}</td>
									</tr>
								</table>
							</div>

							<div id="transaction">
								<label htmlFor="transaction-amount">Amount:</label>
								<input
									type="text"
									id="transaction-amount"
									name="amount"
									value={donateValue}
									onChange={e => this.onAmountChange(e)}
								/>
								<input type="submit" value="Donate" disabled={!enableDonate} />
							</div>
						</div>
					</div>
				</form>
			</>
		)
	}
}

export default Arkane
