import express, { response } from 'express'

import ClassesController from './controllers/ClassesController';
import ConnectionsController from './controllers/ConnectionsController';

const routes = express.Router()
const classesController = new ClassesController()
const connectionsController = new ConnectionsController()



// Class Routes
routes.post('/classes', classesController.create)
routes.get('/classes', classesController.index)

// Connection Routes
routes.post('/connections', connectionsController.create)
routes.get('/connections', connectionsController.index)



export default routes;