import { Person } from '@/src/server/model/Person';
import type { PersonCreateData, PersonUpdateData } from '@/src/shared/types/person';
import { Router } from 'express';


export const persons = Router();
