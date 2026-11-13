import { getToken, requireAuth } from '@/src/server/api/middleware';
import { Auth } from '@/src/server/core/Auth';
import { Config } from '@/src/server/core/Config';
import { User } from '@/src/server/core/User';
import { Router } from 'express';


export const auth = Router();
