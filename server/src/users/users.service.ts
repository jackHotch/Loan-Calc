import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async getUser(data: { id: number }) {
    const result = await this.db.query(
      `
      SELECT id, clerk_id, first_name, last_name
      FROM users
      WHERE id = $1
      `,
      [data.id],
    );

    return result[0];
  }

  async getInternalUserId(userId: string) {
    const result = await this.db.query(
      `SELECT id FROM users WHERE clerk_id = $1`,
      [userId],
    );

    return result[0].id;
  }

  async createUser(data) {
    return await this.db.query(
      `
      INSERT INTO users (clerk_id, first_name, last_name)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [data.id, data.first_name, data.last_name],
    );
  }

  async updateUser(data) {
    console.log(data);
    return await this.db.query(
      `
      UPDATE users
      SET first_name = $1,
          last_name = $2
      WHERE clerk_id = $3
      RETURNING *`,
      [data.first_name, data.last_name, data.id],
    );
  }

  async deleteUser(data) {
    return await this.db.query(
      `DELETE FROM users
      WHERE clerk_id = $1`,
      [data.id],
    );
  }
}
