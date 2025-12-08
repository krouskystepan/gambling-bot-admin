import { getModel } from '@/lib/utils'
import { TPrediction, PredictionSchema } from 'gambling-bot-shared'

export default getModel<TPrediction>('Prediction', PredictionSchema)
