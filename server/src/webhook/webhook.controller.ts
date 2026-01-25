// users/users.controller.ts
import { Controller, Post, Body, Headers } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { Webhook } from 'svix';

@Controller('webhook')
export class WebhookController {
  constructor(private usersService: UsersService) {}

  @Post('clerk')
  async handleClerkWebhook(
    @Body() payload: any,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    // Verify webhook signature
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    
    try {
      const event = webhook.verify(JSON.stringify(payload), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as any

      switch (event.type) {
        case 'user.updated':
          await this.usersService.updateUser(event.data.first_name)
      }
      // Handle different event types
      // switch (event.type) {
      //   case 'user.created':
      //     await this.usersService.createUser({
      //       id: event.data.id,
      //       email: event.data.email_addresses[0].email_address,
      //       first_name: event.data.first_name,
      //       last_name: event.data.last_name,
      //       image_url: event.data.image_url,
      //     });
      //     break;
        
      //   case 'user.updated':
      //     await this.usersService.updateUser(event.data.id, {
      //       email: event.data.email_addresses[0].email_address,
      //       first_name: event.data.first_name,
      //       last_name: event.data.last_name,
      //       image_url: event.data.image_url,
      //     });
      //     break;
        
      //   case 'user.deleted':
      //     await this.usersService.deleteUser(event.data.id);
      //     break;
      // }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}