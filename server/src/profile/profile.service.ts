import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfileService {

  getProfile() {
    return { name: 'jack'}
  }
}
