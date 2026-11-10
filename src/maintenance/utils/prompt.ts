import { ui } from '@/src/maintenance/utils/ui';
import { createInterface } from 'node:readline/promises';


const assertInteractive = () : void => {
  if ( ! process.stdin.isTTY || ! process.stdout.isTTY ) throw new Error( 'Interactive input requires a terminal' );
};
