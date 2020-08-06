import { Request, Response } from 'express' 
import db from '../database/connection'

// CONNECTIONS CONTROLLER
export default class ConnectionsController {

  // Shows Connections
  async index (req: Request, res: Response) {
    const totalConnections = await db('connections').count('* as total')

    const { total } = totalConnections[0]

    return res.json({ total })
  }

  // Create Connection
  async create (req: Request, res: Response) {
    const { user_id } = req.body

    await db('Connections').insert({
      user_id
    })

    return res.status(201).send()
  }
}