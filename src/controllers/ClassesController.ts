import { Request, Response } from 'express'

import db from '../database/connection';
import convertHourToMinutes from '../utils/convertHourtoMinutes';

// Type Object of Schedule Item
interface ScheduleItem {
  week_day: number;
  from: string;
  to: string
}

// Classes Controller
export default class ClassesController {

  // ROUTE FOR SEARCHING CLASSES
  async index(req: Request, res: Response) {

    // Create query
    const filters = req.query

    // Declare query filter types
    const subject = filters.subject as string
    const week_day = filters.week_day as string
    const time = filters.time as string

    // If there is no filters, return error
    if (!filters.week_day || !filters.subject || !filters.time) {
      return res.status(400).json({
        error: 'Missing filters to search classes'
      })
    }


    const timeInMinutes = convertHourToMinutes(time)
    
    const classes = await db('classes')
      .whereExists(function() {
        this.select('class_schedule.*')
          .from('class_schedule')
          .whereRaw('`class_schedule`.`class_id` = `classes`.`id`')
          .whereRaw('`class_schedule`.`week_day` = ??', [Number(week_day)])
          .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
          .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])
      })
      .where('classes.subject', '=', subject)
      .join('users', 'classes.user_id', '=', 'users.id')
      .select(['classes.*', 'users.*'])

    return res.json(classes)

  }

  // ROUTE FOR CLASSES FORM
  async create(req: Request, res: Response) {

    // Destructuring Input Fields
    const {
      name,
      avatar,
      whatsapp,
      bio,
      subject,
      cost, 
      schedule
    } = req.body;
  
    // Create Transaction 
    // A way of creating every entity at the same time
    // If there's an error, they are all reversed
    const trx = await db.transaction();
  
    try {
      // Create User Entity
      const insertedUsersIds = await trx('users').insert({
        name,
        avatar,
        whatsapp,
        bio
      })
  
      const user_id = insertedUsersIds[0];
  
      // Create Class Entity
      const insertedClassesIds = await trx('classes').insert({
        subject,
        cost,
        user_id
      })
  
      const class_id = insertedClassesIds[0]
  
      // Create Schedule Entity
      // Convert input minutes
      const classSchedule = schedule.map( (scheduleItem: ScheduleItem) => {
        return {
          class_id,
          week_day: scheduleItem.week_day,
          from: convertHourToMinutes(scheduleItem.from),
          to: convertHourToMinutes(scheduleItem.to)
        }
      })
  
      await trx('class_schedule').insert(classSchedule)
  
      // Commit the transaction
      await trx.commit()
  
      return res.status(201).json({
        insertedUsersIds,
        insertedClassesIds,
        classSchedule
      })
  
    } catch (err){
      return res.status(400).json({
        error: 'Unexpected error while creating new class'
      })
    }
  
  }
}