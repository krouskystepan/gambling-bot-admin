'server-only'

import { PredictionSchema } from 'gambling-bot-shared/mongoose'
import { type TPrediction } from 'gambling-bot-shared/predictions'

import { getModel } from '@/lib/db'

export default getModel<TPrediction>('Prediction', PredictionSchema)
