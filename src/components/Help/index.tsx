import React from 'react'
import { Profile } from '@stacks/profile'
import FAQs from '../FAQ'
import QuestionsWeb from './QuestionsWeb'
import QuestionsDevs from './QuestionsDevs'

interface IProps {
	user?: Profile
}

const Help: React.FC<IProps> = (props: IProps) => (
	<>
		<QuestionsWeb />
		<FAQs />
		<QuestionsDevs />
	</>
)

export default Help
