import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async getUser(userId: BigInt) {
    const result = await this.db.query(
      `
      SELECT id, clerk_id, first_name, last_name, email
      FROM users
      WHERE id = $1
      `,
      [userId],
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
      INSERT INTO users (clerk_id, first_name, last_name, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [
        data.id,
        data.first_name,
        data.last_name,
        data.email_addresses[0].email_address,
      ],
    );
  }

  async updateUser(data) {
    return await this.db.query(
      `
      UPDATE users
      SET first_name = $1,
          last_name = $2,
          email = $3
      WHERE clerk_id = $4
      RETURNING *`,
      [
        data.first_name,
        data.last_name,
        data.email_addresses[0].email_address,
        data.id,
      ],
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
