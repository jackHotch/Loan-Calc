import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async createUser(data) {
    const result = await this.db.queryOne(`
      INSERT INTO users (clerk_id, first_name, last_name)
      VALUES ($1, $2, $3)
      RETURNING *;
      `, [
      data.id,
      data.first_name,
      data.last_name,
    ]);
    
    return result;
  }

  updateUser(name: string) {
    return name
  }

  deleteUser() {
    return 'hi'
  }
}
