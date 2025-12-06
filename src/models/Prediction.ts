import { TPrediction, PredictionSchema } from 'gambling-bot-shared'
import { models, model } from 'mongoose'

export default models.Prediction ||
  model<TPrediction>('Prediction', PredictionSchema)
