import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  createUser() {
    return 'hi'
  }

  updateUser(name: string) {
    return name
  }

  deleteUser() {
    return 'hi'
  }
}
