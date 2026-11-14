import { useApi } from '@/src/client/context/ApiContext';
import type { TranslationFunction } from '@/src/shared/types/i18n';


export function useI18n () : TranslationFunction {
  return useApi().t;
}
