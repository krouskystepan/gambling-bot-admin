'server-only'

import { type TPrediction } from 'gambling-bot-shared'
import { PredictionSchema } from 'gambling-bot-shared/server'

import { getModel } from '@/lib/db'

export default getModel<TPrediction>('Prediction', PredictionSchema)
