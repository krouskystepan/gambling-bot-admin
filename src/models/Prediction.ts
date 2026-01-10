import { PredictionSchema, TPrediction } from 'gambling-bot-shared'

import { getModel } from '@/lib/db'

export default getModel<TPrediction>('Prediction', PredictionSchema)
