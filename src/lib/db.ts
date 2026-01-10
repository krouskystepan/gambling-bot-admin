import mongoose, { Model, Schema, model, models } from 'mongoose'
import 'server-only'

export const connectToDatabase = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined')
  }

  if (mongoose.connection.readyState >= 1) return

  mongoose.set('strictQuery', false)
  await mongoose.connect(process.env.MONGO_URI)
}

export function getModel<T>(
  name: string,
  schema: Schema<T> | Model<T>
): Model<T> {
  return (models[name] as Model<T>) || model<T>(name, schema as Schema<T>)
}
