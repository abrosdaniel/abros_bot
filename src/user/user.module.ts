import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { AppwriteModule } from '../appwrite/appwrite.module';

@Module({
  imports: [AppwriteModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
