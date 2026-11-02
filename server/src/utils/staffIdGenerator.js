import { Counter } from '../models/Counter.js';
import { ROLES } from '../constants/roles.js';

export async function generateStaffId(role) {
  let prefix = 'STF';
  if (role === ROLES.OPERATOR) prefix = 'OP';
  else if (role === ROLES.ENGINEER) prefix = 'ENG';
  else if (role === ROLES.ADMIN) prefix = 'ADM';

  const counterKey = `staff_id_${prefix}`;
  const seq = await Counter.getNextSequence(counterKey);
  const paddedSeq = String(seq).padStart(4, '0');
  return `${prefix}-${paddedSeq}`;
}
